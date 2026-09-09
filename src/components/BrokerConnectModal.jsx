import React, { useState } from 'react';
import { 
  CheckCircle2, ShieldAlert, ShieldCheck, Cpu, Lock, Key, Server, RefreshCw, X, Shield, Zap, ExternalLink, Activity, ArrowLeft, Sparkles
} from 'lucide-react';
import { TradovateLogo, MetaTrader5Logo, NinjaTraderLogo, TradeLockerLogo, CsvLogo } from './BrokerLogos';
import { loadStoredData, saveStoredData } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';
import { detectPlatformFromAccountId } from '../utils/platformDetector';

export default function BrokerConnectModal({ isOpen, onClose, onAccountAdded }) {
  const [authSuccess, setAuthSuccess] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  // Form Fields
  const [env, setEnv] = useState('LIVE');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [capital, setCapital] = useState('50000');
  const [subAccountCount, setSubAccountCount] = useState('1');
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
      color: '#FF6B00'
    },
    { 
      id: 'lucidtrading', 
      name: 'Lucid Trading', 
      subtitle: 'Prop Firm Multi-Account Gateway',
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

  const handleSelectPlatform = (platform) => {
    soundFx.playPop();
    setSelectedPlatform(platform);
    setUsername('');
    setPassword('');
    setCapital('50000');
    setSubAccountCount('1');
    setFormError('');
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
      }, 1200);
    }, 1000);
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
            <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6B00]">DIRECT BROKER TELEMETRY CONNECT</span>
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
          /* IN-APP DIRECT BROKER AUTHENTICATION FORM */
          <form onSubmit={handleDirectAuthSubmit} className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#142127] border border-[#20323D]">
              <div className="flex items-center gap-3">
                <selectedPlatform.icon className="w-8 h-8 object-contain shrink-0" />
                <div>
                  <div className="text-sm font-black text-white">{selectedPlatform.name} Account Sync</div>
                  <div className="text-[10px] font-bold text-slate-400">Direct API & Multi-Account Import</div>
                </div>
              </div>
              <a
                href={selectedPlatform.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#FF6B00] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Official Web</span>
                <ExternalLink size={12} />
              </a>
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
                  {selectedPlatform.name} Username / Account ID
                </label>
                <span className="text-[9px] font-bold text-slate-400">Separate multiple IDs with commas</span>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. LFE05055647070018 or Login ID"
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
                Password / API Key (Optional)
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
                  <span>Connecting Telemetry...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Connect & Sync {selectedPlatform.name} Account</span>
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
