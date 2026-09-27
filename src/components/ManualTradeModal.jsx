import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, X, ShieldAlert, DollarSign, Tag, TrendingUp, TrendingDown, 
  Clock, Calendar, Image as ImageIcon, Zap, Sliders, Check, AlertTriangle, 
  ShieldCheck, Sparkles, CheckCircle2 
} from 'lucide-react';
import { soundFx } from '../utils/audioEngine';
import { loadStoredData, saveStoredData, STORAGE_KEYS, buildDefaultPlaybooks } from '../utils/storage';
import { parseFinancialNumber, formatFinancialCurrency, formatRMultiple } from '../utils/financialMath';
import { compressImage } from '../utils/imageCompressor';
import { TRADE_BEHAVIOR_TAGS, resolveMarketSession, MARKET_SESSIONS } from '../utils/tradeParser';

export default function ManualTradeModal({ isOpen, onClose, onTradeAdded }) {
  // Logging Mode: 'QUICK' (10-second rapid log) vs 'DETAILED' (Full audit & trade management)
  const [loggingMode, setLoggingMode] = useState(() => loadStoredData('tradepigeon_manual_logging_mode', 'QUICK'));

  // Core Trade State
  const [symbol, setSymbol] = useState('NQ');
  const [direction, setDirection] = useState('LONG');
  const [pnl, setPnl] = useState('250.00');
  const [isProfitable, setIsProfitable] = useState(true);
  const [rMultiple, setRMultiple] = useState('1.5');
  const [pnlInputMode, setPnlInputMode] = useState('$'); // '$' | 'R'
  
  // Playbooks and Strategy
  const userPlaybooks = useMemo(() => {
    if (!isOpen) return [];
    return loadStoredData('tradepigeon_playbook_setups', buildDefaultPlaybooks());
  }, [isOpen]);

  const [setupTag, setSetupTag] = useState(() => {
    const playbooks = loadStoredData('tradepigeon_playbook_setups', buildDefaultPlaybooks());
    return playbooks?.[0]?.name || 'London Liquidity Sweep';
  });

  // Discipline & Behavioral State
  const [disciplineFollowed, setDisciplineFollowed] = useState(true);
  const [managementTags, setManagementTags] = useState([]);
  const [grade, setGrade] = useState('A+');
  const [executionType, setExecutionType] = useState('Disciplined Win');

  // Metadata
  const [notes, setNotes] = useState('');
  const [chartUrl, setChartUrl] = useState('');
  const [contracts, setContracts] = useState('2');
  const [tradeDate, setTradeDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  // Check if toxic management tags are selected
  const hasToxicManagement = useMemo(() => {
    return managementTags.some(t => t === 'widened_stop' || t === 'averaged_down' || t === 'chased_entry');
  }, [managementTags]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleImagePaste = (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;
    const items = clipboardData.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          compressImage(blob).then((compressedUrl) => {
            if (compressedUrl) {
              setChartUrl(compressedUrl);
              soundFx.playSuccess();
            }
          });
          if (e.preventDefault) e.preventDefault();
          return;
        }
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const onPaste = (e) => handleImagePaste(e);
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const executionOptions = [
    { grade: 'A+', type: 'Disciplined Win', desc: 'Followed plan 100% & hit target', color: 'border-[#58CC02] bg-[#58CC02]/10 text-[#58CC02]' },
    { grade: 'A', type: 'Disciplined Loss', desc: 'Followed plan 100% & hit stop-loss', color: 'border-[#1CB0F6] bg-[#1CB0F6]/10 text-[#1CB0F6]' },
    { grade: 'A', type: 'Disciplined Breakeven', desc: 'Protected equity when momentum stalled', color: 'border-[#CE82FF] bg-[#CE82FF]/10 text-[#CE82FF]' },
    { grade: 'C', type: 'Toxic Win', desc: 'Violated rules but got lucky on PnL', color: 'border-amber-400 bg-amber-400/10 text-amber-400' },
    { grade: 'C-', type: 'Toxic Breakeven', desc: 'Violated rules & scratched at breakeven', color: 'border-[#00F0FF] bg-[#00F0FF]/10 text-[#00F0FF]' },
    { grade: 'F', type: 'Double Failure', desc: 'Broke rules & took an emotional loss', color: 'border-rose-500 bg-rose-500/10 text-rose-400' },
  ];

  const toggleManagementTag = (tagId) => {
    soundFx.playPop();
    setManagementTags(prev => {
      const next = prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId];
      // If toxic tag is added, automatically uncheck discipline
      const hasToxic = next.some(t => t === 'widened_stop' || t === 'averaged_down' || t === 'chased_entry');
      if (hasToxic) {
        setDisciplineFollowed(false);
      }
      return next;
    });
  };

  const handlePnlChange = (e) => {
    const val = e.target.value;
    setPnl(val);
    const trimmed = String(val || '').trim();
    if (trimmed.startsWith('-')) {
      setIsProfitable(false);
    } else if (trimmed.startsWith('+')) {
      setIsProfitable(true);
    } else if (trimmed !== '') {
      const num = parseFloat(trimmed);
      if (!isNaN(num)) {
        if (num < 0) setIsProfitable(false);
        else if (num > 0) setIsProfitable(true);
      }
    }
  };

  const handleSelectOutcome = (type) => {
    soundFx.playPop();
    if (type === 'WIN') {
      setIsProfitable(true);
      if (pnl === '' || parseFinancialNumber(pnl, 0) <= 0) {
        setPnl('250.00');
        setRMultiple('1.5');
      }
    } else if (type === 'LOSS') {
      setIsProfitable(false);
      if (pnl === '' || parseFinancialNumber(pnl, 0) >= 0) {
        setPnl('-200.00');
        setRMultiple('1.0');
      }
    } else if (type === 'BREAKEVEN') {
      setIsProfitable(true);
      setPnl('0.00');
      setRMultiple('0.0');
    }
  };

  const handleApplyPreset = (value, unit = '$') => {
    soundFx.playPop();
    if (unit === '$') {
      setPnl(String(Math.abs(value)));
      if (value > 0) {
        setIsProfitable(true);
        setRMultiple((value / 350).toFixed(1));
      } else if (value < 0) {
        setIsProfitable(false);
        setRMultiple((Math.abs(value) / 350).toFixed(1));
      } else {
        setIsProfitable(true);
        setRMultiple('0.0');
      }
    } else {
      // R Multiple Preset
      const rNum = parseFloat(value);
      setRMultiple(String(Math.abs(rNum)));
      const derivedDollar = Math.abs(rNum) * 350;
      setPnl(derivedDollar.toFixed(2));
      if (rNum > 0) setIsProfitable(true);
      else if (rNum < 0) setIsProfitable(false);
      else setIsProfitable(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    soundFx.playSuccess();

    const rawTrimmed = String(pnl || '').trim();
    const numericPnl = parseFinancialNumber(pnl, 0);
    const isLoss = !isProfitable || rawTrimmed.startsWith('-') || numericPnl < 0;
    const finalPnlValue = isLoss ? -Math.abs(numericPnl) : Math.abs(numericPnl);

    const isQuickMode = loggingMode === 'QUICK';
    const isFollowed = isQuickMode 
      ? disciplineFollowed 
      : (!hasToxicManagement && disciplineFollowed && !['Toxic Win', 'Toxic Breakeven', 'Double Failure'].includes(executionType));

    // Dynamic Archetype Classification
    let resolvedExecutionType = executionType;
    let resolvedGrade = grade;

    if (isQuickMode || hasToxicManagement) {
      if (isFollowed) {
        if (finalPnlValue > 10) {
          resolvedExecutionType = 'Disciplined Win';
          resolvedGrade = 'A+';
        } else if (finalPnlValue < -10) {
          resolvedExecutionType = 'Disciplined Loss';
          resolvedGrade = 'A';
        } else {
          resolvedExecutionType = 'Disciplined Breakeven';
          resolvedGrade = 'A';
        }
      } else {
        if (finalPnlValue > 10) {
          resolvedExecutionType = 'Toxic Win';
          resolvedGrade = 'C';
        } else if (finalPnlValue < -10) {
          resolvedExecutionType = 'Double Failure';
          resolvedGrade = 'F';
        } else {
          resolvedExecutionType = 'Toxic Breakeven';
          resolvedGrade = 'C-';
        }
      }
    }

    const typeMap = {
      'Disciplined Win': 'win',
      'Disciplined Loss': 'good_loss',
      'Disciplined Breakeven': 'breakeven',
      'Toxic Win': 'toxic_win',
      'Toxic Breakeven': 'toxic_be',
      'Double Failure': 'double_failure'
    };

    const todayIso = new Date().toISOString().split('T')[0];
    const currentDay = loadStoredData('tradepigeon_current_day', 1);

    let finalR = formatRMultiple(finalPnlValue, 350, 1);
    if (rMultiple && String(rMultiple).trim() !== '') {
      const parsedR = parseFloat(rMultiple);
      if (!isNaN(parsedR)) {
        const absVal = Math.abs(parsedR).toFixed(1);
        if (absVal === '0.0') {
          finalR = '0.0 R';
        } else {
          const sign = !isLoss ? '+' : '-';
          finalR = `${sign}${absVal} R`;
        }
      }
    }

    const newTrade = {
      id: `manual_${Date.now()}`,
      symbol: (String(symbol || '').trim() || 'NQ').toUpperCase(),
      direction,
      side: direction === 'SHORT' ? 'SELL' : 'BUY',
      pnl: formatFinancialCurrency(finalPnlValue, { showPlus: true }),
      pnlValue: finalPnlValue,
      pnlNum: finalPnlValue,
      rMultiple: finalR,
      r: finalR,
      setup: setupTag,
      grade: resolvedGrade,
      executionType: resolvedExecutionType,
      type: typeMap[resolvedExecutionType] || (finalPnlValue >= 0 ? 'win' : 'good_loss'),
      followedRules: isFollowed,
      managementTags: managementTags,
      chartUrl: chartUrl.trim(),
      contracts: parseInt(contracts, 10) || 1,
      time: time || '12:00',
      date: tradeDate || todayIso,
      account: 'Manual Entry',
      notes: notes.trim(),
      isManual: true,
      confirmed: true
    };

    // 1. Save to stored trade logs
    const existingTrades = loadStoredData(STORAGE_KEYS.TRADE_HISTORY, []);
    const updatedTrades = [newTrade, ...existingTrades];
    saveStoredData(STORAGE_KEYS.TRADE_HISTORY, updatedTrades);

    // 2. Also append to session trades for immediate reactive visibility in Calendar & Hub
    const effectiveDate = tradeDate || todayIso;
    if (effectiveDate === todayIso) {
      const sessionKey = `tradepigeon_session_trades_day_${currentDay}`;
      const existingSessionTrades = loadStoredData(sessionKey, []);
      saveStoredData(sessionKey, [newTrade, ...existingSessionTrades]);

      const sessionIsoKey = `tradepigeon_session_trades_day_${todayIso}`;
      const existingIsoTrades = loadStoredData(sessionIsoKey, []);
      saveStoredData(sessionIsoKey, [newTrade, ...existingIsoTrades]);

      const activeSessionTrades = loadStoredData('tradepigeon_session_trades', []);
      saveStoredData('tradepigeon_session_trades', [newTrade, ...activeSessionTrades]);
    } else {
      const targetIsoKey = `tradepigeon_session_trades_day_${effectiveDate}`;
      const existingIsoTrades = loadStoredData(targetIsoKey, []);
      saveStoredData(targetIsoKey, [newTrade, ...existingIsoTrades]);

      const generalDayKey = `day_${effectiveDate}`;
      const existingGeneralDay = loadStoredData(generalDayKey, { trades: [] });
      saveStoredData(generalDayKey, {
        ...existingGeneralDay,
        trades: [newTrade, ...(existingGeneralDay?.trades || [])]
      });
    }

    // 3. Increment tradesLogged counter
    const currentStats = loadStoredData('tradepigeon_user_stats', {});
    saveStoredData('tradepigeon_user_stats', {
      ...currentStats,
      tradesLogged: (currentStats.tradesLogged || 0) + 1
    });

    saveStoredData('tradepigeon_active_trade_alert', newTrade);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tradepigeon_new_trade_alert', { detail: newTrade }));
    }

    if (onTradeAdded) {
      onTradeAdded(newTrade);
    }

    onClose();
  };

  const isScratch = Math.abs(parseFinancialNumber(pnl, 0)) < 10;
  const activeOutcome = isScratch ? 'BREAKEVEN' : isProfitable ? 'WIN' : 'LOSS';

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="duo-card max-w-lg w-full bg-[#0D1635] border-2 border-[#1C2A4E] border-b-8 border-b-[#14203E] rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative my-6 text-left"
      >
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-[#14203E] hover:bg-[#1C2A4E] border border-[#233560] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          <X size={16} />
        </button>

        {/* Modal Header & Mode Switcher */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-[#FF6B00]/15 border border-[#FF6B00]/30 text-[#FF6B00] text-[10px] font-black uppercase tracking-wider">
              TRADE LOGGER
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {loggingMode === 'QUICK' ? 'Log Trade in 10s' : 'Detailed Trade Audit'}
            </h2>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-1 rounded-2xl bg-[#14203E] border border-[#20325C] shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  soundFx.playPop();
                  setLoggingMode('QUICK');
                  saveStoredData('tradepigeon_manual_logging_mode', 'QUICK');
                }}
                className={`py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  loggingMode === 'QUICK'
                    ? 'bg-[#FF6B00] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap size={13} />
                <span>⚡ Quick Log</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.playPop();
                  setLoggingMode('DETAILED');
                  saveStoredData('tradepigeon_manual_logging_mode', 'DETAILED');
                }}
                className={`py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  loggingMode === 'DETAILED'
                    ? 'bg-[#1CB0F6] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders size={13} />
                <span>📋 Detailed</span>
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ==================================================== */}
          {/* ⚡ QUICK LOG MODE (10-SECOND RAPID ENTRY)            */}
          {/* ==================================================== */}
          {loggingMode === 'QUICK' && (
            <div className="space-y-4 animate-fade-in">
              
              {/* STEP 1: BIG 3D OUTCOME SELECTOR */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                  1. Execution Outcome
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectOutcome('WIN')}
                    className={`py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer border-2 border-b-4 flex flex-col items-center gap-1 ${
                      activeOutcome === 'WIN'
                        ? 'bg-[#58CC02] border-[#46A302] border-b-emerald-800 text-white shadow-lg translate-y-0.5'
                        : 'bg-[#14203E] border-[#20325C] text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-sm font-black">+ WIN</span>
                    <span className="text-[9px] font-bold opacity-80">Green Trade</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectOutcome('LOSS')}
                    className={`py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer border-2 border-b-4 flex flex-col items-center gap-1 ${
                      activeOutcome === 'LOSS'
                        ? 'bg-[#FF4B4B] border-rose-600 border-b-rose-800 text-white shadow-lg translate-y-0.5'
                        : 'bg-[#14203E] border-[#20325C] text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-sm font-black">- LOSS</span>
                    <span className="text-[9px] font-bold opacity-80">Red Trade</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectOutcome('BREAKEVEN')}
                    className={`py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer border-2 border-b-4 flex flex-col items-center gap-1 ${
                      activeOutcome === 'BREAKEVEN'
                        ? 'bg-[#CE82FF] border-purple-600 border-b-purple-800 text-white shadow-lg translate-y-0.5'
                        : 'bg-[#14203E] border-[#20325C] text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-sm font-black">= BE</span>
                    <span className="text-[9px] font-bold opacity-80">Scratch</span>
                  </button>
                </div>
              </div>

              {/* STEP 2: AMOUNT INPUT & PRESET CHIPS */}
              {activeOutcome !== 'BREAKEVEN' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      2. Realized PnL ({pnlInputMode})
                    </label>
                    <div className="flex items-center gap-1 bg-[#14203E] p-0.5 rounded-xl border border-[#20325C]">
                      <button
                        type="button"
                        onClick={() => setPnlInputMode('$')}
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-black cursor-pointer ${pnlInputMode === '$' ? 'bg-[#FF6B00] text-white' : 'text-slate-400'}`}
                      >
                        $ Dollars
                      </button>
                      <button
                        type="button"
                        onClick={() => setPnlInputMode('R')}
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-black cursor-pointer ${pnlInputMode === 'R' ? 'bg-[#FF6B00] text-white' : 'text-slate-400'}`}
                      >
                        R Multiple
                      </button>
                    </div>
                  </div>

                  {/* Input Box */}
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 text-xs font-black">
                      {pnlInputMode === '$' ? (isProfitable ? '+$' : '-$') : (isProfitable ? '+' : '-')}
                    </span>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={pnlInputMode === '$' ? pnl.replace(/^[+-]/, '') : rMultiple.replace(/^[+-]/, '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (pnlInputMode === '$') {
                          handlePnlChange(e);
                        } else {
                          setRMultiple(val);
                          const parsed = parseFloat(val);
                          if (!isNaN(parsed)) {
                            setPnl((parsed * 350).toFixed(2));
                          }
                        }
                      }}
                      placeholder={pnlInputMode === '$' ? '250.00' : '1.5'}
                      required
                      className="w-full p-3 pl-9 rounded-2xl bg-[#14203E] border-2 border-[#20325C] text-sm font-black text-white focus:border-[#FF6B00] outline-none font-mono"
                    />
                    <span className="absolute right-3.5 text-slate-500 text-xs font-bold font-mono">
                      {pnlInputMode === '$' 
                        ? `${isProfitable ? '+' : '-'}${rMultiple || '1.0'} R` 
                        : `${isProfitable ? '+' : '-'}$${Math.abs(parseFinancialNumber(pnl, 0)).toFixed(0)}`}
                    </span>
                  </div>

                  {/* Preset Fast Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {pnlInputMode === '$' ? (
                      activeOutcome === 'WIN' 
                        ? [100, 250, 500, 1000].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleApplyPreset(val, '$')}
                              className="px-2.5 py-1 rounded-xl bg-[#14203E] hover:bg-[#1C2A4E] border border-[#20325C] text-slate-300 hover:text-white font-mono font-black text-[10px] cursor-pointer transition-all"
                            >
                              +${val}
                            </button>
                          ))
                        : [-100, -250, -500, -1000].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleApplyPreset(val, '$')}
                              className="px-2.5 py-1 rounded-xl bg-[#14203E] hover:bg-[#1C2A4E] border border-[#20325C] text-rose-300 hover:text-white font-mono font-black text-[10px] cursor-pointer transition-all"
                            >
                              -${Math.abs(val)}
                            </button>
                          ))
                    ) : (
                      activeOutcome === 'WIN'
                        ? [1.0, 1.5, 2.0, 3.0].map(r => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => handleApplyPreset(r, 'R')}
                              className="px-2.5 py-1 rounded-xl bg-[#14203E] hover:bg-[#1C2A4E] border border-[#20325C] text-[#58CC02] hover:text-white font-mono font-black text-[10px] cursor-pointer transition-all"
                            >
                              +{r.toFixed(1)} R
                            </button>
                          ))
                        : [-0.5, -1.0, -1.5, -2.0].map(r => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => handleApplyPreset(r, 'R')}
                              className="px-2.5 py-1 rounded-xl bg-[#14203E] hover:bg-[#1C2A4E] border border-[#20325C] text-rose-300 hover:text-white font-mono font-black text-[10px] cursor-pointer transition-all"
                            >
                              {r.toFixed(1)} R
                            </button>
                          ))
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: 1-TAP DISCIPLINE & PLAN ADHERENCE CHECK */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                  3. Execution Discipline
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playPop();
                      setDisciplineFollowed(true);
                    }}
                    className={`p-2.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                      disciplineFollowed
                        ? 'border-[#58CC02] bg-[#58CC02]/15 text-[#58CC02] shadow-sm'
                        : 'border-[#20325C] bg-[#14203E] text-slate-400 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black flex items-center gap-1.5">
                        <CheckCircle2 size={13} />
                        <span>Followed Rules</span>
                      </div>
                      <div className="text-[9px] font-bold opacity-75">100% Plan Adherence</div>
                    </div>
                    {disciplineFollowed && <span className="w-2 h-2 rounded-full bg-[#58CC02] animate-pulse" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playPop();
                      setDisciplineFollowed(false);
                    }}
                    className={`p-2.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                      !disciplineFollowed
                        ? 'border-amber-400 bg-amber-400/15 text-amber-400 shadow-sm'
                        : 'border-[#20325C] bg-[#14203E] text-slate-400 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black flex items-center gap-1.5">
                        <AlertTriangle size={13} />
                        <span>Broke Rules</span>
                      </div>
                      <div className="text-[9px] font-bold opacity-75">FOMO / Tilt / Moved Stop</div>
                    </div>
                    {!disciplineFollowed && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                  </button>
                </div>
              </div>

              {/* STEP 4: 1-TAP PLAYBOOK SETUP PILLS */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                  4. Strategy Setup Tag
                </label>
                <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {userPlaybooks.map(pb => (
                    <button
                      key={pb.id || pb.name}
                      type="button"
                      onClick={() => {
                        soundFx.playPop();
                        setSetupTag(pb.name);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider transition-all cursor-pointer ${
                        setupTag === pb.name
                          ? 'bg-[#FF6B00] text-white shadow-sm ring-2 ring-white/20'
                          : 'bg-[#14203E] border border-[#20325C] text-slate-300 hover:text-white hover:border-slate-500'
                      }`}
                    >
                      {pb.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* STEP 5: QUICK INSTRUMENT & DIRECTION */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Ticker</label>
                  <div className="flex items-center gap-1 bg-[#14203E] p-1 rounded-2xl border-2 border-[#20325C]">
                    {['NQ', 'MNQ', 'ES', 'MES'].map(sym => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => {
                          soundFx.playPop();
                          setSymbol(sym);
                        }}
                        className={`flex-1 py-1 rounded-xl text-[10px] font-black cursor-pointer transition-all ${
                          symbol === sym ? 'bg-[#FF6B00] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Direction</label>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#14203E] border-2 border-[#20325C]">
                    <button
                      type="button"
                      onClick={() => setDirection('LONG')}
                      className={`py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        direction === 'LONG' ? 'bg-[#58CC02] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <TrendingUp size={12} />
                      <span>LONG</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection('SHORT')}
                      className={`py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        direction === 'SHORT' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <TrendingDown size={12} />
                      <span>SHORT</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Session Indicator */}
              {(() => {
                const session = resolveMarketSession(time);
                return (
                  <div className={`p-2 rounded-xl flex items-center justify-between text-xs border ${
                    session.isTrap 
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-300' 
                      : 'bg-[#14203E] border-[#20325C] text-slate-300'
                  }`}>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                      <Clock size={12} className={session.isTrap ? 'text-amber-400' : 'text-[#1CB0F6]'} />
                      <span className="text-slate-400">Current Session:</span>
                      <span className="text-white font-black">{session.name}</span>
                      <span className="font-mono text-[#52656D]">({session.hours})</span>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider ${session.badgeBg}`}>
                      {session.shortName}
                    </span>
                  </div>
                );
              })()}

            </div>
          )}

          {/* ==================================================== */}
          {/* 📋 DETAILED & TRADE MANAGEMENT MODE                  */}
          {/* ==================================================== */}
          {loggingMode === 'DETAILED' && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1.5">
                    <Calendar size={11} className="text-[#1CB0F6]" />
                    <span>Trade Date</span>
                  </label>
                  <input 
                    type="date"
                    value={tradeDate}
                    onChange={(e) => setTradeDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full p-2.5 rounded-2xl bg-[#14203E] border-2 border-[#20325C] text-xs font-black text-white focus:border-[#1CB0F6] outline-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Clock size={11} className="text-[#1CB0F6]" />
                      <span>Execution Time</span>
                    </label>
                    {(() => {
                      const session = resolveMarketSession(time);
                      return (
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider ${session.badgeBg} ${session.isTrap ? 'animate-pulse' : ''}`}>
                          {session.shortName}
                        </span>
                      );
                    })()}
                  </div>
                  <input 
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-2xl bg-[#14203E] border-2 border-[#20325C] text-xs font-black text-white focus:border-[#1CB0F6] outline-none cursor-pointer"
                  />
                  {resolveMarketSession(time).isTrap && (
                    <div className="mt-1 text-[9px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                      ⚠️ NY Lunch Chop session (11:30 - 13:30 EST) is prone to stop-runs and false breakouts.
                    </div>
                  )}
                </div>
              </div>

              {/* Ticker Symbol & Direction */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Ticker Symbol</label>
                  <input 
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="e.g. NQ, ES, GC"
                    required
                    className="w-full p-2.5 rounded-2xl bg-[#14203E] border-2 border-[#20325C] text-xs font-black text-white focus:border-[#1CB0F6] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Direction</label>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#14203E] border-2 border-[#20325C]">
                    <button
                      type="button"
                      onClick={() => setDirection('LONG')}
                      className={`py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                        direction === 'LONG' ? 'bg-[#58CC02] text-white shadow-md' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <TrendingUp size={13} />
                      <span>LONG</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection('SHORT')}
                      className={`py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                        direction === 'SHORT' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <TrendingDown size={13} />
                      <span>SHORT</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* PnL & Outcome */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Net Profit / Loss ($)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 text-xs font-black">$</span>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={pnl}
                      onChange={handlePnlChange}
                      placeholder="450.00"
                      required
                      className="w-full p-2.5 pl-8 rounded-2xl bg-[#14203E] border-2 border-[#20325C] text-xs font-black text-white focus:border-[#1CB0F6] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Outcome</label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isProfitable;
                      setIsProfitable(next);
                      const trimmed = String(pnl || '').trim();
                      if (trimmed.startsWith('-') && next) setPnl(trimmed.replace(/^-+/, ''));
                      else if (!trimmed.startsWith('-') && !next && trimmed !== '') setPnl(`-${trimmed.replace(/^\++/, '')}`);
                    }}
                    className={`w-full p-2.5 rounded-2xl border-2 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      isProfitable 
                        ? 'bg-[#58CC02]/15 border-[#58CC02] text-[#58CC02]' 
                        : 'bg-rose-500/15 border-rose-500 text-rose-400'
                    }`}
                  >
                    {isProfitable ? 'WIN (+)' : 'LOSS (-)'}
                  </button>
                </div>
              </div>

              {/* R-Multiple & Contracts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Risk Multiple (R)</label>
                  <input 
                    type="number"
                    step="0.1"
                    value={rMultiple}
                    onChange={(e) => setRMultiple(e.target.value)}
                    placeholder="1.5"
                    className="w-full p-2.5 rounded-2xl bg-[#14203E] border-2 border-[#20325C] text-xs font-black text-white focus:border-[#1CB0F6] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Contracts / Lots</label>
                  <input 
                    type="number"
                    value={contracts}
                    onChange={(e) => setContracts(e.target.value)}
                    placeholder="2"
                    className="w-full p-2.5 rounded-2xl bg-[#14203E] border-2 border-[#20325C] text-xs font-black text-white focus:border-[#1CB0F6] outline-none"
                  />
                </div>
              </div>

              {/* Strategy Setup Tag */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Playbook Setup Tag</label>
                <input 
                  type="text"
                  value={setupTag}
                  onChange={(e) => setSetupTag(e.target.value)}
                  placeholder="e.g. London Liquidity Sweep"
                  className="w-full p-2.5 rounded-2xl bg-[#14203E] border-2 border-[#20325C] text-xs font-black text-white focus:border-[#1CB0F6] outline-none"
                />
              </div>

              {/* ==================================================== */}
              {/* NEW: TRADE MANAGEMENT & BEHAVIOR CHIPS (INSTITUTIONAL) */}
              {/* ==================================================== */}
              <div className="space-y-2 pt-1 border-t border-[#20325C]">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-[#1CB0F6] tracking-wider flex items-center gap-1.5">
                    <Sparkles size={12} />
                    <span>Trade Management & Execution Behaviors</span>
                  </label>
                  <span className="text-[9px] font-bold text-slate-500">Tap to select all that apply</span>
                </div>

                {/* Positive Habits */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Constructive Management:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {TRADE_BEHAVIOR_TAGS.filter(t => t.category === 'positive').map(tag => {
                      const isSelected = managementTags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleManagementTag(tag.id)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 border ${
                            isSelected
                              ? 'bg-[#58CC02]/20 border-[#58CC02] text-[#58CC02] shadow-sm'
                              : 'bg-[#14203E] border-[#20325C] text-slate-400 hover:text-white'
                          }`}
                          title={tag.desc}
                        >
                          {isSelected && <Check size={10} strokeWidth={3} />}
                          <span>{tag.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Toxic Tilt Patterns */}
                <div className="space-y-1 pt-1">
                  <span className="text-[9px] font-bold uppercase text-rose-400 block">Tilt / Risk Violations:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {TRADE_BEHAVIOR_TAGS.filter(t => t.category === 'toxic' || t.category === 'warning').map(tag => {
                      const isSelected = managementTags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleManagementTag(tag.id)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 border ${
                            isSelected
                              ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-sm'
                              : 'bg-[#14203E] border-[#20325C] text-slate-400 hover:text-white'
                          }`}
                          title={tag.desc}
                        >
                          {isSelected && <AlertTriangle size={10} strokeWidth={3} />}
                          <span>{tag.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Toxic Management Warning Banner */}
                {hasToxicManagement && (
                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-2 animate-fade-in mt-2">
                    <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                    <span>
                      Toxic management selected. Trade will strictly be classified as a Rule Violation ({isProfitable ? 'Toxic Win' : 'Double Failure'}).
                    </span>
                  </div>
                )}
              </div>

              {/* Execution Discipline Grade Picker */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">Behavioral Execution Grade</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {executionOptions.map((opt) => (
                    <button
                      type="button"
                      key={opt.type}
                      onClick={() => {
                        setGrade(opt.grade);
                        setExecutionType(opt.type);
                        setDisciplineFollowed(!['Toxic Win', 'Toxic Breakeven', 'Double Failure'].includes(opt.type));
                      }}
                      className={`p-2 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                        executionType === opt.type 
                          ? `${opt.color} shadow-lg ring-2 ring-white/20` 
                          : 'bg-[#14203E]/60 border-[#20325C] text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-black">{opt.type}</div>
                        <div className="text-[9px] font-bold opacity-75">{opt.desc}</div>
                      </div>
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-black/30 border border-current/20">
                        {opt.grade}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Screenshot Attachment */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">
                  Chart Screenshot (Optional)
                </label>
                <div
                  onClick={() => document.getElementById('manual-trade-chart-input')?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer?.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      compressImage(file).then((compressedUrl) => {
                        if (compressedUrl) {
                          setChartUrl(compressedUrl);
                          soundFx.playSuccess();
                        }
                      });
                    }
                  }}
                  className="p-3 rounded-2xl border-2 border-dashed border-[#20325C] hover:border-[#1CB0F6] bg-[#14203E] text-center cursor-pointer transition-all space-y-2 group"
                >
                  <input
                    id="manual-trade-chart-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        compressImage(file).then((compressedUrl) => {
                          if (compressedUrl) {
                            setChartUrl(compressedUrl);
                            soundFx.playSuccess();
                          }
                        });
                      }
                    }}
                    className="hidden"
                  />
                  {chartUrl ? (
                    <div className="relative group/preview" onClick={(e) => e.stopPropagation()}>
                      <img
                        src={chartUrl}
                        alt="Chart Screenshot"
                        className="max-h-36 w-full object-contain rounded-xl border border-[#20325C] bg-black/40"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setChartUrl('');
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">Screenshot attached. Click to replace or paste a new one.</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-slate-400 group-hover:text-white py-1">
                      <ImageIcon size={16} className="text-[#1CB0F6]" />
                      <span className="text-xs font-black">
                        Paste Screenshot (<span className="text-[#1CB0F6]">Cmd+V</span>) or Click to Upload
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Input */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Trade Notes (Optional)</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key observations, emotion audit, or chart notes..."
                  rows={2}
                  className="w-full p-2.5 rounded-2xl bg-[#14203E] border-2 border-[#20325C] text-xs font-bold text-white focus:border-[#1CB0F6] outline-none resize-none"
                />
              </div>

            </div>
          )}

          {/* Submit CTA */}
          <button
            type="submit"
            className="duo-btn-green w-full py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl cursor-pointer"
          >
            {loggingMode === 'QUICK' ? <Zap size={16} /> : <PlusCircle size={16} />}
            <span>{loggingMode === 'QUICK' ? 'LOG TRADE IN 1 TAP' : 'SAVE DETAILED AUDIT'}</span>
          </button>
        </form>

      </div>
    </div>
  );
}
