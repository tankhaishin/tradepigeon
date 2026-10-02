import React, { useState, useEffect, lazy, Suspense } from 'react';
import SidebarNav from './components/SidebarNav';
import CenterPath from './components/CenterPath';
import RightStatusHub from './components/RightStatusHub';
import OnboardingModal from './components/OnboardingModal';
import TopStatBar from './components/TopStatBar';
import RealTimeCompanionToast from './components/RealTimeCompanionToast';
import NetworkStatusBanner from './components/NetworkStatusBanner';
import LandingPage from './components/LandingPage';
import ProPaywallModal from './components/ProPaywallModal';
import StatementImportModal from './components/StatementImportModal';
import ComingSoon from './components/ComingSoon';
import { refreshProStatus } from './utils/proStatus';
import ConfettiBurst from './components/ConfettiBurst';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import ManualTradeModal from './components/ManualTradeModal';
import { loadStoredData, saveStoredData, subscribeToStorageUpdate, STORAGE_KEYS, buildDefaultPlaybooks } from './utils/storage';
import { soundFx } from './utils/audioEngine';
import { recordError, downloadDiagnosticReport } from './utils/errorTelemetry';

const getSessionSafe = (key) => {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage?.getItem(key) : null;
  } catch (_) {
    return null;
  }
};
const setSessionSafe = (key, val) => {
  try {
    if (typeof window !== 'undefined') window.sessionStorage?.setItem(key, val);
  } catch (_) {}
};
const removeSessionSafe = (key) => {
  try {
    if (typeof window !== 'undefined') window.sessionStorage?.removeItem(key);
  } catch (_) {}
};

// Robust lazy loader that retries on chunk load failure (e.g., after a new deployment)
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasBeenForceRefreshed = getSessionSafe('tp_chunk_retry');
    try {
      const component = await componentImport();
      removeSessionSafe('tp_chunk_retry');
      return component;
    } catch (error) {
      if (!pageHasBeenForceRefreshed) {
        // A new deployment likely invalidated older chunk hashes. Reload to fetch fresh assets.
        setSessionSafe('tp_chunk_retry', 'true');
        if (typeof window !== 'undefined') window.location.reload();
        return new Promise(() => {}); // Hold until reload
      }
      // If already retried and still fails, bubble error
      throw error;
    }
  });

// Code-split heavy secondary tabs to optimize initial bundle size & load speed
const CalendarTab = lazyWithRetry(() => import('./components/CalendarTab'));
const SetupsTab = lazyWithRetry(() => import('./components/SetupsTab'));
const ConnectionsTab = lazyWithRetry(() => import('./components/ConnectionsTab'));
const ProfileTab = lazyWithRetry(() => import('./components/ProfileTab'));

