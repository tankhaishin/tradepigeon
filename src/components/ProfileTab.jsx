import React, { useState, useEffect, useRef } from 'react';
import { isProActive, startCheckout, openBillingPortal } from '../utils/proStatus';
import { getTrades, onTradesChange, setDayTrades, todaySessionDate } from '../utils/tradeStore';
import { deleteMyAccount } from '../utils/accountDeletion';
import { computeSubscriptionEntitlement } from '../utils/subscriptionEngine';
import { User, Flame, Gem, Heart, Calendar, ShieldCheck, Award, TrendingUp, CheckCircle2, AlertCircle, Cpu, RefreshCw, BarChart3, Activity, Sparkles, Trash2, RotateCcw, ShieldAlert, CheckSquare, Square, X, Download, Upload, FileText, Check, LogOut, CreditCard, Mail, ExternalLink, AlertTriangle, Volume2, VolumeX, HardDrive, Database } from 'lucide-react';
import { DuoShieldIcon, DuoLightningIcon, DuoChestIcon, DuoProfileIcon, DuoTrophyIcon } from './DuoIcons';
import GoogleAuthButton from './GoogleAuthButton';
import MobileAlertSettings from './MobileAlertSettings';
import ConfirmModal from './ConfirmModal';
import { soundFx } from '../utils/audioEngine';
import { useAuth } from '../context/AuthContext';
import { 
  loadStoredData, 
  saveStoredData, 
  subscribeToStorageUpdate, 
  DEFAULT_USER_STATS, 
  factoryResetCleanSlate,
  exportFullBackup,
  exportTradesCsv,
  importFullBackup,
  wipeAccountTrades,
  getAllStoredTrades,
  getStorageUsage,
  safeRemoveItem
} from '../utils/storage';
import { formatFinancialCurrency, sumTradesPnl, parseFinancialNumber } from '../utils/financialMath';

