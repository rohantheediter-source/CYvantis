import React, { useState, useEffect } from 'react';
import { 
  X, Terminal, Shield, Award, CheckCircle2, AlertCircle, 
  HelpCircle, Copy, Check, Sparkles, Send, Flame, Lock, Unlock
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useHackerProfile } from '../../context/HackerProfileContext';
import { CtfChallenge } from '../../types/hacker';

interface CtfChallengesHubProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDecoder?: () => void;
}

export const CtfChallengesHub: React.FC<CtfChallengesHubProps> = ({
  isOpen,
  onClose,
  onOpenDecoder
}) => {
  const { profile, recordSolvedChallenge } = useHackerProfile();
  const [challenges, setChallenges] = useState<CtfChallenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('ctf-xor-beacon');
  const [flagInput, setFlagInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchChallenges = async () => {
      try {
        const res = await apiRequest<{ challenges: CtfChallenge[] }>('/tools/challenges');
        if (res && res.challenges) {
          setChallenges(res.challenges);
          if (res.challenges.length > 0) {
            setSelectedChallengeId(res.challenges[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to load CTF challenges:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchChallenges();
  }, [isOpen]);

  if (!isOpen) return null;

  const currentChallenge = challenges.find(c => c.id === selectedChallengeId) || challenges[0];
  const isAlreadySolved = currentChallenge && profile.solvedChallenges.includes(currentChallenge.id);

  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagInput || !currentChallenge || submitting) return;
    setSubmitting(true);
    setResultMessage(null);

    try {
      const res = await apiRequest<{
        success: boolean;
        message: string;
        xp_awarded: number;
        badge_unlocked?: string;
      }>('/tools/verify-challenge', {
        method: 'POST',
        body: JSON.stringify({
          challenge_id: currentChallenge.id,
          flag: flagInput
        })
      });

      if (res && res.success) {
        setResultMessage({ success: true, text: res.message });
        recordSolvedChallenge(currentChallenge.id, res.xp_awarded, res.badge_unlocked);
        setFlagInput('');
      } else {
        setResultMessage({ success: false, text: res?.message || 'Incorrect flag. Try again!' });
      }
    } catch (err: any) {
      setResultMessage({ success: false, text: err.message || 'Submission verification failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#0E1A1F] border border-[#6967FB]/40 rounded-2xl shadow-[0_0_60px_rgba(105,103,251,0.3)] overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-[#6967FB]/25 bg-[#122026] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C8F904]/10 border border-[#C8F904]/40 flex items-center justify-center text-[#C8F904]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                CTF & QUICK-FIRE CHALLENGE ARENA
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6967FB]/20 border border-[#6967FB]/40 text-[#C8F904]">
                  GAMIFICATION
                </span>
              </h2>
              <p className="text-xs text-[#9FB0B7]">
                Micro-puzzles per tool: decode ciphers, hunt honeypot intrusion artifacts, earn XP & badges.
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

        {/* Challenge Selection Strip */}
        <div className="flex border-b border-[#6967FB]/20 bg-[#0E1A1F] overflow-x-auto p-2 gap-2">
          {challenges.map((c) => {
            const solved = profile.solvedChallenges.includes(c.id);
            const isSelected = selectedChallengeId === c.id;

            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedChallengeId(c.id);
                  setResultMessage(null);
                  setShowHint(false);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#6967FB]/30 text-white border-[#C8F904] shadow-[0_0_12px_rgba(200,249,4,0.2)]'
                    : 'bg-[#122026] text-[#9FB0B7] border-transparent hover:text-white'
                }`}
              >
                {solved ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C8F904]" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-[#6967FB]" />
                )}
                <span>{c.title.split(':')[0]}</span>
                <span className="text-[9px] px-1 rounded bg-black/40 text-[#C8F904]">+{c.xpReward} XP</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading || !currentChallenge ? (
            <div className="py-20 text-center font-mono text-xs text-[#C8F904]">
              Loading battle puzzles...
            </div>
          ) : (
            <>
              {/* Challenge Header & Metadata */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#6967FB]/25 text-[#9FB0B7] uppercase">
                      {currentChallenge.category}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      currentChallenge.difficulty === 'BEGINNER' ? 'bg-emerald-500/20 text-emerald-400' :
                      currentChallenge.difficulty === 'INTERMEDIATE' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-rose-500/20 text-rose-400'
                    }`}>
                      {currentChallenge.difficulty}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white font-mono">
                    {currentChallenge.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-[#C8F904]">+{currentChallenge.xpReward} XP</div>
                    <div className="text-[10px] text-[#9FB0B7] font-mono">Badge: {currentChallenge.badgeReward}</div>
                  </div>
                  {isAlreadySolved && (
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>SOLVED</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="text-sm font-mono text-[#9FB0B7] leading-relaxed">
                {currentChallenge.description}
              </div>

              {/* Encoded / Challenge Snippet */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-[#9FB0B7]">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#C8F904]" />
                    Challenge Vector / Honeypot Capture:
                  </span>
                  <button
                    onClick={() => handleCopySnippet(currentChallenge.encodedSnippet)}
                    className="text-[#C8F904] hover:underline flex items-center gap-1 text-[11px]"
                  >
                    {copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippet ? 'Copied' : 'Copy Payload'}</span>
                  </button>
                </div>

                <pre className="p-4 rounded-xl bg-[#0E1A1F] border border-[#6967FB]/30 text-xs font-mono text-[#C8F904] overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                  {currentChallenge.encodedSnippet}
                </pre>
              </div>

              {/* Hint Toggle */}
              <div>
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-1.5 text-xs font-mono text-[#9FB0B7] hover:text-[#C8F904] transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showHint ? 'Hide Hint' : 'Need a hint?'}</span>
                </button>
                {showHint && (
                  <div className="mt-2 p-3 rounded-lg bg-[#122026] border border-[#6967FB]/25 text-xs font-mono text-[#9FB0B7] animate-fadeIn">
                    <span className="text-[#C8F904] font-bold">Hint: </span>
                    {currentChallenge.hint}
                  </div>
                )}
              </div>

              {/* Flag Submission Form */}
              <form onSubmit={handleSubmitFlag} className="p-4 rounded-xl bg-[#122026] border border-[#6967FB]/30 space-y-3">
                <label className="block text-xs font-mono font-bold text-white">
                  SUBMIT VERIFIED FLAG PAYLOAD:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={flagInput}
                    onChange={(e) => setFlagInput(e.target.value)}
                    placeholder="flag{...} or recovered string"
                    className="flex-1 bg-[#0E1A1F] border border-[#6967FB]/30 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-[#9FB0B7]/50 focus:outline-none focus:border-[#C8F904]"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-[#C8F904] hover:bg-[#b0dc03] text-black font-mono font-bold text-xs rounded-lg transition-all shadow cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Verifying...' : 'Submit Flag'}</span>
                  </button>
                </div>

                {/* Submission Feedback */}
                {resultMessage && (
                  <div className={`p-3 rounded-lg text-xs font-mono flex items-center gap-2 animate-fadeIn ${
                    resultMessage.success
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                  }`}>
                    {resultMessage.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{resultMessage.text}</span>
                  </div>
                )}
              </form>

            </>
          )}
        </div>

      </div>
    </div>
  );
};
