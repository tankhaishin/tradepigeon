import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, 
  Flame, ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle, XCircle, TrendingUp, Sparkles, Eye, EyeOff, Filter, X, Trash2
} from 'lucide-react';
import { DuoCalendarIcon, DuoShieldIcon, DuoLightningIcon, DuoGemIcon, DuoTrophyIcon, DuoDisciplinedWinIcon, DuoDisciplinedLossIcon, DuoDisciplinedBeIcon, DuoToxicWinIcon, DuoToxicBeIcon, DuoDoubleFailureIcon, DuoMissedTradeIcon } from './DuoIcons';
import { Duo3dCheckBadge, Duo3dZenBadge } from './GamifiedFeatureBadges';
import { loadStoredData, saveStoredData, subscribeToStorageUpdate, STORAGE_KEYS, DEFAULT_USER_STATS, deleteStoredTrade } from '../utils/storage';
import { getTrades, getTradesForDate, onTradesChange, deleteTrades } from '../utils/tradeStore';
import { auditAndSanitizeCalendarState, getMonthDataFor } from '../utils/calendarEngine';
import { soundFx } from '../utils/audioEngine';
import { parseFinancialNumber, formatFinancialCurrency, formatRMultiple, sumTradesPnl } from '../utils/financialMath';
import { classifyTradeExecution } from '../utils/tradeParser';

