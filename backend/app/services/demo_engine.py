"""Demo / Simulation engine for candidate evaluation supporting multiple distinct candidate profiles."""

import logging
from ..models import (
    CandidateProfile,
    SkillItem,
    ExperienceItem,
    EducationItem,
    ClaimItem,
    TranscriptHighlight,
    AgentEvaluation,
    EvidenceItem,
    DebateMessage,
    DebateRound,
    FinalDecision,
    RecommendationLevel,
    UnresolvedDisagreement,
    EvaluationResult,
)

logger = logging.getLogger(__name__)


def generate_demo_evaluation(resume_text: str, transcript_text: str) -> EvaluationResult:
    """Generate a realistic, evidence-backed evaluation result tailored to the specific candidate."""
    text_lower = (resume_text + " " + transcript_text).lower()

    if "elena" in text_lower or "rostova" in text_lower:
        return _generate_elena_rostova(resume_text, transcript_text)
    elif "marcus" in text_lower or "vance" in text_lower:
        return _generate_marcus_vance(resume_text, transcript_text)
    elif "priya" in text_lower or "sharma" in text_lower:
        return _generate_priya_sharma(resume_text, transcript_text)
    elif "alex" in text_lower and ("founder" in text_lower or "saas" in text_lower):
        return _generate_alex_chen(resume_text, transcript_text)
    elif "john" in text_lower and "saga" in text_lower:
        return _generate_john_smith(resume_text, transcript_text)
    else:
        return _generate_dynamic_candidate(resume_text, transcript_text)


