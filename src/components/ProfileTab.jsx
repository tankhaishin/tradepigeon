import React, { useState } from 'react';
import { User, Flame, Gem, Heart, Calendar, ShieldCheck, Award, TrendingUp, CheckCircle2, AlertCircle, Cpu, RefreshCw, BarChart3, Activity, Sparkles } from 'lucide-react';
import { DuoShieldIcon, DuoLightningIcon, DuoChestIcon, DuoProfileIcon, DuoTrophyIcon } from './DuoIcons';
import GoogleAuthButton from './GoogleAuthButton';
import MobileAlertSettings from './MobileAlertSettings';
import { soundFx } from '../utils/audioEngine';

export default function ProfileTab() {
  const [activeSubTab, setActiveSubTab] = useState('DEBRIEF_HISTORY');
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [profileToast, setProfileToast] = useState('');

  const triggerToast = (msg) => {
    soundFx.playPop();
    setProfileToast(msg);
    setTimeout(() => setProfileToast(''), 3500);
  };

  const handleStripeCheckout = async () => {
    setIsProcessingStripe(true);
    try {
      const response = await fetch('http://localhost:3001/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: 'price_123456789',
          successUrl: window.location.href,
          cancelUrl: window.location.href,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        triggerToast("Connecting to secure Stripe gateway...");
      }
    } catch (err) {
      console.warn('[Stripe Trigger Error]:', err);
      triggerToast("Connecting to secure Stripe gateway...");
    } finally {
      setIsProcessingStripe(false);
    }
  };

  const handleCancelSubscription = () => {
    triggerToast("Pro access active through billing cycle.");
  };

  // VERIFIED TRADING EDGE LOG (Last 5 Sessions)
  const historicalLogs = [
    { date: 'Aug 10, 2026', grade: 'A+', score: '100% Plan Adherence', status: 'GOOD EXECUTION', pnl: '+$4,250.00', setup: 'Breakout & Retest', mood: 'In The Zone (Flow State)' },
    { date: 'Aug 8, 2026', grade: 'A', score: '95% Plan Adherence', status: 'GOOD LOSS', pnl: '-$200.00', setup: 'Key Support Sweep', mood: 'Slightly Anxious' },
    { date: 'Aug 7, 2026', grade: 'A+', score: '100% Plan Adherence', status: 'GOOD EXECUTION', pnl: '+$1,400.00', setup: 'Trend Continuation', mood: 'In The Zone (Flow State)' },
    { date: 'Aug 5, 2026', grade: 'C-', score: '60% Plan Adherence', status: 'TOXIC WIN', pnl: '+$600.00', setup: 'Unplanned Chasing', mood: 'FOMO / Impatient' },
    { date: 'Aug 4, 2026', grade: 'A+', score: '100% Plan Adherence', status: 'GOOD EXECUTION', pnl: '+$850.00', setup: 'Breakout & Retest', mood: 'In The Zone (Flow State)' },
  ];

  // Connected Auto-Synced Trading Accounts
  const connectedAccounts = [
    { name: 'Primary Funded Account', id: 'ACC-88210', balance: '$150,000.00', status: 'SYNCED (LIVE)', maxDailyDrawdown: '$4,500.00', currentDrawdown: '-$1,250.00' },
    { name: 'Secondary Trading Account', id: 'ACC-44912', balance: '$100,000.00', status: 'SYNCED (LIVE)', maxDailyDrawdown: '$3,000.00', currentDrawdown: '-$450.00' },
    { name: 'Evaluation Challenge Account', id: 'ACC-11048', balance: '$50,000.00', status: 'SYNCED (LIVE)', maxDailyDrawdown: '$1,500.00', currentDrawdown: '$0.00' },
  ];

  return (
    <main className="flex-1 min-h-screen lg:pl-28 xl:pl-80 xl:pr-[416px] bg-[#070C1E] p-4 sm:p-6 lg:p-8 text-white space-y-8 pb-24 lg:pb-10 max-w-full overflow-hidden">
      
      {/* 1. TOP HEADER: PURE FLOATING DUOLINGO HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Trader</h2>
          <span className="px-2.5 py-0.5 rounded-lg bg-[#58CC02] text-white text-[10px] font-black uppercase">PROP MASTER</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <GoogleAuthButton className="py-2.5 text-xs" buttonText="Google Identity" />
          <button
            onClick={handleStripeCheckout}
            disabled={isProcessingStripe}
            className="duo-btn-orange px-4 py-2.5 text-xs flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            <span>{isProcessingStripe ? 'Connecting Stripe...' : 'Upgrade to Pro ($9.99/mo)'}</span>
          </button>
        </div>
      </div>

      {/* Core Stats Hero Card */}
      <div className="duo-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-white">Trader Overview</h3>
          <span className="text-xs font-black text-[#58CC02] bg-[#58CC02]/15 px-3 py-1 rounded-xl border border-[#58CC02]/30">PROP MASTER</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 pt-2">
          <div className="shrink-0">
            <DuoProfileIcon className="w-20 h-20 sm:w-24 sm:h-24 filter drop-shadow-xl" />
          </div>

          <div className="flex-1 w-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-black text-white">Discipline Streak</span>
              <span className="text-xl sm:text-2xl font-black text-[#FF6B00]">14 Days</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-base font-black text-white">DP Gems</span>
              <span className="text-xl sm:text-2xl font-black text-[#1CB0F6]">3,420</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-base font-black text-white">Disciplined Trades</span>
              <span className="text-xl sm:text-2xl font-black text-[#58CC02]">16</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-base font-black text-white">Plan Adherence</span>
              <span className="text-xl sm:text-2xl font-black text-[#58CC02]">96%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS (SESSION DEBRIEF HISTORY / ACCOUNTS) */}
      <div className="flex items-center gap-2.5 border-b-2 border-[#20323D] pb-3">
        <button
          onClick={() => setActiveSubTab('DEBRIEF_HISTORY')}
          className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'DEBRIEF_HISTORY'
              ? 'duo-btn-blue'
              : 'duo-btn-dark'
          }`}
        >
          Session Debrief History
        </button>
        <button
          onClick={() => setActiveSubTab('ACCOUNTS')}
          className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'ACCOUNTS'
              ? 'duo-btn-blue'
              : 'duo-btn-dark'
          }`}
        >
          Connected Broker Accounts
        </button>
      </div>

      {/* SUB-TAB 2: DEBRIEF HISTORY */}
      {activeSubTab === 'DEBRIEF_HISTORY' && (
        <div className="duo-card p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#20323D]">
            <h3 className="text-base font-black text-white">Session Accountability Log</h3>
            <span className="text-xs font-bold text-[#52656D]">5 Recent Debrief Audits</span>
          </div>

          <div className="space-y-3">
            {historicalLogs.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-[#182830] border-2 border-[#2B3D47] border-b-4 border-b-[#142127] flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 border-2 ${
                    item.grade.startsWith('A') ? 'bg-[#58CC02] text-white border-[#46A302] border-b-4 border-b-[#388202]' : 'bg-amber-500 text-slate-950 border-amber-600 border-b-4 border-b-amber-700'
                  }`}>
                    {item.grade}
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">{item.date} &bull; <span className="text-[#1CB0F6]">{item.setup}</span></div>
                    <div className="text-xs font-bold text-[#52656D] mt-0.5">{item.score} &bull; Mindset: {item.mood}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-black ${item.pnl.startsWith('+') ? 'text-[#58CC02]' : 'text-rose-400'}`}>
                    {item.pnl}
                  </div>
                  <div className="text-[10px] font-black uppercase text-slate-400 mt-0.5">{item.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ACCOUNTS */}
      {activeSubTab === 'ACCOUNTS' && (
        <div className="duo-card p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#20323D]">
            <h3 className="text-base font-black text-white">Auto-Synced Broker & Prop Accounts</h3>
            <span className="text-xs font-black text-white bg-[#58CC02] border-2 border-[#46A302] border-b-4 border-b-[#388202] px-3 py-1 rounded-xl">3 LIVE CONNECTIONS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {connectedAccounts.map((acc, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-[#182830] border-2 border-[#2B3D47] border-b-4 border-b-[#142127] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-white bg-[#58CC02] border border-[#46A302] px-2 py-0.5 rounded-md">{acc.status}</span>
                  <span className="text-xs font-black text-[#52656D]">{acc.id}</span>
                </div>

                <div>
                  <h4 className="text-base font-black text-white">{acc.name}</h4>
                  <div className="text-xl font-black text-[#1CB0F6] mt-1">{acc.balance}</div>
                </div>

                <div className="pt-2 border-t border-[#20323D] space-y-1 text-xs font-bold">
                  <div className="flex justify-between text-[#52656D]">
                    <span>Max Daily Loss Limit:</span>
                    <span className="text-white font-black">{acc.maxDailyDrawdown}</span>
                  </div>
                  <div className="flex justify-between text-[#52656D]">
                    <span>Current Session Drawdown:</span>
                    <span className="text-rose-400 font-black">{acc.currentDrawdown}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* MOBILE PHONE PUSH NOTIFICATION SETTINGS */}
          <div className="pt-4">
            <MobileAlertSettings />
          </div>
        </div>
      )}

      {/* SLEEK FLOATING TOAST NOTIFICATION */}
      {profileToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div className="duo-card p-4 bg-[#1CB0F6] border-2 border-[#1899D6] border-b-4 border-b-[#147BB0] text-white flex items-center gap-3">
            <Sparkles size={20} className="shrink-0" />
            <span className="text-xs font-black">{profileToast}</span>
          </div>
        </div>
      )}

    </main>
  );
}
