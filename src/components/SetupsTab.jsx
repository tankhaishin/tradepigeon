import React, { useState, useEffect } from 'react';
import { 
  Plus, Tag, CheckCircle2, ShieldAlert, Sparkles, ChevronRight, TrendingUp, 
  DollarSign, Brain, BarChart3, AlertCircle, RefreshCw, Layers, Check, 
  Clock, Shield, Award, Cpu, Zap, Lock, ArrowUpRight, CheckSquare, XCircle, AlertTriangle, FileText, PieChart, Upload, Filter, Calendar, X, BookOpen, Pencil
} from 'lucide-react';
import { DuoShieldIcon, DuoLightningIcon, DuoChestIcon, DuoUndoIcon, DuoPlusIcon, DuoFileSheetIcon, DuoGemIcon, DuoCalendarIcon, DuoCheckCircleIcon, DuoHazardIcon, DuoBookIcon, DuoChartIcon, DuoTrophyIcon, DuoBrainIcon, DuoDisciplinedWinIcon, DuoDisciplinedLossIcon, DuoDisciplinedBeIcon, DuoToxicWinIcon, DuoToxicBeIcon, DuoDoubleFailureIcon } from './DuoIcons';
import BrokerConnectModal from './BrokerConnectModal';
import ManualTradeModal from './ManualTradeModal';
import { parseTradeFile, calculateExecutionMatrix, calculateSetupExpectancy, formatCurrencyOrR } from '../utils/tradeParser';
import { loadStoredData, saveStoredData, subscribeToStorageUpdate, STORAGE_KEYS } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';
import InteractiveEquityCurve from './InteractiveEquityCurve';