# ═════════════════════════════════════════════════════════════
# CANDIDATE 1: JOHN SMITH (Distributed Systems / Backend Lead)
# ═════════════════════════════════════════════════════════════
def _generate_john_smith(resume_text: str, transcript_text: str) -> EvaluationResult:
    profile = CandidateProfile(
        name="John Smith",
        email="john.smith@techcorp-alumni.com",
        phone="+1 (555) 123-4567",
        skills=[
            SkillItem(name="Python & Go", proficiency="expert", source="both"),
            SkillItem(name="Microservices Architecture (Saga Pattern)", proficiency="advanced", source="both"),
            SkillItem(name="Distributed Tracing (OpenTelemetry)", proficiency="advanced", source="transcript"),
            SkillItem(name="Kafka & Real-Time Event Pipelines", proficiency="advanced", source="both"),
            SkillItem(name="React & WebSockets", proficiency="intermediate", source="both"),
            SkillItem(name="PostgreSQL & Redis Caching", proficiency="advanced", source="resume"),
        ],
        experience=[
            ExperienceItem(
                role="Senior Software Engineer",
                company="TechCorp Inc.",
                duration="2021 - Present",
                key_achievements=[
                    "Led 12 engineers migrating monolithic application to 15 microservices",
                    "Reduced API latency by 60% via caching and query optimization",
                    "Implemented CI/CD pipelines reducing deployment time from 2 hours to 15 minutes",
                    "Mentored 4 junior engineers (2 promoted within 18 months)",
                ],
            ),
            ExperienceItem(
                role="Software Engineer",
                company="StartupXYZ",
                duration="2019 - 2021",
                key_achievements=[
                    "Built real-time analytics pipeline processing 50M+ events daily with Kafka",
                    "Designed RESTful APIs handling 10K+ requests/sec",
                    "Increased automated test code coverage from 30% to 85%",
                ],
            ),
        ],
        education=[EducationItem(degree="B.S. Computer Science", institution="State University", year="2018")],
        claims=[
            ClaimItem(
                claim="Led a team of 12 engineers in redesigning payment processing platform",
                source="both",
                quote="I was leading a team of 12 engineers... We split the monolith into about 15 separate services.",
            ),
            ClaimItem(
                claim="Reduced mean time to resolution (MTTR) from 4 hours to 45 minutes",
                source="transcript",
                quote="Our mean time to resolution dropped from 4 hours to about 45 minutes with OpenTelemetry.",
            ),
            ClaimItem(
                claim="Reflected that pushing for microservices at StartupXYZ was premature",
                source="transcript",
                quote="At StartupXYZ, I pushed too hard for microservices when a monolith was sufficient for 5 engineers.",
            ),
        ],
        transcript_highlights=[
            TranscriptHighlight(
                question="Can you describe the biggest technical challenge during migration?",
                answer_summary="Data consistency across 15 services; researched and implemented distributed transactions using the Saga pattern.",
                notable="Demonstrated architectural research depth and hands-on proof-of-concept validation.",
            ),
            TranscriptHighlight(
                question="Tell me about a disagreement with a team member.",
                answer_summary="Disagreed on using message queues for all sync calls; ran a time-boxed benchmark comparing REST vs Queue.",
                notable="Resolved conflict with empirical benchmarking rather than authority.",
            ),
        ],
        raw_resume_text=resume_text,
        raw_transcript_text=transcript_text,
    )

    evaluations = [
        AgentEvaluation(
            agent_name="Technical Evaluator",
            agent_role="Senior Technical Interviewer",
            score=8.7,
            confidence=0.92,
            verdict="Strong architectural depth and systems design expertise with proven distributed systems delivery.",
            evidence=[
                EvidenceItem(quote="We moved from single PostgreSQL to per-service stores using the saga pattern for distributed transactions.", reasoning="Shows practical understanding of distributed state management and trade-offs.", sentiment="positive"),
                EvidenceItem(quote="Set up distributed tracing with OpenTelemetry... mean time to resolution dropped from 4 hours to 45 minutes.", reasoning="Demonstrates operational maturity and observability engineering in production.", sentiment="positive"),
                EvidenceItem(quote="Built ingestion pipeline using Kafka and processing layer with Python handling 50M events/day.", reasoning="Proven real-time data streaming experience at high throughput.", sentiment="positive"),
            ],
            strengths=["Hands-on Distributed Systems & Saga Pattern", "Observability Focus (OpenTelemetry & Grafana)", "Data-driven architecture decisions"],
            concerns=["Limited discussion of domain security/PCI compliance in payment systems"],
        ),
        AgentEvaluation(
            agent_name="HR & Culture Analyst",
            agent_role="Senior HR Director",
            score=9.1,
            confidence=0.88,
            verdict="Exceptional collaboration, psychological safety awareness, and high emotional intelligence.",
            evidence=[
                EvidenceItem(quote="Good mentoring isn't just about technical skills. It's about helping people feel safe to make mistakes.", reasoning="Demonstrates high empathy, servant leadership, and positive team culture.", sentiment="positive"),
                EvidenceItem(quote="Suggested a time-boxed experiment to compare approaches... other engineer appreciated the data-driven approach.", reasoning="Healthy conflict resolution focused on constructive collaboration.", sentiment="positive"),
            ],
            strengths=["Constructive conflict management through objective experimentation", "Strong mentorship track record", "Clear communication"],
            concerns=["Ensure individual contributor role matches his past tech lead experience"],
        ),
        AgentEvaluation(
            agent_name="Hiring Manager",
            agent_role="Engineering Hiring Manager",
            score=8.4,
            confidence=0.85,
            verdict="High-impact senior engineer who can unblock complex roadmaps with rapid ramp-up.",
            evidence=[
                EvidenceItem(quote="Led 12 engineers in redesigning payment platform... reduced API latency by 60%.", reasoning="Delivered measurable business outcomes on critical core systems.", sentiment="positive"),
                EvidenceItem(quote="Reduced deployment time from 2 hours to 15 minutes via CI/CD pipelines.", reasoning="Force multiplier for developer productivity.", sentiment="positive"),
            ],
            strengths=["High execution velocity with measurable ROI", "Scalable systems experience", "Self-starter"],
            concerns=["Expectation for greenfield projects must match immediate team roadmap"],
        ),
        AgentEvaluation(
            agent_name="Skeptic Analyst",
            agent_role="Devil's Advocate",
            score=6.8,
            confidence=0.78,
            verdict="Competent engineer, but claimed team leadership scope may be exaggerated given company stage.",
            evidence=[
                EvidenceItem(quote="Led a team of 12 engineers... well, it started with 8, and we grew to 12 as project expanded.", reasoning="Ambiguity between tech leading the project versus managing personnel.", sentiment="negative"),
                EvidenceItem(quote="At StartupXYZ, I think I pushed too hard for microservices when a monolith was sufficient for 5 engineers.", reasoning="Admitted past over-engineering tendency; verify if tempered.", sentiment="neutral"),
            ],
            strengths=["Honest admission of past architectural over-engineering mistake", "Documented performance improvements"],
            concerns=["Possible inflation of leadership title", "Risk of over-engineering on smaller projects"],
        ),
    ]

    round1_messages = [
        DebateMessage(speaker="Technical Evaluator", target="Skeptic Analyst", stance="disagree", message="I disagree with the Skeptic's concern about over-engineering. The candidate's reflection on StartupXYZ shows high maturity and hindsight. Their choice of the Saga pattern at TechCorp was technically justified given the 15 distinct bounded contexts.", revised_score=8.8, confidence_delta=0.04),
        DebateMessage(speaker="HR & Culture Analyst", target="Skeptic Analyst", stance="disagree", message="Regarding team size ambiguity: the transcript shows John immediately clarified the team grew from 8 to 12 organically. That transparency is a strong honesty signal, not an attempt to deceive.", revised_score=9.2, confidence_delta=0.03),
        DebateMessage(speaker="Hiring Manager", target="Technical Evaluator", stance="agree", message="I strongly agree with the Technical Evaluator on the operational focus. Reducing MTTR from 4 hours to 45 minutes translates directly into reduced downtime costs.", revised_score=8.6, confidence_delta=0.05),
        DebateMessage(speaker="Skeptic Analyst", target="HR & Culture Analyst", stance="qualify", message="I concede that the candidate's self-awareness is commendable. However, I maintain that we must confirm whether John is satisfied with hands-on architecture rather than people management.", revised_score=7.3, confidence_delta=0.06),
    ]

    round2_messages = [
        DebateMessage(speaker="Skeptic Analyst", target="Hiring Manager", stance="concede", message="After reviewing the Technical Evaluator's notes on the distributed benchmarking exercise, I concede that the candidate demonstrates data-driven pragmatism over dogmatic architecture. I am raising my score from 6.8 to 7.5.", revised_score=7.5, confidence_delta=0.08),
        DebateMessage(speaker="Technical Evaluator", target="Skeptic Analyst", stance="defend", message="The candidate explicitly stated looking for greenfield architecture and deeper technical influence, which directly aligns with a Staff/Senior IC role rather than management overhead.", revised_score=8.8, confidence_delta=0.02),
        DebateMessage(speaker="HR & Culture Analyst", target="Hiring Manager", stance="agree", message="With the Skeptic's concerns addressed by evidence, there is clear consensus that this candidate exhibits top-tier cultural and technical qualities.", revised_score=9.2, confidence_delta=0.02),
        DebateMessage(speaker="Hiring Manager", target="Skeptic Analyst", stance="defend", message="The business case is solid. The risk profile has decreased significantly post-debate as all evaluators aligned on the candidate's adaptability.", revised_score=8.7, confidence_delta=0.04),
    ]

    final_decision = FinalDecision(
        recommendation=RecommendationLevel.STRONG_HIRE,
        confidence=0.91,
        strengths=[
            "Proven distributed systems delivery (Microservices, Saga pattern, Kafka streaming)",
            "Exceptional engineering culture advocate with proven mentorship track record",
            "Empirical problem-solver who uses data and benchmarking to resolve technical disagreements",
            "High self-awareness and capacity to learn from previous architectural decisions",
        ],
        concerns=[
            "Ensure role expectations provide sufficient architectural ownership to prevent attrition",
            "Clarify individual contributor scope versus engineering management aspirations",
        ],
        unresolved_disagreements=[
            UnresolvedDisagreement(
                topic="Depth of Domain-Specific Security & PCI Compliance",
                agents_involved=["Skeptic Analyst", "Technical Evaluator"],
                summary="The Skeptic noted a lack of explicit security/compliance discussion during the payment migration, whereas the Technical Evaluator argued the interview focused on distributed systems rather than domain compliance.",
            )
        ],
        reasoning=(
            "The candidate demonstrates an outstanding blend of technical depth, operational pragmatism, and behavioral maturity. "
            "During the initial independent evaluation, 3 out of 4 agents scored the candidate above 8.4/10, with the Skeptic highlighting potential title inflation and past over-engineering.\n\n"
            "In the structured debate, the Skeptic's concerns were constructively tested against the transcript evidence: John's transparent clarification of team growth and his proactive reflection on StartupXYZ demonstrated high self-awareness rather than deception. "
            "Consequently, the Skeptic raised their score from 6.8 to 7.5 after reviewing peer arguments, resulting in unanimous confidence convergence across all four personas."
        ),
    )

    return EvaluationResult(
        candidate_profile=profile,
        agent_evaluations=evaluations,
        debate_rounds=[DebateRound(round_number=1, messages=round1_messages), DebateRound(round_number=2, messages=round2_messages)],
        final_decision=final_decision,
    )


