import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, LifeBuoy, LogOut, Volume2, VolumeX, User } from 'lucide-react';
import { DuoHomeIcon, DuoShieldIcon, DuoChestIcon, DuoShopIcon, DuoProfileIcon, DuoTrophyIcon, DuoCalendarIcon, DuoLightningIcon, DuoBookIcon } from './DuoIcons';
import SupportFeedbackModal from './SupportFeedbackModal';
import GuidebookModal from './GuidebookModal';
import LegalModal from './LegalModal';
import ComingSoonModal from './ComingSoonModal';
import AuthModal from './AuthModal';
import { useAuth } from '../context/AuthContext';
import { loadStoredData, saveStoredData, subscribeToStorageUpdate } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';

export default function SidebarNav({ activeTab, setActiveTab, onToggleLanding, onOpenCalendar }) {
  const { user, signOutUser } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isLegalTermsOpen, setIsLegalTermsOpen] = useState(false);
  const [isLegalPrivacyOpen, setIsLegalPrivacyOpen] = useState(false);
  const [isGuidebookOpen, setIsGuidebookOpen] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState(null);
  const [isStealthMode, setIsStealthMode] = useState(() => loadStoredData('tradepigeon_stealth_mode', false));
  const [isMuted, setIsMuted] = useState(() => soundFx.isMuted);
  const [googleUser, setGoogleUser] = useState(() => loadStoredData('tradepigeon_google_user', null));

  const activeUser = user ? {
    name: user.displayName || (user.email ? user.email.split('@')[0] : 'Trader'),
    email: user.email,
    picture: user.photoURL
  } : googleUser;

  const toggleSound = () => {
    const next = soundFx.toggleMute();
    setIsMuted(next);
    if (!next) soundFx.playPop();
  };

  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdate(({ key, value }) => {
      if (key === 'tradepigeon_google_user') {
        setGoogleUser(value);
      }
      if (key === 'tradepigeon_stealth_mode') {
        setIsStealthMode(value);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    soundFx.playPop();
    if (window.confirm('Are you sure you want to log out of TradePigeon?')) {
      try {
        await signOutUser();
      } catch (err) {
        console.error('Sign out error:', err);
      }
      saveStoredData('tradepigeon_google_user', null);
      if (onToggleLanding) onToggleLanding();
    }
  };

  const toggleStealthMode = () => {
    soundFx.playPop();
    const next = !isStealthMode;
    setIsStealthMode(next);
    saveStoredData('tradepigeon_stealth_mode', next);
  };

  const navItems = [
    { id: 'learn', label: 'PROTOCOL', icon: <DuoHomeIcon className="w-8 h-8" />, comingSoon: false },
    { id: 'calendar', label: 'CALENDAR', icon: <DuoCalendarIcon className="w-8 h-8" />, comingSoon: false },
    { id: 'setups', label: 'PLAYBOOK', icon: <DuoBookIcon className="w-8 h-8" />, comingSoon: false },
    { id: 'connections', label: 'CONNECTIONS', icon: <DuoLightningIcon className="w-8 h-8" />, comingSoon: false },
    { id: 'leaderboard', label: 'LEADERBOARD', icon: <DuoTrophyIcon className="w-8 h-8" />, comingSoon: false },
    { id: 'quests', label: 'QUESTS', icon: <DuoChestIcon className="w-8 h-8" />, comingSoon: false },
    { id: 'shop', label: 'SHOP', icon: <DuoShopIcon className="w-8 h-8" />, comingSoon: false },
    { id: 'profile', label: 'PROFILE', icon: <DuoProfileIcon className="w-8 h-8" />, comingSoon: false },
  ];

  return (
    <>
      {/* DESKTOP LEFT SIDEBAR (Icon-only Rail on lg:, Full Expanded on xl:) */}
      <aside className="hidden lg:flex w-20 xl:w-72 h-screen fixed left-0 top-0 bg-[#070C1E] border-r-2 border-[#1C2A4E] flex-col justify-between p-3 xl:p-6 z-40 transition-all duration-300">
        <div className="space-y-6">
          {/* Brand Logo Header */}
          <div 
            onClick={onToggleLanding} 
            className="flex items-center justify-center xl:justify-start gap-3 px-1 xl:px-2 cursor-pointer hover:opacity-80 transition-opacity"
            title="TradePigeon — Click to view Landing Page"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#0D1635] overflow-hidden border-2 border-[#FF6B00] border-b-4 border-b-[#C2410C] flex items-center justify-center shrink-0 shadow-md mx-auto xl:mx-0">
              <img src="/parrot_logo.png" alt="TradePigeon Logo" className="w-full h-full object-cover" />
            </div>
            <div className="hidden xl:block">
              <h1 className="text-xl font-black tracking-tight text-white leading-none">TRADEPIGEON</h1>
            </div>
          </div>

          {/* Vertical Nav Links */}
          <nav className="space-y-3">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.comingSoon) {
                      setComingSoonFeature(item.label);
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  title={item.comingSoon ? `${item.label} (Coming Soon in Phase 2)` : item.label}
                  className={`w-12 h-12 xl:w-full xl:h-auto flex items-center justify-center xl:justify-between p-0 xl:px-4 xl:py-3.5 rounded-2xl font-black text-xs tracking-wider transition-all cursor-pointer border-2 mx-auto ${
                    item.comingSoon
                      ? 'opacity-40 grayscale hover:opacity-80 border-transparent text-[#52656D] hover:bg-[#182830]'
                      : isActive
                      ? 'bg-[#FF6B00] border-[#C2410C] border-b-4 border-b-[#9A3412] text-white shadow-lg'
                      : 'border-transparent text-[#52656D] hover:bg-[#182830] hover:text-white hover:border-[#2B3D47] hover:scale-105'
                  }`}
                >
                  <div className="flex items-center justify-center gap-4 w-full xl:w-auto">
                    <div className="shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">{item.icon}</div>
                    <span className="hidden xl:inline">{item.label}</span>
                  </div>
                  {item.comingSoon && (
                    <span className="hidden xl:inline text-[9px] font-black uppercase bg-[#20323D] text-[#FF6B00] border border-[#FF6B00]/30 px-1.5 py-0.5 rounded-md shrink-0">
                      SOON
                    </span>
                  )}
                </button>
              );
            })}

          </nav>
        </div>

        {/* Footer Bottom Lock, Legal & Support Trigger */}
        <div className="space-y-2">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
            <button
              onClick={toggleStealthMode}
              className={`w-full flex items-center justify-center gap-2 p-3 xl:px-3 rounded-2xl border transition-all cursor-pointer shadow-sm text-xs font-black ${
                isStealthMode
                  ? 'bg-[#FF6B00]/15 border-[#FF6B00]/40 text-[#FF6B00]'
                  : 'bg-[#182830] border-[#20323D] text-slate-300 hover:text-white'
              }`}
              title={isStealthMode ? 'Stealth Mode Active — PnL in R-Multiples' : 'Dollar View Active — PnL in USD'}
            >
              {isStealthMode ? <EyeOff size={16} className="shrink-0" /> : <Eye size={16} className="shrink-0" />}
              <span className="hidden xl:inline">{isStealthMode ? 'Stealth' : 'Values'}</span>
            </button>

            <button
              onClick={toggleSound}
              className={`w-full flex items-center justify-center gap-2 p-3 xl:px-3 rounded-2xl border transition-all cursor-pointer shadow-sm text-xs font-black ${
                isMuted
                  ? 'bg-[#182830] border-[#20323D] text-slate-500 hover:text-slate-300'
                  : 'bg-[#58CC02]/15 border-[#58CC02]/40 text-[#58CC02]'
              }`}
              title={isMuted ? 'Sound FX Muted — Click to Enable' : 'Sound FX Active — Click to Mute'}
            >
              {isMuted ? <VolumeX size={16} className="shrink-0" /> : <Volume2 size={16} className="shrink-0" />}
              <span className="hidden xl:inline">{isMuted ? 'Muted' : 'Sound'}</span>
            </button>
          </div>

          <button
            onClick={() => setIsGuidebookOpen(true)}
            className="w-full flex items-center justify-center xl:justify-start gap-3 p-3 xl:px-4 rounded-2xl bg-[#1CB0F6]/15 hover:bg-[#1CB0F6]/25 border border-[#1CB0F6]/40 text-xs font-black text-[#1CB0F6] hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <DuoBookIcon className="w-5 h-5 shrink-0" />
            <span className="hidden xl:inline">Guidebook</span>
          </button>

          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="w-full flex items-center justify-center xl:justify-start gap-3 p-3 xl:px-4 rounded-2xl bg-[#182830] hover:bg-[#20323D] border border-[#20323D] text-xs font-black text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <LifeBuoy size={18} className="shrink-0" />
            <span className="hidden xl:inline">Help & Feedback</span>
          </button>

          {/* User Account & Prominent Auth Controls */}
          <div className="pt-2 border-t border-[#1C2A4E] space-y-2">
            {activeUser ? (
              <>
                <div 
                  onClick={() => setActiveTab('profile')}
                  className="hidden xl:flex items-center gap-3 p-2 bg-[#0D1635] hover:bg-[#131F42] rounded-2xl border border-[#1C2A4E] cursor-pointer transition-all"
                  title="View Profile Settings"
                >
                  <img
                    src={activeUser.picture || '/parrot_logo.png'}
                    alt={activeUser.name || 'Trader'}
                    className="w-8 h-8 rounded-xl object-cover border border-[#FF6B00] shrink-0"
                    onError={(e) => { e.target.src = '/parrot_logo.png'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-white truncate">{activeUser.name || 'Trader'}</div>
                    <div className="text-[10px] font-bold text-slate-400 truncate">{activeUser.email || 'trader@tradepigeon.com'}</div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center xl:justify-start gap-3 p-3 xl:px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border-2 border-rose-500/30 hover:border-rose-500 border-b-4 border-b-rose-700/60 text-xs font-black text-rose-400 hover:text-rose-200 transition-all cursor-pointer shadow-sm active:translate-y-0.5"
                  title="Sign Out of TradePigeon"
                >
                  <LogOut size={18} className="shrink-0 text-rose-400" />
                  <span className="hidden xl:inline">Log Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  soundFx.playPop();
                  setIsAuthModalOpen(true);
                }}
                className="w-full flex items-center justify-center xl:justify-start gap-3 p-3 xl:px-4 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] border-2 border-[#46A302] border-b-4 border-b-[#347A01] text-xs font-black text-white transition-all cursor-pointer shadow-md active:translate-y-0.5"
                title="Sign In or Create Account to Sync Data Across Devices"
              >
                <User size={18} className="shrink-0 text-white" />
                <span className="hidden xl:inline">Sign In / Sync</span>
              </button>
            )}
          </div>

          {/* Legal Compliance Footer Links (XL screen only) */}
          <div className="hidden xl:flex items-center justify-center gap-3 text-[10px] font-bold text-[#52656D] pt-1">
            <button onClick={() => setIsLegalTermsOpen(true)} className="hover:text-slate-300 underline cursor-pointer">
              Terms & CFTC 4.41
            </button>
            <span>&bull;</span>
            <button onClick={() => setIsLegalPrivacyOpen(true)} className="hover:text-slate-300 underline cursor-pointer">
              Privacy
            </button>
          </div>
        </div>
      </aside>

      <GuidebookModal
        isOpen={isGuidebookOpen}
        onClose={() => setIsGuidebookOpen(false)}
      />

      <SupportFeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
      />

      <LegalModal
        isOpen={isLegalTermsOpen}
        onClose={() => setIsLegalTermsOpen(false)}
        documentType="TERMS"
      />

      <LegalModal
        isOpen={isLegalPrivacyOpen}
        onClose={() => setIsLegalPrivacyOpen(false)}
        documentType="PRIVACY"
      />

      <ComingSoonModal
        isOpen={Boolean(comingSoonFeature)}
        onClose={() => setComingSoonFeature(null)}
        featureName={comingSoonFeature || 'Feature'}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* MOBILE BOTTOM NAVIGATION BAR (Ultra-Clean 5-Tab Native Mobile Architecture) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#070C1E] border-t-2 border-[#1C2A4E] flex items-center justify-around px-2 z-50 shadow-2xl">
        {navItems
          .filter((item) => ['learn', 'calendar', 'setups', 'connections'].includes(item.id))
          .map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
                  isActive ? 'text-[#FF6B00] scale-110' : 'text-[#52656D] hover:text-white'
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center">{item.icon}</div>
                <span className="text-[10px] font-black tracking-wider mt-0.5">{item.label}</span>
              </button>
            );
          })}

        {/* Mobile Session Cockpit Page Trigger */}
        <button
          onClick={() => setActiveTab('status')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'status' ? 'text-[#FF6B00] scale-110' : 'text-[#1CB0F6] hover:text-white'
          }`}
          title="View Session Cockpit & Discipline Hub"
        >
          <DuoShieldIcon className="w-6 h-6" />
          <span className="text-[10px] font-black tracking-wider mt-0.5">COCKPIT</span>
        </button>
      </nav>
    </>
  );
}
