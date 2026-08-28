import os
import asyncio
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from ..config import settings
from ..models import EvaluationResult
from ..services.parser import extract_text
from ..services.profile_builder import build_candidate_profile
from ..services.agents.technical import TechnicalAgent
from ..services.agents.hr_culture import HRCultureAgent
from ..services.agents.hiring_manager import HiringManagerAgent
from ..services.agents.skeptic import SkepticAgent
from ..services.debate import run_debate
from ..services.adjudicator import adjudicate
from ..services.demo_engine import generate_demo_evaluation

logger = logging.getLogger(__name__)
router = APIRouter(tags=["evaluation"])


@router.post("/evaluate", response_model=EvaluationResult)
async def evaluate_candidate(
    resume: UploadFile = File(..., description="Resume file (PDF, DOCX, or TXT)"),
    transcript: UploadFile = File(..., description="Interview transcript (PDF, DOCX, or TXT)"),
    api_key: str = Form(None, description="Optional API key override"),
    model: str = Form(None, description="Optional LLM model override"),
    demo_mode: str = Form("false", description="Run in Demo / Simulation mode without LLM calls"),
):
    """Full candidate evaluation pipeline.

    1. Parse uploaded documents
    2. Build structured candidate profile
    3. Run 4 independent agent evaluations (in parallel)
    4. Run 2-round structured debate
    5. Produce weighted final decision

    Returns the complete EvaluationResult.
    """

    # ── Step 0: Validate files ──
    for f, label in [(resume, "Resume"), (transcript, "Transcript")]:
        if f.size and f.size > settings.max_file_size_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"{label} file too large. Maximum: {settings.max_file_size_mb}MB",
            )

    # ── Step 1: Extract text ──
    logger.info("Step 1: Extracting text from uploaded documents...")
    try:
        resume_bytes = await resume.read()
        transcript_bytes = await transcript.read()

        resume_text = extract_text(resume_bytes, resume.filename or "resume.pdf")
        transcript_text = extract_text(transcript_bytes, transcript.filename or "transcript.pdf")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"File parsing error: {e}")
        raise HTTPException(status_code=400, detail=f"Error parsing files: {str(e)}")

    if not resume_text.strip() and not transcript_text.strip():
        raise HTTPException(status_code=400, detail="Both files appear to be empty. Please upload valid documents.")

    # ── Step 1b: Check Demo Mode ──
    effective_api_key = api_key.strip() if api_key else ""
    target_model = model.strip() if model else settings.llm_model
    is_demo = str(demo_mode).strip().lower() in ("true", "1", "yes")

    # Check if we have an API key available either from input or env
    has_env_key = bool(
        settings.gemini_api_key
        or settings.openai_api_key
        or settings.anthropic_api_key
        or os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or os.getenv("OPENAI_API_KEY")
        or os.getenv("ANTHROPIC_API_KEY")
    )

    if is_demo or (not effective_api_key and not has_env_key):
        if not demo_mode and not effective_api_key and not has_env_key:
            logger.info("No API key detected — falling back to high-fidelity Demo Simulation Mode.")
        # Run Demo engine
        return generate_demo_evaluation(resume_text, transcript_text)

    try:
        # ── Step 2: Build Candidate Profile ──
        logger.info("Step 2: Building candidate profile...")
        profile = await build_candidate_profile(
            resume_text,
            transcript_text,
            api_key=effective_api_key or None,
            model=target_model,
        )

        # ── Step 3: Independent Agent Evaluations (parallel) ──
        logger.info("Step 3: Running 4 independent agent evaluations in parallel...")
        agents = [
            TechnicalAgent(),
            HRCultureAgent(),
            HiringManagerAgent(),
            SkepticAgent(),
        ]

        evaluations = await asyncio.gather(
            *[
                agent.evaluate(
                    profile,
                    api_key=effective_api_key or None,
                    model=target_model,
                )
                for agent in agents
            ]
        )
        evaluations = list(evaluations)

        # ── Step 4: Structured Debate (2 rounds) ──
        logger.info("Step 4: Running structured debate...")
        debate_rounds = await run_debate(
            evaluations,
            api_key=effective_api_key or None,
            model=target_model,
        )

        # ── Step 5: Final Adjudication ──
        logger.info("Step 5: Running final adjudication...")
        final_decision = await adjudicate(
            evaluations,
            debate_rounds,
            api_key=effective_api_key or None,
            model=target_model,
        )

        # ── Assemble result ──
        result = EvaluationResult(
            candidate_profile=profile,
            agent_evaluations=evaluations,
            debate_rounds=debate_rounds,
            final_decision=final_decision,
        )

        logger.info(f"Evaluation complete for {profile.name}: {final_decision.recommendation}")
        return result

    except Exception as e:
        logger.error(f"Error during LLM evaluation: {e}", exc_info=True)
        error_msg = str(e)
        if "Missing Gemini API key" in error_msg or "APIConnectionError" in error_msg or "api_key" in error_msg.lower():
            raise HTTPException(
                status_code=400,
                detail=(
                    "Missing or invalid LLM API Key. Please enter your API key in the UI settings bar, "
                    "or toggle 'Demo Mode' to test the full simulation without an API key."
                ),
            )
        raise HTTPException(status_code=500, detail=f"Evaluation error: {error_msg}")