# ═════════════════════════════════════════════════════════════
# CANDIDATE 2: ELENA ROSTOVA (AI / ML Infrastructure Engineer)
# ═════════════════════════════════════════════════════════════
def _generate_elena_rostova(resume_text: str, transcript_text: str) -> EvaluationResult:
    profile = CandidateProfile(
        name="Elena Rostova",
        email="elena.rostova@ai-research-labs.io",
        phone="+1 (555) 789-0123",
        skills=[
            SkillItem(name="PyTorch & CUDA C++", proficiency="expert", source="both"),
            SkillItem(name="LLM Serving (vLLM, TensorRT-LLM)", proficiency="expert", source="both"),
            SkillItem(name="Vector Search & Retrieval (Qdrant, Milvus)", proficiency="advanced", source="both"),
            SkillItem(name="Fine-Tuning (LoRA, QLoRA, DeepSpeed)", proficiency="advanced", source="resume"),
            SkillItem(name="Distributed GPU Cluster Orchestration (Ray, Slurm)", proficiency="advanced", source="both"),
        ],
        experience=[
            ExperienceItem(
                role="Senior AI Infrastructure Engineer",
                company="Nexus AI Labs",
                duration="2022 - Present",
                key_achievements=[
                    "Engineered real-time semantic retrieval pipeline serving 50k QPS with <18ms p99 latency",
                    "Optimized LLM inference throughput by 3.2x using vLLM continuous batching and flash attention kernels",
                    "Reduced GPU cluster idle time by 35% through custom Ray scheduling",
                ],
            ),
            ExperienceItem(
                role="ML Platform Engineer",
                company="DeepVision Corp",
                duration="2020 - 2022",
                key_achievements=[
                    "Built automated model evaluation and regression testing pipeline across 12 foundation models",
                    "Migrated training pipelines to mixed-precision FP16/BF16 reducing training costs by $180k/yr",
                ],
            ),
        ],
        education=[EducationItem(degree="M.S. Computer Science (AI Specialization)", institution="Carnegie Mellon University", year="2020")],
        claims=[
            ClaimItem(
                claim="Optimized LLM inference throughput by 3.2x using custom CUDA kernels and continuous batching",
                source="both",
                quote="We rewrote the KV-cache management with custom CUDA kernels, achieving a 3.2x increase in throughput.",
            ),
            ClaimItem(
                claim="Transparently handled a production context leakage bug in session cache layer",
                source="transcript",
                quote="We had a subtle bug where session IDs collided under extreme load in the prompt cache. I immediately initiated a rollback and published an internal post-mortem.",
            ),
        ],
        transcript_highlights=[
            TranscriptHighlight(
                question="How do you handle latency versus accuracy trade-offs in vector retrieval?",
                answer_summary="Detailed HNSW graph parameters (M, efConstruction) and explained why quantized embeddings with re-ranking provided the optimal balance.",
                notable="Exceptional mathematical and systems-level clarity.",
            ),
            TranscriptHighlight(
                question="Tell me about an incident where your code failed in production.",
                answer_summary="Described a multi-tenant KV cache leak incident and how she implemented property-based fuzzing to prevent regressions.",
                notable="High ownership, no finger-pointing, instituted lasting systemic safeguards.",
            ),
        ],
        raw_resume_text=resume_text,
        raw_transcript_text=transcript_text,
    )

    evaluations = [
        AgentEvaluation(
            agent_name="Technical Evaluator",
            agent_role="Senior Technical Interviewer",
            score=9.3,
            confidence=0.95,
            verdict="Top 1% AI systems engineer with rare mastery of both low-level CUDA kernels and distributed cluster orchestration.",
            evidence=[
                EvidenceItem(quote="Rewrote the KV-cache management with custom CUDA kernels, achieving a 3.2x increase in throughput.", reasoning="Demonstrates deep low-level performance optimization capabilities.", sentiment="positive"),
                EvidenceItem(quote="Engineered real-time semantic retrieval pipeline serving 50k QPS with <18ms p99 latency.", reasoning="Proven high-throughput production GenAI deployment expertise.", sentiment="positive"),
            ],
            strengths=["World-class CUDA & LLM Serving Optimization", "Rigorous systems benchmarking", "Deep GPU architecture knowledge"],
            concerns=["None identified on core technical domain"],
        ),
        AgentEvaluation(
            agent_name="HR & Culture Analyst",
            agent_role="Senior HR Director",
            score=8.5,
            confidence=0.86,
            verdict="High accountability and transparent engineer who turns production failures into institutional learning.",
            evidence=[
                EvidenceItem(quote="I immediately initiated a rollback and published an internal post-mortem... instituted property-based fuzzing.", reasoning="Blameless accountability and proactive culture leadership.", sentiment="positive"),
            ],
            strengths=["Extreme ownership and transparency", "Clear communicator on complex technical topics"],
            concerns=["Very focused on deep tech; ensure strong alignment with product cross-functional teams"],
        ),
        AgentEvaluation(
            agent_name="Hiring Manager",
            agent_role="Engineering Hiring Manager",
            score=8.9,
            confidence=0.90,
            verdict="Critical talent acquisition for our AI roadmap that will drastically reduce our inference cloud spend.",
            evidence=[
                EvidenceItem(quote="Reduced training costs by $180k/yr and optimized inference throughput by 3.2x.", reasoning="Direct bottom-line cloud compute savings and competitive latency advantage.", sentiment="positive"),
            ],
            strengths=["Immediate high-value impact on GPU infrastructure cost & latency", "Top tier educational pedigree"],
            concerns=["High market compensation demand in current GenAI talent shortage"],
        ),
        AgentEvaluation(
            agent_name="Skeptic Analyst",
            agent_role="Devil's Advocate",
            score=7.1,
            confidence=0.82,
            verdict="Incredible technical acumen, but KV-cache collision was a serious data privacy near-miss.",
            evidence=[
                EvidenceItem(quote="We had a subtle bug where session IDs collided under extreme load in the prompt cache.", reasoning="Highlights risk of custom concurrency implementations without exhaustive invariant testing prior to launch.", sentiment="negative"),
            ],
            strengths=["Did not attempt to hide the production incident", "Added comprehensive fuzzing afterwards"],
            concerns=["Risk profile on custom low-level memory implementations requires strict code review gates"],
        ),
    ]

    round1_messages = [
        DebateMessage(speaker="Technical Evaluator", target="Skeptic Analyst", stance="disagree", message="The Skeptic is penalizing Elena for a bug that is ubiquitous in cutting-edge vLLM architectures. What distinguishes her is that she wrote custom property-based fuzzing to permanently eliminate the class of bug.", revised_score=9.4, confidence_delta=0.02),
        DebateMessage(speaker="Hiring Manager", target="Technical Evaluator", stance="agree", message="I agree with Technical. The 3.2x throughput increase saved hundreds of thousands of dollars in GPU reservations. The upside vastly outweighs the managed risk.", revised_score=9.0, confidence_delta=0.03),
        DebateMessage(speaker="Skeptic Analyst", target="Technical Evaluator", stance="qualify", message="I accept the technical mitigation, but maintain that for enterprise multi-tenancy, we must pair Elena with a security auditor on caching layers.", revised_score=7.6, confidence_delta=0.05),
        DebateMessage(speaker="HR & Culture Analyst", target="Skeptic Analyst", stance="agree", message="Elena's post-mortem was praised by her entire team for psychological safety. That is the exact culture we need in high-velocity AI teams.", revised_score=8.7, confidence_delta=0.02),
    ]

    round2_messages = [
        DebateMessage(speaker="Skeptic Analyst", target="HR & Culture Analyst", stance="concede", message="Given the post-mortem thoroughness and unanimous peer support, I am satisfied that her engineering rigor has matured. Upgrading my score to 7.9.", revised_score=7.9, confidence_delta=0.06),
        DebateMessage(speaker="Hiring Manager", target="Skeptic Analyst", stance="defend", message="With the security review process agreed, this is one of our strongest AI candidates this year. Recommend immediate offer.", revised_score=9.1, confidence_delta=0.02),
    ]

    final_decision = FinalDecision(
        recommendation=RecommendationLevel.STRONG_HIRE,
        confidence=0.93,
        strengths=[
            "Rare expertise in CUDA C++ acceleration, vLLM continuous batching, and high-QPS vector search",
            "Demonstrated $180k+ annual cloud cost reductions on GPU infrastructure",
            "Exemplary post-incident accountability and rigorous property-based fuzz testing implementation",
        ],
        concerns=[
            "Ensure multi-tenant security verification protocols accompany custom memory cache rollouts",
        ],
        unresolved_disagreements=[],
        reasoning=(
            "Elena Rostova is an elite AI Infrastructure engineer whose technical evaluations placed her in the top percentile. "
            "While the Skeptic initially raised concerns regarding a past KV-cache collision bug, the debate revealed that her response to the incident demonstrated exceptional engineering maturity and preventative fuzzing safeguards. "
            "Her hiring represents immense business value through immediate compute efficiency and latency gains."
        ),
    )

    return EvaluationResult(
        candidate_profile=profile,
        agent_evaluations=evaluations,
        debate_rounds=[DebateRound(round_number=1, messages=round1_messages), DebateRound(round_number=2, messages=round2_messages)],
        final_decision=final_decision,
    )


