"""HR/Culture Agent — evaluates communication, teamwork, honesty, and cultural fit."""

from ...models import CandidateProfile
from ...prompts.hr_culture import HR_CULTURE_SYSTEM_PROMPT, HR_CULTURE_EVALUATION_PROMPT
from .base import BaseAgent


class HRCultureAgent(BaseAgent):
    """Evaluates communication quality, teamwork, honesty, and cultural alignment."""

    def get_name(self) -> str:
        return "HR & Culture Analyst"

    def get_role(self) -> str:
        return "Senior HR Director"

    def get_system_prompt(self) -> str:
        return HR_CULTURE_SYSTEM_PROMPT

    def get_evaluation_prompt(self, profile: CandidateProfile) -> str:
        return HR_CULTURE_EVALUATION_PROMPT.format(
            profile_data=self._format_profile_for_prompt(profile)
        )
