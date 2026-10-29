import React, { useState, useRef, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useHackerProfile } from '../context/HackerProfileContext';
import { 
  Terminal as TerminalIcon, Send, Trash2, HelpCircle, Shield, Zap, 
  Sparkles, Flame, Eye, Skull, CheckCircle2, AlertTriangle, RefreshCw, 
  Clock, GitBranch, Award, ChevronRight, Play, Compass, BookOpen
} from 'lucide-react';
import { AiAssistantDrawer } from '../components/terminal/AiAssistantDrawer';

interface TerminalHistoryEntry {
  id: string;
  command: string;
  output: string;
  status: 'success' | 'error' | 'empty' | 'info';
  timestamp: string;
  aiCoachFeedback?: string[];
  eleganceXp?: number;
  detectionXp?: number;
  redTeamEvents?: string[];
  flagCaptured?: string;
  cwd?: string;
}

interface GhostReviewData {
  scenario_title: string;
  user_steps_taken: number;
  optimal_ghost_steps: number;
  efficiency_score: string;
  optimization_xp_earned: number;
  user_command_path: string[];
  ghost_optimal_path: Array<{ cmd: string; reason: string }>;
  decision_tree_breakdown: Array<{ step: number; decision: string; aiRationale: string; expertCommand: string }>;
  expert_verdict: string;
}

