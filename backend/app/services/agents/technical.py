"""Technical Agent — evaluates technical skill depth and problem-solving ability."""

from ...models import CandidateProfile
from ...prompts.technical import TECHNICAL_SYSTEM_PROMPT, TECHNICAL_EVALUATION_PROMPT
from .base import BaseAgent


class TechnicalAgent(BaseAgent):
    """Evaluates technical depth, problem-solving, architecture, and code quality signals."""

    def get_name(self) -> str:
        return "Technical Evaluator"

    def get_role(self) -> str:
        return "Senior Technical Interviewer"

    def get_system_prompt(self) -> str:
        return TECHNICAL_SYSTEM_PROMPT

    def get_evaluation_prompt(self, profile: CandidateProfile) -> str:
        return TECHNICAL_EVALUATION_PROMPT.format(
            profile_data=self._format_profile_for_prompt(profile)
        )
