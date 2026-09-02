import React from 'react';
import { DuoStarIcon, DuoLightningIcon, DuoGemIcon, DuoShieldIcon } from './DuoIcons';
import { soundFx } from '../utils/audioEngine';

export default function TopStatBar({ onOpenRulesModal }) {
  return (
    <header className="lg:hidden sticky top-0 z-40 w-full bg-[#131F24]/95 backdrop-blur-md px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between gap-4">
        {/* Item 1: Season / Day Level Badge */}
        <div 
          className="flex items-center justify-center gap-2 cursor-pointer hover:scale-105 transition-transform" 
          title="Season 1 Protocol Day 30"
        >
          <DuoStarIcon className="w-6 h-6 shrink-0 drop-shadow-md" />
          <span className="text-sm sm:text-base font-black text-white">30</span>
        </div>

        {/* Item 2: Streak Flame */}
        <div 
          className="flex items-center justify-center gap-2 cursor-pointer hover:scale-105 transition-transform" 
          title="Discipline Streak: 14 Consecutive Days"
        >
          <DuoLightningIcon className="w-6 h-6 shrink-0 drop-shadow-md" />
          <span className="text-sm sm:text-base font-black text-[#FF6B00]">14</span>
        </div>

        {/* Item 3: Gems / DP */}
        <div 
          className="flex items-center justify-center gap-2 cursor-pointer hover:scale-105 transition-transform" 
          title="Discipline Points: 3,420 DP"
        >
          <DuoGemIcon className="w-6 h-6 shrink-0 drop-shadow-md" />
          <span className="text-sm sm:text-base font-black text-[#1CB0F6]">3.4k</span>
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
          title="Disciplined Trades: 16 Trades Taken (Click for breakdown)"
        >
          <DuoShieldIcon className="w-6 h-6 shrink-0 drop-shadow-md" />
          <span className="text-sm sm:text-base font-black text-[#58CC02]">16</span>
        </button>
      </div>
    </header>
  );
}
