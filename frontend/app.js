/* ═══════════════════════════════════════════════════════════
   PromptWars — Main Application Logic
   Handles: rotating candidate loader, settings, step-by-step navigation, rendering, voice debate
   ═══════════════════════════════════════════════════════════ */

const API_BASE = 'http://localhost:8000';

// ── State ──
const state = {
  resumeFile: null,
  transcriptFile: null,
  evaluationResult: null,
  currentStep: 1,
  voicePlaying: false,
  voiceSpeed: 1.0,
  voiceQueue: [],
  currentUtterance: null,
  executionMode: localStorage.getItem('pw_execution_mode') || 'demo',
  provider: localStorage.getItem('pw_provider') || 'gemini/gemini-2.0-flash',
  apiKey: localStorage.getItem('pw_api_key') || '',
  sampleCandidateIndex: 0,
};

// ── Agent Metadata ──
const AGENT_META = {
  'Technical Evaluator': { icon: '🔧', cssClass: 'technical', color: '#3b82f6' },
  'HR & Culture Analyst': { icon: '🤝', cssClass: 'hr', color: '#8b5cf6' },
  'Hiring Manager': { icon: '📋', cssClass: 'hiring', color: '#10b981' },
  'Skeptic Analyst': { icon: '🔍', cssClass: 'skeptic', color: '#f59e0b' },
};

// ── Voice Map (assigned at runtime based on available voices) ──
let voiceMap = {};
let availableVoices = [];

// ═══════════════════════════════════════
// SAMPLE CANDIDATE LIBRARY (Rotates on Click)
// ═══════════════════════════════════════