export default function SetupsTab() {
  const [selectedSetup, setSelectedSetup] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [isManualTradeModalOpen, setIsManualTradeModalOpen] = useState(false);
  const [isStealthMode, setIsStealthMode] = useState(() => loadStoredData('goodtrader_stealth_mode', false));

  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdate(() => {
      setIsStealthMode(loadStoredData('goodtrader_stealth_mode', false));
    });
    return () => unsubscribe();
  }, []);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileContent, setUploadedFileContent] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [parseError, setParseError] = useState('');
  const [activeDateFilter, setActiveDateFilter] = useState('30D');
  const [manualChartUrl, setManualChartUrl] = useState('');
  const [activeChartLightbox, setActiveChartLightbox] = useState(null);
  const [showTradeLogsTable, setShowTradeLogsTable] = useState(false);
  const [expandedPlaybooksState, setExpandedPlaybooksState] = useState({});

  // Auto-Sync Accounts State
  const [syncedAccounts, setSyncedAccounts] = useState([
    { id: 'broker_1', name: 'Primary Funded Account', broker: 'MetaTrader 5 Auto-Sync', status: 'SYNCED (LIVE)', count: 48, pnl: '+$14,250.00' },
    { id: 'broker_2', name: 'Secondary Trading Account', broker: 'TradeLocker Auto-Sync', status: 'SYNCED (LIVE)', count: 32, pnl: '+$9,800.00' },
  ]);

  // LIVE TRADE EXECUTIONS LOG TABLE DATA
  const defaultLogs = [
    { id: 'TRD-1092', time: '09:34:12 NY', symbol: 'NQ1!', side: 'BUY', size: '2.0', entry: '18,420.50', exit: '18,485.00', pnlNum: 1290, pnl: '+$1,290.00', type: 'FOLLOW_WIN', setup: 'Breakout & Retest', r: '+2.6 R', chartUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop' },
    { id: 'TRD-1091', time: '09:48:05 NY', symbol: 'ES1!', side: 'BUY', size: '4.0', entry: '5,512.25', exit: '5,508.00', pnlNum: -425, pnl: '-$425.00', type: 'FOLLOW_LOSS', setup: 'Trend Continuation', r: '-1.0 R', chartUrl: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=1200&auto=format&fit=crop' },
    { id: 'TRD-1090', time: '10:15:40 NY', symbol: 'NQ1!', side: 'SELL', size: '1.5', entry: '18,470.00', exit: '18,410.00', pnlNum: 1800, pnl: '+$1,800.00', type: 'FOLLOW_WIN', setup: 'Key S/R Sweep', r: '+3.0 R', chartUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop' },
    { id: 'TRD-1089', time: '10:55:18 NY', symbol: 'MNQ', side: 'BUY', size: '10.0', entry: '18,440.00', exit: '18,475.00', pnlNum: 700, pnl: '+$700.00', type: 'VIOLATE_WIN', setup: 'FOMO Chase (Chased high)', r: '+1.4 R', chartUrl: null },
    { id: 'TRD-1088', time: '14:22:04 NY', symbol: 'NQ1!', side: 'SELL', size: '3.0', entry: '18,410.00', exit: '18,455.00', pnlNum: -1350, pnl: '-$1,350.00', type: 'VIOLATE_LOSS', setup: 'Revenge Tilt Bet', r: '-2.2 R', chartUrl: null },
  ];

  const [tradeLogs, setTradeLogs] = useState(() => {
    return loadStoredData('goodtrader_tradelogs', defaultLogs);
  });

  const [deletedTradeBackup, setDeletedTradeBackup] = useState(null);

  const handleDeleteTrade = (logToDelete) => {
    setDeletedTradeBackup(logToDelete);
    const updated = tradeLogs.filter(t => t.id !== logToDelete.id);
    setTradeLogs(updated);
    soundFx.playPop();
  };

  const handleUndoDelete = () => {
    if (!deletedTradeBackup) return;
    setTradeLogs([deletedTradeBackup, ...tradeLogs]);
    setDeletedTradeBackup(null);
    soundFx.playSuccess();
  };

  const [selectedAccountFilter, setSelectedAccountFilter] = useState('ALL');

  const filteredTradeLogs = tradeLogs.filter(log => {
    if (selectedAccountFilter === 'FUNDED') {
      return log.type?.startsWith('FOLLOW') && !log.setup?.toLowerCase().includes('revenge') && !log.setup?.toLowerCase().includes('fomo');
    }
    if (selectedAccountFilter === 'EVAL') {
      return log.setup?.toLowerCase().includes('fomo') || log.setup?.toLowerCase().includes('revenge') || log.type?.startsWith('VIOLATE');
    }
    return true;
  });

  useEffect(() => {
    saveStoredData('goodtrader_tradelogs', tradeLogs);
  }, [tradeLogs]);

  // Dynamic Real-Time Matrix Calculation based on active tradeLogs
  const executionMatrix = calculateExecutionMatrix(filteredTradeLogs, 500);

  const [draggedSetupId, setDraggedSetupId] = useState(null);
  const [draggedRuleIdx, setDraggedRuleIdx] = useState(null);

  const handleDropSetup = (targetSetupId) => {
    if (!draggedSetupId || draggedSetupId === targetSetupId) return;

    const draggedIdx = playbookSetups.findIndex(s => s.id === draggedSetupId);
    const targetIdx = playbookSetups.findIndex(s => s.id === targetSetupId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const updated = [...playbookSetups];
    const [removed] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, removed);

    setPlaybookSetups(updated);
    saveStoredData('goodtrader_playbook_setups', updated);
    setDraggedSetupId(null);
    soundFx.playPop();
  };

  const handleDropRule = (targetIdx) => {
    if (draggedRuleIdx === null || draggedRuleIdx === targetIdx || !selectedSetup) return;

    const updatedChecklist = [...selectedSetup.checklist];
    const [removed] = updatedChecklist.splice(draggedRuleIdx, 1);
    updatedChecklist.splice(targetIdx, 0, removed);

    const updatedSetup = { ...selectedSetup, checklist: updatedChecklist };
    setSelectedSetup(updatedSetup);

    const updatedPlaybooks = playbookSetups.map(s => s.id === selectedSetup.id ? updatedSetup : s);
    setPlaybookSetups(updatedPlaybooks);
    saveStoredData('goodtrader_playbook_setups', updatedPlaybooks);
    setDraggedRuleIdx(null);
    soundFx.playPop();
  };

  const [activePlaybookId, setActivePlaybookId] = useState(() => loadStoredData('goodtrader_active_playbook_id', 1));

  const handleSelectActivePlaybook = (setupId) => {
    soundFx.playSuccess();
    setActivePlaybookId(setupId);
    saveStoredData('goodtrader_active_playbook_id', setupId);
  };

  // SECTION B: VERIFIED STRATEGY PLAYBOOKS
  const [playbookSetups, setPlaybookSetups] = useState([
    {
      id: 1,
      name: 'Breakout & Retest (Key S/R Level)',
      winRate: '78%',
      winRateVal: 78,
      avgRr: '2.4 R',
      count: 42,
      netProfit: '+$14,250.00',
      tier: 'S-TIER EDGE',
      color: 'border-[#58CC02]',
      tagBg: 'bg-[#58CC02]/15 text-[#58CC02]',
      bestTime: '9:30 AM - 10:30 AM NY',
      sparkline: [20, 35, 30, 50, 45, 70, 65, 90, 85, 110],
      tradeMetrics: {
        avgHoldTime: '24 Mins',
        sharpeRatio: '3.42',
        profitFactor: '2.85',
        maxDrawdownR: '-1.0 R',
        execPrecision: '98% Plan Adherence'
      },
      checklist: [
        'Higher timeframe key level break',
        'Volume surge on breakout candle',
        '1-min / 5-min retest into former resistance',
        'Bullish engulfing confirmation candle'
      ],
      psychologyMistake: 'Chasing the initial breakout before waiting for the retest loses -1.2R on average.'
    },
    {
      id: 2,
      name: 'Trend Continuation Pullback',
      winRate: '64%',
      winRateVal: 64,
      avgRr: '1.8 R',
      count: 28,
      netProfit: '+$6,800.00',
      tier: 'A-TIER EDGE',
      color: 'border-[#1CB0F6]',
      tagBg: 'bg-[#1CB0F6]/15 text-[#1CB0F6]',
      bestTime: '10:00 AM - 11:30 AM NY',
      sparkline: [15, 25, 20, 35, 40, 38, 52, 60, 58, 75],
      tradeMetrics: {
        avgHoldTime: '18 Mins',
        sharpeRatio: '2.10',
        profitFactor: '1.92',
        maxDrawdownR: '-1.0 R',
        execPrecision: '95% Plan Adherence'
      },
      checklist: [
        'Clear higher-high & higher-low structure',
        'Pullback to 20 EMA or VWAP line',
        'Rejection wick at EMA level'
      ],
      psychologyMistake: 'Taking continuation trades when price is already extended at daily high.'
    },
    {
      id: 3,
      name: 'Key Support / Resistance Sweep',
      winRate: '71%',
      winRateVal: 71,
      avgRr: '2.1 R',
      count: 35,
      netProfit: '+$9,400.00',
      tier: 'S-TIER EDGE',
      color: 'border-[#FF6B00]',
      tagBg: 'bg-[#FF6B00]/15 text-[#FF6B00]',
      bestTime: '9:45 AM - 10:45 AM NY',
      sparkline: [10, 20, 15, 40, 35, 55, 60, 75, 70, 95],
      tradeMetrics: {
        avgHoldTime: '32 Mins',
        sharpeRatio: '2.95',
        profitFactor: '2.40',
        maxDrawdownR: '-1.2 R',
        execPrecision: '92% Plan Adherence'
      },
      checklist: [
        'Clean equal highs/lows targeted',
        'Aggressive wick sweep past key level',
        'Quick displacement close back inside range'
      ],
      psychologyMistake: 'Failing to place stop-loss above the sweep wick.'
    },
    {
      id: 4,
      name: 'VWAP Mean Reversion',
      winRate: '52%',
      winRateVal: 52,
      avgRr: '1.4 R',
      count: 19,
      netProfit: '+$1,950.00',
      tier: 'B-TIER EDGE',
      color: 'border-[#A560FF]',
      tagBg: 'bg-[#A560FF]/15 text-[#A560FF]',
      bestTime: '1:30 PM - 3:00 PM NY',
      sparkline: [10, 18, 12, 22, 19, 28, 25, 32, 29, 38],
      tradeMetrics: {
        avgHoldTime: '15 Mins',
        sharpeRatio: '1.45',
        profitFactor: '1.32',
        maxDrawdownR: '-1.8 R',
        execPrecision: '88% Plan Adherence'
      },
      checklist: [
        '2+ Standard Deviations away from VWAP',
        'Divergence on RSI indicator',
        'Reversion candle back toward mean'
      ],
      psychologyMistake: 'Trading reversion during high-impact news events.'
    }
  ]);

  const [isNewSetupModalOpen, setIsNewSetupModalOpen] = useState(false);
  const [newSetupName, setNewSetupName] = useState('');
  const [newSetupRules, setNewSetupRules] = useState('');

  const handleCreateNewSetup = (e) => {
    e.preventDefault();
    if (!newSetupName.trim()) return;
    soundFx.playSuccess();

    const rulesArr = newSetupRules.split('\n').filter(r => r.trim().length > 0);
    const newSetupObj = {
      id: Date.now(),
      name: newSetupName.trim(),
      winRate: '0%',
      winRateVal: 0,
      avgRr: '0.0 R',
      count: 0,
      netProfit: '$0.00',
      tier: 'NEW EDGE',
      color: 'border-[#1CB0F6]',
      tagBg: 'bg-[#1CB0F6]/15 text-[#1CB0F6]',
      bestTime: 'Custom Session',
      sparkline: [10, 10, 10, 10, 10, 10],
      tradeMetrics: {
        avgHoldTime: '0 Mins',
        sharpeRatio: '0.0',
        profitFactor: '0.0',
        maxDrawdownR: '0.0 R',
        execPrecision: '100% Plan Adherence'
      },
      checklist: rulesArr.length > 0 ? rulesArr : ['Confirm setup criteria before entry'],
      psychologyMistake: 'Stick strictly to your defined risk parameters.'
    };

    setPlaybookSetups([newSetupObj, ...playbookSetups]);
    setNewSetupName('');
    setNewSetupRules('');
    setIsNewSetupModalOpen(false);
  };

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualSymbol, setManualSymbol] = useState('NQ1!');
  const [manualSide, setManualSide] = useState('BUY');
  const [manualSize, setManualSize] = useState('2.0');
  const [manualEntry, setManualEntry] = useState('18,450.00');
  const [manualExit, setManualExit] = useState('18,510.00');
  const [manualPnl, setManualPnl] = useState('1200');
  const [manualSetup, setManualSetup] = useState('Breakout & Retest (Key S/R Level)');
  const [manualType, setManualType] = useState('FOLLOW_WIN');

  const handleAddManualTrade = (e) => {
    e.preventDefault();
    soundFx.playSuccess();
    const newLog = {
      id: `TRD-${Math.floor(1000 + Math.random() * 9000)}`,
      time: 'Just Now',
      symbol: manualSymbol,
      side: manualSide,
      size: `${manualSize} Lots`,
      entry: manualEntry,
      exit: manualExit,
      pnlNum: parseFloat(manualPnl) || 0,
      pnl: `${parseFloat(manualPnl) >= 0 ? '+' : '-'}$${Math.abs(parseFloat(manualPnl) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      type: manualType,
      setup: manualSetup,
      r: `${parseFloat(manualPnl) >= 0 ? '+' : '-'}${(Math.abs(parseFloat(manualPnl) || 0) / 500).toFixed(1)} R`,
      chartUrl: manualChartUrl.trim() || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop'
    };

    setTradeLogs([newLog, ...tradeLogs]);
    setManualChartUrl('');
    setIsManualModalOpen(false);
  };

  const handleSimulateSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  const [isGlobalDragging, setIsGlobalDragging] = useState(false);

  const handleGlobalDragOver = (e) => {
    e.preventDefault();
    // STRICT OS FILE GUARD: Only activate file drop overlay if actual OS files are being dragged
    const types = Array.from(e.dataTransfer.types || []);
    const isDraggingExternalFile = types.includes('Files');

    if (isDraggingExternalFile && !isGlobalDragging) {
      setIsGlobalDragging(true);
    }
  };

  const handleGlobalDragLeave = (e) => {
    if (e.clientX === 0 || e.clientY === 0 || !e.relatedTarget) {
      setIsGlobalDragging(false);
    }
  };

  const compressImageFile = (file, callback) => {
    if (!file.type.startsWith('image/')) return;

    if (file.size > 15 * 1024 * 1024) {
      console.warn("Image exceeds 15MB file size limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        callback(compressedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleGlobalFileDrop = (e) => {
    e.preventDefault();
    setIsGlobalDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv') || file.name.endsWith('.html') || file.name.endsWith('.txt')) {
        setIsCsvModalOpen(true);
        setUploadedFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
          setUploadedFileContent(event.target.result);
          soundFx.playSuccess();
        };
        reader.readAsText(file);
      } else if (file.type.startsWith('image/')) {
        compressImageFile(file, (compressedUrl) => {
          setSelectedChartLog({
            id: 'DRAG_DROP_UPLOAD',
            symbol: file.name,
            side: 'CHART ATTACHMENT',
            pnl: 'Compressed Attachment',
            chartUrl: compressedUrl
          });
          soundFx.playSuccess();
        });
      }
    }
  };

  return (
    <main 
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalFileDrop}
      className="flex-1 min-h-screen lg:pl-28 xl:pl-80 xl:pr-[416px] bg-[#070C1E] p-4 sm:p-6 lg:p-8 text-white space-y-8 pb-24 lg:pb-10 max-w-full overflow-hidden relative"
    >
      {/* GLOBAL FILE DROP OVERLAY */}
      {isGlobalDragging && (
        <div className="fixed inset-0 bg-[#1CB0F6]/90 backdrop-blur-md flex flex-col items-center justify-center space-y-4 z-[999] animate-fade-in border-4 border-dashed border-white">
          <Upload size={64} className="text-white animate-bounce" />
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Drop File Anywhere to Import</h2>
          <p className="text-sm font-bold text-sky-100">Supports CSV/HTML Trade Fills & Chart Screenshot Images</p>
        </div>
      )}
      
      {/* 1. TOP HEADER & ACTION CONTROL ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <DuoBookIcon className="w-10 h-10 shrink-0" />
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Strategy Playbook</h2>
          </div>
        </div>

        {/* 4 Action Controls (Unboxed, Floating 3D Row) */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setIsBrokerModalOpen(true)}
            className="duo-btn-orange px-3.5 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <DuoLightningIcon className="w-4 h-4 shrink-0" />
            <span>Connect Broker</span>
          </button>

          <button 
            onClick={() => setIsCsvModalOpen(true)}
            className="duo-btn-green px-3.5 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <DuoFileSheetIcon className="w-4 h-4 shrink-0" />
            <span>Import CSV</span>
          </button>

          <button 
            onClick={() => setIsManualTradeModalOpen(true)}
            className="duo-btn-blue px-3.5 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} className="shrink-0" />
            <span>+ Manual Trade Log</span>
          </button>

          <button 
            onClick={() => {
              if (tradeLogs.length > 0) {
                if (window.confirm("Clear demo trades and start with a clean account?")) {
                  setTradeLogs([]);
                  soundFx.playPop();
                }
              } else {
                setTradeLogs(defaultLogs);
                soundFx.playSuccess();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-[#142127] hover:bg-[#20323D] border border-[#2B3D47] text-slate-300 hover:text-white text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            title="Toggle Demo Data"
          >
            <DuoUndoIcon className="w-4 h-4" />
            <span>{tradeLogs.length > 0 ? 'Clear Demo' : 'Load Demo'}</span>
          </button>
        </div>
      </div>

      {/* 3. DATE RANGE TIME FILTER CONTROL BAR */}
      <div className="flex justify-end">
        <div className="flex items-center gap-1 bg-[#142127] p-1 rounded-xl border border-[#20323D]">
          {[
            { id: '7D', label: '7D' },
            { id: '30D', label: '30D' },
            { id: 'THIS_MONTH', label: 'Month' },
            { id: 'ALL', label: 'All' },
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setActiveDateFilter(range.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeDateFilter === range.id
                  ? 'bg-[#1CB0F6] text-white shadow-sm'
                  : 'text-[#52656D] hover:text-white'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. EXECUTION PRECISION MATRIX & BEHAVIORAL STRENGTHS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Execution Precision Hero Card */}
        <div className="duo-card p-5 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-black text-white">Execution Precision</h3>
            <span className="text-xs font-black text-[#58CC02] bg-[#58CC02]/15 px-3 py-1 rounded-xl border border-[#58CC02]/30">A+ GRADE</span>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="shrink-0">
              <DuoChartIcon className="w-16 h-16 sm:w-20 sm:h-20 filter drop-shadow-xl" />
            </div>

            <div className="flex-1 min-w-0 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-black text-white truncate">Plan Compliance</span>
                <span className="text-lg sm:text-xl font-black text-[#58CC02] font-mono shrink-0">96%</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-black text-white truncate">Risk Limits</span>
                <span className="text-lg sm:text-xl font-black text-[#1CB0F6] font-mono shrink-0">98%</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-black text-white truncate">Tilt Control</span>
                <span className="text-lg sm:text-xl font-black text-[#FF6B00] font-mono shrink-0">92%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Behavioral Audit Hero Card */}
        <div className="duo-card p-5 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-black text-white">Behavioral Audit</h3>
            <span className="text-xs font-black text-[#1CB0F6] bg-[#1CB0F6]/15 px-3 py-1 rounded-xl border border-[#1CB0F6]/30">PASSED</span>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="shrink-0">
              <DuoTrophyIcon className="w-16 h-16 sm:w-20 sm:h-20 filter drop-shadow-xl" />
            </div>

            <div className="flex-1 min-w-0 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-black text-white truncate">Stop-Loss Discipline</span>
                <span className="text-lg sm:text-xl font-black text-[#58CC02] font-mono shrink-0">100%</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-black text-white truncate">Win Average</span>
                <span className="text-lg sm:text-xl font-black text-[#1CB0F6] font-mono shrink-0">2.4R</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-black text-white truncate">Late Session Trading</span>
                <span className="text-lg sm:text-xl font-black text-amber-400 font-mono shrink-0">2</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="duo-card p-5 sm:p-6 space-y-6">
        {/* Integrated Header Row (Zero Inner Boxes & Floating Filter Pill) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#20323D]">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black text-white">Execution Matrix</h3>
            <span className="text-sm font-black text-[#58CC02] bg-[#58CC02]/15 px-2.5 py-0.5 rounded-lg">+$22,400.00</span>
          </div>

          <div className="flex items-center gap-1 bg-[#142127] p-1 rounded-xl border border-[#20323D]">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'FUNDED', label: 'Funded' },
              { id: 'EVAL', label: 'Eval' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedAccountFilter(filter.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  selectedAccountFilter === filter.id
                    ? 'bg-[#1CB0F6] text-white shadow-sm'
                    : 'text-[#52656D] hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2x2 QUADRANT GRAPH MATRIX & DONUT BREAKDOWN */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          {/* PRECISION DONUT + DISCIPLINE INDEX CENTER */}
          <div className="xl:col-span-4 flex flex-col items-center justify-center p-6 bg-[#142127] rounded-3xl border-2 border-[#20323D] relative shadow-inner shrink-0">
            {(() => {
              const radius = 38;
              const circumference = 2 * Math.PI * radius;
              let accumulatedPercent = 0;
              const totalTradesCount = executionMatrix.reduce((acc, curr) => acc + parseInt(curr.count), 0);

              // Calculate overall Discipline Adherence Rate (Followed Plan Trades / Total Trades)
              const followedTrades = executionMatrix.filter(m => m.id.startsWith('FOLLOW')).reduce((acc, curr) => acc + parseInt(curr.count), 0);
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

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[9px] font-black uppercase text-[#52656D] tracking-wider">DISCIPLINE SCORE</span>
                    <div className="text-3xl font-black text-white leading-none mt-0.5">{adherenceScore}%</div>
                    <span className="text-[10px] font-extrabold text-[#58CC02] mt-1">{followedTrades} of {totalTradesCount} Fills Clean</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* BEHAVIORAL EXECUTION MATRIX CARDS (LIGHTWEIGHT & AIRY) */}
          <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-3.5 min-w-0">
            {executionMatrix.map((item) => {
              const isFollow = item.id.startsWith('FOLLOW');
              const countVal = parseInt(item.count) || 0;
              const hasTrades = countVal > 0;

              let activeCardStyle = 'bg-[#58CC02] border-[#46A302] border-b-4 text-white';
              if (item.id === 'FOLLOW_LOSS') activeCardStyle = 'bg-[#1CB0F6] border-[#1899D6] border-b-4 text-white';
              if (item.id === 'FOLLOW_BE') activeCardStyle = 'bg-[#CE82FF] border-[#B955FF] border-b-4 text-white';
              if (item.id === 'VIOLATE_WIN') activeCardStyle = 'bg-[#FFC800] border-[#D9AA00] border-b-4 text-slate-950';
              if (item.id === 'VIOLATE_BE') activeCardStyle = 'bg-[#00F0FF] border-[#00D8E6] border-b-4 text-slate-950';
              if (item.id === 'VIOLATE_LOSS') activeCardStyle = 'bg-[#FF4B4B] border-[#E03A3A] border-b-4 text-white';

              const isDarkText = item.id === 'VIOLATE_WIN' || item.id === 'VIOLATE_BE';

              return (
                <div 
                  key={item.id} 
                  className={`p-3.5 sm:p-4 rounded-2xl transition-all space-y-3 shadow-sm min-w-0 flex flex-col justify-between overflow-hidden ${
                    hasTrades
                      ? activeCardStyle
                      : 'bg-[#142127]/60 border border-[#20323D] text-slate-500 opacity-60'
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
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-black leading-tight tracking-tight whitespace-nowrap truncate">{item.title}</h4>
                        <span className="text-[9px] font-black uppercase tracking-wider opacity-75 block truncate">
                          {isFollow ? 'DISCIPLINED' : 'VIOLATION'}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full font-mono shrink-0 ${
                      hasTrades
                        ? isDarkText ? 'bg-slate-950/20 text-slate-950' : 'bg-white/20 text-white'
                        : 'bg-[#20323D] text-slate-400'
                    }`}>
                      {item.percent}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-2 border-t border-current/15 gap-2">
                    <span className="text-sm sm:text-base font-black leading-none shrink-0">
                      {item.count}
                    </span>
                    {hasTrades && (
                      <span className="text-xs font-black font-mono opacity-90 truncate text-right">{item.pnl}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>



      {/* SECTION 3: VERIFIED STRATEGY PLAYBOOKS */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-[#1CB0F6] font-black text-xs uppercase tracking-wider">
              VERIFIED STRATEGY PLAYBOOKS ({playbookSetups.length} / 4 MAX)
            </h3>
          </div>

          <button
            onClick={() => setIsNewSetupModalOpen(true)}
            className="duo-btn-orange px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Strategy</span>
          </button>
        </div>

        {playbookSetups.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-4 duo-card border-2 border-dashed border-[#20323D]">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#FF6B00]/15 border-2 border-[#FF6B00]/40 flex items-center justify-center text-[#FF6B00]">
              <DuoChestIcon className="w-9 h-9" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="text-base font-black text-white">Vault Empty</h4>
              <p className="text-xs font-bold text-[#77909D]">
                Create your first strategy playbook to track win rates and equity metrics.
              </p>
            </div>
            <button
              onClick={() => setIsNewSetupModalOpen(true)}
              className="duo-btn-orange px-5 py-2.5 text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus size={14} />
              <span>Create First Strategy</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {playbookSetups.map((setup, idx) => {
              const isActive = activePlaybookId === setup.id;

              // Solid 3D color themes matching Duolingo app DNA
              const cardThemes = [
                { bg: 'bg-[#1CB0F6]', border: 'border-[#1899D6]', borderB: 'border-b-[#147BB0]', text: 'text-white', badgeBg: 'bg-white/20 text-white border-white/30', profitColor: 'text-white' },
                { bg: 'bg-[#58CC02]', border: 'border-[#46A302]', borderB: 'border-b-[#388202]', text: 'text-white', badgeBg: 'bg-white/20 text-white border-white/30', profitColor: 'text-white' },
                { bg: 'bg-[#FFC800]', border: 'border-[#D9AA00]', borderB: 'border-b-[#8A6B00]', text: 'text-slate-950', badgeBg: 'bg-slate-950/20 text-slate-950 border-slate-950/30', profitColor: 'text-slate-950' },
                { bg: 'bg-[#FF6B00]', border: 'border-[#C2410C]', borderB: 'border-b-[#9A3412]', text: 'text-white', badgeBg: 'bg-white/20 text-white border-white/30', profitColor: 'text-white' },
              ];

              const theme = cardThemes[idx % cardThemes.length];

              return (
                <div 
                  key={setup.id} 
                  draggable={true}
                  onDragStart={(e) => {
                    setDraggedSetupId(setup.id);
                    e.dataTransfer.setData('text/plain', setup.id.toString());
                    soundFx.playPop();
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDropSetup(setup.id);
                  }}
                  className={`p-6 rounded-3xl ${theme.bg} border-2 ${theme.border} border-b-8 ${theme.borderB} ${theme.text} space-y-4 relative cursor-grab active:cursor-grabbing shadow-2xl transition-all ${
                    draggedSetupId === setup.id ? 'opacity-40 scale-[0.98]' : ''
                  }`}
                >
                  {/* Calculate Expectancy Telemetry for this setup */}
                  {(() => {
                    const setupTrades = tradeLogs.filter(t => t.setup?.toLowerCase() === setup.name.toLowerCase() || t.playbook?.toLowerCase() === setup.name.toLowerCase());
                    const expData = calculateSetupExpectancy(setupTrades.length > 0 ? setupTrades : tradeLogs);
                    const rawNetPnl = setupTrades.reduce((sum, t) => sum + (t.pnlNum !== undefined ? t.pnlNum : (parseFloat(t.pnl?.replace(/[^0-9.-]+/g, '')) || 0)), 0);
                    const pnlFormatted = formatCurrencyOrR(rawNetPnl || 3850, isStealthMode);

                    return (
                      <>
                        {/* Top Badge & Net Profit Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider opacity-90">
                            <DuoLightningIcon className="w-4 h-4 shrink-0" />
                            <span>{setup.tier}</span>
                          </div>
                          <span className={`text-lg sm:text-xl font-black font-mono ${theme.profitColor}`}>
                            {pnlFormatted}
                          </span>
                        </div>

                        {/* Title & Executions Count */}
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black leading-tight tracking-tight">{setup.name}</h3>
                          <div className="text-xs font-bold opacity-90 mt-0.5">{setup.count} Verified Executions</div>
                        </div>

                        {/* 4 HERO STAT FIGURES (EXPECTANCY MATH & TELEMETRY) */}
                        <div className="grid grid-cols-4 gap-2 pt-1">
                          <div className="p-2.5 rounded-2xl bg-black/20 border border-white/20 text-center space-y-0.5 backdrop-blur-sm">
                            <div className="text-[9px] font-black uppercase tracking-wider opacity-80">Win Rate</div>
                            <div className="text-base sm:text-lg font-black font-mono">{expData.winRate}%</div>
                          </div>

                          <div className="p-2.5 rounded-2xl bg-black/20 border border-white/20 text-center space-y-0.5 backdrop-blur-sm">
                            <div className="text-[9px] font-black uppercase tracking-wider opacity-80">Expectancy</div>
                            <div className="text-base sm:text-lg font-black font-mono">{expData.expectancyR}</div>
                          </div>

                          <div className="p-2.5 rounded-2xl bg-black/20 border border-white/20 text-center space-y-0.5 backdrop-blur-sm">
                            <div className="text-[9px] font-black uppercase tracking-wider opacity-80">Avg Win</div>
                            <div className="text-base sm:text-lg font-black font-mono">{expData.avgWinR}</div>
                          </div>

                          <div className="p-2.5 rounded-2xl bg-black/20 border border-white/20 text-center space-y-0.5 backdrop-blur-sm">
                            <div className="text-[9px] font-black uppercase tracking-wider opacity-80">Grade</div>
                            <div className="text-base sm:text-lg font-black font-mono">{expData.grade}</div>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* Tactical Checklist Rule Highlights (Collapsible Accordion - Simplified by default) */}
                  {setup.checklist && setup.checklist.length > 0 && (
                    <div className="space-y-2 text-left">
                      <button
                        onClick={() => {
                          soundFx.playPop();
                          const current = expandedPlaybooksState[setup.id];
                          setExpandedPlaybooksState({ ...expandedPlaybooksState, [setup.id]: !current });
                        }}
                        className="w-full py-2 px-3.5 rounded-2xl bg-black/20 hover:bg-black/30 border border-white/20 text-xs font-black uppercase tracking-wider flex items-center justify-between cursor-pointer backdrop-blur-sm transition-all"
                      >
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 size={14} />
                          <span>Entry Rules ({setup.checklist.length})</span>
                        </span>
                        <ChevronRight size={14} className={`transform transition-transform ${expandedPlaybooksState[setup.id] ? 'rotate-90' : ''}`} />
                      </button>

                      {expandedPlaybooksState[setup.id] && (
                        <div className="p-3.5 rounded-2xl bg-black/30 border border-white/20 space-y-2 backdrop-blur-sm animate-fade-in">
                          <ul className="space-y-1.5 text-xs font-bold">
                            {setup.checklist.map((rule, rIdx) => (
                              <li key={rIdx} className="flex items-center gap-2 truncate">
                                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                                <span className="truncate">{rule}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        soundFx.playPop();
                        setSelectedSetup(setup);
                      }}
                      className="flex-1 py-2.5 px-3 rounded-2xl bg-white/20 hover:bg-white/30 text-xs font-black uppercase tracking-wider border border-white/30 flex items-center justify-center gap-1.5 cursor-pointer backdrop-blur-sm transition-all active:scale-95 shadow-sm"
                    >
                      <Pencil size={14} />
                      <span>Edit Blueprint</span>
                    </button>

                    <button
                      onClick={() => handleSelectActivePlaybook(setup.id)}
                      className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black uppercase tracking-wider border flex items-center justify-center gap-1.5 cursor-pointer backdrop-blur-sm transition-all active:scale-95 shadow-sm ${
                        isActive
                          ? 'bg-[#58CC02] text-white border-[#388202] border-b-4 font-black shadow-lg'
                          : 'bg-white/20 hover:bg-white/30 border-white/30 text-white'
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      <span>{isActive ? 'Active Setup' : 'Select Active'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FULLY FUNCTIONAL REAL CSV UPLOAD MODAL */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="duo-card max-w-lg w-full p-6 space-y-5 border-2 border-[#1CB0F6] relative">
            <button 
              onClick={() => {
                setIsCsvModalOpen(false);
                setUploadedFileName('');
                setImportSuccess(false);
              }}
              className="absolute top-4 right-4 p-2 rounded-xl bg-[#20323D] text-slate-400 hover:text-white cursor-pointer font-black text-xs"
            >
              
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#1CB0F6]">MANUAL TRADE LOG IMPORT</span>
              <h3 className="text-2xl font-black text-white">Import Trade CSV File</h3>
              <p className="text-xs font-bold text-[#52656D]">Upload exported trade fills from NinjaTrader, Tradovate, Rithmic, or FTMO</p>
            </div>

            {/* REAL INPUT FILE FIELD */}
            <label className="p-8 rounded-3xl border-2 border-dashed border-[#1CB0F6]/50 bg-[#142127] flex flex-col items-center justify-center space-y-3 cursor-pointer hover:border-[#1CB0F6] transition-all relative block">
              <input 
                type="file" 
                accept=".csv,.html,.htm,.txt"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setUploadedFileName(file.name);
                    setParseError('');
                    setImportSuccess(false);

                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setUploadedFileContent(event.target.result);
                    };
                    reader.readAsText(file);
                  }
                }}
                className="hidden" 
              />
              <Upload size={36} className="text-[#1CB0F6]" />
              <div className="text-center">
                <div className="text-sm font-black text-white">
                  {uploadedFileName ? uploadedFileName : "Click to Browse or Drag & Drop CSV / HTML Statement"}
                </div>
                <div className="text-[10px] font-bold text-[#52656D] mt-0.5">
                  {uploadedFileName ? "File Loaded! Click Import Fills to process." : "Supports MT4/MT5 HTML Reports, Tradovate, Rithmic, NinjaTrader CSV files"}
                </div>
              </div>
            </label>

            {parseError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{parseError}</span>
              </div>
            )}

            {importSuccess && (
              <div className="p-3 rounded-xl bg-[#58CC02]/20 border border-[#58CC02] text-[#58CC02] text-xs font-black text-center flex items-center justify-center gap-2">
                <CheckCircle2 size={16} />
                <span>Successfully Parsed {importCount} Trade Fills from {uploadedFileName}!</span>
              </div>
            )}

            <button 
              disabled={!uploadedFileName || !uploadedFileContent}
              onClick={() => {
                try {
                  const parsedFills = parseTradeFile(uploadedFileContent, uploadedFileName);
                  if (parsedFills && parsedFills.length > 0) {
                    setTradeLogs([...parsedFills, ...tradeLogs]);
                    setImportCount(parsedFills.length);
                    setImportSuccess(true);
                    setParseError('');
                    setTimeout(() => {
                      setIsCsvModalOpen(false);
                      setUploadedFileName('');
                      setUploadedFileContent(null);
                      setImportSuccess(false);
                    }, 1400);
                  }
                } catch (err) {
                  setParseError(err.message || 'Failed to parse file.');
                }
              }}
              className={`w-full py-3.5 text-xs font-black uppercase tracking-wider transition-all ${
                uploadedFileName && uploadedFileContent ? 'duo-btn-blue cursor-pointer' : 'bg-[#20323D] text-[#52656D] border-2 border-[#37464F] cursor-not-allowed'
              }`}
            >
              {uploadedFileName ? "Import Fills into Analytics Engine" : "Select CSV / Statement File First"}
            </button>
          </div>
        </div>
      )}

      {/* REAL BROKER API CONNECT MODAL */}
      <BrokerConnectModal 
        isOpen={isBrokerModalOpen}
        onClose={() => setIsBrokerModalOpen(false)}
        onAccountAdded={(newAccount) => {
          setSyncedAccounts([newAccount, ...syncedAccounts]);
        }}
      />

      {/* FULL STRATEGY BLUEPRINT MODAL */}
      {selectedSetup && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="duo-card max-w-2xl w-full p-6 sm:p-8 space-y-6 border-2 border-[#1CB0F6] relative max-h-[92vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedSetup(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-[#20323D] text-slate-400 hover:text-white cursor-pointer font-black text-xs"
            >
              Close
            </button>

            <div className="space-y-1">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${selectedSetup.tagBg}`}>
                {selectedSetup.tier}
              </span>
              <h3 className="text-2xl font-black text-white mt-2">{selectedSetup.name}</h3>
              <p className="text-xs font-bold text-[#52656D]">Strategy Rules & Institutional Edge Metrics</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-[#142127] border border-[#20323D]">
                <div className="text-[9px] font-black text-[#52656D] uppercase">Sharpe Ratio</div>
                <div className="text-base font-black text-[#58CC02] mt-0.5">{selectedSetup.tradeMetrics.sharpeRatio}</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#142127] border border-[#20323D]">
                <div className="text-[9px] font-black text-[#52656D] uppercase">Profit Factor</div>
                <div className="text-base font-black text-[#1CB0F6] mt-0.5">{selectedSetup.tradeMetrics.profitFactor}</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#142127] border border-[#20323D]">
                <div className="text-[9px] font-black text-[#52656D] uppercase">Max Drawdown</div>
                <div className="text-base font-black text-rose-400 mt-0.5">{selectedSetup.tradeMetrics.maxDrawdownR}</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#142127] border border-[#20323D]">
                <div className="text-[9px] font-black text-[#52656D] uppercase">Plan Adherence</div>
                <div className="text-base font-black text-amber-400 mt-0.5">{selectedSetup.tradeMetrics.execPrecision}</div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#1CB0F6]">Mandatory Entry Rules (All Must Pass)</h4>
                <span className="text-[9px] font-mono text-[#52656D] font-bold">⠿ Drag to Re-Order Priority</span>
              </div>
              <div className="space-y-2">
                {selectedSetup.checklist.map((rule, idx) => (
                  <div 
                    key={idx} 
                    draggable={true}
                    onDragStart={(e) => {
                      setDraggedRuleIdx(idx);
                      e.dataTransfer.setData('text/plain', idx.toString());
                      soundFx.playPop();
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropRule(idx);
                    }}
                    className={`p-3 rounded-xl bg-[#142127] border transition-all cursor-grab active:cursor-grabbing flex items-center justify-between text-xs font-bold text-white ${
                      draggedRuleIdx === idx ? 'opacity-40 border-dashed border-[#1CB0F6]' : 'border-[#20323D] hover:border-[#37464F]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-[#58CC02] shrink-0" />
                      <span>{rule}</span>
                    </div>
                    <span className="text-[9px] text-[#52656D] font-mono">⠿ Drag</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setSelectedSetup(null)}
              className="duo-btn-orange w-full py-3.5 text-xs font-black uppercase tracking-wider"
            >
              Close Strategy Blueprint
            </button>
          </div>
        </div>
      )}

      {/* SECTION 3: LIVE TRADE EXECUTION LOG TABLE (Collapsible Accordion View at Page Bottom) */}
      <div className="duo-card p-5 sm:p-6 border-2 border-[#20323D] space-y-4 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#20323D]">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg sm:text-xl font-black text-white">Live Execution Fills Log</h3>
              <span className="text-xs font-black text-[#1CB0F6] bg-[#1CB0F6]/15 px-2.5 py-0.5 rounded-lg border border-[#1CB0F6]/30">
                {tradeLogs.length} Fills
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playPop();
              setShowTradeLogsTable(!showTradeLogsTable);
            }}
            className="duo-btn-blue px-4 py-2 text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <BarChart3 size={14} />
            <span>{showTradeLogsTable ? 'Hide Raw Audit Log' : 'Show Raw Audit Log'}</span>
            <ChevronRight size={14} className={`transform transition-transform ${showTradeLogsTable ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {showTradeLogsTable && (
          <>
            {tradeLogs.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-4 bg-[#142127]/50 rounded-2xl border-2 border-dashed border-[#20323D] my-2">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#1CB0F6]/15 border-2 border-[#1CB0F6]/40 flex items-center justify-center text-[#1CB0F6]">
              <BookOpen size={32} />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="text-base font-black text-white">No Trade Logs Available Yet</h4>
              <p className="text-xs font-bold text-slate-400">
                Connect your broker socket or upload a CSV statement to populate your live execution ledger.
              </p>
            </div>
            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="duo-btn-blue px-5 py-2.5 text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
            >
              <Upload size={14} />
              <span>Import Broker CSV / Statement</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto w-full scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <table className="w-full min-w-[760px] text-left text-xs font-bold text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-[#20323D] text-[10px] uppercase font-black text-[#52656D]">
                  <th className="pb-3 pr-3 whitespace-nowrap">Trade ID</th>
                  <th className="pb-3 px-3 whitespace-nowrap">Time</th>
                  <th className="pb-3 px-3 whitespace-nowrap">Instrument</th>
                  <th className="pb-3 px-3 whitespace-nowrap">Side / Size</th>
                  <th className="pb-3 px-3 whitespace-nowrap">Entry &rarr; Exit</th>
                  <th className="pb-3 px-3 whitespace-nowrap">Setup Tag</th>
                  <th className="pb-3 px-3 whitespace-nowrap">Execution Type</th>
                  <th className="pb-3 px-3 text-center whitespace-nowrap">Chart</th>
                  <th className="pb-3 pl-3 text-right whitespace-nowrap">Net P&L (R)</th>
                  <th className="pb-3 pl-3 text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20323D]/60">
                {tradeLogs.map((log) => {
                  const isBuy = (log.side || 'BUY').toUpperCase().includes('BUY');
                  const cleanSide = isBuy ? 'BUY' : 'SELL';
                  const cleanSize = (log.size || '1.0').replace(/lots/i, '').trim();

                  return (
                    <tr key={log.id} className="hover:bg-[#142127] transition-all group">
                      <td className="py-3.5 pr-3 font-black text-white whitespace-nowrap">{log.id}</td>
                      <td className="py-3.5 px-3 text-[#52656D] whitespace-nowrap">{log.time}</td>
                      <td className="py-3.5 px-3 font-black text-[#1CB0F6] whitespace-nowrap">{log.symbol}</td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black inline-flex items-center gap-1.5 ${
                          isBuy ? 'bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          <span>{cleanSide}</span>
                          <span className="opacity-60">&bull;</span>
                          <span>{cleanSize}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">{log.entry} &rarr; {log.exit}</td>
                      <td className="py-3.5 px-3 font-black text-white whitespace-nowrap">{log.setup}</td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {(!log.type || log.type === 'UNAUDITED') ? (
                          <button
                            onClick={() => {
                              const choice = prompt(
                                `Tag Execution Quality for ${log.id} (${log.symbol} ${log.pnl}):\n\n` +
                                `1: Disciplined Win\n` +
                                `2: Disciplined Loss\n` +
                                `3: Disciplined BE\n` +
                                `4: Toxic Win\n` +
                                `5: Toxic BE\n` +
                                `6: Double Failure`
                              );
                              const typeMap = {
                                '1': 'FOLLOW_WIN', '2': 'FOLLOW_LOSS', '3': 'FOLLOW_BE',
                                '4': 'VIOLATE_WIN', '5': 'VIOLATE_BE', '6': 'VIOLATE_LOSS'
                              };
                              if (choice && typeMap[choice.trim()]) {
                                const updated = tradeLogs.map(t => t.id === log.id ? { ...t, type: typeMap[choice.trim()] } : t);
                                setTradeLogs(updated);
                                saveStoredData('goodtrader_tradelogs', updated);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 text-[10px] font-black tracking-wider transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Tag size={11} />
                            <span>Needs Tagging</span>
                          </button>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                            log.type === 'FOLLOW_WIN' ? 'bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/30' :
                            log.type === 'FOLLOW_LOSS' ? 'bg-[#1CB0F6]/20 text-[#1CB0F6] border border-[#1CB0F6]/30' :
                            log.type === 'FOLLOW_BE' ? 'bg-[#CE82FF]/20 text-[#CE82FF] border border-[#CE82FF]/30' :
                            log.type === 'VIOLATE_WIN' ? 'bg-[#FFC800]/20 text-[#FFC800] border border-[#FFC800]/30' :
                            log.type === 'VIOLATE_BE' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30' :
                            'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {log.type === 'FOLLOW_WIN' ? 'Disciplined Win' :
                             log.type === 'FOLLOW_LOSS' ? 'Disciplined Loss' :
                             log.type === 'FOLLOW_BE' ? 'Disciplined BE' :
                             log.type === 'VIOLATE_WIN' ? 'Toxic Win' :
                             log.type === 'VIOLATE_BE' ? 'Toxic BE' : 'Double Failure'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {log.chartUrl ? (
                          <button
                            onClick={() => setActiveChartLightbox(log)}
                            className="px-2.5 py-1 rounded-lg bg-[#1CB0F6]/20 border border-[#1CB0F6]/40 text-[#1CB0F6] hover:bg-[#1CB0F6] hover:text-white font-black text-[10px] transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <BookOpen size={12} />
                            <span>View Chart</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const url = prompt('Paste TradingView Chart Snapshot URL (e.g. https://www.tradingview.com/x/...):');
                              if (url) {
                                const updated = tradeLogs.map(t => t.id === log.id ? { ...t, chartUrl: url } : t);
                                setTradeLogs(updated);
                                saveStoredData('goodtrader_tradelogs', updated);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#20323D] hover:bg-[#2B3D47] text-slate-400 hover:text-white font-bold text-[10px] transition-all cursor-pointer inline-flex items-center gap-1 border border-[#37464F]"
                          >
                            <span>+ Attach</span>
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 pl-3 text-right font-black whitespace-nowrap">
                        <div className={(log.pnl || '$0.00').startsWith('+') ? 'text-[#58CC02]' : 'text-rose-400'}>{log.pnl || '$0.00'}</div>
                        <div className="text-[10px] text-[#FF6B00] font-black">{log.r || '0.0 R'}</div>
                      </td>
                      <td className="py-3.5 pl-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteTrade(log)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Delete Trade Log"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </>
        )}

        {/* FLOATING UNDO DELETION TOAST BANNER */}
        {deletedTradeBackup && (
          <div className="p-3.5 rounded-2xl bg-[#182830] border-2 border-rose-500/50 text-white flex items-center justify-between animate-fade-in shadow-xl mt-4">
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Deleted Trade Log <strong>{deletedTradeBackup.id}</strong> ({deletedTradeBackup.symbol} &bull; {deletedTradeBackup.pnl}). All matrix metrics recalculated.</span>
            </div>
            <button
              onClick={handleUndoDelete}
              className="duo-btn-blue px-4 py-1.5 text-xs font-black uppercase tracking-wider cursor-pointer shrink-0"
            >
              Undo Deletion
            </button>
          </div>
        )}
      </div>

      {/* MANUAL TRADE ENTRY MODAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="duo-card max-w-lg w-full p-6 sm:p-8 space-y-5 border-2 border-[#1CB0F6] relative max-h-[92vh] overflow-y-auto">
            <button 
              onClick={() => setIsManualModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-[#20323D] text-slate-400 hover:text-white cursor-pointer font-black text-xs"
            >
              Close
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#1CB0F6]">MANUAL TRADE ENTRY</span>
              <h3 className="text-xl font-black text-white">Log Trade Fill</h3>
              <p className="text-xs font-bold text-[#52656D]">Record your trade execution directly into your analytics matrix</p>
            </div>

            <form onSubmit={handleAddManualTrade} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Symbol</label>
                  <input 
                    type="text"
                    value={manualSymbol}
                    onChange={(e) => setManualSymbol(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs focus:border-[#1CB0F6] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Direction / Side</label>
                  <select 
                    value={manualSide}
                    onChange={(e) => setManualSide(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs focus:border-[#1CB0F6] outline-none cursor-pointer"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Size (Lots)</label>
                  <input 
                    type="text"
                    value={manualSize}
                    onChange={(e) => setManualSize(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs focus:border-[#1CB0F6] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Entry Price</label>
                  <input 
                    type="text"
                    value={manualEntry}
                    onChange={(e) => setManualEntry(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs focus:border-[#1CB0F6] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Exit Price</label>
                  <input 
                    type="text"
                    value={manualExit}
                    onChange={(e) => setManualExit(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs focus:border-[#1CB0F6] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Net P&L ($)</label>
                  <input 
                    type="number"
                    value={manualPnl}
                    onChange={(e) => setManualPnl(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs focus:border-[#1CB0F6] outline-none"
                    placeholder="e.g. 1200 or -450"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Execution Process</label>
                  <select 
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs focus:border-[#1CB0F6] outline-none cursor-pointer"
                  >
                    <option value="FOLLOW_WIN">Followed Plan (Win)</option>
                    <option value="FOLLOW_LOSS">Followed Plan (Good Loss)</option>
                    <option value="VIOLATE_WIN">Violated Plan (Bad Win)</option>
                    <option value="VIOLATE_LOSS">Violated Plan (Bad Loss)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Playbook Setup Used</label>
                <select 
                  value={manualSetup}
                  onChange={(e) => setManualSetup(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs focus:border-[#1CB0F6] outline-none cursor-pointer"
                >
                  {playbookSetups.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                  <option value="Unplanned / Discretionary">Unplanned / Discretionary (No Setup)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Chart Screenshot URL (Optional)</label>
                <input 
                  type="url"
                  value={manualChartUrl}
                  onChange={(e) => setManualChartUrl(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs focus:border-[#1CB0F6] outline-none"
                  placeholder="https://www.tradingview.com/x/... or image link"
                />
              </div>

              <button 
                type="submit"
                className="duo-btn-orange w-full py-3.5 text-xs font-black uppercase tracking-wider cursor-pointer mt-2"
              >
                Log Trade to Analytics Matrix
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FULL-SCREEN CHART LIGHTBOX MODAL */}
      {activeChartLightbox && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="duo-card max-w-4xl w-full p-6 sm:p-8 space-y-4 border-2 border-[#1CB0F6] relative max-h-[95vh] overflow-y-auto">
            <button 
              onClick={() => setActiveChartLightbox(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-[#20323D] text-slate-400 hover:text-white cursor-pointer font-black text-xs"
            >
              Close Chart
            </button>

            <div className="flex items-center justify-between border-b border-[#20323D] pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#1CB0F6]">TRADE CHART ANALYSIS</span>
                <h3 className="text-xl font-black text-white">{activeChartLightbox.symbol} &bull; {activeChartLightbox.side} ({activeChartLightbox.size})</h3>
                <p className="text-xs font-bold text-[#52656D]">
                  Entry: {activeChartLightbox.entry} &rarr; Exit: {activeChartLightbox.exit} | PnL: <span className={(activeChartLightbox.pnl || '').startsWith('+') ? 'text-[#58CC02]' : 'text-rose-400'}>{activeChartLightbox.pnl} ({activeChartLightbox.r})</span>
                </p>
              </div>
              <span className="text-xs font-black text-white bg-[#20323D] px-3 py-1.5 rounded-xl border border-[#37464F]">
                {activeChartLightbox.setup}
              </span>
            </div>

            <div className="rounded-2xl border-2 border-[#20323D] overflow-hidden bg-black max-h-[60vh] flex items-center justify-center">
              <img 
                src={activeChartLightbox.chartUrl} 
                alt={`Chart Execution for ${activeChartLightbox.id}`} 
                className="w-full h-full object-contain max-h-[60vh]"
              />
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setActiveChartLightbox(null)}
                className="duo-btn-blue px-6 py-2.5 text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Close Chart Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW STRATEGY PLAYBOOK MODAL */}
      {isNewSetupModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="duo-card max-w-md w-full p-6 sm:p-8 space-y-5 border-2 border-[#58CC02] relative max-h-[92vh] overflow-y-auto">
            <button 
              onClick={() => setIsNewSetupModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-[#20323D] text-slate-400 hover:text-white cursor-pointer font-black text-xs"
            >
              Close
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#58CC02]">STRATEGY PLAYBOOK VAULT</span>
              <h3 className="text-xl font-black text-white">Create Custom Strategy</h3>
              <p className="text-xs font-bold text-[#52656D]">Define your trading setup and mandatory entry rules</p>
            </div>

            <form onSubmit={handleCreateNewSetup} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Strategy Name</label>
                <input 
                  type="text"
                  value={newSetupName}
                  onChange={(e) => setNewSetupName(e.target.value)}
                  placeholder="e.g. VWAP Mean Reversion or Fair Value Gap"
                  className="w-full p-3.5 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs focus:border-[#58CC02] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Mandatory Entry Rules (1 rule per line)</label>
                <textarea 
                  rows={4}
                  value={newSetupRules}
                  onChange={(e) => setNewSetupRules(e.target.value)}
                  placeholder="Rule 1: Wait for 15-min key S/R level sweep&#10;Rule 2: Confirm RSI divergence&#10;Rule 3: Risk max 1% per trade"
                  className="w-full p-3.5 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-bold text-xs focus:border-[#58CC02] outline-none"
                />
              </div>

              <button 
                type="submit"
                className="duo-btn-orange w-full py-3.5 text-xs font-black uppercase tracking-wider cursor-pointer mt-2"
              >
                Add Strategy to Playbook Vault
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL TRADE ENTRY MODAL */}
      <ManualTradeModal 
        isOpen={isManualTradeModalOpen} 
        onClose={() => setIsManualTradeModalOpen(false)} 
      />
    </main>
  );
}
