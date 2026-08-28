"""Skeptic Agent — looks for contradictions, exaggeration, and red flags."""

from ...models import CandidateProfile
from ...prompts.skeptic import SKEPTIC_SYSTEM_PROMPT, SKEPTIC_EVALUATION_PROMPT
from .base import BaseAgent


class SkepticAgent(BaseAgent):
    """Adversarial agent that challenges the candidate's narrative."""

    def get_name(self) -> str:
        return "Skeptic Analyst"

    def get_role(self) -> str:
        return "Devil's Advocate"

    def get_system_prompt(self) -> str:
        return SKEPTIC_SYSTEM_PROMPT

    def get_evaluation_prompt(self, profile: CandidateProfile) -> str:
        return SKEPTIC_EVALUATION_PROMPT.format(
            profile_data=self._format_profile_for_prompt(profile)
        )