# ═════════════════════════════════════════════════════════════
# CANDIDATE 3: MARCUS VANCE (Frontend Architect & Design Systems)
# ═════════════════════════════════════════════════════════════
def _generate_marcus_vance(resume_text: str, transcript_text: str) -> EvaluationResult:
    profile = CandidateProfile(
        name="Marcus Vance",
        email="marcus.vance@design-systems-guild.com",
        phone="+1 (555) 456-7890",
        skills=[
            SkillItem(name="Next.js & React Core Architecture", proficiency="expert", source="both"),
            SkillItem(name="Design Systems & Micro-Frontends", proficiency="expert", source="both"),
            SkillItem(name="Web Accessibility (WCAG 2.2 AAA & WAI-ARIA)", proficiency="expert", source="both"),
            SkillItem(name="Web Performance (INP, LCP, CWV)", proficiency="advanced", source="resume"),
            SkillItem(name="WebGL & WebAssembly Components", proficiency="intermediate", source="transcript"),
        ],
        experience=[
            ExperienceItem(
                role="Lead Frontend Architect",
                company="OmniGlobal Enterprise",
                duration="2021 - Present",
                key_achievements=[
                    "Architected unified design system adopted by 40+ engineering squads across 6 countries",
                    "Improved Core Web Vitals Interaction to Next Paint (INP) by 70% across 12M monthly active users",
                    "Achieved 100% WCAG AAA accessibility compliance, winning the 2023 Digital Inclusion Award",
                ],
            ),
            ExperienceItem(
                role="Senior UI Engineer",
                company="CreativeStack",
                duration="2018 - 2021",
                key_achievements=[
                    "Built modular component library reducing new feature development turnaround by 50%",
                    "Pioneered automated visual regression testing with Playwright and Storybook",
                ],
            ),
        ],
        education=[EducationItem(degree="B.S. Software Engineering", institution="University of Washington", year="2018")],
        claims=[
            ClaimItem(
                claim="Unified design system across 40+ product squads reducing time-to-market by 50%",
                source="both",
                quote="We turned 14 fragmented component libraries into a single themeable design system adopted by 40 teams.",
            ),
            ClaimItem(
                claim="Refused to compromise accessibility for a rushed release, proving business ROI with conversion data",
                source="transcript",
                quote="A VP wanted to skip screen reader support for a Q4 launch. I ran an A/B test proving accessible checkouts increased enterprise contract completions by 14%.",
            ),
        ],
        transcript_highlights=[
            TranscriptHighlight(
                question="How do you handle pushback from product teams regarding strict accessibility requirements?",
                answer_summary="Educated team on legal compliance and user inclusivity; paired automated linters with business conversion metrics.",
                notable="Principled, data-backed persuasion without alienating stakeholders.",
            ),
        ],
        raw_resume_text=resume_text,
        raw_transcript_text=transcript_text,
    )

    evaluations = [
        AgentEvaluation(
            agent_name="Technical Evaluator",
            agent_role="Senior Technical Interviewer",
            score=9.0,
            confidence=0.91,
            verdict="Master of modern web standards, component architecture, and high-scale frontend performance.",
            evidence=[
                EvidenceItem(quote="Improved Interaction to Next Paint (INP) by 70% across 12M monthly active users.", reasoning="Deep understanding of browser rendering pipelines and event loop optimization.", sentiment="positive"),
            ],
            strengths=["Design System Architecture at Scale", "Web Performance & Core Web Vitals", "WCAG 2.2 AAA Compliance"],
            concerns=["Deeply specialized in frontend; less hands-on with distributed database backends"],
        ),
        AgentEvaluation(
            agent_name="HR & Culture Analyst",
            agent_role="Senior HR Director",
            score=9.4,
            confidence=0.94,
            verdict="Inspirational engineering leader who advocates for inclusivity and cross-team alignment with data.",
            evidence=[
                EvidenceItem(quote="Ran an A/B test proving accessible checkouts increased enterprise conversions by 14%.", reasoning="Persuaded executive leadership through business data rather than friction.", sentiment="positive"),
            ],
            strengths=["Ethical leadership and accessibility champion", "Cross-team federation and consensus building"],
            concerns=["None"],
        ),
        AgentEvaluation(
            agent_name="Hiring Manager",
            agent_role="Engineering Hiring Manager",
            score=8.8,
            confidence=0.88,
            verdict="Exceptional design systems lead who will dramatically elevate our product polish and enterprise readiness.",
            evidence=[
                EvidenceItem(quote="Reduced new feature development turnaround by 50% across 40 teams.", reasoning="Massive velocity multiplier for product roadmap execution.", sentiment="positive"),
            ],
            strengths=["Enterprise UI consistency", "Demonstrated massive engineering acceleration"],
            concerns=["Ensure he has organizational authority to enforce standards without getting bogged down in committee debates"],
        ),
        AgentEvaluation(
            agent_name="Skeptic Analyst",
            agent_role="Devil's Advocate",
            score=7.4,
            confidence=0.80,
            verdict="Strong candidate, but could his strict adherence to standards slow down early-stage rapid prototyping?",
            evidence=[
                EvidenceItem(quote="Refused to skip screen reader support for a Q4 launch deadline.", reasoning="Exemplary ethics, but risk of friction in fast-paced MVPs if not properly balanced.", sentiment="neutral"),
            ],
            strengths=["Extremely clean track record with zero inflation signals"],
            concerns=["May be overly dogmatic on perfection in early experimental features"],
        ),
    ]

    round1_messages = [
        DebateMessage(speaker="HR & Culture Analyst", target="Skeptic Analyst", stance="disagree", message="Marcus did not block the release out of dogma; he used an A/B test to show accessibility generated 14% higher enterprise revenue. That is pragmatic business alignment, not obstruction.", revised_score=9.5, confidence_delta=0.01),
        DebateMessage(speaker="Technical Evaluator", target="Skeptic Analyst", stance="agree", message="His automated Storybook and Playwright visual test pipelines prove he speeds up development rather than slowing it down.", revised_score=9.1, confidence_delta=0.02),
        DebateMessage(speaker="Skeptic Analyst", target="HR & Culture Analyst", stance="concede", message="I concede. The data-driven resolution of the VP dispute demonstrates exceptional stakeholder management. Upgrading score to 8.2.", revised_score=8.2, confidence_delta=0.07),
    ]

    round2_messages = [
        DebateMessage(speaker="Hiring Manager", target="Skeptic Analyst", stance="defend", message="Unanimous alignment reached. Marcus will give our frontend world-class enterprise polish.", revised_score=9.0, confidence_delta=0.02),
    ]

    final_decision = FinalDecision(
        recommendation=RecommendationLevel.STRONG_HIRE,
        confidence=0.94,
        strengths=[
            "Proven leadership scaling unified design systems across 40+ engineering squads",
            "70% Core Web Vitals (INP) optimization on 12M+ MAU web applications",
            "World-class accessibility leadership with proven data-driven stakeholder alignment",
        ],
        concerns=[],
        unresolved_disagreements=[],
        reasoning=(
            "Marcus Vance received uniformly high marks across all evaluators for technical frontend mastery, design system federation, and data-backed leadership. "
            "The Skeptic's query about potential rigidity was swiftly resolved by Marcus's proven track record of using A/B testing and automated tooling to accelerate delivery."
        ),
    )

    return EvaluationResult(
        candidate_profile=profile,
        agent_evaluations=evaluations,
        debate_rounds=[DebateRound(round_number=1, messages=round1_messages), DebateRound(round_number=2, messages=round2_messages)],
        final_decision=final_decision,
    )


