import React, { useState, useEffect } from 'react';
import SidebarNav from './components/SidebarNav';
import CenterPath from './components/CenterPath';
import SetupsTab from './components/SetupsTab';
import LeaderboardTab from './components/LeaderboardTab';
import QuestsTab from './components/QuestsTab';
import ShopTab from './components/ShopTab';
import ProfileTab from './components/ProfileTab';
import CalendarTab from './components/CalendarTab';
import RightStatusHub from './components/RightStatusHub';
import OnboardingModal from './components/OnboardingModal';
import TopStatBar from './components/TopStatBar';
import RealTimeCompanionToast from './components/RealTimeCompanionToast';
import LandingPage from './components/LandingPage';
import ConfettiBurst from './components/ConfettiBurst';
import { loadStoredData, saveStoredData, STORAGE_KEYS } from './utils/storage';
import { soundFx } from './utils/audioEngine';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[GoodTrader ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-rose-900/95 text-white rounded-2xl border-2 border-rose-500 text-xs font-mono max-w-sm m-4 z-50 fixed right-4 top-4 shadow-2xl space-y-2 animate-fade-in">
          <div className="flex items-center justify-between gap-2">
            <div className="font-bold text-rose-200 uppercase">Component Load Warning</div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="text-[10px] font-black uppercase bg-rose-700 hover:bg-rose-600 px-2.5 py-1 rounded-lg text-white cursor-pointer transition-all border border-rose-400"
            >
              Dismiss & Retry
            </button>
          </div>
          <div>{String(this.state.error?.message || this.state.error)}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [googleUser, setGoogleUser] = useState(() => loadStoredData('goodtrader_google_user', null));
  const [showLanding, setShowLanding] = useState(() => {
    const user = loadStoredData('goodtrader_google_user', null);
    return !user;
  });

  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdate(({ key, value }) => {
      if (key === 'goodtrader_google_user') {
        setGoogleUser(value);
        if (!value) {
          setShowLanding(true);
        }
      }
    });
    return unsubscribe;
  }, []);

  const [activeTab, setActiveTab] = useState('learn');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [isMobileRightHubOpen, setIsMobileRightHubOpen] = useState(false);
  const [latestTradeAlert, setLatestTradeAlert] = useState(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);

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

      // Number key tab switcher (1-4)
      if (key === '1') { setActiveTab('learn'); soundFx.playPop(); }
      else if (key === '2') { setActiveTab('calendar'); soundFx.playPop(); }
      else if (key === '3') { setActiveTab('setups'); soundFx.playPop(); }
      else if (key === '4') { setActiveTab('profile'); soundFx.playPop(); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEnterApp = () => {
    let currentUser = googleUser;
    if (!currentUser) {
      currentUser = {
        name: 'Trader',
        email: 'trader@tradepigeon.com',
        picture: '/parrot_logo.png',
        sub: Date.now().toString(),
        authenticatedAt: new Date().toISOString()
      };
      saveStoredData('goodtrader_google_user', currentUser);
      setGoogleUser(currentUser);
    }

    saveStoredData('goodtrader_visited_landing', true);
    setShowLanding(false);
    setConfettiTrigger(Date.now());
    soundFx.playLevelUp();
    
    // Check if user needs onboarding calibration
    const isCompleted = loadStoredData(STORAGE_KEYS.ONBOARDING_COMPLETED, false);
    if (!isCompleted) {
      setIsOnboardingOpen(true);
    }
  };

  const handleOnboardingComplete = () => {
    saveStoredData(STORAGE_KEYS.ONBOARDING_COMPLETED, true);
    saveStoredData('goodtrader_active_step', 1);
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
      {/* GLOBAL PERMANENT DUOLINGO TOP STAT BAR (VISIBLE ON ALL TABS / MOBILE & DESKTOP) */}
      <TopStatBar onOpenRulesModal={() => setIsMobileRightHubOpen(true)} />

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
        {activeTab === 'calendar' && <CalendarTab />}
        {(activeTab === 'learn' || activeTab === 'path') && <CenterPath />}
        {activeTab === 'setups' && <SetupsTab />}
        {activeTab === 'leaderboard' && <LeaderboardTab />}
        {activeTab === 'quests' && <QuestsTab />}
        {activeTab === 'shop' && <ShopTab />}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'status' && (
          <main className="flex-1 min-h-screen lg:pl-28 xl:pl-80 bg-[#070C1E] p-4 sm:p-6 lg:p-8 text-white space-y-8 pb-24 lg:pb-10 max-w-5xl mx-auto overflow-hidden">
            <RightStatusHub isInPage={true} />
          </main>
        )}
      </ErrorBoundary>

      {/* 3. RIGHT STATUS & EXPANDABLE CALENDAR HUB */}
      {activeTab !== 'calendar' && activeTab !== 'learn' && activeTab !== 'path' && activeTab !== 'status' && (
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

      {/* 5. REAL-TIME TELEMETRY MASCOT COMPANION ALERT */}
      <ErrorBoundary>
        <RealTimeCompanionToast 
          latestAlert={latestTradeAlert} 
          onClose={() => setLatestTradeAlert(null)} 
        />
      </ErrorBoundary>

      {/* 6. TOP 1% CELEBRATION CONFETTI ENGINE */}
      <ConfettiBurst triggerKey={confettiTrigger} />
      </div>
    </div>
  );
}
