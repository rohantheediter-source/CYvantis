import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { PlatformSetting } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Settings as SettingsIcon, Save, Check, Bell, HardDrive,
  Shield, ShieldCheck, Lock, RefreshCw, Key
} from 'lucide-react';
import { TwoFactorSetupModal } from '../components/common/TwoFactorSetupModal';

export const Settings: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);

  // Form states
  const [platformName, setPlatformName] = useState('CYVANTIS');
  const [cowriePath, setCowriePath] = useState('./data/cowrie.json');
  const [retentionDays, setRetentionDays] = useState('90');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<PlatformSetting[]>('/settings');
      setSettings(data || []);

      data.forEach((s) => {
        if (s.key === 'PLATFORM_NAME') setPlatformName(s.value);
        if (s.key === 'DATA_RETENTION_DAYS') setRetentionDays(s.value);
        if (s.key === 'COWRIE_LOG_PATH') setCowriePath(s.value);
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSetting = async (key: string, value: string) => {
    try {
      await apiRequest(`/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value })
      });
    } catch (err) {
      console.error(`Failed to update ${key}:`, err);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);

    try {
      await handleSaveSetting('PLATFORM_NAME', platformName);
      await handleSaveSetting('DATA_RETENTION_DAYS', retentionDays);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
      fetchSettings();
    } catch (err: any) {
      alert('Failed to save settings: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans">
      {/* 1. Header */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
          <h2 className="text-lg font-bold text-[#E8EEF8] font-mono tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#38BDF8]" />
            Platform Configuration & System Settings
          </h2>
        </div>
        <p className="text-xs text-[#94A3B8]">
          Configure platform branding, Cowrie honeypot log directory paths, retention policies, and account credentials
        </p>
      </div>

      {show2FAModal && <TwoFactorSetupModal onClose={() => setShow2FAModal(false)} />}

      {/* Success Notification Banner */}
      {savedMsg && (
        <div className="p-3.5 bg-[#34D399]/15 border border-[#34D399]/40 rounded-xl text-[#34D399] font-mono text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Platform settings successfully saved and applied to database.</span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-5">
        {/* User Account Security & 2FA */}
        <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#243149] pb-3">
            <h3 className="text-xs font-bold text-[#E8EEF8] uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
              Account Security & Two-Factor Authentication (2FA)
            </h3>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                user?.is_totp_enabled
                  ? 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/40'
                  : 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/40'
              }`}
            >
              {user?.is_totp_enabled ? '2FA ACTIVE' : '2FA DISABLED'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#E8EEF8]">Google Authenticator / TOTP 2FA</p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                Protect your analyst identity with dynamic 6-digit TOTP verification codes required on authentication.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShow2FAModal(true)}
              className="px-3.5 py-2 rounded-lg bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#38BDF8] text-xs font-mono font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{user?.is_totp_enabled ? 'Manage 2FA Configuration' : 'Enable 2FA (QR Code)'}</span>
            </button>
          </div>
        </div>

        {/* Platform Branding & Title */}
        <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-[#E8EEF8] uppercase tracking-wider font-mono flex items-center gap-2 border-b border-[#243149] pb-3">
            <Shield className="w-4 h-4 text-[#818CF8]" />
            Platform Branding & Interface Title
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-[#94A3B8] mb-1.5 text-[11px]">PLATFORM TITLE</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                disabled={!isAdmin}
                className="w-full bg-[#111C32] border border-[#243149] rounded-lg p-2.5 text-xs text-[#E8EEF8] focus:border-[#38BDF8]/60 focus:outline-none disabled:opacity-50"
              />
              <p className="text-[10px] text-[#94A3B8] mt-1">Branding title displayed across the navigation header and executive briefings.</p>
            </div>
          </div>
        </div>

        {/* Honeypot & Integration Paths */}
        <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-[#E8EEF8] uppercase tracking-wider font-mono flex items-center gap-2 border-b border-[#243149] pb-3">
            <HardDrive className="w-4 h-4 text-[#38BDF8]" />
            Cowrie Honeypot Log File Integration
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-[#94A3B8] mb-1.5 text-[11px]">COWRIE JSON LOG PATH</label>
              <input
                type="text"
                value={cowriePath}
                onChange={(e) => setCowriePath(e.target.value)}
                disabled={!isAdmin}
                className="w-full bg-[#111C32] border border-[#243149] rounded-lg p-2.5 text-xs text-[#E8EEF8] focus:border-[#38BDF8]/60 focus:outline-none disabled:opacity-50"
              />
              <p className="text-[10px] text-[#94A3B8] mt-1">Filesystem directory where honeypot containers append raw event telemetry.</p>
            </div>
          </div>
        </div>

        {/* Data Retention Rules */}
        <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-[#E8EEF8] uppercase tracking-wider font-mono flex items-center gap-2 border-b border-[#243149] pb-3">
            <RefreshCw className="w-4 h-4 text-[#34D399]" />
            Telemetry Data Retention & Prune Rules
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-[#94A3B8] mb-1.5 text-[11px]">EVENT RETENTION WINDOW (DAYS)</label>
              <input
                type="number"
                min="7"
                max="365"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                disabled={!isAdmin}
                className="w-full bg-[#111C32] border border-[#243149] rounded-lg p-2.5 text-xs text-[#E8EEF8] focus:border-[#38BDF8]/60 focus:outline-none disabled:opacity-50"
              />
              <p className="text-[10px] text-[#94A3B8] mt-1">Snapshot archives and raw event records older than this threshold will be pruned.</p>
            </div>
          </div>
        </div>

        {/* Save Button for Admins */}
        {isAdmin && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#38BDF8] font-bold text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Configuration'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
