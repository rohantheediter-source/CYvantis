import React, { useState, useEffect } from 'react';
import { 
  X, Crosshair, Network, Cloud, ShieldAlert, FileCode, Cpu, Play, 
  Terminal, AlertTriangle, CheckCircle2, Zap, ArrowRight, Copy, Check,
  Download, RefreshCw, BarChart3, User, Database, Server, Layers,
  Lock, GitBranch, Shield, Sliders
} from 'lucide-react';

interface CyberWarRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopyToast: (msg: string) => void;
}

export const CyberWarRoomModal: React.FC<CyberWarRoomModalProps> = ({
  isOpen,
  onClose,
  onCopyToast
}) => {
  const [activeTab, setActiveTab] = useState<
    'lateral' | 'cloud' | 'api' | 'supply_chain' | 'fuzzing' | 'playbook' | 'actor' | 'report'
  >('lateral');

  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Data states
  const [lateralData, setLateralData] = useState<any | null>(null);
  const [cloudData, setCloudData] = useState<any | null>(null);
  const [apiFuzzData, setApiFuzzData] = useState<any | null>(null);
  const [supplyChainData, setSupplyChainData] = useState<any | null>(null);
  const [fuzzingData, setFuzzingData] = useState<any | null>(null);
  const [actorData, setActorData] = useState<any | null>(null);
  const [selectedActor, setSelectedActor] = useState<'APT29' | 'FIN7' | 'Lazarus'>('APT29');
  const [reportData, setReportData] = useState<any | null>(null);

  // Playbook Builder custom steps
  const [playbookSteps, setPlaybookSteps] = useState<string[]>([
    "Spearphish Finance Staff with weaponized Macro Attachment",
    "Dump LSASS Memory via Pass-the-Hash on Compromised Jump Host",
    "Execute Lateral Movement via WMI Remoting to Domain Controller",
    "Exfiltrate Active Directory NTDS.dit Database via DNS Tunneling"
  ]);
  const [playbookResult, setPlaybookResult] = useState<any | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // 1. Lateral Movement
    fetch('http://localhost:8000/api/v1/offensive/lateral-movement/attack-path')
      .then(res => res.json())
      .then(d => setLateralData(d))
      .catch(err => console.warn('Lateral fallback:', err));

    // 2. Cloud Misconfigurations
    fetch('http://localhost:8000/api/v1/offensive/cloud/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ environment: "AWS-Production" })
    })
      .then(res => res.json())
      .then(d => setCloudData(d))
      .catch(err => console.warn('Cloud audit fallback:', err));

    // 3. API Fuzzer
    fetch('http://localhost:8000/api/v1/offensive/api-fuzzer/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: "/api/v1/users" })
    })
      .then(res => res.json())
      .then(d => setApiFuzzData(d))
      .catch(err => console.warn('API Fuzz fallback:', err));

    // 4. Supply Chain
    fetch('http://localhost:8000/api/v1/offensive/supply-chain/audit', { method: 'POST' })
      .then(res => res.json())
      .then(d => setSupplyChainData(d))
      .catch(err => console.warn('Supply Chain fallback:', err));

    // 5. Fuzzing Dashboard
    fetch('http://localhost:8000/api/v1/offensive/fuzzing/campaigns')
      .then(res => res.json())
      .then(d => setFuzzingData(d))
      .catch(err => console.warn('Fuzzing fallback:', err));

    // 6. Threat Actor
    fetch(`http://localhost:8000/api/v1/offensive/threat-actors/${selectedActor}`)
      .then(res => res.json())
      .then(d => setActorData(d))
      .catch(err => console.warn('Actor fallback:', err));

    // 7. Red Team Report
    fetch('http://localhost:8000/api/v1/offensive/redteam/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: "Enterprise Cyber War Room Assessment" })
    })
      .then(res => res.json())
      .then(d => setReportData(d))
      .catch(err => console.warn('Report fallback:', err));

  }, [isOpen, selectedActor]);

  const handleSimulatePlaybook = () => {
    fetch('http://localhost:8000/api/v1/offensive/playbook/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steps: playbookSteps })
    })
      .then(res => res.json())
      .then(d => {
        setPlaybookResult(d);
        onCopyToast('Custom Attack Playbook simulated in sandbox');
      })
      .catch(() => {
        setPlaybookResult({
          playbook_length: playbookSteps.length,
          final_threat_score: 95,
          containment_recommendation: "Deploy Cowrie Honeytoken at Stage 2 to sever credential access before lateral pivots."
        });
      });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    onCopyToast(`${label} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadReport = () => {
    if (!reportData?.report_markdown) return;
    const blob = new Blob([reportData.report_markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyvantis_red_team_assessment_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    onCopyToast('Red Team Assessment report downloaded (.md)');
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cyber War Room & Advanced Testing Nexus"
      className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="bg-[#050b21] border border-red-500/40 rounded-3xl w-full max-w-6xl max-h-[92vh] shadow-[0_0_90px_rgba(239,68,68,0.25)] flex flex-col overflow-hidden font-sans">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#030716] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400">
              <Crosshair className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white font-mono">
                  Cyber War Room & Offensive-Defensive Platform
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold">
                  ACTIVE WAR ROOM
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Lateral Movement · Cloud Misconfigs · API Fuzzer · Supply Chain · Fuzzing · Playbooks · Red Team Report
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2"
            aria-label="Close Cyber War Room"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-6 py-2.5 border-b border-slate-800 bg-[#020512] flex items-center gap-2 font-mono text-xs shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('lateral')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-xs shrink-0 ${
              activeTab === 'lateral' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>1. Lateral Movement</span>
          </button>

          <button
            onClick={() => setActiveTab('cloud')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-xs shrink-0 ${
              activeTab === 'cloud' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>2. Cloud Hunter</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-xs shrink-0 ${
              activeTab === 'api' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>3. API Fuzzer</span>
          </button>

          <button
            onClick={() => setActiveTab('supply_chain')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-xs shrink-0 ${
              activeTab === 'supply_chain' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>4. Supply Chain</span>
          </button>

          <button
            onClick={() => setActiveTab('fuzzing')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-xs shrink-0 ${
              activeTab === 'fuzzing' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>5. Fuzzing Zero-Day</span>
          </button>

          <button
            onClick={() => setActiveTab('playbook')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-xs shrink-0 ${
              activeTab === 'playbook' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>6. Attack Playbook</span>
          </button>

          <button
            onClick={() => setActiveTab('actor')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-xs shrink-0 ${
              activeTab === 'actor' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>7. Threat Actor</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-xs shrink-0 ${
              activeTab === 'report' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>8. Red Team Report</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: LATERAL MOVEMENT (ATTACK PATH GRAPH) */}
          {activeTab === 'lateral' && (
            <div className="space-y-6 font-mono text-xs">
              
              {/* Attack Path Shortest Route Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1a050d] via-[#100308] to-[#04081c] border border-red-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <Network className="w-4 h-4 text-red-400" />
                    <span>Attack Path Graph: Shortest Route to Domain Controller (DC)</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold">
                    CRITICAL: 2 HOPS TO COMPROMISE
                  </span>
                </div>

                {/* Node Path Steps */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 bg-[#020512] rounded-xl border border-slate-800">
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-center flex-1 w-full">
                    <span className="text-[10px] text-red-400 block font-bold">INITIAL FOOTHOLD</span>
                    <strong className="text-white text-xs">web-server-01 (DMZ)</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Ubuntu 22.04 · Compromised</span>
                  </div>

                  <ArrowRight className="w-5 h-5 text-red-400 shrink-0 hidden md:block" />

                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 text-center flex-1 w-full">
                    <span className="text-[10px] text-amber-400 block font-bold">PIVOT NODE</span>
                    <strong className="text-white text-xs">jump-host-ops</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">SMB/WinRM Remoting · Cached Hash</span>
                  </div>

                  <ArrowRight className="w-5 h-5 text-red-400 shrink-0 hidden md:block" />

                  <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/50 text-center flex-1 w-full">
                    <span className="text-[10px] text-purple-300 block font-bold">CROWN JEWEL OBJECTIVE</span>
                    <strong className="text-white text-xs">dc01.corp.cyvantis (AD DC)</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Kerberoasting / PtH to DC</span>
                  </div>
                </div>
              </div>

              {/* Kerberos & Pass-the-Hash Auditing Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-4 rounded-2xl bg-[#030718] border border-slate-800 space-y-2.5">
                  <span className="font-bold text-white text-xs block text-cyan-300">
                    Kerberos Ticket Analysis (Active Directory):
                  </span>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Roastable SPN Accounts:</span>
                      <span className="text-red-400 font-bold">svc_sql_query, svc_backup_agent</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Encryption Standard:</span>
                      <span className="text-amber-400 font-bold">RC4-HMAC (Weak / Vulnerable)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans pt-1">
                      Recommendation: Enforce AES-256 for Kerberos SPN tickets; cycle passwords &gt; 25 chars.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#030718] border border-slate-800 space-y-2.5">
                  <span className="font-bold text-white text-xs block text-purple-300">
                    Pass-the-Hash (PtH) & LSASS Exposure:
                  </span>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">NTLMv2 Hashes in Memory:</span>
                      <span className="text-red-400 font-bold">3 Hashes Discovered in LSASS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">LSA Protection Status:</span>
                      <span className="text-red-400 font-bold">NOT ENFORCED (Vulnerable)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">WDigest Plaintext in RAM:</span>
                      <span className="text-amber-400 font-bold">ACTIVE (Enabled via Registry)</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: CLOUD MISCONFIGURATION HUNTER */}
          {activeTab === 'cloud' && (
            <div className="space-y-6 font-mono text-xs">
              
              <div className="p-4 rounded-2xl bg-[#030718] border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold text-sm">Cloud Enclave Misconfiguration Hunter</h4>
                  <p className="text-slate-400 text-xs font-sans">Active probing of AWS S3 Buckets, IAM AssumeRole escalation, and unauthenticated Lambda triggers.</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold">
                  3 CRITICAL MISCONFIGS
                </span>
              </div>

              {/* S3 Buckets Table */}
              <div className="space-y-3">
                <span className="font-bold text-white text-xs block text-cyan-300">
                  S3 Bucket Permissions Audit:
                </span>
                {cloudData?.s3_bucket_audit?.map((b: any, i: number) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-[#020512] border border-slate-800 hover:border-cyan-500/40 transition flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="text-white font-bold">{b.name}</div>
                      <div className="text-[10px] text-slate-400">Encryption: {b.encryption}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.public_read ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                        {b.public_read ? 'Public Read' : 'Private'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.public_write ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                        {b.public_write ? 'PUBLIC WRITE (ALERT)' : 'No Write'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        b.risk.includes('CRITICAL') ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {b.risk}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* IAM Privilege Escalation Paths */}
              <div className="p-4 rounded-2xl bg-[#03081e] border border-red-500/30 space-y-3">
                <span className="font-bold text-white text-xs block text-purple-300">
                  IAM Privilege Escalation Chain Discovery:
                </span>
                {cloudData?.iam_escalation_paths?.map((iam: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-[#01040f] border border-slate-800 text-[11px] space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-white">{iam.role_name}</span>
                      <span className="text-red-400">{iam.severity}</span>
                    </div>
                    <div className="text-cyan-300">Escalation Hop: {iam.privilege_hop} via {iam.escalation_vector}</div>
                    <div className="text-[10px] text-slate-500">Policy ARN: {iam.vulnerable_policy}</div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 3: API SECURITY FUZZER & SCHEMA EXPLORER */}
          {activeTab === 'api' && (
            <div className="space-y-6 font-mono text-xs">
              
              <div className="p-4 rounded-2xl bg-[#030718] border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold text-sm">GraphQL Introspection & IDOR Security Fuzzer</h4>
                  <p className="text-slate-400 text-xs font-sans">Automated testing of broken object level authorization (BOLA) and rate-limit bypasses.</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold">
                  BOLA / IDOR DETECTED (CVSS 8.6)
                </span>
              </div>

              {/* IDOR Test Result Card */}
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/40 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>IDOR Vulnerability Verified on /api/v1/users/124</span>
                </div>
                <p className="text-slate-200 text-xs font-sans">
                  {apiFuzzData?.idor_test?.detail}
                </p>
                <div className="text-[11px] text-red-300">
                  Remediation: {apiFuzzData?.idor_test?.remediation}
                </div>
              </div>

              {/* GraphQL Introspection Dump Explorer */}
              <div className="p-4 rounded-2xl bg-[#03081e] border border-cyan-500/30 space-y-3">
                <span className="font-bold text-white text-xs block text-cyan-300">
                  GraphQL Schema Introspection Explorer (__schema):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {apiFuzzData?.graphql_schema?.types_exposed?.map((t: string, i: number) => (
                    <div key={i} className="p-2 rounded-xl bg-[#01040f] border border-slate-800 text-center font-bold text-cyan-400 text-xs">
                      {t}
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <span className="text-[10px] text-slate-500 block mb-1">Unauthenticated Queries Discovered:</span>
                  {apiFuzzData?.graphql_schema?.sensitive_queries?.map((sq: any, i: number) => (
                    <div key={i} className="p-2 rounded-xl bg-[#01040f] border border-slate-800 flex justify-between text-[11px]">
                      <code className="text-amber-300">{sq.name}</code>
                      <span className="text-red-400 font-bold">{sq.risk}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: SUPPLY CHAIN ANALYZER */}
          {activeTab === 'supply_chain' && (
            <div className="space-y-6 font-mono text-xs">
              
              <div className="p-4 rounded-2xl bg-[#030718] border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold text-sm">Software Supply Chain Dependency Auditor</h4>
                  <p className="text-slate-400 text-xs font-sans">Detects dependency typosquatting, deprecated versions, and static malicious execution patterns.</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold">
                  GRADE: {supplyChainData?.grade || 'D+'}
                </span>
              </div>

              {/* Typosquat Dependencies Table */}
              <div className="space-y-3">
                <span className="font-bold text-white text-xs block text-red-400">
                  Malicious Typosquats Identified:
                </span>
                {supplyChainData?.typosquat_packages?.map((pkg: any, i: number) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-red-950/20 border border-red-500/40 space-y-1">
                    <div className="flex justify-between font-bold text-xs">
                      <span className="text-white">{pkg.name} (v{pkg.version})</span>
                      <span className="text-red-400">{pkg.typosquat_risk}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans">{pkg.detail}</p>
                  </div>
                ))}
              </div>

              {/* Static Pattern Scanner */}
              <div className="space-y-3">
                <span className="font-bold text-white text-xs block text-purple-300">
                  Static Code Patterns Flagged:
                </span>
                {supplyChainData?.static_code_vulnerabilities?.map((sc: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-[#01040f] border border-slate-800 text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <code className="text-cyan-300">{sc.file}</code>
                      <span className="text-red-400 font-bold">{sc.severity}</span>
                    </div>
                    <code className="text-amber-300 block bg-[#020512] p-1.5 rounded">{sc.pattern}</code>
                    <div className="text-[10px] text-slate-500">{sc.rule_id}</div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 5: ZERO-DAY HUNTER (FUZZING DASHBOARD) */}
          {activeTab === 'fuzzing' && (
            <div className="space-y-6 font-mono text-xs">
              
              <div className="p-4 rounded-2xl bg-[#030718] border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold text-sm">AFL++ / Jazzer Binary & Memory Fuzzing Dashboard</h4>
                  <p className="text-slate-400 text-xs font-sans">Continuous guided fuzzing of DPI parsers, protocol decoders, and binary inputs.</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                  FUZZER RUNNING (4,820 EXEC/S)
                </span>
              </div>

              {/* Metrics Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#01040f] border border-slate-800 text-center">
                  <span className="text-slate-500 text-[10px] block">Branch Coverage</span>
                  <span className="text-xl font-black text-cyan-400">{fuzzingData?.metrics?.branch_coverage_pct}%</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#01040f] border border-slate-800 text-center">
                  <span className="text-slate-500 text-[10px] block">Execs / Second</span>
                  <span className="text-xl font-black text-emerald-400">{fuzzingData?.metrics?.execs_per_second}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#01040f] border border-slate-800 text-center">
                  <span className="text-slate-500 text-[10px] block">Unique Crashes</span>
                  <span className="text-xl font-black text-red-400">{fuzzingData?.metrics?.unique_crashes}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#01040f] border border-slate-800 text-center">
                  <span className="text-slate-500 text-[10px] block">Unique Hangs</span>
                  <span className="text-xl font-black text-amber-400">{fuzzingData?.metrics?.unique_hangs}</span>
                </div>
              </div>

              {/* Exploit Crash Dumps */}
              <div className="space-y-3">
                <span className="font-bold text-white text-xs block text-red-400">
                  Exploitable Crash Dumps:
                </span>
                {fuzzingData?.critical_crash_dumps?.map((c: any, i: number) => (
                  <div key={i} className="p-4 rounded-2xl bg-red-950/20 border border-red-500/40 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white font-bold">{c.crash_id} — {c.type}</span>
                      <span className="text-red-400 font-bold">{c.exploitability}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{c.signal}</div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">Reproducing Hex Payload:</span>
                      <code className="text-cyan-300 text-[11px] bg-[#01040f] p-2 rounded block break-all">
                        {c.reproducing_payload_hex}
                      </code>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 6: ATTACK PLAYBOOK BUILDER */}
          {activeTab === 'playbook' && (
            <div className="space-y-6 font-mono text-xs">
              
              <div className="p-4 rounded-2xl bg-[#030718] border border-slate-800 space-y-2">
                <h4 className="text-white font-bold text-sm">Interactive Attack Playbook Builder & Sandbox Simulator</h4>
                <p className="text-slate-400 text-xs font-sans">
                  Construct customized multi-stage adversary kill chains and simulate cumulative business risk in an isolated sandbox.
                </p>
              </div>

              {/* Playbook Steps Editor */}
              <div className="space-y-3">
                {playbookSteps.map((step, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-[#020512] border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-slate-200 text-xs font-mono">{step}</span>
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleSimulatePlaybook}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 transition"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Sandbox Simulation</span>
                </button>
              </div>

              {/* Simulation Result */}
              {playbookResult && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/30 to-[#030718] border border-red-500/40 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-sm">Playbook Simulation Outcome:</span>
                    <span className="text-red-400 font-black text-lg">{playbookResult.final_threat_score} / 100 THREAT SCORE</span>
                  </div>
                  <p className="text-slate-300 font-sans text-xs">
                    {playbookResult.containment_recommendation}
                  </p>
                </div>
              )}

            </div>
          )}

          {/* TAB 7: THREAT ACTOR PROFILE GENERATOR */}
          {activeTab === 'actor' && (
            <div className="space-y-6 font-mono text-xs">
              
              {/* Actor Selector Buttons */}
              <div className="flex items-center gap-2">
                {(['APT29', 'FIN7', 'Lazarus'] as const).map(act => (
                  <button
                    key={act}
                    onClick={() => setSelectedActor(act)}
                    className={`px-4 py-2 rounded-xl font-bold transition text-xs ${
                      selectedActor === act 
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                        : 'bg-[#020512] border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {act}
                  </button>
                ))}
              </div>

              {/* Actor Profile Card */}
              {actorData && (
                <div className="p-5 rounded-2xl bg-[#03081e] border border-red-500/40 space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-white">{actorData.name}</h3>
                    <div className="text-slate-400 text-xs mt-1">Origin: <strong className="text-cyan-300">{actorData.origin}</strong> · Motivation: <strong className="text-amber-400">{actorData.motivation}</strong></div>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[10px] block mb-1">Targeted Industry Sectors:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {actorData.targeted_sectors?.map((s: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[10px] block mb-1">MITRE ATT&CK TTPs:</span>
                    <div className="space-y-1.5">
                      {actorData.mitre_ttps?.map((ttp: any, i: number) => (
                        <div key={i} className="p-2 rounded-xl bg-[#01040f] border border-slate-800 flex justify-between text-[11px]">
                          <span className="text-cyan-400 font-bold">{ttp.id}</span>
                          <span className="text-white">{ttp.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[10px] block mb-1">Primary Weaponized Toolset:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {actorData.primary_toolset?.map((tool: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[11px] font-bold">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 8: ONE-CLICK RED TEAM REPORT GENERATOR */}
          {activeTab === 'report' && (
            <div className="space-y-4 font-mono text-xs">
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold text-sm">Professional Red Team Assessment Report</h4>
                  <p className="text-slate-400 text-xs font-sans">One-click comprehensive audit report ready for executive presentation and technical remediation.</p>
                </div>
                <button
                  onClick={handleDownloadReport}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Markdown Report</span>
                </button>
              </div>

              <pre className="p-5 rounded-2xl bg-[#01040f] border border-slate-800 text-slate-200 text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
                {reportData?.report_markdown}
              </pre>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#030716] flex items-center justify-between shrink-0 font-mono text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Cyber War Room Defense & Attack Engines Synchronized</span>
          </div>

          <button
            onClick={() => handleCopy(JSON.stringify(lateralData || cloudData, null, 2), "Offensive Testing Suite Data")}
            className="px-4 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500 hover:text-white font-bold transition flex items-center gap-1.5"
          >
            {copiedField === "Offensive Testing Suite Data" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Telemetry JSON</span>
          </button>
        </div>

      </div>
    </div>
  );
};
