import React, { useState, useEffect, useRef } from 'react';
import { User, Flame, Gem, Heart, Calendar, ShieldCheck, Award, TrendingUp, CheckCircle2, AlertCircle, Cpu, RefreshCw, BarChart3, Activity, Sparkles, Trash2, RotateCcw, ShieldAlert, CheckSquare, Square, X, Download, Upload, FileText, Check, LogOut } from 'lucide-react';
import { DuoShieldIcon, DuoLightningIcon, DuoChestIcon, DuoProfileIcon, DuoTrophyIcon } from './DuoIcons';
import GoogleAuthButton from './GoogleAuthButton';
import MobileAlertSettings from './MobileAlertSettings';
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
  wipeAccountTrades
} from '../utils/storage';

export default function ProfileTab() {
  const { user, signOutUser } = useAuth();
  const [googleUser, setGoogleUser] = useState(() => loadStoredData('tradepigeon_google_user', null));
  const [isPro, setIsPro] = useState(() => loadStoredData('tradepigeon_is_pro', false));
  const [activeSubTab, setActiveSubTab] = useState('DEBRIEF_HISTORY');
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [profileToast, setProfileToast] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [keepBrokersOnReset, setKeepBrokersOnReset] = useState(true);
  
  // Account Specific Wipe / Disconnect modal
  const [accountActionTarget, setAccountActionTarget] = useState(null);
  const fileInputRef = useRef(null);

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
          alert(res.error || 'Failed to import backup');
        }
      } catch (err) {
        alert('Corrupted JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleWipeTodayTrades = () => {
    soundFx.playPop();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('tradepigeon_session_trades_')) {
        localStorage.removeItem(k);
      }
    }
    window.dispatchEvent(new CustomEvent('tradepigeon-storage-update', { detail: { key: 'trades_cleared', value: Date.now() } }));
    triggerToast("Today's session trades wiped clean.");
  };

  const handleExecuteFactoryReset = () => {
    if (resetConfirmText.trim().toUpperCase() !== 'RESET') return;
    soundFx.playSuccess();
    factoryResetCleanSlate({ keepBrokerAccounts: keepBrokersOnReset });
  };

  const handleExportCsv = () => {
    soundFx.playSuccess();
    exportTradesCsv();
    triggerToast('Trades exported (CSV)');
  };

  const handleStripeCheckout = () => {
    soundFx.playPop();
    setIsProcessingStripe(true);
    const monthlyUrl = import.meta.env.VITE_STRIPE_MONTHLY_LINK || 'https://buy.stripe.com/00w28t0HrfyO93VamV7ss01';
    const emailParam = user?.email ? `?prefilled_email=${encodeURIComponent(user.email)}` : '';
    window.open(`${monthlyUrl}${emailParam}`, '_blank', 'noopener,noreferrer');
    setTimeout(() => setIsProcessingStripe(false), 800);
  };

  const handleCancelSubscription = () => {
    triggerToast("Pro access active through billing cycle.");
  };

  const handleSignOut = async () => {
    soundFx.playPop();
    if (window.confirm('Are you sure you want to log out of TradePigeon?')) {
      try {
        await signOutUser();
      } catch (err) {
        console.warn('[Sign Out Error]:', err);
      }
      saveStoredData('tradepigeon_google_user', null);
      triggerToast('Signed out of TradePigeon');
    }
  };

  // VERIFIED TRADING EDGE LOG (Loaded from Storage with clean zero-state and live reactivity)
  const [historicalLogs, setHistoricalLogs] = useState(() => loadStoredData('tradepigeon_debrief_history', []));

  // Connected Auto-Synced Trading Accounts (Loaded from Storage with clean zero-state)
  const [connectedAccounts, setConnectedAccounts] = useState(() => loadStoredData('tradepigeon_accounts_data', []));

  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdate(({ key, value }) => {
      if (key === 'tradepigeon_accounts_data') {
        setConnectedAccounts(value || []);
      }
      if (key === 'tradepigeon_debrief_history') {
        setHistoricalLogs(value || []);
      }
      if (key === 'tradepigeon_is_pro') {
        setIsPro(Boolean(value));
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

  // Live User Stats from Storage
  const userStats = loadStoredData('tradepigeon_user_stats', DEFAULT_USER_STATS);
  const userDp = loadStoredData('tradepigeon_user_dp', 0);
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
              onError={(e) => { e.target.src = '/parrot_logo.png'; }}
            />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-[#0D1635] border-2 border-[#FF6B00] flex items-center justify-center shrink-0">
              <User size={22} className="text-[#FF6B00]" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white">{activeUser?.name || 'Trader'}</h2>
              <span className={`px-2.5 py-0.5 rounded-lg text-white text-[10px] font-black uppercase ${isPro ? 'bg-[#FF6B00] border border-[#C2410C]' : 'bg-[#58CC02]'}`}>
                {isPro ? 'PRO SUBSCRIBER' : 'PROP TRADER'}
              </span>
            </div>
            {activeUser?.email && (
              <div className="text-xs font-bold text-slate-400">{activeUser.email}</div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <GoogleAuthButton className="py-2.5 text-xs" buttonText="Google Identity" />
          {isPro ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#58CC02]/20 border-2 border-[#58CC02] border-b-4 border-b-[#388202] text-xs font-black text-white shadow-md">
              <CheckCircle2 size={16} className="text-[#58CC02]" />
              <span>PRO ACTIVE</span>
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

            <div className="flex items-center justify-between">
              <span className="text-base font-black text-white">Disciplined Trades</span>
              <span className="text-xl sm:text-2xl font-black text-[#58CC02]">{userStats.tradesLogged || 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-base font-black text-white">Plan Adherence</span>
              <span className="text-xl sm:text-2xl font-black text-[#58CC02]">{userStats.overallWinRate || '0%'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS (SESSION DEBRIEF HISTORY / ACCOUNTS) */}
      <div className="flex items-center gap-2.5 border-b-2 border-[#20323D] pb-3">
        <button
          onClick={() => setActiveSubTab('DEBRIEF_HISTORY')}
          className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'DEBRIEF_HISTORY'
              ? 'duo-btn-blue'
              : 'duo-btn-dark'
          }`}
        >
          Session Debrief History
        </button>
        <button
          onClick={() => setActiveSubTab('ACCOUNTS')}
          className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'ACCOUNTS'
              ? 'duo-btn-blue'
              : 'duo-btn-dark'
          }`}
        >
          Connected Broker Accounts
        </button>
        <button
          onClick={() => setActiveSubTab('RESET_ZONE')}
          className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
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
          <div className="pt-4">
            <MobileAlertSettings />
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CLEAN SLATE & RESET ZONE */}
      {activeSubTab === 'RESET_ZONE' && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Card 0: Full Journal Backup & Restore */}
          <div className="duo-card p-6 space-y-4 border-2 border-sky-500/30 bg-sky-500/5">
            <div className="flex items-center justify-between pb-3 border-b border-sky-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1CB0F6]/20 border border-[#1CB0F6]/40 text-[#1CB0F6] flex items-center justify-center">
                  <Download size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Full Journal Backup & Restore</h3>
                  <p className="text-[11px] font-bold text-slate-400">Export or restore your complete trading history, debrief logs, and accounts</p>
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
                  <p className="text-[11px] font-bold text-slate-400">Clear today's fills without affecting your streak or calendar history</p>
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
                  <p className="text-[11px] font-bold text-slate-400">Permanent reset to pristine Day 1 state</p>
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
        </div>
      )}

      {/* 3D CLEAN SLATE FACTORY RESET MODAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="duo-card max-w-md w-full p-6 space-y-5 border-2 border-rose-500 relative shadow-2xl">
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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="duo-card max-w-md w-full p-6 space-y-5 border-2 border-[#1CB0F6] relative shadow-2xl">
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
                className="w-full p-3.5 rounded-2xl bg-[#182830] border-2 border-[#2B3D47] hover:border-[#1CB0F6] text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white group-hover:text-[#1CB0F6]">Disconnect Only</span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-400">SAFE</span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 mt-1">
                  Unlinks the broker credentials. All previous trade fills and performance remain in your journal.
                </p>
              </button>

              {/* Option 2: Wipe trades for this account */}
              <button
                type="button"
                onClick={() => handleExecuteAccountAction('WIPE_TRADES_KEEP_ACCOUNT')}
                className="w-full p-3.5 rounded-2xl bg-[#182830] border-2 border-amber-500/30 hover:border-amber-500 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-400">Wipe Account Trades Only</span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">RESET TRADES</span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 mt-1">
                  Removes all session trades logged under this account. The broker stays connected (ideal for prop evaluation resets).
                </p>
              </button>

              {/* Option 3: Disconnect and purge */}
              <button
                type="button"
                onClick={() => handleExecuteAccountAction('DISCONNECT_AND_PURGE')}
                className="w-full p-3.5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 hover:border-rose-500 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-400">Disconnect & Purge All Trades</span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">FULL PURGE</span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 mt-1">
                  Unlinks this account and wipes every execution associated with it from your journal.
                </p>
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

    </main>
  );
}
