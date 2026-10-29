import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, KeyRound, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes of inactivity

export const IdleSessionLockModal: React.FC = () => {
  const { user, logout } = useAuth();
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      if (isLocked) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsLocked(true);
      }, IDLE_TIMEOUT_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [isLocked]);

  if (!isLocked) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Verify password by calling login endpoint or credentials check
      const formData = new FormData();
      formData.append('username', user?.username || '');
      formData.append('password', password);

      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Incorrect password.');
      }

      setIsLocked(false);
      setPassword('');
    } catch (err: any) {
      setError(err?.message || 'Incorrect password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-[#0A1128] border border-cyan-500/40 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-[0_0_50px_rgba(6,182,212,0.2)] text-center relative">
        <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-cyan-400">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-slate-100">Session Locked due to Inactivity</h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          Logged in as <span className="text-cyan-400 font-mono font-semibold">{user?.username}</span> ({user?.role?.toUpperCase()}). Re-enter your password to resume your SOC session.
        </p>

        {error && (
          <div className="mb-4 p-2.5 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
              Account Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full bg-[#040817] border border-slate-700 focus:border-cyan-400 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={logout}
              className="w-1/3 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-2/3 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Unlock Session'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
