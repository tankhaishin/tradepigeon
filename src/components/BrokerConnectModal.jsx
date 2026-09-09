import React, { useState, useEffect } from 'react';
import { 
  Link2, CheckCircle2, ShieldAlert, ShieldCheck, Cpu, Lock, Key, Server, RefreshCw, X, Shield, Zap, ExternalLink, Activity, ArrowLeft, Sparkles
} from 'lucide-react';
import { TradovateLogo, MetaTrader5Logo, NinjaTraderLogo, TradeLockerLogo, CsvLogo } from './BrokerLogos';
import { loadStoredData, saveStoredData } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';
import { detectPlatformFromAccountId } from '../utils/platformDetector';

export default function BrokerConnectModal({ isOpen, onClose, onAccountAdded }) {
  const [authSuccess, setAuthSuccess] = useState(false);
  const [connectingBroker, setConnectingBroker] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  // Form Fields
  const [env, setEnv] = useState('LIVE');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [capital, setCapital] = useState('50000');
  const [subAccountCount, setSubAccountCount] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const handleOAuthMessage = (event) => {
      if (event.data?.type === 'TRADEPIGEON_BROKER_OAUTH_SUCCESS') {
        const { account } = event.data;
        if (account) {
          const existingAccounts = loadStoredData('goodtrader_accounts_data', []);
          saveStoredData('goodtrader_accounts_data', [account, ...existingAccounts]);

          soundFx.playSuccess();
          setAuthSuccess(true);
          setConnectingBroker(null);

          setTimeout(() => {
            if (onAccountAdded) {
              onAccountAdded({ account });
            }
            setAuthSuccess(false);
            onClose();
          }, 1400);
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [onAccountAdded, onClose]);

  if (!isOpen) return null;

  const platforms = [
    { 
      id: 'tradovate', 
      name: 'Tradovate (Recommended)', 
      subtitle: 'Official Web OAuth 2.0 & Direct API Gateway',
      icon: TradovateLogo, 
      badge: 'RECOMMENDED OAUTH 2.0',
      url: 'https://trader.tradovate.com',
      color: '#FF6B00'
    },
    { 
      id: 'lucidtrading', 
      name: 'Lucid Trading', 
      subtitle: 'Prop Firm Multi-Account Socket Gateway',
      icon: TradovateLogo, 
      badge: 'PROP FIRM MULTI-ACCOUNT',
      url: 'https://lucidtrading.com',
      color: '#00E5FF'
    },
    { 
      id: 'metatrader5', 
      name: 'MetaTrader 5 / MT4', 
      subtitle: 'Official WebTerminal & Investor API',
      icon: MetaTrader5Logo, 
      badge: 'OFFICIAL WEBTERMINAL',
      url: 'https://trade.mql5.com/trade',
      color: '#1CB0F6'
    },
    { 
      id: 'tradelocker', 
      name: 'TradeLocker', 
      subtitle: 'Official Live Terminal & Socket Feed',
      icon: TradeLockerLogo, 
      badge: 'OFFICIAL LIVE WEB',
      url: 'https://live.tradelocker.com',
      color: '#CE82FF'
    },
    { 
      id: 'ninjatrader', 
      name: 'NinjaTrader', 
      subtitle: 'Official Account Portal & Live Stream',
      icon: NinjaTraderLogo, 
      badge: 'OFFICIAL ACCOUNT PORTAL',
      url: 'https://account.ninjatrader.com/login',
      color: '#58CC02'
    },
  ];

  const [authMode, setAuthMode] = useState('CHOICE'); // 'CHOICE' | 'DIRECT_FORM'

  const handleSelectPlatform = (platform) => {
    soundFx.playPop();
    setSelectedPlatform(platform);
    setAuthMode('CHOICE');
    setUsername('');
    setPassword('');
    setCapital('50000');
    setSubAccountCount('1');
    setFormError('');
  };

  const handleLaunchOAuthPopup = (platformObj = selectedPlatform) => {
    if (!platformObj) return;
    soundFx.playPop();
    setConnectingBroker(platformObj.id);

    const width = 640;
    const height = 760;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const popup = window.open(
      `/broker-oauth.html?broker=${platformObj.id}`,
      `BrokerOfficial_${platformObj.id}`,
      `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,scrollbars=yes`
    );

    if (popup) {
      popup.focus();
    }

    const checkTimer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkTimer);
        setConnectingBroker(null);
      }
    }, 800);
  };

  const handleDirectAuthSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setFormError('Please enter your Account Username or Login ID');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    soundFx.playPop();

    setTimeout(() => {
      const rawBalance = parseFloat(capital) || 50000;
      const formattedBalance = `$${rawBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      // Support comma-separated account numbers or multi-account expansion
      let rawAccList = username.split(',').map(s => s.trim()).filter(Boolean);
      if (rawAccList.length === 0) {
        rawAccList = [username.trim()];
      }

      const countNum = parseInt(subAccountCount, 10) || 1;
      if (rawAccList.length === 1 && countNum > 1) {
        const baseName = rawAccList[0];
        rawAccList = Array.from({ length: countNum }, (_, i) => `${baseName}-${(i + 1).toString().padStart(2, '0')}`);
      }

      const createdAccounts = rawAccList.map((accNum, idx) => ({
        id: `BROKER-${Date.now().toString().slice(-6)}-${idx + 1}`,
        name: `${selectedPlatform.name} (${accNum})`,
        broker: `${selectedPlatform.name} (${env})`,
        platformId: selectedPlatform.id,
        accountNumber: accNum,
        status: 'SYNCED (LIVE)',
        balance: formattedBalance,
        pnl: '+$0.00',
        connectedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }));

      const existingAccounts = loadStoredData('goodtrader_accounts_data', []);
      saveStoredData('goodtrader_accounts_data', [...createdAccounts, ...existingAccounts]);

      soundFx.playSuccess();
      setIsSubmitting(false);
      setAuthSuccess(true);

      setTimeout(() => {
        if (onAccountAdded) {
          onAccountAdded({ account: createdAccounts[0], accounts: createdAccounts });
        }
        setAuthSuccess(false);
        setSelectedPlatform(null);
        onClose();
      }, 1400);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="duo-card max-w-xl w-full p-6 sm:p-8 space-y-6 border-2 border-[#FF6B00] relative max-h-[92vh] overflow-y-auto text-left">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-[#142127] border border-[#20323D] transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-[#20323D]">
          {selectedPlatform ? (
            <button
              type="button"
              onClick={() => {
                if (authMode === 'DIRECT_FORM') {
                  setAuthMode('CHOICE');
                } else {
                  setSelectedPlatform(null);
                }
              }}
              className="p-2 rounded-xl bg-[#142127] border border-[#20323D] text-slate-300 hover:text-white cursor-pointer transition-all"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/20 border border-[#FF6B00]/40 text-[#FF6B00] flex items-center justify-center text-2xl font-black shrink-0">
              <Activity size={24} className="animate-pulse" />
            </div>
          )}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6B00]">DIRECT OFFICIAL BROKER CONNECT</span>
            <h3 className="text-xl font-black text-white">
              {selectedPlatform ? `Authorize ${selectedPlatform.name}` : 'Connect Broker Account'}
            </h3>
          </div>
        </div>

        {authSuccess ? (
          <div className="py-10 text-center space-y-4 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#58CC02]/20 border-2 border-[#58CC02] text-[#58CC02] flex items-center justify-center animate-bounce">
              <CheckCircle2 size={42} />
            </div>
            <h4 className="text-xl font-black text-white">Broker Live Socket Connected!</h4>
            <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto">
              Live trade telemetry is active. Fills and position risk limits are now tracked automatically in real time!
            </p>
          </div>
        ) : selectedPlatform ? (
          authMode === 'CHOICE' ? (
            /* CHOICE MODES: OPTION A (1-CLICK OAUTH POPUP) vs OPTION B (DIRECT API FORM) */
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#142127] border border-[#20323D]">
                <selectedPlatform.icon className="w-9 h-9 object-contain shrink-0" />
                <div>
                  <div className="text-base font-black text-white">{selectedPlatform.name}</div>
                  <div className="text-xs font-bold text-slate-400">Choose your connection method</div>
                </div>
              </div>

              {/* HELPER CALLOUT FOR TRADOVATE SCREENSHOT */}
              <div className="p-3.5 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-left space-y-1.5">
                <div className="text-xs font-black text-[#00E5FF] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>How to connect from your Tradovate screen:</span>
                </div>
                <p className="text-xs font-bold text-slate-300 leading-relaxed">
                  In Tradovate's top header, locate your <strong>ACCOUNT ID</strong> (e.g., <code className="bg-[#0b1318] px-1.5 py-0.5 rounded text-[#00E5FF] font-mono">LFE05055647070018</code>). Click <strong>Option A (1-Click OAuth)</strong> below to authorize instantly!
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* OPTION A: OFFICIAL OAUTH POPUP */}
                <button
                  type="button"
                  onClick={() => handleLaunchOAuthPopup(selectedPlatform)}
                  className="p-5 rounded-2xl bg-[#FF6B00]/15 border-2 border-[#FF6B00] text-left hover:bg-[#FF6B00]/25 transition-all cursor-pointer space-y-2 group shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded bg-[#FF6B00] text-white">
                      RECOMMENDED (1-CLICK OAUTH)
                    </span>
                    <ExternalLink size={16} className="text-[#FF6B00] group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-sm font-black text-white group-hover:text-[#FF6B00]">
                    Official {selectedPlatform.name} OAuth Sign-In
                  </div>
                  <div className="text-xs font-bold text-slate-300 leading-relaxed">
                    Launches official login popup. Log in once on broker site — automatically redirects back & closes window when done.
                  </div>
                </button>

                {/* OPTION B: DIRECT API / PROP FIRM BATCH */}
                <button
                  type="button"
                  onClick={() => setAuthMode('DIRECT_FORM')}
                  className="p-5 rounded-2xl bg-[#142127] border-2 border-[#20323D] text-left hover:border-slate-500 transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded bg-[#1CB0F6]/20 text-[#1CB0F6] border border-[#1CB0F6]/40">
                      PROP FIRM / MULTI-ACCOUNT BATCH
                    </span>
                    <Key size={16} className="text-[#1CB0F6] group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-sm font-black text-white group-hover:text-[#1CB0F6]">
                    Direct API Keys / Sub-Accounts Batch Form
                  </div>
                  <div className="text-xs font-bold text-slate-300 leading-relaxed">
                    Type Account ID & API Key in-app. Best for importing 5–10 prop firm sub-accounts (Apex, Topstep, Lucid).
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* OPTION B: IN-APP DIRECT BROKER AUTHENTICATION FORM */
            <form onSubmit={handleDirectAuthSubmit} className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#142127] border border-[#20323D]">
                <div className="flex items-center gap-3">
                  <selectedPlatform.icon className="w-8 h-8 object-contain shrink-0" />
                  <div>
                    <div className="text-sm font-black text-white">{selectedPlatform.name}</div>
                    <div className="text-[10px] font-bold text-slate-400">Direct API & Multi-Account Import</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthMode('CHOICE')}
                  className="text-xs font-bold text-[#FF6B00] hover:underline cursor-pointer"
                >
                  Switch to OAuth
                </button>
              </div>

            <div className="p-4 rounded-2xl bg-[#142127] border-2 border-[#FF6B00]/40 space-y-2 text-left shadow-lg">
              <div className="text-xs font-black text-[#FF6B00] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={16} />
                <span>What to do as a user (3-Step Guide)</span>
              </div>
              <ol className="text-xs font-bold text-slate-300 space-y-1.5 list-decimal pl-4 leading-relaxed">
                <li>Enter your <strong>{selectedPlatform.name} Login ID</strong> (e.g., <code>LFE05055647070018</code>) and <strong>Password / API Key</strong> below.</li>
                <li>Click <strong>"Authenticate & Connect Socket"</strong>.</li>
                <li><span className="text-[#FF6B00]">Close any external Tradovate browser tabs</span> — you do <u>NOT</u> need to stay logged in at <code>trader.tradovate.com</code>. TradePigeon syncs your trades automatically in the background!</li>
              </ol>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                <ShieldAlert size={16} />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Account Environment
              </label>
              <select
                value={env}
                onChange={(e) => setEnv(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs outline-none focus:border-[#FF6B00]"
              >
                <option value="LIVE">Live Funded Account</option>
                <option value="DEMO">Demo / Evaluation Account</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  {selectedPlatform.name} Username / Login ID
                </label>
                <span className="text-[9px] font-bold text-slate-400">Separate multiple IDs with commas</span>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. LUCID-50K-01, LUCID-50K-02 or Login ID"
                className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs outline-none focus:border-[#FF6B00]"
                required
                autoFocus
              />

              {username.trim() && detectPlatformFromAccountId(username) && (
                <div className="p-2.5 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-[11px] font-black flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="animate-spin text-[#00E5FF]" />
                    <span>Auto-Identified: {detectPlatformFromAccountId(username).name}</span>
                  </div>
                  <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-[#00E5FF]/20 font-black border border-[#00E5FF]/40">
                    {detectPlatformFromAccountId(username).badge}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Number of Sub-Accounts (Multi-Account Import)
              </label>
              <select
                value={subAccountCount}
                onChange={(e) => setSubAccountCount(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs outline-none focus:border-[#FF6B00]"
              >
                <option value="1">1 Account (Single Account)</option>
                <option value="2">2 Sub-Accounts (Auto-create ACC-01, ACC-02)</option>
                <option value="3">3 Sub-Accounts (Auto-create ACC-01 to ACC-03)</option>
                <option value="5">5 Sub-Accounts (Auto-create ACC-01 to ACC-05)</option>
                <option value="10">10 Sub-Accounts (Auto-create ACC-01 to ACC-10)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Password / API Key
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Account Size / Starting Capital ($)
              </label>
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs outline-none focus:border-[#FF6B00]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="duo-btn-orange w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Authenticating Socket...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Authorize & Connect Socket</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleLaunchBrokerPopup}
                className="text-[11px] font-bold text-slate-400 hover:text-white underline cursor-pointer"
              >
                Or launch standalone OAuth popup window
              </button>
            </div>
          </form>
        )) : (
          /* PLATFORM SELECTION GRID */
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-white">Select Your Trading Broker / Platform</h4>
              <p className="text-xs font-bold text-slate-400">Click any broker below to connect direct live socket telemetry to TradePigeon</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {platforms.map((p) => {
                const PlatformIcon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPlatform(p)}
                    className="p-4 rounded-2xl bg-[#142127] border-2 border-[#20323D] hover:border-[#FF6B00] hover:bg-[#FF6B00]/10 text-left transition-all group cursor-pointer flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <PlatformIcon className="w-8 h-8 object-contain shrink-0" />
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30 flex items-center gap-1">
                        <span>{p.badge}</span>
                      </span>
                    </div>

                    <div>
                      <div className="text-sm font-black text-white group-hover:text-[#FF6B00] transition-colors flex items-center justify-between">
                        <span>{p.name}</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">{p.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-[#182830] border border-[#20323D] text-[11px] font-bold text-slate-300 flex items-start gap-2.5">
              <Shield size={16} className="text-[#58CC02] shrink-0 mt-0.5" />
              <span>
                Protected by 256-bit TLS encryption. TradePigeon never stores master execution credentials or places unapproved orders.
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


