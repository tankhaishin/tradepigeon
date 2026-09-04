import React, { useState } from 'react';
import { 
  ShieldCheck, Zap, ArrowRight, CheckCircle2, Flame, Heart, Gem, Trophy, Star, 
  Sparkles, Lock, BarChart3, ChevronRight, Play, Check, Globe, Bell
} from 'lucide-react';
import InteractiveParrotMascot from './InteractiveParrotMascot';
import LegalModal from './LegalModal';
import { TradovateLogo, MetaTrader5Logo, NinjaTraderLogo, TradeLockerLogo, CsvLogo } from './BrokerLogos';
import { Duo3dShieldBadge, Duo3dFlameBadge, Duo3dChartBadge, Duo3dZapBadge, Duo3dLockBadge, Duo3dBellBadge, Duo3dCheckBadge } from './DuolingoFeatureBadges';
import { DuoDisciplinedWinIcon, DuoDisciplinedLossIcon, DuoDisciplinedBeIcon, DuoToxicWinIcon, DuoToxicBeIcon, DuoDoubleFailureIcon, DuoMissedTradeIcon } from './DuoIcons';
import { soundFx } from '../utils/audioEngine';

import GoogleAuthButton from './GoogleAuthButton';

export default function LandingPage({ onGetStarted, onLogin }) {
  const [isLegalTermsOpen, setIsLegalTermsOpen] = useState(false);
  const [isLegalPrivacyOpen, setIsLegalPrivacyOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState('MONTHLY'); // Default: $9.99 / month
  const [activeRoadmapIndex, setActiveRoadmapIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  
  // DYNAMIC INTERACTIVE MASCOT REACTIVE STATE
  const mascotQuotes = [
    { pose: 'welcoming', text: '"Did you follow your plan today—or get lucky?"' },
    { pose: 'celebrating', text: '"Disciplined wins build true prop trading wealth!"' },
    { pose: 'shielded', text: '"A good loss is just a business expense. Respect your stop!"' },
    { pose: 'anxious', text: '"FOMO costs accounts. Wait for your A+ setup!"' },
    { pose: 'revenge', text: '"Revenge trading detected! Step back and breathe."' },
    { pose: 'zen', text: '"Process first, profits follow. Trade like an algorithm!"' }
  ];
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [activeMascotPose, setActiveMascotPose] = useState('welcoming');
  const [speechText, setSpeechText] = useState(mascotQuotes[0].text);

  const handleMascotClick = () => {
    soundFx.playPop();
    const nextIndex = (quoteIndex + 1) % mascotQuotes.length;
    setQuoteIndex(nextIndex);
    setActiveMascotPose(mascotQuotes[nextIndex].pose);
    setSpeechText(mascotQuotes[nextIndex].text);
  };

  const handleStart = () => {
    soundFx.playSuccess();
    onGetStarted();
  };

  const handleStripeCheckout = async (overrideCycle) => {
    soundFx.playSuccess();
    const cycle = overrideCycle || billingCycle;
    const monthlyUrl = import.meta.env.VITE_STRIPE_MONTHLY_LINK || 'https://buy.stripe.com/00w28t0HrfyO93VamV7ss01';
    const annualUrl = import.meta.env.VITE_STRIPE_ANNUAL_LINK || 'https://buy.stripe.com/eVqbJ3bm5aeu2Fx52B7ss02';

    const targetUrl = cycle === 'ANNUAL' ? annualUrl : (monthlyUrl || annualUrl);
    window.location.href = targetUrl;
  };

  const handleQuadrantHover = (pose, speech) => {
    soundFx.playPop();
    setActiveMascotPose(pose);
    setSpeechText(speech);
  };

  const handleQuadrantLeave = () => {
    setActiveMascotPose(mascotQuotes[quoteIndex].pose);
    setSpeechText(mascotQuotes[quoteIndex].text);
  };

  return (
    <div className="min-h-screen bg-[#070C1E] text-white font-sans selection:bg-[#FF6B00] selection:text-white flex flex-col justify-between overflow-x-hidden relative">
      
      {/* 1. DUOLINGO-STYLE FLOATING TOP NAVBAR */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-30 relative">
        
        {/* Duolingo 3D Tactile Logo Mark */}
        <div className="flex items-center gap-3.5 cursor-pointer group" onClick={handleStart}>
          <div className="w-11 h-11 rounded-2xl bg-[#0D1635] overflow-hidden border-2 border-[#FF6B00] border-b-4 border-b-[#C2410C] flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform">
            <img src="/parrot_logo.png" alt="Parrot Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight leading-none group-hover:text-[#FF6B00] transition-colors">
            TRADEPIGEON
          </span>
        </div>

        {/* Header CTAs */}
        <div className="flex items-center gap-3">
          <GoogleAuthButton onAuthSuccess={handleStart} className="py-2 text-[11px]" buttonText="Google Sign-In" />
          <button
            onClick={() => handleStripeCheckout()}
            className="duo-btn-orange px-5 py-2.5 text-xs uppercase tracking-wider font-black shadow-lg cursor-pointer flex items-center gap-2"
          >
            <Duo3dZapBadge className="w-4 h-4" />
            <span>START FREE TRIAL</span>
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION: MASCOT + DUOLINGO HIGH-IMPACT HEADLINE */}
      <main className="w-full max-w-7xl mx-auto px-6 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1 relative z-10">
        
        {/* Left Hero Graphic: Clean, Lightweight Mascot Stage */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
          <div 
            onClick={handleMascotClick} 
            className="relative z-10 cursor-pointer"
            title="Click parrot to change pose!"
          >
            <InteractiveParrotMascot pose={activeMascotPose} className="w-72 h-72 sm:w-96 sm:h-96 filter drop-shadow-2xl" />
          </div>
        </div>

        {/* Right Hero Call-To-Action */}
        <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
          <div className="space-y-4">

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
              Stop Celebrating<br />
              <span className="text-[#FF6B00]">Toxic Lucky Wins.</span>
            </h1>

            <p className="text-base sm:text-lg font-black text-slate-300 leading-snug">
              Most journals only track PnL. TradePigeon grades your execution quality and locks portfolio risk—so bad habits never destroy your funded accounts.
            </p>

            <ul className="space-y-3 text-xs sm:text-sm font-black text-slate-200 pt-2 text-left max-w-lg mx-auto lg:mx-0">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-xl bg-[#58CC02] border border-[#58CC02] border-b-4 border-b-[#3C8901] flex items-center justify-center text-white shrink-0 shadow-md">
                  <Check size={14} strokeWidth={4} />
                </div>
                <span>Lock max daily loss limits</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-xl bg-[#58CC02] border border-[#58CC02] border-b-4 border-b-[#3C8901] flex items-center justify-center text-white shrink-0 shadow-md">
                  <Check size={14} strokeWidth={4} />
                </div>
                <span>Grade discipline on every trade</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-xl bg-[#58CC02] border border-[#58CC02] border-b-4 border-b-[#3C8901] flex items-center justify-center text-white shrink-0 shadow-md">
                  <Check size={14} strokeWidth={4} />
                </div>
                <span>Warm up with daily risk quizzes</span>
              </li>
            </ul>
          </div>

          {/* Duolingo 3D Tactile Action Buttons */}
          <div className="space-y-3.5 max-w-md mx-auto lg:mx-0">
            <button
              onClick={() => handleStripeCheckout()}
              className="duo-btn-orange w-full py-4 text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_8px_30px_rgba(255,107,0,0.4)] cursor-pointer"
            >
              <Duo3dZapBadge className="w-5 h-5" />
              <span>START YOUR 7-DAY FREE TRIAL</span>
            </button>
          </div>

          {/* Duolingo 3D Tactile Broker Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 text-[11px] font-black text-slate-300">
            <span className="text-[10px] uppercase text-[#52656D] tracking-widest w-full text-center lg:text-left mb-1">1-CLICK BROKER STATEMENT & FILL INGESTION</span>
            <div className="duo-card flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#0D1635] border-2 border-[#1C2A4E] border-b-4 border-b-[#15203D] hover:border-[#FF6B00] active:translate-y-[2px] transition-all cursor-pointer">
              <TradovateLogo className="w-4 h-4" />
              <span>Tradovate</span>
            </div>
            <div className="duo-card flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#0D1635] border-2 border-[#1C2A4E] border-b-4 border-b-[#15203D] hover:border-[#58CC02] active:translate-y-[2px] transition-all cursor-pointer">
              <MetaTrader5Logo className="w-4 h-4" />
              <span>MetaTrader 5</span>
            </div>
            <div className="duo-card flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#0D1635] border-2 border-[#1C2A4E] border-b-4 border-b-[#15203D] hover:border-[#1CB0F6] active:translate-y-[2px] transition-all cursor-pointer">
              <NinjaTraderLogo className="w-4 h-4" />
              <span>NinjaTrader</span>
            </div>
            <div className="duo-card flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#0D1635] border-2 border-[#1C2A4E] border-b-4 border-b-[#15203D] hover:border-[#CE82FF] active:translate-y-[2px] transition-all cursor-pointer">
              <TradeLockerLogo className="w-4 h-4" />
              <span>TradeLocker</span>
            </div>
            <div className="duo-card flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#0D1635] border-2 border-[#1C2A4E] border-b-4 border-b-[#15203D] hover:border-amber-400 active:translate-y-[2px] transition-all cursor-pointer">
              <CsvLogo className="w-4 h-4" />
              <span>Universal CSV</span>
            </div>
          </div>

        </div>
      </main>

      {/* BLOCK 1 SUB-BANNER: STATS METRICS STRIP */}
      <section className="w-full bg-[#0D1635]/60 py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">365+</div>
            <div className="text-xs font-black text-[#58CC02] uppercase tracking-wider">Rotational Risk Drills</div>
          </div>
          <div className="space-y-1 border-y md:border-y-0 md:border-x border-[#1C2A4E]/80 py-4 md:py-0">
            <div className="text-3xl sm:text-4xl font-black text-[#58CC02] tracking-tight">&lt; 1s</div>
            <div className="text-xs font-black text-slate-300 uppercase tracking-wider">Instant Statement & Fill Parsing</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-[#1CB0F6] tracking-tight">$9.99</div>
            <div className="text-xs font-black text-[#FF6B00] uppercase tracking-wider">Simple Monthly Membership</div>
          </div>
        </div>
      </section>

      {/* SECTION 1: THE 3 PILLARS */}
      <section className="w-full py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
              Built to Keep You Funded.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Pillar 1 */}
            <div className="duo-card p-8 sm:p-10 rounded-3xl border-2 border-[#58CC02]/50 border-b-[8px] border-b-[#3C8901] space-y-6 relative bg-gradient-to-b from-[#0F1C42] via-[#0B1533] to-[#070D22] shadow-[0_12px_40px_rgba(88,204,2,0.18)] hover:shadow-[0_20px_50px_rgba(88,204,2,0.3)] hover:-translate-y-2 active:translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#58CC02]/50 to-transparent" />
              
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Duo3dShieldBadge className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-xl" />
                </div>
                <span className="text-[10px] font-black uppercase text-[#58CC02] tracking-widest px-3 py-1 rounded-xl bg-[#58CC02]/15 border border-[#58CC02]/30">
                  ACCOUNT RISK
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-white group-hover:text-[#58CC02] transition-colors">Risk Management</h3>
                <p className="text-sm sm:text-base font-bold text-slate-300 leading-relaxed">
                  Set max daily loss limits across all your funded & evaluation accounts in one clean view.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="duo-card p-8 sm:p-10 rounded-3xl border-2 border-[#FF6B00]/50 border-b-[8px] border-b-[#C2410C] space-y-6 relative bg-gradient-to-b from-[#0F1C42] via-[#0B1533] to-[#070D22] shadow-[0_12px_40px_rgba(255,107,0,0.18)] hover:shadow-[0_20px_50px_rgba(255,107,0,0.3)] hover:-translate-y-2 active:translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FF6B00]/50 to-transparent" />

              <div className="flex items-center justify-between">
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Duo3dFlameBadge className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-xl" />
                </div>
                <span className="text-[10px] font-black uppercase text-[#FF6B00] tracking-widest px-3 py-1 rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/30">
                  DISCIPLINE TRACKING
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-white group-hover:text-[#FF6B00] transition-colors">Execution Grading</h3>
                <p className="text-sm sm:text-base font-bold text-slate-300 leading-relaxed">
                  Grade your discipline on every trade. See if you actually followed your plan or traded on impulse.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="duo-card p-8 sm:p-10 rounded-3xl border-2 border-[#1CB0F6]/50 border-b-[8px] border-b-[#1479A7] space-y-6 relative bg-gradient-to-b from-[#0F1C42] via-[#0B1533] to-[#070D22] shadow-[0_12px_40px_rgba(28,176,246,0.18)] hover:shadow-[0_20px_50px_rgba(28,176,246,0.3)] hover:-translate-y-2 active:translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#1CB0F6]/50 to-transparent" />

              <div className="flex items-center justify-between">
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Duo3dChartBadge className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-xl" />
                </div>
                <span className="text-[10px] font-black uppercase text-[#1CB0F6] tracking-widest px-3 py-1 rounded-xl bg-[#1CB0F6]/15 border border-[#1CB0F6]/30">
                  DAILY WARMUPS
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-white group-hover:text-[#1CB0F6] transition-colors">Pre-Market Lessons</h3>
                <p className="text-sm sm:text-base font-bold text-slate-300 leading-relaxed">
                  Short 60-second risk management quizzes before market open to keep your mind sharp and disciplined.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PROPRIETARY 7 BEHAVIORAL EXECUTION TRADE TYPES */}
      <section className="w-full py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              The 7 Types of Trades.
            </h2>
            <p className="text-sm sm:text-base font-bold text-slate-300">
              TradePigeon automatically categorizes every trade into 1 of 7 execution types—so you know whether profits came from true edge or lucky rule violations.
            </p>
          </div>

          {/* ROADMAP STEPPER BUTTON TRAIL (BIG TACTILE 3D DUOLINGO CARDS) */}
          <div className="space-y-4 max-w-6xl mx-auto">
            
            {/* Top Row: 3 Disciplined Trade Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
              {[
                { name: 'Disciplined Win', grade: 'A+ GRADE', color: 'bg-[#58CC02]', border: 'border-[#46A302]', bottom: 'border-b-[#388202]', textColor: 'text-white', badgeBg: 'bg-white/20 text-white', icon: <DuoDisciplinedWinIcon className="w-10 h-10 drop-shadow-md" />, pose: 'celebrating', speech: '"Disciplined Win! Executing your plan with zero hesitation is how champions win long-term!"', tag: 'Followed Plan & Won', desc: 'Entered strictly on strategy playbook criteria and hit profit target cleanly.' },
                { name: 'Disciplined Loss', grade: 'A GRADE', color: 'bg-[#1CB0F6]', border: 'border-[#1899D6]', bottom: 'border-b-[#147BB0]', textColor: 'text-white', badgeBg: 'bg-white/20 text-white', icon: <DuoDisciplinedLossIcon className="w-10 h-10 drop-shadow-md" />, pose: 'shielded', speech: '"Good Loss! Your stop-loss saved your account. That\'s a disciplined cost of business!"', tag: 'Followed Plan & Lost', desc: 'Followed risk rules 100%. Market did not pay, but your account lived to fight another day.' },
                { name: 'Disciplined BE', grade: 'A GRADE', color: 'bg-[#CE82FF]', border: 'border-[#B955FF]', bottom: 'border-b-[#9B2EE6]', textColor: 'text-white', badgeBg: 'bg-white/20 text-white', icon: <DuoDisciplinedBeIcon className="w-10 h-10 drop-shadow-md" />, pose: 'shielded', speech: '"Disciplined Breakeven! Protecting your equity when momentum stalls is peak risk management!"', tag: 'Followed Plan & Scratch', desc: 'Cut risk to breakeven according to your playbook parameters when momentum faded.' }
              ].map((item, idx) => {
                const itemIndex = idx;
                const isActive = activeRoadmapIndex === itemIndex;
                return (
                  <button
                    key={itemIndex}
                    onClick={() => {
                      soundFx.playPop();
                      setActiveRoadmapIndex(itemIndex);
                      setActiveMascotPose(item.pose);
                      setSpeechText(item.speech);
                    }}
                    className={`p-5 rounded-3xl border-2 ${item.color} ${item.border} border-b-8 ${item.bottom} ${item.textColor} transition-all cursor-pointer flex flex-col justify-between space-y-4 text-left shadow-xl active:translate-y-1 ${
                      isActive 
                        ? 'scale-105 ring-4 ring-white shadow-[0_0_35px_rgba(255,255,255,0.45)] z-20' 
                        : 'opacity-90 hover:opacity-100 hover:-translate-y-1 z-10'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-10 h-10 flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl font-mono border border-current/20 ${item.badgeBg}`}>
                        {item.grade}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black leading-tight">{item.name}</h3>
                      <span className="text-xs font-black uppercase tracking-wider opacity-85 block mt-0.5">{item.tag}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Row: 4 Toxic & Missed Trade Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
              {[
                { name: 'Toxic Win', grade: 'C GRADE', color: 'bg-[#FFC800]', border: 'border-[#D9AA00]', bottom: 'border-b-[#8A6B00]', textColor: 'text-slate-950', badgeBg: 'bg-slate-950/20 text-slate-950', icon: <DuoToxicWinIcon className="w-10 h-10 drop-shadow-md" />, pose: 'anxious', speech: '"Toxic Win Warning! Getting lucky on a rule violation is the #1 trap that leads to blowing accounts!"', tag: 'Violated Plan & Won', desc: 'Broke your rules (FOMO or over-leverage) and made money. Dangerous habit that leads to tilt.' },
                { name: 'Toxic BE', grade: 'C- GRADE', color: 'bg-[#00F0FF]', border: 'border-[#00D8E6]', bottom: 'border-b-[#00B8C5]', textColor: 'text-slate-950', badgeBg: 'bg-slate-950/20 text-slate-950', icon: <DuoToxicBeIcon className="w-10 h-10 drop-shadow-md" />, pose: 'anxious', speech: '"Toxic Breakeven! You broke your rules and got saved by luck. Fix this before it turns into a loss!"', tag: 'Violated Plan & Scratch', desc: 'Entered an unplanned trade and got lucky escaping at breakeven.' },
                { name: 'Double Failure', grade: 'F GRADE', color: 'bg-[#FF4B4B]', border: 'border-[#E03A3A]', bottom: 'border-b-[#C62828]', textColor: 'text-white', badgeBg: 'bg-white/20 text-white', icon: <DuoDoubleFailureIcon className="w-10 h-10 drop-shadow-md" />, pose: 'revenge', speech: '"Tilt Danger! Revenge trading destroys weeks of hard work. Take a breather and follow max risk!"', tag: 'Violated Plan & Lost', desc: 'Rule broken plus equity lost. Revenge trading or ignoring stop losses.' },
                { name: 'Missed Trade', grade: 'MISSED', color: 'bg-[#FF9600]', border: 'border-[#E08400]', bottom: 'border-b-[#B86C00]', textColor: 'text-white', badgeBg: 'bg-white/20 text-white', icon: <DuoMissedTradeIcon className="w-10 h-10 drop-shadow-md" />, pose: 'welcoming', speech: '"Missed Trade! Hesitating on a valid setup happens. Log it, learn, and hit the next one cleanly!"', tag: 'Valid Setup & Hesitated', desc: 'Playbook criteria matched 100%, but fear or hesitation caused you to skip the trade.' }
              ].map((item, idx) => {
                const itemIndex = idx + 3;
                const isActive = activeRoadmapIndex === itemIndex;
                return (
                  <button
                    key={itemIndex}
                    onClick={() => {
                      soundFx.playPop();
                      setActiveRoadmapIndex(itemIndex);
                      setActiveMascotPose(item.pose);
                      setSpeechText(item.speech);
                    }}
                    className={`p-5 rounded-3xl border-2 ${item.color} ${item.border} border-b-8 ${item.bottom} ${item.textColor} transition-all cursor-pointer flex flex-col justify-between space-y-4 text-left shadow-xl active:translate-y-1 ${
                      isActive 
                        ? 'scale-105 ring-4 ring-white shadow-[0_0_35px_rgba(255,255,255,0.45)] z-20' 
                        : 'opacity-90 hover:opacity-100 hover:-translate-y-1 z-10'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-10 h-10 flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl font-mono border border-current/20 ${item.badgeBg}`}>
                        {item.grade}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black leading-tight">{item.name}</h3>
                      <span className="text-xs font-black uppercase tracking-wider opacity-85 block mt-0.5">{item.tag}</span>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>

        </div>
      </section>

      {/* NEW FEATURE SECTION: RISK BASKETS MULTI-ACCOUNT CONTROL */}
      <section className="w-full py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
              Organize & Lock Risk With Baskets.
            </h2>
            <p className="text-base sm:text-lg font-bold text-slate-300">
              Group your prop firm & broker accounts into 3D Risk Baskets and lock risk parameters in 1 click.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Basket 1: Aggressive Risk Group */}
            <div className="duo-card p-8 sm:p-10 rounded-3xl border-2 border-[#58CC02]/50 border-b-[8px] border-b-[#388202] space-y-6 relative bg-gradient-to-b from-[#0F1C42] via-[#0B1533] to-[#070D22] shadow-[0_12px_40px_rgba(88,204,2,0.18)] hover:shadow-[0_20px_50px_rgba(88,204,2,0.3)] hover:-translate-y-2 active:translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group text-left">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#58CC02]/50 to-transparent" />

              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="px-3.5 py-1.5 rounded-xl bg-[#58CC02] text-white text-xs font-black uppercase tracking-wider shadow-md">Basket A &bull; Aggressive</span>
                <span className="text-xs font-black text-[#58CC02] bg-[#58CC02]/15 px-3 py-1 rounded-xl border border-[#58CC02]/30">1.5% Max Risk</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-white group-hover:text-[#58CC02] transition-colors">Primary Funded Accounts</h3>
                <p className="text-sm sm:text-base font-bold text-slate-300 leading-relaxed">
                  Lock max drawdown limits and execution rules before market open.
                </p>
              </div>
            </div>

            {/* Basket 2: Conservative Risk Group */}
            <div className="duo-card p-8 sm:p-10 rounded-3xl border-2 border-[#1CB0F6]/50 border-b-[8px] border-b-[#147BB0] space-y-6 relative bg-gradient-to-b from-[#0F1C42] via-[#0B1533] to-[#070D22] shadow-[0_12px_40px_rgba(28,176,246,0.18)] hover:shadow-[0_20px_50px_rgba(28,176,246,0.3)] hover:-translate-y-2 active:translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group text-left">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#1CB0F6]/50 to-transparent" />

              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="px-3.5 py-1.5 rounded-xl bg-[#1CB0F6] text-white text-xs font-black uppercase tracking-wider shadow-md">Basket B &bull; Conservative</span>
                <span className="text-xs font-black text-[#1CB0F6] bg-[#1CB0F6]/15 px-3 py-1 rounded-xl border border-[#1CB0F6]/30">0.5% Max Risk</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-white group-hover:text-[#1CB0F6] transition-colors">Evaluation Accounts</h3>
                <p className="text-sm sm:text-base font-bold text-slate-300 leading-relaxed">
                  Keep challenge accounts safe from trailing drawdown traps with tight risk caps.
                </p>
              </div>
            </div>

            {/* Basket 3: Off-Duty Shield */}
            <div className="duo-card p-8 sm:p-10 rounded-3xl border-2 border-[#FF4B4B]/50 border-b-[8px] border-b-[#C62828] space-y-6 relative bg-gradient-to-b from-[#0F1C42] via-[#0B1533] to-[#070D22] shadow-[0_12px_40px_rgba(255,75,75,0.18)] hover:shadow-[0_20px_50px_rgba(255,75,75,0.3)] hover:-translate-y-2 active:translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group text-left">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FF4B4B]/50 to-transparent" />

              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="px-3.5 py-1.5 rounded-xl bg-[#FF4B4B] text-white text-xs font-black uppercase tracking-wider shadow-md">Basket C &bull; Off-Duty</span>
                <span className="text-xs font-black text-[#FF4B4B] bg-[#FF4B4B]/15 px-3 py-1 rounded-xl border border-[#FF4B4B]/30">0.0% Risk (Shielded)</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-white group-hover:text-[#FF4B4B] transition-colors">No-Trade Shield</h3>
                <p className="text-sm sm:text-base font-bold text-slate-300 leading-relaxed">
                  Pause accounts on high-impact news or rest days to block impulse trades.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* BLOCK 2: UNIFIED PRICING & 7-DAY FREE TRIAL STAGE */}
      <section className="w-full py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="space-y-3 max-w-2xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
              Accessible Edge For Every Trader.
            </h2>
            <p className="text-base sm:text-lg font-bold text-slate-300">
              Launch Special $9.99/mo — less than a single micro futures tick.
            </p>
            
            {/* Billing Switcher Toggle */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <span className={`text-xs font-black uppercase ${billingCycle === 'MONTHLY' ? 'text-white' : 'text-[#52656D]'}`}>Monthly</span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'MONTHLY' ? 'ANNUAL' : 'MONTHLY')}
                className="w-14 h-8 rounded-full bg-[#0D1635] border-2 border-[#1C2A4E] p-1 flex items-center cursor-pointer transition-colors"
              >
                <div className={`w-5 h-5 rounded-full bg-[#FF6B00] shadow-md transition-transform ${billingCycle === 'ANNUAL' ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <span className={`text-xs font-black uppercase flex items-center gap-1.5 ${billingCycle === 'ANNUAL' ? 'text-white' : 'text-[#52656D]'}`}>
                <span>Annual Pass</span>
                <span className="text-[9px] font-black uppercase text-[#58CC02] bg-[#58CC02]/20 px-2 py-0.5 rounded-lg border border-[#58CC02]/30">SAVE 34%</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
            
            {/* Left: Pricing Card */}
            <div className="lg:col-span-5 duo-card p-8 sm:p-10 rounded-3xl border-2 border-[#FF6B00]/60 border-b-[8px] border-b-[#C2410C] space-y-6 relative bg-gradient-to-b from-[#16234D] via-[#0F1839] to-[#090E26] shadow-[0_15px_50px_rgba(255,107,0,0.22)] hover:shadow-[0_25px_60px_rgba(255,107,0,0.35)] hover:-translate-y-2 active:translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent" />
              
              <div className="absolute top-0 right-0 bg-[#FF6B00] text-white text-[10px] font-black uppercase px-3.5 py-1.5 rounded-bl-2xl shadow-md tracking-widest border-b-2 border-l-2 border-[#C2410C]">
                BEST VALUE
              </div>

              <div className="space-y-2 text-center pt-2">
                <h3 className="text-2xl sm:text-3xl font-black text-white group-hover:text-[#FF6B00] transition-colors">TradePigeon Pro Pass</h3>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl font-black text-slate-500 line-through">
                    {billingCycle === 'ANNUAL' ? '$299' : '$29'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#58CC02] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                    {billingCycle === 'ANNUAL' ? '73% OFF LAUNCH DEAL' : '66% OFF LAUNCH SPECIAL'}
                  </span>
                </div>
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                    {billingCycle === 'ANNUAL' ? '$79.99' : '$9.99'}
                  </span>
                  <span className="text-sm font-black text-[#77909D]">
                    {billingCycle === 'ANNUAL' ? '/ year' : '/ month'}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 text-left text-sm sm:text-base font-extrabold text-slate-200 border-y border-[#1C2A4E] py-5">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-xl bg-[#58CC02] border border-[#58CC02] border-b-4 border-b-[#3C8901] flex items-center justify-center text-white shrink-0 shadow-md">
                    <Check size={14} strokeWidth={4} />
                  </div>
                  <span>Supports MT4/MT5, Tradovate & TradeLocker</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-xl bg-[#58CC02] border border-[#58CC02] border-b-4 border-b-[#3C8901] flex items-center justify-center text-white shrink-0 shadow-md">
                    <Check size={14} strokeWidth={4} />
                  </div>
                  <span>365 daily pre-market risk warmups</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-xl bg-[#58CC02] border border-[#58CC02] border-b-4 border-b-[#3C8901] flex items-center justify-center text-white shrink-0 shadow-md">
                    <Check size={14} strokeWidth={4} />
                  </div>
                  <span>Automatic trade discipline grading</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-xl bg-[#58CC02] border border-[#58CC02] border-b-4 border-b-[#3C8901] flex items-center justify-center text-white shrink-0 shadow-md">
                    <Check size={14} strokeWidth={4} />
                  </div>
                  <span>7-day money-back guarantee</span>
                </li>
              </ul>

              <button
                onClick={() => handleStripeCheckout()}
                className="duo-btn-orange w-full py-4 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
              >
                <Duo3dZapBadge className="w-5 h-5" />
                <span>START YOUR 7-DAY FREE TRIAL</span>
              </button>
            </div>

            {/* Right: Integrated Trial Timeline */}
            <div className="lg:col-span-7 duo-card p-8 sm:p-10 rounded-3xl border-2 border-[#1CB0F6]/50 border-b-[8px] border-b-[#147BB0] space-y-6 relative bg-gradient-to-b from-[#0F1C42] via-[#0B1533] to-[#070D22] shadow-[0_15px_50px_rgba(28,176,246,0.18)] hover:shadow-[0_25px_60px_rgba(28,176,246,0.3)] hover:-translate-y-2 active:translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group text-left">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#1CB0F6]/50 to-transparent" />

              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-black text-white group-hover:text-[#1CB0F6] transition-colors">How Your Free Trial Works</h3>
              </div>

              <div className="space-y-6 relative border-l-2 border-dashed border-[#1C2A4E] pl-7 ml-4 pt-1">
                
                {/* Step 1: Today */}
                <div className="relative space-y-1">
                  <div className="absolute -left-[45px] top-0 w-8 h-8 flex items-center justify-center">
                    <Duo3dLockBadge className="w-8 h-8 drop-shadow-md" />
                  </div>
                  <div className="text-[10px] font-black uppercase text-[#1CB0F6] tracking-widest">TODAY</div>
                  <h4 className="text-base sm:text-lg font-black text-white">Instant Full Access</h4>
                  <p className="text-xs sm:text-sm font-bold text-slate-300 leading-relaxed">Immediate access to risk warmups, statement parsing, and discipline telemetry.</p>
                </div>

                {/* Step 2: Day 5 */}
                <div className="relative space-y-1 pt-2">
                  <div className="absolute -left-[45px] top-2 w-8 h-8 flex items-center justify-center">
                    <Duo3dBellBadge className="w-8 h-8 drop-shadow-md" />
                  </div>
                  <div className="text-[10px] font-black uppercase text-[#FF6B00] tracking-widest">DAY 5</div>
                  <h4 className="text-base sm:text-lg font-black text-white">48h Trial Reminder</h4>
                  <p className="text-xs sm:text-sm font-bold text-slate-300 leading-relaxed">Stripe email notification & 1-click cancel option before trial ends—zero surprise charges ever.</p>
                </div>

                {/* Step 3: Day 7 */}
                <div className="relative space-y-1 pt-2">
                  <div className="absolute -left-[45px] top-2 w-8 h-8 flex items-center justify-center">
                    <Duo3dCheckBadge className="w-8 h-8 drop-shadow-md" />
                  </div>
                  <div className="text-[10px] font-black uppercase text-[#58CC02] tracking-widest">DAY 7</div>
                  <h4 className="text-base sm:text-lg font-black text-white">Membership Begins</h4>
                  <p className="text-xs sm:text-sm font-bold text-slate-300 leading-relaxed">Cancel anytime with 1 click. If you love it, your pass continues seamlessly at the locked-in Launch Special price of $9.99/mo (or $79.99/yr).</p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4.5 FREQUENTLY ASKED QUESTIONS (FAQ) ACCORDION */}
      <section className="w-full py-16 relative z-10">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Everything You Need To Know</h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Does TradePigeon have trade execution or withdrawal rights on my account?",
                a: "No. Connections are strictly Read-Only API keys with zero execution or withdrawal authority."
              },
              {
                q: "How does the rotational curriculum work?",
                a: "Every day you get a 30-second institutional risk math drill to prime your mind before trading."
              },
              {
                q: "What if my broker is not listed for auto-sync?",
                a: "Drop raw trade CSV/HTML exports in 1 second from any broker or platform."
              },
              {
                q: "What is your refund policy?",
                a: "100% 7-day money-back guarantee. Zero questions asked."
              }
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx} 
                  onClick={() => {
                    soundFx.playPop();
                    setOpenFaqIndex(isOpen ? null : idx);
                  }}
                  className={`p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer overflow-hidden text-left ${
                    isOpen
                      ? 'border-[#1CB0F6] border-b-4 border-b-[#147BB0] bg-gradient-to-b from-[#0F1C42] to-[#070D22] shadow-[0_10px_30px_rgba(28,176,246,0.2)]'
                      : 'border-[#1C2A4E] border-b-4 border-b-[#14203E] bg-[#0D1635] hover:border-[#1CB0F6]/60 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="text-sm sm:text-base font-black text-white flex items-center justify-between gap-4 select-none">
                    <span>{faq.q}</span>
                    <ChevronRight 
                      size={20} 
                      className={`shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-90 text-[#FF6B00]' : 'text-[#1CB0F6]'
                      }`} 
                    />
                  </div>
                  {isOpen && (
                    <p className="mt-3 text-xs sm:text-sm font-bold text-slate-300 leading-relaxed border-t border-[#1C2A4E] pt-3 animate-fadeIn">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. DUOLINGO-STYLE FOOTER WITH LEGAL LINKS */}
      <footer className="w-full relative z-10 border-t border-[#1C2A4E] py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#1C2A4E] pb-6">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-8 h-8 rounded-xl bg-[#0D1635] overflow-hidden border border-[#FF6B00] border-b-3 border-b-[#C2410C] flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <img src="/parrot_logo.png" alt="TradePigeon Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-black text-white text-base tracking-tight group-hover:text-[#FF6B00] transition-colors">TradePigeon</span>
            </div>
            
            <div className="flex items-center gap-6 font-bold">
              <button 
                onClick={() => setIsLegalTermsOpen(true)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
              <button 
                onClick={() => setIsLegalPrivacyOpen(true)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-[#52656D]">&bull;</span>
              <span className="text-slate-400">support@tradepigeon.com</span>
            </div>
          </div>

          <div className="text-[10px] text-[#52656D] leading-relaxed max-w-4xl mx-auto text-center space-y-2">
            <p>
              <strong>CFTC RULE 4.41 - HYPOTHETICAL OR SIMULATED PERFORMANCE RESULTS HAVE CERTAIN LIMITATIONS.</strong> UNLIKE AN ACTUAL PERFORMANCE RECORD, SIMULATED RESULTS DO NOT REPRESENT ACTUAL TRADING. ALSO, SINCE THE TRADES HAVE NOT BEEN EXECUTED, THE RESULTS MAY HAVE UNDER-OR-OVER COMPENSATED FOR THE IMPACT, IF ANY, OF CERTAIN MARKET FACTORS, SUCH AS LACK OF LIQUIDITY.
            </p>
            <p>
              TradePigeon is an educational performance tracking software tool. TradePigeon does not offer financial advice, trade execution, or brokerage services. Trading futures, forex, and equities involves substantial risk of loss.
            </p>
            <p>&copy; {new Date().getFullYear()} TradePigeon Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Legal Terms & Privacy Modals */}
      <LegalModal 
        isOpen={isLegalTermsOpen} 
        onClose={() => setIsLegalTermsOpen(false)} 
        title="Terms of Service"
      />
      <LegalModal 
        isOpen={isLegalPrivacyOpen} 
        onClose={() => setIsLegalPrivacyOpen(false)} 
        title="Privacy Policy"
      />

    </div>
  );
}
