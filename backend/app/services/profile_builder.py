"""Candidate Profile Builder — uses LLM to extract structured profile from raw text."""

import json
import logging
from litellm import acompletion
from ..config import settings
from ..models import CandidateProfile
from ..prompts.profile_builder import PROFILE_BUILDER_PROMPT

logger = logging.getLogger(__name__)


async def build_candidate_profile(
    resume_text: str,
    transcript_text: str,
    api_key: str | None = None,
    model: str | None = None,
) -> CandidateProfile:
    """Extract a structured candidate profile from resume and transcript text.

    Args:
        resume_text: Raw text extracted from the resume
        transcript_text: Raw text extracted from the interview transcript
        api_key: Optional LLM API key override
        model: Optional LLM model override

    Returns:
        CandidateProfile with all extracted information
    """
    prompt = PROFILE_BUILDER_PROMPT.format(
        resume_text=resume_text or "(No resume provided)",
        transcript_text=transcript_text or "(No transcript provided)",
    )

    logger.info("Building candidate profile via LLM...")

    target_model = model or settings.llm_model
    call_kwargs = {}
    if api_key:
        call_kwargs["api_key"] = api_key

    response = await acompletion(
        model=target_model,
        messages=[
            {
                "role": "system",
                "content": "You are a precise data extraction assistant. Always return valid JSON.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.1,  # Low temp for factual extraction
        max_tokens=4000,
        **call_kwargs,
    )

    raw_content = response.choices[0].message.content.strip()

    # Strip markdown code fences if present
    if raw_content.startswith("```"):
        lines = raw_content.split("\n")
        # Remove first and last lines (```json and ```)
        lines = [l for l in lines if not l.strip().startswith("```")]
        raw_content = "\n".join(lines)

    try:
        profile_data = json.loads(raw_content)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}\nRaw: {raw_content[:500]}")
        # Return a minimal profile with just the raw text
        return CandidateProfile(
            raw_resume_text=resume_text,
            raw_transcript_text=transcript_text,
        )

    profile = CandidateProfile(
        **profile_data,
        raw_resume_text=resume_text,
        raw_transcript_text=transcript_text,
    )

    logger.info(f"Profile built: {profile.name}, {len(profile.skills)} skills, {len(profile.claims)} claims")
    return profile
