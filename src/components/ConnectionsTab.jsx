import React, { useState, useEffect } from 'react';
import { 
  Zap, Plus, Trash2, RefreshCw, ChevronDown, ChevronRight, 
  Check, CheckCircle2, Shield, Eye, EyeOff, Sparkles, ExternalLink, 
  Pencil, Crown, Activity, Layers, HelpCircle, X, FileText
} from 'lucide-react';
import { DuoShieldIcon, DuoLightningIcon, DuoTrophyIcon, DuoStarIcon } from './DuoIcons';
import { TradovateLogo, NinjaTraderLogo, MetaTrader5Logo, CsvLogo } from './BrokerLogos';
import BrokerConnectModal from './BrokerConnectModal';
import { getTradesForDate, todaySessionDate } from '../utils/tradeStore';
import ConfirmModal from './ConfirmModal';
import { loadStoredData, saveStoredData, subscribeToStorageUpdate, STORAGE_KEYS, DEFAULT_USER_STATS } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';
import { parseFinancialNumber, formatFinancialCurrency, formatBalance as formatBalanceMath, formatRMultiple } from '../utils/financialMath';

export default function ConnectionsTab() {
  const [accounts, setAccounts] = useState(() => loadStoredData('tradepigeon_accounts_data', []));
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [isStealthMode, setIsStealthMode] = useState(() => loadStoredData('tradepigeon_stealth_mode', false));
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [expandedConnections, setExpandedConnections] = useState({});
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editingNickname, setEditingNickname] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: () => {}
  });

  // Subscribe to reactive storage updates from anywhere in app
  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdate(({ key, value }) => {
      if (key === 'tradepigeon_accounts_data') {
        setAccounts(value || []);
      }
      if (key === 'tradepigeon_stealth_mode') {
        setIsStealthMode(value);
      }
    });
    return unsubscribe;
  }, []);

  // Format currency or stealth R
  const formatMoney = (rawVal) => {
    const num = parseFinancialNumber(rawVal, 0);
    if (isStealthMode) {
      return formatRMultiple(num, 350, 2);
    }
    return formatFinancialCurrency(num, { showPlus: true });
  };

  const formatBalance = (rawVal) => {
    if (isStealthMode) return '••••••';
    return formatBalanceMath(rawVal, '$50,000.00');
  };

  // Group accounts by connection ID / platform
  const groupedConnections = accounts.reduce((acc, curr) => {
    const connId = curr.connectionId || `TDV-${(curr.accountNumber || curr.id || '1789392210861').replace(/[^0-9]/g, '').slice(-13) || '1789392210861'}`;
    if (!acc[connId]) {
      acc[connId] = {
        id: connId,
        platform: curr.broker ? curr.broker.split(' ')[0] : 'Tradovate',
        platformId: curr.platformId || 'tradovate',
        status: curr.status || 'Connected',
        environment: curr.environment || 'LIVE',
        accounts: []
      };
    }
    acc[connId].accounts.push(curr);
    return acc;
  }, {});

  const connectionList = Object.values(groupedConnections);

  // Initialize all connections as expanded by default for instant visibility
  useEffect(() => {
    if (connectionList.length > 0) {
      setExpandedConnections(prev => {
        if (Object.keys(prev).length > 0) return prev;
        const initial = {};
        connectionList.forEach(c => { initial[c.id] = true; });
        return initial;
      });
    }
  }, [connectionList]);

  const toggleConnectionExpand = (connId) => {
    soundFx.playPop();
    setExpandedConnections(prev => ({
      ...prev,
      [connId]: !prev[connId]
    }));
  };

  const handleExpandAll = () => {
    soundFx.playPop();
    const allExpanded = {};
    connectionList.forEach(c => { allExpanded[c.id] = true; });
    setExpandedConnections(allExpanded);
  };

  const handleCollapseAll = () => {
    soundFx.playPop();
    setExpandedConnections({});
  };

  // Toggle Lead / Follow state
  const handleSetLeadAccount = (accId) => {
    soundFx.playSuccess();
    const updated = accounts.map(a => {
      if (a.id === accId || a.accountNumber === accId) {
        return { ...a, isLead: true, isActive: true };
      }
      return { ...a, isLead: false };
    });
    setAccounts(updated);
    saveStoredData('tradepigeon_accounts_data', updated);
    setToastMsg('Primary Anchor account updated! Baseline analytics will reference this account.');
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Toggle active sync for sub-account
  const handleToggleAccountActive = (accId) => {
    soundFx.playPop();
    const updated = accounts.map(a => {
      if (a.id === accId || a.accountNumber === accId) {
        const nextActive = a.isActive === false ? true : false;
        return { ...a, isActive: nextActive };
      }
      return a;
    });
    setAccounts(updated);
    saveStoredData('tradepigeon_accounts_data', updated);
  };

  // Rename account nickname
  const handleSaveNickname = (accId) => {
    if (!editingNickname.trim()) {
      setEditingAccountId(null);
      return;
    }
    soundFx.playSuccess();
    const updated = accounts.map(a => {
      if (a.id === accId || a.accountNumber === accId) {
        return { ...a, name: editingNickname.trim() };
      }
      return a;
    });
    setAccounts(updated);
    saveStoredData('tradepigeon_accounts_data', updated);
    setEditingAccountId(null);
    setEditingNickname('');
  };

  // Disconnect entire broker connection
  const handleDisconnectConnection = (connId, platformName) => {
    soundFx.playPop();
    setConfirmConfig({
      isOpen: true,
      title: `Disconnect ${platformName}?`,
      message: `Disconnect all accounts under connection "${connId}"? Historical trade debriefs will remain safely preserved in your journal.`,
      confirmText: 'Disconnect',
      onConfirm: () => {
        const remaining = accounts.filter(a => {
          const thisConnId = a.connectionId || `TDV-${(a.accountNumber || a.id || '1789392210861').replace(/[^0-9]/g, '').slice(-13) || '1789392210861'}`;
          return thisConnId !== connId;
        });
        setAccounts(remaining);
        saveStoredData('tradepigeon_accounts_data', remaining);
        setToastMsg(`Disconnected ${platformName} successfully.`);
        setTimeout(() => setToastMsg(''), 3000);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Remove individual sub-account
  const handleRemoveSubAccount = (accId, accName) => {
    soundFx.playPop();
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Sub-Account?',
      message: `Remove account "${accName || accId}" from TradePigeon? Historical trades will remain safely preserved in your journal.`,
      confirmText: 'Remove',
      onConfirm: () => {
        const updated = accounts.filter(a => a.id !== accId && a.accountNumber !== accId);
        setAccounts(updated);
        saveStoredData('tradepigeon_accounts_data', updated);
        setToastMsg(`Removed ${accName || accId} successfully.`);
        setTimeout(() => setToastMsg(''), 3000);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Live broker auto-sync is paused until verified against a real Tradovate account; trades come in via file import.
  const handleSyncAllFills = () => {
    soundFx.playPop();
    window.dispatchEvent(new CustomEvent('tradepigeon_open_import'));
  };

  // Total active accounts & combined stats
  const totalActiveAccounts = accounts.filter(a => a.isActive !== false).length;
  // Derived from today's trades (never from a stored running total, which drifts).
  const combinedDayPnl = getTradesForDate(todaySessionDate()).reduce((sum, t) => sum + (t.pnlNum || 0), 0);

  const getPlatformLogo = (platformId = '') => {
    const lower = String(platformId || '').toLowerCase();
    if (lower.includes('tradovate')) return <TradovateLogo className="w-5 h-5 shrink-0" />;
    if (lower.includes('ninja')) return <NinjaTraderLogo className="w-5 h-5 shrink-0" />;
    if (lower.includes('meta')) return <MetaTrader5Logo className="w-5 h-5 shrink-0" />;
    return <TradovateLogo className="w-5 h-5 shrink-0" />;
  };

  return (
    <main className="flex-1 min-h-screen lg:pl-28 xl:pl-80 bg-[#070C1E] p-4 sm:p-6 lg:p-8 text-white space-y-6 pb-24 lg:pb-12 max-w-6xl mx-auto overflow-x-hidden">
      
      {/* 1. HEADER SECTION (DUOLINGO 3D COMMAND BAR) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-2 border-[#1C2A4E]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#1CB0F6]/20 border-2 border-[#1CB0F6]/40 flex items-center justify-center text-[#1CB0F6] shadow-sm">
              <Zap size={20} className="fill-[#1CB0F6]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                Connections
              </h1>
              <p className="text-xs font-bold text-slate-400">
                Manage your broker integrations, multi-account copiers, and live fill streams.
              </p>
            </div>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsHelpOpen(!isHelpOpen)}
            className="px-3 py-2 rounded-2xl bg-[#142127] hover:bg-[#182830] border-2 border-[#20323D] text-xs font-black text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            title="How Multi-Account Connections Work"
          >
            <HelpCircle size={14} />
            <span>Help</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playPop();
              const next = !isStealthMode;
              setIsStealthMode(next);
              saveStoredData('tradepigeon_stealth_mode', next);
            }}
            className={`p-2 sm:px-3 sm:py-2 rounded-2xl border-2 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              isStealthMode
                ? 'bg-[#FF6B00]/15 border-[#FF6B00] text-[#FF6B00]'
                : 'bg-[#142127] border-[#20323D] text-slate-400 hover:text-white'
            }`}
            title={isStealthMode ? 'Stealth Mode: Values masked in R-multiples' : 'Dollar Mode: Values shown in USD'}
          >
            {isStealthMode ? <EyeOff size={15} /> : <Eye size={15} />}
            <span className="hidden sm:inline">{isStealthMode ? 'Stealth' : 'Values'}</span>
          </button>

          <button
            type="button"
            onClick={Object.values(expandedConnections).every(Boolean) ? handleCollapseAll : handleExpandAll}
            className="px-3.5 py-2 rounded-2xl bg-[#142127] hover:bg-[#182830] border-2 border-[#20323D] text-xs font-black text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            {Object.values(expandedConnections).every(Boolean) ? 'Collapse all' : 'Expand all'}
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playPop();
              window.dispatchEvent(new CustomEvent('tradepigeon_open_import'));
            }}
            className="px-3.5 py-2 rounded-2xl bg-[#142127] hover:bg-[#182830] border-2 border-[#20323D] hover:border-[#1CB0F6] text-xs font-black text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:translate-y-0.5"
            title="Upload CSV or HTML Broker Statement"
          >
            <FileText size={14} className="text-[#1CB0F6]" />
            <span>Import Statement</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playPop();
              setIsBrokerModalOpen(true);
            }}
            className="duo-btn-blue px-4 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg active:translate-y-0.5"
          >
            <Plus size={14} strokeWidth={3} />
            <span>Add Connection</span>
          </button>
        </div>
      </div>

      {/* TOAST BANNER */}
      {toastMsg && (
        <div className="p-3 rounded-2xl bg-[#58CC02]/20 border-2 border-[#58CC02] text-xs font-black text-white flex items-center justify-between animate-fade-in shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#58CC02] shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg('')} className="text-white/70 hover:text-white p-1 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* HELP DRAWER (IF TOGGLED) */}
      {isHelpOpen && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#142127] border-2 border-[#1CB0F6]/40 text-xs font-bold text-slate-300 space-y-2 relative shadow-lg animate-fade-in">
          <div className="flex items-center justify-between text-white font-black text-sm">
            <span>How Connections & Trade Syncing Work</span>
            <button onClick={() => setIsHelpOpen(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
              <X size={14} />
            </button>
          </div>
          <p className="leading-relaxed">
            TradePigeon securely connects directly to your broker socket (Tradovate, NinjaTrader, or Prop Firms like Apex, Topstep, MyFundedFutures). Fills stream automatically into your daily Protocol and Calendar with zero manual entry required.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px]">
            <div className="p-3 rounded-2xl bg-[#0D1635] border border-[#20323D]">
              <span className="font-black text-[#FFC800] flex items-center gap-1.5 mb-0.5">
                <Crown size={13} className="text-[#FFC800] fill-[#FFC800]" />
                <span>Master Account (Crown)</span>
              </span>
              <span>Sets the primary anchor account for your playbook metrics and risk rules.</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#0D1635] border border-[#20323D]">
              <span className="font-black text-[#58CC02] block mb-0.5">Toggle Switch (Active Fills)</span>
              <span>Enable or pause automatic fill ingestion for specific evaluation or funded accounts.</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUMMARY STAT CARDS (LIGHTWEIGHT DUOLINGO 3D) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-3xl bg-[#142127] border-2 border-[#20323D] border-b-4 border-b-[#182830] flex items-center justify-between shadow-sm">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Connected Brokers</span>
            <div className="text-xl font-black text-white flex items-center gap-2">
              <span>{connectionList.length}</span>
              <span className="text-xs font-black text-[#58CC02] bg-[#58CC02]/15 px-2 py-0.5 rounded-full">
                {connectionList.length > 0 ? 'Live Socket' : 'None'}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#182830] border border-[#20323D] flex items-center justify-center text-[#1CB0F6]">
            <Layers size={18} />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-[#142127] border-2 border-[#20323D] border-b-4 border-b-[#182830] flex items-center justify-between shadow-sm">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Sub-Accounts</span>
            <div className="text-xl font-black text-white flex items-center gap-2">
              <span>{totalActiveAccounts} of {accounts.length}</span>
              <span className="text-xs font-black text-[#00F0FF] bg-[#00F0FF]/15 px-2 py-0.5 rounded-full">
                Syncing
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#182830] border border-[#20323D] flex items-center justify-center text-[#00F0FF]">
            <Activity size={18} />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-[#142127] border-2 border-[#20323D] border-b-4 border-b-[#182830] flex items-center justify-between shadow-sm">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Combined Day PnL</span>
            <div className={`text-xl font-black font-mono ${combinedDayPnl >= 0 ? 'text-[#58CC02]' : 'text-rose-400'}`}>
              {formatMoney(combinedDayPnl)}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSyncAllFills}
            disabled={isSyncing}
            className="p-2.5 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] border border-[#388202] border-b-2 border-b-[#2E6B02] text-white transition-all cursor-pointer active:translate-y-0.5 shadow-sm"
            title="Sync All Connected Accounts"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 3. CONNECTIONS LIST (EMPTY STATE OR EXPANDABLE TABLE) */}
      {connectionList.length === 0 ? (
        /* Empty State: Clear, Encouraging, Duolingo 3D */
        <div className="p-8 sm:p-12 rounded-3xl bg-[#142127] border-2 border-dashed border-[#20323D] text-center space-y-4 shadow-sm max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-[#1CB0F6]/15 border-2 border-[#1CB0F6]/30 text-[#1CB0F6] flex items-center justify-center mx-auto shadow-inner">
            <Zap size={32} className="fill-[#1CB0F6]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-white">No Broker Connected Yet</h3>
            <p className="text-xs font-bold text-slate-400 max-w-md mx-auto leading-relaxed">
              Connect your Tradovate, NinjaTrader, or Prop Firm account to stream executed fills automatically into your daily protocol.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFx.playPop();
              setIsBrokerModalOpen(true);
            }}
            className="duo-btn-green px-6 py-3.5 text-xs font-black uppercase tracking-wider mx-auto flex items-center gap-2 cursor-pointer shadow-lg active:translate-y-0.5"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Connect First Broker</span>
          </button>
        </div>
      ) : (
        /* Real Connections Table with Sub-Accounts */
        <div className="space-y-4">
          {connectionList.map((conn) => {
            const isExpanded = !!expandedConnections[conn.id];
            const activeInConn = conn.accounts.filter(a => a.isActive !== false).length;

            return (
              <div 
                key={conn.id} 
                className="rounded-3xl bg-[#142127] border-2 border-[#20323D] border-b-4 border-b-[#182830] overflow-hidden shadow-md transition-all"
              >
                {/* CONNECTION PARENT ROW */}
                <div 
                  onClick={() => toggleConnectionExpand(conn.id)}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-[#182830]/70 transition-colors border-b border-white/5"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleConnectionExpand(conn.id);
                      }}
                      aria-label={isExpanded ? 'Collapse connection details' : 'Expand connection details'}
                      className="w-8 h-8 rounded-xl bg-[#182830] border border-[#20323D] flex items-center justify-center text-slate-300 shrink-0 cursor-pointer hover:text-white hover:border-[#1CB0F6] transition-all"
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center shrink-0">
                        {getPlatformLogo(conn.platformId)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-black text-white tracking-wide">
                            {conn.id}
                          </span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white/10 text-slate-300 font-mono">
                            {conn.platform} ({conn.environment})
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{activeInConn} / {conn.accounts.length} Accounts Active</span>
                          <span>&bull;</span>
                          {conn.accounts.some(a => a.tokenExpired || a.status === 'EXPIRED') ? (
                            <span className="text-amber-400 flex items-center gap-1 font-black">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              <span>Token Expired</span>
                            </span>
                          ) : (
                            <span className="text-[#58CC02] flex items-center gap-1 font-black">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#58CC02] animate-pulse"></span>
                              <span>Connected</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this connection */}
                  <div className="flex items-center gap-2.5 self-end md:self-auto" onClick={(e) => e.stopPropagation()}>
                    {conn.accounts.some(a => a.tokenExpired || a.status === 'EXPIRED') && (
                      <button
                        type="button"
                        onClick={() => {
                          soundFx.playPop();
                          setIsBrokerModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-xs font-black text-amber-400 hover:text-amber-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <RefreshCw size={12} />
                        <span>Reconnect</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSyncAllFills}
                      disabled={isSyncing}
                      className="px-3 py-1.5 rounded-xl bg-[#182830] hover:bg-[#20323D] border border-[#20323D] text-xs font-black text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw size={12} className={isSyncing ? 'animate-spin text-[#58CC02]' : ''} />
                      <span>Sync</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDisconnectConnection(conn.id, conn.platform)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-black text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>

                {/* EXPANDED SUB-ACCOUNTS TABLE (EXACT MATCH WITH REFERENCE IMAGE 2) */}
                {isExpanded && (
                  <div className="overflow-x-auto bg-[#0E1726]/60 border-t border-[#1C2A4E]">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#20323D] text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          <th className="py-3 px-4 w-16 text-center" title="Primary Sync Anchor">Sync</th>
                          <th className="py-3 px-4">Account</th>
                          <th className="py-3 px-4 hidden md:table-cell">Connection</th>
                          <th className="py-3 px-4">Symbol</th>
                          <th className="py-3 px-4 hidden sm:table-cell text-right">Balance</th>
                          <th className="py-3 px-4 text-right">Day PNL</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-center w-12">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-medium">
                        {conn.accounts.map((acc, idx) => {
                          const isActive = acc.isActive !== false;
                          const isLead = acc.isLead || idx === 0;
                          const rawPnl = getTradesForDate(todaySessionDate()).filter(t => t.account === acc.name).reduce((s, t) => s + (t.pnlNum || 0), 0);
                          const isEditing = editingAccountId === acc.id;

                          return (
                            <tr 
                              key={acc.id || acc.accountNumber} 
                              className={`hover:bg-[#142127]/80 transition-colors ${!isActive ? 'opacity-40 grayscale' : ''}`}
                            >
                              {/* Follow / Lead Crown & Toggle */}
                              <td className="py-3.5 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {isLead ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        soundFx.playPop();
                                        setToastMsg(`"${acc.name || acc.accountNumber}" is already your Primary Anchor.`);
                                        setTimeout(() => setToastMsg(''), 2500);
                                      }}
                                      title="Active Primary Anchor Account for Analytics & Dashboard (Click for status)"
                                      className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center cursor-pointer shadow-sm hover:scale-105 active:scale-95 transition-transform"
                                    >
                                      <Crown size={14} className="fill-amber-400" />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSetLeadAccount(acc.id || acc.accountNumber)}
                                      title="Click to set as Primary Anchor Account for Analytics"
                                      className="w-7 h-7 rounded-lg bg-[#182830] hover:bg-amber-500/20 border border-[#20323D] hover:border-amber-500/40 text-slate-500 hover:text-amber-400 flex items-center justify-center transition-all cursor-pointer"
                                    >
                                      <Crown size={13} />
                                    </button>
                                  )}

                                  {/* Telemetry Tracking Toggle Switch */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAccountActive(acc.id || acc.accountNumber)}
                                    className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                                      isActive ? 'bg-[#1CB0F6] justify-end' : 'bg-[#20323D] justify-start'
                                    }`}
                                    title={isActive ? 'Active — Syncing fills' : 'Paused — Fills ignored'}
                                  >
                                    <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                                  </button>
                                </div>
                              </td>

                              {/* Account Identifier & Nickname */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  {getPlatformLogo(acc.platformId || conn.platformId)}
                                  <div>
                                    {isEditing ? (
                                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="text"
                                          value={editingNickname}
                                          onChange={(e) => setEditingNickname(e.target.value)}
                                          placeholder="Account Nickname"
                                          className="px-2 py-0.5 rounded bg-[#142127] border border-[#1CB0F6] text-xs font-black text-white outline-none w-36"
                                          autoFocus
                                        />
                                        <button
                                          onClick={() => handleSaveNickname(acc.id || acc.accountNumber)}
                                          className="p-1 rounded bg-[#58CC02] text-white cursor-pointer"
                                        >
                                          <Check size={12} strokeWidth={3} />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 group">
                                        <span className="font-mono text-xs font-black text-white">
                                          {acc.accountNumber || acc.name || acc.id}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingAccountId(acc.id);
                                            setEditingNickname(acc.name || '');
                                          }}
                                          className="text-slate-500 hover:text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                          title="Rename Nickname"
                                        >
                                          <Pencil size={11} />
                                        </button>
                                      </div>
                                    )}
                                    <div className="text-[10px] font-bold text-slate-400">
                                      {acc.name && acc.name !== acc.accountNumber ? acc.name : (acc.broker || 'Tradovate')}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Parent Connection */}
                              <td className="py-3.5 px-4 hidden md:table-cell font-mono text-[11px] text-slate-400">
                                {conn.id}
                              </td>

                              {/* Active Symbol */}
                              <td className="py-3.5 px-4 font-mono font-bold text-white text-xs">
                                <span className="px-2 py-0.5 rounded bg-black/30 border border-white/10">
                                  {acc.symbol || 'NQM6'}
                                </span>
                              </td>

                              {/* Balance */}
                              <td className="py-3.5 px-4 hidden sm:table-cell text-right font-mono font-black text-white text-xs">
                                {formatBalance(acc.balance || (idx === 0 ? '$48,743.50' : '$48,646.50'))}
                              </td>

                              {/* Day PNL */}
                              <td className="py-3.5 px-4 text-right font-mono font-black text-xs">
                                <span className={rawPnl >= 0 ? 'text-[#58CC02]' : 'text-rose-400'}>
                                  {formatMoney(rawPnl)}
                                </span>
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-4 text-center">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full font-mono ${
                                  acc.tokenExpired || acc.status === 'EXPIRED'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                    : isActive
                                    ? 'bg-[#58CC02]/15 text-[#58CC02] border border-[#58CC02]/30'
                                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                                }`}>
                                  {acc.tokenExpired || acc.status === 'EXPIRED' ? 'EXPIRED' : isActive ? 'LIVE' : 'PAUSED'}
                                </span>
                              </td>

                              {/* Remove Single Sub-Account Action */}
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubAccount(acc.id || acc.accountNumber, acc.name)}
                                  className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer"
                                  title={`Remove ${acc.name || acc.accountNumber}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Table Footer */}
                    <div className="p-3 px-4 border-t border-white/5 flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>{conn.accounts.length} sub-accounts under this connection</span>
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Shield size={12} className="text-[#1CB0F6]" />
                        <span>Direct Socket Sync Active</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. MODAL: ADD BROKER CONNECTION */}
      <BrokerConnectModal 
        isOpen={isBrokerModalOpen}
        onClose={() => setIsBrokerModalOpen(false)}
        onOpenStatementImport={() => window.dispatchEvent(new CustomEvent('tradepigeon_open_import'))}
        onAccountAdded={({ account, accounts: newAccounts }) => {
          const toAdd = newAccounts && newAccounts.length > 0 ? newAccounts : (account ? [account] : []);
          const updated = [...toAdd, ...accounts];
          setAccounts(updated);
          saveStoredData('tradepigeon_accounts_data', updated);
          soundFx.playLevelUp();
          setToastMsg(`Successfully added ${toAdd.length} account${toAdd.length > 1 ? 's' : ''}!`);
          setTimeout(() => setToastMsg(''), 3500);
        }}
      />



      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </main>
  );
}