export default function ProfileTab() {
  const { user, signOutUser } = useAuth();
  const [googleUser, setGoogleUser] = useState(() => loadStoredData('tradepigeon_auth_user', null) || loadStoredData('tradepigeon_google_user', null));
  const [entitlement, setEntitlement] = useState(() => computeSubscriptionEntitlement(user));
  const [isPro, setIsPro] = useState(() => entitlement?.isPro);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('DEBRIEF_HISTORY');
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [isDunning, setIsDunning] = useState(() => loadStoredData('tradepigeon_dunning_status', false));
  const [emailBriefingPref, setEmailBriefingPref] = useState(() => loadStoredData('tradepigeon_pref_daily_email', true));
  const [emailRiskPref, setEmailRiskPref] = useState(() => loadStoredData('tradepigeon_pref_risk_email', true));
  const [profileToast, setProfileToast] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [keepBrokersOnReset, setKeepBrokersOnReset] = useState(true);

  // Audio & Haptic preferences
  const [isSoundMuted, setIsSoundMuted] = useState(() => soundFx.isMuted);

  // Storage utilization & Quota
  const [storageUsage, setStorageUsage] = useState(() => getStorageUsage());

  useEffect(() => {
    const handleSubUpdate = () => {
      const e = computeSubscriptionEntitlement(user);
      setEntitlement(e);
      setIsPro(e.isPro);
    };
    window.addEventListener('tradepigeon_subscription_updated', handleSubUpdate);
    return () => window.removeEventListener('tradepigeon_subscription_updated', handleSubUpdate);
  }, [user]);

  useEffect(() => {
    const handleSoundToggle = (e) => {
      if (e?.detail) {
        setIsSoundMuted(Boolean(e.detail.isMuted));
      }
    };
    window.addEventListener('tradepigeon_sound_toggled', handleSoundToggle);
    return () => window.removeEventListener('tradepigeon_sound_toggled', handleSoundToggle);
  }, []);

  useEffect(() => {
    if (activeSubTab === 'RESET_ZONE') {
      setStorageUsage(getStorageUsage());
    }
  }, [activeSubTab]);

  // Risk Calibration
  const [maxDailyLoss, setMaxDailyLoss] = useState(() => loadStoredData('tradepigeon_max_daily_loss', '$1,000'));
  const [customLossInput, setCustomLossInput] = useState('');
  const [isStealthMode, setIsStealthMode] = useState(() => loadStoredData('tradepigeon_stealth_mode', false));

  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdate(({ key, value }) => {
      if (key === 'tradepigeon_max_daily_loss') setMaxDailyLoss(value || '$1,000');
      if (key === 'tradepigeon_stealth_mode') setIsStealthMode(Boolean(value));
      if (key === 'tradepigeon_sound_muted') setIsSoundMuted(value === 'true' || value === true);
    });
    return () => unsubscribe();
  }, []);

  const handleSetMaxDailyLoss = (val) => {
    soundFx.playPop();
    const num = Math.abs(parseFinancialNumber(val, 1000));
    const formatted = `$${num.toLocaleString()}`;
    setMaxDailyLoss(formatted);
    saveStoredData('tradepigeon_max_daily_loss', formatted);
    triggerToast(`Max Daily Loss updated to ${formatted}`);
  };

  const handleToggleStealthMode = () => {
    soundFx.playPop();
    const next = !isStealthMode;
    setIsStealthMode(next);
    saveStoredData('tradepigeon_stealth_mode', next);
    triggerToast(next ? 'Stealth Mode Activated (R-Multiples)' : 'Stealth Mode Deactivated (Dollar PnL)');
  };
  
  // Account Specific Wipe / Disconnect modal
  const [accountActionTarget, setAccountActionTarget] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isResetModalOpen) setIsResetModalOpen(false);
        if (accountActionTarget) setAccountActionTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isResetModalOpen, accountActionTarget]);

  const triggerToast = (msg) => {
    soundFx.playPop();
    setProfileToast(msg);
    setTimeout(() => setProfileToast(''), 3500);
  };

  const handleExportBackup = () => {
    soundFx.playSuccess();
    exportFullBackup();
    triggerToast('Journal backup downloaded (JSON)');
  };

  const handleTriggerFileImport = () => {
    soundFx.playPop();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const res = importFullBackup(text);
        if (res.success) {
          soundFx.playSuccess();
          triggerToast(`Restored ${res.count} items! Reloading...`);
          setTimeout(() => window.location.reload(), 1200);
        } else {
          soundFx.playPop();
          triggerToast(res.error || 'Failed to import backup');
        }
      } catch (err) {
        triggerToast('Corrupted JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleWipeTodayTrades = () => {
    soundFx.playPop();
    setDayTrades(todaySessionDate(), []);
    triggerToast("Today's trades cleared.");
  };

  const handleExecuteFactoryReset = async () => {
    if (resetConfirmText.trim().toUpperCase() !== 'RESET') return;
    soundFx.playSuccess();
    await factoryResetCleanSlate({ keepBrokerAccounts: keepBrokersOnReset });
  };

  const handleExportCsv = async () => {
    soundFx.playSuccess();
    const res = await exportTradesCsv();
    if (res && res.success === false) {
      triggerToast(res.error || 'No trades found to export.');
    } else {
      triggerToast('Trades exported (CSV)');
    }
  };

  const handleStripeCheckout = async () => {
    soundFx.playPop();
    setIsProcessingStripe(true);
    try {
      await startCheckout('monthly', user?.email || googleUser?.email, user?.uid || googleUser?.id);
    } catch (err) {
      triggerToast(err.message);
      setIsProcessingStripe(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    soundFx.playPop();
    setIsOpeningPortal(true);
    try {
      await openBillingPortal(user?.email || googleUser?.email, entitlement?.customerId);
    } catch (err) {
      triggerToast(err.message);
      setIsOpeningPortal(false);
    }
  };

  const handleSignOut = () => {
    soundFx.playPop();
    setIsLogoutModalOpen(true);
  };

  const handleConfirmSignOut = async () => {
    setIsLogoutModalOpen(false);
    try {
      await signOutUser();
    } catch (err) {
      console.warn('[Sign Out Error]:', err);
    }
    saveStoredData('tradepigeon_auth_user', null);
    saveStoredData('tradepigeon_google_user', null);
    setGoogleUser(null);
    triggerToast('Signed out of TradePigeon');
  };

  // VERIFIED TRADING EDGE LOG (Loaded from Storage with clean zero-state and live reactivity)
  const [historicalLogs, setHistoricalLogs] = useState(() => loadStoredData('tradepigeon_debrief_history', []));

  // Connected Auto-Synced Trading Accounts (Loaded from Storage with clean zero-state)
  const [connectedAccounts, setConnectedAccounts] = useState(() => loadStoredData('tradepigeon_accounts_data', []));

  // Live User Stats, Discipline Points, and Stored Trades from Storage (with reactive state)
  const [userStats, setUserStats] = useState(() => loadStoredData('tradepigeon_user_stats', DEFAULT_USER_STATS));
  const [userDp, setUserDp] = useState(() => loadStoredData('tradepigeon_user_dp', 0));
  const [storedTrades, setStoredTrades] = useState(() => getTrades());
  useEffect(() => onTradesChange(() => setStoredTrades(getTrades())), []);

  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdate(({ key, legacyKey, value }) => {
      if (key === 'tradepigeon_auth_user' || key === 'tradepigeon_google_user' || legacyKey === 'tradepigeon_google_user') {
        setGoogleUser(value);
      }
      if (key === 'tradepigeon_accounts_data') {
        setConnectedAccounts(value || []);
      }
      if (key === 'tradepigeon_debrief_history') {
        setHistoricalLogs(value || []);
      }
      if (key === 'tradepigeon_is_pro') {
        setIsPro(Boolean(value));
      }
      if (key === 'tradepigeon_user_stats') {
        setUserStats(value || DEFAULT_USER_STATS);
      }
      if (key === 'tradepigeon_user_dp') {
        setUserDp(Number(value) || 0);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleDisconnectAccount = (accountId) => {
    soundFx.playPop();
    const updated = connectedAccounts.filter((a) => a.id !== accountId && a.name !== accountId);
    setConnectedAccounts(updated);
    saveStoredData('tradepigeon_accounts_data', updated);
    triggerToast('Account disconnected successfully');
  };

  const handleExecuteAccountAction = (action) => {
    if (!accountActionTarget) return;
    const acc = accountActionTarget;
    soundFx.playPop();

    if (action === 'DISCONNECT_KEEP_TRADES') {
      const updated = connectedAccounts.filter((a) => a.id !== acc.id && a.name !== acc.name);
      setConnectedAccounts(updated);
      saveStoredData('tradepigeon_accounts_data', updated);
      triggerToast(`Disconnected ${acc.name}. Historical trades preserved.`);
    } else if (action === 'WIPE_TRADES_KEEP_ACCOUNT') {
      const wipedCount = wipeAccountTrades(acc.name || acc.id);
      triggerToast(`Wiped ${wipedCount} trades for ${acc.name}. Account remains active.`);
    } else if (action === 'DISCONNECT_AND_PURGE') {
      const wipedCount = wipeAccountTrades(acc.name || acc.id);
      const updated = connectedAccounts.filter((a) => a.id !== acc.id && a.name !== acc.name);
      setConnectedAccounts(updated);
      saveStoredData('tradepigeon_accounts_data', updated);
      triggerToast(`Disconnected ${acc.name} & purged ${wipedCount} trades.`);
    }
    setAccountActionTarget(null);
  };

  const handleClearAllAccounts = () => {
    soundFx.playPop();
    setConnectedAccounts([]);
    saveStoredData('tradepigeon_accounts_data', []);
    triggerToast('All connected accounts cleared');
  };

  const activeUser = user || googleUser;

  return (
    <main className="flex-1 min-h-screen lg:pl-28 xl:pl-80 xl:pr-[416px] bg-[#070C1E] p-4 sm:p-6 lg:p-8 text-white space-y-8 pb-24 lg:pb-10 max-w-full overflow-hidden">
      
      {/* 1. TOP HEADER: PURE FLOATING DUOLINGO HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {activeUser?.picture ? (
            <img 
              src={activeUser.picture} 
              alt={activeUser.name || 'Trader'} 
              className="w-11 h-11 rounded-2xl object-cover border-2 border-[#FF6B00] shadow-md shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-[#0D1635] border-2 border-[#FF6B00] flex items-center justify-center shrink-0">
              <User size={22} className="text-[#FF6B00]" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white">{activeUser?.name || 'Trader'}</h2>
              <span className={`px-2.5 py-0.5 rounded-lg text-white text-[10px] font-black uppercase ${
                entitlement?.plan === 'PRO'
                  ? 'bg-[#FF6B00] border border-[#C2410C]'
                  : entitlement?.isTrial
                  ? 'bg-[#58CC02] border border-[#388202]'
                  : 'bg-rose-600 border border-rose-800'
              }`}>
                {entitlement?.badgeText || (isPro ? 'PRO SUBSCRIBER' : 'FREE PLAN')}
              </span>
            </div>
            {activeUser?.email && (
              <div className="text-xs font-bold text-slate-400">{activeUser.email}</div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <GoogleAuthButton className="py-2.5 text-xs" buttonText="Google Identity" />
          {entitlement?.plan === 'PRO' ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#58CC02]/20 border-2 border-[#58CC02] border-b-4 border-b-[#388202] text-xs font-black text-white shadow-md">
                <CheckCircle2 size={15} className="text-[#58CC02]" />
                <span>PRO ACTIVE</span>
              </div>
              <button
                type="button"
                onClick={handleOpenBillingPortal}
                disabled={isOpeningPortal}
                className="duo-btn-blue px-3.5 py-2 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <CreditCard size={14} />
                <span>{isOpeningPortal ? 'Connecting...' : 'Manage Billing'}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleStripeCheckout}
              disabled={isProcessingStripe}
              className="duo-btn-orange px-4 py-2.5 text-xs flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              <span>{isProcessingStripe ? 'Connecting Stripe...' : 'Upgrade to Pro ($9.99/mo)'}</span>
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="px-3.5 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border-2 border-rose-500/30 hover:border-rose-500 border-b-4 border-b-rose-700/60 text-xs font-black text-rose-400 hover:text-rose-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:translate-y-0.5"
            title="Log Out of TradePigeon"
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Involuntary Churn / Dunning Warning Alert */}
      {isDunning && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border-2 border-amber-500/60 flex items-center justify-between gap-4 animate-fade-in text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="text-xs font-black text-amber-300 uppercase tracking-wider">Payment Action Required</div>
              <div className="text-xs font-bold text-slate-300">Your latest Pro subscription renewal failed. Update your card to keep broker sync active.</div>
            </div>
          </div>
          <button
            onClick={handleOpenBillingPortal}
            className="duo-btn-orange px-4 py-2 text-xs font-black uppercase tracking-wider shrink-0 cursor-pointer"
          >
            Update Card &rarr;
          </button>
        </div>
      )}

      {/* Core Stats Hero Card */}
      <div className="duo-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-white">Trader Overview</h3>
          <span className="text-xs font-black text-[#58CC02] bg-[#58CC02]/15 px-3 py-1 rounded-xl border border-[#58CC02]/30">PROP MASTER</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 pt-2">
          <div className="shrink-0">
            <DuoProfileIcon className="w-20 h-20 sm:w-24 sm:h-24 filter drop-shadow-xl" />
          </div>

          <div className="flex-1 w-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-black text-white">Discipline Streak</span>
              <span className="text-xl sm:text-2xl font-black text-[#FF6B00]">{userStats.streakDays || 0} Days</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-base font-black text-white">DP Gems</span>
              <span className="text-xl sm:text-2xl font-black text-[#1CB0F6]">{userDp || 0}</span>
            </div>

            {(() => {
              const totalTradesCount = storedTrades.length;
              const followedTradesCount = totalTradesCount > 0
                ? storedTrades.filter(t => t.followedRules !== false && !t.violated && !t.violatedRules).length
                : (userStats.tradesLogged || 0);

              const planAdherenceStr = totalTradesCount > 0
                ? `${Math.round((followedTradesCount / totalTradesCount) * 100)}%`
                : '100%';

              const winsCount = storedTrades.filter(t => (t.pnlNum !== undefined ? t.pnlNum : parseFinancialNumber(t.pnl, 0)) > 0).length;
              const winRateStr = totalTradesCount > 0 ? `${Math.round((winsCount / totalTradesCount) * 100)}%` : '0%';
              const totalRealizedPnl = sumTradesPnl(storedTrades);

              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-white">Net Realized PnL</span>
                    <span className={`text-xl sm:text-2xl font-black font-mono ${totalRealizedPnl >= 0 ? 'text-[#58CC02]' : 'text-rose-400'}`}>
                      {formatFinancialCurrency(totalRealizedPnl, { showPlus: true })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-white">Win Rate</span>
                    <span className="text-xl sm:text-2xl font-black font-mono text-[#1CB0F6]">{winRateStr}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-white">Disciplined Trades</span>
                    <span className="text-xl sm:text-2xl font-black text-[#58CC02]">{followedTradesCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-white">Plan Adherence</span>
                    <span className="text-xl sm:text-2xl font-black text-[#58CC02]">{planAdherenceStr}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS (SESSION DEBRIEF HISTORY / ACCOUNTS / RISK RULES / RESET) */}
      <div className="flex items-center gap-2.5 border-b-2 border-[#20323D] pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('DEBRIEF_HISTORY')}
          className={`px-4 sm:px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'DEBRIEF_HISTORY'
              ? 'duo-btn-blue'
              : 'duo-btn-dark'
          }`}
        >
          Session Debrief History
        </button>
        <button
          onClick={() => setActiveSubTab('ACCOUNTS')}
          className={`px-4 sm:px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'ACCOUNTS'
              ? 'duo-btn-blue'
              : 'duo-btn-dark'
          }`}
        >
          Connected Broker Accounts
        </button>
        <button
          onClick={() => setActiveSubTab('RISK_RULES')}
          className={`px-4 sm:px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeSubTab === 'RISK_RULES'
              ? 'duo-btn-green'
              : 'duo-btn-dark'
          }`}
        >
          <ShieldAlert size={14} />
          <span>Risk & Drawdown Rules</span>
        </button>
        <button
          onClick={() => setActiveSubTab('RESET_ZONE')}
          className={`px-4 sm:px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeSubTab === 'RESET_ZONE'
              ? 'duo-btn-orange !bg-rose-600 !border-rose-700'
              : 'duo-btn-dark hover:text-rose-400'
          }`}
        >
          <RotateCcw size={13} />
          <span>Clean Slate & Reset</span>
        </button>
      </div>

      {/* SUB-TAB 2: DEBRIEF HISTORY */}
      {activeSubTab === 'DEBRIEF_HISTORY' && (
        <div className="duo-card p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#20323D]">
            <h3 className="text-base font-black text-white">Session Accountability Log</h3>
            <span className="text-xs font-bold text-[#52656D]">{historicalLogs.length} Recent Debrief Audits</span>
          </div>

          {historicalLogs.length === 0 ? (
            <div className="p-8 text-center space-y-2 bg-[#182830]/50 rounded-2xl border border-[#20323D]">
              <div className="text-sm font-black text-slate-300">No Debrief Audits Yet</div>
              <p className="text-xs font-bold text-[#52656D]">Log your first trade in the Session Cockpit to generate your execution grade!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historicalLogs.map((item, idx) => {
                const gradeStr = String(item.grade || 'A');
                let badgeStyle = 'bg-[#58CC02] text-white border-[#46A302] border-b-4 border-b-[#388202]';
                if (gradeStr.startsWith('B')) {
                  badgeStyle = 'bg-[#1CB0F6] text-white border-[#1899D6] border-b-4 border-b-[#147BB0]';
                } else if (gradeStr.startsWith('C')) {
                  badgeStyle = 'bg-amber-500 text-slate-950 border-amber-600 border-b-4 border-b-amber-700';
                } else if (gradeStr.startsWith('F')) {
                  badgeStyle = 'bg-[#FF4B4B] text-white border-[#E53935] border-b-4 border-b-[#C62828]';
                }

                const pnlStr = String(item.pnl || '$0.00');
                const isPositive = pnlStr.startsWith('+');
                const isNegative = pnlStr.startsWith('-');

                return (
                  <div key={item.id || idx} className="p-4 rounded-2xl bg-[#182830] border-2 border-[#2B3D47] border-b-4 border-b-[#142127] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 border-2 shadow-sm ${badgeStyle}`}>
                        {item.grade || 'A+'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-black text-white truncate">
                          {item.date} &bull; <span className="text-[#1CB0F6]">{item.setup || 'Daily Execution'}</span>
                        </div>
                        <div className="text-xs font-bold text-[#52656D] mt-0.5">
                          {item.score || 'Score: 100/100'} &bull; Mindset: {item.mood || 'Disciplined'}
                        </div>
                        {item.notes && (
                          <div className="text-xs italic text-slate-300 mt-1 line-clamp-1">
                            "{item.notes}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-sm font-black ${isPositive ? 'text-[#58CC02]' : isNegative ? 'text-rose-400' : 'text-slate-300'}`}>
                        {item.pnl || '$0.00'}
                      </div>
                      <div className="text-[10px] font-black uppercase text-slate-400 mt-0.5">{item.status || 'COMPLIANT'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: ACCOUNTS */}
      {activeSubTab === 'ACCOUNTS' && (
        <div className="duo-card p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#20323D]">
            <h3 className="text-base font-black text-white">Auto-Synced Broker & Prop Accounts</h3>
            <div className="flex items-center gap-2">
              {connectedAccounts.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllAccounts}
                  className="text-xs font-black text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-3 py-1 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Purge all dummy/unauthenticated accounts"
                >
                  <Trash2 size={12} />
                  <span>Clear All Accounts</span>
                </button>
              )}
              <span className="text-xs font-black text-white bg-[#58CC02] border-2 border-[#46A302] border-b-4 border-b-[#388202] px-3 py-1 rounded-xl">
                {connectedAccounts.length} LIVE CONNECTIONS
              </span>
            </div>
          </div>

          {connectedAccounts.length === 0 ? (
            <div className="p-8 text-center space-y-2 bg-[#182830]/50 rounded-2xl border border-[#20323D]">
              <div className="text-sm font-black text-slate-300">No Connected Accounts</div>
              <p className="text-xs font-bold text-[#52656D]">Import a statement CSV or connect your prop account to track daily loss limits.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {connectedAccounts.map((acc, idx) => (
                <div key={acc.id || idx} className="p-5 rounded-2xl bg-[#182830] border-2 border-[#2B3D47] border-b-4 border-b-[#142127] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-white bg-[#58CC02] border border-[#46A302] px-2 py-0.5 rounded-md">{acc.status}</span>
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playPop();
                        setAccountActionTarget(acc);
                      }}
                      className="text-xs font-black text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
                      title="Manage, wipe trades, or disconnect this account"
                    >
                      <Trash2 size={12} />
                      <span>Manage / Disconnect</span>
                    </button>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-white">{acc.name}</h4>
                    <div className="text-xl font-black text-[#1CB0F6] mt-1">{acc.balance}</div>
                  </div>

                  <div className="pt-2 border-t border-[#20323D] space-y-1 text-xs font-bold">
                    <div className="flex justify-between text-[#52656D]">
                      <span>Max Daily Loss Limit:</span>
                      <span className="text-white font-black">{acc.maxDailyDrawdown}</span>
                    </div>
                    <div className="flex justify-between text-[#52656D]">
                      <span>Current Session Drawdown:</span>
                      <span className="text-rose-400 font-black">{acc.currentDrawdown}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MOBILE PHONE PUSH NOTIFICATION SETTINGS */}
          <div className="pt-4 space-y-4">
            <MobileAlertSettings />

            {/* EMAIL RETENTION & PERFORMANCE BRIEFING SETTINGS */}
            <div className="duo-card p-6 space-y-4 border-2 border-[#20323D]">
              <div className="flex items-center justify-between pb-3 border-b border-[#20323D]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1CB0F6]/15 border border-[#1CB0F6]/30 text-[#1CB0F6] flex items-center justify-center">
                    <Mail size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Email Digest &amp; Risk Telemetry</h3>
                    <p className="text-[10px] font-bold text-slate-400">Automated post-market debriefs and emergency liquidation alerts</p>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[#1CB0F6]/15 text-[#1CB0F6] border border-[#1CB0F6]/30">
                  ACTIVE PIPELINE
                </span>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#142127] border border-[#20323D] cursor-pointer">
                  <div className="pr-4">
                    <div className="text-xs font-black text-white">Daily Post-Market Discipline Debrief</div>
                    <div className="text-[10px] font-bold text-slate-400">Receive your execution grade, net PnL, and rule adherence card at 17:00 EST.</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={emailBriefingPref} 
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEmailBriefingPref(checked);
                      saveStoredData('tradepigeon_pref_daily_email', checked);
                      triggerToast(`Daily Briefing ${checked ? 'enabled' : 'disabled'}`);
                    }}
                    className="w-4 h-4 rounded text-[#58CC02] focus:ring-0 cursor-pointer shrink-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#142127] border border-[#20323D] cursor-pointer">
                  <div className="pr-4">
                    <div className="text-xs font-black text-white">Emergency Risk Breach Alerts</div>
                    <div className="text-[10px] font-bold text-slate-400">Instant high-priority notification if daily loss limit or trailing buffer is reached.</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={emailRiskPref} 
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEmailRiskPref(checked);
                      saveStoredData('tradepigeon_pref_risk_email', checked);
                      triggerToast(`Risk Alert ${checked ? 'enabled' : 'disabled'}`);
                    }}
                    className="w-4 h-4 rounded text-[#58CC02] focus:ring-0 cursor-pointer shrink-0"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: RISK & DRAWDOWN RULES */}
      {activeSubTab === 'RISK_RULES' && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Card 1: Max Daily Loss Limit */}
          <div className="duo-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#20323D]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Daily Loss Circuit Breaker</h3>
                  <p className="text-xs font-bold text-[#52656D]">Hard stop limit per trading session</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono font-black text-sm">
                {maxDailyLoss}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When your session net loss hits this circuit breaker, trades automatically fail process rules (Double Failure) and your session triggers lockout mode.
            </p>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Quick Presets:</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[500, 1000, 1500, 2000, 2500, 3000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSetMaxDailyLoss(amt)}
                    className={`py-2 px-1 rounded-xl border text-xs font-mono font-black cursor-pointer transition-all ${
                      Math.abs(parseFinancialNumber(maxDailyLoss, 1000)) === amt
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                        : 'bg-[#182830] border-[#20323D] text-slate-400 hover:text-white hover:border-slate-500'
                    }`}
                  >
                    ${amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Custom limit (e.g. $1,250)"
                value={customLossInput}
                onChange={(e) => setCustomLossInput(e.target.value)}
                className="duo-input text-xs w-48"
              />
              <button
                type="button"
                onClick={() => {
                  if (customLossInput.trim()) {
                    handleSetMaxDailyLoss(customLossInput);
                    setCustomLossInput('');
                  }
                }}
                className="duo-btn-green px-4 py-2 text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Save Limit
              </button>
            </div>
          </div>

          {/* Card 2: Psychology Shield & Stealth Mode */}
          <div className="duo-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#20323D]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#58CC02]/20 border border-[#58CC02]/40 text-[#58CC02] flex items-center justify-center">
                  <Activity size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Stealth Mode (Psychology Shield)</h3>
                  <p className="text-xs font-bold text-[#52656D]">Display R-Multiples instead of dollar PnL</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleStealthMode}
                className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${
                  isStealthMode
                    ? 'bg-[#58CC02] text-white border-[#46A302] shadow-sm'
                    : 'bg-[#182830] border-[#20323D] text-slate-400 hover:text-white'
                }`}
              >
                {isStealthMode ? 'ACTIVE (R-Multiples)' : 'DISABLED (Dollar PnL)'}
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When Stealth Mode is enabled, the Cockpit and trade logs mask raw dollar amounts into R-Multiples (+2.4 R, -1.0 R) to shield your emotional psychology from dollar attachment during active trading sessions.
            </p>
          </div>

          {/* Card 4: Sound Effects & Haptic Audio */}
          <div className="duo-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#20323D]">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  !isSoundMuted 
                    ? 'bg-[#58CC02]/20 border-[#58CC02]/40 text-[#58CC02]' 
                    : 'bg-slate-700/20 border-slate-600/40 text-slate-400'
                }`}>
                  {!isSoundMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Sound Effects & Haptics</h3>
                  <p className="text-xs font-bold text-[#52656D]">Interactive feedback for trades, debriefs, and level-ups</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isSoundMuted && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playPop();
                      triggerToast('Testing audio chime 🎵');
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-[#20323D] bg-[#182830] text-[10px] font-black uppercase text-slate-300 hover:text-white hover:border-[#1CB0F6] transition-all cursor-pointer"
                  >
                    Test Chime
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const nextMuted = soundFx.toggleMute();
                    setIsSoundMuted(nextMuted);
                    triggerToast(nextMuted ? 'Sound Effects Muted (Silent Mode)' : 'Sound Effects Active 🔊');
                    if (!nextMuted) soundFx.playSuccess();
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${
                    !isSoundMuted
                      ? 'bg-[#58CC02] text-white border-[#46A302] shadow-sm'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  }`}
                >
                  {!isSoundMuted ? 'ACTIVE (Audio ON)' : 'MUTED (Silent Mode)'}
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Enable or silence audible process chimes, daily streak fanfare, and tactile haptic vibration pulses. Ideal for traders operating in voice rooms or squawk calls.
            </p>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CLEAN SLATE & RESET ZONE */}
      {activeSubTab === 'RESET_ZONE' && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Card 0: Browser Storage Headroom & Cloud Sync Health */}
          <div className="duo-card p-6 space-y-4 border-2 border-emerald-500/30 bg-emerald-500/5">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#58CC02]/20 border border-[#58CC02]/40 text-[#58CC02] flex items-center justify-center">
                  <HardDrive size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Browser Storage Headroom & Cloud Sync</h3>
                  <p className="text-xs font-bold text-[#52656D]">Real-time database footprint and cloud backup status</p>
                </div>
              </div>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                storageUsage.isNearQuota
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-[#58CC02]/20 text-[#58CC02] border-[#58CC02]/30'
              }`}>
                {storageUsage.isNearQuota ? 'NEAR QUOTA (CLEANUP RECOMMENDED)' : 'HEALTHY HEADROOM (OPTIMAL)'}
              </span>
            </div>

            {/* Storage Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Database size={13} className="text-[#1CB0F6]" />
                  <span>Local Storage Footprint</span>
                </span>
                <span className="font-mono text-slate-200">
                  <strong className="text-white">{storageUsage.kbUsed} KB</strong> / 5,120 KB used ({storageUsage.percentUsed}%)
                </span>
              </div>
              <div className="w-full h-3 bg-[#101C24] rounded-full overflow-hidden border border-[#20323D]">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    storageUsage.percentUsed > 80 
                      ? 'bg-rose-500' 
                      : storageUsage.percentUsed > 50 
                        ? 'bg-amber-400' 
                        : 'bg-[#58CC02]'
                  }`}
                  style={{ width: `${Math.max(2, storageUsage.percentUsed)}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-2 h-2 rounded-full bg-[#58CC02] animate-pulse" />
                <span className="text-[11px] font-bold text-slate-300">Dual-Tier Firestore Cloud Sync Active & Encrypted</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStorageUsage(getStorageUsage());
                  triggerToast('Storage headroom meter refreshed');
                }}
                className="text-[11px] font-black uppercase text-[#1CB0F6] hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw size={11} />
                <span>Refresh Meter</span>
              </button>
            </div>
          </div>

          {/* Card 1: Full Journal Backup & Restore */}
          <div className="duo-card p-6 space-y-4 border-2 border-sky-500/30 bg-sky-500/5">
            <div className="flex items-center justify-between pb-3 border-b border-sky-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1CB0F6]/20 border border-[#1CB0F6]/40 text-[#1CB0F6] flex items-center justify-center">
                  <Download size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Full Journal Backup & Restore</h3>
                </div>
              </div>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-sky-500/20 text-[#1CB0F6] border border-sky-500/30">
                JSON PORTABILITY
              </span>
            </div>

            <p className="text-xs font-bold text-slate-300 leading-relaxed">
              Never worry about losing your journal. Export a clean JSON snapshot of your entire trading database before resetting, or restore from a previously exported backup file anytime.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="duo-btn-blue px-4 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Download size={14} />
                <span>Export Full Backup (JSON)</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="duo-btn-dark px-4 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer hover:border-[#58CC02] hover:text-[#58CC02] shadow-md"
              >
                <FileText size={14} />
                <span>Export Trades (CSV)</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerFileImport}
                className="duo-btn-dark px-4 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer hover:border-sky-500 hover:text-sky-300"
              >
                <Upload size={14} />
                <span>Restore from Backup</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Card 1: Wipe Today's Session */}
          <div className="duo-card p-6 space-y-4 border-2 border-[#20323D]">
            <div className="flex items-center justify-between pb-3 border-b border-[#20323D]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <RotateCcw size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Reset Today's Session Trades</h3>
                </div>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-300 leading-relaxed">
              If your broker synced test fills or you want to start today's trading journal over, this clears all trades logged for today and resets today's net PnL back to $0.00. Your historical streak, discipline points, and previous days remain completely intact.
            </p>

            <button
              type="button"
              onClick={handleWipeTodayTrades}
              className="duo-btn-dark px-4 py-2.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer hover:border-amber-500 hover:text-amber-400"
            >
              <RotateCcw size={14} />
              <span>Wipe Today's Trades</span>
            </button>
          </div>

          {/* Card 2: Factory Reset / Complete Clean Slate */}
          <div className="duo-card p-6 space-y-4 border-2 border-rose-500/40 bg-rose-500/5">
            <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                  <Trash2 size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-rose-400">Complete Clean Slate (Factory Reset)</h3>
                </div>
              </div>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                DANGER ZONE
              </span>
            </div>

            <p className="text-xs font-bold text-slate-300 leading-relaxed">
              Ready to start your trading journal fresh from Day 1? This permanently wipes all historical session trades, debrief audits, discipline streaks, and restores your calendar back to an uncompleted state.
            </p>

            <button
              type="button"
              onClick={() => {
                soundFx.playPop();
                setResetConfirmText('');
                setIsResetModalOpen(true);
              }}
              className="duo-btn-orange !bg-rose-600 !border-rose-700 !border-b-rose-800 px-5 py-3 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Trash2 size={14} />
              <span>Start with a Clean Slate...</span>
            </button>
          </div>

          {/* Card 3: Delete account and all data (GDPR/CCPA style self-serve deletion) */}
          {user?.email && (
            <div className="duo-card p-6 space-y-3 border-2 border-rose-500/40 bg-rose-500/5">
              <h3 className="text-base font-black text-rose-400">Delete my account and data</h3>
              <p className="text-xs font-bold text-slate-300 leading-relaxed">
                Permanently deletes your trades, journal and login from our servers. Export first if you want a copy. This can't be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="Type DELETE" className="flex-1 p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs outline-none focus:border-rose-500" />
                <button
                  type="button"
                  disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || isDeletingAccount}
                  onClick={async () => {
                    setIsDeletingAccount(true);
                    setDeleteMessage('');
                    const res = await deleteMyAccount();
                    setIsDeletingAccount(false);
                    if (res.ok) { window.location.href = '/'; return; }
                    setDeleteMessage(res.message);
                  }}
                  className="px-5 py-3 rounded-xl bg-rose-600 border-b-4 border-rose-800 text-white text-xs font-black uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isDeletingAccount ? 'Deleting…' : 'Delete forever'}
                </button>
              </div>
              {deleteMessage && <p className="text-xs font-bold text-amber-300">{deleteMessage}</p>}
            </div>
          )}
        </div>
      )}

      {/* 3D CLEAN SLATE FACTORY RESET MODAL */}
      {isResetModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsResetModalOpen(false);
          }}
          className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in text-left"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="duo-card max-w-md w-full p-6 space-y-5 border-2 border-rose-500 relative shadow-2xl"
          >
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-[#20323D]">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                <ShieldAlert size={22} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider block">PERMANENT ACTION</span>
                <h3 className="text-lg font-black text-white">Confirm Clean Slate Reset</h3>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#142127] border border-rose-500/30 text-xs font-bold text-slate-300 space-y-2">
              <p>This action will permanently wipe:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                <li>All historical trade logs and executions</li>
                <li>All AI debrief reviews and report scores</li>
                <li>Your current discipline streak (resets to 0)</li>
                <li>Your calendar path (resets to Day 1)</li>
              </ul>
            </div>

            {/* Checkbox to keep broker logins */}
            <button
              type="button"
              onClick={() => setKeepBrokersOnReset(!keepBrokersOnReset)}
              className="flex items-center gap-2.5 cursor-pointer text-left py-1"
            >
              <div className={keepBrokersOnReset ? 'text-[#1CB0F6]' : 'text-slate-500'}>
                {keepBrokersOnReset ? <CheckSquare size={18} /> : <Square size={18} />}
              </div>
              <div>
                <div className="text-xs font-black text-white">Keep connected broker accounts</div>
                <div className="text-[10px] font-bold text-slate-400">You won't need to re-enter your broker credentials</div>
              </div>
            </button>

            {/* Confirmation typing field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Type <span className="text-rose-400 font-mono">RESET</span> to confirm:
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="Type RESET"
                className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs outline-none focus:border-rose-500 uppercase tracking-widest font-mono"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="duo-btn-dark flex-1 py-3 text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteFactoryReset}
                disabled={resetConfirmText.trim().toUpperCase() !== 'RESET'}
                className="duo-btn-orange !bg-rose-600 !border-rose-700 flex-1 py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
              >
                <Trash2 size={14} />
                <span>Confirm Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELECTIVE ACCOUNT WIPE / DISCONNECT MODAL */}
      {accountActionTarget && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setAccountActionTarget(null);
          }}
          className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in text-left"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="duo-card max-w-md w-full p-6 space-y-5 border-2 border-[#1CB0F6] relative shadow-2xl"
          >
            <button
              onClick={() => setAccountActionTarget(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-[#20323D]">
              <div className="w-10 h-10 rounded-2xl bg-[#1CB0F6]/20 border border-[#1CB0F6]/40 text-[#1CB0F6] flex items-center justify-center shrink-0">
                <Cpu size={22} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-[#1CB0F6] tracking-wider block">ACCOUNT CONTROL</span>
                <h3 className="text-lg font-black text-white">{accountActionTarget.name || 'Trading Account'}</h3>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-300 leading-relaxed">
              Select how to handle this account's connection and past trade history:
            </p>

            <div className="space-y-2.5">
              {/* Option 1: Disconnect only */}
              <button
                type="button"
                onClick={() => handleExecuteAccountAction('DISCONNECT_KEEP_TRADES')}
                className="w-full p-3.5 rounded-2xl bg-[#182830] border-2 border-[#2B3D47] hover:border-[#1CB0F6] text-left transition-all cursor-pointer group flex items-center justify-between"
              >
                <span className="text-xs font-black text-white group-hover:text-[#1CB0F6]">Disconnect Only</span>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-400">SAFE</span>
              </button>

              {/* Option 2: Wipe trades for this account */}
              <button
                type="button"
                onClick={() => handleExecuteAccountAction('WIPE_TRADES_KEEP_ACCOUNT')}
                className="w-full p-3.5 rounded-2xl bg-[#182830] border-2 border-amber-500/30 hover:border-amber-500 text-left transition-all cursor-pointer group flex items-center justify-between"
              >
                <span className="text-xs font-black text-amber-400">Wipe Account Trades Only</span>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">RESET TRADES</span>
              </button>

              {/* Option 3: Disconnect and purge */}
              <button
                type="button"
                onClick={() => handleExecuteAccountAction('DISCONNECT_AND_PURGE')}
                className="w-full p-3.5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 hover:border-rose-500 text-left transition-all cursor-pointer group flex items-center justify-between"
              >
                <span className="text-xs font-black text-rose-400">Disconnect & Purge All Trades</span>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">FULL PURGE</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAccountActionTarget(null)}
              className="duo-btn-dark w-full py-2.5 text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* SLEEK FLOATING TOAST NOTIFICATION */}
      {profileToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div className="duo-card p-4 bg-[#1CB0F6] border-2 border-[#1899D6] border-b-4 border-b-[#147BB0] text-white flex items-center gap-3">
            <Sparkles size={20} className="shrink-0" />
            <span className="text-xs font-black">{profileToast}</span>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Log Out of TradePigeon?"
        message="Your journal history and settings remain safe on this device. Sign back in anytime."
        confirmText="Log Out"
        cancelText="Stay Logged In"
        variant="danger"
        icon={<LogOut size={28} strokeWidth={2.5} />}
        onConfirm={handleConfirmSignOut}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </main>
  );
}
