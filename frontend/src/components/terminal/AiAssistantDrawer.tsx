import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Terminal, HelpCircle, BookOpen, Send, Play, 
  CheckCircle2, Compass, ArrowRight, Lightbulb, Shield, Code2, Flame, Copy, Check
} from 'lucide-react';
import { apiRequest } from '../../services/api';

interface CommandItem {
  category: string;
  command: string;
  name: string;
  description: string;
  whyUseInCtf: string;
  exampleOutput: string;
}

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (cmd: string) => void;
  currentScenarioTitle?: string;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
  currentScenarioTitle = 'Boss Scenario 01: The Inherited Compromised Server'
}) => {
  const [activeTab, setActiveTab] = useState<'walkthrough' | 'commands' | 'ask'>('walkthrough');
  const [commandsList, setCommandsList] = useState<CommandItem[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Q&A State
  const [userQuery, setUserQuery] = useState('');
  const [asking, setAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{
    sender: 'user' | 'ai';
    text: string;
    suggestedCommands?: Array<{ cmd: string; label: string }>;
    phase?: string;
    proTip?: string;
  }>>([
    {
      sender: 'ai',
      text: "Greetings, Analyst! I am your CYVANTIS AI CTF Mentor & Linux Coach. If you need assistance tackling this challenge, interpreting system artifacts, or mastering Linux commands, ask me anything or follow the systematic 4-phase walkthrough below!",
      suggestedCommands: [
        { cmd: "ps -ef --forest", label: "Inspect Process Tree" },
        { cmd: "netstat -tlpn", label: "Check Open Sockets" }
      ],
      proTip: "Stuck on any phase? Simply click the 'Run' button on any step to execute the forensic triage directly!"
    }
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchCheatSheet = async () => {
      try {
        const res = await apiRequest<{ commands: CommandItem[] }>('/ai-terminal/cheat-sheet');
        if (res && res.commands) {
          setCommandsList(res.commands);
        }
      } catch (e) {
        console.error('Failed to load commands cheat sheet:', e);
      }
    };
    fetchCheatSheet();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAskQuestion = async (questionText?: string) => {
    const q = (questionText !== undefined ? questionText : userQuery).trim();
    if (!q || asking) return;

    setUserQuery('');
    setChatHistory(prev => [...prev, { sender: 'user', text: q }]);
    setAsking(true);

    try {
      const res = await apiRequest<{
        answer: string;
        recommended_phase: string;
        suggested_commands: Array<{ cmd: string; label: string }>;
        pro_tip: string;
      }>('/ai-terminal/ask-assistant', {
        method: 'POST',
        body: JSON.stringify({ question: q })
      });

      setChatHistory(prev => [
        ...prev,
        {
          sender: 'ai',
          text: res.answer,
          suggestedCommands: res.suggested_commands,
          phase: res.recommended_phase,
          proTip: res.pro_tip
        }
      ]);
    } catch (err: any) {
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'ai',
          text: "Maaf kijiye, assistant se connect karne me error aayi. Aap direct 'ps -ef --forest' ya 'netstat -tlpn' run karke check kar sakte hain."
        }
      ]);
    } finally {
      setAsking(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const filteredCommands = commandsList.filter(c =>
    c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.command.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-[#0E1A1F] border-l border-[#6967FB]/30 shadow-[-15px_0_50px_rgba(0,0,0,0.85)] flex flex-col animate-slideLeft font-mono">
      
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-[#6967FB]/25 bg-[#122026] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#C8F904]/10 border border-[#C8F904]/40 flex items-center justify-center text-[#C8F904]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>AI CTF MENTOR & LINUX COACH</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#C8F904]/20 text-[#C8F904] font-bold">
                HINGLISH
              </span>
            </h3>
            <p className="text-[11px] text-[#9FB0B7] truncate max-w-[300px]">
              {currentScenarioTitle}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#9FB0B7] hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#6967FB]/20 bg-[#0E1A1F]">
        <button
          onClick={() => setActiveTab('walkthrough')}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'walkthrough'
              ? 'border-[#C8F904] text-[#C8F904] bg-[#122026]/50'
              : 'border-transparent text-[#9FB0B7] hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Walkthrough Guide</span>
        </button>

        <button
          onClick={() => setActiveTab('commands')}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'commands'
              ? 'border-[#C8F904] text-[#C8F904] bg-[#122026]/50'
              : 'border-transparent text-[#9FB0B7] hover:text-white'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Basic Commands</span>
        </button>

        <button
          onClick={() => setActiveTab('ask')}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'ask'
              ? 'border-[#C8F904] text-[#C8F904] bg-[#122026]/50'
              : 'border-transparent text-[#9FB0B7] hover:text-white'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Ask AI Mentor</span>
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        
        {/* TAB 1: WALKTHROUGH GUIDE */}
        {activeTab === 'walkthrough' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#6967FB]/20 via-[#122026] to-[#C8F904]/10 border border-[#6967FB]/30">
              <span className="text-[10px] uppercase font-bold text-[#C8F904] block mb-1">
                4-STEP INCIDENT INVESTIGATION METHODOLOGY
              </span>
              <p className="text-[#9FB0B7] leading-relaxed">
                To triage and solve any compromised Linux host, follow this systematic 4-phase incident response triage. You can execute each command directly with a single click:
              </p>
            </div>

            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-[#122026] border border-[#6967FB]/25 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#6967FB]/30 text-[#C8F904] flex items-center justify-center text-[11px] font-bold">1</span>
                  <span>Phase 1: Process Triage (Locate Rogue PID)</span>
                </span>
                <span className="text-[10px] text-amber-400 font-bold">STEP 1</span>
              </div>
              <p className="text-[#9FB0B7] leading-relaxed">
                Inspect running processes with parent-child hierarchy to find anomalous high-CPU miners or masqueraded daemons.
              </p>
              <div className="bg-[#091015] p-2.5 rounded-lg border border-black/50 text-[#C8F904] flex items-center justify-between">
                <code>ps -ef --forest</code>
                <button
                  onClick={() => onExecuteCommand('ps -ef --forest')}
                  className="px-2.5 py-1 bg-[#C8F904] hover:bg-[#b0dc03] text-black font-bold rounded flex items-center gap-1 text-[10px]"
                >
                  <Play className="w-3 h-3" /> Run
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-[#122026] border border-[#6967FB]/25 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#6967FB]/30 text-[#C8F904] flex items-center justify-center text-[11px] font-bold">2</span>
                  <span>Phase 2: Socket Analysis (C2 Beacon Check)</span>
                </span>
                <span className="text-[10px] text-amber-400 font-bold">STEP 2</span>
              </div>
              <p className="text-[#9FB0B7] leading-relaxed">
                Examine open listening ports and active sockets to detect established connections to suspicious external addresses (e.g. port 4444).
              </p>
              <div className="bg-[#091015] p-2.5 rounded-lg border border-black/50 text-[#C8F904] flex items-center justify-between">
                <code>netstat -tlpn</code>
                <button
                  onClick={() => onExecuteCommand('netstat -tlpn')}
                  className="px-2.5 py-1 bg-[#C8F904] hover:bg-[#b0dc03] text-black font-bold rounded flex items-center gap-1 text-[10px]"
                >
                  <Play className="w-3 h-3" /> Run
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-[#122026] border border-[#6967FB]/25 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#6967FB]/30 text-[#C8F904] flex items-center justify-center text-[11px] font-bold">3</span>
                  <span>Phase 3: Payload Inspection & Flag Recovery</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">FLAG RECOVERY</span>
              </div>
              <p className="text-[#9FB0B7] leading-relaxed">
                The process tree indicates the anomalous script is running from <code className="text-[#C8F904]">/tmp/.x_miner</code>. Read its contents to recover the hidden CTF flag:
              </p>
              <div className="bg-[#091015] p-2.5 rounded-lg border border-black/50 text-[#C8F904] flex items-center justify-between">
                <code>cat /tmp/.x_miner</code>
                <button
                  onClick={() => onExecuteCommand('cat /tmp/.x_miner')}
                  className="px-2.5 py-1 bg-[#C8F904] hover:bg-[#b0dc03] text-black font-bold rounded flex items-center gap-1 text-[10px]"
                >
                  <Play className="w-3 h-3" /> Run
                </button>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl bg-[#122026] border border-[#6967FB]/25 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#6967FB]/30 text-[#C8F904] flex items-center justify-center text-[11px] font-bold">4</span>
                  <span>Phase 4: Remediation & Persistence Elimination</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-bold">CLEANUP</span>
              </div>
              <p className="text-[#9FB0B7] leading-relaxed">
                Terminate the rogue process by PID and inspect recurring crontabs for persistent backdoor schedules.
              </p>
              <div className="bg-[#091015] p-2.5 rounded-lg border border-black/50 text-[#C8F904] flex items-center justify-between">
                <code>kill -9 4182</code>
                <button
                  onClick={() => onExecuteCommand('kill -9 4182')}
                  className="px-2.5 py-1 bg-[#C8F904] hover:bg-[#b0dc03] text-black font-bold rounded flex items-center gap-1 text-[10px]"
                >
                  <Play className="w-3 h-3" /> Run
                </button>
              </div>
            </div>

            {/* Ghost review tip */}
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[11px] text-cyan-300 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
              <span>
                After recovering the flag, type <strong>'ctf review'</strong> in the terminal to compare your commands against the AI Ghost trajectory and claim bonus optimization XP!
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: BASIC COMMANDS CHEAT SHEET */}
        {activeTab === 'commands' && (
          <div className="space-y-4 text-xs">
            <input
              type="text"
              placeholder="Search command (e.g. ps, grep, netstat, kill)..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-[#122026] border border-[#6967FB]/30 rounded-xl px-3.5 py-2 text-white placeholder:text-[#9FB0B7]/50 focus:outline-none focus:border-[#C8F904]"
            />

            <div className="space-y-3">
              {filteredCommands.map((cmdItem, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#122026] border border-[#6967FB]/25 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs">{cmdItem.name}</span>
                      <span className="text-[10px] text-[#C8F904] ml-2">[{cmdItem.category}]</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-[#9FB0B7]">
                      Linux Essential
                    </span>
                  </div>

                  <div className="bg-[#091015] p-2.5 rounded-lg border border-black/50 text-[#C8F904] flex items-center justify-between">
                    <code className="text-xs font-bold">{cmdItem.command}</code>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(cmdItem.command)}
                        className="p-1 rounded hover:bg-white/10 text-[#9FB0B7] hover:text-white"
                        title="Copy command"
                      >
                        {copiedCmd === cmdItem.command ? <Check className="w-3.5 h-3.5 text-[#C8F904]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => onExecuteCommand(cmdItem.command)}
                        className="px-2.5 py-1 bg-[#C8F904] hover:bg-[#b0dc03] text-black font-bold rounded flex items-center gap-1 text-[10px]"
                      >
                        <Play className="w-3 h-3" /> Run
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#9FB0B7] space-y-1 leading-relaxed">
                    <div><strong className="text-white">Function: </strong>{cmdItem.description}</div>
                    <div><strong className="text-cyan-400">Why Use in CTF: </strong>{cmdItem.whyUseInCtf}</div>
                  </div>

                  {cmdItem.exampleOutput && (
                    <div className="p-2 rounded bg-black/30 border border-white/5 text-[10px] text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap">
                      {cmdItem.exampleOutput}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ASK AI ASSISTANT */}
        {activeTab === 'ask' && (
          <div className="space-y-4 h-full flex flex-col text-xs">
            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                "What is SQL Injection and how to test for it?",
                "How does an XSS payload trigger in browsers?",
                "How to escalate privileges via Linux SUID binaries?",
                "How to execute a stealth Nmap SYN scan?",
                "How does a Buffer Overflow hijack execution flow?",
                "Explain SSRF vulnerability and cloud metadata risks",
                "What is Active Directory Kerberoasting?",
                "How to detect and terminate a rogue process?"
              ].map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleAskQuestion(chip)}
                  className="px-2.5 py-1 rounded-lg bg-[#122026] hover:bg-[#6967FB]/20 border border-[#6967FB]/30 text-[#C8F904] text-[10px] transition-all"
                >
                  💡 {chip}
                </button>
              ))}
            </div>

            {/* Chat Thread */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] p-1">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl space-y-2 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#6967FB]/25 border border-[#6967FB]/40 text-white ml-6'
                      : 'bg-[#122026] border border-[#C8F904]/30 text-slate-200 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className={msg.sender === 'user' ? 'text-[#C8F904]' : 'text-cyan-400'}>
                      {msg.sender === 'user' ? 'YOU (ANALYST)' : 'AI CTF MENTOR'}
                    </span>
                    {msg.phase && (
                      <span className="px-1.5 py-0.5 rounded bg-black/40 text-[#C8F904]">
                        {msg.phase}
                      </span>
                    )}
                  </div>

                  <p className="text-xs whitespace-pre-wrap">{msg.text}</p>

                  {/* Suggested Commands with Run Buttons */}
                  {msg.suggestedCommands && msg.suggestedCommands.length > 0 && (
                    <div className="pt-2 space-y-1.5 border-t border-white/10">
                      <span className="text-[10px] text-[#9FB0B7] uppercase block font-bold">
                        Suggested Action Commands:
                      </span>
                      {msg.suggestedCommands.map((sc, j) => (
                        <div key={j} className="flex items-center justify-between p-2 rounded bg-[#091015] border border-black/50">
                          <div>
                            <span className="text-[10px] text-[#9FB0B7] block">{sc.label}</span>
                            <code className="text-xs text-[#C8F904] font-bold">{sc.cmd}</code>
                          </div>
                          <button
                            onClick={() => onExecuteCommand(sc.cmd)}
                            className="px-2 py-1 bg-[#C8F904] hover:bg-[#b0dc03] text-black font-bold rounded flex items-center gap-1 text-[10px]"
                          >
                            <Play className="w-3 h-3" /> Run
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.proTip && (
                    <div className="pt-1.5 text-[11px] text-amber-300 flex items-start gap-1.5 border-t border-white/5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{msg.proTip}</span>
                    </div>
                  )}
                </div>
              ))}
              {asking && (
                <div className="p-3 rounded-xl bg-[#122026] text-xs text-[#C8F904] animate-pulse">
                  AI Mentor is analyzing query and crafting defense strategy...
                </div>
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskQuestion();
              }}
              className="flex gap-2 pt-2"
            >
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Ask anything: how to solve, which command to run, exploit mechanics..."
                className="flex-1 bg-[#122026] border border-[#6967FB]/30 rounded-xl px-3 py-2 text-xs text-white placeholder:text-[#9FB0B7]/50 focus:outline-none focus:border-[#C8F904]"
              />
              <button
                type="submit"
                disabled={asking || !userQuery.trim()}
                className="px-4 py-2 bg-[#C8F904] hover:bg-[#b0dc03] text-black font-bold rounded-xl text-xs disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

      </div>

    </div>
  );
};
