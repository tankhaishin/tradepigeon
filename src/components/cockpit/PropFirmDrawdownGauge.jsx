import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, AlertTriangle, AlertCircle } from 'lucide-react';
import { formatFinancialCurrency, formatRMultiple } from '../../utils/financialMath';
import { soundFx } from '../../utils/audioEngine';

/**
 * PropFirmDrawdownGauge Component
 * High-precision tactile 3D trailing drawdown & liquidation buffer gauge for futures prop accounts.
 */
export default function PropFirmDrawdownGauge({
  trailingMetrics,
  trailingMaxDrawdown,
  onSelectTrailingDrawdown,
  isStealthMode = false
}) {
  const [isDrawdownPopoverOpen, setIsDrawdownPopoverOpen] = useState(false);
  const [customDrawdownInput, setCustomDrawdownInput] = useState('');

  if (!trailingMetrics) return null;

  return (
    <div className="p-3 rounded-2xl bg-[#142127] border-2 border-[#20323D] border-b-4 border-b-[#0D161A] space-y-2.5 shadow-md text-left">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className={trailingMetrics.isBreached ? 'text-[#FF4B4B]' : trailingMetrics.isWarning ? 'text-amber-400' : 'text-[#58CC02]'} />
          <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">
            PROP FIRM TRAILING DRAWDOWN
          </span>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              soundFx.playPop();
              setIsDrawdownPopoverOpen(!isDrawdownPopoverOpen);
            }}
            className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-[#182830] hover:bg-[#20323D] border border-[#20323D] text-[#1CB0F6] cursor-pointer transition-all flex items-center gap-1"
            title="Configure Prop Firm Max Drawdown Buffer"
          >
            <span>${trailingMaxDrawdown.toLocaleString()} Max DD</span>
            <ChevronDown size={10} />
          </button>

          {/* Popover for quick buffer selection */}
          {isDrawdownPopoverOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 p-2 rounded-xl bg-[#182830] border-2 border-[#20323D] shadow-2xl z-50 space-y-1.5 animate-fade-in">
              <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 px-1">
                Prop Firm Buffer Preset
              </div>
              <div className="grid grid-cols-2 gap-1">
                {[1500, 2000, 2500, 3000, 4500, 7500].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      onSelectTrailingDrawdown(amt);
                      setIsDrawdownPopoverOpen(false);
                    }}
                    className={`px-2 py-1 rounded-lg text-[9px] font-mono font-bold text-center cursor-pointer transition-all border ${
                      trailingMaxDrawdown === amt
                        ? 'bg-[#1CB0F6]/20 border-[#1CB0F6] text-white font-black'
                        : 'bg-[#142127] border-[#20323D] text-slate-300 hover:text-white hover:border-slate-500'
                    }`}
                  >
                    ${amt.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="pt-1 border-t border-[#20323D] flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Custom $"
                  value={customDrawdownInput}
                  onChange={(e) => setCustomDrawdownInput(e.target.value)}
                  className="w-full bg-[#142127] border border-[#20323D] text-white text-[9px] px-2 py-1 rounded-lg focus:outline-none focus:border-[#1CB0F6]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customDrawdownInput.trim()) {
                      onSelectTrailingDrawdown(customDrawdownInput);
                      setCustomDrawdownInput('');
                      setIsDrawdownPopoverOpen(false);
                    }
                  }}
                  className="px-2 py-1 rounded-lg bg-[#58CC02] hover:bg-[#46A302] text-white text-[9px] font-black cursor-pointer"
                >
                  Set
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics 3-Col Bar */}
      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="p-1.5 rounded-xl bg-[#182830] border border-[#20323D]">
          <div className="text-[8px] font-black uppercase text-slate-400 tracking-wider">High-Water Mark</div>
          <div className="text-[10px] font-mono font-black text-white">
            {isStealthMode ? formatRMultiple(trailingMetrics.peakPnL, 350, 1) : formatFinancialCurrency(trailingMetrics.peakPnL, { showPlus: true })}
          </div>
        </div>
        <div className="p-1.5 rounded-xl bg-[#182830] border border-[#20323D]">
          <div className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Drawdown</div>
          <div className={`text-[10px] font-mono font-black ${trailingMetrics.drawdownFromPeak > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {isStealthMode ? formatRMultiple(-trailingMetrics.drawdownFromPeak, 350, 1) : formatFinancialCurrency(-trailingMetrics.drawdownFromPeak, { showPlus: false })}
          </div>
        </div>
        <div className="p-1.5 rounded-xl bg-[#182830] border border-[#20323D]">
          <div className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Threshold Level</div>
          <div className="text-[10px] font-mono font-black text-slate-300">
            {isStealthMode ? formatRMultiple(trailingMetrics.trailingThreshold, 350, 1) : formatFinancialCurrency(trailingMetrics.trailingThreshold, { showPlus: true })}
          </div>
        </div>
      </div>

      {/* Tactile 3D Buffer Meter Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[9px]">
          <span className="font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <span>Liquidation Cushion:</span>
            <span className={`font-mono font-black ${
              trailingMetrics.isBreached
                ? 'text-[#FF4B4B]'
                : trailingMetrics.isWarning
                ? 'text-amber-400'
                : 'text-[#58CC02]'
            }`}>
              {isStealthMode
                ? `${formatRMultiple(trailingMetrics.bufferRemaining, 350, 1)} buffer`
                : `${formatFinancialCurrency(trailingMetrics.bufferRemaining, { showPlus: false })} buffer`
              }
            </span>
          </span>
          <span className={`font-mono font-black ${
            trailingMetrics.isBreached
              ? 'text-[#FF4B4B]'
              : trailingMetrics.isWarning
              ? 'text-amber-400'
              : 'text-[#58CC02]'
          }`}>
            {trailingMetrics.bufferPercent}%
          </span>
        </div>

        <div className="h-3 w-full bg-[#182830] rounded-full p-0.5 border border-[#20323D] overflow-hidden relative shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              trailingMetrics.isBreached
                ? 'bg-[#FF4B4B] animate-pulse shadow-[0_0_10px_#FF4B4B]'
                : trailingMetrics.bufferPercent <= 30
                ? 'bg-[#FF4B4B] animate-pulse shadow-[0_0_8px_#FF4B4B]'
                : trailingMetrics.bufferPercent <= 60
                ? 'bg-[#FFC800] shadow-[0_0_6px_#FFC800]'
                : 'bg-[#58CC02] shadow-[0_0_6px_#58CC02]'
            }`}
            style={{ width: `${trailingMetrics.bufferPercent}%` }}
          />
        </div>
      </div>

      {/* Status banner */}
      {trailingMetrics.isBreached ? (
        <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[9px] font-black flex items-center gap-1.5 animate-pulse">
          <AlertTriangle size={12} className="text-rose-400 shrink-0" />
          <span>LIQUIDATION BREACH! Trailing threshold hit. Lock screens immediately.</span>
        </div>
      ) : trailingMetrics.isWarning ? (
        <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] font-black flex items-center gap-1.5">
          <AlertCircle size={12} className="text-amber-400 shrink-0" />
          <span>HIGH RISK: Less than 30% drawdown cushion remains! Reduce size or stop.</span>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[8px] font-bold text-slate-500 px-0.5">
          <span>Trailing threshold dynamically locks behind session peak profit</span>
          <span className="text-[#58CC02] font-black">PROTECTED</span>
        </div>
      )}
    </div>
  );
}
