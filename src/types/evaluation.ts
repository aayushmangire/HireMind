export type RecommendationLevel = 'STRONG_HIRE' | 'HIRE' | 'LEAN_HIRE' | 'LEAN_NO_HIRE' | 'NO_HIRE' | 'STRONG_NO_HIRE';

export interface SkillItem {
  name: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  source: 'resume' | 'transcript' | 'both';
}

export interface ExperienceItem {
  role: string;
  company: string;
  duration: string;
  key_achievements: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  year?: string;
}

export interface ClaimItem {
  claim: string;
  source: 'resume' | 'transcript' | 'both';
  quote: string;
}

export interface TranscriptHighlight {
  question: string;
  answer_summary: string;
  relevant_claims: string[];
}

export interface CandidateProfile {
  name: string;
  email?: string;
  phone?: string;
  skills: SkillItem[];
  experience: ExperienceItem[];
  education: EducationItem[];
  claims: ClaimItem[];
  transcript_highlights: TranscriptHighlight[];
}

export interface EvidenceItem {
  fact_or_quote: string;
  source: 'resume' | 'transcript';
  relevance: string;
}

export interface AgentEvaluation {
  agent_name: string;
  role: string;
  score: number; // 0 - 100
  confidence: number; // 0.0 - 1.0
  recommendation: RecommendationLevel;
  key_strengths: string[];
  red_flags: string[];
  evidence: EvidenceItem[];
  reasoning: string;
}

export interface DebateMessage {
  agent_name: string;
  round_number: number;
  message_type: 'opening' | 'challenge' | 'response' | 'synthesis' | 'closing';
  target_agent?: string;
  content: string;
  quote_cited?: string;
  revised_score?: number;
  revised_confidence?: number;
}

export interface DebateRound {
  round_number: number;
  theme: string;
  messages: DebateMessage[];
}

export interface UnresolvedDisagreement {
  topic: string;
  agents_involved: string[];
  summary: string;
}

export interface FinalDecision {
  recommendation: RecommendationLevel;
  overall_score: number;
  confidence: number;
  summary: string;
  reasoning: string;
  agent_weights: Record<string, number>;
  strengths: string[];
  concerns: string[];
  unresolved_disagreements: UnresolvedDisagreement[];
}

export interface EvaluationResult {
  candidate_profile: CandidateProfile;
  agent_evaluations: AgentEvaluation[];
  debate_rounds: DebateRound[];
  final_decision: FinalDecision;
}
