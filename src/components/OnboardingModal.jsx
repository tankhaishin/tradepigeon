import React, { useState, useEffect, useCallback } from 'react';
import { DuoShieldIcon, DuoLightningIcon, DuoChestIcon, DuoPlusIcon } from './DuoIcons';
import InteractiveParrotMascot from './InteractiveParrotMascot';
import { ArrowRight, Check, X } from 'lucide-react';
import { sendDiscordSignupAlert } from '../utils/discordWebhook';

import { loadStoredData, saveStoredData, safeRemoveItem, STORAGE_KEYS } from '../utils/storage';
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

  // Form Fields

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
    safeRemoveItem(STORAGE_KEYS.ONBOARDING_STEP);
    safeRemoveItem(STORAGE_KEYS.ONBOARDING_DRAFT);
  };

  const handleFinishOnboarding = useCallback(async (skipBroker = false, connectedAccountParam = null, allAccountsParam = null) => {
    clearDraftState();
    const finalStrategyName = customPlaybookName.trim() || 'Strategy 1';
    const finalRiskLimit = customMaxDailyLoss.trim() ? (riskType === 'FIXED_DOLLAR' ? `$${customMaxDailyLoss}` : `${customMaxDailyLoss}%`) : '$1,000';

    const accountsToSave = allAccountsParam || (connectedAccountParam ? [connectedAccountParam] : []);
    const connectedBrokerObj = connectedAccountParam || (accountsToSave.length > 0 ? accountsToSave[0] : null);

    if (accountsToSave.length > 0) {
      const existingAccounts = loadStoredData('tradepigeon_accounts_data', []);
      saveStoredData('tradepigeon_accounts_data', [...accountsToSave, ...existingAccounts]);
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
  }, [customPlaybookName, customMaxDailyLoss, riskType, tradingStyle, onComplete]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        soundFx.playPop();
        handleFinishOnboarding(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleFinishOnboarding]);

  if (!isOpen) return null;

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

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          soundFx.playPop();
          handleFinishOnboarding(true);
        }
      }}
      className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="duo-card max-w-2xl w-full p-6 sm:p-8 space-y-6 border-2 border-[#FF6B00] relative max-h-[92vh] overflow-y-auto"
      >
        
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

        {/* Clean Step Header */}
        <div className="flex items-center justify-between bg-[#142127] p-3.5 sm:p-4 rounded-2xl border border-[#20323D]">
          <div className="flex items-center gap-3">
            <InteractiveParrotMascot 
              pose={step === 1 ? 'welcoming' : step === 2 ? 'calculating' : step === 3 ? 'reading' : 'pointing'} 
              className="w-11 h-11 shrink-0" 
            />
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
              {step === 1 && 'Your strategy'}
              {step === 2 && 'Daily loss limit'}
              {step === 3 && 'Name it'}
              {step === 4 && 'Your trades'}
            </span>
          </div>
          <span className="text-xs font-black font-mono text-[#FF6B00]">Step {step} of 4</span>
        </div>

        {/* STEP 1: TRADING METHODOLOGY PRESETS */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-black text-white">Choose Your Trading Strategy</h2>
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
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: RISK MANAGEMENT CALIBRATION */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-black text-white">Set Daily Risk Limit</h2>
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
              <button onClick={() => setStep(3)} className="flex-[2] py-4 bg-[#FF6B00] rounded-2xl text-white font-black text-xs uppercase cursor-pointer">Continue</button>
            </div>
          </div>
        )}

        {/* STEP 3: PLAYBOOK NAMING */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-black text-white">Name Your Strategy</h2>
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
              <button onClick={() => setStep(4)} className="flex-[2] py-4 bg-[#FF6B00] rounded-2xl text-white font-black text-xs uppercase cursor-pointer">Continue</button>
            </div>
          </div>
        )}

        {/* STEP 4: HOW TRADES COME IN (honest: file import or manual; broker auto-sync is coming soon) */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-black text-white">Bring in your trades</h2>

            <button
              onClick={() => { handleFinishOnboarding(true); setTimeout(() => window.dispatchEvent(new CustomEvent('tradepigeon_open_import')), 300); }}
              className="w-full p-5 rounded-2xl bg-[#1CB0F6] border-b-4 border-[#1480B3] text-left cursor-pointer active:translate-y-0.5 transition-all"
            >
              <div className="text-base font-black text-white">Import a file</div>
              <div className="text-xs font-bold text-white/80">Tradovate or NinjaTrader export (CSV)</div>
            </button>

            <button
              onClick={() => handleFinishOnboarding(true)}
              className="w-full p-5 rounded-2xl bg-[#142127] border-2 border-[#20323D] text-left cursor-pointer hover:border-[#37464F] transition-all"
            >
              <div className="text-base font-black text-white">Add trades by hand</div>
              <div className="text-xs font-bold text-slate-400">Log each trade after you take it</div>
            </button>

            <div className="text-xs font-bold text-slate-500 text-center">Broker auto-sync is coming soon.</div>

            <button onClick={() => setStep(3)} className="w-full py-3 text-xs font-black uppercase text-slate-400 hover:text-white cursor-pointer">Back</button>
          </div>
        )}

      </div>
    </div>
  );
}
