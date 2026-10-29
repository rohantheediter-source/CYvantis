import React, { useState, useEffect } from 'react';
import { ShieldCheck, QrCode, CheckCircle2, AlertTriangle, X, Lock } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';

interface TwoFactorSetupModalProps {
  onClose: () => void;
}

export const TwoFactorSetupModal: React.FC<TwoFactorSetupModalProps> = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [totpCode, setTotpCode] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    const fetchSetupData = async () => {
      try {
        const res = await apiRequest<{ secret: string; qr_code_url: string }>('/auth/2fa/setup', {
          method: 'POST',
        });
        setSecret(res.secret);
        setQrCodeUrl(res.qr_code_url);
      } catch (err: any) {
        setError('Failed to generate 2FA setup QR Code.');
      } finally {
        setLoading(false);
      }
    };

    fetchSetupData();
  }, []);

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerifying(true);

    try {
      const updatedUser = await apiRequest<User>('/auth/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ totp_code: totpCode }),
      });

      updateUser(updatedUser);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Invalid 6-digit TOTP code.');
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    setVerifying(true);
    try {
      const updatedUser = await apiRequest<User>('/auth/2fa/disable', {
        method: 'POST',
      });
      updateUser(updatedUser);
      onClose();
    } catch (err: any) {
      setError('Failed to disable 2FA.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[#0A1128] border border-cyan-500/40 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(6,182,212,0.2)] text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-cyan-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold">Two-Factor Authentication (2FA)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enhance account security using Google Authenticator, Authy, or 1Password.
          </p>
        </div>

        {user?.is_totp_enabled ? (
          <div className="text-center space-y-4 py-4">
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl flex items-center gap-3 text-emerald-400 text-sm">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <span className="text-left font-semibold">2FA Protection is Active on your account.</span>
            </div>
            <button
              onClick={handleDisable2FA}
              disabled={verifying}
              className="w-full py-2.5 bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-200 text-xs font-bold rounded-lg transition"
            >
              {verifying ? 'Disabling 2FA...' : 'Disable Two-Factor Authentication'}
            </button>
          </div>
        ) : success ? (
          <div className="py-8 text-center text-emerald-400">
            <CheckCircle2 className="w-14 h-14 mx-auto mb-2 animate-bounce" />
            <h3 className="text-lg font-bold text-white">2FA Enabled Successfully!</h3>
            <p className="text-xs text-slate-400 mt-1">Your account is now protected with TOTP 2FA.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-[#040817] p-4 rounded-xl border border-slate-800 text-center">
              <p className="text-xs font-mono text-slate-300 mb-3">1. Scan QR Code in Google Authenticator</p>
              
              {loading ? (
                <div className="h-44 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="inline-block p-3 bg-white rounded-lg shadow-inner">
                  <img src={qrCodeUrl} alt="2FA QR Code" className="w-40 h-40 object-contain" />
                </div>
              )}

              <p className="text-[11px] text-slate-500 mt-3 font-mono">
                Manual Key: <span className="text-cyan-400 select-all font-bold">{secret}</span>
              </p>
            </div>

            <form onSubmit={handleEnable2FA} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
                  2. Enter 6-Digit Code from App
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="e.g. 123456"
                    className="w-full bg-[#040817] border border-slate-700 focus:border-cyan-400 text-center text-lg font-mono tracking-widest px-3.5 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded-lg transition"
                  />
                  <QrCode className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifying || totpCode.length !== 6}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Verify & Enable 2FA'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
