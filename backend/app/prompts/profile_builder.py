"""Prompt template for the Candidate Profile Builder."""

PROFILE_BUILDER_PROMPT = """You are an expert resume and interview transcript analyst. Your job is to extract structured information from a candidate's resume and interview transcript.

## INPUT
### Resume
{resume_text}

### Interview Transcript
{transcript_text}

## YOUR TASK
Analyze the resume and transcript carefully and extract ALL of the following information into a structured JSON format.

## RULES
1. Extract ONLY information that is explicitly stated or strongly implied — do NOT invent or assume.
2. For skills, note where each was mentioned (resume, transcript, or both) and the apparent proficiency level.
3. For claims, extract SPECIFIC statements the candidate made (e.g., "I led a team of 12 engineers", "I increased revenue by 40%").
4. For transcript highlights, pick the 5-8 most revealing Q&A exchanges.
5. If the transcript is missing or empty, still extract what you can from the resume alone.

## OUTPUT FORMAT
Return a JSON object with this exact structure:
{{
    "name": "Full name",
    "email": "email@example.com",
    "phone": "+1-234-567-8900",
    "skills": [
        {{
            "name": "Python",
            "proficiency": "advanced",
            "source": "both"
        }}
    ],
    "experience": [
        {{
            "role": "Senior Engineer",
            "company": "TechCorp",
            "duration": "2020-2023",
            "key_achievements": ["Led migration to microservices", "Reduced latency by 60%"]
        }}
    ],
    "education": [
        {{
            "degree": "BS Computer Science",
            "institution": "MIT",
            "year": "2018"
        }}
    ],
    "claims": [
        {{
            "claim": "Led a team of 12 engineers",
            "source": "transcript",
            "quote": "I was responsible for a team of 12 engineers working on the payment platform"
        }}
    ],
    "transcript_highlights": [
        {{
            "question": "Tell me about a challenging project",
            "answer_summary": "Described rebuilding the payment system under tight deadline",
            "notable": "Showed strong problem-solving but was vague about specific technical decisions"
        }}
    ]
}}

Return ONLY the JSON object, no markdown code fences or extra text."""
