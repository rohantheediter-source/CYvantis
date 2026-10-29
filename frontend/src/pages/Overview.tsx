import React, { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import { OverviewKpis, HoneypotEvent, SecurityAlert } from '../types';
import { KpiCard } from '../components/common/KpiCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { OperationalStatusStrip } from '../components/common/OperationalStatusStrip';
import { useWebSocket } from '../context/WebSocketContext';
import {
  ShieldAlert, Radio, Terminal, Users, Cpu, Activity,
  Globe, AlertTriangle, RefreshCw, Zap, CheckCircle2,
  ExternalLink, ArrowRight, Eye, Copy, Check
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

interface OverviewProps {
  onNavigateTab?: (tab: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigateTab }) => {
  const { isConnected } = useWebSocket();
  const [kpis, setKpis] = useState<OverviewKpis | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [attackTypes, setAttackTypes] = useState<any[]>([]);
  const [topIps, setTopIps] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<HoneypotEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [timeRange, setTimeRange] = useState<number>(7);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());
  const [selectedEvent, setSelectedEvent] = useState<HoneypotEvent | null>(null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [ackLoadingId, setAckLoadingId] = useState<number | null>(null);

  const fetchData = async (days = timeRange) => {
    setIsRefreshing(true);
    try {
      const [kpiRes, timeRes, typesRes, ipsRes, eventsRes, alertsRes] = await Promise.all([
        apiRequest<OverviewKpis>('/analytics/overview'),
        apiRequest<any[]>(`/analytics/timeline?days=${days}`),
        apiRequest<any[]>('/analytics/attack-types'),
        apiRequest<any[]>('/analytics/top-source-ips?limit=5'),
        apiRequest<{ items: HoneypotEvent[] }>('/events?page=1&page_size=6'),
        apiRequest<SecurityAlert[]>('/rules/alerts?status_filter=active')
      ]);

      setKpis(kpiRes);
      setTimeline(timeRes);
      setAttackTypes(typesRes);
      setTopIps(ipsRes);
      setRecentEvents(eventsRes.items || []);
      setAlerts(alertsRes || []);
      setLastSyncTime(new Date().toISOString());
    } catch (err) {
      console.error('Failed to load Overview SOC data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(timeRange);
  }, [timeRange]);

  const handleAcknowledgeAlert = async (alertId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setAckLoadingId(alertId);
    try {
      await apiRequest(`/rules/alerts/${alertId}/acknowledge`, { method: 'PUT' });
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      if (kpis) {
        setKpis({ ...kpis, critical_alerts: Math.max(0, kpis.critical_alerts - 1) });
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setAckLoadingId(null);
    }
  };

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  if (loading && !kpis) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-[#38BDF8] font-mono text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-[#38BDF8]" />
          <span>Synchronizing CYVANTIS Telemetry Nexus...</span>
        </div>
      </div>
    );
  }

  // Obsidian palette chart colors
  const BAR_COLORS = ['#38BDF8', '#818CF8', '#38BDF8', '#818CF8', '#38BDF8'];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* 1. Operational Status Strip */}
      <OperationalStatusStrip
        apiStatus="OPERATIONAL"
        cowrieStatus="Running (Port 22/23)"
        wsConnected={isConnected}
        dbStatus="SQLite3 Transactional"
        lastUpdate={lastSyncTime}
        onRefresh={() => fetchData(timeRange)}
        isRefreshing={isRefreshing}
      />

      {/* 2. Executive Threat Environment Header */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <span className="text-[10px] font-mono font-bold text-[#38BDF8] uppercase tracking-wider">
              COMMAND & CONTROL OVERVIEW
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#E8EEF8] font-mono mt-1">
            Enterprise Security Gateway & Threat Intelligence
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Real-time honeypot attack telemetry, threat intelligence correlation, and active sensor response.
          </p>
        </div>

        {/* Time-Range Selector */}
        <div className="flex items-center gap-1.5 bg-[#111C32] p-1 rounded-lg border border-[#243149] text-xs font-mono shrink-0">
          {[
            { label: '24H', days: 1 },
            { label: '7D', days: 7 },
            { label: '30D', days: 30 }
          ].map((item) => (
            <button
              key={item.days}
              onClick={() => setTimeRange(item.days)}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                timeRange === item.days
                  ? 'bg-[#0D1528] text-[#38BDF8] font-bold border border-[#38BDF8]/40 shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#E8EEF8]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. High-Density KPI Cards (Click-through to filtered pages) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Recorded Events"
          value={kpis?.total_events.toLocaleString() || 0}
          subtitle="Honeypot Sensor Network"
          icon={Activity}
          color="accent"
          trend="+14.2%"
          isPositiveTrend={true}
          onClick={() => onNavigateTab && onNavigateTab('events')}
        />
        <KpiCard
          title="Unique Attack Sources"
          value={kpis?.unique_ips.toLocaleString() || 0}
          subtitle="GeoIP Enriched Sources"
          icon={Users}
          color="intel"
          trend="-2.4%"
          isPositiveTrend={true}
          onClick={() => onNavigateTab && onNavigateTab('source-intelligence')}
        />
        <KpiCard
          title="Auth Attempts Logged"
          value={kpis?.auth_attempts.toLocaleString() || 0}
          subtitle="Brute-Force Credentials"
          icon={Radio}
          color="accent"
          onClick={() => onNavigateTab && onNavigateTab('attack-analysis')}
        />
        <KpiCard
          title="Active Critical Alerts"
          value={kpis?.critical_alerts || 0}
          subtitle="Triggered Detection Rules"
          icon={ShieldAlert}
          color="threat"
          trend="+3"
          isPositiveTrend={false}
          onClick={() => onNavigateTab && onNavigateTab('detection-rules')}
        />
        <KpiCard
          title="SSH Attack Volume"
          value={kpis?.ssh_attempts.toLocaleString() || 0}
          subtitle="Port 22 SSH Gateway"
          icon={Terminal}
          color="accent"
          onClick={() => onNavigateTab && onNavigateTab('events')}
        />
        <KpiCard
          title="Telnet Attack Volume"
          value={kpis?.telnet_attempts.toLocaleString() || 0}
          subtitle="Port 23 Telnet Honey"
          icon={Zap}
          color="intel"
          onClick={() => onNavigateTab && onNavigateTab('events')}
        />
        <KpiCard
          title="Active Investigations"
          value={kpis?.active_investigations || 0}
          subtitle="Incident Response Cases"
          icon={ShieldAlert}
          color="warning"
          trend="+2"
          isPositiveTrend={false}
          onClick={() => onNavigateTab && onNavigateTab('investigations')}
        />
        <KpiCard
          title="Active Honeypots"
          value={kpis?.active_sensors || 1}
          subtitle="Cowrie Gateway Sensor"
          icon={Cpu}
          color="success"
          onClick={() => onNavigateTab && onNavigateTab('health')}
        />
      </div>

      {/* 4. Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attack Activity Timeline */}
        <div className="lg:col-span-2 bg-[#0D1528] border border-[#243149] rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#E8EEF8] uppercase tracking-wider flex items-center gap-2 font-mono">
              <Activity className="w-3.5 h-3.5 text-[#38BDF8]" />
              Attack Volume Timeline ({timeRange} Days)
            </h3>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-[#E8EEF8]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#38BDF8]" /> SSH
              </span>
              <span className="flex items-center gap-1.5 text-[#818CF8]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#818CF8]" /> Telnet
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sshGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="telnetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818CF8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#818CF8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
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
                <Area type="monotone" dataKey="SSH" stroke="#38BDF8" fillOpacity={1} fill="url(#sshGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="Telnet" stroke="#818CF8" fillOpacity={1} fill="url(#telnetGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attack Vector Distribution */}
        <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-[#E8EEF8] uppercase tracking-wider flex items-center gap-2 font-mono">
            <Terminal className="w-3.5 h-3.5 text-[#818CF8]" />
            Attack Vector Distribution
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attackTypes} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <XAxis type="number" stroke="#94A3B8" fontSize={10} hide />
                <YAxis dataKey="type" type="category" stroke="#E8EEF8" fontSize={10} tickLine={false} width={100} />
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
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {attackTypes.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Top Source IPs & Priority Security Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Source IP Table */}
        <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#E8EEF8] uppercase tracking-wider flex items-center gap-2 font-mono">
              <Globe className="w-3.5 h-3.5 text-[#38BDF8]" />
              Top Malicious Source IP Addresses
            </h3>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('source-intelligence')}
                className="text-xs text-[#38BDF8] hover:underline flex items-center gap-1 font-mono"
              >
                Inspect Sources <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[#94A3B8] border-b border-[#243149] uppercase font-mono text-[10px]">
                <tr>
                  <th className="pb-2.5">Source IP</th>
                  <th className="pb-2.5">Country</th>
                  <th className="pb-2.5">ASN / Provider</th>
                  <th className="pb-2.5 text-right">Attacks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243149] font-mono">
                {topIps.map((ipItem) => (
                  <tr key={ipItem.ip} className="hover:bg-[#111C32] transition-colors">
                    <td className="py-2.5 font-bold text-[#38BDF8] flex items-center gap-1.5">
                      <span>{ipItem.ip}</span>
                      <button
                        onClick={(e) => copyToClipboard(ipItem.ip, e)}
                        className="text-[#94A3B8] hover:text-[#E8EEF8]"
                        title="Copy IP"
                      >
                        {copiedIp === ipItem.ip ? <Check className="w-3 h-3 text-[#34D399]" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </td>
                    <td className="py-2.5 text-[#E8EEF8]">{ipItem.country}</td>
                    <td className="py-2.5 text-[#94A3B8] truncate max-w-[150px]">{ipItem.asn}</td>
                    <td className="py-2.5 text-right font-bold text-[#E8EEF8]">{ipItem.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Security Alerts with Live Acknowledge Action */}
        <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#E8EEF8] uppercase tracking-wider flex items-center gap-2 font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-[#FB7185]" />
              Priority System Alerts ({alerts.length})
            </h3>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('detection-rules')}
                className="text-xs text-[#FB7185] hover:underline flex items-center gap-1 font-mono"
              >
                Alert Queue <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#94A3B8] font-mono bg-[#111C32] rounded-lg border border-[#243149]">
                <CheckCircle2 className="w-5 h-5 text-[#34D399] mx-auto mb-1.5" />
                No active security alerts. All sensors operational.
              </div>
            ) : (
              alerts.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg bg-[#111C32] border border-[#243149] hover:border-[#FB7185]/40 transition-colors flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={alert.severity} type="severity" />
                      <span className="text-xs font-bold text-[#E8EEF8] truncate">{alert.title}</span>
                    </div>
                    <p className="text-xs text-[#94A3B8] line-clamp-1">{alert.description}</p>
                    <div className="text-[10px] text-[#94A3B8] font-mono">
                      Source: <span className="text-[#38BDF8]">{alert.src_ip}</span> •{' '}
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleAcknowledgeAlert(alert.id, e)}
                    disabled={ackLoadingId === alert.id}
                    className="shrink-0 px-2 py-1 rounded bg-[#0D1528] hover:bg-[#243149] border border-[#243149] text-[10px] font-mono text-[#E8EEF8] hover:text-[#34D399] transition-colors"
                  >
                    {ackLoadingId === alert.id ? 'Saving...' : 'Acknowledge'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. Recent Honeypot Event Feed Table */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#38BDF8] animate-pulse" />
            <h3 className="text-xs font-bold text-[#E8EEF8] uppercase tracking-wider font-mono">
              Recent Live Honeypot Captures
            </h3>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('events')}
              className="text-xs text-[#38BDF8] hover:underline flex items-center gap-1 font-mono"
            >
              Open Event Explorer <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[#94A3B8] border-b border-[#243149] uppercase font-mono text-[10px]">
              <tr>
                <th className="pb-2.5">Timestamp</th>
                <th className="pb-2.5">Event ID</th>
                <th className="pb-2.5">Source IP</th>
                <th className="pb-2.5">Protocol</th>
                <th className="pb-2.5">Target User</th>
                <th className="pb-2.5">Command / Payload</th>
                <th className="pb-2.5">Severity</th>
                <th className="pb-2.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243149] font-mono">
              {recentEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-[#111C32] transition-colors">
                  <td className="py-2.5 text-[#94A3B8]">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2.5 font-bold text-[#E8EEF8]">{ev.eventid}</td>
                  <td className="py-2.5 text-[#38BDF8] font-semibold">{ev.src_ip}</td>
                  <td className="py-2.5">
                    <StatusBadge status={ev.protocol} type="protocol" />
                  </td>
                  <td className="py-2.5 text-[#E8EEF8]">{ev.username || '—'}</td>
                  <td className="py-2.5 text-[#94A3B8] max-w-xs truncate">{ev.command || ev.file_hash || '—'}</td>
                  <td className="py-2.5">
                    <StatusBadge status={ev.severity} type="severity" />
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => setSelectedEvent(ev)}
                      className="p-1 rounded hover:bg-[#243149] text-[#94A3B8] hover:text-[#38BDF8]"
                      title="Inspect Raw Event"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Details Drawer Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1528] border border-[#243149] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#243149] pb-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedEvent.severity} type="severity" />
                <h3 className="font-bold text-[#E8EEF8] font-mono text-sm">
                  Event ID #{selectedEvent.id} • {selectedEvent.eventid}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-[#94A3B8] hover:text-[#E8EEF8] font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-[#111C32] border border-[#243149]">
                <span className="text-[#94A3B8] block text-[10px]">SOURCE IP</span>
                <span className="text-[#38BDF8] font-bold">{selectedEvent.src_ip}</span>
              </div>
              <div className="p-2.5 rounded bg-[#111C32] border border-[#243149]">
                <span className="text-[#94A3B8] block text-[10px]">PROTOCOL / PORT</span>
                <span className="text-[#E8EEF8]">{selectedEvent.protocol} : {selectedEvent.dst_port}</span>
              </div>
              <div className="p-2.5 rounded bg-[#111C32] border border-[#243149]">
                <span className="text-[#94A3B8] block text-[10px]">COUNTRY / ASN</span>
                <span className="text-[#E8EEF8]">{selectedEvent.country || 'Unknown'} ({selectedEvent.asn || 'N/A'})</span>
              </div>
              <div className="p-2.5 rounded bg-[#111C32] border border-[#243149]">
                <span className="text-[#94A3B8] block text-[10px]">CREDENTIALS</span>
                <span className="text-[#E8EEF8]">{selectedEvent.username || '—'} : {selectedEvent.password ? '••••••••' : '—'}</span>
              </div>
            </div>

            {selectedEvent.command && (
              <div className="space-y-1">
                <span className="text-xs font-mono text-[#94A3B8]">CAPTURED COMMAND</span>
                <pre className="p-3 bg-[#080E1E] border border-[#243149] rounded-lg text-xs font-mono text-[#38BDF8] overflow-x-auto">
                  {selectedEvent.command}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 rounded-lg bg-[#111C32] hover:bg-[#243149] border border-[#243149] text-xs font-mono text-[#E8EEF8]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
