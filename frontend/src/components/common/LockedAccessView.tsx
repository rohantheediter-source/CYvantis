import React from 'react';
import { Lock, ShieldAlert, CheckCircle2, XCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

interface LockedAccessViewProps {
  featureName: string;
  onNavigateHome: () => void;
  userRole?: string;
}

export const PERMISSION_MATRIX = [
  { feature: 'Live monitoring', analyst: 'View', admin: 'Full access' },
  { feature: 'Event explorer', analyst: 'View and investigate', admin: 'Full access' },
  { feature: 'Attack analysis', analyst: 'Analyze alerts', admin: 'Full access' },
  { feature: 'Source intelligence', analyst: 'View', admin: 'Manage' },
  { feature: 'Geographic threat map', analyst: 'View', admin: 'Full access' },
  { feature: 'Investigations', analyst: 'Create and update assigned cases', admin: 'Manage all cases' },
  { feature: 'Detection rules', analyst: 'View rules', admin: 'Create, edit, delete' },
  { feature: 'Threat intelligence', analyst: 'View', admin: 'Manage sources' },
  { feature: 'Reports', analyst: 'Generate and view', admin: 'Manage and export' },
  { feature: 'Cybersecurity tools hub', analyst: 'Approved tools only', admin: 'Manage tools' },
  { feature: 'Threat advisory & CVE radar', analyst: 'View', admin: 'Manage integrations' },
  { feature: 'ML threat intelligence', analyst: 'View results', admin: 'Configure models' },
  { feature: 'User management', analyst: 'Locked', admin: 'Full access', isLocked: true },
  { feature: 'System settings and API keys', analyst: 'Locked', admin: 'Full access', isLocked: true },
];

export const LockedAccessView: React.FC<LockedAccessViewProps> = ({
  featureName,
  onNavigateHome,
  userRole = 'analyst'
}) => {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6 font-sans">
      {/* High-Alert Security Chamber */}
      <div className="relative rounded-2xl bg-[#0D1528] border border-[#FB7185]/40 p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Specular Red Alert Glow */}
        <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-[#FB7185] to-transparent" />

        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-16 h-16 rounded-xl bg-[#FB7185]/10 border border-[#FB7185]/40 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(251,113,133,0.2)]">
            <Lock className="w-8 h-8 text-[#FB7185]" />
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#FB7185]/15 border border-[#FB7185]/30 text-[#FB7185] text-xs font-mono font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>403 CLEARANCE RESTRICTED // TIER-1 ADMIN ONLY</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#E8EEF8] font-mono">
              Access Restricted: {featureName} is Locked
            </h2>
            <p className="text-[#94A3B8] text-xs sm:text-sm leading-relaxed max-w-3xl">
              Your registered account possesses <strong className="text-[#38BDF8] font-mono">Analyst Clearance</strong>. Administrative operations (such as User Management, System Configuration, and API Key administration) are strictly locked to protect the infrastructure.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={onNavigateHome}
              className="py-2 px-4 rounded-lg bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#080E1E] text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Overview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role-Based Access Control (RBAC) Matrix Table */}
      <div className="rounded-2xl bg-[#0D1528] border border-[#243149] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#243149] font-mono">
          <div>
            <h3 className="text-sm font-bold text-[#E8EEF8] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
              Role Permission & Clearance Matrix
            </h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Comparison between Standard Analyst (Registered User) and Enterprise SOC Administrator
            </p>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded bg-[#111C32] border border-[#243149] text-xs text-[#38BDF8] font-bold">
            Active Role: {userRole.toUpperCase()}
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#243149]">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#243149] bg-[#080E1E] text-[#94A3B8] uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4">Feature / Module</th>
                <th className="py-2.5 px-4 text-[#38BDF8]">Your Role (Analyst)</th>
                <th className="py-2.5 px-4 text-[#818CF8]">Administrator (Full)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243149]">
              {PERMISSION_MATRIX.map((row, idx) => (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    row.isLocked
                      ? 'bg-[#FB7185]/5 hover:bg-[#FB7185]/10'
                      : 'hover:bg-[#111C32]/40'
                  }`}
                >
                  <td className="py-2.5 px-4 font-semibold text-[#E8EEF8] flex items-center gap-2">
                    {row.isLocked ? (
                      <Lock className="w-3.5 h-3.5 text-[#FB7185] shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                    )}
                    <span>{row.feature}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    {row.isLocked ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#FB7185]/15 border border-[#FB7185]/30 text-[#FB7185] font-bold text-[11px]">
                        <XCircle className="w-3 h-3" />
                        Locked
                      </span>
                    ) : (
                      <span className="text-[#38BDF8]">{row.analyst}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-[#94A3B8]">
                    <span className="text-[#E8EEF8]">{row.admin}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
