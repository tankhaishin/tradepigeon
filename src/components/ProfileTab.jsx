import React, { useState, useEffect } from 'react';
import { User, Flame, Gem, Heart, Calendar, ShieldCheck, Award, TrendingUp, CheckCircle2, AlertCircle, Cpu, RefreshCw, BarChart3, Activity, Sparkles, Trash2, RotateCcw, ShieldAlert, CheckSquare, Square, X } from 'lucide-react';
import { DuoShieldIcon, DuoLightningIcon, DuoChestIcon, DuoProfileIcon, DuoTrophyIcon } from './DuoIcons';
import GoogleAuthButton from './GoogleAuthButton';
import MobileAlertSettings from './MobileAlertSettings';
import { soundFx } from '../utils/audioEngine';
import { loadStoredData, saveStoredData, subscribeToStorageUpdate, DEFAULT_USER_STATS, factoryResetCleanSlate } from '../utils/storage';

export default function ProfileTab() {
  const [activeSubTab, setActiveSubTab] = useState('DEBRIEF_HISTORY');
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [profileToast, setProfileToast] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [keepBrokersOnReset, setKeepBrokersOnReset] = useState(true);

  const triggerToast = (msg) => {
    soundFx.playPop();
    setProfileToast(msg);
    setTimeout(() => setProfileToast(''), 3500);
  };

  const handleWipeTodayTrades = () => {
    soundFx.playPop();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('goodtrader_session_trades_')) {
        localStorage.removeItem(k);
      }
    }
    window.dispatchEvent(new CustomEvent('goodtrader-storage-update', { detail: { key: 'trades_cleared', value: Date.now() } }));
    triggerToast("Today's session trades wiped clean.");
  };

  const handleExecuteFactoryReset = () => {
    if (resetConfirmText.trim().toUpperCase() !== 'RESET') return;
    soundFx.playSuccess();
    factoryResetCleanSlate({ keepBrokerAccounts: keepBrokersOnReset });
  };

  const handleStripeCheckout = async () => {
    setIsProcessingStripe(true);
    try {
      const response = await fetch('http://localhost:3001/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: 'price_123456789',
          successUrl: window.location.href,
          cancelUrl: window.location.href,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        triggerToast("Connecting to secure Stripe gateway...");
      }
    } catch (err) {
      console.warn('[Stripe Trigger Error]:', err);
      triggerToast("Connecting to secure Stripe gateway...");
    } finally {
      setIsProcessingStripe(false);
    }
  };

  const handleCancelSubscription = () => {
    triggerToast("Pro access active through billing cycle.");
  };

  // VERIFIED TRADING EDGE LOG (Loaded from Storage with clean zero-state)
  const historicalLogs = loadStoredData('goodtrader_debrief_history', []);

  // Connected Auto-Synced Trading Accounts (Loaded from Storage with clean zero-state)
  const [connectedAccounts, setConnectedAccounts] = useState(() => loadStoredData('goodtrader_accounts_data', []));

  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdate(({ key, value }) => {
      if (key === 'goodtrader_accounts_data') {
        setConnectedAccounts(value || []);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleDisconnectAccount = (accountId) => {
    soundFx.playPop();
    const updated = connectedAccounts.filter((a) => a.id !== accountId && a.name !== accountId);
    setConnectedAccounts(updated);
    saveStoredData('goodtrader_accounts_data', updated);
    triggerToast('Account disconnected successfully');
  };

  const handleClearAllAccounts = () => {
    soundFx.playPop();
    setConnectedAccounts([]);
    saveStoredData('goodtrader_accounts_data', []);
    triggerToast('All connected accounts cleared');
  };

  // Live User Stats from Storage
  const userStats = loadStoredData('goodtrader_user_stats', DEFAULT_USER_STATS);
  const userDp = loadStoredData('goodtrader_user_dp', 0);

  return (
    <main className="flex-1 min-h-screen lg:pl-28 xl:pl-80 xl:pr-[416px] bg-[#070C1E] p-4 sm:p-6 lg:p-8 text-white space-y-8 pb-24 lg:pb-10 max-w-full overflow-hidden">
      
      {/* 1. TOP HEADER: PURE FLOATING DUOLINGO HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Trader</h2>
          <span className="px-2.5 py-0.5 rounded-lg bg-[#58CC02] text-white text-[10px] font-black uppercase">PROP MASTER</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <GoogleAuthButton className="py-2.5 text-xs" buttonText="Google Identity" />
          <button
            onClick={handleStripeCheckout}
            disabled={isProcessingStripe}
            className="duo-btn-orange px-4 py-2.5 text-xs flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            <span>{isProcessingStripe ? 'Connecting Stripe...' : 'Upgrade to Pro ($9.99/mo)'}</span>
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
              {historicalLogs.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#182830] border-2 border-[#2B3D47] border-b-4 border-b-[#142127] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 border-2 ${
                      item.grade.startsWith('A') ? 'bg-[#58CC02] text-white border-[#46A302] border-b-4 border-b-[#388202]' : 'bg-amber-500 text-slate-950 border-amber-600 border-b-4 border-b-amber-700'
                    }`}>
                      {item.grade}
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">{item.date} &bull; <span className="text-[#1CB0F6]">{item.setup}</span></div>
                      <div className="text-xs font-bold text-[#52656D] mt-0.5">{item.score} &bull; Mindset: {item.mood}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-sm font-black ${item.pnl.startsWith('+') ? 'text-[#58CC02]' : 'text-rose-400'}`}>
                      {item.pnl}
                    </div>
                    <div className="text-[10px] font-black uppercase text-slate-400 mt-0.5">{item.status}</div>
                  </div>
                </div>
              ))}
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
                      onClick={() => handleDisconnectAccount(acc.id || acc.name)}
                      className="text-xs font-black text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
                      title="Disconnect & remove this account"
                    >
                      <Trash2 size={12} />
                      <span>Disconnect</span>
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
