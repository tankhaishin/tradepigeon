import React, { useState } from 'react';
import { 
  DuoShieldIcon, DuoLightningIcon, DuoChestIcon, DuoProfileIcon, DuoLayersIcon, 
  DuoChartIcon, DuoPlusIcon, DuoGemIcon, DuoBullseyeIcon, DuoTerminalIcon, DuoKeyholeIcon, DuoFileSheetIcon 
} from './DuoIcons';
import InteractiveParrotMascot from './InteractiveParrotMascot';
import { ShieldCheck, ArrowRight, Sparkles, Check } from 'lucide-react';
import { TradovateLogo, MetaTrader5Logo, NinjaTraderLogo, TradeLockerLogo, CsvLogo } from './BrokerLogos';
import { sendDiscordSignupAlert } from '../utils/discordWebhook';
import GoogleAuthButton from './GoogleAuthButton';

export default function OnboardingModal({ isOpen, onComplete }) {
  const [step, setStep] = useState(1);
  const [tradingStyle, setTradingStyle] = useState('BLANK'); // 'SMC' | 'ORDERFLOW' | 'PRICE_ACTION' | 'BLANK'
  const [customMaxDailyLoss, setCustomMaxDailyLoss] = useState('');
  const [riskType, setRiskType] = useState('FIXED_DOLLAR'); // 'FIXED_DOLLAR' | 'PERCENTAGE'
  const [customPlaybookName, setCustomPlaybookName] = useState('');

  const [selectedPlatform, setSelectedPlatform] = useState('tradovate');

  if (!isOpen) return null;

  // Mascot Speech Prompts per Step
  const stepDialogues = {
    1: "Welcome! I'm TradePigeon. Let me help you set up your edge framework so we can track your discipline!",
    2: "Every top prop trader sets a hard risk limit! What is your maximum daily drawdown threshold?",
    3: "Awesome! Let's name your strategy so we can automatically verify your execution discipline!",
    4: "Final step! Select your trading platform to enable real-time discipline telemetry and auto-sync!"
  };

  // 3 Natural Onboarding Poses: 'welcoming' (wing wave) -> 'calculating' (3D glasses & math) -> 'flying' (3D soaring flight)
  const currentParrotPose = step === 1 ? 'welcoming' : step === 2 ? 'calculating' : step === 3 ? 'happy' : 'flying';

  // Multi-style institutional presets using 3D Duolingo vector icons from DuoIcons.jsx
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

  const handleFinishOnboarding = async () => {
    // Clean, universal default without speculative guesses
    const finalStrategyName = customPlaybookName.trim() || 'Strategy 1';
    const finalRiskLimit = customMaxDailyLoss.trim() ? (riskType === 'FIXED_DOLLAR' ? `$${customMaxDailyLoss}` : `${customMaxDailyLoss}%`) : '$1,000';

    // Dispatch Business Intelligence Discord Webhook Notification for New Signups
    sendDiscordSignupAlert({
      username: 'Trader',
      strategy: `${tradingStyle} — ${finalStrategyName}`,
      experience: `Platform: ${selectedPlatform.toUpperCase()} (Max Risk: ${finalRiskLimit})`,
      email: 'Registered Trader'
    });

    onComplete({
      tradingStyle,
      strategyName: finalStrategyName,
      maxDailyLoss: finalRiskLimit,
      brokerPlatform: selectedPlatform
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
              <button onClick={() => setStep(4)} className="flex-[2] py-4 bg-[#FF6B00] rounded-2xl text-white font-black text-xs uppercase cursor-pointer">Next Step</button>
            </div>
          </div>
        )}

        {/* STEP 4: BROKER SYNC */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">Connect Your Broker</h2>
              <p className="text-xs font-bold text-[#52656D]">Select your trading platform to enable real-time discipline verification & trade logs</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'tradovate', name: 'Tradovate / NinjaTrader', desc: 'Direct Live Socket Sync', icon: TradovateLogo, badge: 'RECOMMENDED' },
                { id: 'metatrader5', name: 'MetaTrader 5 (MT5)', desc: 'Cloud Read-Only Bridge', icon: MetaTrader5Logo, badge: 'POPULAR' },
                { id: 'metatrader4', name: 'MetaTrader 4 (MT4)', desc: 'Investor Read-Only Sync', icon: MetaTrader5Logo, badge: 'ACTIVE' },
                { id: 'tradelocker', name: 'TradeLocker', desc: 'OAuth Security Keyhole', icon: TradeLockerLogo, badge: 'NEW' },
                { id: 'csv', name: 'Manual CSV / HTML', desc: 'Statement Upload Parser', icon: CsvLogo, badge: 'UNIVERSAL' },
              ].map((b) => {
                const PlatformIcon = b.icon;
                const isSelected = selectedPlatform === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedPlatform(b.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-[#FF6B00]/20 border-[#FF6B00] scale-[1.02]' 
                        : 'bg-[#142127] border-[#20323D] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <PlatformIcon className="w-7 h-7 shrink-0 object-contain" />
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        isSelected ? 'bg-[#FF6B00] text-white' : 'bg-[#FF6B00]/20 text-[#FF6B00]'
                      }`}>
                        {b.badge}
                      </span>
                    </div>
                    <div className="mt-3">
                      <h4 className="text-xs font-black text-white flex items-center justify-between">
                        <span>{b.name}</span>
                        {isSelected && <Check size={14} className="text-[#FF6B00] font-black" />}
                      </h4>
                      <p className="text-[10px] font-bold text-[#52656D]">{b.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-2xl bg-[#142127] border-2 border-[#20323D] text-xs font-black text-[#52656D] hover:text-white cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleFinishOnboarding}
                className="bg-[#58CC02] px-8 py-3.5 rounded-2xl text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Sync Account & Start</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
