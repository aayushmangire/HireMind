"""Hiring Manager Agent — evaluates from a practical hire/no-hire business perspective."""

from ...models import CandidateProfile
from ...prompts.hiring_manager import HIRING_MANAGER_SYSTEM_PROMPT, HIRING_MANAGER_EVALUATION_PROMPT
from .base import BaseAgent


class HiringManagerAgent(BaseAgent):
    """Evaluates role fit, impact potential, risk, and overall hiring value."""

    def get_name(self) -> str:
        return "Hiring Manager"

    def get_role(self) -> str:
        return "Engineering Hiring Manager"

    def get_system_prompt(self) -> str:
        return HIRING_MANAGER_SYSTEM_PROMPT

    def get_evaluation_prompt(self, profile: CandidateProfile) -> str:
        return HIRING_MANAGER_EVALUATION_PROMPT.format(
            profile_data=self._format_profile_for_prompt(profile)
        )
