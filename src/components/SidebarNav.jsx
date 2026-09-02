import React, { useState } from 'react';
import { Eye, EyeOff, LifeBuoy } from 'lucide-react';
import { DuoHomeIcon, DuoShieldIcon, DuoChestIcon, DuoShopIcon, DuoProfileIcon, DuoTrophyIcon, DuoCalendarIcon, DuoLightningIcon, DuoBookIcon } from './DuoIcons';
import SupportFeedbackModal from './SupportFeedbackModal';
import GuidebookModal from './GuidebookModal';
import LegalModal from './LegalModal';
import ComingSoonModal from './ComingSoonModal';
import { loadStoredData, saveStoredData } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';

export default function SidebarNav({ activeTab, setActiveTab, onToggleLanding, onOpenCalendar }) {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isLegalTermsOpen, setIsLegalTermsOpen] = useState(false);
  const [isLegalPrivacyOpen, setIsLegalPrivacyOpen] = useState(false);
  const [isGuidebookOpen, setIsGuidebookOpen] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState(null);
  const [isStealthMode, setIsStealthMode] = useState(() => loadStoredData('goodtrader_stealth_mode', false));

  const toggleStealthMode = () => {
    soundFx.playPop();
    const next = !isStealthMode;
    setIsStealthMode(next);
    saveStoredData('goodtrader_stealth_mode', next);
  };

  const navItems = [
    { id: 'learn', label: 'PROTOCOL', icon: <DuoHomeIcon className="w-8 h-8" />, comingSoon: false },
    { id: 'calendar', label: 'CALENDAR', icon: <DuoCalendarIcon className="w-8 h-8" />, comingSoon: false },
    { id: 'setups', label: 'PLAYBOOK', icon: <DuoBookIcon className="w-8 h-8" />, comingSoon: false },
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
          <button
            onClick={toggleStealthMode}
            className={`w-full flex items-center justify-center xl:justify-start gap-3 p-3 xl:px-4 rounded-2xl border transition-all cursor-pointer shadow-sm text-xs font-black ${
              isStealthMode
                ? 'bg-[#FF6B00]/15 border-[#FF6B00]/40 text-[#FF6B00]'
                : 'bg-[#182830] border-[#20323D] text-slate-300 hover:text-white'
            }`}
            title={isStealthMode ? 'Process-First Stealth Mode (Active) — Currency hidden' : 'Currency Mode Active — Click to switch to R-Only Stealth Mode'}
          >
            {isStealthMode ? <EyeOff size={18} className="shrink-0" /> : <Eye size={18} className="shrink-0" />}
            <span className="hidden xl:inline">{isStealthMode ? 'Stealth Mode (R-Only)' : 'Currency ($) Mode'}</span>
          </button>

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

      {/* MOBILE BOTTOM NAVIGATION BAR (Ultra-Clean 4-Tab Native Mobile Architecture) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#070C1E] border-t-2 border-[#1C2A4E] flex items-center justify-around px-4 z-50 shadow-2xl">
        {navItems
          .filter((item) => ['learn', 'calendar', 'setups'].includes(item.id))
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
