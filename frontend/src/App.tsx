import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { HackerProfileProvider } from './context/HackerProfileContext';
import { Sidebar, NAV_ITEMS } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';

// Page Imports
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { FirstLoginPasswordModal } from './components/common/FirstLoginPasswordModal';
import { IdleSessionLockModal } from './components/common/IdleSessionLockModal';
import { Overview } from './pages/Overview';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { EventExplorer } from './pages/EventExplorer';
import { AttackAnalysis } from './pages/AttackAnalysis';
import { SourceIntelligence } from './pages/SourceIntelligence';
import { GeoThreatMapPage } from './pages/GeoThreatMapPage';
import { Investigations } from './pages/Investigations';
import { DetectionRules } from './pages/DetectionRules';
import { ThreatIntelligence } from './pages/ThreatIntelligence';
import { Reports } from './pages/Reports';
import { AdminDataManagement } from './pages/AdminDataManagement';
import { StorageBackups } from './pages/StorageBackups';
import { InfrastructureHealth } from './pages/InfrastructureHealth';
import { AuditLogs } from './pages/AuditLogs';
import { UserManagement } from './pages/UserManagement';
import { Settings } from './pages/Settings';
import { SecurityHardening } from './pages/SecurityHardening';
import { ToolsHub } from './pages/ToolsHub';
import { CveRadar } from './pages/CveRadar';
import { MlIntelligence } from './pages/MlIntelligence';
import { CyberDefenseSuite } from './pages/CyberDefenseSuite';
import { EliteSecurityOperations } from './pages/EliteSecurityOperations';
import { InteractiveTerminal } from './pages/InteractiveTerminal';
import { LockedAccessView } from './components/common/LockedAccessView';

// Interactive Modals
import { HackerCardModal } from './components/hacker/HackerCardModal';
import { CommandPaletteModal } from './components/hacker/CommandPaletteModal';
import { ToolComparisonEngine } from './components/hacker/ToolComparisonEngine';
import { ToolRouletteModal } from './components/hacker/ToolRouletteModal';
import { CtfChallengesHub } from './components/hacker/CtfChallengesHub';
import { PublicHackerProfileModal } from './components/hacker/PublicHackerProfileModal';
import { apiRequest } from './services/api';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [activeAlertCount, setActiveAlertCount] = useState<number>(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Command Palette & Modals
  const [showHackerCard, setShowHackerCard] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [showToolComparison, setShowToolComparison] = useState<boolean>(false);
  const [showRoulette, setShowRoulette] = useState<boolean>(false);
  const [showCtfHub, setShowCtfHub] = useState<boolean>(false);
  const [showPublicProfile, setShowPublicProfile] = useState<boolean>(false);

  // Poll alert count for the top bar badge
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchAlertCount = async () => {
      try {
        const alerts = await apiRequest<any[]>('/rules/alerts?status_filter=active');
        setActiveAlertCount(alerts?.length || 0);
      } catch (e) {
        // Silently catch if not available
      }
    };
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Global Ctrl+K / Cmd+K Command Palette Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080E1E] flex items-center justify-center text-[#38BDF8] font-mono text-sm">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] animate-ping" />
          <span>Initializing CYVANTIS Obsidian Gateway...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showLoginModal) {
      return <Login onBackToLanding={() => setShowLoginModal(false)} />;
    }
    return <LandingPage onLoginClick={() => setShowLoginModal(true)} />;
  }

  const currentItem = NAV_ITEMS.find((item) => item.id === currentTab) || NAV_ITEMS[0];

  const handleLaunchToolFromRoulette = () => {
    setCurrentTab('tools-hub');
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'overview':
        return <Overview onNavigateTab={(tab) => setCurrentTab(tab)} />;
      case 'live-monitoring':
        return <LiveMonitoring />;
      case 'events':
        return <EventExplorer />;
      case 'attack-analysis':
        return <AttackAnalysis onNavigateEvents={() => setCurrentTab('events')} />;
      case 'source-intelligence':
        return <SourceIntelligence />;
      case 'geo-map':
        return <GeoThreatMapPage onNavigateEvents={() => setCurrentTab('events')} />;
      case 'investigations':
        return <Investigations />;
      case 'detection-rules':
        return <DetectionRules />;
      case 'threat-intel':
        return <ThreatIntelligence />;
      case 'reports':
        return <Reports />;
      case 'tools-hub':
        return (
          <ToolsHub
            onOpenComparison={() => setShowToolComparison(true)}
            onOpenRoulette={() => setShowRoulette(true)}
            onOpenCtfHub={() => setShowCtfHub(true)}
            onOpenHackerCard={() => setShowHackerCard(true)}
          />
        );
      case 'cve-radar':
        return <CveRadar />;
      case 'ml-intelligence':
        return <MlIntelligence />;
      case 'defensive-suite':
        return <CyberDefenseSuite />;
      case 'elite-ops':
        return <EliteSecurityOperations />;
      case 'interactive-terminal':
        return <InteractiveTerminal />;
      case 'admin-data':
        return user?.role === 'admin'
          ? <AdminDataManagement />
          : <LockedAccessView featureName="Admin Data Management" onNavigateHome={() => setCurrentTab('overview')} userRole={user?.role} />;
      case 'storage':
        return <StorageBackups />;
      case 'health':
        return <InfrastructureHealth />;
      case 'audit-logs':
        return <AuditLogs />;
      case 'users':
        return user?.role === 'admin'
          ? <UserManagement />
          : <LockedAccessView featureName="User Management" onNavigateHome={() => setCurrentTab('overview')} userRole={user?.role} />;
      case 'settings':
        return user?.role === 'admin'
          ? <Settings />
          : <LockedAccessView featureName="System Settings and API Keys" onNavigateHome={() => setCurrentTab('overview')} userRole={user?.role} />;
      case 'security-hardening':
        return <SecurityHardening />;
      default:
        return <Overview onNavigateTab={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#080E1E] text-[#E8EEF8] font-sans relative overflow-hidden bg-grid-obsidian">
      <IdleSessionLockModal />
      {user?.must_change_password && <FirstLoginPasswordModal />}

      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        userRole={user?.role}
        userName={user?.username}
        onLogout={logout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Navbar
          currentTabLabel={currentItem.label}
          currentGroup={currentItem.group}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          alertCount={activeAlertCount}
          onNavigateAlerts={() => setCurrentTab('detection-rules')}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* Interactive Cyber Modals */}
      <HackerCardModal
        isOpen={showHackerCard}
        onClose={() => setShowHackerCard(false)}
        onOpenPublicProfile={() => {
          setShowHackerCard(false);
          setShowPublicProfile(true);
        }}
      />

      <ToolComparisonEngine
        isOpen={showToolComparison}
        onClose={() => setShowToolComparison(false)}
      />

      <ToolRouletteModal
        isOpen={showRoulette}
        onClose={() => setShowRoulette(false)}
        onLaunchTool={handleLaunchToolFromRoulette}
      />

      <CtfChallengesHub
        isOpen={showCtfHub}
        onClose={() => setShowCtfHub(false)}
      />

      <CommandPaletteModal
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigateTab={(tabId) => setCurrentTab(tabId)}
        onOpenHackerCard={() => setShowHackerCard(true)}
        onOpenRoulette={() => setShowRoulette(true)}
        onOpenCtfHub={() => setShowCtfHub(true)}
        onOpenToolComparison={() => setShowToolComparison(true)}
      />

      <PublicHackerProfileModal
        isOpen={showPublicProfile}
        onClose={() => setShowPublicProfile(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <HackerProfileProvider>
          <MainLayout />
        </HackerProfileProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}
