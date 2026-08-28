# 🧠 HireMind — Multi-Agent Candidate Evaluation System

AI-powered candidate evaluation using **4 independent AI agents** that evaluate, **debate each other**, and produce a **weighted hiring recommendation** — complete with **voice debate** powered by ElevenLabs and Web Speech API.

## 🏗 Architecture

```
Resume + Transcript
        │
    ┌───▼───┐
    │ Parser │  (PyMuPDF / python-docx)
    └───┬───┘
        │
  ┌─────▼──────┐
  │   Profile   │  (LLM extracts structured data)
  │   Builder   │
  └──────┬──────┘
         │
    ┌────▼────────────────────────────────┐
    │     4 Independent Agent Evals       │
    │  (parallel asyncio.gather — no      │
    │   shared state between agents)      │
    ├──────────┬──────────┬───────────────┤
    │Technical │HR/Culture│Hiring Manager │Skeptic│
    └────┬─────┴────┬─────┴───────┬───────┴───┘
         │          │             │
    ┌────▼──────────▼─────────────▼──────┐
    │        2-Round Debate Engine        │
    │  Round 1: Cross-Examination         │
    │  Round 2: Rebuttals                 │
    └──────────────┬─────────────────────┘
                   │
    ┌──────────────▼─────────────────────┐
    │     Weighted Adjudicator            │
    │  (NOT a simple average)             │
    │  Considers: confidence deltas,      │
    │  evidence quality, unresolved       │
    │  disagreements                      │
    └──────────────┬─────────────────────┘
                   │
             Final Report
```

## 🚀 Quick Start

### 1. Clone & Configure

```bash
cd PromptWars/backend
cp .env.example .env
# Edit .env — add your API key (at least one):
#   GEMINI_API_KEY=your-key-here
#   OPENAI_API_KEY=your-key-here
#   ANTHROPIC_API_KEY=your-key-here
```

### 2. Install Dependencies

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
```

### 3. Run

```bash
cd backend
.\venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Then open **http://localhost:8000** in your browser.

## 🤖 The 4 Agents

| Agent | Focus | What It Looks For |
|-------|-------|------------------|
| 🔧 **Technical Evaluator** | Skill depth, problem-solving | Technical depth vs. buzzwords, architecture thinking |
| 🤝 **HR & Culture Analyst** | Communication, teamwork, honesty | Behavioral evidence, self-awareness, conflict handling |
| 📋 **Hiring Manager** | Hire/no-hire business decision | Role fit, impact potential, risk, growth trajectory |
| 🔍 **Skeptic Analyst** | Red flags, contradictions | Exaggeration, timeline gaps, vague claims, inconsistencies |

## ⚔️ The Debate

This is NOT just 4 opinions shown side-by-side. After independent evaluation:

1. **Round 1 (Cross-Examination)**: Each agent sees all other evaluations and must:
   - Name the agent it most disagrees with and explain why
   - Name the agent it most agrees with
   - Optionally revise its own score

2. **Round 2 (Rebuttals)**: Agents that were challenged must respond — defend, concede, or qualify.

## 📊 The Decision (Not Simple Averaging)

The Adjudicator weighs evidence using:
- **Confidence-weighted scoring** — maintained confidence > wavering
- **Evidence quality** — transcript quotes > general impressions
- **Unresolved red flags** — Skeptic concerns that survived debate carry heavy weight
- **Consensus signals** — 3+ agents agreeing is a strong signal

Output: `STRONG_HIRE` → `HIRE` → `LEAN_HIRE` → `LEAN_NO_HIRE` → `NO_HIRE` → `STRONG_NO_HIRE`

## 🗣️ Voice Debate (Bonus)

Enable voice debate in the UI to hear agents argue with distinct voices using the browser's Web Speech API. Includes play/pause, speed control, and visual speaking indicators.

## 🔧 LLM Configuration

Set `LLM_MODEL` in `.env` to switch providers:

```
gemini/gemini-2.0-flash        # Google Gemini (default)
openai/gpt-4o                   # OpenAI
anthropic/claude-3-5-sonnet     # Anthropic
```

Powered by [LiteLLM](https://docs.litellm.ai/) — supports 100+ models.

## 📁 Project Structure

```
PromptWars/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Settings
│   │   ├── models.py            # Pydantic models
│   │   ├── routers/
│   │   │   ├── evaluate.py      # POST /evaluate
│   │   │   └── health.py        # GET /health
│   │   ├── services/
│   │   │   ├── parser.py        # PDF/DOCX extraction
│   │   │   ├── profile_builder.py
│   │   │   ├── debate.py        # Debate engine
│   │   │   ├── adjudicator.py   # Final decision
│   │   │   └── agents/
│   │   │       ├── base.py      # Base agent class
│   │   │       ├── technical.py
│   │   │       ├── hr_culture.py
│   │   │       ├── hiring_manager.py
│   │   │       └── skeptic.py
│   │   └── prompts/             # LLM prompt templates
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── README.md
```
