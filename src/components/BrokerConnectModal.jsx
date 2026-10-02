import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, ShieldAlert, ShieldCheck, Lock, Key, RefreshCw, X, Zap, 
  Activity, ArrowLeft, Sparkles, ChevronRight, Eye, EyeOff, Layers, CheckSquare, Square, Crown
} from 'lucide-react';
import { TradovateLogo, NinjaTraderLogo, CsvLogo } from './BrokerLogos';
import { loadStoredData, saveStoredData } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';
import { detectPlatformFromAccountId } from '../utils/platformDetector';
import { parseFinancialNumber, formatBalance } from '../utils/financialMath';
import { isProActive } from '../utils/proStatus';

export default function BrokerConnectModal({ isOpen, onClose, onAccountAdded, onOpenStatementImport }) {
  const [authSuccess, setAuthSuccess] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [step, setStep] = useState('platform'); // 'platform' | 'credentials' | 'select_accounts'
  
  // Form Fields
  const [env, setEnv] = useState('LIVE');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capital, setCapital] = useState('50000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Discovered Accounts List (from API /account/list)
  const [discoveredAccounts, setDiscoveredAccounts] = useState([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);
  const [accountNicknames, setAccountNicknames] = useState({});
  const [sessionToken, setSessionToken] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const platforms = [
    { 
      id: 'tradovate', 
      name: 'Tradovate', 
      icon: TradovateLogo, 
      badge: 'DIRECT API',
      color: '#FF6B00'
    },
    { 
      id: 'ninjatrader', 
      name: 'NinjaTrader', 
      icon: NinjaTraderLogo, 
      badge: 'DIRECT API',
      color: '#58CC02'
    },
    { 
      id: 'propfirms', 
      name: 'Apex / TopStep / Prop Firms', 
      icon: TradovateLogo, 
      badge: 'PROP FIRMS',
      color: '#00E5FF'
    },
    { 
      id: 'csv', 
      name: 'Universal CSV / Statement', 
      icon: CsvLogo, 
      badge: 'STATEMENT',
      color: '#1CB0F6'
    }
  ];

  const handleSelectPlatform = (platform) => {
    soundFx.playPop();
    if (platform.id === 'csv') {
      onClose();
      if (onOpenStatementImport) onOpenStatementImport();
      return;
    }

    if (!isProActive()) {
      soundFx.playWarning();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tradepigeon_open_paywall', {
          detail: { feature: `${platform.name} Direct API Sync` }
        }));
      }
      return;
    }

    setSelectedPlatform(platform);
    setUsername('');
    setPassword('');
    setCapital('50000');
    setFormError('');
    setStep('credentials');
  };

  const handleConnectAndDiscover = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setFormError('Please enter your broker username or account ID.');
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setFormError('You appear to be offline. Please check your internet connection.');
      soundFx.playWarning();
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    soundFx.playPop();

    try {
      let accountsToOffer = [];
      let token = null;

      // Attempt live call to TradePigeon API proxy (Vercel Serverless / local Express)
      try {
        const response = await fetch(`/api/tradovate?action=auth&env=${env}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: username.trim(),
            password: password.trim() || 'demo',
            env: env
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.accounts) && data.accounts.length > 0) {
            accountsToOffer = data.accounts;
            token = data.accessToken;
            setSessionToken(data.accessToken);
          } else if (data.error) {
            setFormError(data.error);
            setIsSubmitting(false);
            soundFx.playWarning();
            return;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          setFormError(errData.error || 'Authentication failed. Please verify your credentials.');
          setIsSubmitting(false);
          soundFx.playWarning();
          return;
        }
      } catch (apiErr) {
        console.warn('API proxy unavailable:', apiErr);
        setIsSubmitting(false);
        soundFx.playWarning();
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          setFormError('Network unavailable. You appear to be offline.');
        } else {
          setFormError('Broker authentication server is currently unreachable. Please check your connection or import via Universal CSV.');
        }
        return;
      }

      // If no sub-accounts returned from broker API, fail gracefully
      if (accountsToOffer.length === 0) {
        setIsSubmitting(false);
        soundFx.playWarning();
        setFormError('Unable to authenticate with broker. Please check your credentials or import your execution history via Universal CSV.');
        return;
      }

      setDiscoveredAccounts(accountsToOffer);
      setSelectedAccountIds(accountsToOffer.map(a => a.id));
      
      const defaultNicknames = {};
      accountsToOffer.forEach((a, idx) => {
        defaultNicknames[a.id] = `${selectedPlatform.name} ${idx === 0 ? 'Primary' : `#${idx + 1}`} (${a.id})`;
      });
      setAccountNicknames(defaultNicknames);

      soundFx.playSuccess();
      setIsSubmitting(false);
      setStep('select_accounts');

    } catch (err) {
      console.error('Broker connection error:', err);
      setIsSubmitting(false);
      setFormError('Authentication failed. Please check your credentials or try Demo mode.');
    }
  };

  const toggleSelectAccount = (accId) => {
    soundFx.playPop();
    if (selectedAccountIds.includes(accId)) {
      if (selectedAccountIds.length === 1) return; // Keep at least one selected
      setSelectedAccountIds(selectedAccountIds.filter(id => id !== accId));
    } else {
      setSelectedAccountIds([...selectedAccountIds, accId]);
    }
  };

  const handleFinalizeImport = () => {
    soundFx.playSuccess();
    const rawBalance = parseFinancialNumber(capital, 50000);
    const formattedBalance = formatBalance(rawBalance);

    const createdAccounts = discoveredAccounts
      .filter(a => selectedAccountIds.includes(a.id))
      .map((a, idx) => ({
        id: `BROKER-${Date.now().toString().slice(-6)}-${idx + 1}`,
        name: accountNicknames[a.id] || a.name || `${selectedPlatform.name} (${a.id})`,
        broker: `${selectedPlatform.name} (${env})`,
        platformId: selectedPlatform.id,
        accountNumber: a.id,
        accessToken: sessionToken || null,
        status: 'SYNCED (LIVE)',
        balance: formattedBalance,
        pnl: '$0.00',
        pnlNum: 0,
        environment: env,
        connectedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }));

    const existingAccounts = loadStoredData('tradepigeon_accounts_data', []);
    saveStoredData('tradepigeon_accounts_data', [...createdAccounts, ...existingAccounts]);

    setAuthSuccess(true);
    setTimeout(() => {
      if (onAccountAdded) {
        onAccountAdded({ account: createdAccounts[0], accounts: createdAccounts });
      }
      setAuthSuccess(false);
      setSelectedPlatform(null);
      setStep('platform');
      onClose();
    }, 1000);
  };

  const handleResetModal = () => {
    setSelectedPlatform(null);
    setStep('platform');
    setFormError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="duo-card max-w-xl w-full p-6 sm:p-8 space-y-6 border-2 border-[#1CB0F6] relative max-h-[92vh] overflow-y-auto text-left shadow-2xl">
        
        {/* Close Button */}
        <button 
          onClick={handleResetModal}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-[#142127] border border-[#20323D] transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-[#20323D]">
          {step !== 'platform' ? (
            <button
              type="button"
              onClick={() => {
                soundFx.playPop();
                if (step === 'select_accounts') setStep('credentials');
                else setStep('platform');
              }}
              className="p-2 rounded-xl bg-[#142127] border border-[#20323D] text-slate-300 hover:text-white cursor-pointer transition-all"
              title="Go Back"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6]/20 border border-[#1CB0F6]/40 text-[#1CB0F6] flex items-center justify-center shrink-0">
              <Activity size={24} className="animate-pulse" />
            </div>
          )}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#1CB0F6]">
              {step === 'select_accounts' ? 'STEP 2: SELECT ACCOUNTS' : 'CONNECT BROKER'}
            </span>
            <h3 className="text-xl font-black text-white">
              {step === 'select_accounts' 
                ? 'Select Accounts to Track' 
                : selectedPlatform 
                  ? `Connect ${selectedPlatform.name}` 
                  : 'Connect Broker'}
            </h3>
          </div>
        </div>

        {authSuccess ? (
          <div className="py-10 text-center space-y-4 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#58CC02]/20 border-2 border-[#58CC02] text-[#58CC02] flex items-center justify-center animate-bounce">
              <CheckCircle2 size={42} />
            </div>
            <h4 className="text-xl font-black text-white">Accounts Linked!</h4>
            <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto">
              Live sync active. Fills will sync into your session.
            </p>
          </div>
        ) : step === 'select_accounts' ? (
          /* STEP 2: MULTI-ACCOUNT DISCOVERY & SELECTION */
          <div className="space-y-4 animate-fade-in">
            <div className="p-3.5 rounded-2xl bg-[#142127] border border-[#20323D] space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-white">
                <span className="flex items-center gap-1.5 text-[#58CC02]">
                  <CheckCircle2 size={14} />
                  <span>Found {discoveredAccounts.length} Sub-Account(s) under this login</span>
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#1CB0F6]/20 text-[#1CB0F6] border border-[#1CB0F6]/30">
                  {env}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-400">
                Select the accounts you want to track in TradePigeon. You can give each account a custom label.
              </p>
            </div>

            {/* Discovered Accounts Checklist */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {discoveredAccounts.map((acc) => {
                const isSelected = selectedAccountIds.includes(acc.id);
                return (
                  <div 
                    key={acc.id}
                    className={`p-3 rounded-xl border transition-all space-y-2 ${
                      isSelected 
                        ? 'bg-[#142127] border-[#1CB0F6]' 
                        : 'bg-[#0e161c] border-[#20323D] opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => toggleSelectAccount(acc.id)}
                        className="flex items-center gap-2.5 cursor-pointer text-left"
                      >
                        <div className={isSelected ? 'text-[#1CB0F6]' : 'text-slate-500'}>
                          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                        </div>
                        <div>
                          <div className="text-xs font-black text-white font-mono">{acc.id}</div>
                          <div className="text-[10px] font-bold text-slate-400">{acc.accountType || env}</div>
                        </div>
                      </button>

                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/30">
                        READY TO SYNC
                      </span>
                    </div>

                    {isSelected && (
                      <div className="pt-1.5 border-t border-[#20323D]/60 flex items-center gap-2">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0">
                          Nickname:
                        </label>
                        <input
                          type="text"
                          value={accountNicknames[acc.id] || ''}
                          onChange={(e) => setAccountNicknames({ ...accountNicknames, [acc.id]: e.target.value })}
                          className="flex-1 px-2.5 py-1 rounded-lg bg-[#070C1E] border border-[#20323D] text-white text-xs font-bold outline-none focus:border-[#1CB0F6]"
                          placeholder={`e.g. Apex 50k (${acc.id})`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleFinalizeImport}
              disabled={selectedAccountIds.length === 0}
              className="duo-btn-green w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg mt-2"
            >
              <Zap size={16} />
              <span>Import Selected ({selectedAccountIds.length}) Accounts</span>
            </button>
          </div>
        ) : step === 'credentials' ? (
          /* STEP 1: DIRECT IN-APP CREDENTIALS FORM (NO POPUP) */
          <form onSubmit={handleConnectAndDiscover} className="space-y-4 animate-fade-in">
            
            {/* Broker Info Strip */}
            <div className="p-3.5 rounded-2xl bg-[#142127] border border-[#20323D] flex items-center gap-3">
              <selectedPlatform.icon className="w-8 h-8 object-contain shrink-0" />
              <div>
                <div className="text-sm font-black text-white">{selectedPlatform.name}</div>
                <div className="text-[10px] font-bold text-slate-400">{selectedPlatform.subtitle}</div>
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                <ShieldAlert size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* Environment Toggle */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Account Environment
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEnv('LIVE')}
                  className={`py-2.5 px-4 rounded-xl border-2 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    env === 'LIVE' 
                      ? 'bg-[#58CC02]/20 border-[#58CC02] text-[#58CC02]' 
                      : 'bg-[#142127] border-[#20323D] text-slate-400 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${env === 'LIVE' ? 'bg-[#58CC02] animate-pulse' : 'bg-slate-500'}`} />
                  <span>Live Production</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEnv('DEMO')}
                  className={`py-2.5 px-4 rounded-xl border-2 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    env === 'DEMO' 
                      ? 'bg-[#FF6B00]/20 border-[#FF6B00] text-[#FF6B00]' 
                      : 'bg-[#142127] border-[#20323D] text-slate-400 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${env === 'DEMO' ? 'bg-[#FF6B00]' : 'bg-slate-500'}`} />
                  <span>Demo / Evaluation</span>
                </button>
              </div>
            </div>

            {/* Username / Account ID */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                {selectedPlatform.name} Username or Main Account ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. 1092834, 1092835"
                  className="w-full p-3.5 rounded-xl bg-[#142127] border border-[#20323D] text-white font-bold text-xs outline-none focus:border-[#1CB0F6]"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Password
                </label>
                <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                  <ShieldCheck size={11} className="text-[#58CC02]" />
                  <span>Encrypted via HTTPS</span>
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your broker password"
                  className="w-full p-3.5 pr-10 rounded-xl bg-[#142127] border border-[#20323D] text-white font-bold text-xs outline-none focus:border-[#1CB0F6]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Starting Balance */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Account Starting Capital ($)
              </label>
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                placeholder="50000"
                className="w-full p-3 rounded-xl bg-[#142127] border border-[#20323D] text-white font-bold text-xs outline-none focus:border-[#1CB0F6]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="duo-btn-blue w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg mt-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Connecting & Discovering Accounts...</span>
                </>
              ) : (
                <>
                  <Zap size={16} />
                  <span>Connect & Discover Accounts</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* PLATFORM SELECTION GRID */
          <div className="space-y-4 animate-fade-in">
            {!isProActive() && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-[#FFC800] flex items-center justify-center shrink-0">
                    <Crown size={18} className="fill-[#FFC800]" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">Direct Broker Sync is a Pro Feature</div>
                    <div className="text-[10px] font-bold text-slate-400">Universal CSV import is free for everyone</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playPop();
                    window.dispatchEvent(new CustomEvent('tradepigeon_open_paywall', {
                      detail: { feature: 'Direct Broker Sync' }
                    }));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#58CC02] border-b-2 border-[#46A302] text-white text-[10px] font-black uppercase tracking-wider hover:brightness-110 cursor-pointer shrink-0 shadow"
                >
                  Unlock Pro
                </button>
              </div>
            )}

            <h4 className="text-sm font-black text-white">Select Broker</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {platforms.map((p) => {
                const PlatformIcon = p.icon;
                const isLocked = p.id !== 'csv' && !isProActive();
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPlatform(p)}
                    className={`p-4 rounded-2xl bg-[#142127] border-2 border-[#20323D] hover:border-[#1CB0F6] hover:bg-[#1CB0F6]/10 text-left transition-all group cursor-pointer flex flex-col justify-between space-y-3 relative ${isLocked ? 'opacity-90' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <PlatformIcon className="w-8 h-8 object-contain shrink-0" />
                      <div className="flex items-center gap-1.5">
                        {isLocked && (
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-[#FFC800] border border-amber-500/30">
                            <Lock size={10} />
                            PRO
                          </span>
                        )}
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[#1CB0F6]/20 text-[#1CB0F6] border border-[#1CB0F6]/30">
                          {p.badge}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm font-black text-white group-hover:text-[#1CB0F6] transition-colors flex items-center justify-between">
                      <span>{p.name}</span>
                      <ChevronRight size={14} className="text-slate-500 group-hover:text-[#1CB0F6] transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
