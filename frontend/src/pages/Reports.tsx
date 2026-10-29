import React, { useState, useEffect } from 'react';
import { apiRequest, downloadFile } from '../services/api';
import { FileText, Download, Calendar, ShieldCheck, RefreshCw, Loader2, Check } from 'lucide-react';

export const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/reports/summary');
      setReportData(data);
    } catch (err) {
      console.error('Failed to load report summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    setDownloadSuccess(false);
    try {
      await downloadFile('/reports/pdf', 'CYVANTIS_Threat_Report.pdf');
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err: any) {
      alert('Failed to download PDF report: ' + (err.message || 'Unknown error'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans">
      {/* 1. Header & PDF Action */}
      <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <h2 className="text-lg font-bold text-[#E8EEF8] font-mono tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#38BDF8]" />
              Executive Security & Threat Reports Center
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Automated intelligence compilation, risk quantification, and executive-ready PDF report generation
          </p>
        </div>

        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="px-4 py-2 rounded-lg bg-[#38BDF8]/20 hover:bg-[#38BDF8]/30 border border-[#38BDF8]/50 text-[#38BDF8] font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 font-mono self-start sm:self-auto"
        >
          {downloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#38BDF8]" />
              <span>Generating PDF...</span>
            </>
          ) : downloadSuccess ? (
            <>
              <Check className="w-4 h-4 text-[#34D399]" />
              <span className="text-[#34D399]">Downloaded PDF!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-[#38BDF8]" />
              <span>Export Executive PDF</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Executive Report Preview */}
      {loading ? (
        <div className="text-center py-12 text-[#94A3B8] font-mono text-xs">
          Compiling threat report data...
        </div>
      ) : reportData && (
        <div className="bg-[#0D1528] border border-[#243149] rounded-xl p-6 sm:p-8 space-y-6 max-w-4xl mx-auto shadow-sm">
          {/* Header */}
          <div className="border-b border-[#243149] pb-5 flex items-start justify-between">
            <div>
              <span className="text-xs font-mono text-[#38BDF8] font-bold uppercase tracking-widest">
                CYVANTIS THREAT BRIEFING
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#E8EEF8] font-mono mt-1">
                Executive Threat Intelligence Summary
              </h1>
              <p className="text-xs text-[#94A3B8] mt-1 font-mono">
                Generated: {new Date(reportData.generated_at).toUTCString()} • Classification: TLPS:AMBER
              </p>
            </div>
            <div className="p-2.5 bg-[#38BDF8]/10 border border-[#38BDF8]/30 rounded-lg text-[#38BDF8]">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#E8EEF8] uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
              1. Executive Overview
            </h3>
            <p className="text-xs text-[#E8EEF8] leading-relaxed bg-[#111C32] p-4 rounded-lg border border-[#243149]">
              During the analyzed operational period, CYVANTIS sensors intercepted and recorded{' '}
              <strong className="text-[#38BDF8]">{reportData.total_events}</strong> cyberattack events originating from{' '}
              <strong className="text-[#38BDF8]">{reportData.unique_ips}</strong> unique adversary IP addresses. Primary
              targeted vector services include SSH (<strong className="text-[#E8EEF8]">{reportData.ssh_attempts}</strong>{' '}
              attempts) and Telnet (<strong className="text-[#E8EEF8]">{reportData.telnet_attempts}</strong> attempts). A
              total of <strong className="text-[#FB7185]">{reportData.critical_alerts}</strong> critical security alerts
              and <strong className="text-[#FBBF24]">{reportData.active_investigations}</strong> active incident cases
              were processed by the response engine.
            </p>
          </div>

          {/* Section 2: Metrics Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#E8EEF8] uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#818CF8]" />
              2. Key Operational Telemetry
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 bg-[#111C32] rounded-lg border border-[#243149]">
                <span className="text-[#94A3B8] uppercase text-[10px]">Total Events</span>
                <div className="font-bold text-[#38BDF8] text-lg mt-0.5">{reportData.total_events}</div>
              </div>
              <div className="p-3 bg-[#111C32] rounded-lg border border-[#243149]">
                <span className="text-[#94A3B8] uppercase text-[10px]">Unique Sources</span>
                <div className="font-bold text-[#818CF8] text-lg mt-0.5">{reportData.unique_ips}</div>
              </div>
              <div className="p-3 bg-[#111C32] rounded-lg border border-[#243149]">
                <span className="text-[#94A3B8] uppercase text-[10px]">SSH Volume</span>
                <div className="font-bold text-[#38BDF8] text-lg mt-0.5">{reportData.ssh_attempts}</div>
              </div>
              <div className="p-3 bg-[#111C32] rounded-lg border border-[#243149]">
                <span className="text-[#94A3B8] uppercase text-[10px]">Telnet Volume</span>
                <div className="font-bold text-[#818CF8] text-lg mt-0.5">{reportData.telnet_attempts}</div>
              </div>
            </div>
          </div>

          {/* Section 3: Targeted Credentials */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#E8EEF8] uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
              3. Adversary Dictionary Targets
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3.5 bg-[#111C32] rounded-lg border border-[#243149] space-y-2">
                <span className="text-[#94A3B8] font-bold uppercase text-[10px] block border-b border-[#243149] pb-1">
                  Top Targeted Usernames
                </span>
                {reportData.top_usernames?.map((u: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[#E8EEF8]">
                    <span>{u.username}</span>
                    <strong className="text-[#38BDF8]">{u.count} hits</strong>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-[#111C32] rounded-lg border border-[#243149] space-y-2">
                <span className="text-[#94A3B8] font-bold uppercase text-[10px] block border-b border-[#243149] pb-1">
                  Top Attempted Passwords
                </span>
                {reportData.top_passwords?.map((p: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[#E8EEF8]">
                    <span className="text-[#94A3B8]">••••••••</span>
                    <strong className="text-[#818CF8]">{p.count} hits</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
