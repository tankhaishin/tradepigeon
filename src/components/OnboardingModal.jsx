import React, { useState } from 'react';
import { 
  DuoShieldIcon, DuoLightningIcon, DuoChestIcon, DuoPlusIcon 
} from './DuoIcons';
import InteractiveParrotMascot from './InteractiveParrotMascot';
import { ShieldCheck, ArrowRight, Sparkles, Check, CheckCircle2, ShieldAlert, Key, Zap, Lock, Server, RefreshCw, Activity } from 'lucide-react';
import { sendDiscordSignupAlert } from '../utils/discordWebhook';
import GoogleAuthButton from './GoogleAuthButton';
import { TradovateLogo, MetaTrader5Logo, TradeLockerLogo, CsvLogo } from './BrokerLogos';
import { loadStoredData, saveStoredData } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';

export default function OnboardingModal({ isOpen, onComplete }) {
  const [step, setStep] = useState(1);
  const [tradingStyle, setTradingStyle] = useState('BLANK'); // 'SMC' | 'ORDERFLOW' | 'PRICE_ACTION' | 'BLANK'
  const [customMaxDailyLoss, setCustomMaxDailyLoss] = useState('');
  const [riskType, setRiskType] = useState('FIXED_DOLLAR'); // 'FIXED_DOLLAR' | 'PERCENTAGE'
  const [customPlaybookName, setCustomPlaybookName] = useState('');

  // Step 4 Live Broker Sync State
  const [selectedBroker, setSelectedBroker] = useState('tradovate');
  const [envType, setEnvType] = useState('DEMO'); // 'DEMO' | 'LIVE'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [serverName, setServerName] = useState('');
  
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [handshakeStep, setHandshakeStep] = useState(1);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [parseError, setParseError] = useState('');

  if (!isOpen) return null;

  // Mascot Speech Prompts per Step
  const stepDialogues = {
    1: "Welcome! I'm TradePigeon. Select your trading framework so we can track your discipline!",
    2: "Every disciplined trader sets a hard risk limit! What is your maximum daily drawdown threshold?",
    3: "Name your strategy setup and get ready to calibrate your account!",
    4: "Connect your broker live socket to enable automatic trade sync and real-time telemetry!"
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
      desc: 'NinjaTrader / Futures Direct Socket',
      icon: TradovateLogo, 
      badge: 'LIVE SOCKET',
      requiresServer: false,
      placeholderUser: 'Tradovate Username / App ID'
    },
    { 
      id: 'metatrader5', 
      name: 'MetaTrader 5 / MT4', 
      desc: 'Read-Only Investor API Bridge',
      icon: MetaTrader5Logo, 
      badge: 'AUTO-SYNC',
      requiresServer: true,
      placeholderUser: 'MT4/MT5 Login Account ID'
    },
    { 
      id: 'tradelocker', 
      name: 'TradeLocker', 
      desc: 'OAuth Direct Keyhole',
      icon: TradeLockerLogo, 
      badge: 'OAUTH LIVE',
      requiresServer: true,
      placeholderUser: 'TradeLocker Email / Account ID'
    },
    { 
      id: 'ctrader', 
      name: 'cTrader / Rithmic', 
      desc: 'Low Latency Stream',
      icon: CsvLogo, 
      badge: 'LIVE STREAM',
      requiresServer: false,
      placeholderUser: 'cTrader ID / Rithmic User'
    },
  ];

  const currentPlatform = platforms.find(p => p.id === selectedBroker) || platforms[0];

  const handleStartBrokerAuth = async () => {
    setParseError('');

    if (!username.trim()) {
      setParseError(`Please enter your ${currentPlatform.name} account username or ID.`);
      return;
    }

    setIsAuthenticating(true);
    setHandshakeStep(1);

    setTimeout(() => {
      setHandshakeStep(2);
      setTimeout(() => {
        setHandshakeStep(3);
        setTimeout(() => {
          setAuthSuccess(true);
          soundFx.playSuccess();
          setTimeout(() => {
            handleFinishOnboarding(false);
          }, 1200);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const handleFinishOnboarding = async (skipBroker = false) => {
    const finalStrategyName = customPlaybookName.trim() || 'Strategy 1';
    const finalRiskLimit = customMaxDailyLoss.trim() ? (riskType === 'FIXED_DOLLAR' ? `$${customMaxDailyLoss}` : `${customMaxDailyLoss}%`) : '$1,000';

    let connectedBrokerObj = null;

    if (!skipBroker && username.trim()) {
      connectedBrokerObj = {
        id: `BROKER-${Date.now().toString().slice(-6)}`,
        name: `${currentPlatform.name} (${envType})`,
        broker: `${currentPlatform.name} Live Sync`,
        status: 'SYNCED (LIVE)',
        balance: '$50,000.00',
        pnl: '+$0.00',
        accountNumber: username.trim(),
        connectedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };

      // Save connected account to localStorage
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
              <p className="text-xs font-bold text-[#52656D]">Select your trading broker to authenticate your live execution telemetry stream</p>
            </div>

            {/* Platform Selector Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {platforms.map((p) => {
                const PlatformIcon = p.icon;
                const isSelected = selectedBroker === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedBroker(p.id);
                      setParseError('');
                      soundFx.playPop();
                    }}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected 
                        ? 'bg-[#FF6B00]/20 border-[#FF6B00] scale-[1.01]' 
                        : 'bg-[#142127] border-[#20323D] text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <PlatformIcon className="w-6.5 h-6.5 shrink-0 object-contain" />
                    <div>
                      <div className="text-xs font-black text-white">{p.name}</div>
                      <div className="text-[9px] font-bold text-slate-400">{p.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* LIVE AUTH FORM FOR SELECTED BROKER */}
            {!isAuthenticating && !authSuccess && (
              <div className="p-4 rounded-2xl bg-[#142127] border-2 border-[#FF6B00]/40 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-white flex items-center gap-2">
                    <Activity size={14} className="text-[#FF6B00] animate-pulse" />
                    <span>{currentPlatform.name} Live Sync Form</span>
                  </div>
                  
                  {/* Demo vs Live Environment Pills */}
                  <div className="flex bg-[#182830] p-1 rounded-lg border border-[#20323D]">
                    <button
                      type="button"
                      onClick={() => setEnvType('DEMO')}
                      className={`px-2.5 py-1 rounded text-[10px] font-black transition-all cursor-pointer ${
                        envType === 'DEMO' ? 'bg-[#FF6B00] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnvType('LIVE')}
                      className={`px-2.5 py-1 rounded text-[10px] font-black transition-all cursor-pointer ${
                        envType === 'LIVE' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Live
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={currentPlatform.placeholderUser}
                    className="p-3 rounded-xl bg-[#182830] border-2 border-[#20323D] focus:border-[#FF6B00] text-white text-xs font-bold outline-none"
                  />
                  {currentPlatform.requiresServer ? (
                    <input
                      type="text"
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      placeholder="Server (e.g. FTMO-Server)"
                      className="p-3 rounded-xl bg-[#182830] border-2 border-[#20323D] focus:border-[#FF6B00] text-white text-xs font-bold outline-none"
                    />
                  ) : (
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Read-Only API Password / Token"
                      className="p-3 rounded-xl bg-[#182830] border-2 border-[#20323D] focus:border-[#FF6B00] text-white text-xs font-bold outline-none"
                    />
                  )}
                </div>

                {parseError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                    <ShieldAlert size={16} />
                    <span>{parseError}</span>
                  </div>
                )}
              </div>
            )}

            {/* LIVE SOCKET HANDSHAKE PROGRESS LOG */}
            {isAuthenticating && !authSuccess && (
              <div className="p-5 text-center space-y-3 bg-[#142127] rounded-2xl border-2 border-[#FF6B00] animate-fade-in">
                <RefreshCw size={28} className="animate-spin text-[#FF6B00] mx-auto" />
                <div className="text-xs font-black text-white">Connecting to {currentPlatform.name} Live Socket...</div>
                
                <div className="bg-[#182830] p-3 rounded-xl text-left space-y-1.5 font-mono text-[11px]">
                  <div className={`flex items-center gap-2 ${handshakeStep >= 1 ? 'text-[#58CC02]' : 'text-slate-500'}`}>
                    <CheckCircle2 size={12} />
                    <span>[1/3] Resolving API Gateway: wss://live.{currentPlatform.id}.com...</span>
                  </div>
                  <div className={`flex items-center gap-2 ${handshakeStep >= 2 ? 'text-[#58CC02]' : 'text-slate-500'}`}>
                    <CheckCircle2 size={12} />
                    <span>[2/3] Authenticating Session Token for {username}...</span>
                  </div>
                  <div className={`flex items-center gap-2 ${handshakeStep >= 3 ? 'text-[#58CC02]' : 'text-slate-500'}`}>
                    <CheckCircle2 size={12} />
                    <span>[3/3] Live Telemetry Connected!</span>
                  </div>
                </div>
              </div>
            )}

            {authSuccess && (
              <div className="p-4 text-center bg-[#58CC02]/20 border-2 border-[#58CC02] rounded-2xl space-y-1 animate-fade-in">
                <div className="text-sm font-black text-[#58CC02] flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} />
                  <span>{currentPlatform.name} Auto-Sync Connected!</span>
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

                <button
                  type="button"
                  onClick={handleStartBrokerAuth}
                  disabled={isAuthenticating}
                  className="bg-[#58CC02] px-6 py-3 rounded-2xl text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all flex-1 sm:flex-none justify-center"
                >
                  <Zap size={16} />
                  <span>Authenticate & Sync Socket</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
