import React, { useState, useEffect } from 'react';
import { Flame, Gem, Heart, Trophy, ChevronRight, ChevronLeft, ChevronDown, Lock, Calendar, CheckCircle2, ShieldAlert, CheckSquare, Plus, X, ShieldCheck, Check, Sparkles, Coffee, Activity, Moon, Trash2, AlertCircle } from 'lucide-react';
import { DuoLightningIcon, DuoIceIcon, DuoLockIcon, DuoChestIcon, DuoPlaneIcon, DuoPalmtreeIcon, DuoUndoIcon, DuoShieldIcon, DuoGemIcon, DuoStarIcon } from './DuoIcons';
import InteractiveParrotMascot from './InteractiveParrotMascot';
import AiDebriefModal from './AiDebriefModal';
import ManualTradeModal from './ManualTradeModal';
import PendingOrdersRadar from './PendingOrdersRadar';
import { loadStoredData, saveStoredData, subscribeToStorageUpdate, STORAGE_KEYS } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';

export default function RightStatusHub({ isExpanded = false, onToggleExpand, isMobileOpen = false, onCloseMobile, isInPage = false, onOpenCalendarTab }) {
  const [internalExpanded, setInternalExpanded] = useState(isExpanded);

  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdate(() => {
      const updatedStatus = loadStoredData('goodtrader_trading_status', 'TRADING');
      setTradingStatusState(updatedStatus);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setInternalExpanded(isExpanded);
  }, [isExpanded]);

  const handleExpandToggle = () => {
    soundFx.playPop();
    const next = !internalExpanded;
    setInternalExpanded(next);
    if (onToggleExpand) onToggleExpand();
  };

  const [selectedDay, setSelectedDay] = useState(9); // Default to Aug 10
  const [currentMonthIndex, setCurrentMonthIndex] = useState(1); // August
  const [newTaskText, setNewTaskText] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [tradingStatus, setTradingStatusState] = useState(() => loadStoredData('goodtrader_trading_status', 'TRADING'));
  const [isDebriefModalOpen, setIsDebriefModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [showAuditPrompt, setShowAuditPrompt] = useState(false);

  const currentDay = loadStoredData('goodtrader_current-day', 1);
  const [activeAuditDay, setActiveAuditDay] = useState(currentDay);
  const [selectedBasketFilter, setSelectedBasketFilter] = useState('ALL');
  const [selectedTradeIds, setSelectedTradeIds] = useState([]);
  const [streakFreezes, setStreakFreezes] = useState(() => loadStoredData('goodtrader_streak_freezes', 1));
  const [activeHubTab, setActiveHubTab] = useState('trades');
  const [isHeatmapExpanded, setIsHeatmapExpanded] = useState(true);

  const [sessionTrades, setSessionTrades] = useState(() => {
    return loadStoredData(`goodtrader_session_trades_day_${currentDay}`, [
      { id: 't1', symbol: 'NQ1!', side: 'LONG', time: '10:14 AM', pnl: '+$1,290.00', rMultiple: '+2.58R', type: 'win', playbook: 'PLAYBOOK A', account: 'Topstep 50k', verified: false },
      { id: 't2', symbol: 'NQ1!', side: 'SHORT', time: '11:30 AM', pnl: '-$425.00', rMultiple: '-0.85R', type: 'good_loss', playbook: 'PLAYBOOK B', account: 'Apex 150k', verified: false },
      { id: 't3', symbol: 'ES1!', side: 'LONG', time: '01:45 PM', pnl: '+$350.00', rMultiple: '+0.70R', type: 'toxic_win', playbook: 'PLAYBOOK A', account: 'Topstep 50k', verified: false }
    ]);
  });

  useEffect(() => {
    const loaded = loadStoredData(`goodtrader_session_trades_day_${activeAuditDay}`, [
      { id: 't1', symbol: 'NQ1!', side: 'LONG', time: '10:14 AM', pnl: '+$1,290.00', rMultiple: '+2.58R', type: 'win', playbook: 'PLAYBOOK A', account: 'Topstep 50k', verified: false },
      { id: 't2', symbol: 'NQ1!', side: 'SHORT', time: '11:30 AM', pnl: '-$425.00', rMultiple: '-0.85R', type: 'good_loss', playbook: 'PLAYBOOK B', account: 'Apex 150k', verified: false },
      { id: 't3', symbol: 'ES1!', side: 'LONG', time: '01:45 PM', pnl: '+$350.00', rMultiple: '+0.70R', type: 'toxic_win', playbook: 'PLAYBOOK A', account: 'Topstep 50k', verified: false }
    ]);
    setSessionTrades(loaded);
    setSelectedTradeIds([]);
  }, [activeAuditDay]);

  const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);
  const [newTradeSymbol, setNewTradeSymbol] = useState('NQ1!');
  const [newTradeSide, setNewTradeSide] = useState('LONG');
  const [newTradePnl, setNewTradePnl] = useState('+$500.00');
  const [newTradeType, setNewTradeType] = useState('win');
  const [newTradeAccount, setNewTradeAccount] = useState('Topstep 50k');

  const handleVerifyTrade = (tradeId, newType) => {
    soundFx.playPop();
    const updated = sessionTrades.map(t => t.id === tradeId ? { ...t, type: newType } : t);
    setSessionTrades(updated);
    saveStoredData(`goodtrader_session_trades_day_${activeAuditDay}`, updated);
  };

  const handleDeleteTrade = (tradeId) => {
    soundFx.playPop();
    const updated = sessionTrades.filter(t => t.id !== tradeId);
    setSessionTrades(updated);
    setSelectedTradeIds(selectedTradeIds.filter(id => id !== tradeId));
    saveStoredData(`goodtrader_session_trades_day_${activeAuditDay}`, updated);
  };

  const toggleSelectTrade = (tradeId) => {
    soundFx.playPop();
    if (selectedTradeIds.includes(tradeId)) {
      setSelectedTradeIds(selectedTradeIds.filter(id => id !== tradeId));
    } else {
      setSelectedTradeIds([...selectedTradeIds, tradeId]);
    }
  };

  const handleMergeSelectedTrades = () => {
    if (selectedTradeIds.length < 2) return;
    soundFx.playSuccess();
    const tradesToMerge = sessionTrades.filter(t => selectedTradeIds.includes(t.id));
    const first = tradesToMerge[0];

    let totalPnLNum = 0;
    tradesToMerge.forEach(t => {
      const clean = parseFloat(String(t.pnl).replace(/[^0-9.-]+/g, ''));
      if (!isNaN(clean)) totalPnLNum += clean;
    });

    const mergedTrade = {
      id: `t_merged_${Date.now()}`,
      symbol: first.symbol,
      side: first.side,
      time: `${first.time} (Merged)`,
      pnl: `${totalPnLNum >= 0 ? '+' : '-'}$${Math.abs(totalPnLNum).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      rMultiple: '+2.0R',
      type: first.type,
      playbook: first.playbook,
      account: first.account,
      verified: true
    };

    const remaining = sessionTrades.filter(t => !selectedTradeIds.includes(t.id));
    const updated = [mergedTrade, ...remaining];
    setSessionTrades(updated);
    setSelectedTradeIds([]);
    saveStoredData(`goodtrader_session_trades_day_${activeAuditDay}`, updated);
  };

  const playbooksList = ['Breakout & Retest', 'Trend Continuation', 'Liquidity Sweep', 'Custom Setup'];

  const handleCycleTradePlaybook = (tradeId, currentPlaybook) => {
    soundFx.playPop();
    const currentIdx = playbooksList.indexOf(currentPlaybook || 'Breakout & Retest');
    const nextPlaybook = playbooksList[(currentIdx + 1) % playbooksList.length];
    const updated = sessionTrades.map(t => t.id === tradeId ? { ...t, playbook: nextPlaybook } : t);
    setSessionTrades(updated);
    saveStoredData(`goodtrader_session_trades_day_${activeAuditDay}`, updated);
  };

  const handleRepairStreak = () => {
    if (streakFreezes > 0) {
      soundFx.playLevelUp();
      const nextTokens = streakFreezes - 1;
      setStreakFreezes(nextTokens);
      saveStoredData('goodtrader_streak_freezes', nextTokens);

      const stats = loadStoredData('goodtrader_user_stats', DEFAULT_USER_STATS);
      const updatedStats = { ...stats, streakDays: (stats.streakDays || 14) + 1 };
      saveStoredData('goodtrader_user_stats', updatedStats);
      alert('Streak Repaired! 1 Streak Repair Token applied.');
    } else {
      alert('You need 1 Streak Repair Token from the Shop (500 DP) to repair a streak!');
    }
  };

  const handleAddManualTrade = () => {
    soundFx.playSuccess();
    const newTrade = {
      id: `t_${Date.now()}`,
      symbol: newTradeSymbol,
      side: newTradeSide,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      pnl: newTradePnl,
      rMultiple: '+1.0R',
      type: newTradeType,
      playbook: 'PLAYBOOK A',
      account: newTradeAccount,
      verified: true
    };
    const updated = [...sessionTrades, newTrade];
    setSessionTrades(updated);
    saveStoredData(`goodtrader_session_trades_day_${activeAuditDay}`, updated);
    setIsAddTradeModalOpen(false);
  };

  const handleVerifyAllTradesAndLockAudit = () => {
    // Check if Pre-Session steps 1 & 2 are completed
    const completedSteps = loadStoredData('goodtrader_completed_steps', []);
    if (!completedSteps.includes(1) || !completedSteps.includes(2)) {
      alert('⚠️ Behavioral Protocol Requirement: Please complete Pre-Session Mindset Check (Step 1) & Playbook Sizing (Step 2) before verifying post-session trades!');
      return;
    }

    soundFx.playLevelUp();
    const verified = sessionTrades.map(t => ({ ...t, verified: true }));
    setSessionTrades(verified);
    saveStoredData(`goodtrader_session_trades_day_${activeAuditDay}`, verified);

    const winCount = verified.filter(t => t.type === 'win').length;
    const goodLossCount = verified.filter(t => t.type === 'good_loss' || t.type === 'breakeven').length;
    const toxicWinCount = verified.filter(t => t.type === 'toxic_win' || t.type === 'toxic_be').length;
    const doubleFailureCount = verified.filter(t => t.type === 'double_failure').length;

    saveStoredData(`goodtrader_trade_counts_day_${activeAuditDay}`, {
      winCount,
      goodLossCount,
      toxicWinCount,
      doubleFailureCount
    });

    if (!completedSteps.includes(4)) {
      const updatedSteps = [...completedSteps, 4];
      saveStoredData('goodtrader_completed_steps', updatedSteps);
    }

    setTradingStatusState('DONE');
    saveStoredData('goodtrader_trading_status', 'DONE');

    const completedDays = loadStoredData('goodtrader_completed_days', []);
    if (!completedDays.includes(activeAuditDay)) {
      saveStoredData('goodtrader_completed_days', [...completedDays, activeAuditDay]);
    }
  };

  const setTradingStatus = (newStatus) => {
    soundFx.playPop();
    if (newStatus === 'DONE') {
      const isAuditCompleted = Array.isArray(tasks) && tasks.find(t => t.id === 4)?.completed;
      if (!isAuditCompleted) {
        setTradingStatusState('DONE_PENDING');
        setShowAuditPrompt(true);
        setIsDebriefModalOpen(true);
        return;
      }
    } else if (newStatus === 'VACATION') {
      setActiveHubTab('heatmap');
    } else if (newStatus === 'TRADING') {
      setActiveHubTab('trades');
    }
    setShowAuditPrompt(false);
    setTradingStatusState(newStatus);
    saveStoredData('goodtrader_trading_status', newStatus);
    const isVac = newStatus === 'VACATION';
    saveStoredData('goodtrader_vacation_active', isVac);
    if (!isVac) {
      clearVacationRange();
    }
  };

  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [vacationDurationDays, setVacationDurationDays] = useState(7);

  const [calendarViewMode, setCalendarViewMode] = useState(() => loadStoredData('goodtrader_calendar_view_mode', 'discipline'));

  useEffect(() => {
    saveStoredData('goodtrader_calendar_view_mode', calendarViewMode);
  }, [calendarViewMode]);

  // Initial Default Months Data
  const defaultMonths = [
    {
      monthName: 'JULY 2026',
      days: [
        { date: 1, dayOfWeek: 'W', status: 'win', pnl: '+$800' }, { date: 2, dayOfWeek: 'T', status: 'win', pnl: '+$650' },
        { date: 3, dayOfWeek: 'F', status: 'good_loss', pnl: '-$300' }, { date: 4, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED' },
        { date: 5, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED' }, { date: 6, dayOfWeek: 'M', status: 'win', pnl: '+$1,400' },
        { date: 7, dayOfWeek: 'T', status: 'win', pnl: '+$920' }, { date: 8, dayOfWeek: 'W', status: 'win', pnl: '+$1,100' },
        { date: 9, dayOfWeek: 'T', status: 'good_loss', pnl: '-$250' }, { date: 10, dayOfWeek: 'F', status: 'win', pnl: '+$1,500' },
        { date: 11, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED' }, { date: 12, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED' },
        { date: 13, dayOfWeek: 'M', status: 'win', pnl: '+$750' }, { date: 14, dayOfWeek: 'T', status: 'win', pnl: '+$880' },
        { date: 15, dayOfWeek: 'W', status: 'good_loss', pnl: '-$180' }, { date: 16, dayOfWeek: 'T', status: 'win', pnl: '+$2,100' },
        { date: 17, dayOfWeek: 'F', status: 'win', pnl: '+$1,350' }, { date: 18, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED' },
        { date: 19, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED' }, { date: 20, dayOfWeek: 'M', status: 'win', pnl: '+$950' },
        { date: 21, dayOfWeek: 'T', status: 'win', pnl: '+$1,050' }, { date: 22, dayOfWeek: 'W', status: 'good_loss', pnl: '-$400' },
        { date: 23, dayOfWeek: 'T', status: 'win', pnl: '+$1,250' }, { date: 24, dayOfWeek: 'F', status: 'win', pnl: '+$1,600' },
        { date: 25, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED' }, { date: 26, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED' },
        { date: 27, dayOfWeek: 'M', status: 'win', pnl: '+$700' }, { date: 28, dayOfWeek: 'T', status: 'win', pnl: '+$900' },
        { date: 29, dayOfWeek: 'W', status: 'good_loss', pnl: '-$150' }, { date: 30, dayOfWeek: 'T', status: 'win', pnl: '+$1,150' },
        { date: 31, dayOfWeek: 'F', status: 'win', pnl: '+$1,450' }
      ]
    },
    {
      monthName: 'AUGUST 2026',
      days: [
        { date: 1, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED' }, { date: 2, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED' },
        { date: 3, dayOfWeek: 'M', status: 'win', pnl: '+$450' }, { date: 4, dayOfWeek: 'T', status: 'win', pnl: '+$1,200' },
        { date: 5, dayOfWeek: 'W', status: 'good_loss', pnl: '-$200' }, { date: 6, dayOfWeek: 'T', status: 'holiday_freeze', pnl: 'HOLIDAY / NO TRADE' },
        { date: 7, dayOfWeek: 'F', status: 'win', pnl: '+$600' }, { date: 8, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED' },
        { date: 9, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED' }, { date: 10, dayOfWeek: 'M', status: 'today', pnl: '+$4,250' },
        { date: 11, dayOfWeek: 'T', status: 'upcoming', pnl: '-' }, { date: 12, dayOfWeek: 'W', status: 'upcoming', pnl: '-' },
        { date: 13, dayOfWeek: 'T', status: 'upcoming', pnl: '-' }, { date: 14, dayOfWeek: 'F', status: 'upcoming', pnl: '-' },
        { date: 15, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED' }, { date: 16, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED' },
        { date: 17, dayOfWeek: 'M', status: 'upcoming', pnl: '-' }, { date: 18, dayOfWeek: 'T', status: 'upcoming', pnl: '-' },
        { date: 19, dayOfWeek: 'W', status: 'upcoming', pnl: '-' }, { date: 20, dayOfWeek: 'T', status: 'upcoming', pnl: '-' },
        { date: 21, dayOfWeek: 'F', status: 'upcoming', pnl: '-' }, { date: 22, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED' },
        { date: 23, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED' }, { date: 24, dayOfWeek: 'M', status: 'upcoming', pnl: '-' },
        { date: 25, dayOfWeek: 'T', status: 'upcoming', pnl: '-' }, { date: 26, dayOfWeek: 'W', status: 'upcoming', pnl: '-' },
        { date: 27, dayOfWeek: 'T', status: 'upcoming', pnl: '-' }, { date: 28, dayOfWeek: 'F', status: 'upcoming', pnl: '-' },
        { date: 29, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED' }, { date: 30, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED' },
        { date: 31, dayOfWeek: 'M', status: 'upcoming', pnl: '-' }
      ]
    },
    {
      monthName: 'SEPTEMBER 2026',
      days: Array.from({ length: 30 }, (_, i) => ({ date: i + 1, status: 'upcoming', pnl: '-' }))
    }
  ];

  // Month Historical Data State with localStorage
  const [monthsData, setMonthsData] = useState(() => {
    try {
      const loaded = loadStoredData(STORAGE_KEYS.CALENDAR_DATA, defaultMonths);
      if (Array.isArray(loaded) && loaded.length >= 2 && loaded[1] && Array.isArray(loaded[1].days)) {
        return loaded;
      }
    } catch (e) {
      console.warn('Resetting corrupted calendar data:', e);
    }
    return defaultMonths;
  });

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.CALENDAR_DATA, monthsData);
  }, [monthsData]);

  const safeMonths = Array.isArray(monthsData) && monthsData.length > 0 ? monthsData : defaultMonths;
  const safeMonthIndex = currentMonthIndex < safeMonths.length ? currentMonthIndex : 1;
  const currentMonthData = safeMonths[safeMonthIndex] || defaultMonths[1];
  const [dailyNotes, setDailyNotes] = useState(() => loadStoredData('goodtrader_daily_notes', {}));

  const [isIntegrityModalOpen, setIsIntegrityModalOpen] = useState(false);
  const [integrityMessage, setIntegrityMessage] = useState('');

  // TOGGLE NO TRADE (DISCIPLINE REST DAY) WITH DATA INTEGRITY SAFEGUARD
  const handleToggleNoTrade = () => {
    const baseMonths = Array.isArray(monthsData) && monthsData.length > 0 ? monthsData : defaultMonths;
    const updatedMonths = JSON.parse(JSON.stringify(baseMonths));
    const targetMonth = updatedMonths[safeMonthIndex] || updatedMonths[0];
    if (!targetMonth || !Array.isArray(targetMonth.days)) return;
    const targetDay = targetMonth.days[selectedDay] || targetMonth.days[0];
    if (!targetDay) return;

    // DATA INTEGRITY SAFEGUARD:
    // If a day has active verified broker fills (PnL != $0), prevent marking it as "No Trade"
    const hasActiveTrades = targetDay.pnl && targetDay.pnl !== '-' && targetDay.pnl !== 'MARKET CLOSED' && targetDay.pnl !== '$0.00 (No Setup)';
    
    if (targetDay.status !== 'no_trade' && hasActiveTrades) {
      soundFx.playPop();
      setIntegrityMessage(`Day ${targetDay.date} has active executed trade fills (${targetDay.pnl}). You cannot mark a day with executed fills as "No Trade". Delete or archive fills first if logged in error.`);
      setIsIntegrityModalOpen(true);
      return;
    }

    soundFx.playSuccess();
    if (targetDay.status === 'no_trade') {
      targetDay.status = targetDay.previousStatus || 'today';
      targetDay.pnl = targetDay.previousPnl || '+$4,250';
    } else {
      targetDay.previousStatus = targetDay.status;
      targetDay.previousPnl = targetDay.pnl;
      targetDay.status = 'no_trade';
      targetDay.pnl = '$0.00 (No Setup)';
    }
    setMonthsData(updatedMonths);
  };

  // MULTI-DAY VACATION RANGE SETTER (e.g., Set 3, 7, 14, or 30 Days Vacation at Once!)
  const handleApplyVacationRange = (numDays) => {
    const baseMonths = Array.isArray(monthsData) && monthsData.length > 0 ? monthsData : defaultMonths;
    const updatedMonths = JSON.parse(JSON.stringify(baseMonths));
    const targetMonth = updatedMonths[safeMonthIndex] || updatedMonths[0];
    if (!targetMonth || !Array.isArray(targetMonth.days)) return;
    const daysArr = targetMonth.days;
    const defaultDays = defaultMonths[safeMonthIndex]?.days || defaultMonths[1]?.days || [];

    // First reset any existing holiday_freeze tiles in the month back to original state
    daysArr.forEach((day, idx) => {
      if (day.status === 'holiday_freeze') {
        const orig = defaultDays[idx];
        const prev = day.previousStatus;
        day.status = (prev && prev !== 'holiday_freeze') ? prev : (orig?.status || (idx + 1 === 10 ? 'today' : 'upcoming'));
        day.pnl = (day.previousPnl && day.previousPnl !== 'HOLIDAY / NO TRADE') ? day.previousPnl : (orig?.pnl || '-');
      }
    });

    const startIndex = Math.min(selectedDay, daysArr.length - 1);
    const endIndex = Math.min(daysArr.length - 1, startIndex + numDays - 1);

    for (let i = startIndex; i <= endIndex; i++) {
      if (daysArr[i] && daysArr[i].status !== 'weekend_rest') {
        if (daysArr[i].status !== 'holiday_freeze') {
          daysArr[i].previousStatus = daysArr[i].status;
          daysArr[i].previousPnl = daysArr[i].pnl;
        }
        daysArr[i].status = 'holiday_freeze';
        daysArr[i].pnl = 'HOLIDAY / NO TRADE';
      }
    }
    setMonthsData(updatedMonths);
    saveStoredData('goodtrader_months_data', updatedMonths);
    setIsVacationActive(true);
    saveStoredData('goodtrader_vacation_active', true);
    setIsVacationModalOpen(false);
  };

  const clearVacationRange = () => {
    const baseMonths = Array.isArray(monthsData) && monthsData.length > 0 ? monthsData : defaultMonths;
    const updatedMonths = JSON.parse(JSON.stringify(baseMonths));
    const targetMonth = updatedMonths[safeMonthIndex] || updatedMonths[0];
    if (targetMonth && Array.isArray(targetMonth.days)) {
      const defaultDays = defaultMonths[safeMonthIndex]?.days || defaultMonths[1]?.days || [];
      targetMonth.days.forEach((day, idx) => {
        if (day.status === 'holiday_freeze') {
          const orig = defaultDays[idx];
          const prev = day.previousStatus;
          day.status = (prev && prev !== 'holiday_freeze') ? prev : (orig?.status || (idx + 1 === 10 ? 'today' : 'upcoming'));
          day.pnl = (day.previousPnl && day.previousPnl !== 'HOLIDAY / NO TRADE') ? day.previousPnl : (orig?.pnl || '-');
        }
      });
      setMonthsData(updatedMonths);
      saveStoredData('goodtrader_months_data', updatedMonths);
    }
  };

  // Default Daily Tasks Checklist
  const defaultTasks = [
    { id: 1, text: 'Pre-Market Mindset Check', completed: true, reward: '+50 DP' },
    { id: 2, text: 'Review Live Equity Cockpit', completed: true, reward: '+50 DP' },
    { id: 3, text: 'Tag 3 Fills with Setup Proof', completed: false, reward: '+100 DP' },
    { id: 4, text: 'Complete Post-Session Audit @ Close', completed: false, reward: '+150 DP' },
  ];

  const [tasks, setTasks] = useState(() => {
    try {
      const loaded = loadStoredData(STORAGE_KEYS.QUESTS, defaultTasks);
      if (Array.isArray(loaded) && loaded.length > 0 && loaded[0] && typeof loaded[0] === 'object') {
        return loaded;
      }
    } catch (e) {
      console.warn('Resetting corrupted tasks storage:', e);
    }
    return defaultTasks;
  });

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.QUESTS, tasks);
  }, [tasks]);

  const toggleTask = (id) => {
    const current = Array.isArray(tasks) ? tasks : defaultTasks;
    const updated = current.map(t => {
      if (t && t.id === id) {
        const nextState = !t.completed;
        if (nextState) soundFx.playSuccess();
        return { ...t, completed: nextState };
      }
      return t;
    });
    setTasks(updated);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now(),
      text: newTaskText.trim(),
      completed: false,
      isCustom: true,
      reward: null
    };
    const current = Array.isArray(tasks) ? tasks : defaultTasks;
    setTasks([...current, newTask]);
    setNewTaskText('');
    setIsAddingTask(false);
  };

  const deleteTask = (e, id) => {
    e.stopPropagation();
    const current = Array.isArray(tasks) ? tasks : defaultTasks;
    setTasks(current.filter(t => t && t.id !== id));
  };

  return (
    <>
      {/* Mobile Backdrop Overlay (< xl) */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 xl:hidden animate-fade-in"
        />
      )}

      <aside className={isInPage ? "w-full space-y-6 block pb-20" : `h-screen fixed right-0 top-0 bg-[#070C1E] border-l-2 border-[#1C2A4E] p-6 pb-36 space-y-6 overflow-y-auto z-50 transition-all duration-300 ${
        internalExpanded 
          ? 'w-full sm:w-[720px] lg:w-[760px] xl:w-[820px] shadow-[0_0_60px_rgba(0,0,0,0.85)] block' 
          : isMobileOpen 
          ? 'w-full sm:w-[380px] flex flex-col shadow-2xl block' 
          : 'hidden xl:block w-80 xl:w-96'
      }`}>
      
      {/* TOP HEADER: COLLAPSE / EXPAND / MOBILE CLOSE (ONLY RENDERED WHEN NOT IN-PAGE) */}
      {!isInPage && (
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExpandToggle}
              className="hidden xl:flex px-3 py-1.5 rounded-xl bg-[#182830] border-2 border-[#1CB0F6] hover:bg-[#1CB0F6] text-[#1CB0F6] hover:text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer items-center gap-1.5 shadow-md active:scale-95"
              title={internalExpanded ? "Collapse View" : "Expand View"}
            >
              {internalExpanded ? (
                <>
                  <ChevronRight size={16} />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <ChevronLeft size={16} />
                  <span>Expand</span>
                </>
              )}
            </button>

            {internalExpanded && (
              <span className="text-[10px] font-black uppercase tracking-wider text-[#1CB0F6] px-2.5 py-1 rounded-lg bg-[#1CB0F6]/15 border border-[#1CB0F6]/30">
                FULL PANORAMA MODE
              </span>
            )}
          </div>

          {/* Close Drawer Button (< xl screens) */}
          <button
            onClick={onCloseMobile}
            className="xl:hidden duo-btn-red px-3 py-1.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ml-auto"
            title="Close Sidebar Drawer"
          >
            <X size={16} />
            <span>Close</span>
          </button>
        </div>
      )}

      {/* IN-PAGE FULL HEADER BANNER (ONLY RENDERED WHEN IN-PAGE) */}
      {isInPage && (
        <div className="flex items-center gap-3.5 pb-2">
          <DuoShieldIcon className="w-10 h-10 shrink-0" />
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Session Cockpit</h2>
        </div>
      )}

        {/* DUOLINGO COMPACT TOP HORIZONTAL STAT PILL BAR (EXACT MATCH WITH REAL DUOLINGO HEADER) */}
        <div className="grid grid-cols-4 gap-2">
          {/* Item 1: Season / Level Badge */}
          <div className="flex items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-[#182830] border-2 border-[#20323D] border-b-4 border-b-[#142127] shadow-sm" title="Season 1 Protocol Day 30">
            <DuoStarIcon className="w-5 h-5 shrink-0" />
            <span className="text-xs sm:text-sm font-black text-white">30</span>
          </div>

          {/* Item 2: Streak Flame */}
          <div className="flex items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-[#182830] border-2 border-[#20323D] border-b-4 border-b-[#142127] shadow-sm" title="Discipline Streak: 14 Consecutive Days">
            <DuoLightningIcon className="w-5 h-5 shrink-0" />
            <span className="text-xs sm:text-sm font-black text-[#FF6B00]">14</span>
          </div>

          {/* Item 3: Gems / DP */}
          <div className="flex items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-[#182830] border-2 border-[#20323D] border-b-4 border-b-[#142127] shadow-sm" title="Discipline Points: 3,420 DP">
            <DuoGemIcon className="w-5 h-5 shrink-0" />
            <span className="text-xs sm:text-sm font-black text-[#1CB0F6]">3.4k</span>
          </div>

          {/* Item 4: Disciplined Trades */}
          <div 
            onClick={() => {
              soundFx.playPop();
              setIsRulesModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-[#182830] border-2 border-[#20323D] border-b-4 border-b-[#142127] hover:border-[#58CC02] cursor-pointer transition-all active:scale-95 shadow-sm"
            title="Disciplined Trades: 16 Trades Taken (Click for breakdown)"
          >
            <DuoShieldIcon className="w-5 h-5 shrink-0" />
            <span className="text-xs sm:text-sm font-black text-[#58CC02]">16</span>
          </div>
        </div>

        {/* ORPHAN PENDING ORDER RADAR */}
        <PendingOrdersRadar />

        {/* 2. TRADING STATUS 3-STATE SEGMENTED CONTROL */}
        <div className="p-3.5 rounded-2xl bg-[#142127] border-2 border-[#20323D] space-y-3 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase text-[#52656D] tracking-wider">
              TRADING STATUS
            </span>
            <span className={`text-[10px] font-black px-3 py-1 rounded-xl uppercase border-2 flex items-center gap-1 shadow-md ${
              tradingStatus === 'VACATION'
                ? 'bg-[#00F0FF] text-slate-950 border-[#00F0FF] border-b-2 border-b-[#00B3BF]'
                : tradingStatus === 'DONE'
                ? 'bg-amber-500 text-slate-950 border-amber-500 border-b-2 border-b-amber-700'
                : 'bg-[#58CC02] text-white border-[#58CC02] border-b-2 border-b-[#3C8901]'
            }`}>
              {tradingStatus === 'VACATION' ? (
                <>
                  <DuoPalmtreeIcon className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
                  <span>VACATION</span>
                </>
              ) : tradingStatus === 'DONE' ? (
                <>
                  <CheckCircle2 size={12} className="text-amber-300 shrink-0" />
                  <span>DONE TODAY</span>
                </>
              ) : (
                <>
                  <Activity size={12} className="text-[#58CC02] animate-pulse shrink-0" />
                  <span>TRADING</span>
                </>
              )}
            </span>
          </div>

          {/* 3-WAY SEGMENTED BUTTON SWITCHER */}
          <div className="grid grid-cols-3 gap-1 bg-[#182830] p-1 rounded-2xl border border-[#20323D]">
            <button
              onClick={() => setTradingStatus('TRADING')}
              className={`py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                tradingStatus === 'TRADING'
                  ? 'bg-[#58CC02] text-white shadow-md border-b-2 border-b-[#3C8901]'
                  : 'text-[#52656D] hover:text-white'
              }`}
            >
              <Activity size={14} />
              <span>Trading</span>
            </button>

            <button
              onClick={() => setTradingStatus('DONE')}
              className={`py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                tradingStatus === 'DONE' || tradingStatus === 'DONE_PENDING'
                  ? 'bg-amber-500 text-slate-900 shadow-md font-black border-b-2 border-b-amber-700'
                  : 'text-[#52656D] hover:text-white'
              }`}
            >
              <CheckCircle2 size={14} />
              <span>Done Today</span>
            </button>

            <button
              onClick={() => setTradingStatus('VACATION')}
              className={`py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                tradingStatus === 'VACATION'
                  ? 'bg-[#00F0FF] text-slate-900 shadow-md font-black border-b-2 border-b-[#00B3BF]'
                  : 'text-[#52656D] hover:text-white'
              }`}
            >
              <DuoPalmtreeIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Vacation</span>
            </button>
          </div>
        </div>

        {/* SECTION 2: DYNAMIC SESSION COCKPIT PANEL (DRIVEN BY TRADING STATUS) */}
        
        {/* STATE 0: PAST DAY AUDIT / REPAIR MODE (WHEN USER CLICKS A PAST DAY ON HEATMAP) */}
        {activeAuditDay < currentDay && (
          <div className="p-3.5 rounded-2xl bg-[#182830] border-2 border-[#00F0FF]/40 space-y-2.5 shadow-md text-left mt-3 animate-fade-in">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-[#00F0FF]" />
                <span className="text-[10px] font-black uppercase text-[#00F0FF] tracking-wider">
                  PAST SESSION AUDIT (DAY {activeAuditDay})
                </span>
              </div>
              <button
                onClick={() => {
                  soundFx.playPop();
                  setActiveAuditDay(currentDay);
                }}
                className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-[#142127] hover:bg-[#20323D] border border-[#00F0FF]/30 text-[#00F0FF] cursor-pointer transition-all flex items-center gap-1"
              >
                <RotateCcw size={10} />
                <span>Return to Today (Day {currentDay})</span>
              </button>
            </div>

            {/* STREAK REPAIR PROMPT FOR MISSED SESSION */}
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-amber-300 text-[10px] block">Unaudited Missed Session (Day {activeAuditDay})</span>
                <span className="text-[9px] text-slate-400 block">Use 1 Freeze Token to repair streak</span>
              </div>
              <button
                onClick={handleRepairStreak}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase border border-amber-400 cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                Repair Streak ({streakFreezes} Available)
              </button>
            </div>

            {/* Trades List for Past Day */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5 scrollbar-none">
              {sessionTrades.length === 0 ? (
                <div className="p-2 rounded-xl bg-[#142127] border border-[#20323D] text-center text-[10px] font-bold text-slate-400">
                  No trades recorded for Day {activeAuditDay}.
                </div>
              ) : (
                sessionTrades.map((trade) => (
                  <div key={trade.id} className="p-2 rounded-xl bg-[#142127] border border-[#20323D] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-black px-1 py-0.5 rounded ${trade.side === 'LONG' ? 'bg-[#58CC02]/20 text-[#58CC02]' : 'bg-rose-500/20 text-rose-400'}`}>
                        {trade.side}
                      </span>
                      <span className="font-black text-white text-[11px]">{trade.symbol}</span>
                    </div>
                    <span className="font-black text-white text-[11px]">{trade.pnl}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STATE 1: TRADING MODE -> TODAY'S TRADES & FILL CLASSIFIER */}
        {tradingStatus === 'TRADING' && activeAuditDay === currentDay && (
          <div className="p-3.5 rounded-2xl bg-[#182830] border-2 border-[#20323D] space-y-2.5 shadow-md text-left mt-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#1CB0F6]" />
                <span className="text-[10px] font-black uppercase text-white tracking-wider">
                  TODAY'S TRADES ({sessionTrades.length})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedTradeIds.length >= 2 && (
                  <button
                    onClick={handleMergeSelectedTrades}
                    className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-[#FFC800] text-slate-950 hover:bg-amber-400 border border-amber-500 cursor-pointer transition-all flex items-center gap-1 shadow-sm animate-pulse"
                  >
                    <span>Merge ({selectedTradeIds.length}) Fills</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    soundFx.playPop();
                    const newMissed = {
                      id: 'm_' + Date.now(),
                      symbol: 'NQ1!',
                      side: 'MISSED',
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      pnl: '$0.00 (Hesitated)',
                      rMultiple: '0.0R',
                      type: 'missed_trade',
                      playbook: 'Breakout & Retest',
                      account: 'Topstep 50k',
                      verified: true
                    };
                    const updated = [...sessionTrades, newMissed];
                    setSessionTrades(updated);
                    saveStoredData(`goodtrader_session_trades_day_${activeAuditDay}`, updated);
                  }}
                  className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 cursor-pointer transition-all flex items-center gap-1"
                  title="Log a setup that presented but you hesitated or missed"
                >
                  <AlertCircle size={10} />
                  <span>+ Missed Setup</span>
                </button>

                <button
                  onClick={() => {
                    soundFx.playPop();
                    setIsAddTradeModalOpen(true);
                  }}
                  className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-[#142127] hover:bg-[#20323D] border border-[#20323D] text-[#1CB0F6] cursor-pointer transition-all flex items-center gap-1"
                >
                  <Plus size={10} />
                  <span>Add Trade</span>
                </button>
              </div>
            </div>

            {/* Account / Risk Basket Source Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {['ALL', 'Topstep 50k', 'Apex 150k'].map((basket) => (
                <button
                  key={basket}
                  onClick={() => setSelectedBasketFilter(basket)}
                  className={`text-[9px] font-black px-2 py-0.5 rounded-md transition-all cursor-pointer whitespace-nowrap border ${
                    selectedBasketFilter === basket
                      ? 'bg-[#1CB0F6] text-white border-[#147BB0]'
                      : 'bg-[#142127] text-slate-400 border-[#20323D] hover:text-white'
                  }`}
                >
                  {basket === 'ALL' ? 'ALL ACCOUNTS' : basket}
                </button>
              ))}
            </div>

            {/* Trade Cards List */}
            <div 
              className="space-y-2 max-h-44 overflow-y-auto pr-0.5 scrollbar-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {sessionTrades.length === 0 ? (
                <div className="p-2.5 rounded-xl bg-[#142127] border border-[#20323D] text-center text-[10px] font-bold text-slate-400">
                  No trades logged for today yet.
                </div>
              ) : (
                sessionTrades
                  .filter(t => selectedBasketFilter === 'ALL' || t.account === selectedBasketFilter)
                  .map((trade) => {
                    const isChecked = selectedTradeIds.includes(trade.id);
                    return (
                      <div key={trade.id} className={`p-2 rounded-xl bg-[#142127] border transition-all space-y-1 shadow-sm ${isChecked ? 'border-[#FFC800] bg-[#FFC800]/10' : 'border-[#20323D]'}`}>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleSelectTrade(trade.id)}
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-[#FFC800] border-amber-600 text-slate-950 shadow-sm'
                                  : 'bg-[#182830] border-[#20323D] hover:border-[#1CB0F6]'
                              }`}
                              title="Select for Fill Merging"
                            >
                              {isChecked && <Check size={9} strokeWidth={4} />}
                            </button>

                            <span className={`text-[9px] font-black px-1 py-0.5 rounded ${trade.side === 'LONG' ? 'bg-[#58CC02]/20 text-[#58CC02]' : 'bg-rose-500/20 text-rose-400'}`}>
                              {trade.side}
                            </span>
                            <span className="font-black text-white text-[11px]">{trade.symbol}</span>
                            <span className="text-[9px] font-bold text-slate-500">{trade.time}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-white text-[11px]">{trade.pnl}</span>
                            <button
                              onClick={() => handleDeleteTrade(trade.id)}
                              className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer transition-colors"
                              title="Delete Trade"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Account & Playbook Badges */}
                        <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 pt-0.5">
                          <span className="bg-[#182830] px-1.5 py-0.5 rounded border border-[#20323D] text-[#00F0FF] font-black">
                            {trade.account || 'Topstep 50k'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCycleTradePlaybook(trade.id, trade.playbook)}
                            className="bg-[#182830] hover:bg-[#20323D] text-[#1CB0F6] border border-[#20323D] hover:border-[#1CB0F6] px-2 py-0.5 rounded text-[9px] font-black cursor-pointer transition-all flex items-center gap-1"
                            title="Click to cycle strategy playbook (Zero popups)"
                          >
                            <span>{trade.playbook || 'Breakout & Retest'}</span>
                          </button>
                        </div>

                        {/* 6 Execution Matrix Classification Pills */}
                        <div className="grid grid-cols-3 gap-1 pt-1">
                          {[
                            { id: 'win', label: 'Disciplined Win', color: 'bg-[#58CC02] border-[#388202] text-white' },
                            { id: 'good_loss', label: 'Disciplined Loss', color: 'bg-[#1CB0F6] border-[#147BB0] text-white' },
                            { id: 'breakeven', label: 'Disciplined BE', color: 'bg-[#CE82FF] border-[#9D28EC] text-white' },
                            { id: 'toxic_win', label: 'Toxic Win', color: 'bg-[#FFC800] border-[#8A6B00] text-slate-950' },
                            { id: 'toxic_be', label: 'Toxic BE', color: 'bg-[#00F0FF] border-[#00B3BF] text-slate-950' },
                            { id: 'double_failure', label: 'Double Failure', color: 'bg-[#FF4B4B] border-[#C62828] text-white' },
                          ].map((typeOption) => {
                            const isSelected = trade.type === typeOption.id;
                            return (
                              <button
                                key={typeOption.id}
                                onClick={() => handleVerifyTrade(trade.id, typeOption.id)}
                                className={`py-1 px-0.5 rounded-lg text-[8px] font-black transition-all cursor-pointer border text-center truncate ${
                                  isSelected
                                    ? `${typeOption.color} font-black scale-[1.02] shadow-sm`
                                    : 'bg-[#182830] border-[#20323D] text-slate-400 hover:text-white'
                                }`}
                              >
                                {typeOption.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* STATE 2: DONE TODAY MODE -> DEDICATED DEBRIEF JOURNAL & LOCK COCKPIT */}
        {(tradingStatus === 'DONE' || tradingStatus === 'DONE_PENDING') && activeAuditDay === currentDay && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 space-y-3 shadow-md text-left mt-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                <span>SESSION AUDIT & DEBRIEF</span>
              </span>
              <span className="text-[9px] font-black text-[#58CC02] bg-[#58CC02]/20 px-2 py-0.5 rounded-md border border-[#58CC02]/30">
                +150 DP BONUS
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#142127] border border-[#20323D] space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-bold">
                <span>Today's Trades Logged:</span>
                <span className="text-white font-black">{sessionTrades.length} Trades</span>
              </div>
              <div className="flex items-center justify-between text-slate-300 font-bold">
                <span>Session Journal Status:</span>
                <span className="text-amber-300 font-black">
                  {tasks.find(t => t.id === 4)?.completed ? 'Completed' : 'Debrief Pending'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playPop();
                setIsDebriefModalOpen(true);
              }}
              className="duo-btn-green w-full py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>{tasks.find(t => t.id === 4)?.completed ? 'Edit Journal Debrief' : 'Log 60-Sec Debrief Journal'}</span>
            </button>

            <button
              onClick={handleVerifyAllTradesAndLockAudit}
              className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 border border-amber-600 shadow-md cursor-pointer active:scale-95"
            >
              <CheckCircle2 size={14} />
              <span>Verify & Lock Protocol Audit</span>
            </button>
          </div>
        )}

        {/* STATE 3: VACATION MODE -> VACATION FREEZE CONTROLS */}
        {tradingStatus === 'VACATION' && (
          <div className="p-3.5 rounded-2xl bg-[#142127] border-2 border-[#00F0FF]/40 space-y-3 text-left shadow-md mt-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-[#00F0FF] tracking-wider flex items-center gap-1.5">
                <DuoPalmtreeIcon className="w-4 h-4 text-[#00F0FF]" />
                <span>VACATION FREEZE PROTOCOL</span>
              </span>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-md border bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40">
                STREAK PROTECTED
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase block">Select Vacation Freeze Duration:</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[3, 7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      soundFx.playSuccess();
                      setVacationDurationDays(days);
                      saveStoredData('goodtrader_vacation_duration', days);
                      handleApplyVacationRange(days);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer border-2 ${
                      vacationDurationDays === days
                        ? 'bg-[#00F0FF] text-slate-950 border-[#00F0FF] border-b-4 border-b-[#00B3BF] font-black shadow-md'
                        : 'bg-[#182830] text-slate-200 hover:text-white border-[#20323D] hover:border-[#00F0FF]/50 border-b-4 border-b-[#142127]'
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTradingStatus('TRADING')}
              className="duo-btn-red w-full py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95 mt-1"
            >
              <X size={15} />
              <span>Resume Trading (End Vacation)</span>
            </button>
          </div>
        )}

        {/* SECTION 3: DISCIPLINE HEATMAP (ALWAYS VISIBLE, 100% READABLE & PROTOCOL MAP CONTROLLER) */}
        <div className="duo-card p-3.5 space-y-2.5 border-2 border-[#58CC02]/40 bg-[#182830] shadow-xl mt-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#58CC02]" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Discipline Heatmap
              </h3>
            </div>

            {/* Month Switcher Controls */}
            <div className="flex items-center gap-1.5 bg-[#142127] border border-[#20323D] px-2 py-0.5 rounded-xl">
              <button 
                disabled={currentMonthIndex === 0}
                onClick={() => setCurrentMonthIndex(currentMonthIndex - 1)}
                className="text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="text-[10px] font-black text-[#58CC02]">{currentMonthData.monthName}</span>
              <button 
                disabled={currentMonthIndex === monthsData.length - 1}
                onClick={() => setCurrentMonthIndex(currentMonthIndex + 1)}
                className="text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Days of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-[#52656D]">
            <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
          </div>

          {/* Compact Month Grid (MON-SUN, 1-31, 100% visible with ZERO cutoffs) */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {currentMonthData.days.map((item, idx) => {
              const isSelected = selectedDay === idx;
              
              let bgClass = "bg-[#142127] border border-[#20323D] text-slate-600";
              if (item.status === 'win') bgClass = "bg-[#58CC02] border border-[#46A302] border-b-2 border-b-[#388202] text-white shadow-sm";
              if (item.status === 'good_loss') bgClass = "bg-[#1CB0F6] border border-[#1899D6] border-b-2 border-b-[#147BB0] text-white shadow-sm";
              if (item.status === 'breakeven') bgClass = "bg-[#CE82FF] border border-[#B955FF] border-b-2 border-b-[#9D28EC] text-white shadow-sm";
              if (item.status === 'toxic_win') bgClass = "bg-[#FFC800] border border-[#D9AA00] border-b-2 border-b-[#8A6B00] text-slate-950 shadow-sm";
              if (item.status === 'toxic_be') bgClass = "bg-[#00F0FF] border border-[#00D8E6] border-b-2 border-b-[#00B3BF] text-slate-950 shadow-sm";
              if (item.status === 'double_failure') bgClass = "bg-[#FF4B4B] border border-[#E53935] border-b-2 border-b-[#C62828] text-white shadow-sm";
              if (item.status === 'missed_trade') bgClass = "bg-amber-500 border border-amber-600 border-b-2 border-b-amber-700 text-slate-950 shadow-sm";
              if (item.status === 'today') bgClass = "bg-[#FF6B00] border border-[#C2410C] border-b-2 border-b-[#9A3412] text-white shadow-md animate-pulse";
              if (item.status === 'holiday_freeze') bgClass = "bg-[#00F0FF] border border-[#00D8E6] border-b-2 border-b-[#00B3BF] text-slate-950 shadow-sm";
              if (item.status === 'weekend_rest' || item.status === 'rest') bgClass = "bg-[#182830] border border-[#2B3D47] text-slate-400";

              return (
                <button 
                  key={idx}
                  onClick={() => {
                    setSelectedDay(idx);
                    const dayNum = item.date;
                    setActiveAuditDay(dayNum);
                    const el = document.getElementById(`day-node-${dayNum}`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    soundFx.playPop();
                  }}
                  className={`rounded-xl border flex flex-col justify-between items-center p-1 min-h-[36px] transition-all cursor-pointer active:scale-95 ${bgClass} ${
                    isSelected ? 'ring-2 ring-white scale-105 z-10 shadow-lg' : 'hover:brightness-110'
                  }`}
                  title={`Day ${item.date}: Click to jump to Protocol Map node`}
                >
                  <span className="text-[9px] font-black leading-none">{item.date}</span>
                  <span className="text-[8px] font-black leading-none uppercase">
                    {item.status === 'win' ? 'A+' : 
                     item.status === 'good_loss' ? 'A' :
                     item.status === 'breakeven' ? 'A' :
                     item.status === 'toxic_win' ? 'C' :
                     item.status === 'toxic_be' ? 'C-' :
                     item.status === 'double_failure' ? 'F' :
                     item.status === 'missed_trade' ? 'M' :
                     item.status === 'today' ? 'LIVE' :
                     item.status === 'holiday_freeze' ? 'VAC' :
                     item.status === 'weekend_rest' || item.status === 'rest' ? 'REST' : '-'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Link Button to Dedicated Calendar Tab */}
          <button
            onClick={() => {
              soundFx.playPop();
              if (onOpenCalendarTab) {
                onOpenCalendarTab();
              }
            }}
            className="w-full py-2 rounded-xl bg-[#142127] hover:bg-[#20323D] border border-[#20323D] text-[#1CB0F6] text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 mt-1"
          >
            <Calendar size={13} />
            <span>Full Performance Calendar Tab</span>
          </button>
        </div>



      {/* CUSTOM 3D DATA INTEGRITY SAFEGUARD MODAL */}
      {isIntegrityModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="duo-card max-w-md w-full p-6 sm:p-8 space-y-5 border-2 border-[#FF6B00] relative shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border-2 border-amber-500/40">
                <ShieldAlert size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-[#FF6B00] tracking-wider">DATA INTEGRITY SAFEGUARD</span>
                <h3 className="text-lg font-black text-white">Action Blocked</h3>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-300 leading-relaxed bg-[#142127] p-4 rounded-2xl border-2 border-[#20323D]">
              {integrityMessage}
            </p>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsIntegrityModalOpen(false)}
                className="flex-1 py-3.5 rounded-2xl bg-[#20323D] hover:bg-[#2B3D47] text-white text-xs font-black uppercase tracking-wider cursor-pointer border-2 border-[#2B3840]"
              >
                Understand & Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5-RULE INSTITUTIONAL PROTOCOL MODAL */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="duo-card max-w-lg w-full p-6 sm:p-8 space-y-6 border-2 border-[#58CC02] relative shadow-2xl">
            <button
              onClick={() => setIsRulesModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[#142127] hover:bg-[#20323D] text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#58CC02]/20 text-[#58CC02] flex items-center justify-center shrink-0 border-2 border-[#58CC02]/40">
                <ShieldCheck size={28} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-[#58CC02] tracking-wider">BEHAVIORAL EXECUTION INDEX</span>
                <h3 className="text-xl font-black text-white">16 Disciplined Trades Taken</h3>
              </div>
            </div>



            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'win', label: 'DISCIPLINED WIN', activeBg: 'bg-[#58CC02] border-b-4 border-[#388202] text-white' },
                { id: 'good_loss', label: 'DISCIPLINED LOSS', activeBg: 'bg-[#1CB0F6] border-b-4 border-[#147BB0] text-white' },
                { id: 'breakeven', label: 'DISCIPLINED BE', activeBg: 'bg-[#CE82FF] border-b-4 border-[#9D28EC] text-white' },
                { id: 'toxic_win', label: 'TOXIC WIN', activeBg: 'bg-[#FFC800] border-b-4 border-[#8A6B00] text-slate-950' },
                { id: 'toxic_be', label: 'TOXIC BE', activeBg: 'bg-[#00F0FF] border-b-4 border-[#00B3BF] text-slate-950' },
                { id: 'double_failure', label: 'DOUBLE FAILURE', activeBg: 'bg-[#FF4B4B] border-b-4 border-[#C62828] text-white' },
                { id: 'missed_trade', label: 'MISSED TRADE', activeBg: 'bg-amber-500 border-b-4 border-amber-700 text-slate-950', isFullWidth: true },
              ].map((cat) => {
                const count = sessionTrades.filter(t => t.type === cat.id).length;
                const hasTrades = count > 0;
                return (
                  <div
                    key={cat.id}
                    className={`p-3 rounded-2xl transition-all space-y-0.5 shadow-md ${
                      cat.isFullWidth ? 'col-span-2' : ''
                    } ${
                      hasTrades
                        ? cat.activeBg
                        : 'bg-[#142127] border-2 border-[#20323D] text-slate-500 opacity-60'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider block opacity-90">
                      {cat.label}
                    </span>
                    <div className="text-base font-black leading-tight">
                      {cat.id === 'missed_trade' ? `${count} Missed` : `${count} ${count === 1 ? 'Trade' : 'Trades'}`}
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => setIsRulesModalOpen(false)}
              className="duo-btn-green w-full py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
            >
              <span>Close Execution Breakdown</span>
            </button>
          </div>
        </div>
      )}
      {/* MANDATORY POST-SESSION AUDIT & JOURNAL MODAL */}
      {isDebriefModalOpen && (
        <AiDebriefModal
          onClose={() => setIsDebriefModalOpen(false)}
          onFinish={() => {
            setIsDebriefModalOpen(false);
            toggleTask(4);
            setTradingStatusState('DONE');
            saveStoredData('goodtrader_trading_status', 'DONE');
            saveStoredData('goodtrader_vacation_active', false);
            soundFx.playLevelUp();
          }}
        />
      )}
      {/* 3D ADD MANUAL TRADE MODAL */}
      {isAddTradeModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="duo-card max-w-sm w-full p-5 sm:p-6 space-y-4 border-2 border-[#1CB0F6] relative shadow-2xl text-left">
            <button
              onClick={() => setIsAddTradeModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-[#1CB0F6] tracking-wider">MANUAL ENTRY</span>
              <h3 className="text-lg font-black text-white">Add Session Trade</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Asset / Symbol</label>
                <input
                  type="text"
                  value={newTradeSymbol}
                  onChange={(e) => setNewTradeSymbol(e.target.value)}
                  className="w-full bg-[#142127] border-2 border-[#20323D] rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none focus:border-[#1CB0F6]"
                  placeholder="e.g. NQ1!, ES1!, AAPL"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Direction</label>
                  <select
                    value={newTradeSide}
                    onChange={(e) => setNewTradeSide(e.target.value)}
                    className="w-full bg-[#142127] border-2 border-[#20323D] rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none focus:border-[#1CB0F6]"
                  >
                    <option value="LONG">LONG</option>
                    <option value="SHORT">SHORT</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Net PnL ($)</label>
                  <input
                    type="text"
                    value={newTradePnl}
                    onChange={(e) => setNewTradePnl(e.target.value)}
                    className="w-full bg-[#142127] border-2 border-[#20323D] rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none focus:border-[#1CB0F6]"
                    placeholder="+$500.00"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Classification</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'win', label: 'Disciplined Win' },
                    { id: 'good_loss', label: 'Disciplined Loss' },
                    { id: 'toxic_win', label: 'Toxic Win' },
                    { id: 'double_failure', label: 'Double Failure' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setNewTradeType(opt.id)}
                      className={`p-2 rounded-xl text-[10px] font-black cursor-pointer border-2 text-left ${
                        newTradeType === opt.id
                          ? 'bg-[#1CB0F6] text-white border-[#147BB0]'
                          : 'bg-[#142127] border-[#20323D] text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleAddManualTrade}
              className="duo-btn-blue w-full py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Plus size={16} />
              <span>Log Trade to Session Audit</span>
            </button>
          </div>
        </div>
      )}

      {/* MANUAL TRADE ENTRY MODAL OVERLAY */}
      <ManualTradeModal 
        isOpen={isManualModalOpen} 
        onClose={() => setIsManualModalOpen(false)} 
      />
    </aside>
  </>
  );
}