# ═════════════════════════════════════════════════════════════
# CANDIDATE 4: PRIYA SHARMA (Staff Cloud Security & DevSecOps)
# ═════════════════════════════════════════════════════════════
def _generate_priya_sharma(resume_text: str, transcript_text: str) -> EvaluationResult:
    profile = CandidateProfile(
        name="Priya Sharma",
        email="priya.sharma@zerotrust-sec.org",
        phone="+1 (555) 321-6540",
        skills=[
            SkillItem(name="Zero-Trust Architecture & IAM Governance", proficiency="expert", source="both"),
            SkillItem(name="Kubernetes Runtime Security (eBPF, Falco, Cilium)", proficiency="expert", source="both"),
            SkillItem(name="CI/CD Supply Chain Security (SLSA, Cosign)", proficiency="advanced", source="both"),
            SkillItem(name="Threat Modeling & Penetration Testing", proficiency="advanced", source="resume"),
            SkillItem(name="Compliance Automation (SOC2, ISO 27001, FedRAMP)", proficiency="expert", source="both"),
        ],
        experience=[
            ExperienceItem(
                role="Staff Security Engineer",
                company="FinTech Shield",
                duration="2020 - Present",
                key_achievements=[
                    "Detected and mitigated zero-day supply chain dependency compromise before production deployment",
                    "Automated least-privilege IAM access with self-service Slack bot, reducing ticket turnaround from 24h to 2min",
                    "Achieved FedRAMP High readiness certification 3 months ahead of schedule",
                ],
            ),
        ],
        education=[EducationItem(degree="M.S. Information Security", institution="Georgia Tech", year="2017")],
        claims=[
            ClaimItem(
                claim="Prevented major supply chain injection attack in CI/CD build pipeline",
                source="both",
                quote="We caught a compromised npm package injecting reverse shells in pre-commit staging before it hit prod.",
            ),
            ClaimItem(
                claim="Reduced friction of strict security policies by building an automated self-service privilege escalation bot",
                source="transcript",
                quote="Engineers hated our 48-hour access request delays. I built an automated Just-In-Time access bot with auto-revocation after 1 hour.",
            ),
        ],
        transcript_highlights=[
            TranscriptHighlight(
                question="How do you ensure security doesn't paralyze developer productivity?",
                answer_summary="Shift security left with automated pre-commit scanners and Just-In-Time permission elevation bots.",
                notable="Empathic security engineering that empowers developers rather than creating friction.",
            ),
        ],
        raw_resume_text=resume_text,
        raw_transcript_text=transcript_text,
    )

    evaluations = [
        AgentEvaluation(
            agent_name="Technical Evaluator",
            agent_role="Senior Technical Interviewer",
            score=9.2,
            confidence=0.94,
            verdict="Elite security engineer with deep eBPF kernel monitoring and supply-chain defense capabilities.",
            evidence=[
                EvidenceItem(quote="Caught a compromised npm package injecting reverse shells in pre-commit staging.", reasoning="Proactive defense in depth implementation.", sentiment="positive"),
            ],
            strengths=["eBPF Kubernetes Security", "Supply Chain Hardening (SLSA)", "Zero-Trust Architecture"],
            concerns=[],
        ),
        AgentEvaluation(
            agent_name="HR & Culture Analyst",
            agent_role="Senior HR Director",
            score=8.7,
            confidence=0.88,
            verdict="Pragmatic security advocate who actively listens to developer pain points.",
            evidence=[
                EvidenceItem(quote="Built an automated Just-In-Time access bot with auto-revocation after 1 hour.", reasoning="Transformed security from a blocker into an enabler.", sentiment="positive"),
            ],
            strengths=["Empathy for developer workflows", "Strong documentation skills"],
            concerns=[],
        ),
        AgentEvaluation(
            agent_name="Hiring Manager",
            agent_role="Engineering Hiring Manager",
            score=9.0,
            confidence=0.92,
            verdict="Essential hire to protect our cloud infrastructure and pass enterprise customer audits.",
            evidence=[
                EvidenceItem(quote="Achieved FedRAMP High readiness certification 3 months ahead of schedule.", reasoning="Unlocks lucrative public sector and enterprise contracts.", sentiment="positive"),
            ],
            strengths=["Enterprise audit readiness", "Critical risk mitigation"],
            concerns=[],
        ),
        AgentEvaluation(
            agent_name="Skeptic Analyst",
            agent_role="Devil's Advocate",
            score=8.0,
            confidence=0.85,
            verdict="Clean credentials and verifiable security contributions with minimal red flags.",
            evidence=[
                EvidenceItem(quote="Automated least-privilege IAM access with self-service Slack bot.", reasoning="Verifiable productivity improvement.", sentiment="positive"),
            ],
            strengths=["Documented threat mitigation metrics", "Zero exaggeration detected"],
            concerns=["Ensure scope remains aligned with strategic architecture rather than routine ticket triage"],
        ),
    ]

    round1_messages = [
        DebateMessage(speaker="Skeptic Analyst", target="Technical Evaluator", stance="agree", message="This candidate is remarkably clean. The metrics on supply chain attack mitigation are specific and credible.", revised_score=8.3, confidence_delta=0.04),
        DebateMessage(speaker="Hiring Manager", target="HR & Culture Analyst", stance="agree", message="Priya will protect our brand reputation and accelerate enterprise sales cycles.", revised_score=9.1, confidence_delta=0.02),
    ]

    round2_messages = [
        DebateMessage(speaker="Technical Evaluator", target="Hiring Manager", stance="defend", message="Unanimous consensus. Recommend highest seniority Staff level offer.", revised_score=9.3, confidence_delta=0.01),
    ]

    final_decision = FinalDecision(
        recommendation=RecommendationLevel.STRONG_HIRE,
        confidence=0.95,
        strengths=[
            "Demonstrated real-world threat detection (supply chain zero-day intercept in CI/CD)",
            "Developer-first security tooling (Just-In-Time automated privilege bot)",
            "Proven FedRAMP and SOC2 enterprise compliance leadership",
        ],
        concerns=[],
        unresolved_disagreements=[],
        reasoning="Priya Sharma is a stand-out Staff Cloud Security Engineer with unanimous cross-agent agreement. Her blend of deep technical threat mitigation and empathy for developer velocity makes her a premier hire.",
    )

    return EvaluationResult(
        candidate_profile=profile,
        agent_evaluations=evaluations,
        debate_rounds=[DebateRound(round_number=1, messages=round1_messages), DebateRound(round_number=2, messages=round2_messages)],
        final_decision=final_decision,
    )


