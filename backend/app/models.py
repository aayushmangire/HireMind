"""Pydantic data models for the entire evaluation pipeline."""

from __future__ import annotations
from enum import Enum
from pydantic import BaseModel, Field


# ──────────────────────────────────────────────
# Candidate Profile Models
# ──────────────────────────────────────────────

class SkillItem(BaseModel):
    name: str
    proficiency: str = Field(description="Self-reported or inferred: beginner/intermediate/advanced/expert")
    source: str = Field(description="Where this was mentioned: resume, transcript, or both")


class ExperienceItem(BaseModel):
    role: str
    company: str
    duration: str
    key_achievements: list[str] = Field(default_factory=list)


class EducationItem(BaseModel):
    degree: str
    institution: str
    year: str = ""


class ClaimItem(BaseModel):
    claim: str = Field(description="A specific claim made by the candidate")
    source: str = Field(description="resume or transcript")
    quote: str = Field(default="", description="The exact quote or paraphrase")


class TranscriptHighlight(BaseModel):
    question: str
    answer_summary: str
    notable: str = Field(default="", description="Why this Q&A is notable")


class CandidateProfile(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    skills: list[SkillItem] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    claims: list[ClaimItem] = Field(default_factory=list)
    transcript_highlights: list[TranscriptHighlight] = Field(default_factory=list)
    raw_resume_text: str = ""
    raw_transcript_text: str = ""


# ──────────────────────────────────────────────
# Agent Evaluation Models
# ──────────────────────────────────────────────

class EvidenceItem(BaseModel):
    quote: str = Field(description="Direct quote or specific fact from resume/transcript")
    reasoning: str = Field(description="Why this evidence matters for the evaluation")
    sentiment: str = Field(default="neutral", description="positive, negative, or neutral")


class AgentEvaluation(BaseModel):
    agent_name: str
    agent_role: str
    score: float = Field(ge=1, le=10, description="Score from 1-10")
    confidence: float = Field(ge=0, le=1, description="Confidence from 0.0 to 1.0")
    verdict: str = Field(description="One-line summary verdict")
    evidence: list[EvidenceItem] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    concerns: list[str] = Field(default_factory=list)


# ──────────────────────────────────────────────
# Debate Models
# ──────────────────────────────────────────────

class DebateMessage(BaseModel):
    speaker: str = Field(description="Name of the speaking agent")
    target: str = Field(default="", description="Agent being addressed, if any")
    stance: str = Field(default="", description="agree, disagree, qualify, concede")
    message: str
    revised_score: float | None = Field(default=None, description="Revised score if agent changed its mind")
    confidence_delta: float = Field(default=0.0, description="Change in confidence: positive = more sure")


class DebateRound(BaseModel):
    round_number: int
    messages: list[DebateMessage] = Field(default_factory=list)


# ──────────────────────────────────────────────
# Final Adjudication Models
# ──────────────────────────────────────────────

class RecommendationLevel(str, Enum):
    STRONG_HIRE = "STRONG_HIRE"
    HIRE = "HIRE"
    LEAN_HIRE = "LEAN_HIRE"
    LEAN_NO_HIRE = "LEAN_NO_HIRE"
    NO_HIRE = "NO_HIRE"
    STRONG_NO_HIRE = "STRONG_NO_HIRE"


class UnresolvedDisagreement(BaseModel):
    topic: str
    agents_involved: list[str]
    summary: str


class FinalDecision(BaseModel):
    recommendation: RecommendationLevel
    confidence: float = Field(ge=0, le=1)
    strengths: list[str] = Field(default_factory=list)
    concerns: list[str] = Field(default_factory=list)
    unresolved_disagreements: list[UnresolvedDisagreement] = Field(default_factory=list)
    reasoning: str = Field(description="Detailed explanation of how the decision was reached")


# ──────────────────────────────────────────────
# Full Evaluation Result
# ──────────────────────────────────────────────

class EvaluationResult(BaseModel):
    candidate_profile: CandidateProfile
    agent_evaluations: list[AgentEvaluation] = Field(default_factory=list)
    debate_rounds: list[DebateRound] = Field(default_factory=list)
    final_decision: FinalDecision | None = None
