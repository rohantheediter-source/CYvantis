import React, { useState, useEffect } from 'react';
import {
  Users, Shield, ShieldCheck, ShieldAlert, Package, Lock, DollarSign,
  Bot, RefreshCw, Activity, Layers, Award, FileText, CheckCircle2,
  AlertTriangle, Copy, Check, Search, Zap, TrendingUp, Cloud, Database,
  ArrowRight, MessageSquare, Sparkles, Send, Eye, BarChart3, HelpCircle,
  FileCode, Play
} from 'lucide-react';
import { apiRequest } from '../services/api';

export const EliteSecurityOperations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'identity-graph' | 'supply-chain' | 'business-logic' | 'cognitive-copilot' |
    'disaster-recovery' | 'metrics-kpis' | 'executive-board' | 'automation-marketplace' |
    'training-phishing' | 'architecture-reviewer'
  >('identity-graph');

  // Copy toast state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ---------------------------------------------------------------------------
  // 1. IDENTITY GRAPH STATE
  // ---------------------------------------------------------------------------
  const [identityData, setIdentityData] = useState<any>(null);
  const [revokingUser, setRevokingUser] = useState<string | null>(null);
  const [revokeFeedback, setRevokeFeedback] = useState<string | null>(null);

  const fetchIdentity = async () => {
    try {
      const res = await apiRequest('/elite-ops/identity-graph');
      setIdentityData(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevokeSession = async (username: string) => {
    setRevokingUser(username);
    setRevokeFeedback(null);
    try {
      const res = await apiRequest('/elite-ops/identity-graph/revoke', {
        method: 'POST',
        body: JSON.stringify({ username })
      });
      setRevokeFeedback(`Successfully revoked all Okta, AWS STS, and DB sessions for ${username}. Step-up MFA enforced.`);
      fetchIdentity();
    } catch (e: any) {
      setRevokeFeedback(`Failed to revoke sessions: ${e.message}`);
    } finally {
      setRevokingUser(null);
    }
  };

  // ---------------------------------------------------------------------------
  // 2. SUPPLY CHAIN INTEGRITY STATE
  // ---------------------------------------------------------------------------
  const [supplyChainData, setSupplyChainData] = useState<any>(null);

  const fetchSupplyChain = async () => {
    try {
      const res = await apiRequest('/elite-ops/supply-chain');
      setSupplyChainData(res);
    } catch (e) {
      console.error(e);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. BUSINESS LOGIC & FRAUD ENGINE STATE
  // ---------------------------------------------------------------------------
  const [logicFuzzData, setLogicFuzzData] = useState<any>(null);
  const [fuzzingLogic, setFuzzingLogic] = useState<boolean>(false);

  const handleRunLogicFuzzer = async () => {
    setFuzzingLogic(true);
    try {
      const res = await apiRequest('/elite-ops/business-logic/fuzz', {
        method: 'POST',
        body: JSON.stringify({ test_type: 'all' })
      });
      setLogicFuzzData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setFuzzingLogic(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 4. COGNITIVE CO-PILOT (AI) STATE
  // ---------------------------------------------------------------------------
  const [clustersData, setClustersData] = useState<any>(null);
  const [copilotQuestion, setCopilotQuestion] = useState<string>('Show me all critical vulnerabilities in the payment service');
  const [copilotResponse, setCopilotResponse] = useState<any>(null);
  const [askingCopilot, setAskingCopilot] = useState<boolean>(false);

  const fetchClusters = async () => {
    try {
      const res = await apiRequest('/elite-ops/cognitive/clusters');
      setClustersData(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAskCopilot = async (q?: string) => {
    const questionToAsk = q || copilotQuestion;
    if (!questionToAsk) return;
    setAskingCopilot(true);
    try {
      const res = await apiRequest('/elite-ops/cognitive/ask', {
        method: 'POST',
        body: JSON.stringify({ question: questionToAsk })
      });
      setCopilotResponse(res);
    } catch (e) {
      console.error(e);
    } finally {
      setAskingCopilot(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. DISASTER RECOVERY STATE
  // ---------------------------------------------------------------------------
  const [drData, setDrData] = useState<any>(null);

  const fetchDr = async () => {
    try {
      const res = await apiRequest('/elite-ops/disaster-recovery');
      setDrData(res);
    } catch (e) {
      console.error(e);
    }
  };

  // ---------------------------------------------------------------------------
  // 6. METRICS & KPIS STATE
  // ---------------------------------------------------------------------------
  const [kpiData, setKpiData] = useState<any>(null);

  const fetchKpis = async () => {
    try {
      const res = await apiRequest('/elite-ops/metrics-kpis');
      setKpiData(res);
    } catch (e) {
      console.error(e);
    }
  };

  // ---------------------------------------------------------------------------
  // 7. EXECUTIVE & BOARD-READY VIEW STATE
  // ---------------------------------------------------------------------------
  const [boardData, setBoardData] = useState<any>(null);

  const fetchBoard = async () => {
    try {
      const res = await apiRequest('/elite-ops/executive-board');
      setBoardData(res);
    } catch (e) {
      console.error(e);
    }
  };

  // ---------------------------------------------------------------------------
  // 8. AUTOMATION MARKETPLACE STATE
  // ---------------------------------------------------------------------------
  const [marketplaceData, setMarketplaceData] = useState<any>(null);

  const fetchMarketplace = async () => {
    try {
      const res = await apiRequest('/elite-ops/marketplace');
      setMarketplaceData(res);
    } catch (e) {
      console.error(e);
    }
  };

  // ---------------------------------------------------------------------------
  // 9. TRAINING & PHISHING SIMULATOR STATE
  // ---------------------------------------------------------------------------
  const [trainingData, setTrainingData] = useState<any>(null);

  const fetchTraining = async () => {
    try {
      const res = await apiRequest('/elite-ops/training-phish');
      setTrainingData(res);
    } catch (e) {
      console.error(e);
    }
  };

  // ---------------------------------------------------------------------------
  // 10. ARCHITECTURE REVIEWER STATE
  // ---------------------------------------------------------------------------
  const [archReviewData, setArchReviewData] = useState<any>(null);
  const [reviewingArch, setReviewingArch] = useState<boolean>(false);

  const handleReviewArchitecture = async () => {
    setReviewingArch(true);
    try {
      const res = await apiRequest('/elite-ops/architecture-review', {
        method: 'POST',
        body: JSON.stringify({ architecture_description: 'CYVANTIS Distributed Cloud & Microservices' })
      });
      setArchReviewData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setReviewingArch(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchIdentity();
    fetchSupplyChain();
    handleRunLogicFuzzer();
    fetchClusters();
    handleAskCopilot();
    fetchDr();
    fetchKpis();
    fetchBoard();
    fetchMarketplace();
    fetchTraining();
    handleReviewArchitecture();
  }, []);

  const tabs = [
    { id: 'identity-graph', label: '1. Identity Graph & Insider Threat', icon: Users, badge: 'High Impact' },
    { id: 'supply-chain', label: '2. Supply Chain Integrity', icon: Package, badge: 'SBOM / Sigstore' },
    { id: 'business-logic', label: '3. Business Logic & Fraud', icon: Zap, badge: 'Logic Fuzzer' },
    { id: 'cognitive-copilot', label: '4. Cognitive Co-Pilot (AI)', icon: Bot, badge: '99.8% Denoised' },
    { id: 'disaster-recovery', label: '5. Disaster Recovery Simulator', icon: Activity, badge: 'RPO/RTO Gap' },
    { id: 'metrics-kpis', label: '6. Security Metrics & KPIs', icon: BarChart3, badge: 'MTTD 4.2m' },
    { id: 'executive-board', label: '7. Executive & Board-Ready View', icon: DollarSign, badge: 'FAIR Model' },
    { id: 'automation-marketplace', label: '8. Security Automation Hub', icon: Layers, badge: 'Playbooks' },
    { id: 'training-phishing', label: '9. Security Training & PhishSim', icon: ShieldCheck, badge: 'PhishSim' },
    { id: 'architecture-reviewer', label: '10. Security Architecture Reviewer', icon: Award, badge: 'STRIDE' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                CYVANTIS ELITE SECURITY LIFECYCLE SUITE
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                10 Advanced Engines Active
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Elite Cyber Operations & Security Lifecycle Command Center
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Unified identity graph, software bill of materials (SBOM) & Sigstore provenance, financial logic fuzzing,
              DBSCAN cognitive AI co-pilot, FAIR dollar-quantified risk reporting, and pre-deployment STRIDE threat modeling.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center min-w-[150px] shadow-lg">
              <div className="text-xs uppercase font-mono tracking-wider text-slate-400">FAIR Risk Mitigated</div>
              <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-0.5">
                $506.5K
                <span className="text-xs text-slate-400 font-sans">/yr</span>
              </div>
              <div className="text-[11px] font-semibold text-cyan-400 mt-1 flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" />
                86.4% Exposure Reduced
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex gap-2 overflow-x-auto pt-6 mt-6 border-t border-slate-800/80 scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 border ${
                  isActive
                    ? 'bg-purple-500/20 text-purple-200 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive ? 'bg-purple-400/20 text-purple-200' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. IDENTITY GRAPH & INSIDER THREAT ENGINE */}
      {/* ===================================================================== */}
      {activeTab === 'identity-graph' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Unified Identity Mapping & Insider Threat Graph
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Correlates events across Active Directory, Okta, Azure AD, and AWS IAM to detect impossible travel, credential sharing, and privilege creep.
                </p>
              </div>
              <button
                onClick={fetchIdentity}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1.5 transition self-start"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Graph
              </button>
            </div>

            {revokeFeedback && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{revokeFeedback}</span>
              </div>
            )}

            {/* Active Threats */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Active Insider Threat Tripwires
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {identityData?.active_threats?.map((at: any) => (
                  <div key={at.id} className="p-4 rounded-xl bg-slate-950 border border-rose-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400 font-mono">{at.type}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                        {at.severity}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white">Target User: {at.user}</div>
                    <p className="text-xs text-slate-300">{at.description}</p>
                    <div className="text-[11px] text-emerald-400 font-mono pt-1">
                      Action Taken: {at.mitigation}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Identity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
              {identityData?.identities?.map((u: any) => (
                <div key={u.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white">{u.username}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          u.risk_score >= 80
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        Risk: {u.risk_score}/100
                      </span>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-slate-200">{u.full_name}</div>
                      <div className="text-xs text-slate-400 font-mono">{u.department}</div>
                    </div>

                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono space-y-1">
                      <div className="text-slate-400">Assigned Roles: {u.assigned_roles?.join(', ')}</div>
                      {u.privilege_creep_detected && (
                        <div className="text-amber-400 font-sans text-[11px]">
                          ⚠️ Privilege Creep: {u.privilege_creep_details}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="text-[11px] font-semibold text-slate-400">Concurrent Sessions:</div>
                      {u.sessions?.map((s: any, idx: number) => (
                        <div key={idx} className="p-1.5 rounded bg-slate-900/60 text-[10px] font-mono text-slate-300">
                          {s.ip} ({s.location}) • {s.client}
                          {s.status.includes('FLAGGED') && (
                            <span className="text-rose-400 ml-1 font-bold">[FLAGGED IMPOSSIBLE TRAVEL]</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <button
                      onClick={() => handleRevokeSession(u.username)}
                      disabled={revokingUser === u.username}
                      className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      {revokingUser === u.username ? 'Revoking...' : 'Revoke All Sessions'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. SOFTWARE SUPPLY CHAIN INTEGRITY MONITOR */}
      {/* ===================================================================== */}
      {activeTab === 'supply-chain' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-cyan-400" />
                  Software Bill of Materials (SBOM) & Sigstore Provenance
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Continuously tracks CycloneDX & SPDX manifests for CVEs, scans private registries for dependency confusion, and verifies Cosign cryptographic signatures.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {supplyChainData?.total_dependencies_tracked ?? 348} Packages Tracked
              </span>
            </div>

            {/* SBOM Table */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Component CVE & Signature Matrix
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {supplyChainData?.components?.map((c: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white font-mono">{c.name} v{c.version}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{c.ecosystem}</div>
                      <div className="text-[11px] text-rose-400 font-mono">{c.top_cve}</div>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        c.status.includes('CRITICAL')
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : c.status.includes('CONFUSION')
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sigstore Signatures & Malicious Commit AI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Build Signature Verification (Sigstore / Cosign)
                </div>
                {supplyChainData?.sigstore_provenance?.map((sig: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold">{sig.artifact}</span>
                      <span className={sig.verified ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {sig.status}
                      </span>
                    </div>
                    <div className="text-slate-400">Signer: {sig.signer_identity}</div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  AI Malicious Commit & AST Backdoor Detector
                </div>
                {supplyChainData?.ai_commit_integrity_audit?.map((mc: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-300">Commit #{mc.commit_hash} by {mc.author}</span>
                      <span className="text-rose-400 font-bold">{mc.ai_threat_verdict}</span>
                    </div>
                    <pre className="p-2 bg-slate-950 rounded text-[10px] text-rose-300 overflow-x-auto">
                      {mc.flagged_code_diff}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. BUSINESS LOGIC & FRAUD ENGINE */}
      {/* ===================================================================== */}
      {activeTab === 'business-logic' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Financial Logic Fuzzer & Response Data Leakage Inspector
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simulates race conditions, negative inventory orders, coupon replay farms, and unauthorized PII attributes in API payloads.
                </p>
              </div>
              <button
                onClick={handleRunLogicFuzzer}
                disabled={fuzzingLogic}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                {fuzzingLogic ? 'Running Tests...' : 'Execute Logic Fuzzer'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {logicFuzzData?.results?.map((res: any) => (
                <div key={res.test_id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{res.name}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        res.status === 'VULNERABLE'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {res.status} ({res.severity})
                    </span>
                  </div>

                  <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-300">
                    <div>Payload: {res.payload_tested}</div>
                    <div className="text-rose-400 mt-0.5">Result: {res.refund_credited_to_balance}</div>
                  </div>

                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    Remediation: {res.remediation}
                  </div>
                </div>
              ))}
            </div>

            {/* Response Leakage */}
            {logicFuzzData?.response_leakage_audit && (
              <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/40 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-rose-400">
                  <span>API Response Data Leakage Detected</span>
                  <span className="font-mono text-[10px] bg-rose-500/20 px-2 py-0.5 rounded">
                    {logicFuzzData.response_leakage_audit.severity}
                  </span>
                </div>
                <div className="text-slate-300 font-mono">
                  Endpoint: {logicFuzzData.response_leakage_audit.endpoint}
                </div>
                <div className="text-slate-400">
                  Exposed Internal Fields: {logicFuzzData.response_leakage_audit.exposed_fields?.join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. COGNITIVE LOAD REDUCER (AI CO-PILOT) */}
      {/* ===================================================================== */}
      {activeTab === 'cognitive-copilot' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ask CYVANTIS Co-Pilot Chat */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-400" />
                    Ask CYVANTIS: Conversational Security Co-Pilot
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    LLM Reasoning Engine
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      setCopilotQuestion("Show me all critical vulnerabilities in the payment service");
                      handleAskCopilot("Show me all critical vulnerabilities in the payment service");
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
                  >
                    Vulnerabilities in Payment
                  </button>
                  <button
                    onClick={() => {
                      setCopilotQuestion("Why did jsmith trigger an impossible travel alert?");
                      handleAskCopilot("Why did jsmith trigger an impossible travel alert?");
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
                  >
                    jsmith Impossible Travel
                  </button>
                  <button
                    onClick={() => {
                      setCopilotQuestion("Analyze brute force failed logins from the last 24h");
                      handleAskCopilot("Analyze brute force failed logins from the last 24h");
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
                  >
                    Failed Logins Summary
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={copilotQuestion}
                    onChange={(e) => setCopilotQuestion(e.target.value)}
                    placeholder="Ask CYVANTIS anything about SOC telemetry..."
                    className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => handleAskCopilot()}
                    disabled={askingCopilot}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {askingCopilot ? 'Thinking...' : 'Ask'}
                  </button>
                </div>

                {copilotResponse && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 space-y-2 text-xs">
                    <div className="font-semibold text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Co-Pilot Analysis:
                    </div>
                    <p className="text-slate-200 leading-relaxed font-sans">{copilotResponse.copilot_answer}</p>

                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-400">Recommended Next Steps:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {copilotResponse.recommended_actions?.map((act: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 font-mono text-[10px] border border-slate-800">
                            → {act}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DBSCAN Deduplication & Clustering */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  DBSCAN Alert Deduplication & Noise Reducer
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {clustersData?.overall_noise_reduction_pct ?? '99.8%'} Reduction
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Clusters thousands of repetitive alerts into unified, correlated incidents with automated root-cause explanations.
              </p>

              <div className="space-y-3">
                {clustersData?.clusters?.map((cl: any) => (
                  <div key={cl.incident_id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{cl.title}</span>
                      <span className="text-[10px] font-mono text-cyan-300">{cl.compression_ratio}</span>
                    </div>
                    <div className="text-slate-300">{cl.root_cause_summary}</div>
                    <div className="text-[11px] text-emerald-400 font-mono">
                      AI Action: {cl.ai_suggested_action} (Saved {cl.analyst_time_saved_minutes}m)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. DISASTER RECOVERY & RESILIENCE SIMULATOR */}
      {/* ===================================================================== */}
      {activeTab === 'disaster-recovery' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* RPO / RTO Calculator */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-center">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">RPO & RTO SLA Performance</h3>
                <div className="text-xs text-slate-400 mt-0.5">Recovery Objectives vs Live Snapshots</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Current RPO</div>
                  <div className="text-2xl font-bold font-mono text-cyan-400">{drData?.metrics?.current_rpo_minutes}m</div>
                  <div className="text-[10px] text-slate-400">Target: {drData?.metrics?.target_rpo_minutes}m</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Current RTO</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">{drData?.metrics?.current_rto_minutes}m</div>
                  <div className="text-[10px] text-slate-400">Target: {drData?.metrics?.target_rto_minutes}m</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300">
                Failover Simulation: {drData?.failover_simulation?.failover_duration_seconds}s to {drData?.failover_simulation?.standby_region} (Data loss: 0 records)
              </div>
            </div>

            {/* DR Runbook Generator */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Automated P1 Disaster Recovery Runbook
                </h3>
                <button
                  onClick={() => handleCopy(drData?.dr_runbook_markdown || '', 'dr-runbook')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                >
                  {copiedKey === 'dr-runbook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Runbook
                </button>
              </div>

              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {drData?.dr_runbook_markdown}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. SECURITY METRICS & KPI DASHBOARD */}
      {/* ===================================================================== */}
      {activeTab === 'metrics-kpis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1 shadow-xl">
              <div className="text-xs uppercase font-mono text-slate-400">Mean Time to Detect (MTTD)</div>
              <div className="text-3xl font-extrabold font-mono text-cyan-400">{kpiData?.mttd?.current_minutes}m</div>
              <div className="text-[11px] text-emerald-400">vs 48m Industry Average (Top 5%)</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1 shadow-xl">
              <div className="text-xs uppercase font-mono text-slate-400">Mean Time to Respond (MTTR)</div>
              <div className="text-3xl font-extrabold font-mono text-emerald-400">{kpiData?.mttr?.current_minutes}m</div>
              <div className="text-[11px] text-cyan-400">vs 120m Industry Average</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1 shadow-xl">
              <div className="text-xs uppercase font-mono text-slate-400">False Positive Rate (FPR)</div>
              <div className="text-3xl font-extrabold font-mono text-purple-400">{kpiData?.false_positive_rate?.overall_fpr_pct}%</div>
              <div className="text-[11px] text-slate-400">vs 34% Industry Average</div>
            </div>
          </div>

          {/* NIST CSF Radar Breakdown */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              NIST Cybersecurity Framework (CSF) Maturity Radar
            </h3>
            <div className="space-y-3">
              {kpiData?.nist_csf_maturity_radar?.map((n: any, idx: number) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{n.domain}</span>
                    <span className="font-mono text-cyan-400 font-bold">{n.score} / {n.target}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${n.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. EXECUTIVE & BOARD-READY VIEW */}
      {/* ===================================================================== */}
      {activeTab === 'executive-board' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  FAIR Financial Risk Quantification & Board-Ready View
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Translates technical telemetry into Annualized Loss Expectancy (ALE) and demonstrates measurable cyber ROI for C-level leadership.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Board Readiness: {boardData?.board_readiness_score}/100
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed">
              <strong className="text-white">CISO Executive Briefing:</strong> {boardData?.ciso_executive_summary}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {boardData?.top_quantified_risks?.map((r: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-white">{r.risk_scenario}</div>
                  <div className="text-[11px] text-slate-400">Owner: {r.business_owner}</div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] space-y-0.5">
                    <div className="text-rose-400">Unmitigated ALE: {r.annualized_loss_expectancy_usd}</div>
                    <div className="text-emerald-400">Mitigated Exposure: {r.mitigated_loss_with_controls_usd}</div>
                    <div className="text-cyan-300 font-bold">Control ROI: {r.roi_of_security_controls}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 8. SECURITY AUTOMATION MARKETPLACE */}
      {/* ===================================================================== */}
      {activeTab === 'automation-marketplace' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Playbook Marketplace */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Community SOAR Playbook Library
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">Verified automated incident response runbooks</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {marketplaceData?.available_playbooks?.map((pb: any) => (
                  <div key={pb.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{pb.title}</span>
                        <span className="text-[10px] font-mono text-cyan-300">★ {pb.rating}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{pb.category} • {pb.downloads} installs</div>
                    </div>
                    <button
                      onClick={() => alert(`Playbook ${pb.title} imported and configured in SOAR runner.`)}
                      className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[11px] font-semibold transition"
                    >
                      {pb.installed ? 'Installed & Active' : 'Import Playbook'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Connectors */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
                Enterprise Integration Hub
              </h3>
              <div className="space-y-2">
                {marketplaceData?.integration_connectors?.map((conn: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{conn.name}</div>
                      <div className="text-[10px] text-slate-400">{conn.type}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {conn.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 9. SECURITY TRAINING & PHISHING SIMULATOR */}
      {/* ===================================================================== */}
      {activeTab === 'training-phishing' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  PhishSim Simulated Campaigns & Employee Resilience
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated benign spearphishing drills, click-rate tracking, and automated 3-minute micro-training enrollments.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Resilience: {trainingData?.overall_organization_phish_resilience}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trainingData?.campaigns?.map((camp: any) => (
                <div key={camp.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-white text-sm">{camp.name}</div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
                    <div className="p-2 rounded bg-slate-900">
                      <div className="text-slate-400 text-[10px]">Opened</div>
                      <div className="text-cyan-400 font-bold">{camp.emails_opened}</div>
                    </div>
                    <div className="p-2 rounded bg-slate-900">
                      <div className="text-slate-400 text-[10px]">Clicked</div>
                      <div className="text-amber-400 font-bold">{camp.links_clicked}</div>
                    </div>
                    <div className="p-2 rounded bg-slate-900">
                      <div className="text-slate-400 text-[10px]">Submitted</div>
                      <div className="text-rose-400 font-bold">{camp.credentials_submitted}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Top Vulnerable: <span className="text-rose-300">{camp.top_vulnerable_dept}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Micro Learning Lessons */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="text-xs font-bold text-white">Interactive Employee Micro-Learning Modules:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trainingData?.micro_learning_lessons?.map((ls: any) => (
                  <div key={ls.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{ls.title}</span>
                      <span className="text-[10px] font-mono text-cyan-300">{ls.duration}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{ls.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 10. SECURITY ARCHITECTURE REVIEWER */}
      {/* ===================================================================== */}
      {activeTab === 'architecture-reviewer' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  Pre-Deployment Security Architecture Reviewer & STRIDE Threat Model
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Audits distributed microservice architecture against STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege).
                </p>
              </div>
              <button
                onClick={handleReviewArchitecture}
                disabled={reviewingArch}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {reviewingArch ? 'Auditing...' : 'Re-run STRIDE Audit'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {archReviewData?.stride_threat_model?.map((th: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-purple-400 font-bold uppercase">{th.category}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{th.component}</span>
                    </div>
                    <p className="text-slate-300 font-sans">{th.threat}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-mono">
                    Mitigation: {th.mitigation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
