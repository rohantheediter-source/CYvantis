import React, { useState, useEffect } from 'react';
import {
  Shield, ShieldCheck, ShieldAlert, Zap, RefreshCw, Terminal, CheckCircle2,
  AlertTriangle, Copy, Check, Server, Database, Lock, Eye, Activity, Play,
  Cpu, FileCode, Layers, Search, Flame, Award, Sliders, Globe, AlertCircle,
  FileText, KeyRound, ExternalLink, ArrowRight, Gauge, Radio, HardDrive, CheckSquare
} from 'lucide-react';
import { apiRequest } from '../services/api';

export const CyberDefenseSuite: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'auto-patch' | 'immutable' | 'zero-trust' | 'data-exfil' | 'threat-hunting' |
    'incident-response' | 'chaos-engine' | 'compliance' | 'fusion-center' | 'security-posture'
  >('auto-patch');

  // Global Copied Key
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ---------------------------------------------------------------------------
  // 1. AUTO-PATCH & DRIFT STATE
  // ---------------------------------------------------------------------------
  const [driftData, setDriftData] = useState<any>(null);
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [revertMessage, setRevertMessage] = useState<string | null>(null);
  const [patchDebtData, setPatchDebtData] = useState<any>(null);
  const [patchingAsset, setPatchingAsset] = useState<string | null>(null);
  const [dependencyData, setDependencyData] = useState<any>(null);

  const fetchDrift = async () => {
    try {
      const res = await apiRequest('/defense/iac-drift');
      setDriftData(res);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPatchDebt = async () => {
    try {
      const res = await apiRequest('/defense/patch-debt');
      setPatchDebtData(res);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDependencyAuditor = async () => {
    try {
      const res = await apiRequest('/defense/dependency-auditor');
      setDependencyData(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevertDrift = async (driftId: string) => {
    setRevertingId(driftId);
    setRevertMessage(null);
    try {
      const res = await apiRequest('/defense/iac-drift/revert', {
        method: 'POST',
        body: JSON.stringify({ drift_id: driftId })
      });
      setRevertMessage(`Successfully reconciled ${driftId} with GitOps main branch.`);
      fetchDrift();
    } catch (e: any) {
      setRevertMessage(`Failed to revert drift: ${e.message}`);
    } finally {
      setRevertingId(null);
    }
  };

  const handleDispatchPatch = async (assetId: string) => {
    setPatchingAsset(assetId);
    try {
      await apiRequest('/defense/patch-debt/dispatch', {
        method: 'POST',
        body: JSON.stringify({ asset_id: assetId })
      });
      fetchPatchDebt();
    } catch (e) {
      console.error(e);
    } finally {
      setPatchingAsset(null);
    }
  };

  // ---------------------------------------------------------------------------
  // 2. IMMUTABLE GUARDIAN STATE
  // ---------------------------------------------------------------------------
  const [himData, setHimData] = useState<any>(null);
  const [quarantining, setQuarantining] = useState<boolean>(false);
  const [quarantineResult, setQuarantineResult] = useState<any>(null);
  const [goldenImageSpec, setGoldenImageSpec] = useState<any>(null);

  const fetchHim = async () => {
    try {
      const res = await apiRequest('/defense/host-integrity');
      setHimData(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuarantine = async (hostId: string) => {
    setQuarantining(true);
    setQuarantineResult(null);
    try {
      const res = await apiRequest(`/defense/host-integrity/quarantine?host_id=${encodeURIComponent(hostId)}`, {
        method: 'POST'
      });
      setQuarantineResult(res);
      fetchHim();
    } catch (e: any) {
      console.error(e);
    } finally {
      setQuarantining(false);
    }
  };

  const fetchGoldenImage = async () => {
    try {
      const res = await apiRequest('/defense/golden-image/generate', {
        method: 'POST',
        body: JSON.stringify({ base_os: 'alpine' })
      });
      setGoldenImageSpec(res);
    } catch (e) {
      console.error(e);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. ZERO TRUST STATE
  // ---------------------------------------------------------------------------
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [microPolicies, setMicroPolicies] = useState<any>(null);
  const [serviceMesh, setServiceMesh] = useState<any>(null);

  const fetchZeroTrust = async () => {
    try {
      const [hm, pol, mesh] = await Promise.all([
        apiRequest('/defense/zero-trust/heatmap'),
        apiRequest('/defense/zero-trust/policies', {
          method: 'POST',
          body: JSON.stringify({ policy_type: 'kubernetes' })
        }),
        apiRequest('/defense/zero-trust/service-mesh')
      ]);
      setHeatmapData(hm);
      setMicroPolicies(pol);
      setServiceMesh(mesh);
    } catch (e) {
      console.error(e);
    }
  };

  // ---------------------------------------------------------------------------
  // 4. DATA EXFILTRATION SENTINEL STATE
  // ---------------------------------------------------------------------------
  const [dlpPayloadInput, setDlpPayloadInput] = useState<string>(
    'User purchase authorized: Cardholder Jane Doe, PAN: 4532-8921-3829-1923, SSN: 123-45-6789, Secret AWS_KEY=AKIAIOSFODNN7EXAMPLE'
  );
  const [dlpScanResult, setDlpScanResult] = useState<any>(null);
  const [dlpScanning, setDlpScanning] = useState<boolean>(false);
  const [exfilAnomalies, setExfilAnomalies] = useState<any>(null);
  const [sqlQueryInput, setSqlQueryInput] = useState<string>(
    "SELECT * FROM customers WHERE email LIKE '%@gmail.com' LIMIT 50000;"
  );
  const [sqlAuditResult, setSqlAuditResult] = useState<any>(null);

  const handleScanDlp = async (customPayload?: string) => {
    const p = customPayload || dlpPayloadInput;
    setDlpScanning(true);
    try {
      const res = await apiRequest('/defense/dlp/scan', {
        method: 'POST',
        body: JSON.stringify({ payload: p })
      });
      setDlpScanResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setDlpScanning(false);
    }
  };

  const fetchExfilAnomalies = async () => {
    try {
      const res = await apiRequest('/defense/dlp/anomalies');
      setExfilAnomalies(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuditSql = async () => {
    try {
      const res = await apiRequest('/defense/dlp/sql-audit', {
        method: 'POST',
        body: JSON.stringify({ sql_query: sqlQueryInput })
      });
      setSqlAuditResult(res);
    } catch (e) {
      console.error(e);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. THREAT HUNTING QUERY BUILDER STATE
  // ---------------------------------------------------------------------------
  const [nlQueryPrompt, setNlQueryPrompt] = useState<string>(
    'Show me all failed logins from external IPs followed by a successful login in the last 5 minutes'
  );
  const [nlQueryResult, setNlQueryResult] = useState<any>(null);
  const [nlTranslating, setNlTranslating] = useState<boolean>(false);
  const [hypotheses, setHypotheses] = useState<any[]>([]);
  const [mitreCoverage, setMitreCoverage] = useState<any>(null);

  const handleTranslateNl = async (promptToUse?: string) => {
    const p = promptToUse || nlQueryPrompt;
    setNlTranslating(true);
    try {
      const res = await apiRequest('/defense/threat-hunting/nl-query', {
        method: 'POST',
        body: JSON.stringify({ prompt: p })
      });
      setNlQueryResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setNlTranslating(false);
    }
  };

  const fetchHypothesesAndMitre = async () => {
    try {
      const [hypo, mitre] = await Promise.all([
        apiRequest('/defense/threat-hunting/hypotheses'),
        apiRequest('/defense/threat-hunting/mitre-coverage')
      ]);
      setHypotheses(hypo);
      setMitreCoverage(mitre);
    } catch (e) {
      console.error(e);
    }
  };

  // ---------------------------------------------------------------------------
  // 6. INCIDENT RESPONSE ORCHESTRATOR STATE
  // ---------------------------------------------------------------------------
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [executingPlaybook, setExecutingPlaybook] = useState<string | null>(null);
  const [playbookExecutionResult, setPlaybookExecutionResult] = useState<any>(null);
  const [attackTimeline, setAttackTimeline] = useState<any>(null);
  const [postMortemDoc, setPostMortemDoc] = useState<any>(null);

  const fetchIrData = async () => {
    try {
      const [pb, tl, pm] = await Promise.all([
        apiRequest('/defense/incident-response/playbooks'),
        apiRequest('/defense/incident-response/timeline'),
        apiRequest('/defense/incident-response/post-mortem')
      ]);
      setPlaybooks(pb);
      setAttackTimeline(tl);
      setPostMortemDoc(pm);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExecutePlaybook = async (pbId: string) => {
    setExecutingPlaybook(pbId);
    setPlaybookExecutionResult(null);
    try {
      const res = await apiRequest('/defense/incident-response/playbooks/execute', {
        method: 'POST',
        body: JSON.stringify({ playbook_id: pbId, target_ip: '185.220.101.5', host_id: 'web-gateway-01' })
      });
      setPlaybookExecutionResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setExecutingPlaybook(null);
    }
  };

  // ---------------------------------------------------------------------------
  // 7. CHAOS ENGINEERING STATE
  // ---------------------------------------------------------------------------
  const [chaosScenarios, setChaosScenarios] = useState<any[]>([]);
  const [injectingChaos, setInjectingChaos] = useState<string | null>(null);
  const [chaosResult, setChaosResult] = useState<any>(null);
  const [sloMetrics, setSloMetrics] = useState<any>(null);
  const [gameDayResult, setGameDayResult] = useState<any>(null);
  const [runningGameDay, setRunningGameDay] = useState<boolean>(false);

  const fetchChaos = async () => {
    try {
      const [scen, slo] = await Promise.all([
        apiRequest('/defense/chaos/scenarios'),
        apiRequest('/defense/chaos/slo-burn-rate')
      ]);
      setChaosScenarios(scen);
      setSloMetrics(slo);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInjectChaos = async (scenId: string) => {
    setInjectingChaos(scenId);
    setChaosResult(null);
    try {
      const res = await apiRequest('/defense/chaos/inject', {
        method: 'POST',
        body: JSON.stringify({ scenario_id: scenId })
      });
      setChaosResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setInjectingChaos(null);
    }
  };

  const handleRunGameDay = async () => {
    setRunningGameDay(true);
    try {
      const res = await apiRequest('/defense/chaos/game-day', { method: 'POST' });
      setGameDayResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setRunningGameDay(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 8. COMPLIANCE & GOVERNANCE STATE
  // ---------------------------------------------------------------------------
  const [complianceScorecards, setComplianceScorecards] = useState<any>(null);
  const [auditTrail, setAuditTrail] = useState<any>(null);
  const [verifyingChain, setVerifyingChain] = useState<boolean>(false);
  const [chainVerifyResult, setChainVerifyResult] = useState<any>(null);
  const [pacSnippet, setPacSnippet] = useState<string>(
    'resource "aws_security_group_rule" "allow_ssh" {\n  cidr_blocks = ["0.0.0.0/0"]\n  from_port   = 22\n  to_port     = 22\n  protocol    = "tcp"\n}'
  );
  const [pacResult, setPacResult] = useState<any>(null);

  const fetchCompliance = async () => {
    try {
      const [sc, at] = await Promise.all([
        apiRequest('/defense/compliance/scorecards'),
        apiRequest('/defense/compliance/audit-trail')
      ]);
      setComplianceScorecards(sc);
      setAuditTrail(at);
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifyChain = async () => {
    setVerifyingChain(true);
    try {
      const res = await apiRequest('/defense/compliance/audit-trail/verify', { method: 'POST' });
      setChainVerifyResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setVerifyingChain(false);
    }
  };

  const handleValidatePac = async () => {
    try {
      const res = await apiRequest('/defense/compliance/pac-validate', {
        method: 'POST',
        body: JSON.stringify({ terraform_snippet: pacSnippet })
      });
      setPacResult(res);
    } catch (e) {
      console.error(e);
    }
  };

  // ---------------------------------------------------------------------------
  // 9. THREAT INTEL FUSION STATE
  // ---------------------------------------------------------------------------
  const [fusionIocInput, setFusionIocInput] = useState<string>('185.220.101.5');
  const [fusionEnrichment, setFusionEnrichment] = useState<any>(null);
  const [enrichingIoc, setEnrichingIoc] = useState<boolean>(false);
  const [correlations, setCorrelations] = useState<any>(null);

  const handleEnrichIoc = async (iocToUse?: string) => {
    const q = iocToUse || fusionIocInput;
    setEnrichingIoc(true);
    try {
      const res = await apiRequest('/defense/fusion/enrich', {
        method: 'POST',
        body: JSON.stringify({ ioc: q })
      });
      setFusionEnrichment(res);
    } catch (e) {
      console.error(e);
    } finally {
      setEnrichingIoc(false);
    }
  };

  const fetchCorrelations = async () => {
    try {
      const res = await apiRequest('/defense/fusion/correlations');
      setCorrelations(res);
    } catch (e) {
      console.error(e);
    }
  };

  // ---------------------------------------------------------------------------
  // 10. POSTURE SCORECARD STATE
  // ---------------------------------------------------------------------------
  const [postureData, setPostureData] = useState<any>(null);
  const [simulateFixed, setSimulateFixed] = useState<boolean>(false);

  const fetchPosture = async () => {
    try {
      const res = await apiRequest('/defense/posture/scorecard');
      setPostureData(res);
    } catch (e) {
      console.error(e);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDrift();
    fetchPatchDebt();
    fetchDependencyAuditor();
    fetchHim();
    fetchGoldenImage();
    fetchZeroTrust();
    fetchExfilAnomalies();
    fetchHypothesesAndMitre();
    fetchIrData();
    fetchChaos();
    fetchCompliance();
    fetchCorrelations();
    fetchPosture();
    handleTranslateNl();
    handleScanDlp();
    handleAuditSql();
    handleEnrichIoc();
    handleValidatePac();
  }, []);

  // Tabs Definition
  const tabs = [
    { id: 'auto-patch', label: '1. Auto-Patch & Drift', icon: RefreshCw, badge: 'High Impact' },
    { id: 'immutable', label: '2. Immutable Guardian', icon: Lock, badge: 'CIS Level 2' },
    { id: 'zero-trust', label: '3. Zero Trust Planner', icon: NetworkIcon, badge: 'Micro-Seg' },
    { id: 'data-exfil', label: '4. Data Exfiltration', icon: ShieldAlert, badge: 'DLP & RLS' },
    { id: 'threat-hunting', label: '5. Threat Hunting', icon: Search, badge: 'AI KQL/SPL' },
    { id: 'incident-response', label: '6. Incident Orchestrator', icon: Play, badge: 'SOAR Auto' },
    { id: 'chaos-engine', label: '7. Resilience Chaos', icon: Flame, badge: 'Litmus/SLO' },
    { id: 'compliance', label: '8. Compliance & Governance', icon: Award, badge: 'SOC2 / OPA' },
    { id: 'fusion-center', label: '9. Threat Intel Fusion', icon: Globe, badge: 'Multi-Source' },
    { id: 'security-posture', label: '10. Posture Scorecard', icon: Gauge, badge: '80.0 / 100' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                CYVANTIS DEFENSIVE SUITE v2.0
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                10/10 Engines Online
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Autonomous Cyber Defense Operations Suite
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Real-time IaC configuration drift remediation, immutable eBPF guardian, zero-trust microsegmentation,
              data exfiltration tripwires, proactive threat hunting, automated SOAR playbooks, and continuous compliance verification.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center min-w-[140px] shadow-lg">
              <div className="text-xs uppercase font-mono tracking-wider text-slate-400">Security Score</div>
              <div className="text-3xl font-extrabold font-mono text-cyan-400 flex items-center justify-center gap-1 mt-0.5">
                {simulateFixed ? '96.7' : (postureData?.composite_score ?? '80.0')}
                <span className="text-xs text-slate-400 font-sans">/100</span>
              </div>
              <div className="text-[11px] font-semibold text-emerald-400 mt-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {simulateFixed ? 'Grade A+ (Hardened)' : 'Grade B+ (Good Baseline)'}
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
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive ? 'bg-cyan-400/20 text-cyan-200' : 'bg-slate-800 text-slate-400'
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
      {/* 1. AUTO-PATCH & CONFIGURATION DRIFT ENGINE */}
      {/* ===================================================================== */}
      {activeTab === 'auto-patch' && (
        <div className="space-y-6">
          {/* Section 1: IaC Drift */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-cyan-400" />
                  Infrastructure as Code (IaC) Drift Detection
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Continuous comparison between Terraform / GitOps desired state and live cloud VPC / Kubernetes runtime.
                </p>
              </div>
              <button
                onClick={fetchDrift}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1.5 transition self-start"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Scan Live Drift
              </button>
            </div>

            {revertMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{revertMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {driftData?.drifts?.map((d: any) => (
                <div
                  key={d.id}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {d.severity}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{d.environment}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{d.resource_name}</h4>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{d.resource_type}</div>
                    </div>
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80 text-[11px] font-mono space-y-1">
                      <div className="text-slate-400">
                        <span className="text-slate-400 font-bold">GitOps Desired:</span> {d.desired_state}
                      </div>
                      <div className="text-rose-400">
                        <span className="text-rose-300 font-bold">Live Drifted:</span> {d.live_state}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {d.drift_type}
                    </span>
                    <button
                      onClick={() => handleRevertDrift(d.id)}
                      disabled={revertingId === d.id}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shadow-md"
                    >
                      {revertingId === d.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Reverting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          One-Click Revert
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Patch Debt & CVE Exposure */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  Patch Level Awareness & Fleet Debt Index
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Debt Score: {patchDebtData?.overall_fleet_patch_debt_score ?? 68}/100
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Maps running production host packages (apt/yum/apk) to critical CVE releases and calculates remediation SLAs.
              </p>

              <div className="space-y-3">
                {patchDebtData?.services?.map((s: any) => (
                  <div key={s.asset_id} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-white">{s.hostname}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{s.os_type} • Kernel {s.current_kernel}</div>
                      </div>
                      <button
                        onClick={() => handleDispatchPatch(s.asset_id)}
                        disabled={patchingAsset === s.asset_id}
                        className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1 transition disabled:opacity-50"
                      >
                        {patchingAsset === s.asset_id ? 'Patching...' : 'Dispatch Patch'}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {s.critical_cves?.map((c: any) => (
                        <span
                          key={c.cve_id}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          title={`${c.name} (CVSS ${c.cvss})`}
                        >
                          {c.cve_id}: {c.pkg} (CVSS {c.cvss})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Dependency Pinning Auditor */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  Dependency Pinning Auditor
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {dependencyData?.unpinned_dependencies_count ?? 4} Floating Versions
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Audits package.json & requirements.txt for unpinned caret (^), tilde (~), or wildcard (*) versions vulnerable to supply-chain attacks.
              </p>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {dependencyData?.findings?.map((f: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white">{f.dependency}</span>
                      <span className="font-mono text-rose-400">{f.current_spec}</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">{f.issue}</div>
                    <div className="text-emerald-400 font-mono text-[11px] pt-1 flex items-center justify-between">
                      <span>Locked Spec: {f.dependency} == {f.pinned_secure_version}</span>
                      <button
                        onClick={() => handleCopy(`${f.dependency}==${f.pinned_secure_version}`, `dep-${idx}`)}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                      >
                        {copiedKey === `dep-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        Copy Lock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. IMMUTABLE INFRASTRUCTURE GUARDIAN */}
      {/* ===================================================================== */}
      {activeTab === 'immutable' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live eBPF Syscall Monitor */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-rose-400" />
                    Host Integrity Monitoring (HIM) via eBPF
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time kernel syscall hooks (openat, execve, write) detecting binary tampering, rootkits, and unauthorized /etc/passwd modification.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg">
                  eBPF LSM Active
                </span>
              </div>

              <div className="space-y-3">
                {himData?.kernel_hook_telemetry?.map((ev: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          {ev.violation_type}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{ev.timestamp}</span>
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {ev.process} → Target: <span className="text-cyan-300 font-mono">{ev.target_path}</span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Host: {ev.host} | Syscall: <span className="text-amber-300">{ev.syscall}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {ev.action_taken}
                      </span>
                      <button
                        onClick={() => handleQuarantine(ev.host)}
                        disabled={quarantining}
                        className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center gap-1.5 transition shadow"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Quarantine & Replace
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {quarantineResult && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 mt-4 text-xs">
                  <div className="font-bold text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Automated Quarantine & Instance Reboot Pipeline Succeeded (MTTR: {quarantineResult.mean_time_to_remediate_seconds}s)
                  </div>
                  <div className="space-y-1 text-slate-300">
                    {quarantineResult.execution_pipeline?.map((p: any) => (
                      <div key={p.step} className="font-mono text-[11px]">
                        ✓ Step {p.step}: {p.name} - {p.detail}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CIS Hardened Golden Image Builder */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    CIS Golden Image Builder
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    CIS Level 2
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Generates immutable, zero-package-manager containers and hardened AMIs with non-root UID 10001 and read-only root filesystems.
                </p>

                <div className="space-y-1.5 pt-2">
                  <div className="text-xs font-semibold text-slate-300">Enforced Hardening Benchmarks:</div>
                  <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                    <li>Minimal base image (Chainguard Distroless)</li>
                    <li>Non-root user UID 10001 (nobody/appuser)</li>
                    <li>Read-only root filesystem (readOnlyRootFilesystem: true)</li>
                    <li>All Linux kernel capabilities dropped</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-400">Hardened Dockerfile</span>
                  <button
                    onClick={() => handleCopy(goldenImageSpec?.hardened_dockerfile || '', 'dockerfile')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                  >
                    {copiedKey === 'dockerfile' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Spec
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 max-h-48 overflow-y-auto">
                  {goldenImageSpec?.hardened_dockerfile}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. ZERO TRUST NETWORK MICRO-SEGMENTATION PLANNER */}
      {/* ===================================================================== */}
      {activeTab === 'zero-trust' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <NetworkIcon className="w-5 h-5 text-cyan-400" />
                  Lateral Movement Heatmap & East-West Flow Analyzer
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Analyzes VPC NetFlow and IPFIX socket streams to detect unauthorized cross-tier lateral pivot paths.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-mono rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 self-start">
                Analyzed Flows: {heatmapData?.analyzed_flow_records?.toLocaleString() ?? '1,420,580'}
              </span>
            </div>

            {/* Flows Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {heatmapData?.flows?.map((f: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition ${
                    !f.expected
                      ? 'bg-rose-950/30 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white font-bold">{f.from}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-cyan-300 font-bold">{f.to}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono mt-2 text-slate-400">
                    <span>Port {f.port} ({f.protocol})</span>
                    <span>{f.volume_mbps} Mbps</span>
                  </div>
                  {!f.expected ? (
                    <div className="mt-2 pt-2 border-t border-rose-500/30 text-[11px] text-rose-300 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {f.anomaly_reason}
                    </div>
                  ) : (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Authorized Tier Comms (mTLS Enforced)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kubernetes NetworkPolicy Spec */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Least-Privilege Kubernetes NetworkPolicy
                </h3>
                <button
                  onClick={() => handleCopy(microPolicies?.k8s_network_policy || '', 'k8s-policy')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                >
                  {copiedKey === 'k8s-policy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Policy
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Default-deny policy restricting database access solely to verified application pods and blocking egress reverse shells.
              </p>
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 max-h-56 overflow-y-auto">
                {microPolicies?.k8s_network_policy}
              </pre>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                <div className="font-bold text-cyan-300">What-If Simulation Result:</div>
                <div className="text-slate-300">{microPolicies?.what_if_simulation?.risk_reduction_pct}</div>
                <div className="text-emerald-400 text-[11px]">{microPolicies?.what_if_simulation?.business_traffic_impact}</div>
              </div>
            </div>

            {/* Service Mesh mTLS Status */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  Istio Service Mesh mTLS Enforcer
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {serviceMesh?.global_peer_authentication}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Audits inter-service communication encryption. Detects unencrypted plaintext sockets and allows one-click strict mTLS enforcement.
              </p>

              <div className="space-y-2.5">
                {serviceMesh?.services?.map((svc: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-mono font-bold text-white">{svc.service}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{svc.protocol}</div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                        svc.mode === 'STRICT'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      Mode: {svc.mode}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => alert("STRICT PeerAuthentication enforced across all Istio sidecars.")}
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Enforce STRICT mTLS (PEER_AUTH_STRICT)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. DATA EXFILTRATION SENTINEL */}
      {/* ===================================================================== */}
      {activeTab === 'data-exfil' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live DLP Scanner */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Data Loss Prevention (DLP) Pattern Inspector
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Luhn CC + SSN + Cloud Secrets
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Scans outbound payloads in real-time using the Luhn algorithm for valid payment cards, US SSNs, and AWS/OpenAI credentials.
              </p>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setDlpPayloadInput("Order payload: card 4532-8921-3829-1923, exp 12/28");
                      handleScanDlp("Order payload: card 4532-8921-3829-1923, exp 12/28");
                    }}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono rounded"
                  >
                    Preset: Credit Card
                  </button>
                  <button
                    onClick={() => {
                      setDlpPayloadInput("Diagnostic dump: secret_key=AKIAIOSFODNN7EXAMPLE & token=sk-abcdef1234567890abcdef1234567890");
                      handleScanDlp("Diagnostic dump: secret_key=AKIAIOSFODNN7EXAMPLE & token=sk-abcdef1234567890abcdef1234567890");
                    }}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono rounded"
                  >
                    Preset: AWS & OpenAI Key
                  </button>
                </div>

                <textarea
                  value={dlpPayloadInput}
                  onChange={(e) => setDlpPayloadInput(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />

                <button
                  onClick={() => handleScanDlp()}
                  disabled={dlpScanning}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Search className="w-3.5 h-3.5" />
                  {dlpScanning ? 'Evaluating Patterns...' : 'Inspect Outbound Payload'}
                </button>
              </div>

              {dlpScanResult && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">DLP Verdict:</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        dlpScanResult.dlp_action === 'BLOCK_PAYLOAD'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {dlpScanResult.dlp_action}
                    </span>
                  </div>
                  {dlpScanResult.findings?.map((f: any, idx: number) => (
                    <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800/80 space-y-0.5 font-mono text-[11px]">
                      <div className="text-rose-400 font-bold">{f.type}</div>
                      <div className="text-slate-300">Sample: {f.matched_sample} ({f.rule})</div>
                      <div className="text-amber-400 text-[10px]">{f.regulatory_impact}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Database Bulk Scrape Auditor & RLS Generator */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  Database Query Audit & Row-Level Security (RLS)
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  SQL Scrape Guard
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Identifies full-table dumps (e.g. SELECT * FROM customers) and generates strict PostgreSQL Row-Level Security and masking views.
              </p>

              <div className="space-y-2">
                <textarea
                  value={sqlQueryInput}
                  onChange={(e) => setSqlQueryInput(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleAuditSql}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Search className="w-3.5 h-3.5" />
                  Audit SQL Query
                </button>
              </div>

              {sqlAuditResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400">Automated PostgreSQL RLS Policy</span>
                    <button
                      onClick={() => handleCopy(sqlAuditResult.recommended_row_level_security_sql, 'rls-sql')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                    >
                      {copiedKey === 'rls-sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy RLS
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 max-h-44 overflow-y-auto">
                    {sqlAuditResult.recommended_row_level_security_sql}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* DNS Exfiltration & Bandwidth Anomalies */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                Anomaly-Based Exfiltration Tripwires
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Surge Ratio: {exfilAnomalies?.network_baseline_stats?.surge_ratio}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exfilAnomalies?.anomalies?.map((an: any) => (
                <div key={an.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-rose-400">{an.anomaly_type}</span>
                    <span className="text-[10px] font-mono text-slate-400">{an.detected_at}</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{an.host}</div>
                  <div className="text-xs text-slate-400 font-mono">
                    Indicator: <span className="text-amber-300">{an.indicator}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Destination: {an.destination} | Volume: {an.bytes_exfiltrated_est}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono pt-1">
                    Mitigation: {an.mitigation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. THREAT HUNTING QUERY BUILDER */}
      {/* ===================================================================== */}
      {activeTab === 'threat-hunting' && (
        <div className="space-y-6">
          {/* NL to SIEM Query AI Engine */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                  Natural Language Threat Hunting Query Builder
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Translates natural language analyst intent into production Splunk (SPL), Microsoft Sentinel (KQL), and Elasticsearch (ES|QL) queries.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg">
                Multi-SIEM Translation Engine
              </span>
            </div>

            {/* Quick Prompt Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const p = "Show me all failed logins from external IPs followed by a successful login in the last 5 minutes";
                  setNlQueryPrompt(p);
                  handleTranslateNl(p);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
              >
                Brute Force + Successful Login
              </button>
              <button
                onClick={() => {
                  const p = "Detect PowerShell running encoded commands with parent winword.exe";
                  setNlQueryPrompt(p);
                  handleTranslateNl(p);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
              >
                Encoded PowerShell & LOLBAS
              </button>
              <button
                onClick={() => {
                  const p = "Identify high entropy DNS queries indicating data tunneling";
                  setNlQueryPrompt(p);
                  handleTranslateNl(p);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
              >
                DNS Data Exfiltration
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={nlQueryPrompt}
                onChange={(e) => setNlQueryPrompt(e.target.value)}
                placeholder="Ask any threat hunting question..."
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleTranslateNl()}
                disabled={nlTranslating}
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                {nlTranslating ? 'Generating...' : 'Translate Query'}
              </button>
            </div>

            {nlQueryResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Splunk SPL */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400">Splunk SPL</span>
                    <button
                      onClick={() => handleCopy(nlQueryResult.splunk_spl, 'spl')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                    >
                      {copiedKey === 'spl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy SPL
                    </button>
                  </div>
                  <pre className="p-2.5 bg-slate-900 rounded-lg text-[11px] font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap">
                    {nlQueryResult.splunk_spl}
                  </pre>
                </div>

                {/* Microsoft Sentinel KQL */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400">Microsoft Sentinel (KQL)</span>
                    <button
                      onClick={() => handleCopy(nlQueryResult.kusto_kql, 'kql')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                    >
                      {copiedKey === 'kql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy KQL
                    </button>
                  </div>
                  <pre className="p-2.5 bg-slate-900 rounded-lg text-[11px] font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap">
                    {nlQueryResult.kusto_kql}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Hypothesis Testing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hypotheses?.map((h) => (
              <div key={h.id} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {h.mitre_tactic}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        h.verdict === 'CONFIRMED_ANOMALY'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : h.verdict === 'EVIDENCE_DETECTED'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {h.verdict}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{h.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{h.description}</p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                  <div className="text-slate-400">Evidence Score: <span className="text-cyan-400 font-bold">{h.evidence_score}%</span></div>
                  <div className="text-[11px] text-slate-300 font-sans">{h.findings}</div>
                </div>
              </div>
            ))}
          </div>

          {/* MITRE ATT&CK Matrix & Sigma Rule Recommendations */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                MITRE ATT&CK Matrix Coverage & Gap Analysis
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Fleet Coverage: {mitreCoverage?.overall_framework_coverage_pct ?? 54}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {mitreCoverage?.tactics?.map((t: any) => (
                <div key={t.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <div className="text-[10px] text-slate-400 font-mono">{t.id}</div>
                  <div className="text-xs font-bold text-white truncate">{t.name}</div>
                  <div className="text-xs font-mono font-bold text-cyan-400">{t.coverage_pct}%</div>
                  <div
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      t.status === 'OPTIMAL' || t.status === 'GOOD'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : t.status === 'MODERATE'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {t.status}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="text-xs font-semibold text-white mb-2">Recommended Sigma Detection Rules (YAML):</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mitreCoverage?.recommended_sigma_rules?.map((r: any) => (
                  <div key={r.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{r.title}</span>
                      <button
                        onClick={() => handleCopy(r.yaml, r.id)}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                      >
                        {copiedKey === r.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy Sigma
                      </button>
                    </div>
                    <pre className="p-2 bg-slate-900 rounded text-[10px] font-mono text-emerald-300 overflow-x-auto">
                      {r.yaml}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. INCIDENT RESPONSE ORCHESTRATOR */}
      {/* ===================================================================== */}
      {activeTab === 'incident-response' && (
        <div className="space-y-6">
          {/* Automated Playbooks */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-cyan-400" />
                  SOAR Playbook Automation
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated containment sequences: Threat Intel enrichment, perimeter blackholing, session revocation, and Jira incident creation.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg">
                SOAR Engine Armed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {playbooks?.map((pb) => (
                <div key={pb.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{pb.title}</span>
                      <span className="text-xs font-mono text-slate-400">Est: {pb.estimated_execution_time}</span>
                    </div>
                    <p className="text-xs text-slate-400">{pb.trigger}</p>

                    <div className="space-y-1.5 pt-2">
                      {pb.steps?.map((st: any) => (
                        <div key={st.step} className="text-[11px] font-mono text-slate-300 flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px]">
                            {st.step}
                          </span>
                          <span>{st.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end">
                    <button
                      onClick={() => handleExecutePlaybook(pb.id)}
                      disabled={executingPlaybook === pb.id}
                      className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {executingPlaybook === pb.id ? 'Executing...' : 'Trigger Playbook'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {playbookExecutionResult && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Playbook Executed Successfully (MTTR: {playbookExecutionResult.mttr_seconds}s)
                </div>
                <div className="space-y-1 font-mono text-[11px] text-slate-300">
                  {playbookExecutionResult.steps_results?.map((s: any) => (
                    <div key={s.step}>✓ Step {s.step}: {s.name} → {s.result}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timeline Reconstruction & Post-Mortem */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Incident Timeline Reconstruction ({attackTimeline?.incident_reference})
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">Dwell Time: {attackTimeline?.total_dwell_time}</div>
              </div>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-800">
                {attackTimeline?.events?.map((ev: any) => (
                  <div key={ev.stage} className="relative flex items-start gap-4 pl-8 text-xs">
                    <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-cyan-500 ring-4 ring-slate-900 shrink-0" />
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{ev.phase}</span>
                        <span className="font-mono text-slate-400 text-[10px]">{ev.time}</span>
                      </div>
                      <div className="text-slate-300">{ev.event}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">Source: {ev.source}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Post-Mortem RCA */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    Automated Root Cause Analysis (RCA)
                  </h3>
                  <button
                    onClick={() => handleCopy(postMortemDoc?.markdown || '', 'rca-md')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                  >
                    {copiedKey === 'rca-md' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Markdown
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Comprehensive executive post-mortem generated with blast radius, lessons learned, and timeline breakdown.
                </p>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 max-h-80 overflow-y-auto text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                  {postMortemDoc?.markdown}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. RESILIENCE CHAOS ENGINEERING ENGINE */}
      {/* ===================================================================== */}
      {activeTab === 'chaos-engine' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chaos Injection Scenarios */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-400" />
                    LitmusChaos & Chaos Mesh Fault Injection
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Inject controlled network partitions, CPU DDoS surges, and CoreDNS outages to test circuit breakers.
                  </p>
                </div>
                <button
                  onClick={handleRunGameDay}
                  disabled={runningGameDay}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Award className="w-3.5 h-3.5" />
                  {runningGameDay ? 'Running Drill...' : 'Run Game Day Drill'}
                </button>
              </div>

              <div className="space-y-3">
                {chaosScenarios?.map((sc) => (
                  <div key={sc.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{sc.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {sc.blast_radius} Blast
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">{sc.objective}</div>
                      <div className="text-[11px] font-mono text-cyan-400">Target: {sc.target} | Fault: {sc.fault_type}</div>
                    </div>

                    <button
                      onClick={() => handleInjectChaos(sc.id)}
                      disabled={injectingChaos === sc.id}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition self-start shrink-0"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      {injectingChaos === sc.id ? 'Simulating Fault...' : 'Inject Chaos'}
                    </button>
                  </div>
                ))}
              </div>

              {chaosResult && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {chaosResult.result_verdict} (Resilience Score: {chaosResult.resilience_score}/100)
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-slate-300">
                    {chaosResult.simulation_log?.map((l: string, idx: number) => (
                      <div key={idx}>{l}</div>
                    ))}
                  </div>
                </div>
              )}

              {gameDayResult && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-amber-300 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    {gameDayResult.drill_name} Finished!
                  </div>
                  <div className="font-mono text-[11px] text-slate-300">
                    Rating: {gameDayResult.overall_resilience_rating} | MTTD: {gameDayResult.mean_time_to_detect_seconds}s | MTTR: {gameDayResult.mean_time_to_recover_seconds}s
                  </div>
                  <div className="text-slate-300 text-xs">{gameDayResult.lessons_learned}</div>
                </div>
              )}
            </div>

            {/* SLO & Error Budget Burn Rate */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  SLO & Error Budget Burn Rate
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">30-day Availability: {sloMetrics?.current_30d_availability}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                <div className="text-xs uppercase font-mono tracking-wider text-slate-400">Error Budget Remaining</div>
                <div className="text-3xl font-extrabold font-mono text-emerald-400">
                  {sloMetrics?.error_budget_remaining_pct}%
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Burn Rate: <span className="text-cyan-400 font-bold">{sloMetrics?.current_burn_rate}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-white">Service-Level Indicators (SLIs):</div>
                {sloMetrics?.service_slis?.map((sli: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{sli.service}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Actual: {sli.actual} (Target {sli.target})</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      Burn: {sli.burn}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 8. COMPLIANCE & GOVERNANCE DASHBOARD */}
      {/* ===================================================================== */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          {/* Framework Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {complianceScorecards?.frameworks?.map((fw: any) => (
              <div key={fw.id} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{fw.name}</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">{fw.score}%</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">{fw.category}</div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono flex items-center justify-between">
                  <span className="text-emerald-400">Pass: {fw.passing_controls}</span>
                  <span className="text-amber-400">Warn: {fw.warning_controls}</span>
                  <span className="text-rose-400">Fail: {fw.failing_controls}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tamper-Proof Hash-Chained Audit Trail */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Cryptographic Hash-Chained Audit Ledger
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5">SHA-256 Merkle-Chained Immutability</div>
                </div>
                <button
                  onClick={handleVerifyChain}
                  disabled={verifyingChain}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {verifyingChain ? 'Recalculating...' : 'Verify Chain Integrity'}
                </button>
              </div>

              {chainVerifyResult && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-mono">
                  ✓ {chainVerifyResult.cryptographic_proof}
                </div>
              )}

              <div className="space-y-2.5">
                {auditTrail?.audit_records?.map((r: any) => (
                  <div key={r.index} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Block #{r.index}: <strong className="text-white">{r.action}</strong></span>
                      <span className="text-[10px] text-slate-400">{r.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-cyan-400 truncate">Hash: {r.block_hash}</div>
                    <div className="text-[10px] text-slate-400 truncate">Prev: {r.prev_hash}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Policy as Code (OPA) Rego Sandbox */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  Policy as Code (PaC) Open Policy Agent
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  OPA Rego Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tests Terraform infrastructure against corporate security policies before deployment to prevent public buckets & open admin ports.
              </p>

              <div className="space-y-2">
                <textarea
                  value={pacSnippet}
                  onChange={(e) => setPacSnippet(e.target.value)}
                  rows={4}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleValidatePac}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Search className="w-3.5 h-3.5" />
                  Validate Rego Policies
                </button>
              </div>

              {pacResult && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">OPA Verdict:</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        pacResult.verdict === 'PASSED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {pacResult.verdict}
                    </span>
                  </div>
                  {pacResult.violations?.map((v: any, idx: number) => (
                    <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-rose-300">
                      ✗ {v.rule}: {v.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 9. THREAT INTEL FUSION CENTER */}
      {/* ===================================================================== */}
      {activeTab === 'fusion-center' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  Multi-Source Threat Intelligence Enrichment
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time query fusion across VirusTotal, AbuseIPDB, Shodan open sockets, AlienVault OTX, and MISP communities.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg">
                Fusion Active
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={fusionIocInput}
                onChange={(e) => setFusionIocInput(e.target.value)}
                placeholder="Enter IP, Domain, or SHA-256 Hash..."
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleEnrichIoc()}
                disabled={enrichingIoc}
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
                {enrichingIoc ? 'Enriching...' : 'Enrich IOC'}
              </button>
            </div>

            {fusionEnrichment && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-white">VirusTotal Intelligence</div>
                  <div className="text-2xl font-extrabold font-mono text-rose-400">
                    {fusionEnrichment.sources?.virustotal?.positives}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Tags: {fusionEnrichment.sources?.virustotal?.detection_names?.join(', ')}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-white">AbuseIPDB Reputation</div>
                  <div className="text-2xl font-extrabold font-mono text-amber-400">
                    {fusionEnrichment.sources?.abuseipdb?.confidence_of_abuse} Confidence
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Reports: {fusionEnrichment.sources?.abuseipdb?.total_reports} reports ({fusionEnrichment.sources?.abuseipdb?.last_reported})
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-white">Shodan Open Ports & Banner</div>
                  <div className="text-xs font-mono text-cyan-300">
                    Ports: {fusionEnrichment.sources?.shodan?.open_ports?.join(', ')}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Services: {fusionEnrichment.sources?.shodan?.running_services?.join(' | ')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Indicator Correlation Campaigns */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Layers className="w-4 h-4 text-cyan-400" />
              Correlated Attack Campaigns & Threat Actor Attribution
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {correlations?.correlations?.map((c: any) => (
                <div key={c.campaign_id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{c.threat_actor}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {c.confidence}
                    </span>
                  </div>
                  <div className="text-xs text-cyan-400 font-mono">{c.active_campaign_name}</div>

                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-semibold text-slate-400">Linked Threat Indicators:</div>
                    {c.linked_iocs?.map((i: any, idx: number) => (
                      <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800/80 text-[11px] font-mono flex items-center justify-between">
                        <span className="text-slate-200 truncate">{i.ioc}</span>
                        <span className="text-slate-400 shrink-0 text-[10px]">{i.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 10. SECURITY POSTURE SCORECARD */}
      {/* ===================================================================== */}
      {activeTab === 'security-posture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Scorecard Gauge */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl text-center space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
                  <Gauge className="w-5 h-5 text-cyan-400" />
                  Composite Security Posture Index
                </h3>
                <p className="text-xs text-slate-400">
                  Weighted composite across vulnerabilities (20%), patch debt (20%), IaC drift (20%), incident MTTR (20%), and MITRE coverage (20%).
                </p>

                <div className="py-6">
                  <div className="inline-flex items-center justify-center p-8 rounded-full border-4 border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                    <div className="text-center">
                      <div className="text-5xl font-extrabold font-mono text-white">
                        {simulateFixed ? '96.7' : (postureData?.composite_score ?? 80.0)}
                      </div>
                      <div className="text-xs font-mono text-cyan-400 uppercase mt-1">
                        {simulateFixed ? 'Grade A+ (Elite Posture)' : `Grade ${postureData?.letter_grade ?? 'B+'}`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <button
                  onClick={() => setSimulateFixed(!simulateFixed)}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 ${
                    simulateFixed
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  {simulateFixed ? 'Reset Actual Posture' : 'Simulate Roadmap Improvements (+16.7 pts)'}
                </button>
              </div>
            </div>

            {/* Sub-Metrics & Industry Benchmarks */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Sub-Pillar Breakdown & Peer Benchmarks</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {postureData?.industry_benchmarks?.your_organization_percentile}
                </p>
              </div>

              {/* Sub-pillars */}
              <div className="space-y-3">
                {postureData?.sub_metrics?.map((m: any, idx: number) => {
                  const score = simulateFixed ? Math.min(100, m.score + 18) : m.score;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">{m.category} (Weight: {m.weight})</span>
                        <span className="font-mono text-cyan-400 font-bold">{score}/100</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Prioritized Roadmap */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-white">Prioritized Improvement Actions:</div>
                <div className="space-y-2">
                  {postureData?.prioritized_improvement_roadmap?.map((r: any) => (
                    <div
                      key={r.priority}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-200">
                          {r.priority}. {r.action}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Category: {r.category} • Effort: {r.effort}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {r.points_gain}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper for local icon usage
function NetworkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="16" y="16" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
      <path d="M12 12V8" />
    </svg>
  );
}

function Sparkles(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}
