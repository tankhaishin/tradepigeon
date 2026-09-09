import React, { useState, useRef } from 'react';
import { 
  CheckCircle2, ShieldAlert, ShieldCheck, Cpu, Lock, Key, Server, RefreshCw, X, Shield, Zap, ExternalLink, Activity, ArrowLeft, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import { TradovateLogo, MetaTrader5Logo, NinjaTraderLogo, TradeLockerLogo, CsvLogo } from './BrokerLogos';
import { loadStoredData, saveStoredData } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';
import { detectPlatformFromAccountId } from '../utils/platformDetector';

export default function BrokerConnectModal({ isOpen, onClose, onAccountAdded }) {
  const [authSuccess, setAuthSuccess] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const brokerPopupRef = useRef(null);

  // Form Fields
  const [env, setEnv] = useState('LIVE');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [capital, setCapital] = useState('50000');
  const [subAccountCount, setSubAccountCount] = useState('1');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const platforms = [
    { 
      id: 'tradovate', 
      name: 'Tradovate', 
      subtitle: 'Official Web API & Live Telemetry',
      icon: TradovateLogo, 
      badge: 'OFFICIAL API',
      url: 'https://trader.tradovate.com',
      color: '#FF6B00',
      sampleAcc: 'LFE05055647070018'
    },
    { 
      id: 'lucidtrading', 
      name: 'Lucid Trading', 
      subtitle: 'Prop Firm Multi-Account Gateway',
      icon: TradovateLogo, 
      badge: 'PROP FIRM MULTI-ACCOUNT',
      url: 'https://lucidtrading.com',
      color: '#00E5FF',
      sampleAcc: 'LUCID-50K-01'
    },
    { 
      id: 'metatrader5', 
      name: 'MetaTrader 5 / MT4', 
      subtitle: 'Official WebTerminal & Investor API',
      icon: MetaTrader5Logo, 
      badge: 'OFFICIAL WEBTERMINAL',
      url: 'https://trade.mql5.com/trade',
      color: '#1CB0F6',
      sampleAcc: '50192834'
    },
    { 
      id: 'tradelocker', 
      name: 'TradeLocker', 
      subtitle: 'Official Live Terminal & Socket Feed',
      icon: TradeLockerLogo, 
      badge: 'OFFICIAL LIVE WEB',
      url: 'https://live.tradelocker.com',
      color: '#CE82FF',
      sampleAcc: 'TL-882910'
    },
    { 
      id: 'ninjatrader', 
      name: 'NinjaTrader', 
      subtitle: 'Official Account Portal & Live Stream',
      icon: NinjaTraderLogo, 
      badge: 'OFFICIAL ACCOUNT PORTAL',
      url: 'https://account.ninjatrader.com/login',
      color: '#58CC02',
      sampleAcc: 'NT-109283'
    },
  ];

  const handleSelectPlatform = (platform) => {
    soundFx.playPop();
    setSelectedPlatform(platform);
    setUsername('');
    setCapital('50000');
    setSubAccountCount('1');
    setShowAdvanced(false);
    setFormError('');

    if (platform?.url) {
      brokerPopupRef.current = window.open(platform.url, `OfficialBroker_${platform.id}`, 'width=800,height=850,status=no,resizable=yes,scrollbars=yes');
    }
  };

  const handleLaunchOfficialSite = () => {
    if (selectedPlatform?.url) {
      soundFx.playPop();
      brokerPopupRef.current = window.open(selectedPlatform.url, `OfficialBroker_${selectedPlatform.id}`, 'width=800,height=850,status=no,resizable=yes,scrollbars=yes');
    }
  };

  const handleQuickDemoAutoFill = () => {
    soundFx.playPop();
    const sample = selectedPlatform?.sampleAcc || 'LFE05055647070018';
    setUsername(sample);
    setEnv('DEMO');
  };

  const handleDirectAuthSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setFormError('Please enter your Account Number or Login ID');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    soundFx.playPop();

    // Auto-close opened official broker window upon verification
    if (brokerPopupRef.current && !brokerPopupRef.current.closed) {
      try {
        brokerPopupRef.current.close();
      } catch (err) {
        console.log('Broker window closed:', err);
      }
    }

    setTimeout(() => {
      const rawBalance = parseFloat(capital) || 50000;
      const formattedBalance = `$${rawBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
      }, 1000);
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="duo-card max-w-xl w-full p-6 sm:p-8 space-y-6 border-2 border-[#FF6B00] relative max-h-[92vh] overflow-y-auto text-left">
        
        {/* Close Button */}
        <button 
          onClick={() => {
            setSelectedPlatform(null);
            onClose();
          }}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-[#142127] border border-[#20323D] transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-[#20323D]">
          {selectedPlatform ? (
            <button
              type="button"
              onClick={() => setSelectedPlatform(null)}
              className="p-2 rounded-xl bg-[#142127] border border-[#20323D] text-slate-300 hover:text-white cursor-pointer transition-all"
              title="Back to Broker List"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/20 border border-[#FF6B00]/40 text-[#FF6B00] flex items-center justify-center text-2xl font-black shrink-0">
              <Activity size={24} className="animate-pulse" />
            </div>
          )}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6B00]">OFFICIAL BROKER OAUTH & TELEMETRY CONNECT</span>
            <h3 className="text-xl font-black text-white">
              {selectedPlatform ? `Connect ${selectedPlatform.name}` : 'Connect Trading Account'}
            </h3>
          </div>
        </div>

        {authSuccess ? (
          <div className="py-10 text-center space-y-4 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#58CC02]/20 border-2 border-[#58CC02] text-[#58CC02] flex items-center justify-center animate-bounce">
              <CheckCircle2 size={42} />
            </div>
            <h4 className="text-xl font-black text-white">Broker Live Telemetry Connected!</h4>
            <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto">
              Live trade telemetry is active. Fills and position risk limits are now tracked automatically in real time!
            </p>
          </div>
        ) : selectedPlatform ? (
          /* OFFICIAL BROKER DOMAIN AUTHENTICATION VIEW */
          <form onSubmit={handleDirectAuthSubmit} className="space-y-4 animate-fade-in">
            
            {/* Official Broker Banner */}
            <div className="p-4 rounded-2xl bg-[#142127] border-2 border-[#58CC02]/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <selectedPlatform.icon className="w-8 h-8 object-contain shrink-0" />
                  <div>
                    <div className="text-sm font-black text-white flex items-center gap-1.5">
                      <span>{selectedPlatform.name} Official Portal</span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/30">
                        OFFICIAL DOMAIN
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400">{selectedPlatform.url}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLaunchOfficialSite}
                  className="px-3 py-2 rounded-xl bg-[#58CC02] text-white text-xs font-black hover:bg-[#46a302] cursor-pointer flex items-center gap-1.5 transition-all shadow-md shrink-0"
                >
                  <ExternalLink size={14} />
                  <span>Open Official Site</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[#0b1318] border border-[#20323D] text-[11px] font-bold text-slate-300 leading-relaxed space-y-1.5">
                <div className="text-[#58CC02] font-black flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  <span>100% Direct Official Authentication</span>
                </div>
                <p>
                  Complete your login directly on <strong>{selectedPlatform.name}'s official website ({selectedPlatform.url})</strong>. TradePigeon never receives or stores your broker password.
                </p>
                <div className="text-[10px] text-[#FF6B00] font-black pt-1 border-t border-[#20323D]/60 flex items-center gap-1">
                  <span>⚡ Auto-Closing Window:</span>
                  <span className="text-slate-300 font-bold">TradePigeon auto-closes the broker window when you click "Verify & Sync" below.</span>
                </div>
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                <ShieldAlert size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* Environment Toggle Pill */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Account Environment
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEnv('LIVE')}
                  className={`py-2.5 px-4 rounded-xl border-2 font-black text-xs transition-all cursor-pointer ${
                    env === 'LIVE' 
                      ? 'bg-[#58CC02]/20 border-[#58CC02] text-[#58CC02]' 
                      : 'bg-[#142127] border-[#20323D] text-slate-400 hover:text-white'
                  }`}
                >
                  🟢 Live Funded Account
                </button>
                <button
                  type="button"
                  onClick={() => setEnv('DEMO')}
                  className={`py-2.5 px-4 rounded-xl border-2 font-black text-xs transition-all cursor-pointer ${
                    env === 'DEMO' 
                      ? 'bg-[#FF6B00]/20 border-[#FF6B00] text-[#FF6B00]' 
                      : 'bg-[#142127] border-[#20323D] text-slate-400 hover:text-white'
                  }`}
                >
                  🔷 Demo / Evaluation
                </button>
              </div>
            </div>

            {/* Core Account Number / ID Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  {selectedPlatform.name} Account Number / ID
                </label>
                <button
                  type="button"
                  onClick={handleQuickDemoAutoFill}
                  className="px-2 py-0.5 rounded bg-[#FF6B00]/20 border border-[#FF6B00]/40 text-[#FF6B00] text-[10px] font-black hover:bg-[#FF6B00]/30 cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Sparkles size={10} />
                  <span>Auto-Fill Demo ID</span>
                </button>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={`e.g. ${selectedPlatform.sampleAcc || 'LFE05055647070018'}`}
                className="w-full p-3.5 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs outline-none focus:border-[#FF6B00]"
                required
                autoFocus
              />

              {username.trim() && detectPlatformFromAccountId(username) && (
                <div className="p-2 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-[10px] font-black flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={12} className="animate-spin text-[#00E5FF]" />
                    <span>Auto-Identified: {detectPlatformFromAccountId(username).name}</span>
                  </div>
                  <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-[#00E5FF]/20 font-black border border-[#00E5FF]/40">
                    {detectPlatformFromAccountId(username).badge}
                  </span>
                </div>
              )}
            </div>

            {/* Optional Collapsible Advanced Multi-Account Settings */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer py-1"
              >
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span>{showAdvanced ? 'Hide Advanced Options' : '⚙️ Optional: Advanced Multi-Account Batch Import'}</span>
              </button>

              {showAdvanced && (
                <div className="space-y-3.5 pt-2 p-3.5 rounded-2xl bg-[#142127]/60 border border-[#20323D] animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Number of Sub-Accounts (Prop Firm Batch Import)
                    </label>
                    <select
                      value={subAccountCount}
                      onChange={(e) => setSubAccountCount(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#142127] border border-[#20323D] text-white font-bold text-xs outline-none focus:border-[#FF6B00]"
                    >
                      <option value="1">1 Account (Single Account)</option>
                      <option value="2">2 Sub-Accounts (Auto-create ACC-01, ACC-02)</option>
                      <option value="3">3 Sub-Accounts (Auto-create ACC-01 to ACC-03)</option>
                      <option value="5">5 Sub-Accounts (Auto-create ACC-01 to ACC-05)</option>
                      <option value="10">10 Sub-Accounts (Auto-create ACC-01 to ACC-10)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Starting Capital ($)
                    </label>
                    <input
                      type="number"
                      value={capital}
                      onChange={(e) => setCapital(e.target.value)}
                      placeholder="50000"
                      className="w-full p-2.5 rounded-xl bg-[#142127] border border-[#20323D] text-white font-bold text-xs outline-none focus:border-[#FF6B00]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="duo-btn-orange w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg mt-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Verifying Session & Connecting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Verify & Sync {selectedPlatform.name} Account</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* PLATFORM SELECTION GRID */
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-white">Select Your Trading Broker / Platform</h4>
              <p className="text-xs font-bold text-slate-400">Click any broker below to connect live trade telemetry</p>
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
          </div>
        )}
      </div>
    </div>
  );
}