export const InteractiveTerminal: React.FC = () => {
  const { user } = useAuth();
  const { addXp, recordSolvedChallenge } = useHackerProfile();

  const [inputCmd, setInputCmd] = useState('');
  const [cwd, setCwd] = useState('/home/analyst');
  const [activeScenario, setActiveScenario] = useState<string>('Boss Scenario 01: The Inherited Compromised Server');
  const [sparringActive, setSparringActive] = useState<boolean>(false);
  const [escalationStep, setEscalationStep] = useState<number>(1);
  const [showGhostModal, setShowGhostModal] = useState<boolean>(false);
  const [ghostData, setGhostData] = useState<GhostReviewData | null>(null);
  const [ghostLoading, setGhostLoading] = useState<boolean>(false);
  const [showAiAssistant, setShowAiAssistant] = useState<boolean>(false);

  const [history, setHistory] = useState<TerminalHistoryEntry[]>([
    {
      id: 'init-1',
      command: 'ctf start boss',
      output: `=========================================================================\n  CYVANTIS AI-DRIVEN LINUX TERMINAL CTF LAB — SYSTEM BOOT\n=========================================================================\n[*] ACTIVE SCENARIO: Boss Scenario 01: The Inherited Compromised Server\n[*] NARRATIVE: Web server sluggish, CPU pegged at 94%, rogue C2 beacon on :4444.\n[*] AI COACH: Real-time syntax & performance coaching ACTIVE.\n[*] SHADOW LEARNING: Type 'ctf review' to compare with AI Ghost path.\n[*] AI RED TEAM: Type 'ctf sparring start' to enable live adversary sparring.\n\nType 'ps -ef', 'netstat', 'ls -la', or inspect /var/log/ to begin triage.`,
      status: 'info',
      timestamp: new Date().toLocaleTimeString(),
      aiCoachFeedback: [
        "[AI COACH] Senior Sysadmin initialized. I will analyze command efficiency, flag syntax mistakes, and award XP for elegant pipes."
      ],
      cwd: '/home/analyst'
    }
  ]);

  const [cmdIndexHistory, setCmdIndexHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleExecuteCommand = async (cmdToRun?: string) => {
    const commandText = (cmdToRun !== undefined ? cmdToRun : inputCmd).trim();
    if (!commandText) return;

    if (commandText.toLowerCase() === 'clear') {
      setHistory([]);
      setInputCmd('');
      return;
    }

    if (commandText.toLowerCase() === 'ctf review') {
      handleOpenGhostReview();
      setInputCmd('');
      return;
    }

    setLoading(true);
    setInputCmd('');
    setCmdIndexHistory((prev) => [commandText, ...prev]);
    setHistoryPointer(-1);

    try {
      const res = await apiRequest<{
        command: string;
        output: string;
        ai_coach_feedback?: string[];
        elegance_xp?: number;
        detection_xp?: number;
        total_xp_awarded?: number;
        redTeamEvents?: string[];
        flag_captured?: string;
        cwd?: string;
        timestamp: string;
      }>('/ai-terminal/execute', {
        method: 'POST',
        body: JSON.stringify({ command: commandText })
      });

      if (res.cwd) setCwd(res.cwd);

      // Handle sparring toggle check
      if (commandText.includes('sparring start')) setSparringActive(true);
      if (commandText.includes('sparring stop')) setSparringActive(false);

      // Award XP to HackerProfileContext
      if (res.total_xp_awarded && res.total_xp_awarded > 0) {
        addXp(res.total_xp_awarded, `Terminal Elegance / CTF Discovery`);
      }

      if (res.flag_captured) {
        recordSolvedChallenge('ctf-boss-terminal', 250, 'Terminal Master');
      }

      setEscalationStep(prev => prev + 1);

      setHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          command: commandText,
          output: res.output,
          status: res.output.includes('Error') ? 'error' : 'success',
          timestamp: res.timestamp || new Date().toLocaleTimeString(),
          aiCoachFeedback: res.ai_coach_feedback,
          eleganceXp: res.elegance_xp,
          detectionXp: res.detection_xp,
          redTeamEvents: res.redTeamEvents,
          flagCaptured: res.flag_captured,
          cwd: res.cwd || cwd
        }
      ]);
    } catch (err: any) {
      setHistory((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          command: commandText,
          output: `[-] Error: ${err.message || 'Execution error in container environment.'}`,
          status: 'error',
          timestamp: new Date().toLocaleTimeString(),
          cwd
        }
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleOpenGhostReview = async () => {
    setShowGhostModal(true);
    setGhostLoading(true);
    try {
      const data = await apiRequest<GhostReviewData>('/ai-terminal/review');
      setGhostData(data);
      if (data.optimization_xp_earned > 0) {
        addXp(data.optimization_xp_earned, `Shadow Learning Optimization (${data.efficiency_score})`);
      }
    } catch (e) {
      console.error('Failed to load ghost review data:', e);
    } finally {
      setGhostLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdIndexHistory.length > 0 && historyPointer < cmdIndexHistory.length - 1) {
        const nextPtr = historyPointer + 1;
        setHistoryPointer(nextPtr);
        setInputCmd(cmdIndexHistory[nextPtr]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyPointer > 0) {
        const nextPtr = historyPointer - 1;
        setHistoryPointer(nextPtr);
        setInputCmd(cmdIndexHistory[nextPtr]);
      } else if (historyPointer === 0) {
        setHistoryPointer(-1);
        setInputCmd('');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Mission & Live AI Coach Header */}
      <div className="bg-[#122026]/90 border border-[#6967FB]/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#C8F904]/10 border border-[#C8F904]/40 text-[#C8F904] font-bold uppercase tracking-wider">
                FEATURE: AI-DRIVEN TERMINAL CTF
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#6967FB]/20 text-[#9FB0B7]">
                LIVE COACH: ACTIVE
              </span>
              {sparringActive ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold animate-pulse flex items-center gap-1">
                  <Skull className="w-3 h-3" />
                  RED TEAM SPARRING ENGAGED
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Sparring Idle
                </span>
              )}
            </div>

            <h1 className="text-xl font-black text-white font-mono tracking-tight flex items-center gap-2">
              <TerminalIcon className="w-6 h-6 text-[#C8F904]" />
              <span>{activeScenario}</span>
            </h1>

            <p className="text-xs text-[#9FB0B7] max-w-3xl font-mono leading-relaxed">
              Real-time Senior Sysadmin feedback, performance benchmarks, procedural boss scenarios, and active Red Team adversarial disruption.
            </p>
          </div>

          {/* Quick Scenario & Review Controls */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setShowAiAssistant(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#6967FB]/30 to-[#C8F904]/20 border border-[#C8F904]/60 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(200,249,4,0.2)] hover:border-[#C8F904]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C8F904]" />
              <span>AI Mentor / Guide & Walkthrough</span>
            </button>

            <button
              onClick={() => handleExecuteCommand('ctf start boss')}
              className="px-3 py-1.5 rounded-xl bg-[#6967FB]/20 hover:bg-[#6967FB]/40 border border-[#6967FB]/40 text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#C8F904]" />
              <span>Reset Boss Scenario</span>
            </button>

            <button
              onClick={handleOpenGhostReview}
              className="px-3 py-1.5 rounded-xl bg-[#C8F904]/15 hover:bg-[#C8F904]/25 border border-[#C8F904]/50 text-[#C8F904] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(200,249,4,0.15)]"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Ghost Review (ctf review)</span>
            </button>

            <button
              onClick={() => handleExecuteCommand(sparringActive ? 'ctf sparring stop' : 'ctf sparring start')}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
                sparringActive
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 hover:bg-rose-500/30'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Skull className="w-3.5 h-3.5" />
              <span>{sparringActive ? 'Disengage Red Team' : 'Engage Red Team'}</span>
            </button>
          </div>
        </div>

        {/* Threat Escalation Meter */}
        <div className="mt-4 pt-4 border-t border-[#6967FB]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-[#9FB0B7]">Scenario Escalation Level:</span>
            <span className="text-white font-bold">Tier {Math.min(5, Math.ceil(escalationStep / 4))}</span>
            <span className="text-[11px] text-[#9FB0B7]">({escalationStep} commands executed)</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#9FB0B7]">
            <Award className="w-3.5 h-3.5 text-[#C8F904]" />
            <span>Earn Elegance XP by piping commands (`|`) and using `awk/jq/xargs`.</span>
          </div>
        </div>
      </div>

      {/* Suggested Quick Commands Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
        <span className="text-[#9FB0B7] text-[11px] uppercase tracking-wider shrink-0">Quick Triage:</span>
        {[
          'ps -ef --forest',
          'netstat -tlpn',
          'grep -E "CRITICAL|ALERT" /var/log/app.log',
          'cat /tmp/.x_miner',
          'ls -lat /tmp',
          'ctf review'
        ].map((cmd, i) => (
          <button
            key={i}
            onClick={() => handleExecuteCommand(cmd)}
            className="px-2.5 py-1 rounded-lg bg-[#122026] hover:bg-[#6967FB]/20 border border-[#6967FB]/30 text-[#C8F904] whitespace-nowrap transition-all"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Terminal Viewport Container */}
      <div className="bg-[#091015] border border-[#6967FB]/40 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden font-mono flex flex-col min-h-[550px] relative">
        
        {/* Terminal Title Bar */}
        <div className="px-4 py-3 bg-[#0E1A1F] border-b border-[#6967FB]/25 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-xs text-[#9FB0B7] ml-2">analyst@cyvantis-ctf:{cwd}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#9FB0B7]">
            <span>bash 5.2.15</span>
            <button
              onClick={() => setHistory([])}
              className="text-[#9FB0B7] hover:text-rose-400 p-1"
              title="Clear terminal window"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Output Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs leading-relaxed max-h-[620px]">
          {history.map((entry) => (
            <div key={entry.id} className="space-y-2">
              
              {/* Command Prompt Line */}
              <div className="flex items-center gap-2 text-white/90">
                <span className="text-[#C8F904] font-bold">analyst@cyvantis-ctf:{entry.cwd || cwd}$</span>
                <span className="text-white font-bold">{entry.command}</span>
                <span className="text-[10px] text-[#9FB0B7]/60 ml-auto">{entry.timestamp}</span>
              </div>

              {/* Red Team Adversarial Interference Notice */}
              {entry.redTeamEvents && entry.redTeamEvents.length > 0 && (
                <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs space-y-1 animate-fadeIn">
                  {entry.redTeamEvents.map((rt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{rt}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Standard Command Output */}
              {entry.output && (
                <pre className={`p-3 rounded-xl bg-black/40 border border-white/5 whitespace-pre-wrap ${
                  entry.status === 'error' ? 'text-rose-400' : 'text-slate-300'
                }`}>
                  {entry.output}
                </pre>
              )}

              {/* AI COACHING LIVE FEEDBACK (FEATURE 1) */}
              {entry.aiCoachFeedback && entry.aiCoachFeedback.length > 0 && (
                <div className="p-3 rounded-xl bg-[#122026]/90 border border-[#6967FB]/40 space-y-1 text-xs text-[#C8F904] animate-fadeIn">
                  {entry.aiCoachFeedback.map((fb, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#C8F904] shrink-0 mt-0.5" />
                      <span>{fb}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Elegance & Detection XP Badge */}
              {((entry.eleganceXp && entry.eleganceXp > 0) || (entry.detectionXp && entry.detectionXp > 0)) && (
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  {entry.eleganceXp ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                      ⚡ +{entry.eleganceXp} XP (Command Elegance)
                    </span>
                  ) : null}
                  {entry.detectionXp ? (
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                      🎯 +{entry.detectionXp} XP (Counter-Measure Detection)
                    </span>
                  ) : null}
                </div>
              )}

            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-[#0E1A1F] border-t border-[#6967FB]/25 flex items-center gap-2">
          <span className="text-[#C8F904] font-bold text-xs shrink-0 select-none">
            analyst@cyvantis-ctf:{cwd}$
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputCmd}
            onChange={(e) => setInputCmd(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleExecuteCommand();
              else handleKeyDown(e);
            }}
            placeholder="Type a Linux command (e.g., ps -ef --forest, cat /tmp/.x_miner, ctf review)..."
            disabled={loading}
            className="flex-1 bg-transparent text-xs font-mono text-white focus:outline-none placeholder:text-[#9FB0B7]/50"
          />
          <button
            onClick={() => handleExecuteCommand()}
            disabled={loading || !inputCmd.trim()}
            className="p-1.5 bg-[#C8F904] hover:bg-[#b0dc03] text-black rounded-lg transition-all disabled:opacity-30 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* FEATURE 3: SHADOW LEARNING GHOST REVIEW MODAL */}
      {showGhostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[#0E1A1F] border border-[#6967FB]/50 rounded-2xl shadow-[0_0_60px_rgba(105,103,251,0.3)] overflow-hidden my-8 max-h-[90vh] flex flex-col font-mono">
            
            {/* Header */}
            <div className="p-5 border-b border-[#6967FB]/25 bg-[#122026] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C8F904]/10 border border-[#C8F904]/40 flex items-center justify-center text-[#C8F904]">
                  <GitBranch className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    "GHOST" COMMAND HISTORY & SHADOW LEARNING
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6967FB]/20 border border-[#6967FB]/40 text-[#C8F904]">
                      FEATURE 3
                    </span>
                  </h2>
                  <p className="text-xs text-[#9FB0B7]">
                    Side-by-side terminal path comparison & Senior Sysadmin Decision Tree analysis.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowGhostModal(false)}
                className="p-1.5 rounded-lg text-[#9FB0B7] hover:text-white hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {ghostLoading || !ghostData ? (
                <div className="py-20 text-center text-[#C8F904] text-xs">
                  Reconstructing AI Ghost command stream and decision tree...
                </div>
              ) : (
                <>
                  {/* Efficiency Metrics Ribbon */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#122026] border border-[#6967FB]/25 text-center">
                      <div className="text-[10px] text-[#9FB0B7] uppercase">Your Commands</div>
                      <div className="text-xl font-bold text-white mt-1">{ghostData.user_steps_taken} steps</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#122026] border border-[#6967FB]/25 text-center">
                      <div className="text-[10px] text-[#9FB0B7] uppercase">AI Ghost Optimal</div>
                      <div className="text-xl font-bold text-[#C8F904] mt-1">{ghostData.optimal_ghost_steps} steps</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#122026] border border-[#6967FB]/25 text-center">
                      <div className="text-[10px] text-[#9FB0B7] uppercase">Efficiency Ratio</div>
                      <div className="text-xl font-bold text-cyan-400 mt-1">{ghostData.efficiency_score}</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#122026] border border-[#6967FB]/25 text-center">
                      <div className="text-[10px] text-[#9FB0B7] uppercase">Optimization XP</div>
                      <div className="text-xl font-bold text-emerald-400 mt-1">+{ghostData.optimization_xp_earned} XP</div>
                    </div>
                  </div>

                  {/* Side-by-Side Dual Paths */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* User Path */}
                    <div className="p-4 rounded-xl bg-[#122026]/90 border border-slate-700 space-y-3">
                      <div className="text-xs font-bold text-white uppercase flex items-center justify-between border-b border-white/10 pb-2">
                        <span>YOUR INVESTIGATIVE PATH</span>
                        <span className="text-[#9FB0B7]">{ghostData.user_steps_taken} Steps</span>
                      </div>
                      <div className="space-y-1.5 max-h-60 overflow-y-auto">
                        {ghostData.user_command_path.map((cmd, i) => (
                          <div key={i} className="p-2 rounded bg-[#091015] border border-black/40 text-xs text-slate-300 flex items-center gap-2">
                            <span className="text-[#9FB0B7] text-[10px]">{i + 1}.</span>
                            <span className="text-white font-bold truncate">{cmd}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Ghost Optimal Path */}
                    <div className="p-4 rounded-xl bg-[#122026]/90 border border-[#C8F904]/40 space-y-3 shadow-[0_0_20px_rgba(200,249,4,0.1)]">
                      <div className="text-xs font-bold text-[#C8F904] uppercase flex items-center justify-between border-b border-[#C8F904]/20 pb-2">
                        <span>AI GHOST OPTIMAL 1-LINER PATH</span>
                        <span>{ghostData.optimal_ghost_steps} Steps</span>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {ghostData.ghost_optimal_path.map((step, i) => (
                          <div key={i} className="p-2.5 rounded bg-[#091015] border border-[#C8F904]/30 space-y-1">
                            <div className="text-xs text-[#C8F904] font-bold flex items-center gap-1.5">
                              <span>{i + 1}.</span>
                              <span>{step.cmd}</span>
                            </div>
                            <div className="text-[11px] text-[#9FB0B7]">{step.reason}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Senior Sysadmin Decision Tree Breakdown */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-[#6967FB]/15 via-[#122026] to-[#C8F904]/10 border border-[#6967FB]/30 space-y-3">
                    <div className="text-xs font-bold text-white uppercase flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#C8F904]" />
                      <span>DECISION TREE RATIONALE: WHY THE AI CHOSE THIS PATH</span>
                    </div>

                    <div className="space-y-3">
                      {ghostData.decision_tree_breakdown.map((item) => (
                        <div key={item.step} className="p-3 rounded-xl bg-[#091015] border border-white/5 space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-[#C8F904]">
                            <span>Decision Point {item.step}: {item.decision}</span>
                            <code className="text-xs bg-[#122026] px-2 py-0.5 rounded text-white">{item.expertCommand}</code>
                          </div>
                          <p className="text-xs text-[#9FB0B7] leading-relaxed">
                            {item.aiRationale}
                          </p>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-white/90 pt-2 border-t border-white/10 leading-relaxed italic">
                      "{ghostData.expert_verdict}"
                    </p>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* AI CTF Mentor & Linux Coach Drawer */}
      <AiAssistantDrawer
        isOpen={showAiAssistant}
        onClose={() => setShowAiAssistant(false)}
        onExecuteCommand={(cmd) => handleExecuteCommand(cmd)}
        currentScenarioTitle={activeScenario}
      />

    </div>
  );
};
