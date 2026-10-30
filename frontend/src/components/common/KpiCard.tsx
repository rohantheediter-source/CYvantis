import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'accent' | 'intel' | 'threat' | 'warning' | 'success' | 'cyan' | 'blue' | 'crimson' | 'amber' | 'emerald';
  trend?: string;
  isPositiveTrend?: boolean;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'accent',
  trend,
  isPositiveTrend = true,
  onClick
}) => {
  // Map colors to Obsidian Intelligence tokens
  const getColorStyles = () => {
    switch (color) {
      case 'threat':
      case 'crimson':
        return {
          iconBg: 'bg-[#FB7185]/10 border-[#FB7185]/30 text-[#FB7185]',
          dot: 'bg-[#FB7185]',
          glow: 'group-hover:border-[#FB7185]/40'
        };
      case 'warning':
      case 'amber':
        return {
          iconBg: 'bg-[#FBBF24]/10 border-[#FBBF24]/30 text-[#FBBF24]',
          dot: 'bg-[#FBBF24]',
          glow: 'group-hover:border-[#FBBF24]/40'
        };
      case 'success':
      case 'emerald':
        return {
          iconBg: 'bg-[#34D399]/10 border-[#34D399]/30 text-[#34D399]',
          dot: 'bg-[#34D399]',
          glow: 'group-hover:border-[#34D399]/40'
        };
      case 'intel':
      case 'blue':
        return {
          iconBg: 'bg-[#818CF8]/10 border-[#818CF8]/30 text-[#818CF8]',
          dot: 'bg-[#818CF8]',
          glow: 'group-hover:border-[#818CF8]/40'
        };
      case 'accent':
      case 'cyan':
      default:
        return {
          iconBg: 'bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#38BDF8]',
          dot: 'bg-[#38BDF8]',
          glow: 'group-hover:border-[#38BDF8]/40'
        };
    }
  };

  const styles = getColorStyles();

  return (
    <div
      onClick={onClick}
      className={`bg-[#0D1528] border border-[#243149] rounded-xl p-5 relative overflow-hidden group transition-all duration-200 shadow-sm ${
        styles.glow
      } ${onClick ? 'cursor-pointer hover:bg-[#111C32] hover:-translate-y-0.5' : ''}`}
    >
      {/* Specular top border illumination */}
      <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-[#38BDF8]/30 to-transparent pointer-events-none" />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-[#94A3B8] font-mono">
          {title}
        </span>
        <div className={`p-2 rounded-lg border transition-colors ${styles.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3.5 flex items-baseline justify-between">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#E8EEF8] font-mono">
          {value}
        </div>

        {trend && (
          <div className="flex items-center gap-1 text-xs font-mono font-semibold">
            <span className={isPositiveTrend ? 'text-[#34D399]' : 'text-[#FB7185]'}>
              {isPositiveTrend ? '↑' : '↓'} {trend}
            </span>
          </div>
        )}
      </div>

      {subtitle && (
        <div className="mt-2 text-[11px] text-[#94A3B8] font-mono flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};