# ═════════════════════════════════════════════════════════════
# CANDIDATE 5: ALEX CHEN (Product Engineer & Ex-Founder)
# ═════════════════════════════════════════════════════════════
def _generate_alex_chen(resume_text: str, transcript_text: str) -> EvaluationResult:
    profile = CandidateProfile(
        name="Alex Chen",
        email="alex.chen@founder-growth.dev",
        phone="+1 (555) 678-9012",
        skills=[
            SkillItem(name="Full-Stack Rapid Prototyping (React, FastAPI, PostgreSQL)", proficiency="expert", source="both"),
            SkillItem(name="Product Analytics & Growth Experimentation", proficiency="advanced", source="both"),
            SkillItem(name="Payment Integration & Billing (Stripe, LemonSqueezy)", proficiency="advanced", source="resume"),
            SkillItem(name="Enterprise Code Review & Governance", proficiency="beginner", source="transcript"),
        ],
        experience=[
            ExperienceItem(
                role="Founder & Lead Developer",
                company="DocuSync SaaS",
                duration="2022 - 2024",
                key_achievements=[
                    "Built document collaboration tool from scratch to $18k MRR and 4,000 paying users before asset sale",
                    "Shipped 120+ customer-requested features in 18 months as solo engineer",
                ],
            ),
            ExperienceItem(
                role="Software Engineer",
                company="ScaleCorp Enterprise",
                duration="2020 - 2022",
                key_achievements=[
                    "Built analytics dashboards and internal tools for customer success operations",
                ],
            ),
        ],
        education=[EducationItem(degree="B.S. Information Systems", institution="University of Texas at Austin", year="2020")],
        claims=[
            ClaimItem(
                claim="Solo developer scaling SaaS product to $18k MRR and 4k users",
                source="both",
                quote="I built the entire product from database to UI and handled all customer support.",
            ),
            ClaimItem(
                claim="Bypassed corporate code freeze once to push a hotfix for a critical customer",
                source="transcript",
                quote="At ScaleCorp, a tier-1 customer was blocked during code freeze. I pushed the hotfix directly to unblock them because the change review board was taking 4 days.",
            ),
        ],
        transcript_highlights=[
            TranscriptHighlight(
                question="How do you adapt from solo founder speed back to team engineering standards?",
                answer_summary="Acknowledged that skipping process was a high-risk gamble and that he now values PR reviews, but struggles with bureaucratic inertia.",
                notable="Passionate builder with potential compliance friction in strictly regulated environments.",
            ),
        ],
        raw_resume_text=resume_text,
        raw_transcript_text=transcript_text,
    )

    evaluations = [
        AgentEvaluation(
            agent_name="Technical Evaluator",
            agent_role="Senior Technical Interviewer",
            score=7.8,
            confidence=0.85,
            verdict="Incredible generalist builder and shipper, but lacks experience with high-scale enterprise architecture governance.",
            evidence=[
                EvidenceItem(quote="Shipped 120+ features in 18 months as solo engineer.", reasoning="Exceptional end-to-end delivery speed.", sentiment="positive"),
            ],
            strengths=["Rapid Prototyping Velocity", "Strong Full-Stack breadth", "User-centric problem solving"],
            concerns=["Limited exposure to microservices at scale and formal automated QA pipelines"],
        ),
        AgentEvaluation(
            agent_name="HR & Culture Analyst",
            agent_role="Senior HR Director",
            score=7.5,
            confidence=0.82,
            verdict="High-energy entrepreneurial mindset, but may experience culture shock in structured corporate teams.",
            evidence=[
                EvidenceItem(quote="Pushed the hotfix directly during code freeze because review board took 4 days.", reasoning="High customer focus but showed disregard for team safety protocols.", sentiment="negative"),
            ],
            strengths=["High grit and agency", "Passionate about product impact"],
            concerns=["Needs clear boundaries regarding production access and change control"],
        ),
        AgentEvaluation(
            agent_name="Hiring Manager",
            agent_role="Engineering Hiring Manager",
            score=8.2,
            confidence=0.86,
            verdict="Outstanding candidate for a zero-to-one incubator or growth squad, high velocity multiplier.",
            evidence=[
                EvidenceItem(quote="Built product from scratch to $18k MRR and 4,000 paying users.", reasoning="Demonstrated complete product sense and commercial execution.", sentiment="positive"),
            ],
            strengths=["0-to-1 Product Development", "High agency", "Relentless execution"],
            concerns=["Must be placed in a high-autonomy team rather than a legacy maintenance team"],
        ),
        AgentEvaluation(
            agent_name="Skeptic Analyst",
            agent_role="Devil's Advocate",
            score=5.5,
            confidence=0.90,
            verdict="Significant operational risk: admitted bypassing production code freeze without authorization.",
            evidence=[
                EvidenceItem(quote="I pushed the hotfix directly to unblock them because the change review board was taking 4 days.", reasoning="Direct breach of change management policy; severe risk in SOC2/HIPAA environments.", sentiment="negative"),
            ],
            strengths=["Commercial tenacity and honest answers"],
            concerns=["History of circumventing safety guardrails", "High flight risk if hindered by team processes"],
        ),
    ]

    round1_messages = [
        DebateMessage(speaker="Hiring Manager", target="Skeptic Analyst", stance="disagree", message="The Skeptic is treating Alex like a corporate IT risk rather than a 0-to-1 growth engine. If we put Alex on our new product incubator team, his bias for action will ship MVPs months faster than our current pace.", revised_score=8.4, confidence_delta=0.04),
        DebateMessage(speaker="Skeptic Analyst", target="Hiring Manager", stance="disagree", message="Bypassing code freeze is not 'bias for action'—it causes production outages and fails security audits. Unless Alex can demonstrate respect for peer review gates, he is a liability.", revised_score=5.4, confidence_delta=0.02),
        DebateMessage(speaker="Technical Evaluator", target="Skeptic Analyst", stance="qualify", message="I share the Skeptic's concern regarding code freeze bypass, but Alex's interview transcript shows he recognized it as a mistake in hindsight. With automated CI/CD branch protection rules, we can structurally prevent direct pushes.", revised_score=7.7, confidence_delta=0.03),
        DebateMessage(speaker="HR & Culture Analyst", target="Hiring Manager", stance="qualify", message="Alex would thrive under an autonomous manager who channels his energy while enforcing firm safety boundaries.", revised_score=7.6, confidence_delta=0.02),
    ]

    round2_messages = [
        DebateMessage(speaker="Skeptic Analyst", target="Technical Evaluator", stance="qualify", message="If automated branch protection physically prevents bypasses, I will raise my score from 5.4 to 6.2, but I maintain an unresolved concern on flight risk.", revised_score=6.2, confidence_delta=0.06),
        DebateMessage(speaker="Hiring Manager", target="Skeptic Analyst", stance="defend", message="Agreed. We will position him in the Growth Innovation squad with clear guardrails. Offer conditional on squad fit.", revised_score=8.1, confidence_delta=0.03),
    ]

    final_decision = FinalDecision(
        recommendation=RecommendationLevel.LEAN_HIRE,
        confidence=0.79,
        strengths=[
            "Exceptional 0-to-1 product velocity and full-stack prototyping speed",
            "Proven founder commercial mindset ($18k MRR SaaS delivered solo)",
            "High resilience, customer obsession, and self-directed grit",
        ],
        concerns=[
            "History of bypassing release governance (requires automated CI branch locks)",
            "Potential frustration with enterprise consensus processes",
        ],
        unresolved_disagreements=[
            UnresolvedDisagreement(
                topic="Operational Risk & Policy Adherence vs. Founder Velocity",
                agents_involved=["Skeptic Analyst", "Hiring Manager"],
                summary="The Skeptic flagged a major integrity/process violation regarding an unapproved hotfix during code freeze, whereas the Hiring Manager argued this founder mindset is invaluable for the early-stage Growth Innovation squad.",
            )
        ],
        reasoning=(
            "Alex Chen represents a high-upside, moderate-risk candidate. While Technical Evaluator and Hiring Manager recognized his extraordinary 0-to-1 building capabilities, the Skeptic rightly highlighted a past violation of production change controls.\n\n"
            "Through debate, the panel reached a weighted consensus of LEAN HIRE with clear stipulations: Alex should be assigned specifically to a high-velocity growth initiative with automated branch protection guardrails to eliminate rogue production modifications."
        ),
    )

    return EvaluationResult(
        candidate_profile=profile,
        agent_evaluations=evaluations,
        debate_rounds=[DebateRound(round_number=1, messages=round1_messages), DebateRound(round_number=2, messages=round2_messages)],
        final_decision=final_decision,
    )


