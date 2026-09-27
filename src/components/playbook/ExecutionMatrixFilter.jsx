import React from 'react';
import { 
  DuoDisciplinedWinIcon, 
  DuoDisciplinedLossIcon, 
  DuoDisciplinedBeIcon, 
  DuoToxicWinIcon, 
  DuoToxicBeIcon, 
  DuoDoubleFailureIcon, 
  DuoMissedTradeIcon 
} from '../DuoIcons';

/**
 * ExecutionMatrixFilter Component
 * 7 Archetype Behavioral Matrix and Donut Breakdown with 1-Tap Ledger Filtering.
 */
export default function ExecutionMatrixFilter({
  executionMatrix = [],
  selectedExecutionFilter = null,
  onToggleExecutionFilter
}) {
  if (!Array.isArray(executionMatrix) || executionMatrix.length === 0) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
      {/* PRECISION DONUT + DISCIPLINE INDEX CENTER */}
      <div className="xl:col-span-4 flex flex-col items-center justify-center p-6 bg-[#142127] rounded-3xl border-2 border-[#20323D] relative shadow-inner shrink-0">
        {(() => {
          const radius = 38;
          const circumference = 2 * Math.PI * radius;
          let accumulatedPercent = 0;
          const totalTradesCount = executionMatrix.reduce((acc, curr) => acc + parseInt(curr.count || 0), 0);

          // Calculate overall Discipline Adherence Rate (Followed Plan Trades / Total Trades)
          const followedTrades = executionMatrix
            .filter(m => m.id.startsWith('FOLLOW'))
            .reduce((acc, curr) => acc + parseInt(curr.count || 0), 0);
          const adherenceScore = totalTradesCount > 0 ? Math.round((followedTrades / totalTradesCount) * 100) : 100;

          return (
            <div className="relative flex items-center justify-center w-full my-auto">
              <svg viewBox="0 0 100 100" className="w-44 h-44 sm:w-48 sm:h-48 transform -rotate-90">
                {executionMatrix.map((item) => {
                  const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                  accumulatedPercent += item.percent;

                  return (
                    <circle
                      key={item.id}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke={item.color}
                      strokeWidth="16"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-500"
                    />
                  );
                })}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
                <span className="text-[8px] sm:text-[9px] font-black uppercase text-[#52656D] tracking-wider leading-none truncate max-w-[110px]">
                  DISCIPLINE SCORE
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white leading-tight my-0.5">{adherenceScore}%</div>
                <span className="text-[9px] sm:text-[10px] font-extrabold text-[#58CC02] leading-none truncate max-w-[120px]">
                  {followedTrades} of {totalTradesCount} Fills Clean
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* BEHAVIORAL EXECUTION MATRIX CARDS (LIGHTWEIGHT & AIRY) */}
      <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-3.5 min-w-0">
        {executionMatrix.map((item) => {
          const isFollow = item.id.startsWith('FOLLOW');
          const isMissed = item.id === 'MISSED_TRADE';
          const countVal = parseInt(item.count) || 0;
          const hasTrades = countVal > 0;

          let activeCardStyle = 'bg-[#58CC02] border-[#46A302] border-b-4 text-white';
          if (item.id === 'FOLLOW_LOSS') activeCardStyle = 'bg-[#1CB0F6] border-[#1899D6] border-b-4 text-white';
          if (item.id === 'FOLLOW_BE') activeCardStyle = 'bg-[#CE82FF] border-[#B955FF] border-b-4 text-white';
          if (item.id === 'VIOLATE_WIN') activeCardStyle = 'bg-[#FFC800] border-[#D9AA00] border-b-4 text-slate-950';
          if (item.id === 'VIOLATE_BE') activeCardStyle = 'bg-[#00F0FF] border-[#00D8E6] border-b-4 text-slate-950';
          if (item.id === 'VIOLATE_LOSS') activeCardStyle = 'bg-[#FF4B4B] border-[#E03A3A] border-b-4 text-white';
          if (item.id === 'MISSED_TRADE') activeCardStyle = 'bg-[#FF9600] border-[#D97D00] border-b-4 text-white';

          const isDarkText = item.id === 'VIOLATE_WIN' || item.id === 'VIOLATE_BE';
          const isSelected = selectedExecutionFilter === item.id;

          return (
            <div 
              key={item.id} 
              onClick={() => onToggleExecutionFilter(item.id)}
              title={isSelected ? `Filtering by ${item.title}. Click to clear filter.` : `Click to filter raw audit table for ${item.title}`}
              className={`p-3.5 sm:p-4 rounded-2xl transition-all space-y-3 shadow-sm min-w-0 flex flex-col justify-between overflow-hidden cursor-pointer select-none active:scale-95 hover:brightness-105 ${
                isSelected
                  ? `${activeCardStyle} ring-4 ring-white shadow-2xl scale-[1.02] z-10`
                  : hasTrades
                  ? activeCardStyle
                  : 'bg-[#142127]/60 border border-[#20323D] text-slate-500 opacity-60 hover:opacity-100 hover:border-slate-500'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.id === 'FOLLOW_WIN' && <DuoDisciplinedWinIcon className="w-8 h-8 shrink-0 drop-shadow" />}
                  {item.id === 'FOLLOW_LOSS' && <DuoDisciplinedLossIcon className="w-8 h-8 shrink-0 drop-shadow" />}
                  {item.id === 'FOLLOW_BE' && <DuoDisciplinedBeIcon className="w-8 h-8 shrink-0 drop-shadow" />}
                  {item.id === 'VIOLATE_WIN' && <DuoToxicWinIcon className="w-8 h-8 shrink-0 drop-shadow" />}
                  {item.id === 'VIOLATE_BE' && <DuoToxicBeIcon className="w-8 h-8 shrink-0 drop-shadow" />}
                  {item.id === 'VIOLATE_LOSS' && <DuoDoubleFailureIcon className="w-8 h-8 shrink-0 drop-shadow" />}
                  {item.id === 'MISSED_TRADE' && <DuoMissedTradeIcon className="w-8 h-8 shrink-0 drop-shadow" />}
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-black leading-tight tracking-tight whitespace-nowrap truncate">{item.title}</h4>
                    <span className="text-[9px] font-black uppercase tracking-wider opacity-75 block truncate">
                      {isMissed ? 'HESITATION' : isFollow ? 'DISCIPLINED' : 'VIOLATION'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isSelected && (
                    <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm ${
                      isDarkText ? 'bg-slate-950 text-white' : 'bg-white text-slate-950'
                    }`}>
                      FILTER
                    </span>
                  )}
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full font-mono shrink-0 ${
                    hasTrades
                      ? isDarkText ? 'bg-slate-950/20 text-slate-950' : 'bg-white/20 text-white'
                      : 'bg-[#20323D] text-slate-400'
                  }`}>
                    {item.percent}%
                  </span>
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-2 border-t border-current/15 gap-2">
                <span className="text-sm sm:text-base font-black leading-none shrink-0">
                  {item.count}
                </span>
                <div className="flex items-center gap-2 truncate">
                  {hasTrades && (
                    <span className="text-xs font-black font-mono opacity-90 truncate text-right">{item.pnl}</span>
                  )}
                  <span className="text-[9px] font-bold opacity-75 hidden sm:inline">
                    {isSelected ? '✕ Clear' : '1-Tap Filter →'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
