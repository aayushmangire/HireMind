import { useState, useRef, useEffect } from "react";
import HomeHeroLandingScrollAnimation from "@/components/ui/home-hero-landing-scroll-animation";
import { HandwritingSvg } from "@/components/ui/handwriting-svg";
import EvaluationDashboard from "./components/evaluation/EvaluationDashboard";
import { runCandidateEvaluation } from "./services/evaluationService";
import { extractTextFromFile, extractCandidateNameFromResume } from "./utils/fileParser";
import { EvaluationResult } from "./types/evaluation";
import {
  Bot,
  Cpu,
  ShieldCheck,
  Scale,
  ArrowRight,
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  Briefcase,
  X
} from "lucide-react";

interface FileUploadDropzoneProps {
  label: string;
  description: string;
  icon: any;
  fileName: string | null;
  extractedText: string;
  required?: boolean;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}

function FileUploadDropzone({
  label,
  description,
  icon: Icon,
  fileName,
  extractedText,
  required = false,
  onFileSelect,
  onClear
}: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const wordCount = extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0;
  const isUploaded = Boolean(fileName && extractedText);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => {
        if (!isUploaded) fileInputRef.current?.click();
      }}
      className={`p-5 rounded-3xl border-2 transition-all duration-200 relative group flex flex-col justify-between min-h-[220px] ${
        isDragging
          ? "border-black bg-black/5 scale-[1.01]"
          : isUploaded
          ? "border-emerald-500/40 bg-emerald-50/20 shadow-xs"
          : "border-dashed border-black/15 bg-white hover:border-black/30 hover:bg-black/[0.01] cursor-pointer"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
      />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isUploaded ? "bg-emerald-500 text-white shadow-sm" : "bg-black/5 text-black/70"
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-xs md:text-sm text-[#141414]">{label}</h4>
              {required && (
                <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 px-1.5 py-0.2 rounded">
                  Required
                </span>
              )}
            </div>
            <p className="text-[11px] text-black/50 leading-tight mt-0.5">{description}</p>
          </div>
        </div>

        {isUploaded && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="p-1.5 rounded-full hover:bg-black/10 text-black/40 hover:text-black transition-colors cursor-pointer"
            title="Remove File"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isUploaded ? (
        <div className="space-y-2 mt-auto">
          <div className="p-3 rounded-2xl bg-white border border-emerald-200/80 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                {fileName?.endsWith(".pdf") ? "PDF" : "TXT"}
              </span>
              <span className="text-xs font-semibold truncate text-[#141414]">{fileName}</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-2" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-black/50 px-1">
            <span>{wordCount.toLocaleString()} words parsed</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="text-black font-semibold hover:underline cursor-pointer"
            >
              Replace
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 text-center mt-auto">
          <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center mb-2 text-black/60 group-hover:scale-110 transition-transform">
            <Upload className="w-4 h-4" />
          </div>
          <p className="text-xs font-medium text-black/80">
            Drop <span className="font-semibold text-black">.pdf</span> or{" "}
            <span className="font-semibold text-black">.txt</span> here
          </p>
          <span className="text-[10px] text-black/40 mt-0.5">
            Click to browse files
          </span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [resumeText, setResumeText] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [transcriptFileName, setTranscriptFileName] = useState<string | null>(null);
  const [jobDescFileName, setJobDescFileName] = useState<string | null>(null);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationStage, setEvaluationStage] = useState<string>("");
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToEvaluation = () => {
    const el = document.getElementById("evaluate");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleFileUpload = async (
    file: File | undefined,
    setText: (t: string) => void,
    setFileName: (n: string | null) => void,
    isResume: boolean = false
  ) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "txt") {
      alert("Unsupported file type. Please upload a .pdf or .txt file.");
      return;
    }
    try {
      setFileName(`${file.name} (Extracting...)`);
      const text = await extractTextFromFile(file);
      setText(text);
      setFileName(file.name);

      if (isResume) {
        const detectedName = extractCandidateNameFromResume(text);
        if (detectedName) {
          setCandidateName(detectedName);
        }
      }
    } catch (err) {
      console.error("Error reading uploaded file:", err);
      setFileName(`Error loading ${file.name}`);
    }
  };

  const handleLaunchDebate = async () => {
    if (!resumeText.trim() && !transcriptText.trim()) return;

    const effectiveName =
      candidateName.trim() ||
      extractCandidateNameFromResume(resumeText) ||
      "Candidate";

    if (!candidateName.trim() && effectiveName !== "Candidate") {
      setCandidateName(effectiveName);
    }

    setIsEvaluating(true);
    setEvaluationResult(null);

    setEvaluationStage("Extracting Candidate Facts & Evidence Profile...");
    const t1 = setTimeout(() => {
      setEvaluationStage("Dispatching 4 Independent Agent Personas (Isolated LLM Calls)...");
    }, 600);

    const t2 = setTimeout(() => {
      setEvaluationStage("Initiating 2-Round Cross-Examination Debate & Disagreement Resolution...");
    }, 1300);

    const t3 = setTimeout(() => {
      setEvaluationStage("Synthesizing Weighted Non-Averaged Adjudication...");
    }, 2000);

    try {
      const result = await runCandidateEvaluation(
        resumeText,
        transcriptText,
        effectiveName,
        jobDescription || "Job Description",
        undefined,
        true
      );

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      setEvaluationResult(result);
      setIsEvaluating(false);

      setTimeout(() => {
        const resultsEl = document.getElementById("results");
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } catch (err) {
      console.error("Evaluation execution error:", err);
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#141414] selection:bg-black selection:text-white relative">
      <div
        className={`fixed top-6 left-6 md:top-8 md:left-10 z-50 transition-all duration-300 pointer-events-none ${
          isScrolled ? "opacity-0 -translate-y-3" : "opacity-100 translate-y-0"
        }`}
        style={{
          fontFamily: "'Office Sans', 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif",
          letterSpacing: "-0.03em",
        }}
      >
        <span className="font-extrabold tracking-tight text-[#141414] select-none text-4xl md:text-5xl" style={{ fontSize: "44px" }}>
          HireMind
        </span>
      </div>

      {/* Main GSAP Scroll Animation */}
      <main>
        <HomeHeroLandingScrollAnimation />

        {/* 4 AI Agents & HireMind Brand Overview */}
        <section id="agents" className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-20 border-t border-black/5">
          <div className="text-center max-w-2xl mx-auto mb-14 flex flex-col items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-4 rounded-full bg-black/5 text-xs font-semibold uppercase tracking-wider text-black/60 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Introducing
            </div>

            {/* Animated Handwriting SVG for HireMind with Multi-Font Looping */}
            <div className="my-2 w-full flex items-center justify-center">
              <HandwritingSvg
                duration={1.5}
                pauseDelay={1.5}
                className="text-[#141414]"
              />
            </div>

            <p className="mt-4 text-base md:text-lg text-black/70 font-light leading-relaxed">
              Where AI Personas clash, debate, and eliminate bias in hiring decisions. Upload candidate PDFs & transcripts to begin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Agent 1 */}
            <div className="group p-6 rounded-3xl bg-white border border-black/10 hover:border-black/25 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-[10px] font-bold tracking-wider uppercase text-blue-600 mb-1">Agent 01</div>
              <h3 className="text-lg font-bold text-[#141414] mb-2">Technical Lead</h3>
              <p className="text-xs text-black/60 leading-relaxed">
                Evaluates system architecture, coding depth, concurrency guarantees, and technical edge cases.
              </p>
            </div>

            {/* Agent 2 */}
            <div className="group p-6 rounded-3xl bg-white border border-black/10 hover:border-black/25 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 mb-1">Agent 02</div>
              <h3 className="text-lg font-bold text-[#141414] mb-2">Culture & People</h3>
              <p className="text-xs text-black/60 leading-relaxed">
                Analyzes behavioral EQ, team communication, ownership mindset, and cross-functional leadership.
              </p>
            </div>

            {/* Agent 3 */}
            <div className="group p-6 rounded-3xl bg-white border border-black/10 hover:border-black/25 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Scale className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-[10px] font-bold tracking-wider uppercase text-amber-600 mb-1">Agent 03</div>
              <h3 className="text-lg font-bold text-[#141414] mb-2">Hiring Manager</h3>
              <p className="text-xs text-black/60 leading-relaxed">
                Balances technical velocity against team ROI, role readiness, and critical hiring milestones.
              </p>
            </div>

            {/* Agent 4 */}
            <div className="group p-6 rounded-3xl bg-white border border-black/10 hover:border-black/25 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-rose-600" />
              </div>
              <div className="text-[10px] font-bold tracking-wider uppercase text-rose-600 mb-1">Agent 04</div>
              <h3 className="text-lg font-bold text-[#141414] mb-2">The Skeptic</h3>
              <p className="text-xs text-black/60 leading-relaxed">
                Cross-examines claims for resume embellishments, evasive interview answers, and unverified achievements.
              </p>
            </div>
          </div>

          {/* "Start Candidate Evaluation" CTA Button — Positioned below the 4 AI Agents */}
          <div className="mt-14 flex flex-col items-center justify-center text-center">
            <button
              type="button"
              onClick={scrollToEvaluation}
              className="inline-flex items-center gap-3 px-9 py-4 rounded-full bg-black text-white text-sm md:text-base font-semibold tracking-tight shadow-xl hover:bg-neutral-800 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            >
              <span>Start Candidate Evaluation</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="mt-3.5 text-xs text-black/50">
              Upload resume and interview transcript files (.PDF / .TXT) for autonomous multi-agent debate
            </p>
          </div>
        </section>

        {/* Candidate Evaluation & Upload Section */}
        <section id="evaluate" className="relative z-10 max-w-5xl mx-auto px-6 py-16">
          <div className="p-8 md:p-12 rounded-3xl bg-white border border-black/10 shadow-xl">
            <div className="mb-8 pb-6 border-b border-black/5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-black/40">File-Based Evaluation Workspace</span>
                <h3 className="text-2xl font-bold tracking-tight">Upload Candidate Dossier (.PDF / .TXT)</h3>
                <p className="text-xs text-black/60 mt-1">
                  Upload candidate documents as PDF or TXT files. AI personas will parse, extract evidence, debate, and adjudicate.
                </p>
              </div>
            </div>

            {/* Candidate Name Input */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-black/70 mb-1.5">
                Candidate Name <span className="text-black/40 font-normal">(Auto-detected from resume or enter manually)</span>
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. Alex Chen (auto-detected from uploaded resume)"
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            {/* 3 Dedicated PDF / TXT File Upload Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <FileUploadDropzone
                label="Job Description"
                description="Target role specification & requirements"
                icon={Briefcase}
                fileName={jobDescFileName}
                extractedText={jobDescription}
                onFileSelect={(file) => handleFileUpload(file, setJobDescription, setJobDescFileName, false)}
                onClear={() => {
                  setJobDescription("");
                  setJobDescFileName(null);
                }}
              />
              <FileUploadDropzone
                label="Resume / CV"
                description="Candidate career history, skills & achievements"
                icon={FileText}
                fileName={resumeFileName}
                extractedText={resumeText}
                required
                onFileSelect={(file) => handleFileUpload(file, setResumeText, setResumeFileName, true)}
                onClear={() => {
                  setResumeText("");
                  setResumeFileName(null);
                }}
              />
              <FileUploadDropzone
                label="Interview Transcript"
                description="Raw dialogue & Q&A transcript"
                icon={Upload}
                fileName={transcriptFileName}
                extractedText={transcriptText}
                required
                onFileSelect={(file) => handleFileUpload(file, setTranscriptText, setTranscriptFileName, false)}
                onClear={() => {
                  setTranscriptText("");
                  setTranscriptFileName(null);
                }}
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-black/5">
              <div className="text-xs flex items-center gap-1.5">
                {resumeText.trim() && transcriptText.trim() ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Documents parsed & ready for 4-Agent Debate Simulation</span>
                  </div>
                ) : (
                  <span className="text-black/50">
                    Upload Resume (.pdf/.txt) and Transcript (.pdf/.txt) or load sample to launch debate.
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleLaunchDebate}
                disabled={(!resumeText.trim() || !transcriptText.trim()) || isEvaluating}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer group"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Analyzing & Debating...</span>
                  </>
                ) : (
                  <>
                    <span>Launch Multi-Agent Debate</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>

            {/* Live Progress Stage Feedback */}
            {isEvaluating && (
              <div className="mt-6 p-4 rounded-2xl bg-black/5 border border-black/10 flex items-center gap-3 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-black" />
                <span className="text-xs font-semibold text-black/80">{evaluationStage}</span>
              </div>
            )}
          </div>
        </section>

        {/* Results & Multi-Agent Debate Dashboard Section */}
        {evaluationResult && (
          <section id="results" className="relative z-10 py-8">
            <EvaluationDashboard
              result={evaluationResult}
              onReset={() => {
                setEvaluationResult(null);
                scrollToEvaluation();
              }}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-black/5 py-12 text-center text-xs text-black/40">
        <p>PromptWars © 2026 — Evidence-backed Multi-Agent Candidate Evaluation System</p>
      </footer>
    </div>
  );
}
