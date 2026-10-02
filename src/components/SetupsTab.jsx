import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Tag, CheckCircle2, ChevronRight, ChevronLeft, TrendingUp, BarChart3, 
  AlertTriangle, Upload, X, BookOpen, Pencil, Image as ImageIcon, Clock
} from 'lucide-react';
import ManualTradeModal from './ManualTradeModal';
import BrokerConnectModal from './BrokerConnectModal';
import ExecutionMatrixFilter from './playbook/ExecutionMatrixFilter';
import MarketSessionsGrid from './playbook/MarketSessionsGrid';
import {
  DuoBookIcon,
  DuoLightningIcon,
  DuoFileSheetIcon,
  DuoChartIcon,
  DuoTrophyIcon,
  DuoChestIcon,
  DuoDisciplinedWinIcon,
  DuoDisciplinedLossIcon,
  DuoDisciplinedBeIcon,
  DuoToxicWinIcon,
  DuoToxicBeIcon,
  DuoDoubleFailureIcon,
  DuoMissedTradeIcon
} from './DuoIcons';
import { 
  calculateExecutionMatrix, 
  calculateSetupExpectancy, 
  formatCurrencyOrR, 
  classifyTradeExecution,
  MARKET_SESSIONS,
  resolveMarketSession,
  calculateSessionMetrics
} from '../utils/tradeParser';
import { loadStoredData, saveStoredData, subscribeToStorageUpdate, buildDefaultPlaybooks, getAllStoredTrades, deleteStoredTrade, updateStoredTrade, restoreStoredTrade } from '../utils/storage';
import { getTrades, onTradesChange, updateTrade, deleteTrades, restoreTrades } from '../utils/tradeStore';
import ProLock from './ProLock';
import { soundFx } from '../utils/audioEngine';
import { parseFinancialNumber, formatFinancialCurrency, sumTradesPnl } from '../utils/financialMath';
import { compressImage } from '../utils/imageCompressor';
import InteractiveEquityCurve from './InteractiveEquityCurve';

