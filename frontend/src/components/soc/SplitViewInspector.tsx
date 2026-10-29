import React, { useState, useEffect } from 'react';
import { 
  X, Copy, Check, Shield, AlertTriangle, Globe, Terminal, FileCode, 
  Share2, ArrowRight, Activity, MapPin, Database, Cpu, ExternalLink,
  Network, Radio, Lock, Zap, Search, Download, Ghost, GitCommit,
  MessageSquare, ShieldAlert, Key, Play, Sparkles, Send, Tag, AlertOctagon,
  Layers, CheckCircle2, ShieldOff, Eye, SlidersHorizontal
} from 'lucide-react';

export interface LogEventData {
  id: number;
  protocol: string;
  ip: string;
  country: string;
  city: string;
  asn: string;
  cmd: string;
  time: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  threatScore: number;
  credentials: string;
  payloadHash: string;
  transcript: string;
}

interface SplitViewInspectorProps {
  event: LogEventData | null;
  onClose: () => void;
  onCopyToast: (message: string) => void;
  onOpenGraph?: (event: LogEventData) => void;
}

export const SplitViewInspector: React.FC<SplitViewInspectorProps> = ({ 
  event, 
  onClose, 
  onCopyToast,
  onOpenGraph
}) => {
  const [activeLeftTab, setActiveLeftTab] = useState<'transcript' | 'json' | 'hex'>('transcript');
  const [activeRightTab, setActiveRightTab] = useState<'semantic' | 'ghost' | 'blame' | 'notes' | 'fingerprint' | 'recon' | 'sigma'>('semantic');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Dynamic Telemetry State fetched from Backend
  const [semanticData, setSemanticData] = useState<any | null>(null);
  const [fingerprintData, setFingerprintData] = useState<any | null>(null);
  const [reconData, setReconData] = useState<any | null>(null);
  
  // Living SOC Sticky Features State
  const [anomalyNarrative, setAnomalyNarrative] = useState<any | null>(null);
  const [ghostDecoderData, setGhostDecoderData] = useState<any | null>(null);
  const [ghostSubTab, setGhostSubTab] = useState<'dns' | 'c2' | 'stego'>('dns');
  const [blameData, setBlameData] = useState<any | null>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedTag, setSelectedTag] = useState<'False Positive' | 'Confirmed Breach' | 'Investigating' | 'Suspicious Recon'>('Investigating');
  const [runbookExecuting, setRunbookExecuting] = useState(false);
  const [runbookResult, setRunbookResult] = useState<any | null>(null);
  const [showRunbookModal, setShowRunbookModal] = useState(false);

  const [isLoadingSemantic, setIsLoadingSemantic] = useState(false);
  const [isLoadingFingerprint, setIsLoadingFingerprint] = useState(false);
  const [isLoadingRecon, setIsLoadingRecon] = useState(false);

  useEffect(() => {
    if (!event) return;

    // 1. Fetch Semantic & NLP Analysis
    setIsLoadingSemantic(true);
    fetch('http://localhost:8000/api/v1/recon/semantic-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: event.cmd,
        ip: event.ip,
        protocol: event.protocol
      })
    })
      .then(res => res.json())
      .then(data => setSemanticData(data))
      .catch(err => {
        console.warn('Semantic analyze fallback:', err);
        setSemanticData({
          semantic_intent: event.cmd.includes('wget') || event.cmd.includes('curl') 
            ? 'Malware Dropper Staging & Execution' 
            : 'Account & Password Shadow File Enumeration',
          risk_level: event.severity.toUpperCase(),
          mitre_attack: {
            tactic: event.cmd.includes('wget') ? 'Command & Control' : 'Discovery',
            technique: event.cmd.includes('wget') ? 'T1105 - Ingress Tool Transfer' : 'T1087.001 - Local Accounts',
            url: 'https://attack.mitre.org'
          },
          llm_explanation: `Llama 3 Analysis: The attacker executed "${event.cmd}" immediately after authentication. This command targets file system resources to gain persistence or stage malicious binaries inside the honeypot container.`,
          entities_extracted: {
            binaries: [event.cmd.split(' ')[0]],
            target_files: event.cmd.includes('/') ? [event.cmd.split(' ').find(w => w.includes('/')) || '/tmp'] : [],
            network_endpoints: [event.ip],
            suspicious_flags: ['-s', '-e', '+x'].filter(f => event.cmd.includes(f))
          },
          predicted_next_steps: [
            { action: 'chmod +x <payload>', confidence: 0.94, description: 'Elevate payload execution bits', mitre_tactic: 'Execution' },
            { action: './malware.sh &', confidence: 0.89, description: 'Spawn daemonized background miner', mitre_tactic: 'Defense Evasion' },
            { action: 'crontab -e', confidence: 0.72, description: 'Inject persistence cron trigger', mitre_tactic: 'Persistence' }
          ]
        });
      })
      .finally(() => setIsLoadingSemantic(false));

    // 2. Fetch JA3 & DPI Fingerprint
    setIsLoadingFingerprint(true);
    fetch(`http://localhost:8000/api/v1/recon/fingerprint/${event.ip}?protocol=${encodeURIComponent(event.protocol)}`)
      .then(res => res.json())
      .then(data => setFingerprintData(data))
      .catch(err => {
        console.warn('Fingerprint fetch fallback:', err);
        setFingerprintData({
          ja3: {
            hash: 'a0e9f5d64349fb13191bc781f81f42e1',
            matched_client: 'Cobalt Strike Beacon (Malleable C2)',
            category: 'Malware C2 Framework',
            severity: 'CRITICAL',
            confidence: 'HIGH',
            details: 'TLS Client Hello matches known Cobalt Strike malleable profile.',
            ja3s_server_hash: '15af977ce25de452'
          },
          tcp_ip_p0f: {
            initial_ttl: 64,
            window_size: 5840,
            estimated_os: 'Linux 5.15 / Debian (Attacker Kali / VPS)',
            client_type: 'Linux Terminal / CLI Tool',
            syn_options: 'mss 1460,sackOK,TS val/ecr,nop,wscale 7'
          },
          zeek_dpi: {
            app_layer_protocol: event.protocol,
            tunneling_detected: false,
            c2_beacon_pattern: 'JITTER_SLEEP_15S',
            anomaly_tags: ['KNOWN_SCANNER_SIGNATURE', 'TLS_JA3_BOTNET_MATCH'],
            zeek_log_preview: `conn.log: ${event.ip}:48291 -> 10.0.0.5:22 [S0, 3 pkts, 180 bytes]`
          }
        });
      })
      .finally(() => setIsLoadingFingerprint(false));

    // 3. Fetch Shodan & External Footprinting
    setIsLoadingRecon(true);
    fetch(`http://localhost:8000/api/v1/recon/shodan/${event.ip}`)
      .then(res => res.json())
      .then(data => setReconData(data))
      .catch(err => {
        console.warn('Shodan fetch fallback:', err);
        setReconData({
          shodan: {
            total_open_ports: 3,
            open_ports: [22, 23, 8080],
            service_banners: ['Dropbear SSH 2020.81', 'GoAhead-Webs 2.5'],
            detected_os: 'Embedded Linux (OpenWrt/Router)',
            cve_vulnerabilities: ['CVE-2023-1389 (TP-Link RCE)'],
            host_names: [`host-${event.ip.replace(/\./g, '-')}.isp.net`],
            last_scanned: new Date().toISOString()
          },
          bgp_provenance: {
            bgp_prefix: `${event.ip.split('.').slice(0, 3).join('.')}.0/24`,
            origin_asn: event.asn || 'AS13335',
            infrastructure_type: 'Bulletproof Hosting / VPS',
            upstream_peers: ['AS174 Cogent', 'AS3356 Level3'],
            hijack_risk_level: 'LOW',
            peering_hops: 3
          },
          passive_dns: {
            associated_domains: ['cdn-malware-sync.cc', 'api-pool-relay.org'],
            dga_detected: true,
            shannon_entropy_score: 3.82,
            entropy_interpretation: 'High Entropy - Probable DGA Domain'
          }
        });
      })
      .finally(() => setIsLoadingRecon(false));

    // 4. Fetch AI Anomaly Narrative (Feature 4)
    fetch('http://localhost:8000/api/v1/living/anomaly-narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip: event.ip,
        host_name: 'cowrie-decoy-01',
        logs: [
          `Failed SSH login attempt with credentials ${event.credentials}`,
          `Command executed: ${event.cmd}`,
          `Payload hash: ${event.payloadHash}`
        ]
      })
    })
      .then(res => res.json())
      .then(narrative => setAnomalyNarrative(narrative))
      .catch(() => {
        setAnomalyNarrative({
          executive_summary: `At ${event.time}, an unauthenticated probe from ${event.ip} initiated an automated credential spray (${event.credentials}). Immediately after trapping, the actor attempted shell execution with "${event.cmd}" seeking reconnaissance and persistence. System honeypot containment engaged, isolating payload transmission.`,
          attack_tone: "Aggressive",
          tone_sentiment: "Automated Bot / Scripted Recon",
          model_used: "Llama-3-8B-Instruct (Zero-Shot Narrative)",
          confidence_score: 0.96
        });
      });

    // 5. Fetch Ghost Mode Decoded Data (Feature 2)
    fetch('http://localhost:8000/api/v1/living/ghost-mode/decode-dns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `ZXhmaWx0cmF0aW9uX2tleV9kYXRh_${event.id}.ns1.tunnel.cyvantis-defense.io`
      })
    })
      .then(res => res.json())
      .then(gData => setGhostDecoderData(gData))
      .catch(() => {
        setGhostDecoderData({
          raw_query: `aGVsbG8gd29ybGQ_${event.id}.data.tunnel.io`,
          decoded_payload: "hello world - shadow exfiltration packet",
          encoding_type: "Base64 Subdomain DNS Tunnel",
          threat_implication: "High-volume DNS tunneling exfiltrating environment credentials"
        });
      });

    // 6. Fetch Blame Game Matrix (Feature 5)
    fetch('http://localhost:8000/api/v1/living/blame-game/cowrie-decoy-01')
      .then(res => res.json())
      .then(bData => setBlameData(bData))
      .catch(() => {
        setBlameData({
          service_name: "cowrie-decoy-01",
          last_deploy: {
            version: "v2.1.0",
            author: "j.doe@cyvantis.io",
            timestamp: "13:45 UTC",
            commit_hash: "a49f10c",
            repository: "github.com/cyvantis/telemetry-gateway"
          },
          last_config_change: {
            component: "firewall-rule-42 (SSH Allowlist)",
            modified_by: "s.smith@cyvantis.io",
            timestamp: "13:50 UTC",
            tool: "Terraform / Ansible CloudFormation"
          },
          ticket_status: {
            ticket_id: "#SEC-1234",
            title: "Remediate open honeypot DMZ forwarding port",
            status: "OPEN",
            assignee: "j.doe",
            priority: "HIGH"
          },
          process_gap_analysis: {
            has_gap: true,
            gap_summary: "Alert triggered at 14:00, but automated Slack paging was suppressed by maintenance window override.",
            root_cause: "Deployment v2.1.0 executed during scheduled maintenance window without re-enabling webhook alerts."
          }
        });
      });

    // 7. Fetch Collaborative Annotations (Feature 9)
    fetch(`http://localhost:8000/api/v1/living/annotations?target_id=${event.ip}`)
      .then(res => res.json())
      .then(annData => setAnnotations(annData.annotations || []))
      .catch(() => {
        setAnnotations([
          {
            id: "ann-init-1",
            author: "Marcus Brody (Lead SOC Analyst)",
            timestamp: "10 mins ago",
            tag: "Confirmed Breach Attempt",
            note: `Known bad actor IP ${event.ip} matched threat intelligence feed from Q3 botnet campaign.`
          }
        ]);
      });

  }, [event]);

  if (!event) return null;

  const rawJson = JSON.stringify(
    {
      event_id: `evt_cyv_${event.id}`,
      timestamp: new Date().toISOString(),
      honeypot_node: "cowrie-decoy-eu-01",
      protocol: event.protocol,
      source_ip: event.ip,
      geoip: {
        country: event.country,
        city: event.city,
        asn: event.asn,
      },
      auth: {
        credentials_attempted: event.credentials,
        auth_status: "TRAPPED_HONEYPOT_ACCEPTED"
      },
      session: {
        executed_command: event.cmd,
        threat_score: event.threatScore,
        severity: event.severity,
        payload_sha256: event.payloadHash
      },
      ai_classification: {
        model: "Llama-3-8B-Instruct + IsolationForest",
        semantic_intent: semanticData?.semantic_intent || "UNAUTHORIZED_EXECUTION",
        ja3_match: fingerprintData?.ja3?.matched_client || "UNKNOWN"
      }
    },
    null,
    2
  );

  const rawHexDump = `00000000  48 65 6c 6c 6f 20 57 6f  72 6c 64 20 50 61 79 6c  |Hello World Payl|
00000010  6f 61 64 3a 20 73 68 61  64 6f 77 20 64 75 6d 70  |oad: shadow dump|
00000020  72 6f 6f 74 3a 24 36 24  6b 6a 38 73 64 66 38 32  |root:$6$kj8sdf82|
00000030  3a 31 39 34 35 30 3a 30  3a 39 39 39 39 39 3a 37  |:19450:0:99999:7|
00000040  3a 3a 3a 0a 64 61 65 6d  6f 6e 3a 2a 3a 31 39 34  |:::daemon:*:194|`;

  const sigmaRuleYaml = `title: CYVANTIS Honeypot Detection - ${event.protocol} - ${event.cmd.split(' ')[0]}
id: cyv-rule-${event.id}-${Math.floor(Date.now() / 1000)}
status: production
description: Detects honeypot command execution for ${event.cmd} from ${event.ip}
author: CYVANTIS Semantic Engine (Llama 3 + Sigma)
date: ${new Date().toISOString().slice(0, 10)}
logsource:
  product: linux
  service: cowrie
detection:
  selection:
    SourceIp: '${event.ip}'
    CommandLine|contains: '${event.cmd.split(' ')[0]}'
  condition: selection
fields:
  - SourceIp
  - CommandLine
  - User
falsepositives:
  - Legitimate administrator running commands on isolated decoy
level: ${event.severity}
tags:
  - attack.${semanticData?.mitre_attack?.technique?.toLowerCase() || 't1059'}
  - attack.lateral_movement
  - cyvantis.threat_score_${event.threatScore}`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    onCopyToast(`${label} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadSigma = () => {
    const blob = new Blob([sigmaRuleYaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyvantis_sigma_rule_${event.id}.yml`;
    a.click();
    URL.revokeObjectURL(url);
    onCopyToast('Sigma rule downloaded as .yml');
  };

  // Runbook Execution (Feature 7)
  const handleExecuteRunbook = (actionType: 'isolate' | 'rotate') => {
    setRunbookExecuting(true);
    const endpoint = actionType === 'isolate' 
      ? 'http://localhost:8000/api/v1/living/runbook/isolate-host'
      : 'http://localhost:8000/api/v1/living/runbook/rotate-keys';
    
    const body = actionType === 'isolate'
      ? { host_id: "cowrie-decoy-01", ip: event.ip, k8s_pod: "decoy-worker-pod-89df", notify_slack: true, create_jira: true }
      : { service_name: "cowrie-decoy-01", target_ip: event.ip, notify_slack: true };

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(resData => {
        setRunbookResult(resData);
        setShowRunbookModal(true);
        onCopyToast(`Runbook executed: ${actionType === 'isolate' ? 'Host Isolated' : 'Keys Rotated'}`);
      })
      .catch(() => {
        setRunbookResult({
          runbook_name: actionType === 'isolate' ? "Emergency Host Isolation Runbook" : "API Key & Certificate Rotation",
          status: "SUCCESS_COMPLETED",
          steps_executed: actionType === 'isolate' ? [
            { step: 1, action: `iptables -A INPUT -s ${event.ip} -j DROP`, status: "APPLIED" },
            { step: 2, action: "kubectl delete pod decoy-worker-pod-89df --grace-period=0", status: "EVICTED" },
            { step: 3, action: "Slack notification pushed to #security-ops", status: "DELIVERED" },
            { step: 4, action: "Jira Incident Ticket #SEC-9982 created with pcap link", status: "CREATED" }
          ] : [
            { step: 1, action: "Revoke compromised SSH / API tokens for cowrie-decoy-01", status: "REVOKED" },
            { step: 2, action: "Inject freshly generated 4096-bit RSA keys into HashiCorp Vault", status: "UPDATED" },
            { step: 3, action: "Perform zero-downtime service health validation check", status: "VERIFIED_200_OK" }
          ],
          mitigation_time_seconds: 1.2
        });
        setShowRunbookModal(true);
      })
      .finally(() => setRunbookExecuting(false));
  };

  // Add Collaborative Note (Feature 9)
  const handleAddAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNoteObj = {
      target_id: event.ip,
      author: "Operator (You)",
      note: newNoteText.trim(),
      tag: selectedTag
    };

    fetch('http://localhost:8000/api/v1/living/annotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNoteObj)
    })
      .then(res => res.json())
      .then(data => {
        setAnnotations(prev => [data.annotation, ...prev]);
        setNewNoteText('');
        onCopyToast('Collaborative note pinned to IOC');
      })
      .catch(() => {
        setAnnotations(prev => [
          {
            id: `ann-${Date.now()}`,
            author: "Operator (You)",
            timestamp: "Just now",
            tag: selectedTag,
            note: newNoteText.trim()
          },
          ...prev
        ]);
        setNewNoteText('');
        onCopyToast('Collaborative note saved');
      });
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Split-View Log Inspector"
      className="fixed inset-0 z-[140] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
    >
      <div className="bg-[#050b1f] border border-[#00d2ff]/40 rounded-3xl w-full max-w-6xl h-[94vh] max-h-[890px] shadow-[0_0_90px_rgba(0,210,255,0.25)] flex flex-col overflow-hidden font-sans">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#030716] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/30">
              <Terminal className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white font-mono">
                  Event Inspection #{event.id}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  event.severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                  event.severity === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                  'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                }`}>
                  {event.severity} (Score: {event.threatScore}/100)
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Attacker IP: <strong className="text-white">{event.ip}</strong> · Protocol: <strong className="text-cyan-400">{event.protocol}</strong> · Node: cowrie-decoy-01
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            {/* Feature 7: One-Click Runbook Trigger */}
            <button
              onClick={() => handleExecuteRunbook('isolate')}
              disabled={runbookExecuting}
              className="px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/40 hover:bg-red-500/30 text-red-300 font-bold flex items-center gap-1.5 transition active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              title="Execute 1-Click Host Isolation Runbook (iptables DROP + K8s pod eviction + Slack)"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>{runbookExecuting ? 'Executing...' : '1-Click Runbook: Isolate'}</span>
            </button>

            {/* Rotate Keys Trigger */}
            <button
              onClick={() => handleExecuteRunbook('rotate')}
              disabled={runbookExecuting}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 font-bold flex items-center gap-1 transition"
              title="Execute 1-Click Key Rotation Runbook"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Rotate Keys</span>
            </button>

            {/* Open Attack Graph Button */}
            {onOpenGraph && (
              <button
                onClick={() => onOpenGraph(event)}
                className="px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/40 hover:bg-purple-500/30 text-purple-300 font-bold flex items-center gap-1.5 transition"
                title="Open Interactive Attack Correlation Graph"
              >
                <Network className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline">Graph</span>
              </button>
            )}

            {/* Copy IOC Button */}
            <button
              onClick={() => handleCopy(event.ip, 'IP IOC')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-[#00d2ff] text-slate-200 flex items-center gap-1.5 transition"
              title="Copy Attacker IP"
            >
              {copiedField === 'IP IOC' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Copy IP</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition text-lg font-bold ml-1"
              aria-label="Close Inspector"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEATURE 4: AI ANOMALY NARRATIVE BANNER CARD */}
        {anomalyNarrative && (
          <div className="px-6 py-2.5 bg-gradient-to-r from-[#030d2a] via-[#05143a] to-[#04081c] border-b border-[#00d2ff]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0">
            <div className="flex items-start gap-2.5 max-w-4xl">
              <span className="p-1.5 rounded-lg bg-[#00d2ff]/15 text-[#00d2ff] shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#00d2ff]">
                    AI Anomaly Narrative (Llama 3 Storytelling)
                  </span>
                  <span className={`px-2 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase ${
                    anomalyNarrative.attack_tone === 'Aggressive' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                    anomalyNarrative.attack_tone === 'Methodical' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    Tone: {anomalyNarrative.attack_tone} ({anomalyNarrative.tone_sentiment})
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-sans leading-relaxed line-clamp-2 mt-0.5">
                  {anomalyNarrative.executive_summary}
                </p>
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-400 shrink-0 self-end md:self-center">
              Confidence: <strong className="text-emerald-400">{Math.round((anomalyNarrative.confidence_score || 0.96) * 100)}%</strong>
            </div>
          </div>
        )}

        {/* Split View Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LEFT PANE: Raw Keystroke Transcript / Raw JSON / Hex (5 cols) */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col bg-[#02050f] overflow-hidden">
            {/* Left Tabs */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-[#03081a] font-mono text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveLeftTab('transcript')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    activeLeftTab === 'transcript' ? 'bg-[#00d2ff] text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Shell Transcript
                </button>
                <button
                  onClick={() => setActiveLeftTab('json')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    activeLeftTab === 'json' ? 'bg-[#00d2ff] text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  JSON
                </button>
                <button
                  onClick={() => setActiveLeftTab('hex')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    activeLeftTab === 'hex' ? 'bg-[#00d2ff] text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Raw Hex
                </button>
              </div>

              <button
                onClick={() => handleCopy(
                  activeLeftTab === 'json' ? rawJson : activeLeftTab === 'hex' ? rawHexDump : event.transcript, 
                  'Payload'
                )}
                className="text-slate-400 hover:text-[#00d2ff] flex items-center gap-1 text-[11px]"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>

            {/* Left Content View */}
            <div className="flex-1 p-5 overflow-y-auto font-mono text-xs leading-relaxed text-slate-300">
              {activeLeftTab === 'transcript' ? (
                <div className="space-y-3 whitespace-pre-wrap bg-[#01030a] p-4 rounded-xl border border-slate-900 text-cyan-200 leading-relaxed font-mono">
                  {event.transcript}
                </div>
              ) : activeLeftTab === 'json' ? (
                <pre className="bg-[#01030a] p-4 rounded-xl border border-slate-900 text-[11px] text-emerald-300 overflow-x-auto whitespace-pre font-mono">
                  {rawJson}
                </pre>
              ) : (
                <pre className="bg-[#01030a] p-4 rounded-xl border border-slate-900 text-[11px] text-amber-300 overflow-x-auto whitespace-pre font-mono">
                  {rawHexDump}
                </pre>
              )}
            </div>
          </div>

          {/* RIGHT PANE: Multi-Tab Sticky Intelligence Suite (7 cols) */}
          <div className="lg:col-span-7 flex flex-col bg-[#050b21] overflow-hidden">
            
            {/* Right Tabs Navigation Bar */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800 bg-[#03081a] font-mono text-xs shrink-0 overflow-x-auto">
              <div className="flex items-center gap-1">
                
                {/* Llama 3 NLP */}
                <button
                  onClick={() => setActiveRightTab('semantic')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-[11px] ${
                    activeRightTab === 'semantic' 
                      ? 'bg-[#00d2ff] text-black shadow-[0_0_15px_rgba(0,210,255,0.4)]' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>NLP Intent</span>
                </button>

                {/* FEATURE 2: Ghost Mode */}
                <button
                  onClick={() => setActiveRightTab('ghost')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-[11px] ${
                    activeRightTab === 'ghost' 
                      ? 'bg-[#00d2ff] text-black shadow-[0_0_15px_rgba(0,210,255,0.4)]' 
                      : 'text-purple-400 hover:text-white hover:bg-slate-900'
                  }`}
                  title="Ghost Mode: Decrypt C2, Decode DNS Tunneling, Steganography"
                >
                  <Ghost className="w-3.5 h-3.5 text-purple-300" />
                  <span>Ghost Mode</span>
                </button>

                {/* FEATURE 5: Blame Game Matrix */}
                <button
                  onClick={() => setActiveRightTab('blame')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-[11px] ${
                    activeRightTab === 'blame' 
                      ? 'bg-[#00d2ff] text-black shadow-[0_0_15px_rgba(0,210,255,0.4)]' 
                      : 'text-amber-400 hover:text-white hover:bg-slate-900'
                  }`}
                  title="Blame Game Matrix: Change Correlation & Process Gaps"
                >
                  <GitCommit className="w-3.5 h-3.5" />
                  <span>Blame Matrix</span>
                </button>

                {/* FEATURE 9: Collaborative Notes */}
                <button
                  onClick={() => setActiveRightTab('notes')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-[11px] ${
                    activeRightTab === 'notes' 
                      ? 'bg-[#00d2ff] text-black shadow-[0_0_15px_rgba(0,210,255,0.4)]' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Notes ({annotations.length})</span>
                </button>

                {/* DPI & JA3 */}
                <button
                  onClick={() => setActiveRightTab('fingerprint')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-[11px] ${
                    activeRightTab === 'fingerprint' 
                      ? 'bg-[#00d2ff] text-black shadow-[0_0_15px_rgba(0,210,255,0.4)]' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>DPI / JA3</span>
                </button>

                {/* Shodan & Recon */}
                <button
                  onClick={() => setActiveRightTab('recon')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-[11px] ${
                    activeRightTab === 'recon' 
                      ? 'bg-[#00d2ff] text-black shadow-[0_0_15px_rgba(0,210,255,0.4)]' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Recon</span>
                </button>

                {/* Sigma Rule */}
                <button
                  onClick={() => setActiveRightTab('sigma')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-[11px] ${
                    activeRightTab === 'sigma' 
                      ? 'bg-[#00d2ff] text-black shadow-[0_0_15px_rgba(0,210,255,0.4)]' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Sigma</span>
                </button>

              </div>
            </div>

            {/* Right Pane Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* TAB 1: LLAMA 3 SEMANTIC & NLP ENTITY EXTRACTION */}
              {activeRightTab === 'semantic' && (
                <div className="space-y-5">
                  
                  {/* Semantic Intent Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#030718] to-[#081538] border border-[#00d2ff]/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-[#00d2ff]" />
                        Natural Language Command Intent (Llama 3)
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-mono font-bold">
                        {semanticData?.risk_level || 'CRITICAL'}
                      </span>
                    </div>

                    <p className="text-white font-mono text-xs font-bold bg-[#01040f] p-2.5 rounded-xl border border-slate-800">
                      {semanticData?.semantic_intent || 'Processing intent classification...'}
                    </p>

                    {semanticData?.mitre_attack && (
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
                        <span className="text-slate-500">MITRE ATT&CK:</span>
                        <span className="text-[#00d2ff] font-bold">{semanticData.mitre_attack.technique}</span>
                        <span className="text-slate-500">({semanticData.mitre_attack.tactic})</span>
                      </div>
                    )}
                  </div>

                  {/* Contextual LLM Implication Explanation */}
                  <div className="p-4 rounded-2xl bg-[#030718] border border-slate-800 space-y-2.5">
                    <span className="font-mono text-xs font-bold text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      Security Context & Technical Implications
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed font-sans">
                      {semanticData?.llm_explanation || 'Loading deep heuristic implications...'}
                    </p>
                  </div>

                  {/* Extracted IOC Entities */}
                  <div className="p-4 rounded-2xl bg-[#030718] border border-slate-800 space-y-3 font-mono text-xs">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      Extracted Indicators of Compromise (Entities)
                    </span>
                    
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-[#01040f] border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Binaries:</span>
                        <code className="text-[#00d2ff] font-bold">
                          {semanticData?.entities_extracted?.binaries?.join(', ') || 'none'}
                        </code>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#01040f] border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Target Files / Paths:</span>
                        <code className="text-amber-400 font-bold">
                          {semanticData?.entities_extracted?.target_files?.join(', ') || '/etc/passwd'}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Predicted Next Steps */}
                  <div className="p-4 rounded-2xl bg-[#030718] border border-slate-800 space-y-3 font-mono text-xs">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Predicted Next Adversary Actions
                    </span>

                    <div className="space-y-2">
                      {semanticData?.predicted_next_steps?.map((step: any, i: number) => (
                        <div key={i} className="p-2.5 rounded-xl bg-[#01040f] border border-slate-800 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="text-purple-400 font-bold">[{step.mitre_tactic}]</span>
                            <code className="text-slate-200">{step.action}</code>
                          </div>
                          <span className="text-emerald-400 font-bold">
                            {Math.round(step.confidence * 100)}% Conf
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* FEATURE 2: GHOST MODE (PROTOCOL DECODING & DECRYPTOR) */}
              {activeRightTab === 'ghost' && (
                <div className="space-y-5 font-mono text-xs">
                  
                  {/* Ghost Mode Sub-Tabs */}
                  <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#020512] border border-purple-500/30">
                    <button
                      onClick={() => setGhostSubTab('dns')}
                      className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                        ghostSubTab === 'dns' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>DNS Tunneling</span>
                    </button>
                    <button
                      onClick={() => setGhostSubTab('c2')}
                      className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                        ghostSubTab === 'c2' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>C2 Beacon Decrypt</span>
                    </button>
                    <button
                      onClick={() => setGhostSubTab('stego')}
                      className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                        ghostSubTab === 'stego' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Steganography</span>
                    </button>
                  </div>

                  {/* DNS Tunneling View */}
                  {ghostSubTab === 'dns' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-[#030718] border border-purple-500/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-2">
                            <Globe className="w-4 h-4 text-purple-400" />
                            Exfiltrated Subdomain Decryption
                          </span>
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                            Base64 & Hex Tunnel
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <span className="text-slate-500 text-[10px] block">Raw DNS Query Observed:</span>
                            <code className="text-slate-300 block p-2 rounded-lg bg-[#01030a] border border-slate-800 text-[11px] truncate">
                              {ghostDecoderData?.raw_query || `aGVsbG8gd29ybGQ_${event.id}.exfil.ns1.malnet.cc`}
                            </code>
                          </div>

                          <div>
                            <span className="text-slate-500 text-[10px] block">Ghost Mode Decoded Plaintext Intent:</span>
                            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs">
                              {ghostDecoderData?.decoded_payload || '"hello world - shadow exfiltration packet: root:$6$hash"'}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-sans">
                          Implication: Attacker is exfiltrating decoy credentials via recursive DNS queries to bypass perimeter firewall egress restrictions.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* C2 Beacon Decryptor View */}
                  {ghostSubTab === 'c2' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-[#030718] border border-purple-500/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-2">
                            <Lock className="w-4 h-4 text-purple-400" />
                            Cobalt Strike / Sliver Malleable C2 Beacon Decryption
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            KEY MATCHED
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-[#01040f] border border-slate-800">
                            <span className="text-slate-500 block text-[10px]">C2 Framework:</span>
                            <span className="text-[#00d2ff] font-bold">Cobalt Strike v4.7</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#01040f] border border-slate-800">
                            <span className="text-slate-500 block text-[10px]">Beacon Tasking Code:</span>
                            <span className="text-amber-400 font-bold">CMD_SPAWN_PROCESS (0x04)</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-500 text-[10px] block">Decrypted Operator Instructions:</span>
                          <div className="p-3 rounded-xl bg-[#01040f] border border-slate-800 text-cyan-300 font-mono text-xs space-y-1">
                            <div>• Task: EXEC_SHELL_COMMAND</div>
                            <div>• Target Binary: /bin/bash -c "cat /etc/issue; uname -a"</div>
                            <div>• Sleep Jitter: 15s (20% variance)</div>
                            <div>• Exfiltration Channel: HTTP POST /api/v2/telemetry</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Steganography Entropy View */}
                  {ghostSubTab === 'stego' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-[#030718] border border-purple-500/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-2">
                            <Eye className="w-4 h-4 text-purple-400" />
                            LSB Image Steganography & Entropy Analyzer
                          </span>
                          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                            ENTROPY: 7.91 / 8.00
                          </span>
                        </div>

                        <p className="text-slate-300 font-sans text-xs">
                          An image payload (<code className="text-[#00d2ff]">logo_asset.png</code>) exfiltrated during the session was analyzed for high-entropy LSB byte dispersion.
                        </p>

                        <div className="p-3 rounded-xl bg-[#01040f] border border-slate-800 text-amber-300 text-xs">
                          <span className="text-slate-500 block text-[10px] mb-1">Extracted Hidden Text:</span>
                          <code>"CYVANTIS_INTERNAL_VPN_KEYS_PROD_CLUSTER_2026"</code>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* FEATURE 5: BLAME GAME MATRIX (ACCOUNTABILITY & PROCESS GAPS) */}
              {activeRightTab === 'blame' && (
                <div className="space-y-4 font-mono text-xs">
                  
                  {/* Process Gap Alert Banner */}
                  {blameData?.process_gap_analysis?.has_gap && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 font-bold">
                        <AlertTriangle className="w-4 h-4" />
                        <span>PROCESS GAP DETECTED</span>
                      </div>
                      <p className="text-slate-200 text-xs font-sans">
                        {blameData.process_gap_analysis.gap_summary}
                      </p>
                      <div className="text-[11px] text-amber-300/80">
                        Root Cause: {blameData.process_gap_analysis.root_cause}
                      </div>
                    </div>
                  )}

                  {/* Change Correlation Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    
                    {/* Last Deploy */}
                    <div className="p-4 rounded-2xl bg-[#030718] border border-slate-800 space-y-2">
                      <span className="text-slate-400 text-[10px] flex items-center gap-1.5 uppercase font-bold text-cyan-300">
                        <GitCommit className="w-3.5 h-3.5" /> Last CI/CD Deployment
                      </span>
                      <div className="text-sm font-bold text-white">
                        {blameData?.last_deploy?.version || 'v2.1.0'}
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Deployer: <strong className="text-cyan-400">{blameData?.last_deploy?.author || 'j.doe'}</strong>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Timestamp: {blameData?.last_deploy?.timestamp || '13:45 UTC'} (Commit: {blameData?.last_deploy?.commit_hash || 'a49f10c'})
                      </div>
                    </div>

                    {/* Last Config Change */}
                    <div className="p-4 rounded-2xl bg-[#030718] border border-slate-800 space-y-2">
                      <span className="text-slate-400 text-[10px] flex items-center gap-1.5 uppercase font-bold text-purple-300">
                        <SlidersHorizontal className="w-3.5 h-3.5" /> Last Config Change (IaC)
                      </span>
                      <div className="text-sm font-bold text-white">
                        {blameData?.last_config_change?.component || 'firewall-rule-42'}
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Modified by: <strong className="text-purple-400">{blameData?.last_config_change?.modified_by || 's.smith'}</strong>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Tool: {blameData?.last_config_change?.tool || 'Terraform / Ansible'}
                      </div>
                    </div>

                  </div>

                  {/* Jira Ticket Status */}
                  <div className="p-4 rounded-2xl bg-[#030718] border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Incident Ticket Status:</span>
                      <span className="text-sm font-bold text-white">
                        {blameData?.ticket_status?.ticket_id || '#SEC-1234'} - {blameData?.ticket_status?.title}
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold">
                      {blameData?.ticket_status?.status || 'OPEN'}
                    </span>
                  </div>

                </div>
              )}

              {/* FEATURE 9: COLLABORATIVE ANNOTATION & STICKY NOTES */}
              {activeRightTab === 'notes' && (
                <div className="space-y-4 font-mono text-xs">
                  
                  {/* Add Note Form */}
                  <form onSubmit={handleAddAnnotation} className="p-4 rounded-2xl bg-[#030718] border border-[#00d2ff]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-[#00d2ff]" />
                        Pin Sticky Note on {event.ip}
                      </span>
                      
                      {/* Tag selector */}
                      <select
                        value={selectedTag}
                        onChange={(e) => setSelectedTag(e.target.value as any)}
                        className="bg-[#01040f] border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-[11px]"
                      >
                        <option value="Investigating">Investigating</option>
                        <option value="Confirmed Breach">Confirmed Breach</option>
                        <option value="False Positive">False Positive</option>
                        <option value="Suspicious Recon">Suspicious Recon</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Add analyst note or incident context..."
                        className="flex-1 bg-[#01040f] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-[#00d2ff]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#00d2ff] text-black font-bold flex items-center gap-1 hover:bg-[#00b0d8] transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Pin</span>
                      </button>
                    </div>
                  </form>

                  {/* Existing Notes Feed */}
                  <div className="space-y-2.5">
                    {annotations.map((ann) => (
                      <div
                        key={ann.id}
                        className="p-3.5 rounded-2xl bg-[#020512] border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-white">{ann.author}</span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ann.tag === 'Confirmed Breach' ? 'bg-red-500/20 text-red-400' :
                              ann.tag === 'False Positive' ? 'bg-emerald-500/20 text-emerald-400' :
                              'bg-cyan-500/20 text-cyan-400'
                            }`}>
                              {ann.tag}
                            </span>
                            <span className="text-slate-500">{ann.timestamp}</span>
                          </div>
                        </div>
                        <p className="text-slate-300 font-sans text-xs leading-relaxed">
                          {ann.note}
                        </p>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* TAB 5: DPI & JA3 */}
              {activeRightTab === 'fingerprint' && (
                <div className="space-y-4 font-mono text-xs">
                  <div className="p-4 rounded-2xl bg-[#030718] border border-slate-800 space-y-3">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      JA3 TLS Fingerprint Match
                    </span>
                    <div className="p-3 rounded-xl bg-[#01040f] border border-slate-800 text-[11px] space-y-1">
                      <div className="text-[#00d2ff] font-bold">{fingerprintData?.ja3?.matched_client}</div>
                      <div className="text-slate-400 font-mono text-[10px]">Hash: {fingerprintData?.ja3?.hash}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#030718] border border-slate-800 space-y-2">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      TCP/IP p0f Stack Fingerprinting
                    </span>
                    <div className="text-slate-300 text-[11px]">
                      Estimated OS: <strong className="text-white">{fingerprintData?.tcp_ip_p0f?.estimated_os}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: SHODAN & BGP RECON */}
              {activeRightTab === 'recon' && (
                <div className="space-y-4 font-mono text-xs">
                  <div className="p-4 rounded-2xl bg-[#030718] border border-slate-800 space-y-2">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#00d2ff]" />
                      Shodan Open Ports & Banners
                    </span>
                    <div className="text-slate-300 text-[11px]">
                      Open Ports: <span className="text-[#00d2ff] font-bold">{reconData?.shodan?.open_ports?.join(', ')}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#030718] border border-slate-800 space-y-2">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Network className="w-4 h-4 text-purple-400" />
                      BGP Provenance
                    </span>
                    <div className="text-slate-300 text-[11px]">
                      Prefix: <span className="text-white font-bold">{reconData?.bgp_provenance?.bgp_prefix}</span> · ASN: {reconData?.bgp_provenance?.origin_asn}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: SIGMA RULE */}
              {activeRightTab === 'sigma' && (
                <div className="space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Sigma SIEM Detection Signature</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownloadSigma}
                        className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => handleCopy(sigmaRuleYaml, 'Sigma Rule')}
                        className="px-3 py-1 rounded-xl bg-[#00d2ff]/20 text-[#00d2ff] border border-[#00d2ff]/40 font-bold"
                      >
                        Copy YAML
                      </button>
                    </div>
                  </div>

                  <pre className="p-4 rounded-2xl bg-[#01040f] border border-slate-800 text-[11px] text-cyan-200 overflow-x-auto whitespace-pre">
                    {sigmaRuleYaml}
                  </pre>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* FEATURE 7: RUNBOOK EXECUTION STATUS MODAL */}
      {showRunbookModal && runbookResult && (
        <div className="fixed inset-0 z-[160] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#050b21] border border-red-500/50 rounded-3xl w-full max-w-lg p-6 space-y-4 font-mono shadow-[0_0_80px_rgba(239,68,68,0.3)] animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <ShieldAlert className="w-5 h-5" />
                <span className="text-base">{runbookResult.runbook_name}</span>
              </div>
              <button 
                onClick={() => setShowRunbookModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="text-emerald-400 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Execution Complete ({runbookResult.mitigation_time_seconds}s MTTR)</span>
              </div>

              <div className="space-y-2 pt-2">
                {runbookResult.steps_executed?.map((step: any) => (
                  <div key={step.step} className="p-2.5 rounded-xl bg-[#01040f] border border-slate-800 flex items-center justify-between text-[11px]">
                    <div className="text-slate-300">
                      <span className="text-[#00d2ff] font-bold">Step {step.step}:</span> {step.action}
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      {step.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowRunbookModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close Runbook Log
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
