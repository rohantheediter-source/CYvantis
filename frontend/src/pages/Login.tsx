import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, Lock, User as UserIcon, AlertCircle, ArrowRight,
  Sparkles, Cpu, Radio, KeyRound, ArrowLeft, Mail, CheckCircle2,
  HelpCircle, ShieldAlert, Eye, EyeOff
} from 'lucide-react';
import { PERMISSION_MATRIX } from '../components/common/LockedAccessView';

interface LoginProps {
  onBackToLanding?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onBackToLanding }) => {
  const { login } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@Cyvantis2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // 2FA state
  const [requires2FA, setRequires2FA] = useState<boolean>(false);
  const [tempToken, setTempToken] = useState<string>('');
  const [totpCode, setTotpCode] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [totpSecret, setTotpSecret] = useState<string>('');

  // Permissions Modal state
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  // Card Perspective
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // Submit Login
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      // Using /api/v1/auth/login directly via Vite proxy or relative path
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      const data = await res.json().catch(() => ({ detail: 'Authentication failed' }));

      if (!res.ok) {
        throw new Error(data.detail || 'Invalid username or password');
      }

      if (data.requires_2fa) {
        setRequires2FA(true);
        setTempToken(data.temp_token);
        if (data.qr_code_url) setQrCodeUrl(data.qr_code_url);
        if (data.totp_secret) setTotpSecret(data.totp_secret);
        return;
      }

      login(data.access_token, data.user);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Register
  const handleSubmitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword,
          full_name: regFullName.trim() || undefined,
          role: 'analyst'
        })
      });

      const data = await res.json().catch(() => ({ detail: 'Registration failed' }));

      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed. Check inputs.');
      }

      setSuccessMsg('Account registered successfully! Entering SOC Console...');
      // Auto login with generated token and user
      setTimeout(() => {
        login(data.access_token, data.user);
        window.location.href = '/';
      }, 900);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Verify 2FA
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/2fa/verify-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          temp_token: tempToken,
          totp_code: totpCode,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid 2FA verification code');
      }

      login(data.access_token, data.user);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Invalid 6-digit TOTP code');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (user: string, pass: string) => {
    setAuthMode('login');
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div
      className="min-h-screen bg-[#080E1E] bg-grid-obsidian flex items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Subtle telemetry accents */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#38BDF8]/30 to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#818CF8]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#38BDF8]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Login/Register Card */}
      <div
        className="w-full max-w-lg bg-[#0D1528]/95 backdrop-blur-xl border border-[#243149] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-6 sm:p-8 md:p-9 z-10 relative transition-transform duration-200 ease-out"
        style={{
          transform: `rotateY(${mousePos.x * 4}deg) rotateX(${-mousePos.y * 4}deg)`,
        }}
      >
        {/* Fine top precision border */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#38BDF8]/60 to-transparent" />

        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="mb-4 text-xs font-mono text-[#94A3B8] hover:text-[#38BDF8] flex items-center gap-2 transition group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Return to Public View</span>
          </button>
        )}

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6 relative">
          <div className="w-14 h-14 mx-auto rounded-xl overflow-hidden bg-[#111C32] p-1 border border-[#38BDF8]/40 shadow-[0_0_20px_rgba(56,189,248,0.2)] flex items-center justify-center">
            <img src="/cyvantis-logo.jpg" alt="CYVANTIS Logo" className="w-full h-full object-cover rounded-lg" />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-widest text-[#E8EEF8] font-mono">
              CYVANTIS
            </h1>
            <p className="text-[10px] text-[#94A3B8] font-mono uppercase tracking-wider mt-0.5">
              Enterprise Gateway Intelligence & Security Nexus
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#111C32] border border-[#243149] text-[10px] font-mono text-[#38BDF8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse shrink-0" />
            <span className="font-semibold uppercase tracking-wider">DEFENSE CLEARANCE PORTAL</span>
          </div>
        </div>

        {/* Login vs Register Mode Tab Switcher */}
        {!requires2FA && (
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#080E1E] rounded-xl border border-[#243149] mb-6 font-mono text-xs">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setError(null); }}
              className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-[#111C32] text-[#38BDF8] border border-[#38BDF8]/40 shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#E8EEF8]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setError(null); }}
              className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-[#111C32] text-[#38BDF8] border border-[#38BDF8]/40 shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#E8EEF8]'
              }`}
            >
              Register Account
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-[#FB7185]/10 border border-[#FB7185]/30 text-[#FB7185] text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMsg && (
          <div className="mb-5 p-3 rounded-lg bg-[#34D399]/10 border border-[#34D399]/30 text-[#34D399] text-xs flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 2FA Form */}
        {requires2FA ? (
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div className="p-3 bg-[#818CF8]/10 border border-[#818CF8]/30 rounded-lg text-center text-xs text-[#E8EEF8]">
              <ShieldCheck className="w-5 h-5 mx-auto mb-1 text-[#38BDF8]" />
              Two-Factor Authentication Required
            </div>

            {qrCodeUrl && (
              <div className="bg-[#111C32] p-4 rounded-xl border border-[#243149] text-center">
                <p className="text-[11px] font-mono text-[#E8EEF8] mb-2">Scan with Authenticator App</p>
                <div className="inline-block p-2 bg-white rounded-lg shadow-inner">
                  <img src={qrCodeUrl} alt="2FA QR Code" className="w-32 h-32 object-contain mx-auto" />
                </div>
                {totpSecret && (
                  <p className="text-[10px] text-[#94A3B8] mt-2 font-mono">
                    Secret: <span className="text-[#38BDF8] font-bold select-all">{totpSecret}</span>
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2 font-mono">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                placeholder="123456"
                className="w-full bg-[#080E1E] border border-[#243149] rounded-lg px-4 py-2.5 text-center text-xl font-mono tracking-widest text-[#38BDF8] focus:outline-none focus:border-[#38BDF8] transition"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRequires2FA(false)}
                className="w-1/3 py-2.5 rounded-lg border border-[#243149] text-xs font-mono text-[#94A3B8] hover:text-[#E8EEF8] hover:bg-[#111C32] transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || totpCode.length !== 6}
                className="w-2/3 py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#080E1E] text-xs font-mono font-bold transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Verifying...' : 'Verify & Enter'}
              </button>
            </div>
          </form>
        ) : authMode === 'login' ? (
          /* Sign In Form */
          <form onSubmit={handleSubmitLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5 font-mono flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-[#38BDF8]" />
                Username ID
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#080E1E] border border-[#243149] rounded-lg px-3.5 py-2.5 text-sm text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8] transition font-mono placeholder-[#94A3B8]/40"
                placeholder="Enter username (e.g. admin or analyst)"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5 font-mono flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#38BDF8]" />
                  Access Password
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-[#94A3B8] hover:text-[#38BDF8] flex items-center gap-1 normal-case font-normal cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#080E1E] border border-[#243149] rounded-lg px-3.5 py-2.5 text-sm text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8] transition font-mono placeholder-[#94A3B8]/40"
                placeholder="Enter access password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#080E1E] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.25)] mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <>
                  <span>Authenticate & Enter Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Registration Form */
          <form onSubmit={handleSubmitRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1 font-mono flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#38BDF8]" />
                Official Email Address
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full bg-[#080E1E] border border-[#243149] rounded-lg px-3 py-2 text-sm text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8] transition font-mono"
                placeholder="name@organization.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1 font-mono flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-[#38BDF8]" />
                Desired Username ID
              </label>
              <input
                type="text"
                required
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                className="w-full bg-[#080E1E] border border-[#243149] rounded-lg px-3 py-2 text-sm text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8] transition font-mono"
                placeholder="e.g. analyst_john"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1 font-mono">
                Full Name (Optional)
              </label>
              <input
                type="text"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                className="w-full bg-[#080E1E] border border-[#243149] rounded-lg px-3 py-2 text-sm text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8] transition font-mono"
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1 font-mono flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-[#38BDF8]" />
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-[#080E1E] border border-[#243149] rounded-lg px-3 py-2 text-sm text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8] transition font-mono"
                  placeholder="Min 6 chars"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1 font-mono flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-[#38BDF8]" />
                  Confirm
                </label>
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full bg-[#080E1E] border border-[#243149] rounded-lg px-3 py-2 text-sm text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8] transition font-mono"
                  placeholder="Repeat password"
                />
              </div>
            </div>

            {/* Clearance Notice Note */}
            <div className="p-3 rounded-lg bg-[#111C32] border border-[#243149] text-[11px] font-mono text-[#94A3B8] space-y-1">
              <div className="flex items-center gap-1.5 text-[#E8EEF8] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Analyst Clearance Level Granted</span>
              </div>
              <p className="text-[10px] leading-relaxed">
                Self-registered accounts receive immediate access to Live Monitoring, Threat Maps & Investigations. User Management & System Settings are locked to Administrators.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#080E1E] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.25)] mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Registering Account...
                </span>
              ) : (
                <>
                  <span>Register Analyst Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Role Permissions Information Trigger */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setShowPermissionsModal(true)}
            className="text-[11px] font-mono text-[#94A3B8] hover:text-[#38BDF8] inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#818CF8]" />
            <span>View Clearance Matrix (What's Locked vs Accessible)</span>
          </button>
        </div>

        {/* Demo Preset Quick-Fill Buttons */}
        <div className="mt-5 pt-4 border-t border-[#243149] text-center">
          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-2 font-mono flex items-center justify-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-[#38BDF8]" />
            Quick Demo Presets
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDemoUser('admin', 'Admin@Cyvantis2026!')}
              className="px-3 py-2 rounded-lg bg-[#111C32] hover:bg-[#243149] text-xs font-mono text-[#E8EEF8] border border-[#243149] hover:border-[#38BDF8]/50 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Admin (Full Access)</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('analyst', 'Analyst@Cyvantis2026!')}
              className="px-3 py-2 rounded-lg bg-[#111C32] hover:bg-[#243149] text-xs font-mono text-[#E8EEF8] border border-[#243149] hover:border-[#818CF8]/50 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-[#818CF8]" />
              <span>Analyst (Locked Settings)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Permissions Matrix Modal */}
      {showPermissionsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowPermissionsModal(false)}
        >
          <div
            className="relative max-w-2xl w-full bg-[#0D1528] border border-[#243149] rounded-xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#243149] mb-4 font-mono">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#38BDF8]" />
                <h3 className="text-sm font-bold text-[#E8EEF8]">Platform Clearance & Permissions Matrix</h3>
              </div>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="p-1 rounded bg-[#111C32] hover:bg-[#243149] text-[#94A3B8] hover:text-[#E8EEF8] text-xs font-mono cursor-pointer transition"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-[#94A3B8] mb-4 leading-relaxed">
              When you register a new account, you receive standard <strong className="text-[#38BDF8]">Analyst</strong> clearance. You can freely explore live telemetry, event logs, threat graphs, and conduct investigations. Administrative configurations and user management are strictly restricted to Level-1 SOC Administrators.
            </p>

            <div className="overflow-x-auto rounded-lg border border-[#243149]">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="bg-[#080E1E] text-[#94A3B8] uppercase tracking-wider text-[10px] border-b border-[#243149]">
                    <th className="py-2.5 px-3">Module / Feature</th>
                    <th className="py-2.5 px-3 text-[#38BDF8]">Analyst Role</th>
                    <th className="py-2.5 px-3 text-[#818CF8]">Administrator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#243149]">
                  {PERMISSION_MATRIX.map((row, idx) => (
                    <tr key={idx} className={row.isLocked ? 'bg-[#FB7185]/5' : 'hover:bg-[#111C32]/40'}>
                      <td className="py-2 px-3 text-[#E8EEF8] font-medium flex items-center gap-1.5">
                        {row.isLocked && <Lock className="w-3 h-3 text-[#FB7185]" />}
                        <span>{row.feature}</span>
                      </td>
                      <td className="py-2 px-3">
                        {row.isLocked ? (
                          <span className="text-[#FB7185] font-bold flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            Locked
                          </span>
                        ) : (
                          <span className="text-[#38BDF8]">{row.analyst}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[#94A3B8]">
                        <span className="text-[#E8EEF8]">{row.admin}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => setShowPermissionsModal(false)}
                className="py-1.5 px-4 rounded-lg bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#080E1E] text-xs font-mono font-bold cursor-pointer transition"
              >
                Return to Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
