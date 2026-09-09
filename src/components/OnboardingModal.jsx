import React, { useState, useEffect, useRef } from 'react';
import { 
  DuoShieldIcon, DuoLightningIcon, DuoChestIcon, DuoPlusIcon 
} from './DuoIcons';
import InteractiveParrotMascot from './InteractiveParrotMascot';
import { ShieldCheck, ArrowRight, Sparkles, Check, CheckCircle2, ShieldAlert, Key, Zap, Lock, Server, RefreshCw, Activity, ExternalLink, X, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { sendDiscordSignupAlert } from '../utils/discordWebhook';
import GoogleAuthButton from './GoogleAuthButton';
import { TradovateLogo, MetaTrader5Logo, NinjaTraderLogo, TradeLockerLogo, CsvLogo } from './BrokerLogos';
import { loadStoredData, saveStoredData, STORAGE_KEYS } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';
import { detectPlatformFromAccountId } from '../utils/platformDetector';

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
      desc: 'Official Web API & Direct Socket',
      icon: TradovateLogo, 
      badge: 'OFFICIAL API',
      url: 'https://trader.tradovate.com',
      sampleAcc: 'LFE05055647070018'
    },
    { 
      id: 'lucidtrading', 
      name: 'Lucid Trading', 
      desc: 'Prop Firm Multi-Account Gateway',
      icon: TradovateLogo, 
      badge: 'PROP FIRM MULTI-ACCOUNT',
      url: 'https://lucidtrading.com',
      sampleAcc: 'LUCID-50K-01'
    },
    { 
      id: 'metatrader5', 
      name: 'MetaTrader 5 / MT4', 
      desc: 'Official WebTerminal & Investor API',
      icon: MetaTrader5Logo, 
      badge: 'OFFICIAL WEBTERMINAL',
      url: 'https://trade.mql5.com/trade',
      sampleAcc: '50192834'
    },
    { 
      id: 'tradelocker', 
      name: 'TradeLocker', 
      desc: 'Official Live Terminal & Socket Feed',
      icon: TradeLockerLogo, 
      badge: 'OFFICIAL LIVE WEB',
      url: 'https://live.tradelocker.com',
      sampleAcc: 'TL-882910'
    },
    { 
      id: 'ninjatrader', 
      name: 'NinjaTrader', 
      desc: 'Official Account Portal & Live Stream',
      icon: NinjaTraderLogo, 
      badge: 'OFFICIAL ACCOUNT PORTAL',
      url: 'https://account.ninjatrader.com/login',
      sampleAcc: 'NT-109283'
    },
  ];

  const handleSelectPlatform = (platform) => {
    soundFx.playPop();
    setSelectedPlatform(platform);
    setUsername(platform.sampleAcc || 'LFE05055647070018');
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
      setFormError('Please enter your Account Username or Login ID');
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

      soundFx.playSuccess();
      setIsSubmitting(false);
      setAuthSuccess(true);

      setTimeout(() => {
        handleFinishOnboarding(false, createdAccounts[0], createdAccounts);
      }, 1400);
    }, 1200);
  };

  const handleFinishOnboarding = async (skipBroker = false, connectedAccountParam = null, allAccountsParam = null) => {
    clearDraftState();
    const finalStrategyName = customPlaybookName.trim() || 'Strategy 1';
    const finalRiskLimit = customMaxDailyLoss.trim() ? (riskType === 'FIXED_DOLLAR' ? `$${customMaxDailyLoss}` : `${customMaxDailyLoss}%`) : '$1,000';

    const accountsToSave = allAccountsParam || (connectedAccountParam ? [connectedAccountParam] : []);
    const connectedBrokerObj = connectedAccountParam || (accountsToSave.length > 0 ? accountsToSave[0] : null);

    if (accountsToSave.length > 0) {
      const existingAccounts = loadStoredData('goodtrader_accounts_data', []);
      saveStoredData('goodtrader_accounts_data', [...accountsToSave, ...existingAccounts]);
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
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white">
                  {selectedPlatform ? `Authorize ${selectedPlatform.name}` : 'Connect Broker Live Socket Auto-Sync'}
                </h2>
                {selectedPlatform && (
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform(null)}
                    className="p-1.5 rounded-xl bg-[#142127] border border-[#20323D] text-slate-300 hover:text-white cursor-pointer transition-all flex items-center gap-1 text-xs font-bold"
                  >
                    <ArrowLeft size={14} />
                    <span>Change Broker</span>
                  </button>
                )}
              </div>
              <p className="text-xs font-bold text-[#52656D]">
                {selectedPlatform 
                  ? 'Enter your account credentials to connect live socket sync in-app' 
                  : 'Select your broker below to authorize direct live socket auto-sync'}
              </p>
            </div>

            {authSuccess ? (
              <div className="p-4 text-center bg-[#58CC02]/20 border-2 border-[#58CC02] rounded-2xl space-y-1 animate-fade-in">
                <div className="text-sm font-black text-[#58CC02] flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} />
                  <span>Broker Live Telemetry Connected!</span>
                </div>
                <div className="text-xs font-bold text-slate-300">Completing onboarding setup...</div>
              </div>
            ) : selectedPlatform ? (
              /* OFFICIAL BROKER DOMAIN AUTHENTICATION VIEW */
              <form onSubmit={handleDirectAuthSubmit} className="space-y-4 animate-fade-in text-left">
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
                    <div className="text-[#58CC02] font-black flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck size={14} />
                        <span>1-Click Session Auto-Sync</span>
                      </span>
                      <span className="text-[10px] font-mono text-white bg-[#58CC02]/20 px-2 py-0.5 rounded border border-[#58CC02]/40">
                        {username || selectedPlatform.sampleAcc}
                      </span>
                    </div>
                    <p>
                      Sign in on <strong>{selectedPlatform.name}'s official portal ({selectedPlatform.url})</strong>. TradePigeon auto-links your session ID <strong>{username || selectedPlatform.sampleAcc}</strong> — zero password entry needed!
                    </p>
                    <div className="text-[10px] text-[#FF6B00] font-black pt-1 border-t border-[#20323D]/60 flex items-center gap-1">
                      <span>⚡ 1-Click Sync:</span>
                      <span className="text-slate-300 font-bold">Click the big button below to finalize sync and auto-close the broker window.</span>
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
                    <span className="text-[9px] font-bold text-[#58CC02] flex items-center gap-1">
                      <CheckCircle2 size={10} />
                      <span>Auto-Detected ID</span>
                    </span>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={`e.g. ${selectedPlatform.sampleAcc || 'LFE05055647070018'}`}
                    className="w-full p-3.5 rounded-xl bg-[#142127] border-2 border-[#58CC02]/50 text-white font-black text-xs outline-none focus:border-[#58CC02]"
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
                    <div className="space-y-3.5 pt-2 p-[#142127]/60 border border-[#20323D] animate-fade-in p-3.5 rounded-2xl">
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
                  className="duo-btn-green w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Syncing Account {username}...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      <span>⚡ 1-Click Sync {selectedPlatform.name} ({username || 'Account'})</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Platform Selector Grid */
              <div className="grid grid-cols-2 gap-2.5">
                {platforms.map((p) => {
                  const PlatformIcon = p.icon;
                  const isConnecting = connectingBroker === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPlatform(p)}
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
                          <Zap size={10} />
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
                  onClick={() => {
                    if (selectedPlatform) {
                      setSelectedPlatform(null);
                    } else {
                      setStep(3);
                    }
                  }}
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
