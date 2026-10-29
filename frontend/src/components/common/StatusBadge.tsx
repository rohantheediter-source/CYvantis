import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'severity' | 'status' | 'protocol' | 'role';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'status' }) => {
  const normalized = status ? status.toLowerCase() : '';

  let colorClasses = 'bg-[#111C32] text-[#94A3B8] border-[#243149]';

  if (type === 'severity') {
    switch (normalized) {
      case 'critical':
        colorClasses = 'bg-[#FB7185]/15 text-[#FB7185] border-[#FB7185]/40 shadow-[0_0_10px_rgba(251,113,133,0.2)] font-bold';
        break;
      case 'high':
        colorClasses = 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/40 font-semibold';
        break;
      case 'medium':
        colorClasses = 'bg-[#818CF8]/15 text-[#818CF8] border-[#818CF8]/40';
        break;
      case 'low':
      case 'info':
        colorClasses = 'bg-[#111C32] text-[#94A3B8] border-[#243149]';
        break;
    }
  } else if (type === 'protocol') {
    switch (normalized) {
      case 'ssh':
        colorClasses = 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30 font-mono font-medium';
        break;
      case 'telnet':
        colorClasses = 'bg-[#818CF8]/10 text-[#818CF8] border-[#818CF8]/30 font-mono font-medium';
        break;
    }
  } else if (type === 'role') {
    switch (normalized) {
      case 'admin':
        colorClasses = 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/40 font-bold';
        break;
      case 'analyst':
        colorClasses = 'bg-[#818CF8]/15 text-[#818CF8] border-[#818CF8]/40 font-medium';
        break;
      case 'viewer':
        colorClasses = 'bg-[#111C32] text-[#94A3B8] border-[#243149]';
        break;
    }
  } else {
    switch (normalized) {
      case 'open':
      case 'active':
        colorClasses = 'bg-[#FB7185]/15 text-[#FB7185] border-[#FB7185]/40 font-medium';
        break;
      case 'in_progress':
      case 'acknowledged':
        colorClasses = 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/40 font-medium';
        break;
      case 'resolved':
      case 'closed':
      case 'success':
      case 'operational':
        colorClasses = 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/40 font-medium';
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border transition-colors ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {status}
    </span>
  );
};
