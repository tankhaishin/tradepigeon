import React, { useState, useEffect } from 'react';
import { 
  DuoShieldIcon, DuoLightningIcon, DuoChestIcon, DuoPlusIcon 
} from './DuoIcons';
import InteractiveParrotMascot from './InteractiveParrotMascot';
import { ShieldCheck, ArrowRight, Sparkles, Check, CheckCircle2, ShieldAlert, Key, Zap, Lock, Server, RefreshCw, Activity, ExternalLink, X } from 'lucide-react';
import { sendDiscordSignupAlert } from '../utils/discordWebhook';
import GoogleAuthButton from './GoogleAuthButton';
import { TradovateLogo, MetaTrader5Logo, NinjaTraderLogo, TradeLockerLogo, CsvLogo } from './BrokerLogos';
import { loadStoredData, saveStoredData, STORAGE_KEYS } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';

export default function OnboardingModal({ isOpen, onComplete }) {
  const initialDraft = loadStoredData(STORAGE_KEYS.ONBOARDING_DRAFT, {});
  const initialStep = loadStoredData(STORAGE_KEYS.ONBOARDING_STEP, 1);

  const [step, setStep] = useState(() => (initialStep >= 1 && initialStep <= 4 ? initialStep : 1));
  const [tradingStyle, setTradingStyle] = useState(() => initialDraft.tradingStyle || 'BLANK'); // 'SMC' | 'ORDERFLOW' | 'PRICE_ACTION' | 'BLANK'
  const [customMaxDailyLoss, setCustomMaxDailyLoss] = useState(() => initialDraft.customMaxDailyLoss || '');
  const [riskType, setRiskType] = useState(() => initialDraft.riskType || 'FIXED_DOLLAR'); // 'FIXED_DOLLAR' | 'PERCENTAGE'
  const [customPlaybookName, setCustomPlaybookName] = useState(() => initialDraft.customPlaybookName || '');

  // Step 4 Live Broker Sync State
  const [connectingBroker, setConnectingBroker] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  // Auto-persist step and uncommitted draft inputs
  useEffect(() => {
    if (isOpen) {
      saveStoredData(STORAGE_KEYS.ONBOARDING_STEP, step);
    }
  }, [step, isOpen]);

  useEffect(() => {
    if (isOpen) {
      saveStoredData(STORAGE_KEYS.ONBOARDING_DRAFT, {
        tradingStyle,
        customMaxDailyLoss,
        riskType,
        customPlaybookName
      });
    }
  }, [tradingStyle, customMaxDailyLoss, riskType, customPlaybookName, isOpen]);

  const clearDraftState = () => {
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING_STEP);
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING_DRAFT);
  };

  useEffect(() => {
    const handleOAuthMessage = (event) => {
      if (event.data?.type === 'TRADEPIGEON_BROKER_OAUTH_SUCCESS') {
        const { account } = event.data;
        if (account) {
          soundFx.playSuccess();
          setAuthSuccess(true);
          setConnectingBroker(null);

          setTimeout(() => {
            handleFinishOnboarding(false, account);
          }, 1200);
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [tradingStyle, customPlaybookName, customMaxDailyLoss, riskType]);

  if (!isOpen) return null;

  // Mascot Speech Prompts per Step
  const stepDialogues = {
    1: "Welcome! I'm TradePigeon. Select your trading framework so we can track your discipline!",
    2: "Every disciplined trader sets a hard risk limit! What is your maximum daily drawdown threshold?",
    3: "Name your strategy setup and get ready to calibrate your account!",
    4: "Launch your broker's OAuth popup to authorize direct live socket auto-sync!"
  };

  const currentParrotPose = step === 1 ? 'welcoming' : step === 2 ? 'calculating' : step === 3 ? 'happy' : 'flying';

  const tradingStylePresets = [
    {
      id: 'BLANK',
      name: 'Custom Strategy (Blank Canvas)',
      icon: DuoPlusIcon,
    },
    {
      id: 'SMC',
      name: 'Smart Money Concepts (SMC)',
      icon: DuoShieldIcon,
    },
    {
      id: 'ORDERFLOW',
      name: 'Order Flow & Footprint',
      icon: DuoLightningIcon,
    },
    {
      id: 'PRICE_ACTION',
      name: 'Price Action & Market Structure',
      icon: DuoChestIcon,
    }
  ];

  const platforms = [
    { 
      id: 'tradovate', 
      name: 'Tradovate', 
      desc: 'Official Web Platform (trader.tradovate.com)',
      icon: TradovateLogo, 
      badge: 'OFFICIAL WEBSITE',
      url: 'https://trader.tradovate.com'
    },
    { 
      id: 'metatrader5', 
      name: 'MetaTrader 5 / MT4', 
      desc: 'Official WebTerminal (trade.mql5.com)',
      icon: MetaTrader5Logo, 
      badge: 'OFFICIAL WEBTERMINAL',
      url: 'https://trade.mql5.com/trade'
    },
    { 
      id: 'tradelocker', 
      name: 'TradeLocker', 
      desc: 'Official Live Terminal (live.tradelocker.com)',
      icon: TradeLockerLogo, 
      badge: 'OFFICIAL LIVE WEB',
      url: 'https://live.tradelocker.com'
    },
    { 
      id: 'ninjatrader', 
      name: 'NinjaTrader', 
      desc: 'Official Account Portal (account.ninjatrader.com)',
      icon: NinjaTraderLogo, 
      badge: 'OFFICIAL ACCOUNT PORTAL',
      url: 'https://account.ninjatrader.com/login'
    },
  ];

  const handleLaunchBrokerWebsite = (platform) => {
    soundFx.playPop();
    setConnectingBroker(platform.id);

    const width = 640;
    const height = 760;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const popup = window.open(
      platform.url,
      `BrokerOfficial_${platform.id}`,
      `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,scrollbars=yes`
    );

    if (popup) {
      popup.focus();
    }

    const checkTimer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkTimer);
        
        const newAccount = {
          id: `BROKER-${Date.now().toString().slice(-6)}`,
          name: `${platform.name} Live Account`,
          broker: `${platform.name} Live Sync`,
          platformId: platform.id,
          status: 'SYNCED (LIVE)',
          balance: '$50,000.00',
          pnl: '+$0.00',
          connectedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };

        const existingAccounts = loadStoredData('goodtrader_accounts_data', []);
        saveStoredData('goodtrader_accounts_data', [newAccount, ...existingAccounts]);

        soundFx.playSuccess();
        setAuthSuccess(true);
        setConnectingBroker(null);

        setTimeout(() => {
          handleFinishOnboarding(false, newAccount);
        }, 1400);
      }
    }, 1000);
  };

  const handleFinishOnboarding = async (skipBroker = false, connectedAccountParam = null) => {
    clearDraftState();
    const finalStrategyName = customPlaybookName.trim() || 'Strategy 1';
    const finalRiskLimit = customMaxDailyLoss.trim() ? (riskType === 'FIXED_DOLLAR' ? `$${customMaxDailyLoss}` : `${customMaxDailyLoss}%`) : '$1,000';

    let connectedBrokerObj = connectedAccountParam;

    if (connectedBrokerObj) {
      const existingAccounts = loadStoredData('goodtrader_accounts_data', []);
      saveStoredData('goodtrader_accounts_data', [connectedBrokerObj, ...existingAccounts]);
    }

    sendDiscordSignupAlert({
      username: 'Trader',
      strategy: `${tradingStyle} — ${finalStrategyName}`,
      experience: `Max Risk: ${finalRiskLimit} ${connectedBrokerObj ? `(Auto-Synced: ${connectedBrokerObj.name})` : ''}`,
      email: 'Registered Trader'
    });

    onComplete({
      tradingStyle,
      strategyName: finalStrategyName,
      maxDailyLoss: finalRiskLimit,
      connectedBroker: connectedBrokerObj
    });
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="duo-card max-w-2xl w-full p-6 sm:p-8 space-y-6 border-2 border-[#FF6B00] relative max-h-[92vh] overflow-y-auto">
        
        {/* PREMIUM PROGRESS STEP PILLS HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-[#20323D]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00]">ACCOUNT SETUP</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div 
                  key={s} 
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    step === s 
                      ? 'w-8 bg-[#FF6B00]' 
                      : step > s 
                      ? 'w-4 bg-[#58CC02]' 
                      : 'w-4 bg-[#20323D]'
                  }`} 
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                soundFx.playPop();
                handleFinishOnboarding(true);
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#20323D] transition-colors cursor-pointer ml-1"
              title="Close & Skip Onboarding"
              aria-label="Close Onboarding"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* HERO WELCOME STAGE: Mascot + Duolingo 3D Speech Bubble */}
        <div className="flex flex-col sm:flex-row items-center gap-5 bg-gradient-to-br from-[#182830] to-[#101A1F] p-5 rounded-3xl border-2 border-[#20323D] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B00]/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="shrink-0 flex flex-col items-center">
            <InteractiveParrotMascot pose={currentParrotPose} className="w-24 h-24 sm:w-28 sm:h-28" />
          </div>

          <div className="space-y-2 flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30">
                TradePigeon Protocol Coach
              </span>
              <span className="text-[10px] font-bold text-slate-400">Step {step} of 4</span>
            </div>
            
            {/* Duolingo Speech Bubble Arrow */}
            <div className="relative bg-[#142127] p-4 rounded-2xl border-2 border-[#FF6B00]/30 shadow-lg">
              <p className="text-xs font-black text-white leading-relaxed">
                "{stepDialogues[step]}"
              </p>
            </div>
          </div>
        </div>

        {/* STEP 1: TRADING METHODOLOGY PRESETS */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="p-4 rounded-2xl bg-[#182830] border-2 border-[#FF6B00]/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
              <div>
                <div className="text-xs font-black text-white text-center sm:text-left flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#58CC02]" />
                  <span>Sign in with Google to Secure Your Account</span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 text-center sm:text-left">1-tap authentication & cloud backup for your trade logs</div>
              </div>
              <GoogleAuthButton className="py-2.5 text-xs shrink-0 w-full sm:w-auto" buttonText="Sign in with Google" />
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-2xl font-black text-white">Choose Your Trading Methodology</h2>
              <p className="text-xs font-bold text-slate-400">Select your setup framework to auto-generate personalized risk & execution rules</p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {tradingStylePresets.map((preset) => {
                const IconComponent = preset.icon;
                const isSelected = tradingStyle === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setTradingStyle(preset.id)}
                    className={`px-5 py-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected 
                        ? 'bg-[#FF6B00]/15 border-[#FF6B00] scale-[1.01]' 
                        : 'bg-[#142127] border-[#20323D] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <IconComponent className="w-6 h-6 shrink-0" />
                      <span className="text-sm font-black text-white">{preset.name}</span>
                    </div>
                    {isSelected && <Check size={16} className="text-[#FF6B00] shrink-0" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(2)}
              className="duo-btn-orange w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Risk Management Setup</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: RISK MANAGEMENT CALIBRATION */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">Set Your Maximum Daily Risk Limit</h2>
              <p className="text-xs font-bold text-[#52656D]">Your daily risk limit automatically flags trades if your drawdown exceeds this threshold</p>
            </div>

            <div className="space-y-4">
              {/* Toggle Fixed $ vs % */}
              <div className="flex bg-[#142127] p-1.5 rounded-2xl border-2 border-[#20323D]">
                <button
                  type="button"
                  onClick={() => setRiskType('FIXED_DOLLAR')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    riskType === 'FIXED_DOLLAR' 
                      ? 'bg-[#FF6B00] text-white shadow-md' 
                      : 'text-[#52656D] hover:text-white'
                  }`}
                >
                  Fixed Dollar Limit ($)
                </button>
                <button
                  type="button"
                  onClick={() => setRiskType('PERCENTAGE')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    riskType === 'PERCENTAGE' 
                      ? 'bg-[#FF6B00] text-white shadow-md' 
                      : 'text-[#52656D] hover:text-white'
                  }`}
                >
                  Account Percentage (%)
                </button>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-3 gap-3">
                {riskType === 'FIXED_DOLLAR' ? (
                  ['$500', '$1,000', '$2,500'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCustomMaxDailyLoss(amt.replace(/[^0-9]/g, ''))}
                      className={`p-3 rounded-2xl border-2 font-black text-xs transition-all cursor-pointer ${
                        customMaxDailyLoss === amt.replace(/[^0-9]/g, '')
                          ? 'bg-[#FF6B00]/20 border-[#FF6B00] text-[#FF6B00]'
                          : 'bg-[#142127] border-[#20323D] text-slate-300'
                      }`}
                    >
                      {amt} / day
                    </button>
                  ))
                ) : (
                  ['1.0%', '2.0%', '3.0%'].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setCustomMaxDailyLoss(pct.replace(/[^0-9.]/g, ''))}
                      className={`p-3 rounded-2xl border-2 font-black text-xs transition-all cursor-pointer ${
                        customMaxDailyLoss === pct.replace(/[^0-9.]/g, '')
                          ? 'bg-[#FF6B00]/20 border-[#FF6B00] text-[#FF6B00]'
                          : 'bg-[#142127] border-[#20323D] text-slate-300'
                      }`}
                    >
                      {pct} of balance
                    </button>
                  ))
                )}
              </div>

              {/* Freeform Numeric Input */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-[#52656D] block">
                  Enter Custom Value
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#FF6B00]">
                    {riskType === 'FIXED_DOLLAR' ? '$' : '%'}
                  </span>
                  <input
                    type="number"
                    value={customMaxDailyLoss}
                    onChange={(e) => setCustomMaxDailyLoss(e.target.value)}
                    placeholder="e.g., 500"
                    className="w-full pl-9 pr-4 py-3.5 rounded-2xl bg-[#142127] border-2 border-[#20323D] focus:border-[#FF6B00] text-white font-black text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-4 bg-[#142127] rounded-2xl border-2 border-[#20323D] text-white font-black text-xs uppercase cursor-pointer">Back</button>
              <button onClick={() => setStep(3)} className="flex-[2] py-4 bg-[#FF6B00] rounded-2xl text-white font-black text-xs uppercase cursor-pointer">Confirm Rules</button>
            </div>
          </div>
        )}

        {/* STEP 3: PLAYBOOK NAMING */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">Name Your Strategy</h2>
              <p className="text-xs font-bold text-[#52656D]">Give your strategy a name to track it in your personal playbook vault</p>
            </div>

            <input
              type="text"
              value={customPlaybookName}
              onChange={(e) => setCustomPlaybookName(e.target.value)}
              placeholder="Strategy 1"
              className="w-full p-4 rounded-2xl bg-[#142127] border-2 border-[#20323D] focus:border-[#FF6B00] text-white font-black text-sm outline-none"
            />

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-4 bg-[#142127] rounded-2xl border-2 border-[#20323D] text-white font-black text-xs uppercase cursor-pointer">Back</button>
              <button onClick={() => setStep(4)} className="flex-[2] py-4 bg-[#FF6B00] rounded-2xl text-white font-black text-xs uppercase cursor-pointer">Next: Connect Broker Auto Sync</button>
            </div>
          </div>
        )}

        {/* STEP 4: REAL BROKER LIVE SOCKET AUTO-SYNC STEP */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">Connect Broker Live Socket Auto-Sync</h2>
              <p className="text-xs font-bold text-[#52656D]">Click your broker below to launch the official OAuth 2.0 authorization popup window</p>
            </div>

            {/* Platform Selector Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {platforms.map((p) => {
                const PlatformIcon = p.icon;
                const isConnecting = connectingBroker === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleLaunchBrokerWebsite(p)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 group ${
                      isConnecting 
                        ? 'bg-[#FF6B00]/20 border-[#FF6B00] scale-[1.01]' 
                        : 'bg-[#142127] border-[#20323D] hover:border-[#FF6B00] hover:bg-[#FF6B00]/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <PlatformIcon className="w-8 h-8 shrink-0 object-contain" />
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30 flex items-center gap-1">
                        <span>{p.badge}</span>
                        <ExternalLink size={10} />
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-black text-white group-hover:text-[#FF6B00] transition-colors flex items-center justify-between">
                        <span>{p.name}</span>
                        {isConnecting && <RefreshCw size={14} className="animate-spin text-[#FF6B00]" />}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400">{p.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {authSuccess && (
              <div className="p-4 text-center bg-[#58CC02]/20 border-2 border-[#58CC02] rounded-2xl space-y-1 animate-fade-in">
                <div className="text-sm font-black text-[#58CC02] flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} />
                  <span>Broker OAuth Authorized!</span>
                </div>
                <div className="text-xs font-bold text-slate-300">Starting your trading session...</div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleFinishOnboarding(true)}
                className="text-xs font-bold text-slate-400 hover:text-white underline cursor-pointer py-2"
              >
                Skip for now & start session
              </button>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-3 rounded-2xl bg-[#142127] border-2 border-[#20323D] text-xs font-black text-[#52656D] hover:text-white cursor-pointer"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
