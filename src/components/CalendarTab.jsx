import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Share2, 
  Flame, ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle, XCircle, TrendingUp, Sparkles, Eye, Filter
} from 'lucide-react';
import { DuoCalendarIcon, DuoShieldIcon, DuoLightningIcon, DuoGemIcon, DuoTrophyIcon, DuoDisciplinedWinIcon, DuoDisciplinedLossIcon, DuoDisciplinedBeIcon, DuoToxicWinIcon, DuoToxicBeIcon, DuoDoubleFailureIcon, DuoMissedTradeIcon } from './DuoIcons';
import { Duo3dCheckBadge, Duo3dZenBadge } from './DuolingoFeatureBadges';
import InteractiveParrotMascot from './InteractiveParrotMascot';
import { loadStoredData, saveStoredData } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';

export default function CalendarTab() {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(1); // August 2026
  const [calendarViewMode, setCalendarViewMode] = useState('pnl'); // 'pnl' | 'discipline'
  const [selectedBasketFilter, setSelectedBasketFilter] = useState('ALL');
  const [basketsList] = useState(() => loadStoredData('goodtrader_baskets_list', [
    { id: 'b_1', name: 'Basket A' },
    { id: 'b_2', name: 'Basket B' }
  ]));
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL'); // 'ALL' | 'win' | 'good_loss' | 'toxic_win' | 'double_failure'
  const [activeModalDay, setActiveModalDay] = useState(null);

  const monthsData = [
    {
      monthName: 'JULY 2026',
      totalPnl: '+$14,850.00',
      totalPnlNum: 14850,
      disciplineScore: '96%',
      startOffset: 2, // July 1, 2026 is Wednesday (Mon=0, Tue=1, Wed=2)
      weeklySummaries: [
        { weekLabel: 'Week 1', pnl: '+$2,126.26', count: '7 trades' },
        { weekLabel: 'Week 2', pnl: '+$3,670.00', count: '9 trades' },
        { weekLabel: 'Week 3', pnl: '+$4,150.00', count: '12 trades' },
        { weekLabel: 'Week 4', pnl: '+$4,903.74', count: '10 trades' },
        { weekLabel: 'Week 5', pnl: '+$0.00', count: '0 trades' },
      ],
      days: [
        { date: 1, dayOfWeek: 'W', status: 'win', pnl: '+$800.00', count: '1 trades' },
        { date: 2, dayOfWeek: 'T', status: 'win', pnl: '+$650.00', count: '1 trades' },
        { date: 3, dayOfWeek: 'F', status: 'good_loss', pnl: '-$300.00', count: '1 trades' },
        { date: 4, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED', count: '-' },
        { date: 5, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED', count: '-' },
        { date: 6, dayOfWeek: 'M', status: 'win', pnl: '+$1,400.00', count: '2 trades' },
        { date: 7, dayOfWeek: 'T', status: 'win', pnl: '+$920.00', count: '1 trades' },
        { date: 8, dayOfWeek: 'W', status: 'win', pnl: '+$1,100.00', count: '2 trades' },
        { date: 9, dayOfWeek: 'T', status: 'good_loss', pnl: '-$250.00', count: '1 trades' },
        { date: 10, dayOfWeek: 'F', status: 'win', pnl: '+$1,500.00', count: '3 trades' },
        { date: 11, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED', count: '-' },
        { date: 12, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED', count: '-' },
        { date: 13, dayOfWeek: 'M', status: 'win', pnl: '+$750.00', count: '1 trades' },
        { date: 14, dayOfWeek: 'T', status: 'win', pnl: '+$880.00', count: '2 trades' },
        { date: 15, dayOfWeek: 'W', status: 'good_loss', pnl: '-$180.00', count: '1 trades' },
        { date: 16, dayOfWeek: 'T', status: 'win', pnl: '+$2,100.00', count: '4 trades' },
        { date: 17, dayOfWeek: 'F', status: 'win', pnl: '+$1,350.00', count: '2 trades' },
        { date: 18, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED', count: '-' },
        { date: 19, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED', count: '-' },
        { date: 20, dayOfWeek: 'M', status: 'win', pnl: '+$950.00', count: '1 trades' },
        { date: 21, dayOfWeek: 'T', status: 'win', pnl: '+$1,050.00', count: '2 trades' },
        { date: 22, dayOfWeek: 'W', status: 'good_loss', pnl: '-$400.00', count: '1 trades' },
        { date: 23, dayOfWeek: 'T', status: 'win', pnl: '+$1,250.00', count: '3 trades' },
        { date: 24, dayOfWeek: 'F', status: 'win', pnl: '+$1,600.00', count: '2 trades' },
        { date: 25, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED', count: '-' },
        { date: 26, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED', count: '-' },
        { date: 27, dayOfWeek: 'M', status: 'win', pnl: '+$700.00', count: '1 trades' },
        { date: 28, dayOfWeek: 'T', status: 'win', pnl: '+$900.00', count: '2 trades' },
        { date: 29, dayOfWeek: 'W', status: 'good_loss', pnl: '-$150.00', count: '1 trades' },
        { date: 30, dayOfWeek: 'T', status: 'win', pnl: '+$1,150.00', count: '2 trades' },
        { date: 31, dayOfWeek: 'F', status: 'win', pnl: '+$1,450.00', count: '3 trades' }
      ]
    },
    {
      monthName: 'AUGUST 2026',
      totalPnl: '+$8,950.00',
      totalPnlNum: 8950,
      disciplineScore: '98%',
      startOffset: 5, // August 1, 2026 is Saturday (Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sa=5)
      weeklySummaries: [
        { weekLabel: 'Week 1', pnl: '+$2,126.26', count: '7 trades' },
        { weekLabel: 'Week 2', pnl: '+$615.54', count: '7 trades' },
        { weekLabel: 'Week 3', pnl: '+$608.08', count: '21 trades' },
        { weekLabel: 'Week 4', pnl: '+$367.28', count: '7 trades' },
        { weekLabel: 'Week 5', pnl: '-$277.48', count: '3 trades' },
      ],
      days: [
        { date: 1, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED', count: '-' },
        { date: 2, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED', count: '-' },
        { date: 3, dayOfWeek: 'M', status: 'win', pnl: '+$882.84', count: '1 trades' },
        { date: 4, dayOfWeek: 'T', status: 'good_loss', pnl: '-$155.16', count: '1 trades' },
        { date: 5, dayOfWeek: 'W', status: 'win', pnl: '+$900.34', count: '2 trades' },
        { date: 6, dayOfWeek: 'T', status: 'good_loss', pnl: '-$158.66', count: '1 trades' },
        { date: 7, dayOfWeek: 'F', status: 'win', pnl: '+$648.90', count: '2 trades' },
        { date: 8, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED', count: '-' },
        { date: 9, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED', count: '-' },
        { date: 10, dayOfWeek: 'M', status: 'win', pnl: '+$606.84', count: '2 trades' },
        { date: 11, dayOfWeek: 'T', status: 'good_loss', pnl: '-$144.66', count: '1 trades' },
        { date: 12, dayOfWeek: 'W', status: 'win', pnl: '+$444.84', count: '1 trades' },
        { date: 13, dayOfWeek: 'T', status: 'good_loss', pnl: '-$142.32', count: '2 trades' },
        { date: 14, dayOfWeek: 'F', status: 'good_loss', pnl: '-$149.16', count: '1 trades' },
        { date: 15, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED', count: '-' },
        { date: 16, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED', count: '-' },
        { date: 17, dayOfWeek: 'M', status: 'win', pnl: '+$379.36', count: '3 trades' },
        { date: 18, dayOfWeek: 'T', status: 'win', pnl: '+$415.12', count: '1 trades' },
        { date: 19, dayOfWeek: 'W', status: 'good_loss', pnl: '-$134.16', count: '1 trades' },
        { date: 20, dayOfWeek: 'T', status: 'good_loss', pnl: '-$146.16', count: '1 trades' },
        { date: 21, dayOfWeek: 'F', status: 'good_loss', pnl: '-$146.88', count: '1 trades' },
        { date: 22, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED', count: '-' },
        { date: 23, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED', count: '-' },
        { date: 24, dayOfWeek: 'M', status: 'good_loss', pnl: '-$134.60', count: '2 trades' },
        { date: 25, dayOfWeek: 'T', status: 'today', pnl: '-$142.88', count: '1 trades' },
        { date: 26, dayOfWeek: 'W', status: 'win', pnl: '+$4,250.00', count: '2 trades' },
        { date: 27, dayOfWeek: 'T', status: 'upcoming', pnl: '-', count: '-' },
        { date: 28, dayOfWeek: 'F', status: 'upcoming', pnl: '-', count: '-' },
        { date: 29, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED', count: '-' },
        { date: 30, dayOfWeek: 'S', status: 'weekend_rest', pnl: 'MARKET CLOSED', count: '-' },
        { date: 31, dayOfWeek: 'M', status: 'upcoming', pnl: '-', count: '-' }
      ]
    }
  ];

  const currentMonth = monthsData[currentMonthIndex] || monthsData[1];

  const handlePrevMonth = () => {
    soundFx.playPop();
    setCurrentMonthIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextMonth = () => {
    soundFx.playPop();
    setCurrentMonthIndex((prev) => Math.min(monthsData.length - 1, prev + 1));
  };

  const [copiedToast, setCopiedToast] = useState(false);
  const [isScorecardModalOpen, setIsScorecardModalOpen] = useState(false);

  const downloadScorecardImage = () => {
    soundFx.playSuccess();
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 675;
    const ctx = canvas.getContext('2d');

    // Outer Dark Background
    ctx.fillStyle = '#131F24';
    ctx.fillRect(0, 0, 1200, 675);

    // 3D Outer Card Base (8px 3D depth)
    ctx.fillStyle = '#388202';
    ctx.beginPath();
    ctx.roundRect(60, 60, 1080, 555, 32);
    ctx.fill();

    // 3D Outer Card Top Face
    ctx.fillStyle = '#142127';
    ctx.strokeStyle = '#58CC02';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(60, 50, 1080, 555, 32);
    ctx.fill();
    ctx.stroke();

    // VIBRANT GREEN TOP HERO HEADER BANNER (Top 135px)
    ctx.fillStyle = '#58CC02';
    ctx.beginPath();
    ctx.roundRect(60, 50, 1080, 130, [32, 32, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#46A302';
    ctx.fillRect(60, 176, 1080, 4);

    // Header Title Text (White)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '900 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('VERIFIED PERFORMANCE SCORECARD', 120, 95);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${currentMonth.monthName} SCORECARD`, 120, 138);

    // Verified 3D Pill Badge Top Right
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.roundRect(830, 92, 250, 48, 16);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(830, 86, 250, 48, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#388202';
    ctx.font = '900 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('VERIFIED EXECUTION', 860, 116);

    // HERO NET PROFIT 3D CONTAINER (y = 210 to 330)
    ctx.fillStyle = '#142127';
    ctx.beginPath();
    ctx.roundRect(100, 214, 1000, 120, 20);
    ctx.fill();

    ctx.fillStyle = '#182830';
    ctx.strokeStyle = '#20323D';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(100, 208, 1000, 120, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#77909D';
    ctx.font = '900 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('TOTAL NET PROFIT', 130, 245);

    ctx.fillStyle = '#58CC02';
    ctx.font = '900 60px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(currentMonth.totalPnl, 130, 305);

    // 3 CLEAN TACTILE STAT PANELS (y = 360 to 475)
    // Panel 1: Discipline (#1CB0F6)
    ctx.fillStyle = '#147BB0';
    ctx.beginPath();
    ctx.roundRect(100, 372, 300, 115, 20);
    ctx.fill();

    ctx.fillStyle = '#182830';
    ctx.strokeStyle = '#1CB0F6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(100, 366, 300, 115, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1CB0F6';
    ctx.font = '900 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(currentMonth.disciplineScore, 130, 415);

    ctx.fillStyle = '#77909D';
    ctx.font = '900 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('DISCIPLINE SCORE', 130, 448);

    // Panel 2: Streak (#FF6B00)
    ctx.fillStyle = '#9A3412';
    ctx.beginPath();
    ctx.roundRect(450, 372, 300, 115, 20);
    ctx.fill();

    ctx.fillStyle = '#182830';
    ctx.strokeStyle = '#FF6B00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(450, 366, 300, 115, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FF6B00';
    ctx.font = '900 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('14 Days', 480, 415);

    ctx.fillStyle = '#77909D';
    ctx.font = '900 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('WINNING STREAK', 480, 448);

    // Panel 3: Rank (#FFC800)
    ctx.fillStyle = '#B88E00';
    ctx.beginPath();
    ctx.roundRect(800, 372, 300, 115, 20);
    ctx.fill();

    ctx.fillStyle = '#182830';
    ctx.strokeStyle = '#FFC800';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(800, 366, 300, 115, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFC800';
    ctx.font = '900 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Prop Master', 830, 415);

    ctx.fillStyle = '#77909D';
    ctx.font = '900 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('RANK TIER', 830, 448);

    // Footer Watermark
    ctx.fillStyle = '#52656D';
    ctx.font = '800 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('TradePigeon • Master Your Discipline', 100, 555);

    // Download PNG
    const link = document.createElement('a');
    link.download = `TradePigeon_Scorecard_${currentMonth.monthName.replace(' ', '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3500);
  };

  const handleCopyScreenshotSummary = () => {
    soundFx.playSuccess();
    const text = `🦅 TRADEPIGEON VERIFIED PERFORMANCE CALENDAR\n📅 Month: ${currentMonth.monthName}\n💰 Monthly Net P&L: ${currentMonth.totalPnl}\n🎯 Discipline Score: ${currentMonth.disciplineScore} Flawless\n🔥 Streak: 14 Days Active\n#TradePigeon #PropTrading #Discipline`;
    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3500);
  };

  return (
    <main className="flex-1 min-h-screen lg:pl-28 xl:pl-80 xl:pr-8 bg-[#070C1E] p-4 sm:p-6 lg:p-8 text-white space-y-6 pb-24 lg:pb-10 max-w-full overflow-hidden">
      
      {/* 1. TOP HEADER: PURE FLOATING DUOLINGO HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <DuoCalendarIcon className="w-9 h-9 shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex flex-wrap items-center gap-3">
            <span>Performance Calendar</span>
            <span className="text-[#58CC02] text-xl sm:text-2xl font-black">{currentMonth.totalPnl}</span>
          </h1>
        </div>

        {/* Action & Month Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Risk Basket Filter Bar */}
          <div className="flex items-center gap-1.5 bg-[#182830] p-1.5 rounded-2xl border-2 border-[#20323D] border-b-4 border-b-[#142127]">
            <span className="text-[10px] font-black uppercase text-[#77909D] px-2 shrink-0">BASKET:</span>
            {['ALL', ...basketsList.map(b => b.name)].map((basketName) => {
              const isSelected = selectedBasketFilter === basketName;
              return (
                <button
                  key={basketName}
                  onClick={() => {
                    setSelectedBasketFilter(basketName);
                    soundFx.playPop();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1CB0F6] text-white shadow-md'
                      : 'text-[#77909D] hover:text-white'
                  }`}
                >
                  {basketName === 'ALL' ? 'ALL BASKETS' : basketName}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 bg-[#182830] p-1.5 rounded-2xl border-2 border-[#20323D] border-b-4 border-b-[#142127]">
            <button
              onClick={handlePrevMonth}
              disabled={currentMonthIndex === 0}
              className="duo-btn-dark p-2 text-white disabled:opacity-30 cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-black px-4 py-2 rounded-xl bg-[#142127] border border-[#20323D] text-white uppercase tracking-wider shadow-inner">
              {currentMonth.monthName}
            </span>
            <button
              onClick={handleNextMonth}
              disabled={currentMonthIndex === monthsData.length - 1}
              className="duo-btn-dark p-2 text-white disabled:opacity-30 cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={() => {
              soundFx.playPop();
              setIsScorecardModalOpen(true);
            }}
            className="duo-btn-orange px-4 py-3 text-xs uppercase tracking-wider font-black flex items-center gap-2 shadow-lg cursor-pointer"
            title="Preview and download verified monthly scorecard graphic"
          >
            <Share2 size={16} />
            <span>Share Scorecard</span>
          </button>
        </div>
      </div>

      {/* 2. FULL-SCREEN 7-COLUMN MONTHLY CALENDAR GRID WITH WEEKLY TOTALS */}
      <div className="duo-card p-4 sm:p-6 space-y-4 border-2 border-[#20323D] bg-[#142127]">
        
        {/* INTERACTIVE CATEGORY FILTER BUTTONS ENGINE (TACTILE 3D BUTTONS) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#20323D]">
          <div className="flex flex-wrap items-center gap-3">
            {/* BUTTON 1: DISCIPLINED WIN */}
            <button
              onClick={() => {
                soundFx.playPop();
                setActiveCategoryFilter(activeCategoryFilter === 'win' ? 'ALL' : 'win');
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:translate-y-0.5 active:border-b-2 ${
                activeCategoryFilter === 'win'
                  ? 'bg-[#58CC02] border-2 border-[#46A302] border-b-5 border-b-[#388202] text-white scale-105'
                  : 'bg-[#182830] border-2 border-[#20323D] border-b-5 border-b-[#142127] text-[#58CC02] hover:bg-[#20323D]'
              }`}
            >
              <DuoDisciplinedWinIcon className="w-5 h-5 shrink-0" />
              <span>Disciplined Win</span>
            </button>

            {/* BUTTON 2: DISCIPLINED LOSS */}
            <button
              onClick={() => {
                soundFx.playPop();
                setActiveCategoryFilter(activeCategoryFilter === 'good_loss' ? 'ALL' : 'good_loss');
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:translate-y-0.5 active:border-b-2 ${
                activeCategoryFilter === 'good_loss'
                  ? 'bg-[#1CB0F6] border-2 border-[#1899D6] border-b-5 border-b-[#147BB0] text-white scale-105'
                  : 'bg-[#182830] border-2 border-[#20323D] border-b-5 border-b-[#142127] text-[#1CB0F6] hover:bg-[#20323D]'
              }`}
            >
              <DuoDisciplinedLossIcon className="w-5 h-5 shrink-0" />
              <span>Disciplined Loss</span>
            </button>

            {/* BUTTON 3: DISCIPLINED BE */}
            <button
              onClick={() => {
                soundFx.playPop();
                setActiveCategoryFilter(activeCategoryFilter === 'breakeven' ? 'ALL' : 'breakeven');
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:translate-y-0.5 active:border-b-2 ${
                activeCategoryFilter === 'breakeven'
                  ? 'bg-[#CE82FF] border-2 border-[#B955FF] border-b-5 border-b-[#9D28EC] text-white scale-105'
                  : 'bg-[#182830] border-2 border-[#20323D] border-b-5 border-b-[#142127] text-[#CE82FF] hover:bg-[#20323D]'
              }`}
            >
              <DuoDisciplinedBeIcon className="w-5 h-5 shrink-0" />
              <span>Disciplined BE</span>
            </button>

            {/* BUTTON 4: TOXIC WIN */}
            <button
              onClick={() => {
                soundFx.playPop();
                setActiveCategoryFilter(activeCategoryFilter === 'toxic_win' ? 'ALL' : 'toxic_win');
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:translate-y-0.5 active:border-b-2 ${
                activeCategoryFilter === 'toxic_win'
                  ? 'bg-[#FFC800] border-2 border-[#D9AA00] border-b-5 border-b-[#8A6B00] text-slate-950 scale-105'
                  : 'bg-[#182830] border-2 border-[#20323D] border-b-5 border-b-[#142127] text-[#FFC800] hover:bg-[#20323D]'
              }`}
            >
              <DuoToxicWinIcon className="w-5 h-5 shrink-0" />
              <span>Toxic Win</span>
            </button>

            {/* BUTTON 5: TOXIC BE */}
            <button
              onClick={() => {
                soundFx.playPop();
                setActiveCategoryFilter(activeCategoryFilter === 'toxic_be' ? 'ALL' : 'toxic_be');
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:translate-y-0.5 active:border-b-2 ${
                activeCategoryFilter === 'toxic_be'
                  ? 'bg-[#00F0FF] border-2 border-[#00D8E6] border-b-5 border-b-[#00B3BF] text-slate-950 scale-105'
                  : 'bg-[#182830] border-2 border-[#20323D] border-b-5 border-b-[#142127] text-[#00F0FF] hover:bg-[#20323D]'
              }`}
            >
              <DuoToxicBeIcon className="w-5 h-5 shrink-0" />
              <span>Toxic BE</span>
            </button>

            {/* BUTTON 6: DOUBLE FAILURE */}
            <button
              onClick={() => {
                soundFx.playPop();
                setActiveCategoryFilter(activeCategoryFilter === 'double_failure' ? 'ALL' : 'double_failure');
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:translate-y-0.5 active:border-b-2 ${
                activeCategoryFilter === 'double_failure'
                  ? 'bg-[#FF4B4B] border-2 border-[#E53935] border-b-5 border-b-[#C62828] text-white scale-105'
                  : 'bg-[#182830] border-2 border-[#20323D] border-b-5 border-b-[#142127] text-[#FF4B4B] hover:bg-[#20323D]'
              }`}
            >
              <DuoDoubleFailureIcon className="w-5 h-5 shrink-0" />
              <span>Double Failure</span>
            </button>

            {/* BUTTON 7: MISSED TRADE */}
            <button
              onClick={() => {
                soundFx.playPop();
                setActiveCategoryFilter(activeCategoryFilter === 'missed_trade' ? 'ALL' : 'missed_trade');
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:translate-y-0.5 active:border-b-2 ${
                activeCategoryFilter === 'missed_trade'
                  ? 'bg-amber-500 border-2 border-amber-600 border-b-5 border-b-amber-700 text-slate-950 scale-105'
                  : 'bg-[#182830] border-2 border-[#20323D] border-b-5 border-b-[#142127] text-amber-400 hover:bg-[#20323D]'
              }`}
            >
              <DuoMissedTradeIcon className="w-5 h-5 shrink-0" />
              <span>Missed Trade</span>
            </button>
          </div>

          {activeCategoryFilter !== 'ALL' && (
            <button
              onClick={() => {
                soundFx.playPop();
                setActiveCategoryFilter('ALL');
              }}
              className="px-3 py-1.5 rounded-xl bg-[#20323D] hover:bg-slate-700 text-xs font-black text-white cursor-pointer transition-all border border-[#37464F]"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Days of Week Header & Grid Container (Horizontal scroll on narrow screens to prevent text overlap) */}
        <div className="overflow-x-auto p-3.5 -m-3.5">
          <div className="min-w-[680px] md:min-w-0 space-y-2">
            {/* Days of Week Header (Mon-Sun + Weekly Summary Column) */}
            <div className="grid grid-cols-8 gap-2 text-center text-xs font-black text-[#52656D] uppercase tracking-wider pb-2 border-b border-[#20323D]">
              <div>Mo</div>
              <div>Tu</div>
              <div>We</div>
              <div>Th</div>
              <div>Fr</div>
              <div className="text-slate-500">Sa</div>
              <div className="text-slate-500">Su</div>
              <div className="text-[#1CB0F6]">Weekly</div>
            </div>

            {/* Calendar Day Tiles Grid */}
            <div className="grid grid-cols-8 gap-2">
          {(() => {
            const startOffset = currentMonth.startOffset || 0;
            const items = [];

            // Add leading offset cells for days of previous month
            for (let o = 0; o < startOffset; o++) {
              items.push({ isOffset: true, key: `offset-${o}` });
            }

            // Add actual month days
            currentMonth.days.forEach((day) => {
              items.push(day);
            });

            // Render 7 days per row + 1 weekly summary column
            const rows = [];
            let dayIdx = 0;
            let weekCount = 0;

            while (dayIdx < items.length) {
              const weekItems = items.slice(dayIdx, dayIdx + 7);
              while (weekItems.length < 7) {
                weekItems.push({ isEmpty: true, key: `empty-${weekItems.length}` });
              }

              const weeklyData = currentMonth.weeklySummaries[weekCount] || { weekLabel: `Week ${weekCount + 1}`, pnl: '+$0.00', count: '0 trades' };

              rows.push(
                <React.Fragment key={`week-row-${weekCount}`}>
                  {weekItems.map((item, i) => {
                    if (!item || item.isEmpty || item.isOffset) {
                      return <div key={item?.key || `empty-${i}`} className="p-3 rounded-2xl bg-[#131F24]/30 border-2 border-[#1B2A32] opacity-20 min-h-[90px]" />;
                    }

                    const day = item;
                    const hasTrades = day.pnl && day.pnl !== '-' && day.pnl !== 'MARKET CLOSED' && !day.pnl.includes('CLOSED');
                    const isWin = day.status === 'win' || day.status === 'FOLLOWED_WIN';
                    const isGoodLoss = day.status === 'good_loss' || day.status === 'FOLLOWED_LOSS';
                    const isBreakeven = day.status === 'breakeven';
                    const isToxicWin = day.status === 'toxic_win' || day.status === 'violate_win';
                    const isToxicBe = day.status === 'toxic_be';
                    const isDoubleFailure = day.status === 'double_failure' || day.status === 'violate_loss' || (day.status === 'loss' && !isGoodLoss);
                    const isMissedTrade = day.status === 'missed_trade';
                    const isToday = day.status === 'today';
                    const isVacation = day.status === 'holiday_freeze';
                    const isWeekend = (day.status === 'weekend_rest' || day.status === 'rest') && !hasTrades;

                    const isMatch = activeCategoryFilter === 'ALL' || 
                      (activeCategoryFilter === 'win' && isWin) ||
                      (activeCategoryFilter === 'good_loss' && isGoodLoss) ||
                      (activeCategoryFilter === 'breakeven' && isBreakeven) ||
                      (activeCategoryFilter === 'toxic_win' && isToxicWin) ||
                      (activeCategoryFilter === 'toxic_be' && isToxicBe) ||
                      (activeCategoryFilter === 'double_failure' && isDoubleFailure) ||
                      (activeCategoryFilter === 'missed_trade' && isMissedTrade);

                    const isHighlighted = activeCategoryFilter !== 'ALL' && isMatch;
                    const isDimmed = activeCategoryFilter !== 'ALL' && !isMatch;

                    let solidCardStyle = "bg-[#182830] border-2 border-[#20323D] text-slate-300";
                    if (isWin) solidCardStyle = "bg-[#58CC02] border-2 border-[#46A302] border-b-4 border-b-[#388202] text-white shadow-md";
                    else if (isGoodLoss) solidCardStyle = "bg-[#1CB0F6] border-2 border-[#1899D6] border-b-4 border-b-[#147BB0] text-white shadow-md";
                    else if (isBreakeven) solidCardStyle = "bg-[#CE82FF] border-2 border-[#B955FF] border-b-4 border-b-[#9D28EC] text-white shadow-md";
                    else if (isToxicWin) solidCardStyle = "bg-[#FFC800] border-2 border-[#D9AA00] border-b-4 border-b-[#8A6B00] text-slate-950 shadow-md";
                    else if (isToxicBe) solidCardStyle = "bg-[#00F0FF] border-2 border-[#00D8E6] border-b-4 border-b-[#00B3BF] text-slate-950 shadow-md";
                    else if (isDoubleFailure) solidCardStyle = "bg-[#FF4B4B] border-2 border-[#E53935] border-b-4 border-b-[#C62828] text-white shadow-md";
                    else if (isMissedTrade) solidCardStyle = "bg-amber-500 border-2 border-amber-600 border-b-4 border-b-amber-700 text-slate-950 shadow-md";
                    else if (isToday) solidCardStyle = "bg-[#FF6B00] border-2 border-[#C2410C] border-b-4 border-b-[#9A3412] text-white shadow-lg animate-pulse";
                    else if (isVacation) solidCardStyle = "bg-[#00F0FF] border-2 border-[#00D8E6] border-b-4 border-b-[#00B3BF] text-slate-950 shadow-md";
                    else if (isWeekend) solidCardStyle = "bg-[#142127]/60 border-2 border-[#20323D]/50 text-slate-500 opacity-40";

                    return (
                      <div
                        key={day.date}
                        onClick={() => {
                          soundFx.playPop();
                          if (day.pnl !== 'MARKET CLOSED') {
                            setActiveModalDay(day);
                          }
                        }}
                        className={`p-3 rounded-2xl transition-all duration-300 cursor-pointer min-h-[105px] flex flex-col items-center justify-between relative group active:scale-95 ${solidCardStyle} ${
                          isHighlighted
                            ? 'scale-[1.05] ring-4 ring-white z-20 shadow-2xl'
                            : isDimmed
                            ? 'opacity-20 grayscale scale-[0.95]'
                            : 'hover:brightness-110'
                        }`}
                      >
                        {/* Top Row: Date & Trade Count */}
                        <div className="w-full flex items-center justify-between text-[11px] font-black">
                          <span className="font-black text-xs">{day.date}</span>
                          <span className="text-[9px] font-black uppercase opacity-80">{day.count}</span>
                        </div>

                        {/* Center Hero: 3D Badge Icon */}
                        <div className="my-1 flex items-center justify-center">
                          {isToday ? (
                            <DuoCalendarIcon className="w-9 h-9 shrink-0 drop-shadow" />
                          ) : isWin ? (
                            <DuoDisciplinedWinIcon className="w-9 h-9 shrink-0 drop-shadow" />
                          ) : isGoodLoss ? (
                            <DuoDisciplinedLossIcon className="w-9 h-9 shrink-0 drop-shadow" />
                          ) : isBreakeven ? (
                            <DuoDisciplinedBeIcon className="w-9 h-9 shrink-0 drop-shadow" />
                          ) : isToxicWin ? (
                            <DuoToxicWinIcon className="w-9 h-9 shrink-0 drop-shadow" />
                          ) : isToxicBe ? (
                            <DuoToxicBeIcon className="w-9 h-9 shrink-0 drop-shadow" />
                          ) : isDoubleFailure ? (
                            <DuoDoubleFailureIcon className="w-9 h-9 shrink-0 drop-shadow" />
                          ) : isMissedTrade ? (
                            <DuoMissedTradeIcon className="w-9 h-9 shrink-0 drop-shadow" />
                          ) : (
                            <span className="text-xs font-black opacity-40">-</span>
                          )}
                        </div>

                        {/* Bottom Row: Clean P&L Typography */}
                        <div className="w-full text-center">
                          <div className="text-xs font-black font-mono tracking-tight opacity-90">
                            {day.pnl}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Weekly Summary Column Cell */}
                  <div className="p-3 rounded-2xl bg-[#182830] border-2 border-[#20323D] border-l-2 border-l-[#1CB0F6] text-center flex flex-col justify-between min-h-[105px]">
                    <div className="text-[10px] font-black uppercase text-[#1CB0F6] tracking-wider">{weeklyData.weekLabel}</div>
                    <div className={`text-xs sm:text-sm font-black font-mono tracking-tight my-auto ${
                      weeklyData.pnl.startsWith('+') ? 'text-[#58CC02]' : 'text-[#FF4B4B]'
                    }`}>
                      {weeklyData.pnl}
                    </div>
                    <div className="text-[9px] font-bold text-slate-500">{weeklyData.count}</div>
                  </div>
                </React.Fragment>
              );

              dayIdx += 7;
              weekCount++;
            }

            return rows;
          })()}
        </div>
      </div>
    </div>
  </div>

      {/* INTERACTIVE DAY EXECUTION DETAILS POP-UP MODAL */}
      {activeModalDay && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="duo-card max-w-lg w-full p-6 space-y-5 border-2 border-[#1CB0F6] relative bg-[#182830]">
            <button 
              onClick={() => {
                soundFx.playPop();
                setActiveModalDay(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-xl bg-[#20323D] text-slate-400 hover:text-white cursor-pointer font-black text-xs"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <DuoCalendarIcon className="w-10 h-10 shrink-0" />
              <div>
                <h3 className="text-xl font-black text-white">Day {activeModalDay.date} Execution Summary</h3>
                <p className="text-xs font-bold text-[#77909D]">{currentMonth.monthName}</p>
              </div>
            </div>

            {/* SOLID COLOR 3D DUOLINGO COMPLETED DAY CARD */}
            <div 
              onClick={() => soundFx.playPop()}
              className="w-full p-6 sm:p-8 rounded-3xl border-2 border-[#58CC02] border-b-[6px] border-b-[#388202] bg-[#0D1635] text-white space-y-6 shadow-xl hover:shadow-[0_20px_50px_rgba(88,204,2,0.25)] hover:-translate-y-1 active:translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden relative group text-left"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#58CC02]" />

              {/* Top Header Badge */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Duo3dCheckBadge className="w-11 h-11 shrink-0 drop-shadow-lg group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-[#58CC02] block">
                      DAY {activeModalDay.date} &bull; {currentMonth.monthName}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight group-hover:text-[#58CC02] transition-colors">
                      Flawless Execution
                    </h3>
                  </div>
                </div>
                <span className="text-xs font-black text-white bg-[#58CC02] border-b-4 border-b-[#388202] px-4 py-1.5 rounded-2xl shadow-md">
                  {activeModalDay.pnl}
                </span>
              </div>

              {/* 1. HERO SESSION DEBRIEF NOTE (BIG & FRONT-AND-CENTER, NO INNER BOX) */}
              <div className="flex items-start gap-4 py-3 border-y border-[#1C2A4E]">
                <Duo3dZenBadge className="w-11 h-11 shrink-0 drop-shadow-md mt-1" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <span className="text-xs font-black uppercase tracking-widest text-[#1CB0F6]">
                    KEY SESSION TAKEAWAY:
                  </span>
                  <p className="text-base sm:text-lg font-black text-white leading-snug italic">
                    "{loadStoredData(`goodtrader_session_note_day_${activeModalDay.date}`, 'Respected 1.0R stop loss on NQ sweep. Zero tilt chasing after first loss.')}"
                  </p>
                </div>
              </div>

              {/* 2. THE 4 TYPES OF TRADES SOLID 3D COLOR TILES */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Tile 1: Solid Duolingo Green */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFx.playPop();
                  }}
                  className="p-4 rounded-2xl bg-[#58CC02] border-b-4 border-[#388202] text-white space-y-1 shadow-lg hover:-translate-y-1 hover:scale-105 active:translate-y-0.5 cursor-pointer transition-all duration-150 ring-2 ring-white/20"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/95 block">DISCIPLINED WIN</span>
                  <div className="text-xl font-black text-white">+$1,290.00</div>
                </div>

                {/* Tile 2: Solid Duolingo Cyan */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFx.playPop();
                  }}
                  className="p-4 rounded-2xl bg-[#1CB0F6] border-b-4 border-[#147BB0] text-white space-y-1 shadow-lg hover:-translate-y-1 hover:scale-105 active:translate-y-0.5 cursor-pointer transition-all duration-150 ring-2 ring-white/20"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/95 block">DISCIPLINED LOSS</span>
                  <div className="text-xl font-black text-white">-$425.00</div>
                </div>

                {/* Tile 3: Solid Duolingo Gold */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFx.playPop();
                  }}
                  className="p-4 rounded-2xl bg-[#182830] border-2 border-[#20323D] text-slate-300 hover:border-[#FFC800] space-y-1 shadow-md hover:-translate-y-1 hover:scale-105 active:translate-y-0.5 cursor-pointer transition-all duration-150"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">TOXIC WIN</span>
                  <div className="text-xl font-black text-slate-300">$0.00</div>
                </div>

                {/* Tile 4: Solid Duolingo Red */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFx.playPop();
                  }}
                  className="p-4 rounded-2xl bg-[#182830] border-2 border-[#20323D] text-slate-300 hover:border-[#FF4B4B] space-y-1 shadow-md hover:-translate-y-1 hover:scale-105 active:translate-y-0.5 cursor-pointer transition-all duration-150"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">DOUBLE FAILURE</span>
                  <div className="text-xl font-black text-slate-300">$0.00</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playPop();
                setActiveModalDay(null);
              }}
              className="w-full py-3.5 duo-btn-blue text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg"
            >
              Close Session Breakdown
            </button>
          </div>
        </div>
      )}

      {/* SLEEK FLOATING DUOLINGO TOAST NOTIFICATION */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div className="duo-card p-4 bg-[#58CC02] border-2 border-[#46A302] border-b-4 border-b-[#388202] text-white flex items-center gap-3">
            <Sparkles size={20} className="shrink-0" />
            <div>
              <div className="text-xs font-black">Performance Scorecard Ready!</div>
              <div className="text-[10px] font-bold text-white/90">Downloaded image / copied text to clipboard.</div>
            </div>
          </div>
        </div>
      )}

      {/* VISUAL SCORECARD PICTURE PREVIEW & EXPORT MODAL */}
      {isScorecardModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="duo-card max-w-3xl w-full p-6 sm:p-8 space-y-6 border-2 border-[#FF6B00] relative bg-[#182830]">
            <button 
              onClick={() => {
                soundFx.playPop();
                setIsScorecardModalOpen(false);
              }}
              className="absolute top-4 right-4 p-2.5 rounded-xl bg-[#20323D] text-slate-400 hover:text-white cursor-pointer font-black text-xs"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <DuoTrophyIcon className="w-10 h-10 shrink-0" />
              <div>
                <h3 className="text-xl font-black text-white">Verified Scorecard Graphic</h3>
                <p className="text-xs font-bold text-[#77909D]">Download high-res PNG picture card to share on X & Discord</p>
              </div>
            </div>

            {/* VERIFIED PERFORMANCE SCORECARD CARD */}
            <div className="rounded-3xl bg-[#142127] border-4 border-[#58CC02] border-b-8 border-b-[#388202] relative overflow-hidden text-left shadow-2xl space-y-0">
              
              {/* VIBRANT DUOLINGO GREEN HERO HEADER BANNER */}
              <div className="bg-[#58CC02] p-5 sm:p-6 border-b-4 border-[#46A302] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <DuoTrophyIcon className="w-11 h-11 shrink-0 drop-shadow-md" />
                  <div>
                    <span className="text-[10px] font-black text-white/80 uppercase tracking-widest block">VERIFIED PERFORMANCE SCORECARD</span>
                    <h4 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-none mt-0.5">{currentMonth.monthName} SCORECARD</h4>
                  </div>
                </div>

                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#388202] bg-white border-2 border-white border-b-4 border-b-slate-200 px-3.5 py-1.5 rounded-2xl shadow-md shrink-0">
                  VERIFIED EXECUTION
                </span>
              </div>

              {/* MAIN CARD BODY */}
              <div className="p-6 sm:p-7 space-y-5">
                
                {/* HERO NET PROFIT 3D CONTAINER */}
                <div className="p-5 sm:p-6 rounded-2xl bg-[#182830] border-2 border-[#20323D] border-b-4 border-b-[#142127] flex items-center justify-between gap-4 shadow-sm">
                  <div>
                    <div className="text-xs font-black text-[#77909D] uppercase tracking-wider">Total Net Profit</div>
                    <div className="text-4xl sm:text-5xl font-black text-[#58CC02] tracking-tight mt-1">{currentMonth.totalPnl}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-black text-[#58CC02] bg-[#58CC02]/15 px-3 py-1.5 rounded-xl border border-[#58CC02]/30 uppercase tracking-wider">
                      100% PLAYBOOK FOLLOWED
                    </span>
                  </div>
                </div>

                {/* 3 CLEAN TACTILE STAT PANELS WITH VIBRANT ACCENT BORDERS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  
                  {/* Panel 1: Discipline */}
                  <div className="p-4 rounded-2xl bg-[#182830] border-2 border-[#1CB0F6] border-b-4 border-b-[#147BB0] flex items-center gap-3.5 shadow-md">
                    <DuoShieldIcon className="w-9 h-9 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-2xl font-black text-[#1CB0F6] leading-none whitespace-nowrap">{currentMonth.disciplineScore}</div>
                      <div className="text-[10px] font-black text-[#77909D] uppercase tracking-wider mt-1 whitespace-nowrap">Discipline Score</div>
                    </div>
                  </div>

                  {/* Panel 2: Streak */}
                  <div className="p-4 rounded-2xl bg-[#182830] border-2 border-[#FF6B00] border-b-4 border-b-[#9A3412] flex items-center gap-3.5 shadow-md">
                    <DuoLightningIcon className="w-9 h-9 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-2xl font-black text-[#FF6B00] leading-none whitespace-nowrap">{currentMonth.streak || '14 Days'}</div>
                      <div className="text-[10px] font-black text-[#77909D] uppercase tracking-wider mt-1 whitespace-nowrap">Winning Streak</div>
                    </div>
                  </div>

                  {/* Panel 3: Rank */}
                  <div className="p-4 rounded-2xl bg-[#182830] border-2 border-[#FFC800] border-b-4 border-b-[#B88E00] flex items-center gap-3.5 shadow-md">
                    <DuoTrophyIcon className="w-9 h-9 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-lg sm:text-xl font-black text-[#FFC800] leading-none whitespace-nowrap">Prop Master</div>
                      <div className="text-[10px] font-black text-[#77909D] uppercase tracking-wider mt-1 whitespace-nowrap">Rank Tier</div>
                    </div>
                  </div>
                </div>

                {/* Footer Watermark */}
                <div className="pt-2 text-[10px] font-extrabold text-[#52656D] flex items-center justify-between border-t border-[#20323D]">
                  <span>TradePigeon • Master Your Discipline</span>
                  <span className="font-mono text-[9px] text-[#77909D]">TRADEPIGEON.APP</span>
                </div>
              </div>
            </div>

            {/* EXPORT ACTION BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={downloadScorecardImage}
                className="w-full py-3.5 duo-btn-orange text-xs tracking-wide flex items-center justify-center gap-2 cursor-pointer font-black"
              >
                <Download size={16} />
                <span>Download Scorecard Image</span>
              </button>

              <button
                onClick={handleCopyScreenshotSummary}
                className="w-full py-3.5 duo-btn-blue text-xs tracking-wide flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 size={16} />
                <span>Copy Text Summary</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