const SAMPLE_CANDIDATES = [
  {
    name: "John Smith",
    title: "Senior Distributed Systems & Backend Lead",
    badge: "Distributed Systems • Microservices • Saga Pattern",
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
John: At StartupXYZ, I pushed for microservices too early when a modular monolith would have been much better for a team of 5. I learned architectural choices must match team scale, not just tech preferences.

Sarah: Why are you looking to leave?
John: I'm looking for greenfield architecture challenges where I can shape technical decisions from day one.`
  },
  {
    name: "Elena Rostova",
    title: "Senior AI / ML Infrastructure Engineer",
    badge: "PyTorch • CUDA C++ • vLLM • Vector Search",
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
- Optimized LLM inference throughput by 3.2x using vLLM continuous batching and flash attention kernels
- Reduced GPU cluster idle time by 35% through custom Ray scheduling

ML Platform Engineer | DeepVision Corp | 2020 - 2022
- Built automated model evaluation and regression testing pipeline across 12 foundation models
- Migrated training pipelines to mixed-precision FP16/BF16 reducing training costs by $180k/yr

EDUCATION
M.S. Computer Science (AI Specialization) | Carnegie Mellon University | 2020 (GPA: 3.9/4.0)`,
    transcript: `INTERVIEW TRANSCRIPT - Elena Rostova
Position: Senior AI Infrastructure Engineer | Interviewer: David Zhang

David: Tell us about how you achieved the 3.2x throughput speedup on LLM inference.
Elena: We identified KV-cache thrashing under high concurrency as the bottleneck. We wrote custom CUDA kernels for continuous batching and implemented paged KV-cache allocation. That tripled throughput and slashed tail latency by 45%.

David: Can you describe a critical incident where your infrastructure failed?
Elena: In our early rollout, we experienced a subtle session ID collision in the prompt cache under a 50k QPS surge. As soon as telemetry flagged cross-session anomalies, I initiated an immediate rollback and published an internal post-mortem. I then implemented property-based fuzz testing across all caching layers to mathematically guarantee zero cache contamination.

David: How do you handle disagreements with research scientists who want to deploy unoptimized models?
Elena: I organize weekly profiling sessions. Instead of telling researchers their code is slow, we inspect flame graphs together. When they see where the GPU memory stalls occur, we collaborate on quantizing weights or operator fusion without sacrificing perplexity.`
  },
  {
    name: "Marcus Vance",
    title: "Lead Frontend Architect & Design Systems Lead",
    badge: "Next.js • Design Systems • WCAG 2.2 AAA • INP",
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
    title: "Staff Cloud Security & DevSecOps Engineer",
    badge: "Zero-Trust • eBPF • Kubernetes Security • FedRAMP",
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
    name: "Alex Chen",
    title: "Full-Stack Product Engineer & Ex-Founder",
    badge: "0-to-1 Product • Stripe Billing • Rapid MVP Velocity",
    resume: `Alex Chen
Full-Stack Product Engineer & Ex-Founder
Email: alex.chen@founder-growth.dev | Phone: (555) 678-9012

SUMMARY
Entrepreneurial Product Engineer with 4+ years building 0-to-1 web applications, scalable APIs, and monetization funnels.

TECHNICAL SKILLS
Stack: React, TypeScript, FastAPI, PostgreSQL, Redis, TailwindCSS
Product & Growth: Stripe Subscriptions, PostHog Product Analytics, A/B Testing, Webhooks
Ops: Docker, Railway, AWS ECS, Supabase

EXPERIENCE
Founder & Lead Developer | DocuSync SaaS | 2022 - 2024
- Built document collaboration tool from scratch to $18k MRR and 4,000 paying users before profitable asset acquisition
- Shipped 120+ customer-requested features in 18 months as solo engineer
- Integrated Stripe billing, webhooks, and automated subscription recovery

Software Engineer | ScaleCorp Enterprise | 2020 - 2022
- Built internal growth dashboards and billing analytics for customer operations

EDUCATION
B.S. Information Systems | University of Texas at Austin | 2020`,
    transcript: `INTERVIEW TRANSCRIPT - Alex Chen
Position: Full-Stack Product Engineer | Interviewer: Jason Lee

Jason: How do you transition from being a solo founder back into an engineering team?
Alex: As a founder, I was wearing every hat—writing code, talking to users, fixing bugs at 2 AM. In a team, I bring that same extreme ownership and customer empathy, but I've learned the value of architectural guardrails.

Jason: Tell me about a mistake you made while shipping fast.
Alex: At ScaleCorp, a tier-1 customer was completely blocked during a freeze. The Change Review Board was taking 4 days to meet, so I bypassed the freeze and pushed the hotfix directly. It fixed the customer's issue, but it was a serious breach of protocol. I realized in hindsight that bypassing governance creates systemic risk.

Jason: What kind of team environment allows you to do your best work?
Alex: High-autonomy growth squads where success is measured by user outcomes and revenue metrics rather than ticket volume.`
  }
];

// ═══════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  setupFileUploads();
  setupEvaluateButton();
  setupVoices();
  initSettingsUI();
  setupStepperClickHandlers();
});

// ═══════════════════════════════════════
// SETTINGS & EXECUTION MODE
// ═══════════════════════════════════════

function initSettingsUI() {
  const selectProvider = document.getElementById('select-provider');
  const inputApiKey = document.getElementById('input-api-key');

  if (selectProvider && state.provider) {
    selectProvider.value = state.provider;
  }
  if (inputApiKey && state.apiKey) {
    inputApiKey.value = state.apiKey;
  }

  setExecutionMode(state.executionMode, false);
}

function setExecutionMode(mode, save = true) {
  state.executionMode = mode;
  if (save) localStorage.setItem('pw_execution_mode', mode);

  const modeDemoBtn = document.getElementById('btn-mode-demo');
  const modeLiveBtn = document.getElementById('btn-mode-live');
  const liveSettingsBody = document.getElementById('live-settings-body');

  if (mode === 'live') {
    modeDemoBtn?.classList.remove('active');
    modeLiveBtn?.classList.add('active');
    liveSettingsBody?.classList.remove('hidden');
  } else {
    modeLiveBtn?.classList.remove('active');
    modeDemoBtn?.classList.add('active');
    liveSettingsBody?.classList.add('hidden');
  }
}

function onProviderChange(val) {
  state.provider = val;
  localStorage.setItem('pw_provider', val);
}

function saveApiKey(val) {
  state.apiKey = val;
  localStorage.setItem('pw_api_key', val);
}

// ═══════════════════════════════════════
// DYNAMIC SAMPLE CANDIDATE ROTATOR
// ═══════════════════════════════════════

function loadSampleFiles() {
  // Pick next candidate in rotation
  const candidate = SAMPLE_CANDIDATES[state.sampleCandidateIndex % SAMPLE_CANDIDATES.length];
  state.sampleCandidateIndex++;

  const resumeFileName = `${candidate.name.replace(/\s+/g, '_')}_Resume.txt`;
  const transcriptFileName = `${candidate.name.replace(/\s+/g, '_')}_Interview_Transcript.txt`;

  const resumeBlob = new Blob([candidate.resume], { type: 'text/plain' });
  const resumeFile = new File([resumeBlob], resumeFileName, { type: 'text/plain' });

  const transcriptBlob = new Blob([candidate.transcript], { type: 'text/plain' });
  const transcriptFile = new File([transcriptBlob], transcriptFileName, { type: 'text/plain' });

  const zoneResume = document.getElementById('upload-resume');
  const nameResume = document.getElementById('resume-name');
  handleFile(resumeFile, zoneResume, nameResume, 'resumeFile');

  const zoneTranscript = document.getElementById('upload-transcript');
  const nameTranscript = document.getElementById('transcript-name');
  handleFile(transcriptFile, zoneTranscript, nameTranscript, 'transcriptFile');

  // Update button text to show the loaded candidate & hint to click again for another
  const btnLoad = document.getElementById('btn-load-sample');
  if (btnLoad) {
    btnLoad.innerHTML = `👤 Loaded: <strong>${escapeHtml(candidate.name)}</strong> (${candidate.badge.split('•')[0].trim()}) ↻`;
    btnLoad.classList.add('btn-loaded-glow');
    setTimeout(() => btnLoad.classList.remove('btn-loaded-glow'), 600);
  }

  const status = document.getElementById('upload-status');
  if (status) {
    status.innerHTML = `✨ Loaded sample for <strong>${escapeHtml(candidate.name)}</strong> (${escapeHtml(candidate.title)}). Click again to cycle candidate!`;
    status.style.color = 'var(--accent-emerald)';
  }
}

// ═══════════════════════════════════════
// VOICE SYNTHESIS SETUP
// ═══════════════════════════════════════

function setupVoices() {
  const synth = window.speechSynthesis;
  if (!synth) return;

  function loadVoices() {
    availableVoices = synth.getVoices();
    if (availableVoices.length > 0) {
      assignVoices();
    }
  }
  loadVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }
}

function assignVoices() {
  const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
  const agentNames = Object.keys(AGENT_META);

  agentNames.forEach((name, i) => {
    if (englishVoices.length > 0) {
      voiceMap[name] = englishVoices[i % englishVoices.length];
    }
  });
}

// ═══════════════════════════════════════
// FILE UPLOAD
// ═══════════════════════════════════════

function setupFileUploads() {
  setupSingleUpload('file-resume', 'upload-resume', 'resume-name', 'resumeFile');
  setupSingleUpload('file-transcript', 'upload-transcript', 'transcript-name', 'transcriptFile');
}

function setupSingleUpload(inputId, zoneId, nameId, stateKey) {
  const input = document.getElementById(inputId);
  const zone = document.getElementById(zoneId);
  const nameEl = document.getElementById(nameId);

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0], zone, nameEl, stateKey);
    }
  });

  input.addEventListener('change', () => {
    if (input.files.length > 0) {
      handleFile(input.files[0], zone, nameEl, stateKey);
    }
  });
}

function handleFile(file, zone, nameEl, stateKey) {
  state[stateKey] = file;
  zone.classList.add('has-file');
  nameEl.textContent = `✓ ${file.name}`;
  nameEl.classList.remove('hidden');
  updateUploadStatus();
}

function updateUploadStatus() {
  const btn = document.getElementById('btn-evaluate');
  const status = document.getElementById('upload-status');

  if (state.resumeFile && state.transcriptFile) {
    btn.disabled = false;
    status.textContent = 'Both files loaded — ready to evaluate!';
    status.style.color = 'var(--accent-emerald)';
  } else if (state.resumeFile) {
    status.textContent = 'Resume loaded. Now upload the transcript.';
  } else if (state.transcriptFile) {
    status.textContent = 'Transcript loaded. Now upload the resume.';
  }
}

// ═══════════════════════════════════════
// STEPPER HANDLERS
// ═══════════════════════════════════════

function setupStepperClickHandlers() {
  document.querySelectorAll('.step').forEach(stepEl => {
    stepEl.addEventListener('click', () => {
      const targetStep = parseInt(stepEl.dataset.step);
      if (state.evaluationResult) {
        goToStep(targetStep);
      }
    });
  });
}

function goToStep(stepNumber) {
  if (!state.evaluationResult) return;

  // Stop any active speech
  stopVoiceDebate();

  state.currentStep = stepNumber;
  setActiveStep(stepNumber);

  switch (stepNumber) {
    case 1:
      renderStep1_Profile();
      break;
    case 2:
      renderStep2_Agents();
      break;
    case 3:
      renderStep3_Debate();
      break;
    case 4:
      renderStep4_Report();
      break;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setActiveStep(stepNum) {
  document.querySelectorAll('.step').forEach(s => {
    const n = parseInt(s.dataset.step);
    if (n < stepNum) {
      s.classList.remove('active');
      s.classList.add('completed');
    } else if (n === stepNum) {
      s.classList.add('active');
      s.classList.remove('completed');
    } else {
      s.classList.remove('active', 'completed');
    }
  });

  document.querySelectorAll('.step-connector').forEach(c => {
    const n = parseInt(c.dataset.connector);
    if (n < stepNum) {
      c.classList.add('completed');
      c.classList.remove('active');
    } else if (n === stepNum) {
      c.classList.add('active');
      c.classList.remove('completed');
    } else {
      c.classList.remove('completed', 'active');
    }
  });
}

// ═══════════════════════════════════════
// EVALUATION PIPELINE EXECUTION
// ═══════════════════════════════════════

function setupEvaluateButton() {
  document.getElementById('btn-evaluate').addEventListener('click', startEvaluation);
}

async function startEvaluation() {
  const btn = document.getElementById('btn-evaluate');
  btn.disabled = true;
  btn.innerHTML = '<div class="loading-spinner" style="width:20px;height:20px;border-width:2px;"></div> Evaluating...';

  // Switch to evaluation view
  document.getElementById('view-landing').classList.add('hidden');
  document.getElementById('view-evaluation').classList.remove('hidden');

  // Show loading state
  showLoadingStep('Analyzing resume & transcript, generating evaluations and debate...', 'Running Multi-Agent Evaluation');
  setActiveStep(1);

  try {
    const formData = new FormData();
    formData.append('resume', state.resumeFile);
    formData.append('transcript', state.transcriptFile);

    const isDemo = state.executionMode === 'demo';
    formData.append('demo_mode', isDemo ? 'true' : 'false');

    if (!isDemo) {
      if (state.apiKey) formData.append('api_key', state.apiKey.trim());
      if (state.provider) formData.append('model', state.provider);
    }

    const response = await fetch(`${API_BASE}/evaluate`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMsg = `Server returned HTTP ${response.status}`;
      try {
        const errorJson = await response.json();
        errorMsg = errorJson.detail || errorMsg;
      } catch (_) {
        try {
          const text = await response.text();
          if (text) errorMsg = text;
        } catch (_) {}
      }
      throw new Error(errorMsg);
    }

    state.evaluationResult = await response.json();

    // START ON STEP 1 (Candidate Profile) and let the user navigate!
    goToStep(1);

  } catch (err) {
    showError(err.message);
  }
}

// ═══════════════════════════════════════
// STEP RENDERING WITH PROGRESSION BUTTONS
// ═══════════════════════════════════════

function showLoadingStep(message, step) {
  document.getElementById('step-content').innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">${escapeHtml(message)}</div>
      <div class="loading-step">${escapeHtml(step)}</div>
    </div>
  `;
}

function showError(message) {
  document.getElementById('step-content').innerHTML = `
    <div class="glass-card text-center" style="max-width:650px;margin:2rem auto;">
      <h2 style="color:var(--accent-rose);margin-bottom:1rem;">⚠️ Evaluation Error</h2>
      <p class="subtitle" style="margin-bottom:1.5rem;line-height:1.6;">${escapeHtml(message)}</p>
      <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="runDemoFallback()">⚡ Run in Demo Mode</button>
        <button class="btn btn-primary" onclick="location.reload()">⚙️ Check Settings & Retry</button>
      </div>
    </div>
  `;
}

function runDemoFallback() {
  setExecutionMode('demo', true);
  startEvaluation();
}

// ── STEP 1: CANDIDATE PROFILE ──
function renderStep1_Profile() {
  const profile = state.evaluationResult.candidate_profile;
  const content = document.getElementById('step-content');

  content.innerHTML = `
    <div class="section-header">
      <h2>📋 Section 1: Candidate Profile</h2>
      <p class="subtitle">Shared factual foundation extracted from resume and interview transcript</p>
    </div>

    <div class="profile-grid">
      <div class="profile-section">
        <h3>👤 Candidate Details</h3>
        <p style="font-size:1.25rem;font-weight:700;margin-bottom:0.5rem;">${escapeHtml(profile.name || 'Candidate')}</p>
        ${profile.email ? `<p style="color:var(--text-muted);font-size:0.85rem;">📧 ${escapeHtml(profile.email)}</p>` : ''}
        ${profile.phone ? `<p style="color:var(--text-muted);font-size:0.85rem;">📞 ${escapeHtml(profile.phone)}</p>` : ''}
      </div>

      <div class="profile-section">
        <h3>🛠️ Verified Skills</h3>
        <div class="skill-tags">
          ${profile.skills.map(s => `
            <span class="skill-tag" title="${escapeHtml(s.proficiency)} — source: ${escapeHtml(s.source)}">
              ${escapeHtml(s.name)}
            </span>
          `).join('')}
          ${profile.skills.length === 0 ? '<span style="color:var(--text-muted);">No skills extracted</span>' : ''}
        </div>
      </div>

      <div class="profile-section">
        <h3>💼 Experience</h3>
        ${profile.experience.map(e => `
          <div style="margin-bottom:0.85rem;">
            <div style="font-weight:600;font-size:0.95rem;">${escapeHtml(e.role)}</div>
            <div style="color:var(--text-muted);font-size:0.82rem;margin-bottom:0.25rem;">${escapeHtml(e.company)} • ${escapeHtml(e.duration)}</div>
            ${e.key_achievements && e.key_achievements.length > 0 ? `
              <ul style="padding-left:1.2rem;font-size:0.82rem;color:var(--text-secondary);">
                ${e.key_achievements.map(a => `<li>${escapeHtml(a)}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
        ${profile.experience.length === 0 ? '<span style="color:var(--text-muted);">No experience extracted</span>' : ''}
      </div>

      <div class="profile-section">
        <h3>🎓 Education</h3>
        ${profile.education.map(e => `
          <div style="margin-bottom:0.5rem;">
            <div style="font-weight:600;font-size:0.95rem;">${escapeHtml(e.degree)}</div>
            <div style="color:var(--text-muted);font-size:0.85rem;">${escapeHtml(e.institution)} ${e.year ? '(' + escapeHtml(e.year) + ')' : ''}</div>
          </div>
        `).join('')}
        ${profile.education.length === 0 ? '<span style="color:var(--text-muted);">No education extracted</span>' : ''}
      </div>

      ${profile.claims && profile.claims.length > 0 ? `
      <div class="profile-section" style="grid-column: 1 / -1;">
        <h3>💬 Key Claims & Real Transcript Quotes</h3>
        <div class="evidence-list">
          ${profile.claims.map(c => `
            <div class="evidence-item neutral">
              <div class="evidence-quote">"${escapeHtml(c.claim)}"</div>
              <div class="evidence-reasoning">Source: <strong>${escapeHtml(c.source)}</strong>${c.quote ? ' — <em>"' + escapeHtml(c.quote) + '"</em>' : ''}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    </div>

    <!-- Navigation Bar -->
    <div class="step-nav-bar">
      <span class="step-nav-info">Section 1 of 4 • Candidate Profile</span>
      <button class="btn btn-primary" onclick="goToStep(2)">
        Proceed to Independent Agent Evaluations (4 AI Agents) ➔
      </button>
    </div>
  `;
}

// ── STEP 2: INDEPENDENT AGENT EVALUATIONS ──
function renderStep2_Agents() {
  const evals = state.evaluationResult.agent_evaluations;
  const content = document.getElementById('step-content');

  content.innerHTML = `
    <div class="section-header">
      <h2>🤖 Section 2: Independent Agent Evaluations</h2>
      <p class="subtitle">Each agent evaluated the candidate completely in isolation — zero shared state prior to debate</p>
    </div>

    <div class="agents-grid">
      ${evals.map(e => renderAgentCard(e)).join('')}
    </div>

    <!-- Navigation Bar -->
    <div class="step-nav-bar">
      <button class="btn btn-secondary" onclick="goToStep(1)">
        ← Back to Candidate Profile
      </button>
      <span class="step-nav-info">Section 2 of 4 • Independent Evaluations</span>
      <button class="btn btn-primary" onclick="goToStep(3)">
        Proceed to Live Debate (2 Rounds) ➔
      </button>
    </div>
  `;

  // Trigger score animations
  requestAnimationFrame(() => {
    document.querySelectorAll('.score-ring').forEach(ring => {
      const score = parseFloat(ring.dataset.score);
      const circumference = 2 * Math.PI * 28;
      const offset = circumference - (score / 10) * circumference;
      ring.style.strokeDashoffset = offset;
    });

    document.querySelectorAll('.confidence-fill').forEach(bar => {
      const conf = parseFloat(bar.dataset.confidence);
      bar.style.width = `${conf * 100}%`;
    });
  });
}

function renderAgentCard(evaluation) {
  const meta = AGENT_META[evaluation.agent_name] || { icon: '🤖', cssClass: 'technical', color: '#4f46e5' };
  const scoreColor = getScoreColor(evaluation.score);
  const circumference = 2 * Math.PI * 28;

  return `
    <div class="agent-card">
      <div class="agent-header">
        <div class="agent-avatar ${meta.cssClass}">${meta.icon}</div>
        <div>
          <div class="agent-name">${escapeHtml(evaluation.agent_name)}</div>
          <div class="agent-role">${escapeHtml(evaluation.agent_role)}</div>
        </div>
      </div>

      <div class="score-section">
        <div class="score-circle">
          <svg viewBox="0 0 64 64">
            <circle class="bg-ring" cx="32" cy="32" r="28"/>
            <circle class="score-ring" cx="32" cy="32" r="28"
              data-score="${evaluation.score}"
              stroke="${scoreColor}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${circumference}"/>
          </svg>
          <div class="score-value" style="color:${scoreColor}">${evaluation.score.toFixed(1)}</div>
        </div>
        <div class="score-meta">
          <div class="score-label">Score / 10</div>
          <div class="verdict-text">${escapeHtml(evaluation.verdict)}</div>
        </div>
      </div>

      <div class="confidence-meter">
        <div class="confidence-label">
          <span style="color:var(--text-muted)">Confidence Level</span>
          <span class="mono" style="color:var(--text-secondary)">${(evaluation.confidence * 100).toFixed(0)}%</span>
        </div>
        <div class="confidence-bar">
          <div class="confidence-fill" data-confidence="${evaluation.confidence}" style="width:0%"></div>
        </div>
      </div>

      <div style="margin-bottom:var(--space-md);">
        <div class="score-label" style="margin-bottom:var(--space-sm);">Quotes & Fact-Backed Evidence</div>
        <ul class="evidence-list">
          ${evaluation.evidence.slice(0, 3).map(e => `
            <li class="evidence-item ${e.sentiment}">
              <div class="evidence-quote">"${escapeHtml(e.quote)}"</div>
              <div class="evidence-reasoning">${escapeHtml(e.reasoning)}</div>
            </li>
          `).join('')}
        </ul>
      </div>

      <div>
        <div class="score-label" style="margin-bottom:var(--space-xs);">Strengths</div>
        <div class="pills">
          ${evaluation.strengths.map(s => `<span class="pill strength">${escapeHtml(s)}</span>`).join('')}
        </div>
      </div>

      ${evaluation.concerns && evaluation.concerns.length > 0 ? `
      <div class="mt-md">
        <div class="score-label" style="margin-bottom:var(--space-xs);">Concerns & Red Flags</div>
        <div class="pills">
          ${evaluation.concerns.map(c => `<span class="pill concern">${escapeHtml(c)}</span>`).join('')}
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

// ── STEP 3: LIVE DEBATE ──
function renderStep3_Debate() {
  const rounds = state.evaluationResult.debate_rounds;
  const content = document.getElementById('step-content');

  content.innerHTML = `
    <div class="section-header">
      <h2>⚔️ Section 3: Multi-Agent Debate</h2>
      <p class="subtitle">Agents cross-examine each other, challenge points, and revise scores based on peer evidence</p>
    </div>

    <div class="voice-controls" id="voice-controls">
      <button class="voice-btn" id="btn-voice-play" onclick="toggleVoiceDebate()" title="Play voice debate">
        ▶
      </button>
      <div class="speaking-indicator hidden" id="speaking-indicator">
        <div class="speaking-waves">
          <span></span><span></span><span></span><span></span>
        </div>
        <span id="speaking-name">Speaking...</span>
      </div>
      <select class="speed-control" id="voice-speed" onchange="updateVoiceSpeed(this.value)">
        <option value="0.75">0.75x</option>
        <option value="1" selected>1x</option>
        <option value="1.25">1.25x</option>
        <option value="1.5">1.5x</option>
        <option value="2">2x</option>
      </select>
      <button class="voice-btn" onclick="stopVoiceDebate()" title="Stop">◼</button>
    </div>

    <div class="debate-container" id="debate-messages">
      ${rounds.map(round => `
        <div class="debate-round-header">
          <span class="round-badge">Round ${round.round_number}: ${round.round_number === 1 ? 'Cross-Examination' : 'Rebuttals & Refinements'}</span>
        </div>
        ${round.messages.map((msg, i) => renderDebateMessage(msg, i)).join('')}
      `).join('')}
    </div>

    <!-- Navigation Bar -->
    <div class="step-nav-bar">
      <button class="btn btn-secondary" onclick="goToStep(2)">
        ← Back to Independent Evaluations
      </button>
      <span class="step-nav-info">Section 3 of 4 • Multi-Agent Debate</span>
      <button class="btn btn-primary" onclick="goToStep(4)">
        Proceed to Final Adjudication & Decision ➔
      </button>
    </div>
  `;
}

function renderDebateMessage(msg, index) {
  const meta = AGENT_META[msg.speaker] || { icon: '🤖', cssClass: 'technical', color: '#4f46e5' };

  return `
    <div class="debate-message" style="animation-delay:${index * 0.15}s" data-speaker="${escapeHtml(msg.speaker)}" data-text="${escapeAttr(msg.message)}">
      <div class="debate-avatar ${meta.cssClass}" style="background:linear-gradient(135deg, ${meta.color}, ${meta.color}dd);">
        ${meta.icon}
      </div>
      <div class="debate-bubble">
        <div class="debate-speaker" style="color:${meta.color}">${escapeHtml(msg.speaker)}</div>
        ${msg.target ? `<div class="debate-target">→ responding directly to @${escapeHtml(msg.target)}</div>` : ''}
        <div class="debate-text">${escapeHtml(msg.message)}</div>
        <div class="debate-meta">
          ${msg.stance ? `<span class="stance-badge ${msg.stance}">${msg.stance}</span>` : ''}
          ${msg.revised_score !== null && msg.revised_score !== undefined ? `<span>Revised score: <strong>${msg.revised_score}/10</strong></span>` : ''}
          ${msg.confidence_delta !== 0 ? `<span>Confidence: <strong>${msg.confidence_delta > 0 ? '+' : ''}${msg.confidence_delta.toFixed(2)}</strong></span>` : ''}
        </div>
      </div>
    </div>
  `;
}

// ── STEP 4: FINAL DECISION & REPORT ──
function renderStep4_Report() {
  const decision = state.evaluationResult.final_decision;
  const content = document.getElementById('step-content');

  const recLabel = decision.recommendation.replace(/_/g, ' ');

  content.innerHTML = `
    <div class="report-container">
      <div class="section-header">
        <h2>📊 Section 4: Final Recommendation & Synthesis</h2>
        <p class="subtitle">Weighted reasoning based on evidence strength, confidence shifts, and debate resolution (not simple averaging)</p>
      </div>

      <div class="recommendation-banner glass-card rec-${decision.recommendation}">
        <div class="rec-badge">${recLabel}</div>
        <div class="report-confidence">
          Overall Decision Confidence
          <div class="confidence-big">${(decision.confidence * 100).toFixed(0)}%</div>
        </div>
      </div>

      <div class="report-grid">
        <div class="report-section">
          <h3>✅ Key Strengths</h3>
          <ul class="report-list">
            ${decision.strengths.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
          </ul>
        </div>
        <div class="report-section">
          <h3>⚠️ Key Concerns</h3>
          <ul class="report-list">
            ${decision.concerns.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="reasoning-block">
        <h3 style="margin-bottom:var(--space-md);">🧠 Adjudicator Reasoning & Synthesis</h3>
        ${decision.reasoning.split('\n').map(p => `<p style="margin-bottom:var(--space-md);">${escapeHtml(p)}</p>`).join('')}
      </div>

      ${decision.unresolved_disagreements && decision.unresolved_disagreements.length > 0 ? `
      <div class="glass-card" style="margin-bottom:var(--space-xl);">
        <h3 style="margin-bottom:var(--space-md);color:var(--accent-amber);">🔔 Unresolved Disagreements</h3>
        ${decision.unresolved_disagreements.map(d => `
          <div class="disagreement-alert">
            <div class="disagreement-topic">${escapeHtml(d.topic)}</div>
            <div class="disagreement-agents">Agents involved: ${d.agents_involved.map(a => escapeHtml(a)).join(', ')}</div>
            <div class="disagreement-summary">${escapeHtml(d.summary)}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <!-- Navigation Bar -->
      <div class="step-nav-bar">
        <button class="btn btn-secondary" onclick="goToStep(3)">
          ← Back to Debate
        </button>
        <span class="step-nav-info">Section 4 of 4 • Final Report</span>
        <button class="btn btn-primary" onclick="location.reload()">
          🔄 Evaluate Another Candidate
        </button>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════
// VOICE DEBATE (Web Speech API)
// ═══════════════════════════════════════

function toggleVoiceDebate() {
  if (state.voicePlaying) {
    pauseVoiceDebate();
  } else {
    startVoiceDebate();
  }
}

function startVoiceDebate() {
  const messages = document.querySelectorAll('.debate-message');
  if (messages.length === 0) return;

  state.voicePlaying = true;
  const btn = document.getElementById('btn-voice-play');
  if (btn) {
    btn.textContent = '⏸';
    btn.classList.add('playing');
  }

  state.voiceQueue = [];
  messages.forEach(msg => {
    state.voiceQueue.push({
      speaker: msg.dataset.speaker,
      text: msg.dataset.text,
      element: msg,
    });
  });

  playNextInQueue();
}

function playNextInQueue() {
  if (!state.voicePlaying || state.voiceQueue.length === 0) {
    stopVoiceDebate();
    return;
  }

  const item = state.voiceQueue.shift();
  const synth = window.speechSynthesis;

  const indicator = document.getElementById('speaking-indicator');
  const speakerName = document.getElementById('speaking-name');
  if (indicator) indicator.classList.remove('hidden');
  if (speakerName) speakerName.textContent = item.speaker;

  document.querySelectorAll('.debate-message').forEach(m => m.style.opacity = '0.4');
  item.element.style.opacity = '1';
  item.element.style.boxShadow = '0 0 24px var(--accent-blue-glow)';
  item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const utterance = new SpeechSynthesisUtterance(item.text);
  utterance.rate = state.voiceSpeed;
  utterance.pitch = 1.0;

  const voice = voiceMap[item.speaker];
  if (voice) utterance.voice = voice;

  utterance.onend = () => {
    item.element.style.boxShadow = 'none';
    setTimeout(() => playNextInQueue(), 400);
  };

  utterance.onerror = () => {
    playNextInQueue();
  };

  state.currentUtterance = utterance;
  synth.speak(utterance);
}

function pauseVoiceDebate() {
  window.speechSynthesis.pause();
  state.voicePlaying = false;
  const btn = document.getElementById('btn-voice-play');
  if (btn) {
    btn.textContent = '▶';
    btn.classList.remove('playing');
  }
}

function stopVoiceDebate() {
  window.speechSynthesis.cancel();
  state.voicePlaying = false;
  state.voiceQueue = [];

  const btn = document.getElementById('btn-voice-play');
  if (btn) {
    btn.textContent = '▶';
    btn.classList.remove('playing');
  }

  const indicator = document.getElementById('speaking-indicator');
  if (indicator) indicator.classList.add('hidden');

  document.querySelectorAll('.debate-message').forEach(m => {
    m.style.opacity = '1';
    m.style.boxShadow = 'none';
  });
}

function updateVoiceSpeed(speed) {
  state.voiceSpeed = parseFloat(speed);
}

// ═══════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text) {
  if (!text) return '';
  return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getScoreColor(score) {
  if (score >= 8) return '#10b981';
  if (score >= 6) return '#34d399';
  if (score >= 5) return '#fbbf24';
  if (score >= 3) return '#f97316';
  return '#f43f5e';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
