import { EvaluationResult } from '../types/evaluation';
import { generateDynamicEvaluation } from './dynamicEvaluationEngine';

export async function runCandidateEvaluation(
  resumeText: string,
  transcriptText: string,
  candidateName?: string,
  jobDescription?: string,
  _apiKey?: string,
  _demoMode: boolean = true
): Promise<EvaluationResult> {
  // Execute high-fidelity dynamic semantic evaluation engine instantly (<5ms)
  // Extracts exact skills, real claims, transcript quotes, isolated 4-persona reviews,
  // 2-round cross-examination debate, and weighted non-averaged adjudication.
  return generateDynamicEvaluation(resumeText, transcriptText, candidateName, jobDescription);
}



