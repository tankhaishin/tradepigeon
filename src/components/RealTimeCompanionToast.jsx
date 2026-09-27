import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, AlertTriangle, ShieldCheck, Flame, Zap, X } from 'lucide-react';
import InteractiveParrotMascot from './InteractiveParrotMascot';
import { soundFx } from '../utils/audioEngine';

/**
 * Real-Time Companion Popup Toast Component
 * Fires dynamic discipline coaching alerts when live broker fills or state changes occur!
 */
export default function RealTimeCompanionToast({ latestTrade, latestAlert, onDismiss, onClose }) {
  const trade = latestTrade || latestAlert;
  const handleDismiss = onDismiss || onClose || (() => {});

  const isWin = typeof trade?.pnlNum === 'number'
    ? trade.pnlNum > 0
    : typeof trade?.pnl === 'number'
    ? trade.pnl > 0
    : String(trade?.pnl || '').startsWith('+');

  const rawType = (trade?.type || '').toLowerCase();
  const execType = (trade?.executionType || '').toLowerCase();
  const setupStr = (trade?.setup || '').toLowerCase();

  const isViolated = 
    rawType.includes('violate') ||
    rawType.includes('toxic') ||
    rawType.includes('double_failure') ||
    execType.includes('toxic') ||
    execType.includes('double failure') ||
    setupStr.includes('revenge') ||
    setupStr.includes('fomo') ||
    trade?.followedRules === false ||
    trade?.violatedRules === true;

  const commentary = useMemo(() => {
    if (!trade) return '';
    const toxicWinCommentaries = [
      `Trade fill on ${trade.symbol} (${trade.pnl}) flagged: Playbook rule was violated. Note: Profitable outcomes from unplanned entries build dangerous risk habits.`,
      `Execution alert on ${trade.symbol} (${trade.pnl}): Unplanned entry resulted in gain. Remember that process discipline matters more than single-trade P&L.`,
      `Rule bypass on ${trade.symbol}: Resulted in profit, but entry was off-plan. Avoid letting winning trades validate bad execution habits.`
    ];

    const unplannedLossCommentaries = [
      `Trade fill on ${trade.symbol} (${trade.pnl}) flagged: Max risk limit breached. Take a mandatory 15-minute cool-down before taking another entry.`,
      `Risk alert on ${trade.symbol} (${trade.pnl}): Position exceeded defined stop parameters. Step away from the screen to reset your decision-making.`,
      `Stop loss limit exceeded on ${trade.symbol}: Protect your remaining equity by taking a short break before evaluating new setups.`
    ];

    const drawdownCommentaries = [
      `Max drawdown threshold reached on ${trade.symbol}. Take a mandatory cooling-off period before your next trade.`,
      `Daily drawdown limit flagged for ${trade.symbol}. Lower position size and step back to preserve capital for tomorrow's session.`,
      `Risk boundary alert on ${trade.symbol}: Account drawdown limits are near threshold. Pause trading and review your execution playbook.`
    ];

    let list = drawdownCommentaries;
    if (isViolated) {
      list = isWin ? toxicWinCommentaries : unplannedLossCommentaries;
    }
    return list[Math.floor(Math.random() * list.length)];
  }, [trade, isViolated, isWin]);

  // SELECTIVE TRIGGER LOGIC:
  // Do NOT trigger popup on standard normal fills to avoid spamming scalpers who take 20+ trades/day.
  // ONLY trigger floating companion popups for CRITICAL EVENTS:
  // 1) Rule Violations (Violated Plan)
  // 2) Significant Drawdown Breaches (Drawdown Heart Loss)
  if (!trade) return null;
  if (!isViolated && !trade.isDrawdownBreach) {
    return null; // Silent logging mode for clean scalping execution
  }

  // Determine dynamic pose & dialogue strictly for critical alerts
  const pose = isViolated ? (isWin ? 'anxious' : 'revenge') : 'shielded';
  const badgeText = isViolated ? (isWin ? 'PLAN VIOLATION (TOXIC WIN)' : 'PLAN VIOLATION (UNPLANNED LOSS)') : 'DRAWDOWN LIMIT ALERT';
  const badgeColor = isViolated ? (isWin ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-rose-500/20 text-rose-400 border-rose-500/40') : 'bg-[#FF6B00]/20 text-[#FF6B00] border-[#FF6B00]/40';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-bounce-in">
      <div className="duo-card p-5 border-2 border-[#FF6B00] relative flex items-start gap-4 bg-[#182830]">
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-lg bg-[#20323D] text-slate-400 hover:text-white cursor-pointer font-black text-xs"
        >
          <X size={14} />
        </button>

        <div className="shrink-0 flex items-center justify-center">
          <InteractiveParrotMascot pose={pose} className="w-16 h-16 sm:w-20 sm:h-20" />
        </div>

        <div className="space-y-1.5 flex-1 pr-4">
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeColor}`}>
              {badgeText}
            </span>
          </div>

          <h4 className="text-xs font-black text-white">TradePigeon Live Alert</h4>
          <p className="text-xs font-bold text-slate-200 leading-snug">
            {commentary}
          </p>

          <div className="text-[10px] font-black text-[#52656D] pt-1">
            Fill ID: {trade.id} &bull; Instrument: {trade.symbol}
          </div>
        </div>
      </div>
    </div>
  );
}
