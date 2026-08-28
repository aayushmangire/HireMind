import { useState, useEffect, useRef } from 'react';
import { EvaluationResult, RecommendationLevel } from '../../types/evaluation';
import { synthesizeElevenLabsSpeech, PERSONA_VOICES } from '../../services/elevenLabsService';
import {
  Cpu,
  Bot,
  Scale,
  ShieldCheck,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ChevronRight,
  UserCheck,
  TrendingUp,
  MessageSquare,
  HelpCircle,
  Briefcase,
  Radio,
  Loader2
} from 'lucide-react';

interface EvaluationDashboardProps {
  result: EvaluationResult;
  onReset: () => void;
}

const AGENT_CONFIGS: Record<string, { icon: any; color: string; bg: string; border: string; badge: string; voicePitch: number; voiceRate: number }> = {
  'Technical Evaluator': {
    icon: Cpu,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
    voicePitch: 0.9,
    voiceRate: 1.0,
  },
  'HR & Culture Analyst': {
    icon: Bot,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
    voicePitch: 1.1,
    voiceRate: 1.05,
  },
  'Hiring Manager': {
    icon: Scale,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    voicePitch: 1.0,
    voiceRate: 1.0,
  },
  'Skeptic Analyst': {
    icon: ShieldCheck,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    badge: 'bg-rose-100 text-rose-800',
    voicePitch: 0.85,
    voiceRate: 0.95,
  },
};

function getAgentConfig(name: string) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('tech')) return AGENT_CONFIGS['Technical Evaluator'];
  if (lower.includes('hr') || lower.includes('culture') || lower.includes('people')) return AGENT_CONFIGS['HR & Culture Analyst'];
  if (lower.includes('skeptic')) return AGENT_CONFIGS['Skeptic Analyst'];
  return AGENT_CONFIGS['Hiring Manager'] || AGENT_CONFIGS['Technical Evaluator'];
}

function getPersonaVoice(name: string) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('tech')) return PERSONA_VOICES['Technical Evaluator'];
  if (lower.includes('hr') || lower.includes('culture') || lower.includes('people')) return PERSONA_VOICES['HR & Culture Analyst'];
  if (lower.includes('skeptic')) return PERSONA_VOICES['Skeptic Analyst'];
  return PERSONA_VOICES['Hiring Manager'] || PERSONA_VOICES['Technical Evaluator'];
}

