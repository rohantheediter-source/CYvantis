import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { DetectionRule, SecurityAlert } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Zap, AlertTriangle, CheckCircle, ToggleLeft, ToggleRight,
  Plus, X, RefreshCw, Sliders
} from 'lucide-react';

export const DetectionRules: React.FC = () => {
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // New Rule Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ruleType, setRuleType] = useState('threshold');
  const [condition, setCondition] = useState('count > 5 in 60s');
  const [threshold, setThreshold] = useState<number>(5);
  const [severity, setSeverity] = useState('high');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ackLoadingId, setAckLoadingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, alertsRes] = await Promise.all([
        apiRequest<DetectionRule[]>('/rules'),
        apiRequest<SecurityAlert[]>('/rules/alerts?status_filter=all')
      ]);
      setRules(rulesRes || []);
      setAlerts(alertsRes || []);
    } catch (err) {
      console.error('Failed to load rules & alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleRule = async (ruleId: number) => {
    try {
      await apiRequest(`/rules/${ruleId}/toggle`, { method: 'PUT' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle rule status');
    }
  };

  const handleAcknowledgeAlert = async (alertId: number) => {
    setAckLoadingId(alertId);
    try {
      await apiRequest(`/rules/alerts/${alertId}/acknowledge`, { method: 'PUT' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge alert');
    } finally {
      setAckLoadingId(null);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiRequest('/rules', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          rule_type: ruleType,
          condition,
          threshold: Number(threshold),
          severity,
          is_enabled: true
        })
      });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create detection rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans">
      {/* 1. Detection Rules Header */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <h2 className="text-lg font-bold text-[#E8EEF8] font-mono tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#38BDF8]" />
              Detection Rules Engine & Alert Queues
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Automated honeypot threat detection logic, brute-force frequency thresholds, and alert queue dispatch
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#38BDF8] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto font-mono"
        >
          <Plus className="w-4 h-4" />
          <span>New Detection Rule</span>
        </button>
      </div>

      {/* 2. Rules Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-[#94A3B8] text-xs font-mono">
            Loading detection rules...
          </div>
        ) : rules.length === 0 ? (
          <div className="col-span-full text-center py-8 text-[#94A3B8] text-xs font-mono bg-[#0D1528] rounded-xl border border-[#243149]">
            No detection rules defined.
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4 font-mono text-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#E8EEF8] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                    {rule.name}
                  </h3>
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                      rule.is_enabled
                        ? 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/40'
                        : 'bg-[#111C32] text-[#94A3B8] border-[#243149]'
                    }`}
                  >
                    {rule.is_enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    <span>{rule.is_enabled ? 'ENABLED' : 'DISABLED'}</span>
                  </button>
                </div>

                <p className="text-xs text-[#94A3B8] font-sans">{rule.description}</p>
              </div>

              <div className="pt-3 border-t border-[#243149] flex items-center justify-between text-[11px]">
                <div className="text-[#94A3B8]">
                  Threshold: <strong className="text-[#38BDF8]">{rule.threshold} events</strong> •{' '}
                  <span className="text-[#818CF8]">{rule.rule_type}</span>
                </div>
                <StatusBadge status={rule.severity} type="severity" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Security Alert Queue */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FB7185]" />
            <h3 className="text-xs font-bold text-[#E8EEF8] uppercase tracking-wider font-mono">
              Triggered Alert Queue ({alerts.length})
            </h3>
          </div>
          <span className="text-xs font-mono text-[#94A3B8]">
            {alerts.filter((a) => !a.is_acknowledged).length} Pending Acknowledgment
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#111C32] text-[#94A3B8] uppercase text-[10px] border-b border-[#243149]">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Alert Title</th>
                <th className="p-3">Triggered Rule</th>
                <th className="p-3">Attacker IP</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243149]">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-[#94A3B8]">
                    No security alerts triggered yet. Sensor rules running.
                  </td>
                </tr>
              ) : (
                alerts.map((al) => (
                  <tr key={al.id} className="hover:bg-[#111C32] transition-colors">
                    <td className="p-3 text-[#94A3B8] text-[11px]">
                      {new Date(al.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-[#E8EEF8]">{al.title}</td>
                    <td className="p-3 text-[#818CF8]">{al.rule_name}</td>
                    <td className="p-3 text-[#38BDF8]">{al.src_ip || '—'}</td>
                    <td className="p-3">
                      <StatusBadge status={al.severity} type="severity" />
                    </td>
                    <td className="p-3">
                      <StatusBadge status={al.status} />
                    </td>
                    <td className="p-3 text-right">
                      {!al.is_acknowledged ? (
                        <button
                          onClick={() => handleAcknowledgeAlert(al.id)}
                          disabled={ackLoadingId === al.id}
                          className="px-2.5 py-1 rounded bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 text-[#38BDF8] border border-[#38BDF8]/40 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          {ackLoadingId === al.id ? 'Saving...' : 'Acknowledge'}
                        </button>
                      ) : (
                        <span className="text-[#34D399] font-bold flex items-center justify-end gap-1 text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5" /> Acknowledged
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Create Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateRule}
            className="bg-[#0D1528] border border-[#243149] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono text-xs"
          >
            <div className="flex items-center justify-between border-b border-[#243149] pb-3">
              <h3 className="font-bold text-[#E8EEF8] text-sm">Create New Detection Rule</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#E8EEF8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[#94A3B8] text-[11px]">RULE NAME</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. SSH Rapid Brute-Force Spike"
                  className="w-full bg-[#111C32] border border-[#243149] rounded-lg px-3 py-2 text-xs text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#94A3B8] text-[11px]">SEVERITY</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-[#111C32] border border-[#243149] rounded-lg px-3 py-2 text-xs text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60 cursor-pointer"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[#94A3B8] text-[11px]">EVENT THRESHOLD</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full bg-[#111C32] border border-[#243149] rounded-lg px-3 py-2 text-xs text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] text-[11px]">RULE CONDITION / LOGIC</label>
                <input
                  type="text"
                  required
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  placeholder="e.g. count > 5 in 60s"
                  className="w-full bg-[#111C32] border border-[#243149] rounded-lg px-3 py-2 text-xs text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#94A3B8] text-[11px]">DESCRIPTION</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain the threat behavior detected by this rule..."
                  className="w-full bg-[#111C32] border border-[#243149] rounded-lg p-3 text-xs text-[#E8EEF8] focus:outline-none focus:border-[#38BDF8]/60"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-[#111C32] border border-[#243149] text-[#94A3B8] hover:text-[#E8EEF8]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#38BDF8] font-bold"
              >
                {isSubmitting ? 'Saving...' : 'Deploy Rule'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
