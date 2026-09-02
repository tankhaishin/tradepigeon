import React, { useState, useEffect } from 'react';
import InteractiveParrotMascot from './InteractiveParrotMascot';
import { Sparkles, AlertTriangle, ShieldCheck, Flame, Zap, X } from 'lucide-react';
import { soundFx } from '../utils/audioEngine';

/**
 * Real-Time Companion Popup Toast Component
 * Fires dynamic parrot coaching alerts when live broker fills or state changes occur!
 */
export default function RealTimeCompanionToast({ latestTrade, onDismiss }) {
  if (!latestTrade) return null;

  const isWin = (latestTrade.pnl || '').startsWith('+');
  const isViolated = (latestTrade.type || '').includes('VIOLATE');

  // SELECTIVE TRIGGER LOGIC:
  // Do NOT trigger popup on standard normal fills to avoid spamming scalpers who take 20+ trades/day.
  // ONLY trigger floating companion popups for CRITICAL EVENTS:
  // 1) Rule Violations (Violated Plan)
  // 2) Significant Drawdown Breaches (Drawdown Heart Loss)
  if (!isViolated && !latestTrade.isDrawdownBreach) {
    return null; // Silent logging mode for clean scalping execution
  }

  // Determine dynamic pose & dialogue strictly for critical alerts
  let pose = isViolated ? (isWin ? 'anxious' : 'revenge') : 'shielded';
  let badgeText = isViolated ? (isWin ? 'PLAN VIOLATION (TOXIC WIN)' : 'PLAN VIOLATION (UNPLANNED LOSS)') : 'DRAWDOWN LIMIT ALERT';
  let badgeColor = isViolated ? (isWin ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-rose-500/20 text-rose-400 border-rose-500/40') : 'bg-[#FF6B00]/20 text-[#FF6B00] border-[#FF6B00]/40';

  let commentary = isViolated 
    ? (isWin 
        ? `Trade fill on ${latestTrade.symbol} (${latestTrade.pnl}) flagged: Playbook rule was violated. Note: Profitable outcomes from un-planed entries build dangerous habits.` 
        : `Trade fill on ${latestTrade.symbol} (${latestTrade.pnl}) flagged: Max risk limit breached. Take a mandatory 15-minute cool-down before next entry.`)
    : `Max risk limit breached on ${latestTrade.symbol}. Take a mandatory cooling-off period before your next trade.`;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-bounce-in">
      <div className="duo-card p-5 border-2 border-[#FF6B00] relative flex items-start gap-4 bg-[#182830]">
        <button 
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 rounded-lg bg-[#20323D] text-slate-400 hover:text-white cursor-pointer font-black text-xs"
        >
          <X size={14} />
        </button>

        <InteractiveParrotMascot pose={pose} className="w-20 h-20 shrink-0" />

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
            Fill ID: {latestTrade.id} &bull; Instrument: {latestTrade.symbol}
          </div>
        </div>
      </div>
    </div>
  );
}
