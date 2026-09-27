import React from 'react';
import { X } from 'lucide-react';

/**
 * MarketSessionsGrid Component
 * CME Futures Session Breakdown (London, NY AM, NY Lunch, NY PM, Overnight) with Midday Chop Trap indicators.
 */
export default function MarketSessionsGrid({
  sessionMetrics = [],
  selectedSessionFilter = null,
  onToggleSessionFilter,
  onClearSessionFilter
}) {
  if (!Array.isArray(sessionMetrics) || sessionMetrics.length === 0) return null;

  return (
    <div className="space-y-3 pt-2 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[#1CB0F6] font-black text-xs uppercase tracking-wider">
              CME MARKET SESSIONS & KILLZONES (NEW YORK EST)
            </h3>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#182830] text-slate-400 border border-[#20323D]">
              6 SESSIONS
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 mt-1">
            Audit your statistical edge by institutional liquidity window. Click any session card to filter execution fills below.
          </p>
        </div>

        {selectedSessionFilter && (
          <button
            onClick={onClearSessionFilter}
            className="px-3 py-1.5 rounded-xl text-xs font-black text-slate-300 hover:text-white bg-[#142127] hover:bg-[#20323D] border border-[#20323D] transition-all cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <X size={13} />
            <span>Clear Session Filter</span>
          </button>
        )}
      </div>

      {/* 6-Card Responsive Session Performance Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {sessionMetrics.map((session) => {
          const isSelected = selectedSessionFilter === session.id;
          const isPnlPositive = session.netPnl > 0;
          const isPnlNegative = session.netPnl < 0;

          return (
            <button
              key={session.id}
              type="button"
              onClick={() => onToggleSessionFilter(session.id)}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#182830] border-[#1CB0F6] ring-2 ring-[#1CB0F6]/30 shadow-lg scale-[1.02]'
                  : session.isChopTrapWarning
                  ? 'bg-amber-950/20 border-amber-500/50 hover:border-amber-400'
                  : 'bg-[#142127] border-[#20323D] hover:border-[#37464F]'
              }`}
            >
              {/* Session Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span 
                    className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${session.color}20`,
                      color: session.color,
                      border: `1px solid ${session.color}40`
                    }}
                  >
                    {session.shortName}
                  </span>
                  {session.isChopTrapWarning && (
                    <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                      ⚠️ TRAP
                    </span>
                  )}
                </div>

                <div className="text-xs font-black text-white truncate" title={session.name}>
                  {session.name}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {session.hours}
                </div>
              </div>

              {/* Session PnL & Win Rate */}
              <div className="mt-3 pt-2 border-t border-[#20323D]/60 space-y-1">
                <div className={`text-sm font-black font-mono ${
                  isPnlPositive ? 'text-[#58CC02]' : isPnlNegative ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {session.formattedPnl}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                  <span>{session.winRate}% WR</span>
                  <span className="font-mono text-[#52656D]">{session.totalTrades} fills</span>
                </div>
                <div className="text-[9px] font-mono text-[#FF6B00] font-black">
                  {session.rMultiple}
                </div>
              </div>

              {/* Chop warning banner inside lunch card */}
              {session.isChopTrapWarning && (
                <div className="mt-2 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[8px] font-bold text-amber-300 leading-tight">
                  Midday chop trap active! Stop giving back morning gains.
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
