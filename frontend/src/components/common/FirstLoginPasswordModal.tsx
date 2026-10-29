import React, { useState } from 'react';
import { ShieldAlert, Lock, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';

export const FirstLoginPasswordModal: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Security password rules verification
  const isMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  
  const isPasswordValid = isMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
  const isMatching = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('New password does not meet all enterprise security requirements.');
      return;
    }

    if (!isMatching) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);

    try {
      const updatedUser = await apiRequest<User>('/auth/change-password-first-login', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      setSuccess(true);
      setTimeout(() => {
        updateUser({ ...updatedUser, must_change_password: false });
      }, 1200);
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Failed to update password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#0A1128] border border-cyan-500/40 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden">
        {/* Glow Header Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center">
          <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-cyan-400 shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-slate-100 font-sans tracking-wide">
            First-Login Security Enforcement
          </h2>
          <p className="text-xs text-slate-400 mt-1 mb-6 leading-relaxed">
            Welcome to <span className="text-cyan-400 font-mono font-semibold">CYVANTIS SOC Gateway</span>. As a mandatory security rule, you must change your default password before accessing the enterprise dashboard.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-lg flex items-start gap-2.5 text-left text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="py-8 text-center animate-fade-in">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-3 animate-bounce" />
              <h3 className="text-lg font-bold text-slate-100">Password Updated Successfully!</h3>
              <p className="text-xs text-slate-400 mt-1">Unlocking CYVANTIS SOC Gateway...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
                  Current / Default Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="w-full bg-[#040817] border border-slate-700 focus:border-cyan-400 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
                  />
                  <KeyRound className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
                  New Secure Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Min 8 chars with A-Z, a-z, 0-9, symbol"
                    className="w-full bg-[#040817] border border-slate-700 focus:border-cyan-400 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                </div>
              </div>

              {/* Real-time Password Strength Criteria Checklist */}
              {newPassword.length > 0 && (
                <div className="p-3 bg-[#040817] border border-slate-800 rounded-lg grid grid-cols-2 gap-1.5 text-[11px]">
                  <span className={`flex items-center gap-1.5 ${isMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isMinLength ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    8+ Characters
                  </span>
                  <span className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasUpper ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    Uppercase (A-Z)
                  </span>
                  <span className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasLower ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    Lowercase (a-z)
                  </span>
                  <span className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    Number (0-9)
                  </span>
                  <span className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-400' : 'text-slate-500'} col-span-2`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasSpecial ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    Special Character (!@#$%^&*)
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                    className={`w-full bg-[#040817] border rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition ${
                      confirmPassword.length > 0
                        ? isMatching
                          ? 'border-emerald-500 focus:ring-emerald-500'
                          : 'border-red-500 focus:ring-red-500'
                        : 'border-slate-700 focus:border-cyan-400'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={logout}
                  className="w-1/3 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition text-center"
                >
                  Sign Out
                </button>
                <button
                  type="submit"
                  disabled={loading || !isPasswordValid || !isMatching}
                  className="w-2/3 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Update & Unlock Platform'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
