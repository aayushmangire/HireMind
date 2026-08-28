"""Base agent class — shared evaluation logic for all AI personas."""

import json
import logging
from abc import ABC, abstractmethod
from litellm import acompletion
from ...config import settings
from ...models import CandidateProfile, AgentEvaluation

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Abstract base class for all evaluation agents.

    Each agent has a name, role description, and system prompt.
    The evaluate() method makes an independent LLM call — no shared state.
    """

    def __init__(self):
        self.name = self.get_name()
        self.role = self.get_role()

    @abstractmethod
    def get_name(self) -> str:
        """Return the agent's display name."""
        ...

    @abstractmethod
    def get_role(self) -> str:
        """Return a short role description."""
        ...

    @abstractmethod
    def get_system_prompt(self) -> str:
        """Return the agent's system prompt defining its persona."""
        ...

    @abstractmethod
    def get_evaluation_prompt(self, profile: CandidateProfile) -> str:
        """Build the evaluation prompt with candidate data."""
        ...

    async def evaluate(
        self,
        profile: CandidateProfile,
        api_key: str | None = None,
        model: str | None = None,
    ) -> AgentEvaluation:
        """Run an independent evaluation of the candidate.

        This is a standalone LLM call — no access to other agents' results.

        Args:
            profile: The candidate profile to evaluate
            api_key: Optional API key override
            model: Optional model override

        Returns:
            AgentEvaluation with score, confidence, evidence, etc.
        """
        system_prompt = self.get_system_prompt()
        user_prompt = self.get_evaluation_prompt(profile)

        logger.info(f"[{self.name}] Starting independent evaluation...")

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
            temperature=0.3,
            max_tokens=3000,
            **call_kwargs,
        )

        raw_content = response.choices[0].message.content.strip()

        # Strip markdown code fences
        if raw_content.startswith("```"):
            lines = raw_content.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            raw_content = "\n".join(lines)

        try:
            data = json.loads(raw_content)
        except json.JSONDecodeError as e:
            logger.error(f"[{self.name}] Failed to parse evaluation JSON: {e}")
            # Return a fallback evaluation
            return AgentEvaluation(
                agent_name=self.name,
                agent_role=self.role,
                score=5.0,
                confidence=0.3,
                verdict="Unable to produce structured evaluation — response parsing failed",
                evidence=[],
                strengths=["Evaluation could not be completed"],
                concerns=["LLM response was not valid JSON"],
            )

        evaluation = AgentEvaluation(
            agent_name=self.name,
            agent_role=self.role,
            score=float(data.get("score", 5)),
            confidence=float(data.get("confidence", 0.5)),
            verdict=data.get("verdict", "No verdict provided"),
            evidence=[
                {
                    "quote": e.get("quote", ""),
                    "reasoning": e.get("reasoning", ""),
                    "sentiment": e.get("sentiment", "neutral"),
                }
                for e in data.get("evidence", [])
            ],
            strengths=data.get("strengths", []),
            concerns=data.get("concerns", []),
        )

        logger.info(f"[{self.name}] Evaluation complete: score={evaluation.score}, confidence={evaluation.confidence}")
        return evaluation

    def _format_profile_for_prompt(self, profile: CandidateProfile) -> str:
        """Format the candidate profile into a readable string for prompts."""
        sections = []

        if profile.name:
            sections.append(f"**Candidate**: {profile.name}")

        if profile.skills:
            skill_lines = [f"  - {s.name} ({s.proficiency}, mentioned in {s.source})" for s in profile.skills]
            sections.append("**Skills**:\n" + "\n".join(skill_lines))

        if profile.experience:
            exp_lines = []
            for exp in profile.experience:
                achievements = "; ".join(exp.key_achievements) if exp.key_achievements else "No specific achievements listed"
                exp_lines.append(f"  - {exp.role} at {exp.company} ({exp.duration}): {achievements}")
            sections.append("**Experience**:\n" + "\n".join(exp_lines))

        if profile.education:
            edu_lines = [f"  - {e.degree} from {e.institution} ({e.year})" for e in profile.education]
            sections.append("**Education**:\n" + "\n".join(edu_lines))

        if profile.claims:
            claim_lines = [f"  - [{c.source}] \"{c.claim}\" — Quote: \"{c.quote}\"" for c in profile.claims]
            sections.append("**Specific Claims Made**:\n" + "\n".join(claim_lines))

        if profile.transcript_highlights:
            highlight_lines = []
            for h in profile.transcript_highlights:
                highlight_lines.append(f"  Q: {h.question}\n  A: {h.answer_summary}\n  Notable: {h.notable}")
            sections.append("**Key Interview Moments**:\n" + "\n---\n".join(highlight_lines))

        sections.append(f"**Full Resume Text**:\n{profile.raw_resume_text[:3000]}")
        sections.append(f"**Full Transcript Text**:\n{profile.raw_transcript_text[:5000]}")

        return "\n\n".join(sections)
