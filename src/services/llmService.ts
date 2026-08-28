import { EvaluationResult } from '../types/evaluation';
import { generateDynamicEvaluation } from './dynamicEvaluationEngine';

const NVIDIA_NIM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const API_KEYS = [
  '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',
  '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'
];

const PREFERRED_MODELS = [
  'meta/llama-3.2-11b-vision-instruct',
  'google/gemma-3-12b-it',
  'deepseek-ai/deepseek-v4-pro-0813'
];

/**
 * Executes a chat completion request to the NVIDIA NIM LLM endpoint.
 */
export async function callNvidiaLLM(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.3,
  maxTokens: number = 2048
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    for (const key of API_KEYS) {
      for (const model of PREFERRED_MODELS) {
        try {
          const res = await fetch(NVIDIA_NIM_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              temperature,
              max_tokens: maxTokens,
              response_format: { type: 'json_object' }
            }),
            signal: controller.signal
          });

          if (res.ok) {
            const data = await res.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
              clearTimeout(timeoutId);
              return content;
            }
          }
        } catch {
          // try next model
        }
      }
    }
  } finally {
    clearTimeout(timeoutId);
  }

  throw new Error('NVIDIA LLM completion unavailable');
}

/**
 * Runs the full 4-agent evaluation pipeline using real LLM calls for any candidate.
 */
