"""Final Adjudicator — weighted reasoning to produce the hiring decision."""

import json
import logging
from litellm import acompletion
from ..config import settings
from ..models import (
    AgentEvaluation,
    DebateRound,
    FinalDecision,
    UnresolvedDisagreement,
)
from ..prompts.adjudicator import ADJUDICATOR_SYSTEM_PROMPT, ADJUDICATOR_PROMPT

logger = logging.getLogger(__name__)


def _build_evaluations_summary(evaluations: list[AgentEvaluation]) -> str:
    """Format all evaluations for the adjudicator."""
    parts = []
    for e in evaluations:
        evidence_lines = "\n".join(
            f"  - [{ev.sentiment}] \"{ev.quote}\" → {ev.reasoning}"
            for ev in e.evidence
        )
        parts.append(
            f"### {e.agent_name} ({e.agent_role})\n"
            f"Score: {e.score}/10 | Confidence: {e.confidence}\n"
            f"Verdict: {e.verdict}\n"
            f"Evidence:\n{evidence_lines}\n"
            f"Strengths: {', '.join(e.strengths)}\n"
            f"Concerns: {', '.join(e.concerns)}"
        )
    return "\n\n---\n\n".join(parts)


def _build_debate_transcript(rounds: list[DebateRound]) -> str:
    """Format the debate transcript for the adjudicator."""
    parts = []
    for rnd in rounds:
        parts.append(f"## Round {rnd.round_number}")
        for msg in rnd.messages:
            target = f" → @{msg.target}" if msg.target else ""
            score_note = f" [Revised: {msg.revised_score}/10]" if msg.revised_score is not None else ""
            confidence_note = f" [Confidence Δ: {msg.confidence_delta:+.2f}]" if msg.confidence_delta != 0 else ""
            parts.append(
                f"**{msg.speaker}**{target} ({msg.stance}){score_note}{confidence_note}:\n{msg.message}"
            )
    return "\n\n".join(parts)


def _build_confidence_changes(
    evaluations: list[AgentEvaluation],
    rounds: list[DebateRound],
) -> str:
    """Summarize how each agent's confidence evolved through the debate."""
    lines = []
    for eval in evaluations:
        original_confidence = eval.confidence
        original_score = eval.score
        total_delta = 0.0
        final_score = original_score

        for rnd in rounds:
            for msg in rnd.messages:
                if msg.speaker == eval.agent_name:
                    total_delta += msg.confidence_delta
                    if msg.revised_score is not None:
                        final_score = msg.revised_score

        final_confidence = max(0.0, min(1.0, original_confidence + total_delta))
        score_change = f"{original_score} → {final_score}" if final_score != original_score else f"{original_score} (unchanged)"
        conf_change = f"{original_confidence:.2f} → {final_confidence:.2f}" if total_delta != 0 else f"{original_confidence:.2f} (unchanged)"

        lines.append(f"- **{eval.agent_name}**: Score {score_change} | Confidence {conf_change}")

    return "\n".join(lines)


async def adjudicate(
    evaluations: list[AgentEvaluation],
    debate_rounds: list[DebateRound],
    api_key: str | None = None,
    model: str | None = None,
) -> FinalDecision:
    """Produce a final hiring decision using weighted reasoning.

    NOT a simple average — the adjudicator considers evidence quality,
    confidence changes, and unresolved disagreements.

    Args:
        evaluations: The 4 independent agent evaluations
        debate_rounds: The debate rounds with all messages
        api_key: Optional API key override
        model: Optional model override

    Returns:
        FinalDecision with recommendation, confidence, reasoning, etc.
    """
    evaluations_summary = _build_evaluations_summary(evaluations)
    debate_transcript = _build_debate_transcript(debate_rounds)
    confidence_changes = _build_confidence_changes(evaluations, debate_rounds)

    user_prompt = ADJUDICATOR_PROMPT.format(
        evaluations_summary=evaluations_summary,
        debate_transcript=debate_transcript,
        confidence_changes=confidence_changes,
    )

    logger.info("Running final adjudication...")

    target_model = model or settings.llm_model
    call_kwargs = {}
    if api_key:
        call_kwargs["api_key"] = api_key

    response = await acompletion(
        model=target_model,
        messages=[
            {"role": "system", "content": ADJUDICATOR_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,  # Low temp for careful reasoning
        max_tokens=3000,
        **call_kwargs,
    )

    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        raw = "\n".join(lines)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        logger.error(f"Adjudicator JSON parse error: {e}")
        return FinalDecision(
            recommendation="LEAN_NO_HIRE",
            confidence=0.3,
            strengths=["Unable to synthesize — evaluation data was available"],
            concerns=["Final adjudication response could not be parsed"],
            unresolved_disagreements=[],
            reasoning="The adjudication LLM call did not return valid JSON. Please retry.",
        )

    unresolved = [
        UnresolvedDisagreement(
            topic=d.get("topic", "Unknown"),
            agents_involved=d.get("agents_involved", []),
            summary=d.get("summary", ""),
        )
        for d in data.get("unresolved_disagreements", [])
    ]

    decision = FinalDecision(
        recommendation=data.get("recommendation", "LEAN_NO_HIRE"),
        confidence=float(data.get("confidence", 0.5)),
        strengths=data.get("strengths", []),
        concerns=data.get("concerns", []),
        unresolved_disagreements=unresolved,
        reasoning=data.get("reasoning", "No reasoning provided."),
    )

    logger.info(f"Final decision: {decision.recommendation} (confidence: {decision.confidence})")
    return decision
