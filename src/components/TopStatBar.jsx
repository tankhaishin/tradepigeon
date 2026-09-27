import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { DuoStarIcon, DuoLightningIcon, DuoGemIcon, DuoShieldIcon } from './DuoIcons';
import { soundFx } from '../utils/audioEngine';
import { loadStoredData, subscribeToStorageUpdate, DEFAULT_USER_STATS } from '../utils/storage';

export default function TopStatBar({ onOpenRulesModal, onNavigateTab }) {
  const [stats, setStats] = useState(() => loadStoredData('tradepigeon_user_stats', DEFAULT_USER_STATS));
  const [activeUser, setActiveUser] = useState(() => loadStoredData('tradepigeon_auth_user', null) || loadStoredData('tradepigeon_google_user', null));

  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdate(({ key, legacyKey, value }) => {
      if (key === 'tradepigeon_user_stats') {
        setStats(value || DEFAULT_USER_STATS);
      }
      if (key === 'tradepigeon_auth_user' || key === 'tradepigeon_google_user' || legacyKey === 'tradepigeon_google_user') {
        setActiveUser(value);
      }
    });
    return unsubscribe;
  }, []);

  const formatPoints = (num) => {
    if (!num || num === 0) return '0';
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <header className="lg:hidden sticky top-0 z-40 w-full bg-[#131F24]/95 backdrop-blur-md px-3 sm:px-4 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Item 1: Level / Stars -> Quests */}
        <button 
          type="button"
          onClick={() => {
            soundFx.playPop();
            if (typeof onNavigateTab === 'function') onNavigateTab('quests');
          }}
          className="flex items-center justify-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all" 
          title={`Trader Level ${stats.level || 1} — View Quests & Milestones`}
        >
          <DuoStarIcon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 drop-shadow-md" />
          <span className="text-sm sm:text-base font-black text-white">{stats.level || 1}</span>
        </button>

        {/* Item 2: Streak Flame -> Leaderboard */}
        <button 
          type="button"
          onClick={() => {
            soundFx.playPop();
            if (typeof onNavigateTab === 'function') onNavigateTab('leaderboard');
          }}
          className="flex items-center justify-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all" 
          title={`Discipline Streak: ${stats.streakDays || 0} Consecutive Sessions — View Personal League`}
        >
          <DuoLightningIcon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 drop-shadow-md" />
          <span className="text-sm sm:text-base font-black text-[#FF6B00]">{stats.streakDays || 0}</span>
        </button>

        {/* Item 3: Gems / DP -> Shop */}
        <button 
          type="button"
          onClick={() => {
            soundFx.playPop();
            if (typeof onNavigateTab === 'function') onNavigateTab('shop');
          }}
          className="flex items-center justify-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all" 
          title={`Discipline Points: ${stats.disciplinePoints || 0} DP — Visit Duolingo Shop`}
        >
          <DuoGemIcon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 drop-shadow-md" />
          <span className="text-sm sm:text-base font-black text-[#1CB0F6]">{formatPoints(stats.disciplinePoints)}</span>
        </button>

        {/* Item 4: Disciplined Trades -> Cockpit */}
        <button 
          type="button"
          onClick={() => {
            soundFx.playPop();
            if (typeof onOpenRulesModal === 'function') {
              onOpenRulesModal();
            } else if (typeof onNavigateTab === 'function') {
              onNavigateTab('status');
            }
          }}
          className="flex items-center justify-center gap-1.5 hover:scale-105 cursor-pointer transition-all active:scale-95"
          title={`Disciplined Trades: ${stats.tradesLogged || 0} Taken — Open Cockpit`}
        >
          <DuoShieldIcon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 drop-shadow-md" />
          <span className="text-sm sm:text-base font-black text-[#58CC02]">{stats.tradesLogged || 0}</span>
        </button>

        {/* Item 5: Profile / Settings */}
        <button 
          type="button"
          onClick={() => {
            soundFx.playPop();
            if (typeof onNavigateTab === 'function') onNavigateTab('profile');
          }}
          className="flex items-center justify-center hover:scale-105 cursor-pointer transition-all active:scale-95 shrink-0 relative"
          title={activeUser?.email ? "Trader Profile (Cloud Synced)" : "Trader Profile (Local Storage — Sign in to sync)"}
        >
          {activeUser?.picture ? (
            <img
              src={activeUser.picture}
              alt={activeUser.name || 'Profile'}
              className="w-7 h-7 rounded-xl object-cover border-2 border-[#FF6B00] shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="w-7 h-7 rounded-xl bg-[#1C2A4E] border-2 border-[#FF6B00] flex items-center justify-center shrink-0 text-white font-black text-xs">
              {activeUser?.name ? activeUser.name.charAt(0).toUpperCase() : <User size={14} className="text-[#FF6B00]" />}
            </div>
          )}
          {activeUser?.email ? (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#58CC02] border border-[#131F24] shadow-sm animate-pulse" title="Cloud Synced" />
          ) : (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border border-[#131F24] shadow-sm" title="Local Storage" />
          )}
        </button>
      </div>
    </header>
  );
}
