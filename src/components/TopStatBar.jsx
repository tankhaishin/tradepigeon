import React, { useState, useEffect } from 'react';
import { DuoStarIcon, DuoLightningIcon, DuoGemIcon, DuoShieldIcon } from './DuoIcons';
import { soundFx } from '../utils/audioEngine';
import { loadStoredData, subscribeToStorageUpdate, DEFAULT_USER_STATS } from '../utils/storage';

export default function TopStatBar({ onOpenRulesModal }) {
  const [stats, setStats] = useState(() => loadStoredData('goodtrader_user_stats', DEFAULT_USER_STATS));

  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdate(({ key, value }) => {
      if (key === 'goodtrader_user_stats') {
        setStats(value || DEFAULT_USER_STATS);
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
    <header className="lg:hidden sticky top-0 z-40 w-full bg-[#131F24]/95 backdrop-blur-md px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between gap-4">
        {/* Item 1: Level / Stars */}
        <div 
          className="flex items-center justify-center gap-2 cursor-pointer hover:scale-105 transition-transform" 
          title={`Trader Level ${stats.level || 1}`}
        >
          <DuoStarIcon className="w-6 h-6 shrink-0 drop-shadow-md" />
          <span className="text-sm sm:text-base font-black text-white">{stats.level || 1}</span>
        </div>

        {/* Item 2: Streak Flame */}
        <div 
          className="flex items-center justify-center gap-2 cursor-pointer hover:scale-105 transition-transform" 
          title={`Discipline Streak: ${stats.streakDays || 0} Days`}
        >
          <DuoLightningIcon className="w-6 h-6 shrink-0 drop-shadow-md" />
          <span className="text-sm sm:text-base font-black text-[#FF6B00]">{stats.streakDays || 0}</span>
        </div>

        {/* Item 3: Gems / DP */}
        <div 
          className="flex items-center justify-center gap-2 cursor-pointer hover:scale-105 transition-transform" 
          title={`Discipline Points: ${stats.disciplinePoints || 0} DP`}
        >
          <DuoGemIcon className="w-6 h-6 shrink-0 drop-shadow-md" />
          <span className="text-sm sm:text-base font-black text-[#1CB0F6]">{formatPoints(stats.disciplinePoints)}</span>
        </div>

        {/* Item 4: Disciplined Trades */}
        <button 
          onClick={() => {
            soundFx.playPop();
            if (typeof onOpenRulesModal === 'function') {
              onOpenRulesModal();
            }
          }}
          className="flex items-center justify-center gap-2 hover:scale-105 cursor-pointer transition-all active:scale-95"
          title={`Disciplined Trades: ${stats.tradesLogged || 0} Taken`}
        >
          <DuoShieldIcon className="w-6 h-6 shrink-0 drop-shadow-md" />
          <span className="text-sm sm:text-base font-black text-[#58CC02]">{stats.tradesLogged || 0}</span>
        </button>
      </div>
    </header>
  );
}
