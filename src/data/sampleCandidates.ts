export interface SampleCandidate {
  name: string;
  jobDescription: string;
  resume: string;
  transcript: string;
}

export const SAMPLE_CANDIDATES: SampleCandidate[] = [
  {
    name: "Alex Chen",
    jobDescription: "Staff Distributed Systems Engineer — Building high-throughput Kafka streaming pipelines and Raft consensus engines.",
    resume: `Alex Chen
Senior Software Engineer & Distributed Systems Specialist
Email: alex.chen@distributed-systems.dev | Phone: (555) 234-5678

SUMMARY
Senior Software Engineer with 6+ years building large-scale distributed streaming pipelines, consensus algorithms, and high-concurrency backend services in Go and Rust.

TECHNICAL SKILLS
Languages: Go, Rust, TypeScript, Python, C++
Distributed Systems: Raft Consensus, Apache Kafka, Distributed Caching (Redis Cluster), Consistent Hashing
Infrastructure: Kubernetes, Docker, Terraform, AWS (EKS, MSK, DynamoDB), Prometheus, Grafana

EXPERIENCE
Senior Distributed Systems Engineer | StreamScale Inc. | 2021 - Present
- Architected real-time event ingestion platform processing 1.2M events/sec with P99 latency <15ms.
- Decreased P99 latency by 42% on high-throughput Kafka streaming clusters by designing dynamic range partitioners with backpressure control.
- Tuned Raft consensus election timeouts and leader heartbeats across multi-region nodes, eliminating split-brain election flaps.
- Mentored 4 junior backend engineers (2 promoted to Senior within 18 months).

Backend Engineer | DataMesh Systems | 2018 - 2021
- Built asynchronous worker pools and RPC microservices handling 25k QPS.
- Increased automated unit and integration test coverage from 35% to 88%.

EDUCATION
B.S. Computer Science | University of Texas at Austin | 2018 (GPA: 3.8/4.0)`,
    transcript: `INTERVIEW TRANSCRIPT - Alex Chen
Position: Staff Distributed Systems Engineer | Interviewer: David Miller

David: Can you describe how you resolved partition skew during peak traffic on your streaming cluster?
Alex: We realized standard key hashing was causing massive hotspot partitions during promotional sales bursts. I designed a custom dynamic range partitioner with consistent hashing and active backpressure control. If a partition lagged by more than 200ms, the partitioner dynamically rerouted new batch segments to underutilized brokers without violating order guarantees for related event keys.

David: Did you encounter any node failures or consensus issues in production?
Alex: Yes. During cross-availability-zone node churn, aggressive heartbeat timeouts caused follower nodes to prematurely enter Candidate state, which led to election thrashing and transient split-brain recovery pauses. We tuned our Raft election timeout bounds with randomized jitter and adjusted heartbeat intervals, completely restoring cluster quorum stability.

David: Tell us about a time you had a technical disagreement with a peer.
Alex: A senior engineer wanted to introduce a message queue for every synchronous RPC call. Rather than arguing in meetings, I built an empirical benchmark comparing REST vs Queue latency under load. The data proved the simpler synchronous call was 3x faster with 70% less operational complexity, which convinced the team immediately.

David: What is an area where you feel you need to continue growing?
Alex: Early in my career I pushed for complex microservices when a modular monolith would have been sufficient. I've learned that architectural decisions must match team scale and business context, not just engineering fascination.`
  },
  {
    name: "Elena Rostova",
    jobDescription: "Senior AI / ML Infrastructure Engineer — Low-latency continuous batching, custom CUDA kernels, and GPU cluster orchestration.",
    resume: `Elena Rostova
Senior AI Infrastructure Engineer
Email: elena.rostova@ai-research-labs.io | Phone: (555) 789-0123

SUMMARY
AI Systems Engineer with 5+ years optimizing high-scale model inference, custom CUDA kernels, and GPU cluster orchestration.

TECHNICAL SKILLS
Core: PyTorch, CUDA C++, vLLM, TensorRT-LLM, Ray, DeepSpeed
Retrieval & Storage: Vector Search (Qdrant, Milvus), HNSW indexing, PostgreSQL (pgvector)
Hardware & Ops: NVIDIA H100/A100 clusters, Slurm, Triton Inference Server, Kubernetes

EXPERIENCE
Senior AI Infrastructure Engineer | Nexus AI Labs | 2022 - Present
- Engineered real-time semantic retrieval pipeline serving 50k QPS with <18ms p99 latency
- Optimized LLM inference throughput by 3.2x using vLLM continuous batching and custom FlashAttention kernels
- Reduced GPU cluster idle time by 35% through custom Ray scheduling

ML Platform Engineer | DeepVision Corp | 2020 - 2022
- Built automated model evaluation and regression testing pipeline across 12 foundation models
- Migrated training pipelines to mixed-precision FP16/BF16 reducing training costs by $180k/yr

EDUCATION
M.S. Computer Science (AI Specialization) | Carnegie Mellon University | 2020 (GPA: 3.9/4.0)`,
    transcript: `INTERVIEW TRANSCRIPT - Elena Rostova
Position: Senior AI Infrastructure Engineer | Interviewer: David Zhang

David: Tell us about how you achieved the 3.2x throughput speedup on LLM inference.
Elena: We identified KV-cache thrashing under high concurrency as the primary bottleneck. We wrote custom CUDA kernels for continuous batching and implemented paged KV-cache allocation with zero-copy memory transfers. That tripled throughput and slashed tail latency by 45%.

David: Can you describe a critical incident where your infrastructure failed?
Elena: In our early rollout, we experienced a subtle session ID collision in the prompt cache under a 50k QPS surge. As soon as telemetry flagged cross-session anomalies, I initiated an immediate rollback and published an internal post-mortem. I then implemented property-based fuzz testing across all caching layers to mathematically guarantee zero cache contamination.

David: How do you handle disagreements with research scientists who want to deploy unoptimized models?
Elena: I organize weekly profiling sessions. Instead of telling researchers their code is slow, we inspect flame graphs together. When they see where the GPU memory stalls occur, we collaborate on quantizing weights or operator fusion without sacrificing perplexity.`
  },
  {
    name: "Marcus Vance",
    jobDescription: "Lead Frontend Architect — Multi-brand design systems, micro-frontends, and Core Web Vitals optimization for enterprise scale.",
    resume: `Marcus Vance
Lead Frontend Architect
Email: marcus.vance@design-systems-guild.com | Phone: (555) 456-7890

SUMMARY
Frontend Architect with 7+ years pioneering unified design systems, micro-frontends, and high-performance Web applications for 12M+ monthly users.

TECHNICAL SKILLS
Frameworks: React 19, Next.js App Router, TypeScript, WebAssembly
Systems: Design Systems (Tokens, Storybook, Radix), Micro-Frontends (Module Federation)
Performance & Standards: Core Web Vitals (INP, LCP), WCAG 2.2 AAA Accessibility, WAI-ARIA

EXPERIENCE
Lead Frontend Architect | OmniGlobal Enterprise | 2021 - Present
- Architected unified design system adopted by 40+ engineering squads across 6 countries
- Improved Core Web Vitals Interaction to Next Paint (INP) by 70% across 12M monthly active users
- Achieved 100% WCAG AAA accessibility compliance, winning the 2023 Digital Inclusion Award

Senior UI Engineer | CreativeStack | 2018 - 2021
- Built modular component library reducing new feature development turnaround by 50%
- Pioneered automated visual regression testing with Playwright and Storybook

EDUCATION
B.S. Software Engineering | University of Washington | 2018`,
    transcript: `INTERVIEW TRANSCRIPT - Marcus Vance
Position: Lead Frontend Architect | Interviewer: Rachel Miller

Rachel: How did you convince 40 distinct product squads to migrate to a single design system?
Marcus: You can't mandate adoption top-down. I created an automated CLI codemod that upgraded their legacy UI components with one command. Once developers saw it saved them 10 hours a week, adoption grew organically from 4 teams to 40.

Rachel: Have you ever had a disagreement with leadership on delivery deadlines?
Marcus: Yes. A VP wanted to bypass screen reader support and keyboard navigation for a Q4 enterprise checkout release. I didn't just argue ethics; I ran an A/B test demonstrating that accessible flows reduced checkout drop-offs and unlocked a 14% revenue lift from government and healthcare clients with mandatory accessibility procurement rules.

Rachel: What's your approach to frontend performance?
Marcus: I focus heavily on INP and main-thread responsiveness. We offload heavy data parsing to Web Workers and leverage selective hydration in Next.js Server Components.`
  },
  {
    name: "Priya Sharma",
    jobDescription: "Staff Cloud Security & DevSecOps Engineer — Zero-Trust IAM, eBPF kernel security, container runtime defense, and automated compliance.",
    resume: `Priya Sharma
Staff Security Engineer
Email: priya.sharma@zerotrust-sec.org | Phone: (555) 321-6540

SUMMARY
DevSecOps & Cloud Security Architect with 8+ years experience in Zero-Trust infrastructure, container runtime defense, and automated compliance.

TECHNICAL SKILLS
Security: eBPF (Cilium, Falco), Zero-Trust IAM, SLSA Supply Chain Security, Threat Modeling
Cloud & Containers: Kubernetes, AWS Security Hub, HashiCorp Vault, Terraform, OPA (Open Policy Agent)
Compliance: SOC2 Type II, ISO 27001, FedRAMP High, PCI-DSS

EXPERIENCE
Staff Security Engineer | FinTech Shield | 2020 - Present
- Detected and mitigated zero-day supply chain dependency compromise in CI/CD pipeline before production release
- Automated least-privilege IAM access with self-service Slack bot, reducing ticket turnaround from 24h to 2min
- Achieved FedRAMP High readiness certification 3 months ahead of schedule

Senior Cloud Security Engineer | SecureCloud Solutions | 2017 - 2020
- Built automated container vulnerability triage scanner processing 4,000 daily image builds

EDUCATION
M.S. Information Security | Georgia Tech | 2017`,
    transcript: `INTERVIEW TRANSCRIPT - Priya Sharma
Position: Staff Security Engineer | Interviewer: Mark Evans

Mark: How do you prevent security from becoming a bottleneck for software engineers?
Priya: If security feels like a barrier, developers will find ways around it. When our engineers complained about 48-hour access request delays, I built an automated Slack bot that grants Just-In-Time scoped permissions with automated revocation after 60 minutes. Access requests dropped from days to 2 minutes while audit compliance became 100% automated.

Mark: Tell me about your biggest security catch in production.
Priya: In late 2023, our automated SLSA provenance scanner detected a malicious typo-squatted dependency trying to establish a reverse shell during a build step. We intercepted it in staging, quarantined the container via eBPF kernel filters, and prevented what could have been a catastrophic data breach.`
  },
  {
    name: "John Smith",
    jobDescription: "Senior Distributed Systems & Backend Lead — Microservices architecture, Saga transaction patterns, and distributed tracing.",
    resume: `John Smith
Senior Software Engineer
Email: john.smith@techcorp-alumni.com | Phone: (555) 123-4567

SUMMARY
Full-stack software engineer with 6+ years building scalable distributed web applications. Led migration of monolithic architecture to 15 microservices, improving deployment frequency by 40%.

TECHNICAL SKILLS
Languages: Python, Go, TypeScript, SQL
Architecture: Microservices (Saga pattern), Distributed Tracing (OpenTelemetry), Kafka, Redis, PostgreSQL
Tools: Docker, Kubernetes, AWS, Git, CI/CD pipelines

EXPERIENCE
Senior Software Engineer | TechCorp Inc. | 2021 - Present
- Led 12 engineers in redesigning payment processing platform to 15 microservices
- Reduced API latency by 60% via caching and query optimization
- Implemented CI/CD pipelines reducing deployment time from 2 hours to 15 minutes
- Mentored 4 junior engineers (2 promoted within 18 months)

Software Engineer | StartupXYZ | 2019 - 2021
- Built real-time analytics dashboard processing 50M+ events daily with Kafka
- Designed RESTful APIs handling 10K+ requests/sec
- Increased automated test coverage from 30% to 85%

EDUCATION
B.S. Computer Science | State University | 2018 (GPA: 3.7/4.0)`,
    transcript: `INTERVIEW TRANSCRIPT - John Smith
Position: Senior Software Engineer | Interviewer: Sarah Chen

Sarah: Can you tell me about your payment platform project at TechCorp?
John: When I joined, we had a monolithic Python application that was hard to scale. I proposed breaking it into microservices. I led a team of 12 engineers—it started with 8 and grew to 12. We split it into 15 services using the Saga pattern for distributed transactions.

Sarah: What was the hardest technical challenge?
John: Data consistency across service boundaries and observability. With 15 services, debugging was difficult. I set up distributed tracing with OpenTelemetry and Grafana dashboards. Our mean time to resolution dropped from 4 hours to 45 minutes.

Sarah: Tell me about a time you disagreed with a team member.
John: A senior engineer wanted a message queue for every synchronous call. I thought that was overkill. We did a time-boxed benchmark comparing REST vs Queue. The empirical data showed REST was simpler and faster for synchronous flows, though we kept Kafka for event-driven workflows. He appreciated the data-backed decision.

Sarah: What's a project where you made a mistake?
John: At StartupXYZ, I pushed for microservices too early when a modular monolith would have been much better for a team of 5. I learned architectural choices must match team scale, not just tech preferences.`
  },
  {
    name: "Dr. Samantha Blake",
    jobDescription: "Staff ML Systems Architect — Large-scale foundation model evaluation, continuous fine-tuning pipelines, and distributed RLHF.",
    resume: `Dr. Samantha Blake
Staff ML Systems Architect & Post-Training Lead
Email: samantha.blake@frontier-ml.ai | Phone: (555) 987-6543

SUMMARY
ML Systems Lead with PhD and 7+ years architecting distributed RLHF pipelines, automated synthetic data filtering, and high-throughput model evaluation across 70B+ parameter models.

TECHNICAL SKILLS
ML Frameworks: PyTorch, Megatron-LM, vLLM, DeepSpeed ZeRO-3, TRL, Ray Train
Infrastructure: NVIDIA H100 GPU clusters, InfiniBand HDR, Slurm, Weights & Biases
Specialties: Distributed RLHF (PPO/DPO), Synthetic Data Generation, LLM Alignment & Evals

EXPERIENCE
Staff ML Architect | Frontier Intelligence AI | 2022 - Present
- Scaled distributed DPO alignment training across 256 H100 GPUs with 94% linear scaling efficiency.
- Built automated LLM-as-a-judge evaluation harness measuring safety and reasoning across 40 benchmarks.
- Reduced model post-training alignment compute cost by 45% through reward model distillation.

Senior Research Engineer | DeepCore AI Labs | 2019 - 2022
- Authored 3 NeurIPS/ICLR papers on efficient parameter quantization and sample-efficient RLHF.

EDUCATION
Ph.D. in Computer Science (Machine Learning) | Stanford University | 2019`,
    transcript: `INTERVIEW TRANSCRIPT - Dr. Samantha Blake
Position: Staff ML Systems Architect | Interviewer: Kevin Vance

Kevin: How did you achieve 94% scaling efficiency across 256 H100 GPUs during alignment training?
Samantha: We observed that standard tensor parallelism generated excessive InfiniBand communication overhead during the backward pass. We restructured the pipeline with DeepSpeed ZeRO-3 parameter offloading and overlapped all-gather communication with computation. This removed 80% of communication stalls.

Kevin: How do you prevent reward hacking during reinforcement learning from human feedback?
Samantha: Reward model over-optimization is a classic failure mode. We introduced KL-divergence penalties combined with multi-objective reward ensembles. When any sub-reward score diverged by more than 2 standard deviations, the trajectory was down-weighted.

Kevin: Describe a time you worked with cross-functional product teams who lacked deep ML expertise.
Samantha: Product teams wanted to treat LLMs as deterministic databases. I created interactive playground notebooks demonstrating probability distributions and temperature effects. That established shared understanding and prevented unrealistic product assumptions.`
  }
];
