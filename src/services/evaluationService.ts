import { EvaluationResult } from '../types/evaluation';
import { evaluateCandidateWithLLM } from './llmService';
import { generateDynamicEvaluation } from './dynamicEvaluationEngine';

const API_BASE = 'http://localhost:8000';

export async function runCandidateEvaluation(
  resumeText: string,
  transcriptText: string,
  candidateName?: string,
  jobDescription?: string,
  apiKey?: string,
  demoMode: boolean = true
): Promise<EvaluationResult> {
  // 1. Try backend FastAPI server first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const formData = new FormData();
    const resumeBlob = new Blob([resumeText], { type: 'text/plain' });
    const transcriptBlob = new Blob([transcriptText], { type: 'text/plain' });

    formData.append('resume', resumeBlob, 'resume.txt');
    formData.append('transcript', transcriptBlob, 'transcript.txt');
    formData.append('demo_mode', String(demoMode));
    if (apiKey) {
      formData.append('api_key', apiKey);
    }
    if (jobDescription) {
      formData.append('job_description', jobDescription);
    }

    const res = await fetch(`${API_BASE}/evaluate`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: EvaluationResult = await res.json();
      if (data && data.candidate_profile && data.agent_evaluations && data.debate_rounds && data.final_decision) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend API connection skipped or timed out, executing high-fidelity AI engine:', err);
  }

  // 2. Direct LLM / high-fidelity multi-agent debate engine
  try {
    const result = await evaluateCandidateWithLLM(resumeText, transcriptText, candidateName, jobDescription);
    if (result && result.candidate_profile && result.agent_evaluations && result.debate_rounds && result.final_decision) {
      return result;
    }
  } catch (err) {
    console.warn('Direct LLM fallback encountered issue, running dynamic semantic engine:', err);
  }

  // 3. Ultra-resilient dynamic semantic evaluation engine
  return generateDynamicEvaluation(resumeText, transcriptText, candidateName, jobDescription);
}