export async function evaluateCandidateWithLLM(
  resumeText: string,
  transcriptText: string,
  candidateName?: string,
  jobDescription?: string
): Promise<EvaluationResult> {
  try {
    const systemPrompt = `You are HireMind's autonomous multi-agent candidate evaluation platform.
You must return ONLY valid JSON with no markdown wrapping or backticks.`;

    const userPrompt = `Analyze this candidate dossier across 4 specialized AI personas:
Candidate Name: ${candidateName || 'Candidate'}
Job Description: ${jobDescription || 'Senior Software Engineer'}

RESUME:
${resumeText}

INTERVIEW TRANSCRIPT:
${transcriptText}

Generate a complete JSON evaluation matching this exact schema:
{
  "candidate_profile": {
    "name": "${candidateName || 'Candidate'}",
    "email": "candidate@domain.com",
    "phone": "+1 (555) 019-2834",
    "skills": [{"name": "Skill", "proficiency": "expert|advanced|intermediate", "source": "both|resume|transcript"}],
    "experience": [{"role": "Role", "company": "Company", "duration": "2021-Present", "key_achievements": ["Achievement"]}],
    "education": [{"degree": "Degree", "institution": "School", "year": "2019"}],
    "claims": [{"claim": "Claim text", "source": "resume", "quote": "Quote"}],
    "transcript_highlights": [{"question": "Q", "answer_summary": "A", "relevant_claims": ["Claim"]}]
  },
  "agent_evaluations": [
    {
      "agent_name": "Technical Evaluator",
      "role": "Technical Depth & Architecture Mastery",
      "score": 88,
      "confidence": 0.92,
      "recommendation": "STRONG_HIRE",
      "key_strengths": ["Strength 1", "Strength 2"],
      "red_flags": ["Flag 1"],
      "evidence": [{"fact_or_quote": "Real quote from transcript", "source": "transcript", "relevance": "Why relevant"}],
      "reasoning": "Technical reasoning based on actual answers"
    },
    {
      "agent_name": "HR & Culture Analyst",
      "role": "Communication, Teamwork & Intellectual Honesty",
      "score": 85,
      "confidence": 0.89,
      "recommendation": "HIRE",
      "key_strengths": ["Strength 1"],
      "red_flags": ["Flag 1"],
      "evidence": [{"fact_or_quote": "Real quote from transcript", "source": "transcript", "relevance": "Why relevant"}],
      "reasoning": "HR reasoning based on communication style and conflict resolution"
    },
    {
      "agent_name": "Hiring Manager",
      "role": "Business Impact & Execution Velocity",
      "score": 87,
      "confidence": 0.91,
      "recommendation": "STRONG_HIRE",
      "key_strengths": ["Strength 1"],
      "red_flags": ["Flag 1"],
      "evidence": [{"fact_or_quote": "Real quote from transcript", "source": "transcript", "relevance": "Why relevant"}],
      "reasoning": "Business impact and velocity reasoning"
    },
    {
      "agent_name": "Skeptic Analyst",
      "role": "Contradictions, Scope Inflation & Risk Assessment",
      "score": 75,
      "confidence": 0.84,
      "recommendation": "LEAN_HIRE",
      "key_strengths": ["Strength 1"],
      "red_flags": ["Flag 1"],
      "evidence": [{"fact_or_quote": "Real quote from transcript", "source": "transcript", "relevance": "Why relevant"}],
      "reasoning": "Skeptical analysis of claims vs transcript proof"
    }
  ],
  "debate_rounds": [
    {
      "round_number": 1,
      "theme": "Round 1: Cross-Examination on Technical Claims & Execution",
      "messages": [
        {
          "agent_name": "Skeptic Analyst",
          "round_number": 1,
          "message_type": "challenge",
          "target_agent": "Technical Evaluator",
          "content": "Challenge to Technical Evaluator about candidate's specific claims",
          "quote_cited": "Quote",
          "revised_score": 75,
          "revised_confidence": 0.84
        },
        {
          "agent_name": "Technical Evaluator",
          "round_number": 1,
          "message_type": "response",
          "target_agent": "Skeptic Analyst",
          "content": "Rebuttal citing transcript technical details",
          "quote_cited": "Quote",
          "revised_score": 88,
          "revised_confidence": 0.93
        },
        {
          "agent_name": "HR & Culture Analyst",
          "round_number": 1,
          "message_type": "challenge",
          "target_agent": "Hiring Manager",
          "content": "Question about collaboration and honesty vs delivery speed",
          "quote_cited": "Quote",
          "revised_score": 85,
          "revised_confidence": 0.89
        },
        {
          "agent_name": "Hiring Manager",
          "round_number": 1,
          "message_type": "response",
          "target_agent": "HR & Culture Analyst",
          "content": "Response on team multiplier and pragmatic problem solving",
          "quote_cited": "Quote",
          "revised_score": 87,
          "revised_confidence": 0.92
        }
      ]
    },
    {
      "round_number": 2,
      "theme": "Round 2: Verdict Convergence & Risk Adjudication",
      "messages": [
        {
          "agent_name": "Skeptic Analyst",
          "round_number": 2,
          "message_type": "synthesis",
          "target_agent": "Technical Evaluator",
          "content": "Score adjustment and revised risk assessment",
          "quote_cited": "Quote",
          "revised_score": 80,
          "revised_confidence": 0.88
        },
        {
          "agent_name": "Technical Evaluator",
          "round_number": 2,
          "message_type": "closing",
          "content": "Final technical verdict",
          "revised_score": 88,
          "revised_confidence": 0.95
        },
        {
          "agent_name": "HR & Culture Analyst",
          "round_number": 2,
          "message_type": "closing",
          "content": "Final culture and communication verdict",
          "revised_score": 85,
          "revised_confidence": 0.92
        },
        {
          "agent_name": "Hiring Manager",
          "round_number": 2,
          "message_type": "closing",
          "content": "Final business and velocity verdict",
          "revised_score": 87,
          "revised_confidence": 0.94
        }
      ]
    }
  ],
  "final_decision": {
    "recommendation": "STRONG_HIRE",
    "overall_score": 86,
    "confidence": 0.92,
    "summary": "Summary of debate conclusion",
    "reasoning": "Detailed weighted non-averaged reasoning",
    "agent_weights": {"Technical Evaluator": 0.35, "Hiring Manager": 0.30, "HR & Culture Analyst": 0.20, "Skeptic Analyst": 0.15},
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "concerns": ["Concern 1"],
    "unresolved_disagreements": [{"topic": "Topic", "agents_involved": ["Hiring Manager", "Skeptic Analyst"], "summary": "Summary"}]
  }
}`;

    const rawResult = await callNvidiaLLM(systemPrompt, userPrompt);
    const cleaned = rawResult.replace(/^```json\s*|```\s*$/g, '').trim();
    const parsed: EvaluationResult = JSON.parse(cleaned);

    if (parsed.candidate_profile && parsed.agent_evaluations && parsed.debate_rounds && parsed.final_decision) {
      return parsed;
    }
  } catch (err) {
    console.warn('Direct NVIDIA LLM call failed or returned invalid JSON, falling back to local semantic engine:', err);
  }

  // Fallback to high-fidelity dynamic semantic evaluation engine
  return generateDynamicEvaluation(resumeText, transcriptText, candidateName, jobDescription);
}