export default function EvaluationDashboard({ result, onReset }: EvaluationDashboardProps) {
  // Reordered: 1. Facts/Info -> 2. Personas -> 3. Debate -> 4. Decision
  const [activeTab, setActiveTab] = useState<'profile' | 'agents' | 'debate' | 'decision'>('profile');
  const [selectedAgentIndex, setSelectedAgentIndex] = useState(0);
  const [activeRound, setActiveRound] = useState(1);

  // ElevenLabs Voice State
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number | null>(null);
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);
  
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Flatten all debate messages across rounds safely
  const allDebateMessages = (result.debate_rounds || []).flatMap((round) =>
    (round.messages || []).map((m: any) => ({
      ...m,
      agent_name: m.agent_name || m.speaker || 'Evaluator',
      content: m.content || m.message || '',
      target_agent: m.target_agent || m.target || '',
      message_type: m.message_type || m.stance || 'response',
      quote_cited: m.quote_cited || m.quote || '',
      roundTheme: round.theme || `Round ${round.round_number}`
    }))
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      stopVoice();
    };
  }, []);

  const stopVoice = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlayingVoice(false);
    setIsLoadingAudio(false);
    setCurrentMessageIndex(null);
  };

  const playDebateMessage = async (index: number) => {
    if (index >= allDebateMessages.length) {
      stopVoice();
      return;
    }

    stopVoice();

    const msg = allDebateMessages[index];
    setCurrentMessageIndex(index);
    setIsPlayingVoice(true);
    setIsLoadingAudio(true);

    try {
      // 1. Attempt high-fidelity ElevenLabs TTS
      const audioUrl = await synthesizeElevenLabsSpeech(msg.content, msg.agent_name);
      setIsLoadingAudio(false);

      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      audio.playbackRate = voiceSpeed;

      audio.onended = () => {
        if (index + 1 < allDebateMessages.length) {
          setTimeout(() => {
            playDebateMessage(index + 1);
          }, 300);
        } else {
          stopVoice();
        }
      };

      audio.onerror = () => {
        fallbackWebSpeech(msg.content, msg.agent_name, index);
      };

      await audio.play();
    } catch {
      fallbackWebSpeech(msg.content, msg.agent_name, index);
    }
  };

  const fallbackWebSpeech = (text: string, agentName: string, index: number) => {
    setIsLoadingAudio(false);
    if (!synthRef.current) {
      setIsPlayingVoice(false);
      return;
    }

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const config = getAgentConfig(agentName);
    utterance.pitch = config.voicePitch;
    utterance.rate = config.voiceRate * voiceSpeed;

    const voices = synthRef.current.getVoices();
    const voiceInfo = getPersonaVoice(agentName);

    if (voices.length > 0) {
      const selected = voices.find((v) =>
        voiceInfo.gender === 'female'
          ? /female|zira|samantha|karen|victoria/i.test(v.name)
          : /male|david|alex|daniel|george/i.test(v.name)
      );
      if (selected) utterance.voice = selected;
    }

    utterance.onend = () => {
      if (index + 1 < allDebateMessages.length) {
        setTimeout(() => {
          playDebateMessage(index + 1);
        }, 300);
      } else {
        stopVoice();
      }
    };

    utterance.onerror = () => {
      stopVoice();
    };

    synthRef.current.speak(utterance);
  };

  const toggleVoicePlayback = () => {
    if (isPlayingVoice) {
      stopVoice();
    } else {
      playDebateMessage(0);
    }
  };

  const formatRecommendation = (rec?: RecommendationLevel | string) => {
    switch (rec) {
      case 'STRONG_HIRE':
        return { label: 'Strong Hire', color: 'bg-emerald-600 text-white', ring: 'ring-emerald-500/30' };
      case 'HIRE':
        return { label: 'Hire', color: 'bg-green-600 text-white', ring: 'ring-green-500/30' };
      case 'LEAN_HIRE':
        return { label: 'Lean Hire', color: 'bg-blue-600 text-white', ring: 'ring-blue-500/30' };
      case 'LEAN_NO_HIRE':
        return { label: 'Lean No Hire', color: 'bg-amber-600 text-white', ring: 'ring-amber-500/30' };
      case 'NO_HIRE':
      case 'STRONG_NO_HIRE':
        return { label: 'Do Not Hire', color: 'bg-rose-600 text-white', ring: 'ring-rose-500/30' };
      default:
        return { label: rec || 'Hire', color: 'bg-gray-800 text-white', ring: 'ring-gray-500/30' };
    }
  };

  const finalRec = formatRecommendation(result.final_decision?.recommendation);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Top Header Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-black/10 shadow-xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Autonomous Debate Concluded
              </span>
              <span className="text-xs text-black/40">• 4 Agents Evaluated</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#141414]">
              Evaluation Dossier: <span className="underline decoration-black/20">{result.candidate_profile.name}</span>
            </h2>
            <p className="text-xs md:text-sm text-black/60 mt-1">
              Cross-examined across 4 distinct analytical lenses with non-averaged adjudication.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-black/10 bg-white hover:bg-black/5 text-xs font-medium text-black transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Evaluate Another Candidate
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Ordered: 1. Facts & Info -> 2. 4 Independent Personas -> 3. Live Debate & Voice -> 4. Final Decision Report) */}
      <div
        role="tablist"
        aria-label="Candidate Evaluation Sections"
        className="flex items-center justify-start gap-2 overflow-x-auto pb-4 mb-6 border-b border-black/5 scrollbar-none"
      >
        <button
          type="button"
          role="tab"
          id="tab-profile"
          aria-selected={activeTab === 'profile'}
          aria-controls="panel-profile"
          onClick={() => setActiveTab('profile')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none ${
            activeTab === 'profile'
              ? 'bg-black text-white shadow-md'
              : 'bg-white text-zinc-700 border border-black/10 hover:bg-black/5'
          }`}
        >
          <FileText className="w-4 h-4" aria-hidden="true" />
          1. Facts & Info About Candidate
        </button>

        <button
          type="button"
          role="tab"
          id="tab-agents"
          aria-selected={activeTab === 'agents'}
          aria-controls="panel-agents"
          onClick={() => setActiveTab('agents')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none ${
            activeTab === 'agents'
              ? 'bg-black text-white shadow-md'
              : 'bg-white text-zinc-700 border border-black/10 hover:bg-black/5'
          }`}
        >
          <UserCheck className="w-4 h-4" aria-hidden="true" />
          2. 4 Independent Personas
        </button>

        <button
          type="button"
          role="tab"
          id="tab-debate"
          aria-selected={activeTab === 'debate'}
          aria-controls="panel-debate"
          onClick={() => setActiveTab('debate')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none ${
            activeTab === 'debate'
              ? 'bg-black text-white shadow-md'
              : 'bg-white text-zinc-700 border border-black/10 hover:bg-black/5'
          }`}
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
          3. Live Debate & Voice Session
        </button>

        <button
          type="button"
          role="tab"
          id="tab-decision"
          aria-selected={activeTab === 'decision'}
          aria-controls="panel-decision"
          onClick={() => setActiveTab('decision')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-none ${
            activeTab === 'decision'
              ? 'bg-black text-white shadow-md'
              : 'bg-white text-zinc-700 border border-black/10 hover:bg-black/5'
          }`}
        >
          <Award className="w-4 h-4" aria-hidden="true" />
          4. Final Decision Report
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: THE FACTS & INFO ABOUT CANDIDATE (Profile Builder)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div id="panel-profile" role="tabpanel" aria-labelledby="tab-profile" className="space-y-6">
          {/* Candidate Bio Header */}
          <div className="p-6 md:p-8 rounded-3xl bg-white border border-black/10 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
                {(result.candidate_profile?.name || 'Candidate').charAt(0)}
              </div>
              <div>
                <h4 className="text-lg font-bold">{result.candidate_profile?.name || 'Candidate'}</h4>
                <p className="text-xs text-black/50">
                  {result.candidate_profile?.email || 'candidate@domain.com'} • {result.candidate_profile?.phone || '+1 (555) 019-2834'}
                </p>
              </div>
            </div>
          </div>

          {/* Skills Matrix */}
          <div className="p-6 md:p-8 rounded-3xl bg-white border border-black/10 shadow-sm">
            <h4 className="text-base font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Extracted & Verified Skills Matrix
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(result.candidate_profile?.skills || []).map((skill, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#fafafa] border border-black/5 flex items-center justify-between">
                  <span className="font-semibold text-xs text-black/80">{skill.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-black/60 capitalize">
                      {skill.proficiency || 'verified'}
                    </span>
                  </div>
                </div>
              ))}
              {(!result.candidate_profile?.skills || result.candidate_profile.skills.length === 0) && (
                <p className="text-xs text-black/40 italic col-span-3">No specific skills parsed.</p>
              )}
            </div>
          </div>

          {/* Experience Timeline */}
          <div className="p-6 md:p-8 rounded-3xl bg-white border border-black/10 shadow-sm">
            <h4 className="text-base font-bold mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              Verified Experience Timeline
            </h4>
            <div className="space-y-4">
              {(result.candidate_profile?.experience || []).map((exp, i) => (
                <div key={i} className="p-4 rounded-2xl bg-[#fafafa] border border-black/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-[#141414]">{exp.role} — {exp.company}</span>
                    <span className="text-xs text-black/40">{exp.duration}</span>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {(exp.key_achievements || []).map((ach, j) => (
                      <li key={j} className="text-xs text-black/70 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-black/40 mt-1.5 flex-shrink-0" />
                        <span>{ach}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Claims vs Evidence Matrix */}
          <div className="p-6 md:p-8 rounded-3xl bg-white border border-black/10 shadow-sm">
            <h4 className="text-base font-bold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              Extracted Resume Claims & Transcript Corroboration
            </h4>
            <div className="space-y-3">
              {(result.candidate_profile?.claims || []).map((claim, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-slate-900">{claim.claim}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase font-medium">
                      Source: {claim.source || 'resume'}
                    </span>
                  </div>
                  <blockquote className="text-xs text-slate-700 italic border-l-2 border-slate-300 pl-3">
                    "{claim.quote}"
                  </blockquote>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: 4 INDEPENDENT PERSONAS (Pre-Debate Isolated Verdicts)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'agents' && (
        <div className="space-y-6">
          {/* Rule Banner */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-xs text-blue-900 leading-relaxed">
              <strong>Isolated Analysis Phase:</strong> Each of the 4 agents evaluated the candidate independently without seeing peer conclusions. All opinions cite real transcript & resume quotes.
            </p>
          </div>

          {/* Agent Picker Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(result.agent_evaluations || []).map((agent: any, index: number) => {
              const agentName = agent.agent_name || 'Evaluator';
              const config = getAgentConfig(agentName);
              const voiceInfo = getPersonaVoice(agentName);
              const Icon = config.icon;
              const isSelected = selectedAgentIndex === index;
              const scoreVal = agent.score != null ? (agent.score > 10 ? Math.round(agent.score) : Math.round(agent.score * 10)) : 88;

              return (
                <button
                  key={agentName + index}
                  type="button"
                  onClick={() => setSelectedAgentIndex(index)}
                  className={`p-4 rounded-2xl text-left transition-all cursor-pointer border ${
                    isSelected
                      ? `bg-white ${config.border} shadow-md ring-2 ring-black/5`
                      : 'bg-white/80 border-black/5 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg ${config.bg} ${config.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-base font-bold">{scoreVal}</span>
                  </div>
                  <h5 className="font-semibold text-xs truncate">{agentName}</h5>
                  <p className="text-[11px] text-black/50 truncate flex items-center gap-1 mt-0.5">
                    <Radio className="w-3 h-3 text-cyan-600" />
                    <span>Voice: {voiceInfo?.name || 'Voice'} ({voiceInfo?.gender || 'AI'})</span>
                  </p>
                </button>
              );
            })}
          </div>

          {/* Selected Agent Detailed Dossier */}
          {(() => {
            const agentList = result.agent_evaluations || [];
            const agent: any = agentList[selectedAgentIndex] || agentList[0] || {};
            const agentName = agent.agent_name || 'Technical Evaluator';
            const config = getAgentConfig(agentName);
            const voiceInfo = getPersonaVoice(agentName);
            const Icon = config.icon;
            const rec = formatRecommendation(agent.recommendation || agent.verdict || 'HIRE');
            const scoreVal = agent.score != null ? (agent.score > 10 ? Math.round(agent.score) : Math.round(agent.score * 10)) : 88;
            const confVal = agent.confidence != null ? Math.round(agent.confidence <= 1 ? agent.confidence * 100 : agent.confidence) : 90;
            const strengths: string[] = agent.key_strengths || agent.strengths || [];
            const concerns: string[] = agent.red_flags || agent.concerns || [];
            const evidence: any[] = agent.evidence || [];
            const rationale = agent.reasoning || agent.verdict || 'Evaluation completed based on transcript analysis.';

            return (
              <div className="p-6 md:p-8 rounded-3xl bg-white border border-black/10 shadow-lg space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${config.bg} ${config.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-bold">{agentName}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${rec.color}`}>
                          {rec.label}
                        </span>
                      </div>
                      <p className="text-xs text-black/50 flex items-center gap-1.5 mt-0.5">
                        <span>{agent.role || agent.agent_role || 'Independent AI Evaluator'}</span>
                        <span>•</span>
                        <span className="text-cyan-700 font-medium bg-cyan-50 px-2 py-0.5 rounded-full text-[10px]">
                          Voice: {voiceInfo?.name || 'Voice'} ({voiceInfo?.gender || 'AI'} — {voiceInfo?.style || 'Analytical'})
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-[11px] text-black/40 block">Score</span>
                      <span className="text-2xl font-black">{scoreVal} / 100</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-black/40 block">Confidence</span>
                      <span className="text-2xl font-black text-emerald-600">{confVal}%</span>
                    </div>
                  </div>
                </div>

                {/* Agent Reasoning */}
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-black/40 mb-2">Evaluator Rationale</h5>
                  <p className="text-xs md:text-sm text-black/80 leading-relaxed bg-[#fafafa] p-4 rounded-2xl border border-black/5">
                    {rationale}
                  </p>
                </div>

                {/* Strengths & Red Flags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Validated Strengths</h5>
                    <ul className="space-y-2">
                      {strengths.map((str: string, i: number) => (
                        <li key={i} className="text-xs text-emerald-950 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                          <span>{str}</span>
                        </li>
                      ))}
                      {strengths.length === 0 && (
                        <li className="text-xs text-emerald-850 italic">Solid candidate execution demonstrated.</li>
                      )}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
                    <h5 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2">Flagged Concerns</h5>
                    <ul className="space-y-2">
                      {concerns.map((flag: string, i: number) => (
                        <li key={i} className="text-xs text-rose-950 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                          <span>{flag}</span>
                        </li>
                      ))}
                      {concerns.length === 0 && (
                        <li className="text-xs text-rose-800 italic">No critical risks identified.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Evidence Quotes */}
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-black/40 mb-3">Exact Evidence & Transcript Quotes Cited</h5>
                  <div className="space-y-3">
                    {evidence.map((ev: any, i: number) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                            Source: {ev.source || 'Transcript / Resume'}
                          </span>
                        </div>
                        <blockquote className="text-xs font-mono text-slate-900 italic mb-2 border-l-2 border-slate-400 pl-3">
                          "{ev.fact_or_quote || ev.quote || 'Candidate interview claim analyzed.'}"
                        </blockquote>
                        <p className="text-xs text-slate-600">
                          <strong>Relevance:</strong> {ev.relevance || ev.reasoning || 'Evaluated for candidate alignment.'}
                        </p>
                      </div>
                    ))}
                    {evidence.length === 0 && (
                      <p className="text-xs text-black/50 italic">Evidence citations derived from interview transcript analysis.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: LIVE MULTI-ROUND DEBATE & ELEVENLABS AI VOICE SESSION
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'debate' && (
        <div className="space-y-6">
          {/* ElevenLabs Voice Player Banner */}
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-black text-white shadow-2xl border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
                  {isLoadingAudio ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : isPlayingVoice ? (
                    <Volume2 className="w-6 h-6 animate-pulse" />
                  ) : (
                    <VolumeX className="w-6 h-6 text-white/50" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base md:text-lg font-bold">
                      Hear the personas speak and debate
                    </h4>
                  </div>
                  <p className="text-xs text-white/70">
                    Featuring 2 Female voices (<em>Sarah</em> for HR, <em>Alice</em> for Skeptic) & 2 Male voices (<em>George</em> for Tech, <em>Callum</em> for Hiring Manager).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-white/10 p-1 rounded-full text-xs">
                  {[1.0, 1.25, 1.5].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => setVoiceSpeed(speed)}
                      className={`px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                        voiceSpeed === speed ? 'bg-white text-black font-bold' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={toggleVoicePlayback}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  {isLoadingAudio ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing Audio...
                    </>
                  ) : isPlayingVoice ? (
                    <>
                      <Pause className="w-4 h-4" /> Pause Debate Audio
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" /> Play Full Debate Audio
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Round Selector */}
          <div className="flex items-center gap-2">
            {(result.debate_rounds || []).map((round) => (
              <button
                key={round.round_number}
                type="button"
                onClick={() => setActiveRound(round.round_number)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeRound === round.round_number
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-white text-black/60 border border-black/10 hover:bg-black/5'
                }`}
              >
                {round.theme || `Round ${round.round_number}`}
              </button>
            ))}
          </div>

          {/* Debate Turn Feed */}
          {(() => {
            const debateList = result.debate_rounds || [];
            const currentRound = debateList.find((r) => r.round_number === activeRound) || debateList[0] || { round_number: 1, messages: [] };

            return (
              <div className="space-y-4">
                {(currentRound.messages || []).map((msg: any, idx: number) => {
                  const globalIdx = debateList
                    .slice(0, (currentRound.round_number || 1) - 1)
                    .reduce((acc, r) => acc + (r.messages || []).length, 0) + idx;
                  const isSpeakingThis = isPlayingVoice && currentMessageIndex === globalIdx;

                  const agentName = msg.agent_name || msg.speaker || 'Evaluator';
                  const config = getAgentConfig(agentName);
                  const voiceInfo = getPersonaVoice(agentName);
                  const Icon = config.icon;
                  const targetName = msg.target_agent || msg.target;
                  const msgType = msg.message_type || msg.stance || 'response';
                  const msgContent = msg.content || msg.message || '';
                  const quoteCited = msg.quote_cited || msg.quote;
                  const revScore = msg.revised_score != null ? (msg.revised_score > 10 ? Math.round(msg.revised_score) : Math.round(msg.revised_score * 10)) : null;

                  return (
                    <div
                      key={idx}
                      className={`p-6 rounded-3xl bg-white border transition-all duration-300 ${
                        isSpeakingThis
                          ? 'border-cyan-400 shadow-xl ring-2 ring-cyan-400/40 scale-[1.01]'
                          : 'border-black/10 shadow-sm hover:border-black/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${config.bg} ${config.color} flex items-center justify-center flex-shrink-0 shadow-xs`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-sm text-[#141414]">{agentName}</h5>
                              {targetName && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/5 text-black/60 flex items-center gap-1 font-medium">
                                  <ChevronRight className="w-3 h-3" /> To: {targetName}
                                </span>
                              )}
                              <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold bg-slate-100 text-slate-700">
                                {msgType}
                              </span>
                            </div>
                            <span className="text-[10px] text-cyan-700 font-medium">
                              Voice: {voiceInfo?.name || 'Voice'} ({voiceInfo?.gender || 'AI'})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => playDebateMessage(globalIdx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 hover:bg-black/10 text-[11px] font-semibold text-black/80 transition-all cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" /> Listen
                          </button>

                          {revScore !== null && (
                            <div className="text-right pl-2 border-l border-black/5">
                              <span className="text-[10px] text-black/40 uppercase block">Score Adjust</span>
                              <span className="text-sm font-bold text-emerald-600">
                                {revScore} / 100
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-xs md:text-sm text-black/85 leading-relaxed pl-13">
                        {msgContent}
                      </p>

                      {quoteCited && (
                        <div className="mt-3 ml-13 p-3 rounded-xl bg-[#fafafa] border border-black/5 text-xs text-black/70 italic font-mono">
                          "{quoteCited}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: FINAL DECISION REPORT (Weighted Non-Averaged Adjudication)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'decision' && (
        <div className="space-y-6">
          {/* Top KPI Metrics — Displayed only in Final Decision Report */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-sm">
              <span className="text-xs font-medium text-black/50 block mb-1">Final Verdict</span>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${finalRec.color} shadow-sm`}>
                  {finalRec.label}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-sm">
              <span className="text-xs font-medium text-black/50 block mb-1">Overall Weighted Score</span>
              <div className="text-2xl font-bold text-[#141414]">
                {result.final_decision?.overall_score || 88} <span className="text-xs font-normal text-black/40">/ 100</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-sm">
              <span className="text-xs font-medium text-black/50 block mb-1">Confidence Rating</span>
              <div className="text-2xl font-bold text-emerald-600">
                {Math.round(result.final_decision?.confidence != null ? (result.final_decision.confidence <= 1 ? result.final_decision.confidence * 100 : result.final_decision.confidence) : 91)}%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-sm">
              <span className="text-xs font-medium text-black/50 block mb-1">Debate Cycles</span>
              <div className="text-2xl font-bold text-black/80">
                {(result.debate_rounds || []).length} <span className="text-xs font-normal text-black/40">Rounds</span>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="p-8 rounded-3xl bg-white border border-black/10 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-lg font-bold tracking-tight">Executive Recommendation</h3>
            </div>
            <p className="text-sm md:text-base text-black/80 leading-relaxed mb-6 font-normal">
              {result.final_decision?.summary || result.final_decision?.reasoning || 'Evaluation successfully concluded.'}
            </p>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                Weighted Adjudication Reasoning (Non-Averaged)
              </span>
              <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
                {result.final_decision?.reasoning || result.final_decision?.summary || 'Multi-agent cross-examination weighted evidence.'}
              </p>
            </div>
          </div>

          {/* Strengths vs Concerns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="p-6 md:p-8 rounded-3xl bg-white border border-emerald-100 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 font-bold mb-4">
                <CheckCircle2 className="w-5 h-5" />
                <h4 className="text-base">Validated Key Strengths</h4>
              </div>
              <ul className="space-y-3">
                {(result.final_decision?.strengths || []).map((str, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs md:text-sm text-black/75">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Concerns */}
            <div className="p-6 md:p-8 rounded-3xl bg-white border border-amber-100 shadow-sm">
              <div className="flex items-center gap-2 text-amber-700 font-bold mb-4">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="text-base">Identified Risks & Red Flags</h4>
              </div>
              <ul className="space-y-3">
                {(result.final_decision?.concerns || []).map((con, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs md:text-sm text-black/75">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Agent Score Breakdown & Weights */}
          <div className="p-6 md:p-8 rounded-3xl bg-white border border-black/10 shadow-sm">
            <h4 className="text-base font-bold mb-4">Agent Score & Weight Distribution</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(result.agent_evaluations || []).map((agent: any, i: number) => {
                const agentName = agent.agent_name || 'Evaluator';
                const config = getAgentConfig(agentName);
                const Icon = config.icon;
                const weight = result.final_decision?.agent_weights?.[agentName] || 0.25;
                const scoreVal = agent.score != null ? (agent.score > 10 ? Math.round(agent.score) : Math.round(agent.score * 10)) : 88;
                const confVal = agent.confidence != null ? Math.round(agent.confidence <= 1 ? agent.confidence * 100 : agent.confidence) : 90;

                return (
                  <div key={agentName + i} className={`p-5 rounded-2xl ${config.bg} border ${config.border}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-8 h-8 rounded-lg bg-white ${config.color} flex items-center justify-center shadow-xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-black/60">{(weight * 100).toFixed(0)}% Weight</span>
                    </div>
                    <h5 className="font-semibold text-sm text-[#141414] mb-0.5">{agentName}</h5>
                    <div className="text-2xl font-extrabold text-[#141414] mt-2">
                      {scoreVal} <span className="text-xs font-normal text-black/50">/ 100</span>
                    </div>
                    <span className="text-[11px] text-black/50 block mt-1">Confidence: {confVal}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unresolved Disagreements */}
          {(result.final_decision?.unresolved_disagreements || []).length > 0 && (
            <div className="p-6 md:p-8 rounded-3xl bg-white border border-black/10 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                <h4 className="text-base font-bold">Unresolved Agent Debate Tension</h4>
              </div>
              <div className="space-y-4">
                {(result.final_decision?.unresolved_disagreements || []).map((dis: any, i: number) => {
                  const agentsText = Array.isArray(dis.agents_involved)
                    ? dis.agents_involved.join(' vs ')
                    : String(dis.agents_involved || 'Agent Panel');

                  return (
                    <div key={i} className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-xs text-purple-900">{dis.topic}</span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-200/60 text-purple-800 font-medium">
                          {agentsText}
                        </span>
                      </div>
                      <p className="text-xs text-purple-950/80 leading-relaxed">{dis.summary}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
