import React, { useState, useEffect } from 'react';
import { startCheckout } from '../utils/proStatus';
import { 
  X, 
  Check, 
  Crown, 
  Zap, 
  BrainCircuit, 
  ShieldCheck, 
  BarChart3, 
  Cloud, 
  Sparkles,
  Coins,
  ArrowRight,
  Lock
} from 'lucide-react';
import { soundFx } from '../utils/audioEngine';
import { useAuth } from '../context/AuthContext';
import { 
  PRO_MONTHLY_PRICE, 
  SHOP_COIN_PASS_COST, 
  activateShopProPass 
} from '../utils/subscriptionEngine';
import { loadStoredData, STORAGE_KEYS, spendDisciplinePoints } from '../utils/storage';

export default function ProPaywallModal({ 
  isOpen, 
  onClose, 
  featureName = '', 
  triggerContext = 'general' 
}) {
  const { user } = useAuth();
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [plan, setPlan] = useState('monthly');
  const [errorMessage, setErrorMessage] = useState('');
  const [userCoins, setUserCoins] = useState(() => {
    const stats = loadStoredData(STORAGE_KEYS.USER_STATS, { disciplinePoints: 0 });
    return stats?.disciplinePoints || 0;
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      const stats = loadStoredData(STORAGE_KEYS.USER_STATS, { disciplinePoints: 0 });
      setUserCoins(stats?.disciplinePoints || 0);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartStripeCheckout = async () => {
    soundFx.playPop();
    setIsProcessingStripe(true);
    setErrorMessage('');

    try {
      await startCheckout(plan);
      return;
    } catch (err) {
      console.error('[Stripe Checkout Error]:', err);
      setErrorMessage(err.message || 'Could not connect to Stripe. Please try again.');
    } finally {
      setIsProcessingStripe(false);
    }
  };

  const handleRedeemWithCoins = async () => {
    if (userCoins < SHOP_COIN_PASS_COST) {
      soundFx.playWarning();
      setErrorMessage(`You need ${SHOP_COIN_PASS_COST} Discipline Points to redeem a Pro Pass. You have ${userCoins} DP.`);
      return;
    }

    soundFx.playPop();
    const success = spendDisciplinePoints(SHOP_COIN_PASS_COST);
    if (success) {
      await activateShopProPass(user?.uid, userCoins - SHOP_COIN_PASS_COST);
      soundFx.playTrophy();
      setUserCoins(prev => Math.max(0, prev - SHOP_COIN_PASS_COST));
      onClose();
    } else {
      setErrorMessage('Failed to deduct Discipline Points.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-xl bg-[#0D1635] border-2 border-[#FF6B00] border-b-6 border-b-[#C2410C] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background element */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#FF6B00]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-[#58CC02]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            soundFx.playPop();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-2xl bg-[#1C2A4E] hover:bg-[#2A3B66] text-slate-400 hover:text-white transition-all cursor-pointer z-10"
          title="Close Modal"
        >
          <X size={18} />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FF6B00] border-2 border-[#FFA100] border-b-4 border-b-[#C2410C] flex items-center justify-center shadow-lg shrink-0">
            <Crown size={24} className="text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-[#FF6B00] uppercase">Upgrade</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              TradePigeon PRO
            </h2>
          </div>
        </div>

        {/* Dynamic Context Banner if triggered by a specific feature */}
        {featureName && (
          <div className="mb-5 p-3 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center gap-3">
            <Lock size={18} className="text-[#FF6B00] shrink-0" />
            <p className="text-xs font-bold text-slate-200">
              <strong className="text-[#FF6B00]">{featureName}</strong> is part of Pro. Free keeps your journal, path and streak.
            </p>
          </div>
        )}

        {/* Value Proposition Description */}
        <p className="text-sm font-bold text-slate-300 mb-6 leading-relaxed">
          Everything in Free, plus:
        </p>

        {/* Core Pro Features Grid */}
        <div className="space-y-3 mb-6 bg-[#070C1E]/80 p-4 rounded-2xl border border-[#1C2A4E]">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-[#58CC02]/20 text-[#58CC02] flex items-center justify-center shrink-0 mt-0.5">
              <Zap size={14} strokeWidth={3} />
            </div>
            <div className="text-xs">
              <span className="font-black text-white">Stop typing every trade:</span>{' '}
              <span className="text-slate-300">Import from Tradovate, NinjaTrader or our CSV template in seconds. Broker auto-sync comes to Pro first.</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-[#1CB0F6]/20 text-[#1CB0F6] flex items-center justify-center shrink-0 mt-0.5">
              <BrainCircuit size={14} strokeWidth={3} />
            </div>
            <div className="text-xs">
              <span className="font-black text-white">AI debrief:</span>{' '}
              <span className="text-slate-300">A coach reads your day and names the habit to fix tomorrow.</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck size={14} strokeWidth={3} />
            </div>
            <div className="text-xs">
              <span className="font-black text-white">Unlimited accounts:</span>{' '}
              <span className="text-slate-300">Every prop and personal account, separately and combined. Free has one.</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-lg bg-[#FFA100]/20 text-[#FFA100] flex items-center justify-center shrink-0 mt-0.5">
              <BarChart3 size={14} strokeWidth={3} />
            </div>
            <div className="text-xs">
              <span className="font-black text-white">Deeper stats:</span>{' '}
              <span className="text-slate-300">See which habit costs you the most money, by setup and time of day.</span>
            </div>
          </div>

        </div>

        {/* Plan picker */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { id: 'monthly', label: 'Monthly', price: `$${PRO_MONTHLY_PRICE}`, per: '/ month', note: 'Cancel anytime' },
            { id: 'annual', label: 'Yearly', price: '$79.99', per: '/ year', note: 'Save 33%' }
          ].map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => setPlan(o.id)}
              className={`p-4 rounded-2xl text-left border-2 cursor-pointer transition-all ${plan === o.id ? 'border-[#58CC02] bg-[#58CC02]/10' : 'border-[#20325C] bg-[#14203E] hover:border-slate-500'}`}
            >
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{o.label}</div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black text-white">{o.price}</span>
                <span className="text-xs font-bold text-slate-400">{o.per}</span>
              </div>
              <div className={`text-[11px] font-black mt-1 ${o.id === 'annual' ? 'text-[#58CC02]' : 'text-slate-400'}`}>{o.note}</div>
            </button>
          ))}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
            {errorMessage}
          </div>
        )}

        {/* Primary Action Button */}
        <div className="space-y-3">
          <button
            onClick={handleStartStripeCheckout}
            disabled={isProcessingStripe}
            className="w-full py-4 px-6 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] border-2 border-[#46A302] border-b-4 border-b-[#347A01] text-white text-base font-black tracking-wide shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isProcessingStripe ? (
              <span>Connecting to Secure Checkout...</span>
            ) : (
              <>
                <span>Upgrade to Pro · {plan === 'annual' ? '$79.99/yr' : `$${PRO_MONTHLY_PRICE}/mo`}</span>
                <ArrowRight size={18} strokeWidth={3} />
              </>
            )}
          </button>

          {/* Secondary Coin Shop Option */}
          {userCoins >= SHOP_COIN_PASS_COST && (
            <button
              onClick={handleRedeemWithCoins}
              className="w-full py-3 px-4 rounded-2xl bg-[#FF6B00]/15 hover:bg-[#FF6B00]/25 border border-[#FF6B00]/40 text-[#FF6B00] text-xs font-black tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Coins size={16} />
              <span>Redeem 30 Days with {SHOP_COIN_PASS_COST} Coins (You have {userCoins} DP)</span>
            </button>
          )}
        </div>

        {/* Footer Fine Print */}
        <div className="mt-4 text-center text-[10px] font-bold text-slate-400">
          Secure checkout by Stripe &bull; Cancel any time
        </div>
      </div>
    </div>
  );
}
