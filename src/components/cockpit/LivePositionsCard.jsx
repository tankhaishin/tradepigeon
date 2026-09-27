import React from 'react';

/**
 * LivePositionsCard Component
 * Real-time indicator of active in-flight inventory awaiting scale-out or exit fills.
 */
export default function LivePositionsCard({ openPositions = [] }) {
  if (!Array.isArray(openPositions) || openPositions.length === 0) return null;

  return (
    <div className="p-2.5 rounded-xl bg-[#0F2027] border-2 border-emerald-500/40 space-y-2 shadow-md animate-fade-in text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">
            IN-FLIGHT INVENTORY ({openPositions.length})
          </span>
        </div>
        <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          AWAITING EXIT
        </span>
      </div>
      <div className="space-y-1">
        {openPositions.map(pos => {
          const isBuy = (pos.direction || pos.side || 'BUY').toUpperCase() === 'BUY';
          return (
            <div key={pos.id} className="p-1.5 rounded-lg bg-[#14262E] border border-emerald-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`text-[8px] font-black px-1 py-0.5 rounded shrink-0 ${
                  isBuy ? 'bg-[#58CC02]/20 text-[#58CC02]' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {isBuy ? 'LONG' : 'SHORT'}
                </span>
                <span className="font-black text-white text-[10px] truncate">{pos.symbol}</span>
                <span className="text-[9px] font-bold text-slate-300">
                  {pos.contracts} {pos.contracts === 1 ? 'ct' : 'cts'} @ {typeof pos.entryPrice === 'number' ? pos.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : pos.entryPrice}
                </span>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[8px] font-black text-slate-400 truncate max-w-[80px]">{pos.account}</div>
                <div className="text-[8px] font-bold text-slate-500">{pos.time || 'Live'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
