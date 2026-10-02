import React from 'react';
import { habitSummary, habitHeadline } from '../utils/habitInsights';

// "Track discipline, not P&L": what the 7 labels are worth in money, plus how many trades still need a label.
export default function HabitHeadline({ trades, prefix, onLabelClick }) {
  const s = habitSummary(trades);
  const h = habitHeadline(s);
  if (!h && !s.needsLabel) return null;
  return (
    <div className="space-y-1.5">
      {h && (
        <div className={`px-3 py-2 rounded-xl text-xs font-bold border ${h.tone === 'good' ? 'bg-[#58CC02]/10 border-[#58CC02]/30 text-[#9BE15D]' : 'bg-amber-500/10 border-amber-500/30 text-amber-200'}`}>
          {prefix && <span className="font-black text-white">{prefix} </span>}{h.text}
        </div>
      )}
      {s.needsLabel > 0 && (
        <button
          type="button"
          onClick={onLabelClick}
          disabled={!onLabelClick}
          className="w-full px-3 py-2 rounded-xl text-xs font-black text-left bg-[#1CB0F6]/10 border border-[#1CB0F6]/30 text-[#7DD3FC] enabled:cursor-pointer enabled:hover:bg-[#1CB0F6]/20"
        >
          {s.needsLabel} {s.needsLabel === 1 ? 'trade needs' : 'trades need'} a label{onLabelClick ? ' →' : ''}
        </button>
      )}
    </div>
  );
}
