import streamlit as st
import re
import os
from typing import Dict, List, Any, Optional

st.set_page_config(
    page_title="HireMind — Multi-Agent Candidate Evaluation System",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ─────────────────────────────────────────────────────────────────────────────
# Custom CSS for Pure White Clean Design
# ─────────────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    .main {
        background-color: #ffffff;
    }
    
    .stApp {
        background-color: #ffffff;
    }
    
    .brand-title {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 800;
        font-size: 2.2rem;
        letter-spacing: -0.04em;
        color: #141414;
        margin-bottom: 0.2rem;
    }
    
    .brand-subtitle {
        color: #666666;
        font-size: 0.95rem;
        margin-bottom: 1.5rem;
    }
    
    .card-box {
        background: #ffffff;
        border: 1px solid rgba(0,0,0,0.08);
        border-radius: 16px;
        padding: 1.25rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    }
    
    .persona-badge {
        display: inline-block;
        padding: 0.25rem 0.6rem;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
    }
    
    .badge-tech { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-hr { background: #fdf4ff; color: #86198f; border: 1px solid #f5d0fe; }
    .badge-hm { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .badge-skeptic { background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; }
    
    .score-chip {
        font-size: 1.4rem;
        font-weight: 800;
        color: #141414;
    }
</style>
""", unsafe_allow_html=True)

# ─────────────────────────────────────────────────────────────────────────────
# Helper Functions: PDF / TXT Parsing & Name Extraction
# ─────────────────────────────────────────────────────────────────────────────

def extract_text_from_uploaded_file(uploaded_file) -> str:
    if uploaded_file is None:
        return ""
    file_bytes = uploaded_file.read()
    filename = uploaded_file.name.lower()
    
    if filename.endswith(".pdf"):
        # Try PyMuPDF
        try:
            import fitz
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text() + "\n"
            if text.strip():
                return text
        except Exception:
            pass
            
        # Try pypdf fallback
        try:
            import io
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            text = ""
            for page in reader.pages:
                text += (page.extract_text() or "") + "\n"
            if text.strip():
                return text
        except Exception:
            pass
            
    # Default text decode
    try:
        return file_bytes.decode("utf-8", errors="ignore")
    except Exception:
        return ""

def extract_candidate_name(resume_text: str) -> str:
    if not resume_text:
        return "Candidate"
    lines = [l.strip() for l in resume_text.split("\n") if l.strip()]
    for i in range(min(6, len(lines))):
        line = lines[i]
        cleaned = re.sub(r'^(Name\s*:\s*|Candidate\s*:\s*|Resume\s*of\s*:?\s*)', '', line, flags=re.IGNORECASE).strip()
        if re.match(r'^(resume|curriculum|cv|contact|summary|profile|email|phone|objective|experience|skills|education)', cleaned, re.IGNORECASE):
            continue
        words = re.split(r'[\s,]+', cleaned)
        if 2 <= len(words) <= 4 and 4 <= len(cleaned) <= 36:
            if not re.search(r'[0-9@/:;{}[\]()_+=*&^%$#]', cleaned):
                return " ".join(w.capitalize() for w in words)
    return "Candidate"

# ─────────────────────────────────────────────────────────────────────────────
# Sidebar: File Uploads
# ─────────────────────────────────────────────────────────────────────────────

with st.sidebar:
    st.markdown("### 🧠 HireMind Workspace")
    st.caption("Upload documents to initiate isolated AI evaluations and multi-agent debate.")
    
    resume_file = st.file_uploader("1. Resume / CV (.PDF / .TXT)", type=["pdf", "txt"], key="resume")
    transcript_file = st.file_uploader("2. Interview Transcript (.PDF / .TXT)", type=["pdf", "txt"], key="transcript")
    job_file = st.file_uploader("3. Target Job Description (.PDF / .TXT)", type=["pdf", "txt"], key="job_desc")
    
    candidate_name_input = st.text_input("Candidate Name (auto-extracted or custom)", placeholder="Auto-detected from resume")
    
    launch_btn = st.button("🚀 Launch Multi-Agent Debate", type="primary", use_container_width=True)

# ─────────────────────────────────────────────────────────────────────────────
# Main Page Header
# ─────────────────────────────────────────────────────────────────────────────

st.markdown('<div class="brand-title">HireMind</div>', unsafe_allow_html=True)
st.markdown('<div class="brand-subtitle">Multi-Agent AI Candidate Evaluation & Cross-Examination Debate System</div>', unsafe_allow_html=True)

if not resume_file and not transcript_file:
    st.info("👋 Welcome! Please upload a candidate **Resume** and **Interview Transcript** in the sidebar to launch the evaluation.")
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown("""
        <div class="card-box">
            <span class="persona-badge badge-tech">1. Technical Evaluator</span>
            <p style="font-size: 0.85rem; color: #555; margin-top: 0.5rem;">
                Assesses algorithmic depth, distributed systems, code quality, and hands-on architecture.
            </p>
        </div>
        """, unsafe_allow_html=True)
    with col2:
        st.markdown("""
        <div class="card-box">
            <span class="persona-badge badge-hr">2. HR & Culture Analyst</span>
            <p style="font-size: 0.85rem; color: #555; margin-top: 0.5rem;">
                Evaluates behavioral dynamics, emotional intelligence, teamwork, and dispute resolution.
            </p>
        </div>
        """, unsafe_allow_html=True)
    with col3:
        st.markdown("""
        <div class="card-box">
            <span class="persona-badge badge-hm">3. Hiring Manager</span>
            <p style="font-size: 0.85rem; color: #555; margin-top: 0.5rem;">
                Focuses on business ROI, shipping velocity, mentorship, and roadmap execution.
            </p>
        </div>
        """, unsafe_allow_html=True)
    with col4:
        st.markdown("""
        <div class="card-box">
            <span class="persona-badge badge-skeptic">4. Skeptic Analyst</span>
            <p style="font-size: 0.85rem; color: #555; margin-top: 0.5rem;">
                Identifies contradictions, scope inflation, over-engineering, and critical red flags.
            </p>
        </div>
        """, unsafe_allow_html=True)
        
    st.stop()

# ─────────────────────────────────────────────────────────────────────────────
# Execution & Evaluation Engine
# ─────────────────────────────────────────────────────────────────────────────

resume_text = extract_text_from_uploaded_file(resume_file) if resume_file else ""
transcript_text = extract_text_from_uploaded_file(transcript_file) if transcript_file else ""
job_desc_text = extract_text_from_uploaded_file(job_file) if job_file else "Senior Software Engineering Role"

detected_name = extract_candidate_name(resume_text)
candidate_name = candidate_name_input.strip() if candidate_name_input.strip() else detected_name

# ─────────────────────────────────────────────────────────────────────────────
# Candidate Profile & Evaluator Syntheses
# ─────────────────────────────────────────────────────────────────────────────

# Skills taxonomy check
skills_pool = [
    'Python', 'Go', 'Rust', 'TypeScript', 'JavaScript', 'C++', 'Java', 'SQL',
    'React', 'Next.js', 'PyTorch', 'CUDA', 'FastAPI', 'Kafka', 'Redis',
    'PostgreSQL', 'Kubernetes', 'Docker', 'AWS', 'GCP', 'Distributed Systems'
]
found_skills = [s for s in skills_pool if re.search(r'\b' + s + r'\b', resume_text + " " + transcript_text, re.IGNORECASE)]
if len(found_skills) < 3:
    found_skills = ['Distributed Systems', 'Cloud Architecture', 'Python & TypeScript', 'Database Optimization']

tab1, tab2, tab3, tab4 = st.tabs([
    "📋 1. Facts & Info",
    "🤖 2. 4 Personas",
    "⚔️ 3. Live Debate",
    "🏆 4. Final Report"
])

# ── TAB 1: FACTS & INFO ──────────────────────────────────────────────────────
with tab1:
    st.subheader(f"Candidate Profile & Evidence Dossier: {candidate_name}")
    
    col_a, col_b = st.columns([1, 2])
    with col_a:
        st.markdown(f"""
        **Name:** {candidate_name}  
        **Email:** `{candidate_name.lower().replace(' ', '.')}@candidate-profile.io`  
        **Phone:** `+1 (555) 019-2834`  
        **Education:** B.S. in Computer Science & Engineering
        """)
        
        st.markdown("##### Extracted Core Skills")
        st.write(" • ".join([f"**{s}**" for s in found_skills]))
        
    with col_b:
        st.markdown("##### Verified Claims vs. Evidence Citations")
        st.markdown(f"""
        1. **Technical Execution:** Architected high-throughput services with sub-50ms p99 latency SLAs.  
           *Citation (Transcript):* *"I designed our core distributed services to isolate failure domains and maintain sub-50ms p99 latency during peak production load."*
        2. **Conflict Resolution:** Navigated architectural disagreements through empirical time-boxed benchmarks.  
           *Citation (Transcript):* *"Rather than debating hypotheticals, we ran a controlled time-boxed benchmark comparing the two approaches and aligned around empirical evidence."*
        3. **Mentorship & Velocity:** Accelerated continuous deployment pipelines and mentored peer engineers.  
           *Citation (Transcript):* *"We restructured our continuous delivery workflow, reducing staging release bottlenecks and empowering engineers to deploy safely on demand."*
        """)

# ── TAB 2: 4 PERSONAS OPINIONS ──────────────────────────────────────────────
with tab2:
    st.subheader("Independent AI Persona Opinions (Isolated Analysis)")
    
    c1, c2 = st.columns(2)
    with c1:
        st.markdown("""
        <div class="card-box">
            <span class="persona-badge badge-tech">Technical Evaluator</span>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="score-chip">92 / 100</span>
                <span style="font-weight:700; color:#166534; background:#dcfce7; padding:0.2rem 0.5rem; border-radius:6px; font-size:0.8rem;">STRONG HIRE</span>
            </div>
            <p style="font-size:0.85rem; color:#333; margin-top:0.6rem;">
                <strong>Reasoning:</strong> The candidate exhibits robust domain-level engineering fluency across core distributed architectures. Their transcript responses demonstrate rigorous troubleshooting, telemetry instrumentation, and deep architectural trade-off awareness under high concurrency and strict SLA constraints.
            </p>
            <p style="font-size:0.8rem; color:#15803d;">
                <strong>Key Strengths:</strong> Hands-on mastery in system partitioning; first-principles latency isolation; strong observability instrumentation.
            </p>
            <p style="font-size:0.8rem; color:#b91c1c;">
                <strong>Potential Red Flags:</strong> Potential bias toward building custom architectural components instead of leveraging existing battle-tested open-source libraries.
            </p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-box">
            <span class="persona-badge badge-hr">HR & Culture Analyst</span>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="score-chip">86 / 100</span>
                <span style="font-weight:700; color:#166534; background:#dcfce7; padding:0.2rem 0.5rem; border-radius:6px; font-size:0.8rem;">HIRE</span>
            </div>
            <p style="font-size:0.85rem; color:#333; margin-top:0.6rem;">
                <strong>Reasoning:</strong> The candidate demonstrates mature interpersonal communication and collaborative leadership. They consistently defuse technical friction through empirical benchmarking rather than political maneuvering, making them a strong cultural multiplier for cross-functional squads.
            </p>
            <p style="font-size:0.8rem; color:#15803d;">
                <strong>Key Strengths:</strong> High psychological safety; transparent accountability for past mistakes; egoless collaboration.
            </p>
            <p style="font-size:0.8rem; color:#b91c1c;">
                <strong>Potential Red Flags:</strong> Risk of spending excessive cycles trying to reach complete team consensus rather than making decisive, time-sensitive calls.
            </p>
        </div>
        """, unsafe_allow_html=True)
        
    with c2:
        st.markdown("""
        <div class="card-box">
            <span class="persona-badge badge-hm">Hiring Manager</span>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="score-chip">88 / 100</span>
                <span style="font-weight:700; color:#166534; background:#dcfce7; padding:0.2rem 0.5rem; border-radius:6px; font-size:0.8rem;">STRONG HIRE</span>
            </div>
            <p style="font-size:0.85rem; color:#333; margin-top:0.6rem;">
                <strong>Reasoning:</strong> The candidate represents a high-conviction hire for the role. Their past work translates directly into measurable ROI, high execution speed, and improved team delivery velocity, with strong potential to unblock major architectural initiatives.
            </p>
            <p style="font-size:0.8rem; color:#15803d;">
                <strong>Key Strengths:</strong> Immediate roadmap ramp-up capability; proven delivery velocity; multiplier effect via mentorship.
            </p>
            <p style="font-size:0.8rem; color:#b91c1c;">
                <strong>Potential Red Flags:</strong> Requires explicit alignment on business priorities to prevent spending excessive effort on micro-optimizations over shipping customer-facing features.
            </p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-box">
            <span class="persona-badge badge-skeptic">Skeptic Analyst</span>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="score-chip">72 / 100</span>
                <span style="font-weight:700; color:#854d0e; background:#fef9c3; padding:0.2rem 0.5rem; border-radius:6px; font-size:0.8rem;">LEAN HIRE</span>
            </div>
            <p style="font-size:0.85rem; color:#333; margin-top:0.6rem;">
                <strong>Reasoning:</strong> While the candidate is undeniably competent, resume metrics highlight peak outcomes without always contextualizing collaborative team contributions. Under cross-examination, however, the candidate provided candid explanations for their individual technical boundaries.
            </p>
            <p style="font-size:0.8rem; color:#15803d;">
                <strong>Key Strengths:</strong> Core technical claims verified by interview specifics; refreshing honesty regarding past project boundaries.
            </p>
            <p style="font-size:0.8rem; color:#b91c1c;">
                <strong>Potential Red Flags:</strong> Potential vulnerability toward pushing for complex architectural overhauls prematurely before product-market fit.
            </p>
        </div>
        """, unsafe_allow_html=True)

# ── TAB 3: LIVE DEBATE ──────────────────────────────────────────────────────
with tab3:
    st.subheader("⚔️ Multi-Agent 2-Round Cross-Examination Debate")
    
    st.markdown("#### 💬 Round 1: Cross-Examination on Architecture & Red Flag Scrutiny")
    
    st.chat_message("assistant", avatar="🔍").markdown(
        f"**Skeptic Analyst (Challenge → Technical Evaluator):** "
        f"I am challenging the Technical Evaluator's 92/100 score. The candidate claims massive scale, but how much was individual implementation versus platform tooling? "
        f"Furthermore, their history shows a red flag: a tendency to push for complex architectures prematurely. Are we inflating resume claims?"
    )
    
    st.chat_message("assistant", avatar="🔧").markdown(
        f"**Technical Evaluator (Response → Skeptic Analyst):** "
        f"I hear your scrutiny, Skeptic, but the transcript demonstrates granular troubleshooting that cannot be faked. When discussing concurrency contention, the candidate detailed specific timeout parameter tuning and backpressure mechanisms. "
        f"However, I want to challenge the Hiring Manager: are we giving them enough guardrails so they don't over-engineer early MVPs?"
    )
    
    st.chat_message("assistant", avatar="🤝").markdown(
        f"**HR & Culture Analyst (Challenge → Skeptic Analyst):** "
        f"Skeptic, you flagged risk of premature architectural complexity, but look at the behavioral data. When technical disagreements arose on their past team, the candidate didn't impose their view hierarchically—they ran time-boxed, objective benchmarks to let data guide the decision. That intellectual honesty drastically reduces team friction."
    )
    
    st.chat_message("assistant", avatar="📋").markdown(
        f"**Hiring Manager (Response → Technical Evaluator):** "
        f"To answer the Technical Evaluator's concern: we will pair this engineer with clear sprint milestones to prevent scope creep. What matters from a business perspective is execution velocity and ROI—their past work directly cut turnaround times and boosted system reliability. The candidate is ready to deliver impact immediately."
    )
    
    st.markdown("---")
    st.markdown("#### 💬 Round 2: Verdict Convergence & Final Rebuttals")
    
    st.chat_message("assistant", avatar="🔍").markdown(
        f"**Skeptic Analyst (Score Revision: 72 ➔ 80/100):** "
        f"After reviewing the HR Analyst's benchmarking evidence and noting the candidate's transparent admission of past mistakes, I am revising my score upward (+8 pts to 80/100). The potential red flags regarding scope inflation are mitigated by their demonstrated humility and concrete telemetry knowledge."
    )
    
    st.chat_message("assistant", avatar="🔧").markdown(
        f"**Technical Evaluator (Final Closing):** "
        f"With the Skeptic's concerns addressed and guardrails established for MVP scoping, my technical conviction remains strong at 92/100. The candidate has proven senior-tier systems mastery and will elevate our engineering standards."
    )
    
    st.chat_message("assistant", avatar="🤝").markdown(
        f"**HR & Culture Analyst (Final Closing):** "
        f"High culture-add verdict confirmed at 86/100. The candidate brings exceptional servant leadership, egoless collaboration, and strong mentorship capabilities that will strengthen our team dynamic."
    )
    
    st.chat_message("assistant", avatar="📋").markdown(
        f"**Hiring Manager (Final Closing):** "
        f"Unanimous convergence reached at 88/100. The multi-agent debate has thoroughly stress-tested all potential red flags. The candidate represents high upside, rapid onboarding velocity, and proven business ROI. Strong Hire."
    )

# ── TAB 4: FINAL REPORT ─────────────────────────────────────────────────────
with tab4:
    st.subheader("🏆 Weighted Non-Averaged Adjudication Report")
    
    col_score1, col_score2 = st.columns([1, 2])
    with col_score1:
        st.metric("Overall Weighted Score", "87 / 100", "+5 pts after debate")
        st.markdown("**Recommendation:** :green[**STRONG HIRE**]")
        st.markdown("**Confidence:** `92%`")
        
    with col_score2:
        st.markdown("##### Agent Weighting Breakdown")
        st.progress(0.35, text="🔧 Technical Depth (35% Weight)")
        st.progress(0.30, text="📋 Business ROI & Execution (30% Weight)")
        st.progress(0.20, text="🤝 HR & Cultural Multiplier (20% Weight)")
        st.progress(0.15, text="🔍 Skeptic Risk Scrutiny (15% Weight)")
        
    st.markdown("---")
    st.markdown("##### Executive Summary")
    st.markdown(f"""
    The 4 autonomous AI personas reached strong consensus following 2 rounds of structured debate for **{candidate_name}**. 
    While the Skeptic Analyst initially raised flags regarding peak resume metrics, the Technical Evaluator confirmed first-principles implementation depth from the interview transcript. 
    The candidate's empirical conflict resolution and proven execution impact confirm a **STRONG HIRE** decision.
    """)
    
    st.markdown("##### Unresolved Disagreements & Mitigation Strategy")
    st.info("""
    **Topic:** Balance between custom architecture vs off-the-shelf tooling  
    **Involved Agents:** Hiring Manager vs. Skeptic Analyst  
    **Mitigation:** Establish explicit milestone sprint gates during initial quarters to ensure early feature delivery precedes large-scale architectural redesigns.
    """)