export default function SetupsTab() {
  const [selectedSetup, setSelectedSetup] = useState(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [isManualTradeModalOpen, setIsManualTradeModalOpen] = useState(false);
  const [isStealthMode, setIsStealthMode] = useState(() => loadStoredData('tradepigeon_stealth_mode', false));
  const [playbookSetups, setPlaybookSetups] = useState(() => loadStoredData('tradepigeon_playbook_setups', buildDefaultPlaybooks()));

  // LIVE TRADE EXECUTIONS LOG TABLE DATA (Consolidates session trades, imports, and manual entries)
  const [tradeLogs, setTradeLogs] = useState(() => getTrades());
  useEffect(() => onTradesChange(() => setTradeLogs(getTrades())), []);

  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdate(({ key, value }) => {
      if (key === 'tradepigeon_stealth_mode') {
        setIsStealthMode(value);
      }
      if (key === 'tradepigeon_playbook_setups') {
        setPlaybookSetups(value);
      }
    });
    return () => unsubscribe();
  }, []);

  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileContent, setUploadedFileContent] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [parseError, setParseError] = useState('');
  const [activeDateFilter, setActiveDateFilter] = useState('30D');
  const [activeChartLightbox, setActiveChartLightbox] = useState(null);
  const [taggingTrade, setTaggingTrade] = useState(null);
  const [attachingChartTrade, setAttachingChartTrade] = useState(null);
  const [chartUrlInput, setChartUrlInput] = useState('');
  const [showTradeLogsTable, setShowTradeLogsTable] = useState(false);
  const [selectedExecutionFilter, setSelectedExecutionFilter] = useState(null);
  const [selectedSessionFilter, setSelectedSessionFilter] = useState(null);
  const [expandedPlaybooksState, setExpandedPlaybooksState] = useState({});

  const handleToggleExecutionFilter = (matrixId) => {
    soundFx.playPop();
    if (selectedExecutionFilter === matrixId) {
      setSelectedExecutionFilter(null);
    } else {
      setSelectedExecutionFilter(matrixId);
      setShowTradeLogsTable(true);
    }
  };

  const handleToggleSessionFilter = (sessionId) => {
    soundFx.playPop();
    if (selectedSessionFilter === sessionId) {
      setSelectedSessionFilter(null);
    } else {
      setSelectedSessionFilter(sessionId);
      setShowTradeLogsTable(true);
    }
  };

  const [deletedTradeBackup, setDeletedTradeBackup] = useState(null);

  const handleSelectExecutionTag = (tradeId, tagType) => {
    const updated = tradeLogs.map(t => t.id === tradeId ? { ...t, type: tagType } : t);
    setTradeLogs(updated);
    updateTrade(tradeId, { type: tagType });
    soundFx.playSuccess();
    setTaggingTrade(null);
  };

  const handleSaveChartAttachment = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!attachingChartTrade) return;
    const url = chartUrlInput.trim();
    const updated = tradeLogs.map(t => t.id === attachingChartTrade.id ? { ...t, chartUrl: url } : t);
    setTradeLogs(updated);
    updateTrade(attachingChartTrade.id, { chartUrl: url });
    soundFx.playSuccess();
    setAttachingChartTrade(null);
    setChartUrlInput('');
  };

  const handleDeleteTrade = (logToDelete) => {
    setDeletedTradeBackup(logToDelete);
    const updated = tradeLogs.filter(t => t.id !== logToDelete.id);
    setTradeLogs(updated);
    deleteTrades([logToDelete.id]);
    soundFx.playPop();
  };

  const handleUndoDelete = () => {
    if (!deletedTradeBackup) return;
    restoreTrades([deletedTradeBackup]);
    setTradeLogs([deletedTradeBackup, ...tradeLogs]);
    setDeletedTradeBackup(null);
    soundFx.playSuccess();
  };

  useEffect(() => {
    const handleTradeDeleted = (e) => {
      const { tradeId, tradeIds } = e.detail || {};
      if (tradeId) {
        setTradeLogs(prev => prev.filter(t => t && t.id !== tradeId));
      } else if (Array.isArray(tradeIds)) {
        const idSet = new Set(tradeIds);
        setTradeLogs(prev => prev.filter(t => t && !idSet.has(t.id)));
      }
    };
    window.addEventListener('tradepigeon_trade_deleted', handleTradeDeleted);
    return () => window.removeEventListener('tradepigeon_trade_deleted', handleTradeDeleted);
  }, []);

  const [connectedAccounts, setConnectedAccounts] = useState(() => loadStoredData('tradepigeon_accounts_data', []));

  useEffect(() => {
    const unsub = subscribeToStorageUpdate(({ key, value }) => {
      if (key === 'tradepigeon_accounts_data') {
        setConnectedAccounts(value || []);
      }
    });
    return unsub;
  }, []);

  const [selectedAccountFilter, setSelectedAccountFilter] = useState('ALL');

  const isAccountFunded = (accName) => {
    const nameLower = (accName || '').toLowerCase();
    const found = connectedAccounts.find(a => (a.name || '').toLowerCase() === nameLower || (a.accountNumber || '').toLowerCase() === nameLower);
    if (found) {
      const type = (found.type || found.accountType || '').toUpperCase();
      return type === 'FUNDED' || type === 'LIVE' || type === 'PA';
    }
    return nameLower.includes('funded') || nameLower.includes('live') || nameLower.includes('pa ');
  };

  const isAccountEval = (accName) => {
    const nameLower = (accName || '').toLowerCase();
    const found = connectedAccounts.find(a => (a.name || '').toLowerCase() === nameLower || (a.accountNumber || '').toLowerCase() === nameLower);
    if (found) {
      const type = (found.type || found.accountType || '').toUpperCase();
      return type === 'EVALUATION' || type === 'EVAL' || type === 'COMBINE' || type === 'CHALLENGE';
    }
    return nameLower.includes('eval') || nameLower.includes('combine') || nameLower.includes('challenge') || nameLower.includes('step');
  };

  const isTradeInDateRange = (trade, rangeId) => {
    if (!rangeId || rangeId === 'ALL') return true;
    const rawDate = trade.date || trade.time || trade.executedTime;
    if (!rawDate) return true;
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return true;
    const now = new Date();

    if (rangeId === '7D') {
      const diffMs = now.getTime() - d.getTime();
      return diffMs >= -86400000 && diffMs <= 7 * 24 * 60 * 60 * 1000;
    }
    if (rangeId === '30D') {
      const diffMs = now.getTime() - d.getTime();
      return diffMs >= -86400000 && diffMs <= 30 * 24 * 60 * 60 * 1000;
    }
    if (rangeId === 'THIS_MONTH') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    return true;
  };

  const filteredTradeLogs = tradeLogs.filter(log => {
    if (!isTradeInDateRange(log, activeDateFilter)) return false;
    if (selectedAccountFilter === 'ALL') return true;
    if (selectedAccountFilter === 'FUNDED') {
      return isAccountFunded(log.account);
    }
    if (selectedAccountFilter === 'EVAL') {
      return isAccountEval(log.account);
    }
    return log.account === selectedAccountFilter || (log.account && String(log.account).includes(selectedAccountFilter));
  });

  const accountFilterOptions = useMemo(() => {
    const base = [
      { id: 'ALL', label: 'All' },
      { id: 'FUNDED', label: 'Funded' },
      { id: 'EVAL', label: 'Eval' }
    ];
    if (Array.isArray(connectedAccounts) && connectedAccounts.length > 0) {
      connectedAccounts.forEach(acc => {
        if (acc.name && !base.some(b => b.id === acc.name)) {
          base.push({ id: acc.name, label: acc.name.length > 14 ? acc.name.slice(0, 12) + '...' : acc.name });
        }
      });
    }
    return base;
  }, [connectedAccounts]);


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
              setChartUrlInput(compressedUrl);
              soundFx.playSuccess();
            }
          });
          if (e.preventDefault) e.preventDefault();
          return;
        }
      }
    }
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        compressImage(file).then((compressedUrl) => {
          if (compressedUrl) {
            setChartUrlInput(compressedUrl);
            soundFx.playSuccess();
          }
        });
      }
    }
  };

  useEffect(() => {
    if (!attachingChartTrade) return;
    const onWindowPaste = (e) => handleImagePaste(e);
    window.addEventListener('paste', onWindowPaste);
    return () => window.removeEventListener('paste', onWindowPaste);
  }, [attachingChartTrade]);

  // Dynamic Real-Time Matrix Calculation based on active tradeLogs and calibrated max daily loss
  const storedLossLimitRaw = loadStoredData('tradepigeon_max_daily_loss', '$1,000');
  const numericLossLimit = Math.abs(parseFloat(String(storedLossLimitRaw).replace(/[^0-9.]/g, '')) || 500);
  const executionMatrix = calculateExecutionMatrix(filteredTradeLogs, numericLossLimit);

  // Filtered displayed trade logs based on interactive execution archetype and market session selection
  const displayedTradeLogs = useMemo(() => {
    let logs = filteredTradeLogs;
    if (selectedExecutionFilter) {
      logs = logs.filter(log => {
        const classification = classifyTradeExecution(log, numericLossLimit);
        return classification.id === selectedExecutionFilter;
      });
    }
    if (selectedSessionFilter) {
      logs = logs.filter(log => {
        const session = resolveMarketSession(log.time || log.timestamp);
        return session.id === selectedSessionFilter;
      });
    }
    return logs;
  }, [filteredTradeLogs, selectedExecutionFilter, selectedSessionFilter, numericLossLimit]);

  // Aggregate Market Session & Killzone telemetry
  const sessionMetrics = useMemo(() => {
    return calculateSessionMetrics(filteredTradeLogs, numericLossLimit);
  }, [filteredTradeLogs, numericLossLimit]);

  // Responsive Pagination State & Virtualized Display Window
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Automatically reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedExecutionFilter, selectedSessionFilter, activeDateFilter, selectedAccountFilter]);

  const totalLogsItems = displayedTradeLogs.length;
  const effectivePageSize = pageSize === 'ALL' ? totalLogsItems || 1 : Number(pageSize) || 25;
  const totalPages = Math.max(1, Math.ceil(totalLogsItems / effectivePageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedTradeLogs = useMemo(() => {
    if (pageSize === 'ALL') return displayedTradeLogs;
    const startIdx = (safeCurrentPage - 1) * effectivePageSize;
    return displayedTradeLogs.slice(startIdx, startIdx + effectivePageSize);
  }, [displayedTradeLogs, safeCurrentPage, effectivePageSize, pageSize]);

  // Dynamic Behavioral Audit & Execution Precision Telemetry
  const totalLogsCount = filteredTradeLogs.length;

  const isTradeViolated = (t) => {
    const type = (t.type || '').toLowerCase();
    const execType = (t.executionType || '').toLowerCase();
    const setup = (t.setup || '').toLowerCase();
    return (
      type.includes('violate') ||
      type.includes('toxic') ||
      type.includes('double_failure') ||
      execType.includes('toxic') ||
      execType.includes('double failure') ||
      setup.includes('revenge') ||
      setup.includes('fomo') ||
      t.grade === 'F'
    );
  };

  const getExecutionBadge = (type = '', pnl = 0) => {
    const t = String(type || '').toLowerCase();
    if (t === 'follow_win' || t === 'win' || t === 'disciplined win') {
      return { label: 'Disciplined Win', cls: 'bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/30' };
    }
    if (t === 'follow_loss' || t === 'good_loss' || t === 'disciplined loss') {
      return { label: 'Disciplined Loss', cls: 'bg-[#1CB0F6]/20 text-[#1CB0F6] border border-[#1CB0F6]/30' };
    }
    if (t === 'follow_be' || t === 'breakeven' || t === 'disciplined be' || t === 'disciplined breakeven') {
      return { label: 'Disciplined BE', cls: 'bg-[#CE82FF]/20 text-[#CE82FF] border border-[#CE82FF]/30' };
    }
    if (t === 'violate_win' || t === 'toxic_win' || t === 'toxic win') {
      return { label: 'Toxic Win', cls: 'bg-[#FFC800]/20 text-[#FFC800] border border-[#FFC800]/30' };
    }
    if (t === 'violate_be' || t === 'toxic_be' || t === 'toxic be' || t === 'toxic breakeven') {
      return { label: 'Toxic BE', cls: 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30' };
    }
    if (t === 'missed_trade' || t === 'missed' || t === 'missed setup') {
      return { label: 'Missed Setup', cls: 'bg-[#FF9600]/20 text-[#FF9600] border border-[#FF9600]/30' };
    }
    if (t === 'violate_loss' || t === 'double_failure' || t === 'double failure') {
      return { label: 'Double Failure', cls: 'bg-rose-500/20 text-rose-400 border border-rose-500/30' };
    }
    if (pnl > 0) {
      return { label: 'Disciplined Win', cls: 'bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/30' };
    }
    if (pnl < 0) {
      return { label: 'Disciplined Loss', cls: 'bg-[#1CB0F6]/20 text-[#1CB0F6] border border-[#1CB0F6]/30' };
    }
    return { label: 'Disciplined BE', cls: 'bg-[#CE82FF]/20 text-[#CE82FF] border border-[#CE82FF]/30' };
  };

  const followedLogs = filteredTradeLogs.filter(t => !isTradeViolated(t));
  const cleanRiskLogs = filteredTradeLogs.filter(t => !isTradeViolated(t));
  const tiltFreeLogs = filteredTradeLogs.filter(t => !t.setup?.toLowerCase().includes('revenge') && !t.setup?.toLowerCase().includes('fomo'));
  const stopLossLogs = filteredTradeLogs.filter(t => !t.type?.includes('VIOLATE_LOSS') && t.type !== 'double_failure');

  const planCompPercent = totalLogsCount > 0 ? Math.round((followedLogs.length / totalLogsCount) * 100) : 0;
  const riskLimitsPercent = totalLogsCount > 0 ? Math.round((cleanRiskLogs.length / totalLogsCount) * 100) : 0;
  const tiltControlPercent = totalLogsCount > 0 ? Math.round((tiltFreeLogs.length / totalLogsCount) * 100) : 0;
  const stopLossPercent = totalLogsCount > 0 ? Math.round((stopLossLogs.length / totalLogsCount) * 100) : 0;

  // Win average R calculation
  const winLogs = filteredTradeLogs.filter(t => {
    const val = t.pnlNum !== undefined ? t.pnlNum : parseFinancialNumber(t.pnl, 0);
    return val > 0;
  });
  const totalWinR = winLogs.reduce((sum, t) => {
    const val = t.pnlNum !== undefined ? t.pnlNum : parseFinancialNumber(t.pnl, 0);
    return sum + (val / 350);
  }, 0);
  const winAvgRVal = winLogs.length > 0 ? (totalWinR / winLogs.length).toFixed(1) : '0.0';

  // Late session trades count
  const lateSessionCount = filteredTradeLogs.filter(t => t.time && (t.time.includes('15:') || t.time.includes('16:') || t.setup?.toLowerCase().includes('late'))).length;

  // Total Net PnL calculation
  const totalNetPnl = sumTradesPnl(filteredTradeLogs);

  // Cumulative Equity Trajectory Curve Data
  const equityCurveData = useMemo(() => {
    if (!filteredTradeLogs || filteredTradeLogs.length === 0) {
      return [0, 0];
    }
    const sorted = [...filteredTradeLogs].sort((a, b) => {
      const tA = new Date(a.date || a.timestamp || 0).getTime();
      const tB = new Date(b.date || b.timestamp || 0).getTime();
      return tA - tB;
    });
    let running = 0;
    const curve = [0];
    sorted.forEach((t) => {
      const pnl = t.pnlNum !== undefined ? t.pnlNum : parseFinancialNumber(t.pnl, 0);
      running += pnl;
      curve.push(running);
    });
    if (curve.length === 1) curve.push(0);
    return curve;
  }, [filteredTradeLogs]);

  // Grade & Status calculation
  let overallGrade = 'NO DATA';
  if (totalLogsCount > 0) {
    if (planCompPercent >= 90) overallGrade = 'A+ GRADE';
    else if (planCompPercent >= 80) overallGrade = 'A GRADE';
    else if (planCompPercent >= 70) overallGrade = 'B GRADE';
    else overallGrade = 'C GRADE';
  }

  const auditStatus = totalLogsCount === 0 ? 'PENDING' : (planCompPercent >= 70 ? 'PASSED' : 'NEEDS AUDIT');

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
    saveStoredData('tradepigeon_playbook_setups', updated);
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
    saveStoredData('tradepigeon_playbook_setups', updatedPlaybooks);
    setDraggedRuleIdx(null);
    soundFx.playPop();
  };

  const [activePlaybookId, setActivePlaybookId] = useState(() => loadStoredData('tradepigeon_active_playbook_id', 1));

  const handleSelectActivePlaybook = (setupId) => {
    soundFx.playSuccess();
    setActivePlaybookId(setupId);
    saveStoredData('tradepigeon_active_playbook_id', setupId);
  };

  // SECTION B: VERIFIED STRATEGY PLAYBOOKS (Clean Zero-State Initial Metrics)
  const [isNewSetupModalOpen, setIsNewSetupModalOpen] = useState(false);
  const [newSetupName, setNewSetupName] = useState('');
  const [newSetupRules, setNewSetupRules] = useState('');

  // Escape closes any open modal (declared after all the modal state it reads)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (attachingChartTrade) setAttachingChartTrade(null);
        if (activeChartLightbox) setActiveChartLightbox(null);
        if (isNewSetupModalOpen) setIsNewSetupModalOpen(false);
        if (selectedSetup) setSelectedSetup(null);
        if (isCsvModalOpen) setIsCsvModalOpen(false);
        if (taggingTrade) setTaggingTrade(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [attachingChartTrade, activeChartLightbox, isNewSetupModalOpen, selectedSetup, isCsvModalOpen, taggingTrade]);

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

    const updatedPlaybooks = [newSetupObj, ...playbookSetups];
    setPlaybookSetups(updatedPlaybooks);
    saveStoredData('tradepigeon_playbook_setups', updatedPlaybooks);
    setNewSetupName('');
    setNewSetupRules('');
    setIsNewSetupModalOpen(false);
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

  const handleGlobalFileDrop = (e) => {
    e.preventDefault();
    setIsGlobalDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv') || file.name.endsWith('.html') || file.name.endsWith('.txt')) {
        window.dispatchEvent(new CustomEvent('tradepigeon_open_import'));
        setUploadedFileName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
          setUploadedFileContent(event.target.result);
          soundFx.playSuccess();
        };
        reader.readAsText(file);
      } else if (file.type.startsWith('image/')) {
        compressImage(file).then((compressedUrl) => {
          if (compressedUrl) {
            setActiveChartLightbox({
              id: 'DRAG_DROP_UPLOAD',
              symbol: file.name,
              side: 'CHART ATTACHMENT',
              pnl: 'Compressed Attachment',
              chartUrl: compressedUrl
            });
            soundFx.playSuccess();
          }
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
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Your playbook</h2>
          </div>
        </div>

        {/* 4 Action Controls (Unboxed, Floating 3D Row) */}
        <div className="flex flex-wrap items-center gap-2">

          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('tradepigeon_open_import'))}
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
            <span>Manual Trade</span>
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
            <h3 className="text-lg sm:text-xl font-black text-white">Plan check</h3>
            <span className={`text-xs font-black px-3 py-1 rounded-xl border ${
              totalLogsCount === 0
                ? 'text-slate-400 bg-slate-500/10 border-slate-500/30'
                : 'text-[#58CC02] bg-[#58CC02]/15 border-[#58CC02]/30'
            }`}>
              {overallGrade}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="shrink-0">
              <DuoChartIcon className="w-16 h-16 sm:w-20 sm:h-20 filter drop-shadow-xl" />
            </div>

            <div className="flex-1 min-w-0 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-black text-white truncate">Plan Compliance</span>
                <span className="text-lg sm:text-xl font-black text-[#58CC02] font-mono shrink-0">
                  {totalLogsCount > 0 ? `${planCompPercent}%` : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-black text-white truncate">Risk Limits</span>
                <span className="text-lg sm:text-xl font-black text-[#1CB0F6] font-mono shrink-0">
                  {totalLogsCount > 0 ? `${riskLimitsPercent}%` : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-black text-white truncate">Tilt Control</span>
                <span className="text-lg sm:text-xl font-black text-[#FF6B00] font-mono shrink-0">
                  {totalLogsCount > 0 ? `${tiltControlPercent}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Behavioral Audit Hero Card */}
        <ProLock feature="Habit check">
        <div className="duo-card p-5 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-black text-white">Habit check</h3>
            <span className={`text-xs font-black px-3 py-1 rounded-xl border ${
              totalLogsCount === 0
                ? 'text-slate-400 bg-slate-500/10 border-slate-500/30'
                : auditStatus === 'PASSED'
                  ? 'text-[#1CB0F6] bg-[#1CB0F6]/15 border-[#1CB0F6]/30'
                  : 'text-amber-400 bg-amber-500/15 border-amber-500/30'
            }`}>
              {auditStatus}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="shrink-0">
              <DuoTrophyIcon className="w-16 h-16 sm:w-20 sm:h-20 filter drop-shadow-xl" />
            </div>

            <div className="flex-1 min-w-0 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-black text-white truncate">Stop-Loss Discipline</span>
                <span className="text-lg sm:text-xl font-black text-[#58CC02] font-mono shrink-0">
                  {totalLogsCount > 0 ? `${stopLossPercent}%` : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-black text-white truncate">Win Average</span>
                <span className="text-lg sm:text-xl font-black text-[#1CB0F6] font-mono shrink-0">
                  {totalLogsCount > 0 ? `${winAvgRVal}R` : '0.0R'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-black text-white truncate">Late Session Trading</span>
                <span className="text-lg sm:text-xl font-black text-amber-400 font-mono shrink-0">
                  {lateSessionCount}
                </span>
              </div>
            </div>
          </div>
        </div>
        </ProLock>
      </div>

      {/* CUMULATIVE EQUITY PERFORMANCE TRAJECTORY */}
      <div className="duo-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center shrink-0 border border-[#58CC02]/30">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Equity Curve</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Net Realized:</span>
            <span className={`text-base sm:text-lg font-black font-mono ${totalNetPnl >= 0 ? 'text-[#58CC02]' : 'text-rose-400'}`}>
              {formatFinancialCurrency(totalNetPnl, { showPlus: true })}
            </span>
          </div>
        </div>

        <div className="pt-2">
          <InteractiveEquityCurve 
            data={equityCurveData} 
            color={totalNetPnl >= 0 ? "#58CC02" : "#FF4B4B"}
            id="setups-telemetry-curve"
            formatValue={(val) => formatFinancialCurrency(val, { showPlus: true })}
          />
        </div>
      </div>

      <div className="duo-card p-5 sm:p-6 space-y-6">
        {/* Integrated Header Row (Zero Inner Boxes & Floating Filter Pill) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#20323D]">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black text-white">Results by habit</h3>
            <span className={`text-sm font-black px-2.5 py-0.5 rounded-lg ${
              totalNetPnl >= 0 ? 'text-[#58CC02] bg-[#58CC02]/15' : 'text-rose-400 bg-rose-500/15'
            }`}>
              {formatCurrencyOrR(totalNetPnl, isStealthMode)}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-[#142127] p-1 rounded-xl border border-[#20323D] overflow-x-auto max-w-full">
            {accountFilterOptions.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedAccountFilter(filter.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
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

        {/* 7 EXECUTION TYPES MATRIX & DONUT BREAKDOWN */}
        <ProLock feature="Results by habit">
        <ExecutionMatrixFilter
          executionMatrix={executionMatrix}
          selectedExecutionFilter={selectedExecutionFilter}
          onToggleExecutionFilter={handleToggleExecutionFilter}
        />
        </ProLock>
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
                    const setupName = String(setup?.name || '').toLowerCase();
                    const setupTrades = tradeLogs.filter(t => String(t.setup || '').toLowerCase() === setupName || String(t.playbook || '').toLowerCase() === setupName);
                    const expData = calculateSetupExpectancy(setupTrades);
                    const rawNetPnl = sumTradesPnl(setupTrades);
                    const pnlFormatted = formatCurrencyOrR(rawNetPnl, isStealthMode);

                    return (
                      <>
                        {/* Top Badge & Net Profit Header */}
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider opacity-90 truncate">
                            <DuoLightningIcon className="w-4 h-4 shrink-0" />
                            <span className="truncate">{setup.tier}</span>
                          </div>
                          <span className={`text-base sm:text-lg font-black font-mono shrink-0 ${theme.profitColor}`}>
                            {pnlFormatted}
                          </span>
                        </div>

                        {/* Title & Executions Count */}
                        <div className="min-w-0 text-left">
                          <h3 className="text-lg sm:text-xl font-black leading-tight tracking-tight truncate">{setup.name}</h3>
                          <div className="text-xs font-bold opacity-90 mt-0.5">{setupTrades.length} Verified Executions</div>
                        </div>

                        {/* 4 HERO STAT FIGURES (RESPONSIVE NON-OVERFLOWING TELEMETRY) */}
                        <div className="grid grid-cols-4 gap-1.5 pt-1 min-w-0">
                          <div className="p-2 sm:p-2.5 rounded-xl bg-black/20 border border-white/20 text-center space-y-0.5 backdrop-blur-sm min-w-0 overflow-hidden">
                            <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider opacity-80 truncate">WIN RATE</div>
                            <div className="text-xs sm:text-sm font-black font-mono truncate">{expData.winRate}%</div>
                          </div>

                          <div className="p-2 sm:p-2.5 rounded-xl bg-black/20 border border-white/20 text-center space-y-0.5 backdrop-blur-sm min-w-0 overflow-hidden">
                            <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider opacity-80 truncate">EXP</div>
                            <div className="text-xs sm:text-sm font-black font-mono truncate">{expData.expectancyR}</div>
                          </div>

                          <div className="p-2 sm:p-2.5 rounded-xl bg-black/20 border border-white/20 text-center space-y-0.5 backdrop-blur-sm min-w-0 overflow-hidden">
                            <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider opacity-80 truncate">AVG WIN</div>
                            <div className="text-xs sm:text-sm font-black font-mono truncate">{expData.avgWinR}</div>
                          </div>

                          <div className="p-2 sm:p-2.5 rounded-xl bg-black/20 border border-white/20 text-center space-y-0.5 backdrop-blur-sm min-w-0 overflow-hidden">
                            <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider opacity-80 truncate">GRADE</div>
                            <div className="text-xs sm:text-sm font-black font-mono truncate">{expData.grade}</div>
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


      

      {/* REAL BROKER API CONNECT MODAL */}
      <BrokerConnectModal 
        isOpen={isBrokerModalOpen}
        onClose={() => setIsBrokerModalOpen(false)}
        onAccountAdded={() => {
          soundFx.playSuccess();
          setTradeLogs(getTrades());
        }}
      />

      {/* FULL STRATEGY BLUEPRINT MODAL */}
      {selectedSetup && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedSetup(null);
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="duo-card max-w-2xl w-full p-6 sm:p-8 space-y-6 border-2 border-[#1CB0F6] relative max-h-[92vh] overflow-y-auto"
          >
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

            {(() => {
              const selName = String(selectedSetup?.name || '').toLowerCase();
              const setupTrades = tradeLogs.filter(t => 
                String(t.setup || '').toLowerCase() === selName || 
                String(t.playbook || '').toLowerCase() === selName
              );
              const exp = calculateSetupExpectancy(setupTrades, 350);
              const sharpe = setupTrades.length > 0 ? exp.sharpeRatio : (selectedSetup.tradeMetrics?.sharpeRatio || '0.0');
              const pf = setupTrades.length > 0 ? exp.profitFactor : (selectedSetup.tradeMetrics?.profitFactor || '0.0');
              const maxDd = setupTrades.length > 0 ? exp.maxDrawdownR : (selectedSetup.tradeMetrics?.maxDrawdownR || '0.0 R');
              const adherence = setupTrades.length > 0 ? exp.execPrecision : (selectedSetup.tradeMetrics?.execPrecision || '100% Plan Adherence');

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl bg-[#142127] border border-[#20323D]">
                    <div className="text-[9px] font-black text-[#52656D] uppercase">Sharpe Ratio</div>
                    <div className="text-base font-black text-[#58CC02] mt-0.5">{sharpe}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#142127] border border-[#20323D]">
                    <div className="text-[9px] font-black text-[#52656D] uppercase">Profit Factor</div>
                    <div className="text-base font-black text-[#1CB0F6] mt-0.5">{pf}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#142127] border border-[#20323D]">
                    <div className="text-[9px] font-black text-[#52656D] uppercase">Max Drawdown</div>
                    <div className="text-base font-black text-rose-400 mt-0.5">{maxDd}</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#142127] border border-[#20323D]">
                    <div className="text-[9px] font-black text-[#52656D] uppercase">Plan Adherence</div>
                    <div className="text-base font-black text-amber-400 mt-0.5">{adherence}</div>
                  </div>
                </div>
              );
            })()}

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

      {/* SECTION 2.5: MARKET SESSIONS & KILLZONES (CME US Eastern Time) */}
      <div className="duo-card p-5 sm:p-6 border-2 border-[#20323D] space-y-4 mt-6">
        <MarketSessionsGrid
          sessionMetrics={sessionMetrics}
          selectedSessionFilter={selectedSessionFilter}
          onToggleSessionFilter={handleToggleSessionFilter}
          onClearSessionFilter={() => {
            soundFx.playPop();
            setSelectedSessionFilter(null);
          }}
        />
      </div>


      {/* SECTION 3: LIVE TRADE EXECUTION LOG TABLE (Collapsible Accordion View at Page Bottom) */}
      <div className="duo-card p-5 sm:p-6 border-2 border-[#20323D] space-y-4 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#20323D]">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg sm:text-xl font-black text-white">Live Execution Fills Log</h3>
              <span className="text-xs font-black text-[#1CB0F6] bg-[#1CB0F6]/15 px-2.5 py-0.5 rounded-lg border border-[#1CB0F6]/30">
                {(selectedExecutionFilter || selectedSessionFilter)
                  ? `${displayedTradeLogs.length} of ${filteredTradeLogs.length} Fills (Filtered)`
                  : `${filteredTradeLogs.length} Fills`}
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
            {/* Active Execution & Session Filter Pill Banner */}
            {(selectedExecutionFilter || selectedSessionFilter) && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-[#142127] border-2 border-[#20323D] animate-fade-in shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-[#52656D] tracking-wider">FILTERS APPLIED:</span>
                  
                  {selectedExecutionFilter && (() => {
                    const activeMeta = executionMatrix.find(m => m.id === selectedExecutionFilter);
                    return (
                      <span 
                        className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm"
                        style={{
                          backgroundColor: `${activeMeta?.color || '#1CB0F6'}20`,
                          color: activeMeta?.color || '#1CB0F6',
                          border: `1px solid ${activeMeta?.color || '#1CB0F6'}50`
                        }}
                      >
                        <span>{activeMeta?.title || selectedExecutionFilter}</span>
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playPop();
                            setSelectedExecutionFilter(null);
                          }}
                          className="hover:opacity-75 cursor-pointer ml-0.5"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })()}

                  {selectedSessionFilter && (() => {
                    const sessionMeta = MARKET_SESSIONS.find(s => s.id === selectedSessionFilter);
                    return (
                      <span 
                        className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm"
                        style={{
                          backgroundColor: `${sessionMeta?.color || '#FF9600'}20`,
                          color: sessionMeta?.color || '#FF9600',
                          border: `1px solid ${sessionMeta?.color || '#FF9600'}50`
                        }}
                      >
                        <Clock size={12} />
                        <span>{sessionMeta?.name || selectedSessionFilter}</span>
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playPop();
                            setSelectedSessionFilter(null);
                          }}
                          className="hover:opacity-75 cursor-pointer ml-0.5"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })()}

                  <span className="text-xs font-bold text-slate-400">
                    &bull; {displayedTradeLogs.length} of {filteredTradeLogs.length} Fills
                  </span>
                </div>

                <button
                  onClick={() => {
                    soundFx.playPop();
                    setSelectedExecutionFilter(null);
                    setSelectedSessionFilter(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-black text-slate-300 hover:text-white bg-[#20323D] hover:bg-[#2B3D47] border border-[#37464F] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <X size={13} />
                  <span>Clear All</span>
                </button>
              </div>
            )}

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
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                onClick={() => {
                  soundFx.playPop();
                  setIsManualTradeModalOpen(true);
                }}
                className="duo-btn-green px-5 py-2.5 text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Plus size={14} />
                <span>Log Manual Trade (N)</span>
              </button>
              <button
                onClick={() => {
                  soundFx.playPop();
                  window.dispatchEvent(new CustomEvent('tradepigeon_open_import'));
                }}
                className="duo-btn-blue px-5 py-2.5 text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Upload size={14} />
                <span>Import Broker CSV</span>
              </button>
            </div>
          </div>
        ) : displayedTradeLogs.length === 0 ? (
          <div className="py-10 px-4 text-center space-y-3 bg-[#142127]/50 rounded-2xl border-2 border-dashed border-[#20323D] my-2">
            <p className="text-sm font-bold text-slate-300">
              No trades match the current filter selection
              {selectedExecutionFilter && <span> (Archetype: <strong className="text-white">{executionMatrix.find(m => m.id === selectedExecutionFilter)?.title}</strong>)</span>}
              {selectedSessionFilter && <span> (Session: <strong className="text-white">{MARKET_SESSIONS.find(s => s.id === selectedSessionFilter)?.name}</strong>)</span>}
            </p>
            <button
              onClick={() => {
                soundFx.playPop();
                setSelectedExecutionFilter(null);
                setSelectedSessionFilter(null);
              }}
              className="duo-btn-blue px-4 py-2 text-xs uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
            >
              <X size={14} />
              <span>Show All Fills</span>
            </button>
          </div>
        ) : (<>
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
                {paginatedTradeLogs.map((log) => {
                  const isBuy = (log.side || 'BUY').toUpperCase().includes('BUY');
                  const cleanSide = isBuy ? 'BUY' : 'SELL';
                  const cleanSize = (log.size || '1.0').replace(/lots/i, '').trim();
                  const classification = classifyTradeExecution(log, numericLossLimit);
                  const session = resolveMarketSession(log.time || log.timestamp);

                  return (
                    <tr key={log.id} className="hover:bg-[#142127] transition-all group">
                      <td className="py-3.5 pr-3 font-black text-white whitespace-nowrap">{log.id}</td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="text-slate-300 font-mono text-xs">{log.time}</div>
                        <div className="mt-0.5">
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider ${session.badgeBg}`}>
                            {session.shortName}
                          </span>
                        </div>
                      </td>
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
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-black text-white">{log.setup}</div>
                        {Array.isArray(log.managementTags) && log.managementTags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {log.managementTags.map(tagId => {
                              const isToxic = tagId === 'widened_stop' || tagId === 'averaged_down' || tagId === 'chased_entry';
                              const label = tagId === 'scaled_out' ? 'Partials' :
                                            tagId === 'trailed_be' ? 'Trailed BE' :
                                            tagId === 'trailed_structure' ? 'Trailed' :
                                            tagId === 'held_runner' ? 'Runner' :
                                            tagId === 'respected_stop' ? 'Respected SL' :
                                            tagId === 'widened_stop' ? '⚠️ Widened SL' :
                                            tagId === 'averaged_down' ? '⚠️ Averaged Down' :
                                            tagId === 'early_exit' ? 'Early Exit' :
                                            tagId === 'chased_entry' ? '⚠️ Chased' : tagId;
                              return (
                                <span
                                  key={tagId}
                                  className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded tracking-wider ${
                                    isToxic
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                      : 'bg-[#58CC02]/15 text-[#58CC02] border border-[#58CC02]/30'
                                  }`}
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {(!log.type || log.type === 'UNAUDITED') ? (
                          <button
                            onClick={() => setTaggingTrade(log)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 text-[10px] font-black tracking-wider transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Tag size={11} />
                            <span>Needs Tagging</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setTaggingTrade(log)}
                            title="Click to re-classify execution quality"
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all hover:scale-105 cursor-pointer ${classification.badgeBg}`}
                          >
                            {classification.label}
                          </button>
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
                              setAttachingChartTrade(log);
                              setChartUrlInput(log.chartUrl || '');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#20323D] hover:bg-[#2B3D47] text-slate-400 hover:text-white font-bold text-[10px] transition-all cursor-pointer inline-flex items-center gap-1 border border-[#37464F]"
                          >
                            <span>+ Attach</span>
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 pl-3 text-right font-black whitespace-nowrap">
                        <div className={
                          classification.isToxicWin
                            ? 'text-amber-400 inline-flex items-center justify-end gap-1.5 font-mono'
                            : String(log.pnl || '').startsWith('+')
                            ? 'text-[#58CC02] font-mono'
                            : String(log.pnl || '').startsWith('-')
                            ? 'text-rose-400 font-mono'
                            : 'text-slate-400 font-mono'
                        }>
                          {classification.isToxicWin && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                              TOXIC
                            </span>
                          )}
                          <span>{log.pnl || '$0.00'}</span>
                        </div>
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

          {/* DUOLINGO-STYLE PAGINATION BAR */}
          {totalLogsItems > 0 && (
            <div className="mt-4 pt-4 border-t border-[#20323D] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              {/* Range Info */}
              <div className="text-[#52656D] font-bold text-[11px] flex items-center gap-1.5">
                <span>Showing</span>
                <span className="font-black text-white font-mono">
                  {pageSize === 'ALL' ? 1 : Math.min((safeCurrentPage - 1) * effectivePageSize + 1, totalLogsItems)}
                </span>
                <span>-</span>
                <span className="font-black text-white font-mono">
                  {pageSize === 'ALL' ? totalLogsItems : Math.min(safeCurrentPage * effectivePageSize, totalLogsItems)}
                </span>
                <span>of</span>
                <span className="font-black text-[#1CB0F6] font-mono">{totalLogsItems}</span>
                <span>fills</span>
                {selectedExecutionFilter && (
                  <span className="text-[10px] text-amber-400 font-bold ml-1">
                    (Filtered)
                  </span>
                )}
              </div>

              {/* Page Size & Navigation Controls */}
              <div className="flex items-center gap-3">
                {/* Page Size Selector */}
                <div className="flex items-center gap-1 bg-[#142127] p-1 rounded-xl border border-[#20323D]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5">Rows:</span>
                  {[25, 50, 100, 'ALL'].map(size => (
                    <button
                      key={size}
                      onClick={() => {
                        soundFx.playPop();
                        setPageSize(size);
                        setCurrentPage(1);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        pageSize === size
                          ? 'bg-[#1CB0F6] text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-[#20323D]'
                      }`}
                    >
                      {size === 'ALL' ? 'All' : size}
                    </button>
                  ))}
                </div>

                {/* Navigation Prev / Next */}
                {pageSize !== 'ALL' && totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        if (safeCurrentPage > 1) {
                          soundFx.playPop();
                          setCurrentPage(p => Math.max(1, p - 1));
                        }
                      }}
                      disabled={safeCurrentPage <= 1}
                      className={`duo-btn-dark px-2.5 py-1.5 text-xs flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed`}
                      title="Previous Page"
                    >
                      <ChevronLeft size={14} />
                      <span className="hidden sm:inline font-black text-[10px] uppercase">Prev</span>
                    </button>

                    <div className="px-2.5 py-1 rounded-xl bg-[#142127] border border-[#20323D] font-mono text-[11px] font-black text-white">
                      {safeCurrentPage} <span className="text-slate-500 font-normal">/</span> {totalPages}
                    </div>

                    <button
                      onClick={() => {
                        if (safeCurrentPage < totalPages) {
                          soundFx.playPop();
                          setCurrentPage(p => Math.min(totalPages, p + 1));
                        }
                      }}
                      disabled={safeCurrentPage >= totalPages}
                      className={`duo-btn-dark px-2.5 py-1.5 text-xs flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed`}
                      title="Next Page"
                    >
                      <span className="hidden sm:inline font-black text-[10px] uppercase">Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
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

      {/* FULL-SCREEN CHART LIGHTBOX MODAL */}
      {activeChartLightbox && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveChartLightbox(null);
          }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="duo-card max-w-4xl w-full p-6 sm:p-8 space-y-4 border-2 border-[#1CB0F6] relative max-h-[95vh] overflow-y-auto"
          >
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
                  Entry: {activeChartLightbox.entry} &rarr; Exit: {activeChartLightbox.exit} | PnL: <span className={String(activeChartLightbox.pnl || '').startsWith('+') ? 'text-[#58CC02]' : String(activeChartLightbox.pnl || '').startsWith('-') ? 'text-rose-400' : 'text-slate-400'}>{activeChartLightbox.pnl} ({activeChartLightbox.r})</span>
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

      {/* CLASSIFY EXECUTION QUALITY MODAL */}
      {taggingTrade && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setTaggingTrade(null);
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="duo-card max-w-md w-full p-6 space-y-5 border-2 border-[#1CB0F6] relative shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#20323D]">
              <div>
                <span className="text-[10px] font-black uppercase text-[#1CB0F6]">BEHAVIORAL AUDIT</span>
                <h3 className="text-base font-black text-white">Classify Execution Quality</h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  {taggingTrade.symbol} &bull; {taggingTrade.setup} &bull; <span className={String(taggingTrade.pnl || '').startsWith('+') ? 'text-[#58CC02]' : String(taggingTrade.pnl || '').startsWith('-') ? 'text-rose-400' : 'text-slate-400'}>{taggingTrade.pnl || '$0.00'}</span>
                </p>
              </div>
              <button
                onClick={() => setTaggingTrade(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Select Execution Type:</span>
              {[
                { type: 'FOLLOW_WIN', label: 'Disciplined Win', desc: 'Rules followed, edge rewarded with profit', color: 'bg-[#58CC02]/20 border-[#58CC02] text-[#58CC02] hover:bg-[#58CC02]/30' },
                { type: 'FOLLOW_LOSS', label: 'Disciplined Loss', desc: 'Rules strictly followed, acceptable cost of trading', color: 'bg-[#1CB0F6]/20 border-[#1CB0F6] text-[#1CB0F6] hover:bg-[#1CB0F6]/30' },
                { type: 'FOLLOW_BE', label: 'Disciplined Break-Even', desc: 'Rules followed, target reached or protected at BE', color: 'bg-[#CE82FF]/20 border-[#CE82FF] text-[#CE82FF] hover:bg-[#CE82FF]/30' },
                { type: 'VIOLATE_WIN', label: 'Toxic Win', desc: 'Rules broken or FOMO entry, rewarded by luck', color: 'bg-[#FFC800]/20 border-[#FFC800] text-[#FFC800] hover:bg-[#FFC800]/30' },
                { type: 'VIOLATE_BE', label: 'Toxic Break-Even', desc: 'Rules violated, lucky escape at scratch', color: 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] hover:bg-[#00F0FF]/30' },
                { type: 'VIOLATE_LOSS', label: 'Double Failure', desc: 'Plan broken AND capital lost (Tilt/Revenge)', color: 'bg-rose-500/20 border-rose-500 text-rose-400 hover:bg-rose-500/30' },
                { type: 'MISSED_TRADE', label: 'Missed Setup', desc: 'Valid edge confirmed, hesitation prevented entry', color: 'bg-[#FF9600]/20 border-[#FF9600] text-[#FF9600] hover:bg-[#FF9600]/30' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleSelectExecutionTag(taggingTrade.id, item.type)}
                  className={`w-full p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${item.color}`}
                >
                  <div>
                    <div className="font-black text-xs">{item.label}</div>
                    <div className="text-[10px] opacity-80 font-bold">{item.desc}</div>
                  </div>
                  <Tag size={14} className="shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ATTACH TRADINGVIEW CHART MODAL */}
      {attachingChartTrade && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setAttachingChartTrade(null);
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="duo-card max-w-md w-full p-6 space-y-5 border-2 border-[#1CB0F6] relative shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#20323D]">
              <div>
                <span className="text-[10px] font-black uppercase text-[#1CB0F6]">CHART ATTACHMENT</span>
                <h3 className="text-base font-black text-white">Attach TradingView Snapshot</h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  {attachingChartTrade.symbol} &bull; {attachingChartTrade.setup} ({attachingChartTrade.pnl})
                </p>
              </div>
              <button
                onClick={() => setAttachingChartTrade(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveChartAttachment} className="space-y-4">
              {/* Image Dropzone / Paste Area */}
              <div
                onDrop={handleImageDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('chart-attachment-file-input')?.click()}
                className="p-4 rounded-2xl border-2 border-dashed border-[#1CB0F6]/40 hover:border-[#1CB0F6] bg-[#142127] text-center cursor-pointer transition-all space-y-2 group"
              >
                <input
                  id="chart-attachment-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      compressImage(file).then((compressedUrl) => {
                        if (compressedUrl) {
                          setChartUrlInput(compressedUrl);
                          soundFx.playSuccess();
                        }
                      });
                    }
                  }}
                  className="hidden"
                />
                {chartUrlInput ? (
                  <div className="relative group/preview" onClick={(e) => e.stopPropagation()}>
                    <img
                      src={chartUrlInput}
                      alt="Chart Preview"
                      className="max-h-48 w-full object-contain rounded-xl border border-[#20323D] bg-black/40"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setChartUrlInput('');
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">Image Loaded. Click to replace or paste a new one.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center text-[#1CB0F6] group-hover:scale-110 transition-transform">
                      <ImageIcon size={32} />
                    </div>
                    <div className="text-xs font-black text-white">
                      Paste Screenshot (<span className="text-[#1CB0F6]">Cmd+V</span> / <span className="text-[#1CB0F6]">Ctrl+V</span>)
                    </div>
                    <p className="text-[10px] font-bold text-slate-400">
                      Or drag and drop an image file, or click to browse
                    </p>
                  </>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                  Or Paste TradingView Chart URL
                </label>
                <input
                  type="url"
                  value={chartUrlInput.startsWith('data:') ? '' : chartUrlInput}
                  onChange={(e) => setChartUrlInput(e.target.value)}
                  onPaste={handleImagePaste}
                  placeholder={chartUrlInput.startsWith('data:') ? 'Screenshot attached from clipboard' : 'https://www.tradingview.com/x/...'}
                  className="w-full bg-[#142127] border-2 border-[#20323D] rounded-xl px-3.5 py-2.5 text-xs font-black text-white focus:outline-none focus:border-[#1CB0F6]"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAttachingChartTrade(null)}
                  className="flex-1 py-3 rounded-2xl bg-[#142127] border-2 border-[#20323D] text-slate-300 hover:bg-[#182830] font-black text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!chartUrlInput.trim()}
                  className="flex-1 py-3 rounded-2xl duo-btn-green font-black text-xs uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  Attach Chart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW STRATEGY PLAYBOOK MODAL */}
      {isNewSetupModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsNewSetupModalOpen(false);
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="duo-card max-w-md w-full p-6 sm:p-8 space-y-5 border-2 border-[#58CC02] relative max-h-[92vh] overflow-y-auto"
          >
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