const TabLoadingFallback = () => (
  <main className="flex-1 min-h-screen lg:pl-28 xl:pl-80 bg-[#070C1E] p-6 flex flex-col items-center justify-center space-y-4 text-white">
    <div className="w-12 h-12 rounded-2xl bg-[#0D1635] border-2 border-[#FF6B00] border-b-4 border-b-[#C2410C] flex items-center justify-center animate-bounce shadow-lg">
      <img src="/favicon.svg" alt="TradePigeon" className="w-8 h-8 object-contain rounded-xl" />
    </div>
    <div className="text-xs font-black uppercase tracking-widest text-[#FF6B00] animate-pulse">
      Loading...
    </div>
  </main>
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[TradePigeon ErrorBoundary] Caught error:', error, errorInfo);
    recordError(error, { componentStack: errorInfo?.componentStack });
    
    // If it's a dynamic import failure, automatically reload once to fetch new chunks
    const isChunkError = error?.name === 'ChunkLoadError' || 
      String(error?.message || '').toLowerCase().includes('failed to fetch dynamically imported module');
    if (isChunkError) {
      const retried = getSessionSafe('tp_eb_chunk_retry');
      if (!retried) {
        setSessionSafe('tp_eb_chunk_retry', 'true');
        if (typeof window !== 'undefined') window.location.reload();
      }
    }
  }

  handleRetry = () => {
    removeSessionSafe('tp_chunk_retry');
    removeSessionSafe('tp_eb_chunk_retry');
    if (typeof window !== 'undefined') window.location.reload();
  };

  handleCopyDiagnostic = () => {
    const errorDetails = `[TradePigeon Error Report]\nTimestamp: ${new Date().toISOString()}\nMessage: ${this.state.error?.message}\nStack: ${this.state.error?.stack}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(errorDetails).then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2000);
      }).catch(() => {
        this.fallbackCopyDiagnostic(errorDetails);
      });
    } else {
      this.fallbackCopyDiagnostic(errorDetails);
    }
  };

  fallbackCopyDiagnostic = (text) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (_) {}
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = String(this.state.error?.message || '').toLowerCase().includes('failed to fetch dynamically imported module');
      return (
        <div className="p-5 bg-[#0D1635] text-white rounded-3xl border-2 border-rose-500 text-xs font-mono max-w-lg m-4 z-50 fixed right-4 top-4 shadow-2xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between gap-2 border-b border-[#20325C] pb-2">
            <div className="font-black text-rose-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{isChunkError ? 'App Update Detected' : 'Runtime Shield Triggered'}</span>
            </div>
            <button
              onClick={this.handleRetry}
              className="duo-btn-green text-[10px] font-black uppercase px-3 py-1 rounded-xl cursor-pointer"
            >
              {isChunkError ? 'Refresh to Update' : 'Reload'}
            </button>
          </div>
          <div className="font-bold text-slate-200 text-xs">
            {isChunkError 
              ? 'A newer version of TradePigeon was deployed. Click refresh to load the latest release.'
              : String(this.state.error?.message || this.state.error)
            }
          </div>
          {!isChunkError && (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={this.handleCopyDiagnostic}
                className="px-2.5 py-1 rounded-lg bg-[#14203E] border border-[#20325C] hover:border-slate-400 text-[10px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                {this.state.copied ? '✓ Copied Crash Log' : 'Copy Crash Log'}
              </button>
              <button
                onClick={downloadDiagnosticReport}
                className="px-2.5 py-1 rounded-lg bg-[#14203E] border border-[#20325C] hover:border-[#1CB0F6] text-[10px] font-bold text-[#1CB0F6] hover:text-white transition-all cursor-pointer"
              >
                Download Diagnostics (.json)
              </button>
            </div>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [googleUser, setGoogleUser] = useState(() => {
    const saved = loadStoredData(STORAGE_KEYS.AUTH_USER, null);
    if (saved && (saved.email === 'trader@tradepigeon.com' || saved.email === 'alex.trader@gmail.com' || saved.name === 'Trader')) {
      saveStoredData(STORAGE_KEYS.AUTH_USER, null);
      return null;
    }
    return saved;
  });
  const [showLanding, setShowLanding] = useState(() => {
    const user = loadStoredData(STORAGE_KEYS.AUTH_USER, null);
    return !user;
  });

  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdate(({ key, value }) => {
      if (key === STORAGE_KEYS.AUTH_USER || key === 'tradepigeon_google_user') {
        setGoogleUser(value);
        if (value && value.email) {
          setShowLanding(false);
        } else {
          setShowLanding(true);
        }
      }
    });
    return unsubscribe;
  }, []);

  const [activeTab, setActiveTab] = useState('learn');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    const user = loadStoredData(STORAGE_KEYS.AUTH_USER, null);
    const isCompleted = loadStoredData(STORAGE_KEYS.ONBOARDING_COMPLETED, false);
    return !!user && !isCompleted;
  });
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [isMobileRightHubOpen, setIsMobileRightHubOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isManualTradeOpen, setIsManualTradeOpen] = useState(false);
  const [latestTradeAlert, setLatestTradeAlert] = useState(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Any screen can open the single trade importer.
  useEffect(() => {
    const open = () => setIsImportOpen(true);
    window.addEventListener('tradepigeon_open_import', open);
    return () => window.removeEventListener('tradepigeon_open_import', open);
  }, []);
  const [paywallFeature, setPaywallFeature] = useState('');

  // Global listener for paywall triggers across all tabs and modals
  useEffect(() => {
    const handleOpenPaywall = (e) => {
      setPaywallFeature(e?.detail?.feature || '');
      setIsPaywallOpen(true);
    };
    window.addEventListener('tradepigeon_open_paywall', handleOpenPaywall);
    return () => window.removeEventListener('tradepigeon_open_paywall', handleOpenPaywall);
  }, []);

  // Real-Time mascot coaching telemetry alert listener
  useEffect(() => {
    const handleTradeAlert = (e) => {
      if (e?.detail) {
        setLatestTradeAlert(e.detail);
      }
    };
    window.addEventListener('tradepigeon_new_trade_alert', handleTradeAlert);
    window.addEventListener('goodtrader_new_trade_alert', handleTradeAlert);

    const unsubscribe = subscribeToStorageUpdate(({ key, value }) => {
      if (key === 'tradepigeon_active_trade_alert' && value) {
        setLatestTradeAlert(value);
      }
    });

    return () => {
      window.removeEventListener('tradepigeon_new_trade_alert', handleTradeAlert);
      window.removeEventListener('goodtrader_new_trade_alert', handleTradeAlert);
      unsubscribe();
    };
  }, []);

  // Handle Stripe Checkout return URLs (cryptographically verify session before activating Pro)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const status = params.get('status') || params.get('payment');

    if (!sessionId) {
      if (status === 'success' || params.get('checkout') === 'success') {
        console.warn('[TradePigeon Security] Unverified payment return: missing session_id.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      return;
    }

    const verifySession = async () => {
      try {
        const entitlement = await refreshProStatus();
        if (entitlement?.isPro && entitlement.source === 'stripe') {
          soundFx.playTrophy();
          setConfettiTrigger(prev => prev + 1);
        }
      } finally {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    verifySession();
  }, []);

  // Automatically close right drawer & expanded overlay whenever active tab changes
  useEffect(() => {
    setIsMobileRightHubOpen(false);
    setIsCalendarExpanded(false);
  }, [activeTab]);

  // Top 1% App Fine Detail: Global Keyboard Shortcuts Engine
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore keypresses if inside text inputs or textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }

      const key = e.key;

      // Escape key closes modals, drawers and expanded overlays
      if (key === 'Escape') {
        setIsShortcutsOpen(false);
        setIsManualTradeOpen(false);
        setIsMobileRightHubOpen(false);
        setIsCalendarExpanded(false);
      }

      // Hotkey '?' or Shift+'/' opens Shortcuts HUD
      if (key === '?' || (e.shiftKey && key === '?')) {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
        soundFx.playPop();
        return;
      }

      // Hotkey 'M' or 'N' opens Manual Trade Entry Modal
      if (key === 'm' || key === 'M' || key === 'n' || key === 'N') {
        e.preventDefault();
        setIsManualTradeOpen(true);
        soundFx.playPop();
        return;
      }

      // Hotkey 'D' navigates to Daily Mindset & Debrief
      if (key === 'd' || key === 'D') {
        setActiveTab('learn');
        soundFx.playPop();
        return;
      }

      // Hotkey 'S' toggles Sound FX on/off
      if (key === 's' || key === 'S') {
        soundFx.toggleMute();
        return;
      }

      // Number key tab switcher (1-5)
      if (key === '1') { setActiveTab('learn'); soundFx.playPop(); }
      else if (key === '2') { setActiveTab('calendar'); soundFx.playPop(); }
      else if (key === '3') { setActiveTab('setups'); soundFx.playPop(); }
      else if (key === '4') { setActiveTab('connections'); soundFx.playPop(); }
      else if (key === '5') { setActiveTab('profile'); soundFx.playPop(); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEnterApp = (passedUser) => {
    const currentUser = (passedUser && typeof passedUser === 'object' && passedUser.email) 
      ? passedUser 
      : loadStoredData(STORAGE_KEYS.AUTH_USER, null);

    if (!currentUser || typeof currentUser !== 'object' || !currentUser.email) {
      // Stay on landing page until user selects account or submits login form
      return;
    }

    setGoogleUser(currentUser);
    saveStoredData(STORAGE_KEYS.AUTH_USER, currentUser);
    saveStoredData('tradepigeon_visited_landing', true);
    setShowLanding(false);
    setConfettiTrigger(Date.now());
    soundFx.playLevelUp();
    
    // Check if user needs onboarding calibration
    const isCompleted = loadStoredData(STORAGE_KEYS.ONBOARDING_COMPLETED, false);
    if (!isCompleted) {
      setIsOnboardingOpen(true);
    }
  };

  const handleOnboardingComplete = (data) => {
    saveStoredData(STORAGE_KEYS.ONBOARDING_COMPLETED, true);
    saveStoredData('tradepigeon_active_step', 1);

    // Auto-generate customized Playbook setups based on trader's onboarding methodology & strategy name
    const customizedPlaybooks = buildDefaultPlaybooks(data?.tradingStyle, data?.strategyName);
    saveStoredData('tradepigeon_playbook_setups', customizedPlaybooks);

    if (data?.connectedBroker) {
      const existingAccounts = loadStoredData('tradepigeon_accounts_data', []);
      const brokerId = data.connectedBroker.id || data.connectedBroker.accountNumber || data.connectedBroker.name;
      const alreadyExists = existingAccounts.some(acc => (acc.id || acc.accountNumber || acc.name) === brokerId);
      if (!alreadyExists) {
        saveStoredData('tradepigeon_accounts_data', [data.connectedBroker, ...existingAccounts]);
      }
    }

    if (data?.importedTrades && data.importedTrades.length > 0) {
      const existingSetups = loadStoredData('tradepigeon_setups', []);
      saveStoredData('tradepigeon_setups', [...data.importedTrades, ...existingSetups]);
    }

    if (data?.maxDailyLoss) {
      saveStoredData('tradepigeon_max_daily_loss', data.maxDailyLoss);
    }
    if (data?.riskType) {
      saveStoredData('tradepigeon_risk_type', data.riskType);
    }

    setIsOnboardingOpen(false);
    setActiveTab('learn'); // Main Daily Protocol Path (Step 1: Mindset Check)!
    soundFx.playSuccess();
  };

  if (showLanding || !googleUser) {
    return (
      <LandingPage 
        onGetStarted={handleEnterApp} 
        onLogin={handleEnterApp} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070C1E] flex flex-col font-sans antialiased text-white selection:bg-[#FF6B00] selection:text-white">
      {/* REAL-TIME NETWORK CONNECTIVITY & OFFLINE BANNER */}
      <NetworkStatusBanner />

      {/* GLOBAL PERMANENT DUOLINGO TOP STAT BAR (VISIBLE ON ALL TABS / MOBILE & DESKTOP) */}
      <TopStatBar 
        onOpenRulesModal={() => setIsMobileRightHubOpen(true)} 
        onNavigateTab={setActiveTab}
      />

      <div className="flex flex-1 relative">
        {/* 1. LEFT SIDEBAR NAVIGATION RAIL */}
        <SidebarNav 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onToggleLanding={() => setShowLanding(true)}
          onOpenCalendar={() => setIsMobileRightHubOpen(true)} 
        />

      {/* 2. TAB SWITCHER CONTENT */}
      <ErrorBoundary>
        <Suspense fallback={<TabLoadingFallback />}>
          {activeTab === 'calendar' && <CalendarTab />}
          {(activeTab === 'learn' || activeTab === 'path') && <CenterPath />}
          {activeTab === 'setups' && <SetupsTab />}
          {activeTab === 'connections' && <ConnectionsTab />}
          {activeTab === 'leaderboard' && <ComingSoon title="Leaderboard" line="Compete on discipline with real traders. We'll open it once there are enough of you." />}
          {activeTab === 'quests' && <ComingSoon title="Quests" line="Daily discipline challenges with rewards." />}
          {activeTab === 'shop' && <ComingSoon title="Shop" line="Spend the points you earn for discipline." />}
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'status' && (
            <main className="flex-1 min-h-screen lg:pl-28 xl:pl-80 bg-[#070C1E] p-4 sm:p-6 lg:p-8 text-white space-y-8 pb-24 lg:pb-10 max-w-5xl mx-auto overflow-y-auto custom-scrollbar">
              <RightStatusHub isInPage={true} />
            </main>
          )}
        </Suspense>
      </ErrorBoundary>

      {/* 3. RIGHT STATUS & EXPANDABLE CALENDAR HUB */}
      {activeTab !== 'calendar' && activeTab !== 'learn' && activeTab !== 'path' && activeTab !== 'status' && activeTab !== 'connections' && (
        <ErrorBoundary>
          <RightStatusHub 
            isExpanded={isCalendarExpanded} 
            onToggleExpand={() => setIsCalendarExpanded(!isCalendarExpanded)}
            isMobileOpen={isMobileRightHubOpen}
            onCloseMobile={() => setIsMobileRightHubOpen(false)}
            onOpenCalendarTab={() => setActiveTab('calendar')}
          />
        </ErrorBoundary>
      )}

      {/* 4. ONBOARDING CALIBRATION MODAL */}
      <ErrorBoundary>
        <OnboardingModal 
          isOpen={isOnboardingOpen} 
          onComplete={handleOnboardingComplete} 
        />
      </ErrorBoundary>

      {/* 5. REAL-TIME TELEMETRY COMPANION ALERT */}
      <ErrorBoundary>
        <RealTimeCompanionToast 
          latestTrade={latestTradeAlert}
          latestAlert={latestTradeAlert} 
          onDismiss={() => setLatestTradeAlert(null)}
          onClose={() => setLatestTradeAlert(null)} 
        />
      </ErrorBoundary>

      {/* 6. TOP 1% CELEBRATION CONFETTI ENGINE */}
      <ConfettiBurst triggerKey={confettiTrigger} />

      {/* 7. GLOBAL POWER-TRADER KEYBOARD SHORTCUTS HUD */}
      <KeyboardShortcutsModal 
        isOpen={isShortcutsOpen} 
        onClose={() => setIsShortcutsOpen(false)} 
      />

      {/* 8. GLOBAL QUICK MANUAL TRADE MODAL (HOTKEY 'M') */}
      <ManualTradeModal 
        isOpen={isManualTradeOpen} 
        onClose={() => setIsManualTradeOpen(false)} 
      />

      <ErrorBoundary>
        <StatementImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onSuccess={() => setIsImportOpen(false)} />
      </ErrorBoundary>

      {/* 9. PRO PAYWALL MODAL */}
      <ErrorBoundary>
        <ProPaywallModal 
          isOpen={isPaywallOpen} 
          onClose={() => setIsPaywallOpen(false)} 
          featureName={paywallFeature} 
        />
      </ErrorBoundary>
      </div>
    </div>
  );
}