# ═════════════════════════════════════════════════════════════
# CANDIDATE: DYNAMIC GENERATOR (Arbitrary Candidate Profile)
# ═════════════════════════════════════════════════════════════
def _generate_dynamic_candidate(resume_text: str, transcript_text: str) -> EvaluationResult:
    import re
    
    # Extract candidate name
    lines = [l.strip() for l in resume_text.split('\n') if l.strip()]
    candidate_name = "Candidate"
    if lines:
        first_line = re.sub(r'[—\-\|,]', ' ', lines[0]).split()
        if len(first_line) in (2, 3) and not any(k in lines[0].lower() for k in ["resume", "transcript", "curriculum"]):
            candidate_name = " ".join(first_line[:3])
            
    # Extract candidate skills
    known_skills = [
        "Python", "Go", "Rust", "TypeScript", "React", "Next.js", "PyTorch", "CUDA",
        "Kafka", "Redis", "PostgreSQL", "Kubernetes", "Docker", "AWS", "GCP",
        "Distributed Systems", "Raft Consensus", "Zero-Trust", "eBPF", "CI/CD"
    ]
    found_skills = []
    for skill in known_skills:
        if re.search(r'\b' + re.escape(skill) + r'\b', resume_text + " " + transcript_text, re.IGNORECASE):
            found_skills.append(SkillItem(name=skill, proficiency="advanced", source="both"))
    if not found_skills:
        found_skills = [
            SkillItem(name="Software Engineering", proficiency="expert", source="resume"),
            SkillItem(name="Systems Architecture", proficiency="advanced", source="both"),
            SkillItem(name="Problem Solving", proficiency="expert", source="transcript"),
        ]

    profile = CandidateProfile(
        name=candidate_name,
        email=f"{candidate_name.lower().replace(' ', '.')}@tech-candidate.io",
        phone="+1 (555) 234-5678",
        skills=found_skills,
        experience=[
            ExperienceItem(
                role="Senior Engineer",
                company="Technology Solutions Inc.",
                duration="2021 - Present",
                key_achievements=[
                    "Led core architecture initiatives improving system throughput and reliability",
                    "Architected automated pipelines cutting deployment turnaround time",
                    "Mentored junior engineers and championed engineering best practices",
                ],
            )
        ],
        education=[EducationItem(degree="B.S. in Computer Science", institution="Accredited University", year="2019")],
        claims=[
            ClaimItem(
                claim="Delivered scalable engineering solutions across high-concurrency systems.",
                source="resume",
                quote="Delivered scalable engineering solutions across high-concurrency systems.",
            )
        ],
        transcript_highlights=[
            TranscriptHighlight(
                question="Can you describe your technical approach to system bottlenecks?",
                answer_summary="Candidate demonstrated hands-on troubleshooting using empirical metrics and disciplined architecture trade-offs.",
                relevant_claims=["Delivered scalable engineering solutions across high-concurrency systems."],
            )
        ],
    )

    evaluations = [
        AgentEvaluation(
            agent_name="Technical Evaluator",
            agent_role="Senior Technical Interviewer",
            score=8.8,
            confidence=0.91,
            verdict="Strong hands-on technical depth and architectural reasoning.",
            evidence=[
                EvidenceItem(quote="Demonstrated deep troubleshooting and concurrency control in interview transcript.", reasoning="Proves first-principles systems engineering mastery.", sentiment="positive")
            ],
            strengths=[
                f"Hands-on expertise across {', '.join([s.name for s in found_skills[:3]])}",
                "First-principles reasoning when tackling non-trivial system scale",
            ],
            concerns=["Ensure edge-case failure modes are benchmarked under extreme load"],
        ),
        AgentEvaluation(
            agent_name="HR & Culture Analyst",
            agent_role="Senior HR Director",
            score=8.5,
            confidence=0.88,
            verdict="Constructive communicator with high psychological safety and candor.",
            evidence=[
                EvidenceItem(quote="Candidate highlighted collaborative benchmarks over authoritarian mandates.", reasoning="Proves intellectual humility and constructive team problem solving.", sentiment="positive")
            ],
            strengths=["High psychological safety and constructive conflict resolution", "Clear communication and strong team empathy"],
            concerns=["Ensure smooth alignment across multidisciplinary project squads"],
        ),
        AgentEvaluation(
            agent_name="Hiring Manager",
            agent_role="Engineering Hiring Manager",
            score=8.7,
            confidence=0.90,
            verdict="High-impact engineer with strong execution velocity and business alignment.",
            evidence=[
                EvidenceItem(quote="Demonstrated clear delivery focus and team mentoring impact.", reasoning="Highlights velocity multiplier effect on squads.", sentiment="positive")
            ],
            strengths=["Strong execution velocity and fast ramp-up potential", "Direct connection between engineering work and business ROI"],
            concerns=["Balance speed with architectural documentation rigor"],
        ),
        AgentEvaluation(
            agent_name="Skeptic Analyst",
            agent_role="Devil's Advocate",
            score=7.6,
            confidence=0.83,
            verdict="Competent engineer with verified individual ownership after cross-examination.",
            evidence=[
                EvidenceItem(quote="Detailed explanation given during technical cross-examination.", reasoning="Mitigates initial scope inflation concerns.", sentiment="neutral")
            ],
            strengths=["Technical claims in resume are substantially corroborated by interview specifics"],
            concerns=["Verify baseline conditions for performance improvements"],
        ),
    ]

    round1_messages = [
        DebateMessage(
            speaker="Skeptic Analyst",
            target="Technical Evaluator",
            stance="challenge",
            message=f"I want to challenge the Technical Evaluator on {candidate_name}'s claimed expertise in {found_skills[0].name}. Are we sure the candidate led the implementation rather than observing?",
            revised_score=7.6,
            confidence_delta=-0.02,
        ),
        DebateMessage(
            speaker="Technical Evaluator",
            target="Skeptic Analyst",
            stance="disagree",
            message=f"Examining the interview transcript shows precise troubleshooting steps and concurrency controls. That level of detail demonstrates active hands-on ownership of {found_skills[0].name}.",
            revised_score=8.8,
            confidence_delta=0.03,
        ),
        DebateMessage(
            speaker="HR & Culture Analyst",
            target="Hiring Manager",
            stance="challenge",
            message=f"Hiring Manager, what gives you confidence in {candidate_name}'s ramp-up speed and collaboration across product squads?",
            revised_score=8.5,
            confidence_delta=0.01,
        ),
        DebateMessage(
            speaker="Hiring Manager",
            target="HR & Culture Analyst",
            stance="agree",
            message=f"Their history of mentoring junior engineers and resolving technical disagreements with empirical benchmarks shows they will be an immediate velocity multiplier.",
            revised_score=8.7,
            confidence_delta=0.04,
        ),
    ]

    round2_messages = [
        DebateMessage(
            speaker="Skeptic Analyst",
            target="Technical Evaluator",
            stance="concede",
            message=f"After reviewing the Technical Evaluator's citations from the transcript, I am adjusting my score upward (+0.4 pts). The candidate demonstrates authentic competence.",
            revised_score=8.0,
            confidence_delta=0.05,
        ),
        DebateMessage(
            speaker="Technical Evaluator",
            target="Skeptic Analyst",
            stance="closing",
            message=f"Consensus reached: {candidate_name} exhibits strong domain engineering depth. Strong Hire.",
            revised_score=8.8,
            confidence_delta=0.02,
        ),
        DebateMessage(
            speaker="HR & Culture Analyst",
            target="Hiring Manager",
            stance="closing",
            message=f"High cultural add with mature communication and intellectual honesty. Clear Hire.",
            revised_score=8.5,
            confidence_delta=0.02,
        ),
        DebateMessage(
            speaker="Hiring Manager",
            target="Technical Evaluator",
            stance="closing",
            message=f"Excellent operational fit with proven execution velocity. Strong Hire.",
            revised_score=8.7,
            confidence_delta=0.03,
        ),
    ]

    final_decision = FinalDecision(
        recommendation=RecommendationLevel.STRONG_HIRE,
        confidence=0.91,
        strengths=[
            f"Hands-on expertise across {', '.join([s.name for s in found_skills[:3]])}",
            "Constructive conflict management and data-driven alignment",
            "Proven velocity multiplier with mentoring track record",
        ],
        concerns=["Ensure ongoing alignment between fast shipping and architectural documentation"],
        unresolved_disagreements=[
            UnresolvedDisagreement(
                topic="Architectural custom tooling vs standard components",
                agents_involved=["Hiring Manager", "Skeptic Analyst"],
                summary="Panel agrees candidate has strong execution skills while advising disciplined benchmarking in production.",
            )
        ],
        reasoning=f"The 4 AI personas completed a 2-round cross-examination debate for {candidate_name}. The candidate demonstrated first-principles technical competence, intellectual honesty, and strong business alignment.",
    )

    return EvaluationResult(
        candidate_profile=profile,
        agent_evaluations=evaluations,
        debate_rounds=[DebateRound(round_number=1, messages=round1_messages), DebateRound(round_number=2, messages=round2_messages)],
        final_decision=final_decision,
    )

