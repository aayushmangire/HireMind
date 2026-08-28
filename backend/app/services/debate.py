"""Debate Engine — orchestrates multi-round debate between agents."""

import asyncio
import json
import logging
from litellm import acompletion
from ..config import settings
from ..models import AgentEvaluation, DebateMessage, DebateRound
from ..prompts.debate import (
    DEBATE_ROUND1_SYSTEM_PROMPT,
    DEBATE_ROUND1_PROMPT,
    DEBATE_ROUND2_SYSTEM_PROMPT,
    DEBATE_ROUND2_PROMPT,
)

logger = logging.getLogger(__name__)


def _format_evaluation_for_debate(eval: AgentEvaluation) -> str:
    """Format a single evaluation into a readable block for debate context."""
    evidence_str = "\n".join(
        f"  - \"{e.quote}\" → {e.reasoning} [{e.sentiment}]"
        for e in eval.evidence
    )
    return (
        f"### {eval.agent_name} ({eval.agent_role})\n"
        f"Score: {eval.score}/10 | Confidence: {eval.confidence}\n"
        f"Verdict: {eval.verdict}\n"
        f"Evidence:\n{evidence_str}\n"
        f"Strengths: {', '.join(eval.strengths)}\n"
        f"Concerns: {', '.join(eval.concerns)}"
    )


def _format_debate_messages(messages: list[DebateMessage]) -> str:
    """Format debate messages into a readable transcript."""
    parts = []
    for msg in messages:
        target_str = f" → @{msg.target}" if msg.target else ""
        score_str = f" [Revised score: {msg.revised_score}]" if msg.revised_score is not None else ""
        parts.append(
            f"**{msg.speaker}**{target_str} ({msg.stance}){score_str}:\n{msg.message}"
        )
    return "\n\n".join(parts)


async def _run_debate_turn(
    agent_name: str,
    agent_role: str,
    system_prompt: str,
    user_prompt: str,
    api_key: str | None = None,
    model: str | None = None,
) -> DebateMessage:
    """Execute a single debate turn for one agent."""
    target_model = model or settings.llm_model
    call_kwargs = {}
    if api_key:
        call_kwargs["api_key"] = api_key

    response = await acompletion(
        model=target_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.5,  # Slightly more creative for debate
        max_tokens=1500,
        **call_kwargs,
    )

    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        raw = "\n".join(lines)

    try:
        data = json.loads(raw)
        return DebateMessage(
            speaker=agent_name,
            target=data.get("target_agent", ""),
            stance=data.get("stance", ""),
            message=data.get("message", ""),
            revised_score=data.get("revised_score"),
            confidence_delta=float(data.get("confidence_delta", 0.0)),
        )
    except (json.JSONDecodeError, ValueError) as e:
        logger.error(f"[{agent_name}] Debate turn parse error: {e}")
        return DebateMessage(
            speaker=agent_name,
            target="",
            stance="error",
            message=raw[:500],  # Use raw text as fallback
            revised_score=None,
            confidence_delta=0.0,
        )


async def run_debate(
    evaluations: list[AgentEvaluation],
    api_key: str | None = None,
    model: str | None = None,
) -> list[DebateRound]:
    """Run a 2-round structured debate between all agents.

    Round 1: Cross-examination — each agent responds to others' evaluations
    Round 2: Rebuttals — agents defend, concede, or qualify their positions

    Args:
        evaluations: The 4 independent agent evaluations
        api_key: Optional API key override
        model: Optional model override

    Returns:
        List of DebateRound objects containing all messages
    """
    agent_map = {e.agent_name: e for e in evaluations}

    # ── Round 1: Cross-Examination ──
    logger.info("Starting debate Round 1: Cross-Examination")
    round1_tasks = []

    for eval in evaluations:
        # Build context: show this agent all OTHER evaluations (not its own)
        other_evals = [e for e in evaluations if e.agent_name != eval.agent_name]
        other_evals_text = "\n\n".join(_format_evaluation_for_debate(e) for e in other_evals)

        evidence_text = "; ".join(f'"{e.quote}"' for e in eval.evidence[:3])
        strengths_text = ", ".join(eval.strengths[:3])
        concerns_text = ", ".join(eval.concerns[:3])

        system_prompt = DEBATE_ROUND1_SYSTEM_PROMPT.format(
            agent_name=eval.agent_name,
            agent_role=eval.agent_role,
        )

        user_prompt = DEBATE_ROUND1_PROMPT.format(
            own_score=eval.score,
            own_confidence=eval.confidence,
            own_verdict=eval.verdict,
            own_evidence=evidence_text,
            own_strengths=strengths_text,
            own_concerns=concerns_text,
            other_evaluations=other_evals_text,
        )

        round1_tasks.append(
            _run_debate_turn(
                eval.agent_name,
                eval.agent_role,
                system_prompt,
                user_prompt,
                api_key=api_key,
                model=model,
            )
        )

    round1_messages = await asyncio.gather(*round1_tasks)
    round1 = DebateRound(round_number=1, messages=list(round1_messages))

    # ── Round 2: Rebuttals ──
    logger.info("Starting debate Round 2: Rebuttals")
    round1_text = _format_debate_messages(round1.messages)
    round2_tasks = []

    for eval in evaluations:
        # Find if this agent's score was revised in round 1
        r1_msg = next((m for m in round1.messages if m.speaker == eval.agent_name), None)
        current_score = r1_msg.revised_score if (r1_msg and r1_msg.revised_score is not None) else eval.score

        system_prompt = DEBATE_ROUND2_SYSTEM_PROMPT.format(
            agent_name=eval.agent_name,
            agent_role=eval.agent_role,
        )

        user_prompt = DEBATE_ROUND2_PROMPT.format(
            current_score=current_score,
            own_confidence=eval.confidence,
            round1_messages=round1_text,
        )

        round2_tasks.append(
            _run_debate_turn(
                eval.agent_name,
                eval.agent_role,
                system_prompt,
                user_prompt,
                api_key=api_key,
                model=model,
            )
        )

    round2_messages = await asyncio.gather(*round2_tasks)
    round2 = DebateRound(round_number=2, messages=list(round2_messages))

    logger.info(f"Debate complete: {len(round1.messages)} + {len(round2.messages)} messages")
    return [round1, round2]