export default function CalendarTab() {
  const now = new Date();
  const [activeYear, setActiveYear] = useState(() => now.getFullYear());
  const [activeMonth, setActiveMonth] = useState(() => now.getMonth());
  const [calendarViewMode, setCalendarViewMode] = useState('pnl'); // 'pnl' | 'discipline'
  const [selectedBasketFilter, setSelectedBasketFilter] = useState('ALL');
  const [basketsList] = useState(() => loadStoredData('tradepigeon_baskets_list', [
    { id: 'b_1', name: 'Basket A' },
    { id: 'b_2', name: 'Basket B' }
  ]));
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL'); // 'ALL' | 'win' | 'good_loss' | 'toxic_win' | 'double_failure'
  const [activeModalDay, setActiveModalDay] = useState(null);
  const [userStats, setUserStats] = useState(() => loadStoredData(STORAGE_KEYS.USER_STATS, DEFAULT_USER_STATS));
  const [isStealthMode, setIsStealthMode] = useState(() => loadStoredData('tradepigeon_stealth_mode', false));
  const [tradesRevision, setTradesRevision] = useState(0);

  const storedLossLimitRaw = loadStoredData('tradepigeon_max_daily_loss', '$1,000');
  const numericLossLimit = Math.abs(parseFloat(String(storedLossLimitRaw).replace(/[^0-9.]/g, '')) || 500);

  // Dynamic storage-backed Calendar State
  const [monthsData, setMonthsData] = useState(() => {
    try {
      const loaded = loadStoredData(STORAGE_KEYS.CALENDAR_DATA, null);
      return auditAndSanitizeCalendarState(loaded || []);
    } catch (e) {
      return auditAndSanitizeCalendarState([]);
    }
  });

  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdate(({ key, value }) => {
      if (key === 'tradepigeon_stealth_mode') {
        setIsStealthMode(Boolean(value));
      }
      if (
        key === STORAGE_KEYS.CALENDAR_DATA ||
        key === 'tradepigeon_tradelogs' ||
        key === 'tradepigeon_session_trades' ||
        key === 'trades_cleared' ||
        (key && (key.startsWith('tradepigeon_session_trades_day_') || key.startsWith('day_') || key.startsWith('tradepigeon_session_note_day_')))
      ) {
        setTradesRevision(r => r + 1);
        if (key === STORAGE_KEYS.CALENDAR_DATA && value) {
          setMonthsData(auditAndSanitizeCalendarState(value));
        }
      }
      if (key === STORAGE_KEYS.USER_STATS && value) {
        setUserStats(value);
      }
    });
    const offTrades = onTradesChange(() => setTradesRevision(r => r + 1));
    return () => { unsubscribe(); offTrades(); };
  }, []);

  const formatDayPnl = (pnlVal) => {
    const pnlStr = String(pnlVal || '');
    if (!pnlVal || pnlStr === '-' || pnlStr.includes('CLOSED')) return pnlVal;
    if (!isStealthMode) return pnlStr;
    const num = parseFinancialNumber(pnlVal, 0);
    return formatRMultiple(num, 350, 1);
  };

  const rawMonth = useMemo(() => {
    return getMonthDataFor(activeYear, activeMonth, monthsData);
  }, [activeYear, activeMonth, monthsData]);

  const modalDayTrades = useMemo(() => {
    if (!activeModalDay) return [];
    void tradesRevision;
    const year = rawMonth.year || 2026;
    const monthIdx = rawMonth.monthIndex !== undefined ? rawMonth.monthIndex : 8;
    const padMonth = String(monthIdx + 1).padStart(2, '0');
    const padDate = String(activeModalDay.date).padStart(2, '0');
    const isoDate = `${year}-${padMonth}-${padDate}`;

    return getTradesForDate(isoDate);
  }, [activeModalDay, rawMonth, tradesRevision]);

  // Modal Escape Key Dismissal
  useEffect(() => {
    if (!activeModalDay) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveModalDay(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModalDay]);

  const modalCategoryTotals = useMemo(() => {
    let disciplinedWin = 0;
    let disciplinedLoss = 0;
    let disciplinedBe = 0;
    let toxicWin = 0;
    let toxicBe = 0;
    let doubleFailure = 0;
    let missedTradeCount = 0;

    modalDayTrades.forEach(t => {
      const val = parseFinancialNumber(t.pnlNum !== undefined ? t.pnlNum : t.pnlValue !== undefined ? t.pnlValue : t.pnl, 0);
      const rawType = String(t.type || '').toLowerCase();
      const execType = String(t.executionType || '').toLowerCase();
      const isViolated = t.followedRules === false || t.violated === true || t.violatedRules === true ||
        rawType.includes('toxic') || rawType.includes('violate') || rawType.includes('double_failure') || rawType.includes('double failure') ||
        execType.includes('toxic') || execType.includes('double failure');

      if (rawType === 'missed_trade' || rawType === 'missed') {
        missedTradeCount++;
      } else if (isViolated) {
        if (val > 0.001) toxicWin += val;
        else if (val < -0.001) doubleFailure += val;
        else toxicBe += val;
      } else {
        if (val > 0.001) disciplinedWin += val;
        else if (val < -0.001) disciplinedLoss += val;
        else disciplinedBe += val;
      }
    });

    return {
      disciplinedWin: formatFinancialCurrency(disciplinedWin, { showPlus: true }),
      disciplinedLoss: formatFinancialCurrency(disciplinedLoss, { showPlus: true }),
      disciplinedBe: formatFinancialCurrency(disciplinedBe, { showPlus: true }),
      toxicWin: formatFinancialCurrency(toxicWin, { showPlus: true }),
      toxicBe: formatFinancialCurrency(toxicBe, { showPlus: true }),
      doubleFailure: formatFinancialCurrency(doubleFailure, { showPlus: true }),
      missedTradeCount,
      hasTrades: modalDayTrades.length > 0
    };
  }, [modalDayTrades]);

  const modalDayIsoDate = useMemo(() => {
    if (!activeModalDay) return '';
    const year = rawMonth.year || 2026;
    const monthIdx = rawMonth.monthIndex !== undefined ? rawMonth.monthIndex : 8;
    const padMonth = String(monthIdx + 1).padStart(2, '0');
    const padDate = String(activeModalDay.date).padStart(2, '0');
    return `${year}-${padMonth}-${padDate}`;
  }, [activeModalDay, rawMonth]);

  const currentMonth = useMemo(() => {
    if (!rawMonth) return { days: [], totalPnl: '$0.00', disciplineScore: '100%', weeklySummaries: [] };
    void tradesRevision;
    const year = rawMonth.year || activeYear;
    const monthIdx = rawMonth.monthIndex !== undefined ? rawMonth.monthIndex : activeMonth;

    let totalPnlNum = 0;
    let disciplinedDays = 0;
    let totalTradeDays = 0;

    const tradesByDate = {};
    for (const t of getTrades()) (tradesByDate[t.date] ||= []).push(t);

    const days = (rawMonth.days || []).map(day => {
      const padMonth = String(monthIdx + 1).padStart(2, '0');
      const padDate = String(day.date).padStart(2, '0');
      const isoDate = `${year}-${padMonth}-${padDate}`;

      const resolvedTrades = tradesByDate[isoDate] || [];

      if (resolvedTrades && resolvedTrades.length > 0) {
        const dayPnl = sumTradesPnl(resolvedTrades);
        totalPnlNum += dayPnl;
        totalTradeDays++;

        const storedMaxLoss = loadStoredData('tradepigeon_max_daily_loss', '$1,000');
        const lossLimitNum = Math.abs(parseFinancialNumber(storedMaxLoss, 1000));
        const isLossLimitBreached = dayPnl < -lossLimitNum;

        const hasViolations = isLossLimitBreached || resolvedTrades.some(t => {
          if (t.followedRules === false || t.violated === true || t.violatedRules === true) return true;
          const rawType = String(t.type || '').toLowerCase();
          const execType = String(t.executionType || '').toLowerCase();
          return rawType.includes('toxic') || rawType.includes('violate') || rawType.includes('double_failure') || rawType.includes('double failure') ||
                 execType.includes('toxic') || execType.includes('double failure');
        });
        const isFollowed = !hasViolations;

        let dayStatus = 'breakeven';
        if (dayPnl > 5) {
          dayStatus = isFollowed ? 'win' : 'toxic_win';
          if (isFollowed) disciplinedDays++;
        } else if (dayPnl < -5) {
          dayStatus = isFollowed ? 'good_loss' : 'double_failure';
          if (isFollowed) disciplinedDays++;
        } else {
          dayStatus = isFollowed ? 'breakeven' : 'toxic_be';
          if (isFollowed) disciplinedDays++;
        }

        return {
          ...day,
          pnl: formatFinancialCurrency(dayPnl, { showPlus: true }),
          status: dayStatus,
          count: `${resolvedTrades.length} trades`
        };
      }

      // Preserve day.pnl if already populated
      if (day.pnl && day.pnl !== '-' && !String(day.pnl).includes('CLOSED')) {
        const clean = parseFinancialNumber(day.pnl, NaN);
        if (!isNaN(clean)) {
          totalPnlNum += clean;
          totalTradeDays++;
          if (day.status === 'win' || day.status === 'good_loss' || day.status === 'breakeven') {
            disciplinedDays++;
          }
        }
      }
      return day;
    });

    const calculatedTotalPnl = formatFinancialCurrency(totalPnlNum, { showPlus: true });
    const calculatedDisciplineScore = totalTradeDays > 0 ? `${Math.round((disciplinedDays / totalTradeDays) * 100)}%` : '100%';

    // Dynamically calculate weekly summaries by row of 7 days
    const startOffset = rawMonth.startOffset || 0;
    const gridItems = [];
    for (let o = 0; o < startOffset; o++) gridItems.push(null);
    days.forEach(d => gridItems.push(d));

    const weeklySummaries = [];
    let weekRowIdx = 0;
    for (let i = 0; i < gridItems.length; i += 7) {
      const weekChunk = gridItems.slice(i, i + 7).filter(Boolean);
      let weekPnl = 0;
      let weekTrades = 0;

      weekChunk.forEach(d => {
        if (d.pnl && d.pnl !== '-' && !String(d.pnl).includes('CLOSED')) {
          const val = parseFinancialNumber(d.pnl, 0);
          weekPnl += val;
        }
        if (d.count) {
          const match = String(d.count).match(/\d+/);
          if (match) weekTrades += parseInt(match[0], 10);
        }
      });

      weeklySummaries.push({
        weekLabel: `Week ${weekRowIdx + 1}`,
        pnl: formatFinancialCurrency(weekPnl, { showPlus: true }),
        count: `${weekTrades} trade${weekTrades === 1 ? '' : 's'}`
      });
      weekRowIdx++;
    }

    return {
      ...rawMonth,
      days,
      totalPnl: calculatedTotalPnl,
      disciplineScore: calculatedDisciplineScore,
      weeklySummaries
    };
  }, [rawMonth, activeYear, activeMonth, tradesRevision]);

  const handlePrevMonth = () => {
    soundFx.playPop();
    setActiveMonth((prev) => {
      if (prev === 0) {
        setActiveYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    soundFx.playPop();
    setActiveMonth((prev) => {
      if (prev === 11) {
        setActiveYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  return (
    <main className="flex-1 min-h-screen lg:pl-28 xl:pl-80 xl:pr-8 bg-[#070C1E] p-4 sm:p-6 lg:p-8 text-white space-y-6 pb-24 lg:pb-10 max-w-full overflow-hidden">
      
      {/* 1. TOP HEADER: PURE FLOATING DUOLINGO HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <DuoCalendarIcon className="w-9 h-9 shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex flex-wrap items-center gap-3">
            <span>Performance Calendar</span>
            <span className={`${String(currentMonth.totalPnl).startsWith("-") ? "text-rose-400" : "text-[#58CC02]"} text-xl sm:text-2xl font-black`}>{currentMonth.totalPnl}</span>
          </h1>
        </div>

        {/* Action & Month Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Risk Basket Filter Bar */}
          <div className="flex items-center gap-1.5 bg-[#182830] p-1.5 rounded-2xl border-2 border-[#20323D] border-b-4 border-b-[#142127]">
            <span className="text-[10px] font-black uppercase text-[#77909D] px-2 shrink-0">BASKET:</span>
            {['ALL', ...basketsList.map(b => b.name)].map((basketName) => {
              const isSelected = selectedBasketFilter === basketName;
              return (
                <button
                  key={basketName}
                  onClick={() => {
                    setSelectedBasketFilter(basketName);
                    soundFx.playPop();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1CB0F6] text-white shadow-md'
                      : 'text-[#77909D] hover:text-white'
                  }`}
                >
                  {basketName === 'ALL' ? 'ALL BASKETS' : basketName}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 bg-[#182830] p-1.5 rounded-2xl border-2 border-[#20323D] border-b-4 border-b-[#142127]">
            <button
              onClick={handlePrevMonth}
              className="duo-btn-dark p-2 text-white hover:text-[#1CB0F6] cursor-pointer transition-colors"
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-black px-4 py-2 rounded-xl bg-[#142127] border border-[#20323D] text-white uppercase tracking-wider shadow-inner">
              {currentMonth.monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="duo-btn-dark p-2 text-white hover:text-[#1CB0F6] cursor-pointer transition-colors"
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. FULL-SCREEN 7-COLUMN MONTHLY CALENDAR GRID WITH WEEKLY TOTALS */}
      <div className="duo-card p-4 sm:p-6 space-y-4 border-2 border-[#20323D] bg-[#142127]">
        
        {/* INTERACTIVE CATEGORY FILTER BUTTONS ENGINE (TACTILE 3D BUTTONS) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#20323D]">
          <div className="flex flex-wrap items-center gap-3">
            {/* BUTTON 1: DISCIPLINED WIN */}
            <button
              onClick={() => {
                soundFx.playPop();
                setActiveCategoryFilter(activeCategoryFilter === 'win' ? 'ALL' : 'win');
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:translate-y-0.5 active:border-b-2 ${
                activeCategoryFilter === 'win'
                  ? 'bg-[#58CC02] border-2 border-[#46A302] border-b-5 border-b-[#388202] text-white scale-105'
                  : 'bg-[#182830] border-2 border-[#20323D] border-b-5 border-b-[#142127] text-[#58CC02] hover:bg-[#20323D]'
              }`}
            >
              <DuoDisciplinedWinIcon className="w-5 h-5 shrink-0" />
              <span>Disciplined Win</span>
            </button>

            {/* BUTTON 2: DISCIPLINED LOSS */}
            <button
              onClick={() => {
                soundFx.playPop();
                setActiveCategoryFilter(activeCategoryFilter === 'good_loss' ? 'ALL' : 'good_loss');
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:translate-y-0.5 active:border-b-2 ${
                activeCategoryFilter === 'good_loss'
                  ? 'bg-[#1CB0F6] border-2 border-[#1899D6] border-b-5 border-b-[#147BB0] text-white scale-105'
                  : 'bg-[#182830] border-2 border-[#20323D] border-b-5 border-b-[#142127] text-[#1CB0F6] hover:bg-[#20323D]'
              }`}
            >
              <DuoDisciplinedLossIcon className="w-5 h-5 shrink-0" />
              <span>Disciplined Loss</span>
            </button>

            {/* BUTTON 3: DISCIPLINED BE */}
            <button
              onClick={() => {
                soundFx.playPop();
                setActiveCategoryFilter(activeCategoryFilter === 'breakeven' ? 'ALL' : 'breakeven');
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:translate-y-0.5 active:border-b-2 ${
                activeCategoryFilter === 'breakeven'
                  ? 'bg-[#CE82FF] border-2 border-[#B955FF] border-b-5 border-b-[#9D28EC] text-white scale-105'
                  : 'bg-[#182830] border-2 border-[#20323D] border-b-5 border-b-[#142127] text-[#CE82FF] hover:bg-[#20323D]'
              }`}
            >
              <DuoDisciplinedBeIcon className="w-5 h-5 shrink-0" />
              <span>Disciplined BE</span>
            </button>

            {/* BUTTON 4: TOXIC WIN */}
            <button
              onClick={() => {
                soundFx.playPop();
                setActiveCategoryFilter(activeCategoryFilter === 'toxic_win' ? 'ALL' : 'toxic_win');
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:translate-y-0.5 active:border-b-2 ${
                activeCategoryFilter === 'toxic_win'
                  ? 'bg-[#FFC800] border-2 border-[#D9AA00] border-b-5 border-b-[#8A6B00] text-slate-950 scale-105'
                  : 'bg-[#182830] border-2 border-[#20323D] border-b-5 border-b-[#142127] text-[#FFC800] hover:bg-[#20323D]'
              }`}
            >
              <DuoToxicWinIcon className="w-5 h-5 shrink-0" />
              <span>Toxic Win</span>
            </button>

            {/* BUTTON 5: TOXIC BE */}
            <button
              onClick={() => {
                soundFx.playPop();
                setActiveCategoryFilter(activeCategoryFilter === 'toxic_be' ? 'ALL' : 'toxic_be');
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:translate-y-0.5 active:border-b-2 ${
                activeCategoryFilter === 'toxic_be'
                  ? 'bg-[#00F0FF] border-2 border-[#00D8E6] border-b-5 border-b-[#00B3BF] text-slate-950 scale-105'
                  : 'bg-[#182830] border-2 border-[#20323D] border-b-5 border-b-[#142127] text-[#00F0FF] hover:bg-[#20323D]'
              }`}
            >
              <DuoToxicBeIcon className="w-5 h-5 shrink-0" />
              <span>Toxic BE</span>
            </button>

            {/* BUTTON 6: DOUBLE FAILURE */}
            <button
              onClick={() => {
                soundFx.playPop();
                setActiveCategoryFilter(activeCategoryFilter === 'double_failure' ? 'ALL' : 'double_failure');
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:translate-y-0.5 active:border-b-2 ${
                activeCategoryFilter === 'double_failure'
                  ? 'bg-[#FF4B4B] border-2 border-[#E53935] border-b-5 border-b-[#C62828] text-white scale-105'
                  : 'bg-[#182830] border-2 border-[#20323D] border-b-5 border-b-[#142127] text-[#FF4B4B] hover:bg-[#20323D]'
              }`}
            >
              <DuoDoubleFailureIcon className="w-5 h-5 shrink-0" />
              <span>Double Failure</span>
            </button>

            {/* BUTTON 7: MISSED TRADE */}
            <button
              onClick={() => {
                soundFx.playPop();
                setActiveCategoryFilter(activeCategoryFilter === 'missed_trade' ? 'ALL' : 'missed_trade');
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:translate-y-0.5 active:border-b-2 ${
                activeCategoryFilter === 'missed_trade'
                  ? 'bg-amber-500 border-2 border-amber-600 border-b-5 border-b-amber-700 text-slate-950 scale-105'
                  : 'bg-[#182830] border-2 border-[#20323D] border-b-5 border-b-[#142127] text-amber-400 hover:bg-[#20323D]'
              }`}
            >
              <DuoMissedTradeIcon className="w-5 h-5 shrink-0" />
              <span>Missed Trade</span>
            </button>
          </div>

          {activeCategoryFilter !== 'ALL' && (
            <button
              onClick={() => {
                soundFx.playPop();
                setActiveCategoryFilter('ALL');
              }}
              className="px-3 py-1.5 rounded-xl bg-[#20323D] hover:bg-slate-700 text-xs font-black text-white cursor-pointer transition-all border border-[#37464F]"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Days of Week Header & Grid Container (Horizontal scroll on narrow screens to prevent text overlap) */}
        <div className="overflow-x-auto p-3.5 -m-3.5">
          <div className="min-w-[680px] md:min-w-0 space-y-2">
            {/* Days of Week Header (Mon-Sun + Weekly Summary Column) */}
            <div className="grid grid-cols-8 gap-2 text-center text-xs font-black text-[#52656D] uppercase tracking-wider pb-2 border-b border-[#20323D]">
              <div>Mo</div>
              <div>Tu</div>
              <div>We</div>
              <div>Th</div>
              <div>Fr</div>
              <div className="text-slate-500">Sa</div>
              <div className="text-slate-500">Su</div>
              <div className="text-[#1CB0F6]">Weekly</div>
            </div>

            {/* Calendar Day Tiles Grid */}
            <div className="grid grid-cols-8 gap-2">
          {(() => {
            const startOffset = currentMonth.startOffset || 0;
            const items = [];

            // Add leading offset cells for days of previous month
            for (let o = 0; o < startOffset; o++) {
              items.push({ isOffset: true, key: `offset-${o}` });
            }

            // Add actual month days
            currentMonth.days.forEach((day) => {
              items.push(day);
            });

            // Render 7 days per row + 1 weekly summary column
            const rows = [];
            let dayIdx = 0;
            let weekCount = 0;

            while (dayIdx < items.length) {
              const weekItems = items.slice(dayIdx, dayIdx + 7);
              while (weekItems.length < 7) {
                weekItems.push({ isEmpty: true, key: `empty-${weekItems.length}` });
              }

              const weeklyData = currentMonth.weeklySummaries[weekCount] || { weekLabel: `Week ${weekCount + 1}`, pnl: '+$0.00', count: '0 trades' };

              rows.push(
                <React.Fragment key={`week-row-${weekCount}`}>
                  {weekItems.map((item, i) => {
                    if (!item || item.isEmpty || item.isOffset) {
                      return <div key={item?.key || `empty-${i}`} className="p-3 rounded-2xl bg-[#131F24]/30 border-2 border-[#1B2A32] opacity-20 min-h-[90px]" />;
                    }

                    const day = item;
                    const dayPnlStr = String(day.pnl || '');
                    const hasTrades = day.pnl && day.pnl !== '-' && day.pnl !== 'MARKET CLOSED' && !dayPnlStr.includes('CLOSED');
                    const isWin = day.status === 'win' || day.status === 'FOLLOWED_WIN';
                    const isGoodLoss = day.status === 'good_loss' || day.status === 'FOLLOWED_LOSS';
                    const isBreakeven = day.status === 'breakeven';
                    const isToxicWin = day.status === 'toxic_win' || day.status === 'violate_win';
                    const isToxicBe = day.status === 'toxic_be';
                    const isDoubleFailure = day.status === 'double_failure' || day.status === 'violate_loss' || (day.status === 'loss' && !isGoodLoss);
                    const isMissedTrade = day.status === 'missed_trade';
                    const isToday = day.status === 'today';
                    const isVacation = day.status === 'holiday_freeze';
                    const isWeekend = (day.status === 'weekend_rest' || day.status === 'rest') && !hasTrades;

                    const isMatch = activeCategoryFilter === 'ALL' || 
                      (activeCategoryFilter === 'win' && isWin) ||
                      (activeCategoryFilter === 'good_loss' && isGoodLoss) ||
                      (activeCategoryFilter === 'breakeven' && isBreakeven) ||
                      (activeCategoryFilter === 'toxic_win' && isToxicWin) ||
                      (activeCategoryFilter === 'toxic_be' && isToxicBe) ||
                      (activeCategoryFilter === 'double_failure' && isDoubleFailure) ||
                      (activeCategoryFilter === 'missed_trade' && isMissedTrade);

                    const isHighlighted = activeCategoryFilter !== 'ALL' && isMatch;
                    const isDimmed = activeCategoryFilter !== 'ALL' && !isMatch;

                    let solidCardStyle = "bg-[#182830] border-2 border-[#20323D] text-slate-300";
                    if (isWin) solidCardStyle = "bg-[#58CC02] border-2 border-[#46A302] border-b-4 border-b-[#388202] text-white shadow-md";
                    else if (isGoodLoss) solidCardStyle = "bg-[#1CB0F6] border-2 border-[#1899D6] border-b-4 border-b-[#147BB0] text-white shadow-md";
                    else if (isBreakeven) solidCardStyle = "bg-[#CE82FF] border-2 border-[#B955FF] border-b-4 border-b-[#9D28EC] text-white shadow-md";
                    else if (isToxicWin) solidCardStyle = "bg-[#FFC800] border-2 border-[#D9AA00] border-b-4 border-b-[#8A6B00] text-slate-950 shadow-md";
                    else if (isToxicBe) solidCardStyle = "bg-[#00F0FF] border-2 border-[#00D8E6] border-b-4 border-b-[#00B3BF] text-slate-950 shadow-md";
                    else if (isDoubleFailure) solidCardStyle = "bg-[#FF4B4B] border-2 border-[#E53935] border-b-4 border-b-[#C62828] text-white shadow-md";
                    else if (isMissedTrade) solidCardStyle = "bg-amber-500 border-2 border-amber-600 border-b-4 border-b-amber-700 text-slate-950 shadow-md";
                    else if (isToday) solidCardStyle = "bg-[#FF6B00] border-2 border-[#C2410C] border-b-4 border-b-[#9A3412] text-white shadow-lg animate-pulse";
                    else if (isVacation) solidCardStyle = "bg-[#00F0FF] border-2 border-[#00D8E6] border-b-4 border-b-[#00B3BF] text-slate-950 shadow-md";
                    else if (isWeekend) solidCardStyle = "bg-[#142127]/60 border-2 border-[#20323D]/50 text-slate-500 opacity-40";

                    return (
                      <div
                        key={day.date}
                        onClick={() => {
                          soundFx.playPop();
                          if (day.pnl !== 'MARKET CLOSED') {
                            setActiveModalDay(day);
                          }
                        }}
                        className={`p-3 rounded-2xl transition-all duration-300 cursor-pointer min-h-[105px] flex flex-col items-center justify-between relative group active:scale-95 ${solidCardStyle} ${
                          isHighlighted
                            ? 'scale-[1.05] ring-4 ring-white z-20 shadow-2xl'
                            : isDimmed
                            ? 'opacity-20 grayscale scale-[0.95]'
                            : 'hover:brightness-110'
                        }`}
                      >
                        {/* Top Row: Date & Trade Count */}
                        <div className="w-full flex items-center justify-between text-[11px] font-black">
                          <span className="font-black text-xs">{day.date}</span>
                          <span className="text-[9px] font-black uppercase opacity-80">{day.count}</span>
                        </div>

                        {/* Center Hero: 3D Badge Icon */}
                        <div className="my-1 flex items-center justify-center">
                          {isToday ? (
                            <DuoCalendarIcon className="w-9 h-9 shrink-0 drop-shadow" />
                          ) : isWin ? (
                            <DuoDisciplinedWinIcon className="w-9 h-9 shrink-0 drop-shadow" />
                          ) : isGoodLoss ? (
                            <DuoDisciplinedLossIcon className="w-9 h-9 shrink-0 drop-shadow" />
                          ) : isBreakeven ? (
                            <DuoDisciplinedBeIcon className="w-9 h-9 shrink-0 drop-shadow" />
                          ) : isToxicWin ? (
                            <DuoToxicWinIcon className="w-9 h-9 shrink-0 drop-shadow" />
                          ) : isToxicBe ? (
                            <DuoToxicBeIcon className="w-9 h-9 shrink-0 drop-shadow" />
                          ) : isDoubleFailure ? (
                            <DuoDoubleFailureIcon className="w-9 h-9 shrink-0 drop-shadow" />
                          ) : isMissedTrade ? (
                            <DuoMissedTradeIcon className="w-9 h-9 shrink-0 drop-shadow" />
                          ) : (
                            <span className="text-xs font-black opacity-40">-</span>
                          )}
                        </div>

                        {/* Bottom Row: Clean P&L Typography */}
                        <div className="w-full text-center">
                          <div className="text-xs font-black font-mono tracking-tight opacity-90">
                            {formatDayPnl(day.pnl)}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Weekly Summary Column Cell */}
                  <div className="p-3 rounded-2xl bg-[#182830] border-2 border-[#20323D] border-l-2 border-l-[#1CB0F6] text-center flex flex-col justify-between min-h-[105px]">
                    <div className="text-[10px] font-black uppercase text-[#1CB0F6] tracking-wider">{weeklyData.weekLabel}</div>
                    <div className={`text-xs sm:text-sm font-black font-mono tracking-tight my-auto ${
                      String(weeklyData.pnl || '').startsWith('+') ? 'text-[#58CC02]' : String(weeklyData.pnl || '').startsWith('-') ? 'text-[#FF4B4B]' : 'text-slate-400'
                    }`}>
                      {formatDayPnl(weeklyData.pnl)}
                    </div>
                    <div className="text-[9px] font-bold text-slate-500">{weeklyData.count}</div>
                  </div>
                </React.Fragment>
              );

              dayIdx += 7;
              weekCount++;
            }

            return rows;
          })()}
        </div>
      </div>
    </div>
  </div>

      {/* INTERACTIVE DAY EXECUTION DETAILS POP-UP MODAL */}
      {activeModalDay && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="duo-card max-w-lg w-full p-5 sm:p-6 space-y-5 border-2 border-[#1CB0F6] relative bg-[#182830] max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => {
                soundFx.playPop();
                setActiveModalDay(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-xl bg-[#20323D] text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3">
              <DuoCalendarIcon className="w-10 h-10 shrink-0" />
              <div>
                <h3 className="text-xl font-black text-white">Day {activeModalDay.date} Execution Summary</h3>
                <p className="text-xs font-bold text-[#77909D]">{currentMonth.monthName}</p>
              </div>
            </div>

            {/* SOLID COLOR 3D DUOLINGO COMPLETED DAY CARD WITH DYNAMIC STATUS THEME */}
            {(() => {
              const modalStatus = activeModalDay?.status || 'win';
              const isWin = modalStatus === 'win' || modalStatus === 'FOLLOWED_WIN';
              const isGoodLoss = modalStatus === 'good_loss' || modalStatus === 'FOLLOWED_LOSS';
              const isBreakeven = modalStatus === 'breakeven';
              const isToxicWin = modalStatus === 'toxic_win' || modalStatus === 'violate_win';
              const isToxicBe = modalStatus === 'toxic_be';
              const isDoubleFailure = modalStatus === 'double_failure' || modalStatus === 'violate_loss' || (modalStatus === 'loss' && !isGoodLoss);
              const isMissedTrade = modalStatus === 'missed_trade';

              let modalTheme = {
                title: 'Disciplined Win',
                cardBorder: 'border-[#58CC02] border-b-[6px] border-b-[#388202]',
                topBar: 'bg-[#58CC02]',
                accentText: 'text-[#58CC02]',
                groupHoverText: 'group-hover:text-[#58CC02]',
                badgeBg: 'bg-[#58CC02] border-b-4 border-b-[#388202] text-white',
                icon: <Duo3dCheckBadge className="w-11 h-11 shrink-0 drop-shadow-lg group-hover:scale-110 transition-transform" />
              };

              if (isGoodLoss) {
                modalTheme = {
                  title: 'Disciplined Loss',
                  cardBorder: 'border-[#1CB0F6] border-b-[6px] border-b-[#147BB0]',
                  topBar: 'bg-[#1CB0F6]',
                  accentText: 'text-[#1CB0F6]',
                  groupHoverText: 'group-hover:text-[#1CB0F6]',
                  badgeBg: 'bg-[#1CB0F6] border-b-4 border-b-[#147BB0] text-white',
                  icon: <DuoDisciplinedLossIcon className="w-11 h-11 shrink-0 drop-shadow-lg group-hover:scale-110 transition-transform" />
                };
              } else if (isBreakeven) {
                modalTheme = {
                  title: 'Disciplined Breakeven',
                  cardBorder: 'border-[#CE82FF] border-b-[6px] border-b-[#9D28EC]',
                  topBar: 'bg-[#CE82FF]',
                  accentText: 'text-[#CE82FF]',
                  groupHoverText: 'group-hover:text-[#CE82FF]',
                  badgeBg: 'bg-[#CE82FF] border-b-4 border-b-[#9D28EC] text-white',
                  icon: <DuoDisciplinedBeIcon className="w-11 h-11 shrink-0 drop-shadow-lg group-hover:scale-110 transition-transform" />
                };
              } else if (isToxicWin) {
                modalTheme = {
                  title: 'Toxic Win',
                  cardBorder: 'border-[#FFC800] border-b-[6px] border-b-[#8A6B00]',
                  topBar: 'bg-[#FFC800]',
                  accentText: 'text-[#FFC800]',
                  groupHoverText: 'group-hover:text-[#FFC800]',
                  badgeBg: 'bg-[#FFC800] border-b-4 border-b-[#8A6B00] text-slate-950 font-black',
                  icon: <DuoToxicWinIcon className="w-11 h-11 shrink-0 drop-shadow-lg group-hover:scale-110 transition-transform" />
                };
              } else if (isToxicBe) {
                modalTheme = {
                  title: 'Toxic Breakeven',
                  cardBorder: 'border-[#00F0FF] border-b-[6px] border-b-[#00B3BF]',
                  topBar: 'bg-[#00F0FF]',
                  accentText: 'text-[#00F0FF]',
                  groupHoverText: 'group-hover:text-[#00F0FF]',
                  badgeBg: 'bg-[#00F0FF] border-b-4 border-b-[#00B3BF] text-slate-950 font-black',
                  icon: <DuoToxicBeIcon className="w-11 h-11 shrink-0 drop-shadow-lg group-hover:scale-110 transition-transform" />
                };
              } else if (isDoubleFailure) {
                modalTheme = {
                  title: 'Rule Violation & Loss',
                  cardBorder: 'border-[#FF4B4B] border-b-[6px] border-b-[#C62828]',
                  topBar: 'bg-[#FF4B4B]',
                  accentText: 'text-rose-400',
                  groupHoverText: 'group-hover:text-rose-400',
                  badgeBg: 'bg-rose-600 border-b-4 border-b-rose-800 text-white',
                  icon: <DuoDoubleFailureIcon className="w-11 h-11 shrink-0 drop-shadow-lg group-hover:scale-110 transition-transform" />
                };
              } else if (isMissedTrade) {
                modalTheme = {
                  title: 'Missed Setup',
                  cardBorder: 'border-amber-500 border-b-[6px] border-b-amber-700',
                  topBar: 'bg-amber-500',
                  accentText: 'text-amber-400',
                  groupHoverText: 'group-hover:text-amber-400',
                  badgeBg: 'bg-amber-500 border-b-4 border-b-amber-700 text-slate-950 font-black',
                  icon: <DuoMissedTradeIcon className="w-11 h-11 shrink-0 drop-shadow-lg group-hover:scale-110 transition-transform" />
                };
              }

              return (
                <div 
                  onClick={() => soundFx.playPop()}
                  className={`w-full p-6 sm:p-8 rounded-3xl border-2 ${modalTheme.cardBorder} bg-[#0D1635] text-white space-y-6 shadow-xl hover:-translate-y-1 active:translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden relative group text-left`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 ${modalTheme.topBar}`} />

                  {/* Top Header Badge */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {modalTheme.icon}
                      <div>
                        <span className={`text-xs font-black uppercase tracking-widest ${modalTheme.accentText} block`}>
                          DAY {activeModalDay.date} &bull; {currentMonth.monthName}
                        </span>
                        <h3 className={`text-xl sm:text-2xl font-black text-white leading-tight ${modalTheme.groupHoverText} transition-colors`}>
                          {modalTheme.title}
                        </h3>
                      </div>
                    </div>
                    <span className={`text-xs font-black px-4 py-1.5 rounded-2xl shadow-md ${modalTheme.badgeBg}`}>
                      {formatDayPnl(activeModalDay.pnl)}
                    </span>
                  </div>

              {/* 1. HERO SESSION DEBRIEF NOTE (BIG & FRONT-AND-CENTER, NO INNER BOX) */}
              <div className="flex items-start gap-4 py-3 border-y border-[#1C2A4E]">
                <Duo3dZenBadge className="w-11 h-11 shrink-0 drop-shadow-md mt-1" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <span className="text-xs font-black uppercase tracking-widest text-[#1CB0F6]">
                    KEY SESSION TAKEAWAY:
                  </span>
                  <p className="text-base sm:text-lg font-black text-white leading-snug italic">
                    "{((modalDayIsoDate ? loadStoredData(`tradepigeon_session_note_day_${modalDayIsoDate}`, null) : null) || loadStoredData(`tradepigeon_session_note_day_${activeModalDay.date}`, null) || 'No session debrief note recorded for this day.')}"
                  </p>
                </div>
              </div>

              {/* 2. THE 7 TYPES OF TRADES EXECUTION BREAKDOWN TILES */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[10px] font-black uppercase text-[#1CB0F6] tracking-widest">
                    THE 7 EXECUTION TYPES BREAKDOWN
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {modalDayTrades.length} Total Logs
                  </span>
                </div>

                {/* Section A: 3 Disciplined Types */}
                <div className="grid grid-cols-3 gap-2.5">
                  {/* 1: Disciplined Win */}
                  <div className="p-3 rounded-2xl bg-[#58CC02] border-b-4 border-[#388202] text-white space-y-1 shadow-md hover:-translate-y-0.5 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-white/95 truncate">DISCIPLINED WIN</span>
                      <DuoDisciplinedWinIcon className="w-4 h-4 shrink-0 drop-shadow" />
                    </div>
                    <div className="text-sm sm:text-base font-black text-white truncate">
                      {modalCategoryTotals.hasTrades ? modalCategoryTotals.disciplinedWin : (activeModalDay.status === 'win' ? activeModalDay.pnl : '+$0.00')}
                    </div>
                  </div>

                  {/* 2: Disciplined Loss */}
                  <div className="p-3 rounded-2xl bg-[#1CB0F6] border-b-4 border-[#147BB0] text-white space-y-1 shadow-md hover:-translate-y-0.5 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-white/95 truncate">DISCIPLINED LOSS</span>
                      <DuoDisciplinedLossIcon className="w-4 h-4 shrink-0 drop-shadow" />
                    </div>
                    <div className="text-sm sm:text-base font-black text-white truncate">
                      {modalCategoryTotals.hasTrades ? modalCategoryTotals.disciplinedLoss : (activeModalDay.status === 'good_loss' ? activeModalDay.pnl : '-$0.00')}
                    </div>
                  </div>

                  {/* 3: Disciplined BE */}
                  <div className="p-3 rounded-2xl bg-[#CE82FF] border-b-4 border-[#9D28EC] text-white space-y-1 shadow-md hover:-translate-y-0.5 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-white/95 truncate">DISCIPLINED BE</span>
                      <DuoDisciplinedBeIcon className="w-4 h-4 shrink-0 drop-shadow" />
                    </div>
                    <div className="text-sm sm:text-base font-black text-white truncate">
                      {modalCategoryTotals.disciplinedBe}
                    </div>
                  </div>
                </div>

                {/* Section B: 4 Toxic & Missed Types */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* 4: Toxic Win */}
                  <div className="p-3 rounded-2xl bg-[#182830] border-2 border-[#20323D] hover:border-[#FFC800] text-slate-300 space-y-1 shadow-sm transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#FFC800] truncate">TOXIC WIN</span>
                      <DuoToxicWinIcon className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="text-sm font-black text-white truncate">{modalCategoryTotals.toxicWin}</div>
                  </div>

                  {/* 5: Toxic BE */}
                  <div className="p-3 rounded-2xl bg-[#182830] border-2 border-[#20323D] hover:border-[#00F0FF] text-slate-300 space-y-1 shadow-sm transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#00F0FF] truncate">TOXIC BE</span>
                      <DuoToxicBeIcon className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="text-sm font-black text-white truncate">{modalCategoryTotals.toxicBe}</div>
                  </div>

                  {/* 6: Double Failure */}
                  <div className="p-3 rounded-2xl bg-[#182830] border-2 border-[#20323D] hover:border-[#FF4B4B] text-slate-300 space-y-1 shadow-sm transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#FF4B4B] truncate">DOUBLE FAIL</span>
                      <DuoDoubleFailureIcon className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="text-sm font-black text-white truncate">{modalCategoryTotals.doubleFailure}</div>
                  </div>

                  {/* 7: Missed Setup */}
                  <div className="p-3 rounded-2xl bg-[#182830] border-2 border-[#20323D] hover:border-[#FF9600] text-slate-300 space-y-1 shadow-sm transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#FF9600] truncate">MISSED SETUP</span>
                      <DuoMissedTradeIcon className="w-4 h-4 shrink-0" />
                    </div>
                    <div className="text-sm font-black text-white truncate">{modalCategoryTotals.missedTradeCount} Logged</div>
                  </div>
                </div>
              </div>

              {/* EXECUTED FILLS FOR THIS DAY */}
              {modalDayTrades.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-[#1C2A4E]">
                  <div className="text-[10px] font-black uppercase text-[#1CB0F6] tracking-wider">
                    EXECUTIONS LOGGED ({modalDayTrades.length})
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {modalDayTrades.map((t, idx) => {
                      const pnlNum = parseFinancialNumber(t.pnlNum !== undefined ? t.pnlNum : t.pnl, 0);
                      const displayPnl = isStealthMode
                        ? (t.rMultiple || t.r || formatRMultiple(pnlNum, 350, 1))
                        : (t.pnl || formatFinancialCurrency(pnlNum, { showPlus: true }));
                      const classification = classifyTradeExecution(t, numericLossLimit);

                      return (
                        <div key={t.id || idx} className="p-2.5 rounded-xl bg-[#142127] border border-[#20323D] flex items-center justify-between text-xs group/trade">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${t.side === 'LONG' || t.direction === 'LONG' ? 'bg-[#58CC02]/20 text-[#58CC02]' : 'bg-rose-500/20 text-rose-400'}`}>
                              {t.side || t.direction || 'TRADE'}
                            </span>
                            <span className="font-black text-white text-[11px]">{t.symbol}</span>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider shrink-0 ${classification.badgeBg}`}>
                              {classification.shortLabel}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 hidden sm:inline">{t.time}</span>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">{t.account}</span>
                            <span className={`text-xs font-black font-mono ${
                              classification.isToxicWin
                                ? 'text-amber-400'
                                : pnlNum > 0.001 || String(t.pnl || '').startsWith('+')
                                ? 'text-[#58CC02]'
                                : pnlNum < -0.001 || String(t.pnl || '').startsWith('-')
                                ? 'text-rose-400'
                                : 'text-slate-300'
                            }`}>
                              {classification.isToxicWin && <span className="text-[8px] mr-1 px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">TOXIC</span>}
                              {displayPnl}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (t.id) {
                                  soundFx.playPop();
                                  deleteTrades([t.id]);
                                  setTradesRevision(r => r + 1);
                                }
                              }}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete this trade record"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            );
            })()}

            <button
              onClick={() => {
                soundFx.playPop();
                setActiveModalDay(null);
              }}
              className="w-full py-3.5 duo-btn-blue text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg"
            >
              Close Session Breakdown
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
