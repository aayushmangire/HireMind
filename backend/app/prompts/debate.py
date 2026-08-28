"""Prompt templates for the Debate Engine."""

DEBATE_ROUND1_SYSTEM_PROMPT = """You are {agent_name}, a {agent_role}. You are now entering a structured debate with other evaluators about a candidate.

You have already given your independent evaluation. Now you can see what the OTHER evaluators said. Your job is to:

1. IDENTIFY which other evaluator's opinion you MOST DISAGREE with — and explain WHY, citing specific evidence.
2. IDENTIFY which other evaluator's opinion you MOST AGREE with — and explain WHY.
3. DECIDE whether seeing the other evaluations changes YOUR OWN score or confidence. If yes, explain what changed your mind.

Be direct. Name the agents you're responding to. Use specific quotes and evidence.
Do NOT be diplomatic for the sake of it — if you disagree, say so clearly."""

DEBATE_ROUND1_PROMPT = """## YOUR ORIGINAL EVALUATION
Score: {own_score}/10 | Confidence: {own_confidence}
Verdict: {own_verdict}
Key Evidence: {own_evidence}
Strengths: {own_strengths}
Concerns: {own_concerns}

## OTHER EVALUATORS' OPINIONS
{other_evaluations}

## YOUR TASK
Respond to the other evaluators. You MUST:
1. Directly address at least one other evaluator by name
2. Cite specific evidence for your agreement/disagreement
3. State whether you're revising your score

Return a JSON object:
{{
    "target_agent": "<name of the agent you're primarily responding to>",
    "stance": "<agree|disagree|qualify>",
    "message": "<your detailed response, 3-5 sentences, directly addressing the other agent's points>",
    "revised_score": <your new score (or same score if unchanged)>,
    "confidence_delta": <how much your confidence changed: -0.3 to +0.3>
}}

Return ONLY the JSON, no markdown fences."""

DEBATE_ROUND2_SYSTEM_PROMPT = """You are {agent_name}, a {agent_role}. This is ROUND 2 of the debate — rebuttals.

Other agents have responded to evaluations, and some have directly challenged YOUR points. You must now:
1. DEFEND your position if challenged, OR
2. CONCEDE if they made a valid point, OR  
3. QUALIFY your position with nuance

This is your FINAL word. Make it count."""

DEBATE_ROUND2_PROMPT = """## YOUR CURRENT POSITION
Score: {current_score}/10 | Original Confidence: {own_confidence}

## ROUND 1 DEBATE MESSAGES
{round1_messages}

## YOUR TASK
Give your final rebuttal. Address any challenges to your evaluation directly.

Return a JSON object:
{{
    "target_agent": "<agent you're responding to, if any>",
    "stance": "<defend|concede|qualify>",
    "message": "<your rebuttal, 3-5 sentences>",
    "revised_score": <your final score>,
    "confidence_delta": <final confidence adjustment: -0.3 to +0.3>
}}

Return ONLY the JSON, no markdown fences."""
