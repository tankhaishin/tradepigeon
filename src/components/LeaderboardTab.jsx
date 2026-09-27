import React, { useState, useEffect, useMemo } from 'react';
import { Flame, Lock, Trophy, Shield, Check, Zap, Sparkles, Star, ChevronRight, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { DuoTrophyIcon, DuoShieldIcon, DuoLightningIcon, DuoGemIcon } from './DuoIcons';
import { loadStoredData, subscribeToStorageUpdate, DEFAULT_USER_STATS } from '../utils/storage';
import { buildWeeklyLeagueCohort } from '../utils/leagueCohortEngine';

const LEAGUE_TIERS = [
  {
    id: 'bronze',
    name: 'Bronze League',
    minDp: 0,
    maxDp: 499,
    color: '#CD7F32',
    bgClass: 'bg-amber-900/20 border-amber-800/40 text-amber-500',
    perk: 'Playbook checklists & execution tracking'
  },
  {
    id: 'silver',
    name: 'Silver League',
    minDp: 500,
    maxDp: 999,
    color: '#C0C0C0',
    bgClass: 'bg-slate-700/20 border-slate-600/40 text-slate-300',
    perk: 'Streak Freeze & daily session debriefs'
  },
  {
    id: 'gold',
    name: 'Gold League',
    minDp: 1000,
    maxDp: 1999,
    color: '#FFD700',
    bgClass: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
    perk: 'Portfolio risk guards & trade expectancy'
  },
  {
    id: 'sapphire',
    name: 'Sapphire League',
    minDp: 2000,
    maxDp: 3499,
    color: '#00F0FF',
    bgClass: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400',
    perk: 'Tilt intervention & psychology metrics'
  },
  {
    id: 'ruby',
    name: 'Ruby League',
    minDp: 3500,
    maxDp: 4999,
    color: '#FF4B4B',
    bgClass: 'bg-rose-500/20 border-rose-500/40 text-rose-400',
    perk: 'Custom playbooks & risk stress tests'
  },
  {
    id: 'diamond',
    name: 'Diamond League',
    minDp: 5000,
    maxDp: Infinity,
    color: '#1CB0F6',
    bgClass: 'bg-sky-500/20 border-sky-500/40 text-sky-400',
    perk: 'Master division status & honors'
  }
];

export default function LeaderboardTab() {
  const [userDp, setUserDp] = useState(() => loadStoredData('tradepigeon_user_dp', 0));
  const [userStats, setUserStats] = useState(() => loadStoredData('tradepigeon_user_stats', DEFAULT_USER_STATS));
  const [googleUser, setGoogleUser] = useState(() => loadStoredData('tradepigeon_auth_user', null) || loadStoredData('tradepigeon_google_user', null));

  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdate(({ key, legacyKey, value }) => {
      if (key === 'tradepigeon_user_dp') {
        setUserDp(Number(value) || 0);
      }
      if (key === 'tradepigeon_user_stats') {
        setUserStats(value || DEFAULT_USER_STATS);
      }
      if (key === 'tradepigeon_auth_user' || key === 'tradepigeon_google_user' || legacyKey === 'tradepigeon_google_user') {
        setGoogleUser(value);
      }
    });
    return unsubscribe;
  }, []);

  const baseName = googleUser?.name || userStats?.username || 'Trader';
  const effectiveDp = Number(userDp) || Number(userStats?.disciplinePoints) || 0;
  const [viewMode, setViewMode] = useState('standings'); // 'standings' | 'roadmap'

  // Determine Current Tier
  const currentTierIndex = LEAGUE_TIERS.findIndex(
    tier => effectiveDp >= tier.minDp && (tier.maxDp === Infinity || effectiveDp <= tier.maxDp)
  );
  const safeTierIndex = currentTierIndex !== -1 ? currentTierIndex : 0;
  const currentTier = LEAGUE_TIERS[safeTierIndex];
  const nextTier = safeTierIndex < LEAGUE_TIERS.length - 1 ? LEAGUE_TIERS[safeTierIndex + 1] : null;

  // Compute Progress to Next Tier
  const progressPercent = nextTier 
    ? Math.min(100, Math.max(0, Math.round(((effectiveDp - currentTier.minDp) / (nextTier.minDp - currentTier.minDp)) * 100)))
    : 100;
  const dpNeeded = nextTier ? nextTier.minDp - effectiveDp : 0;

  // Generate deterministic 30-trader weekly cohort around user's division
  const cohortData = useMemo(() => {
    return buildWeeklyLeagueCohort({
      tierId: currentTier.id,
      minDp: currentTier.minDp,
      maxDp: currentTier.maxDp,
      userDp: effectiveDp,
      userName: baseName,
      userStreak: userStats?.streakDays || 0
    });
  }, [currentTier.id, currentTier.minDp, currentTier.maxDp, effectiveDp, baseName, userStats?.streakDays]);

  return (
    <main className="flex-1 min-h-screen lg:pl-28 xl:pl-80 xl:pr-[416px] bg-[#070C1E] p-4 sm:p-6 lg:p-10 text-white space-y-8 pb-24 lg:pb-10 max-w-full relative">
      
      {/* 1. HERO LEADERBOARD EMBLEM & CENTERED HEADER */}
      <div className="flex flex-col items-center justify-center text-center space-y-3 py-2">
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl border-4 bg-[#FFB800] border-[#D99B00] border-b-6 border-b-[#B38000] text-slate-950 flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
            <DuoTrophyIcon className="w-12 h-12 shrink-0 drop-shadow-md" />
          </div>
          <span className="absolute -top-2 -right-2 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg border shadow-md bg-[#FF6B00] text-white border-[#C2410C]">
            ACTIVE
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Leagues</h1>
        </div>
      </div>

      {/* 2. CURRENT OPERATOR TIER CARD */}
      <div className="duo-card p-6 sm:p-8 space-y-6 border-2 border-[#1CB0F6] bg-[#142127]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#1CB0F6]/20 border-2 border-[#1CB0F6] flex items-center justify-center text-[#1CB0F6] shrink-0 font-black text-xl shadow-inner">
              {baseName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white">{baseName}</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/40">
                  VERIFIED
                </span>
              </div>
              <div className="text-xs font-bold text-[#77909D] flex items-center gap-2 mt-0.5">
                <span className="text-[#FFC800] font-black">{currentTier.name}</span>
                <span>&bull;</span>
                <Flame size={12} className="text-[#FF6B00] fill-[#FF6B00]" />
                <span>{userStats?.streakDays || 0} Day Streak</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-2xl sm:text-3xl font-black text-[#58CC02]">{effectiveDp.toLocaleString()} DP</div>
            <div className="text-[10px] font-black uppercase text-[#77909D] tracking-wider">Discipline Points</div>
          </div>
        </div>

        {/* Progress to Next Tier */}
        <div className="space-y-2 pt-2 border-t border-[#20323D]">
          <div className="flex items-center justify-between text-xs font-black">
            <span className="text-[#77909D] uppercase tracking-wider">
              {nextTier ? `Progression toward ${nextTier.name}` : 'Maximum League Tier Reached!'}
            </span>
            <span className="text-white">
              {nextTier ? `${dpNeeded.toLocaleString()} DP remaining` : 'Elite Status'}
            </span>
          </div>
          <div className="w-full h-3.5 rounded-full bg-[#182830] border border-[#20323D] overflow-hidden p-0.5">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-[#1CB0F6] to-[#58CC02] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. TACTILE VIEW TOGGLE: STANDINGS VS ROADMAP */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#20323D] pb-3">
        <button
          onClick={() => setViewMode('standings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
            viewMode === 'standings'
              ? 'bg-[#1CB0F6] text-white border-b-4 border-b-[#147BB0] shadow-lg'
              : 'bg-[#142127] text-slate-400 hover:text-white border-2 border-[#20323D]'
          }`}
        >
          <Trophy size={14} />
          <span>Weekly Division Standings (30 Traders)</span>
        </button>
        <button
          onClick={() => setViewMode('roadmap')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
            viewMode === 'roadmap'
              ? 'bg-[#1CB0F6] text-white border-b-4 border-b-[#147BB0] shadow-lg'
              : 'bg-[#142127] text-slate-400 hover:text-white border-2 border-[#20323D]'
          }`}
        >
          <Sparkles size={14} />
          <span>Division Tiers Roadmap</span>
        </button>
      </div>

      {viewMode === 'standings' ? (
        /* WEEKLY 30-TRADER COHORT STANDINGS */
        <div className="duo-card p-5 sm:p-6 space-y-4 border-2 border-[#20323D] bg-[#142127]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#20323D] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">{currentTier.name} • Cohort #{cohortData.weekId}</h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/40">
                  LIVE
                </span>
              </div>
              <p className="text-xs font-medium text-[#77909D] mt-0.5">
                Top 5 advance to the next league division on Sunday midnight reset.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[#182830] px-3.5 py-1.5 rounded-xl border border-[#20323D] text-xs font-bold text-slate-300 shrink-0">
              <Clock size={14} className="text-[#FF6B00]" />
              <span>Resets in: <strong className="text-white">{cohortData.timeRemaining.formatted}</strong></span>
            </div>
          </div>

          {/* User Status Banner */}
          <div className={`p-3.5 rounded-2xl border-2 flex items-center justify-between text-xs font-black ${
            cohortData.isPromotion 
              ? 'bg-[#58CC02]/10 border-[#58CC02] text-[#58CC02]'
              : cohortData.isRelegation
              ? 'bg-rose-500/10 border-rose-500 text-rose-400'
              : 'bg-[#1CB0F6]/10 border-[#1CB0F6] text-[#1CB0F6]'
          }`}>
            <div className="flex items-center gap-2">
              <span>{cohortData.isPromotion ? '🎉' : cohortData.isRelegation ? '⚠️' : '⚡'}</span>
              <span>Your Standing: <strong>Rank #{cohortData.userRank} of 30</strong></span>
            </div>
            <span className="uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-md bg-black/30">
              {cohortData.isPromotion ? 'PROMOTION ZONE' : cohortData.isRelegation ? 'RELEGATION RISK' : 'SAFE ZONE'}
            </span>
          </div>

          {/* 30 Competitor Rows */}
          <div className="space-y-2">
            {cohortData.competitors.map((trader) => {
              const isPromo = trader.rank <= 5;
              const isRelegated = trader.rank >= 26;

              return (
                <React.Fragment key={trader.id}>
                  {/* Promotion Zone Divider after Rank 5 */}
                  {trader.rank === 6 && (
                    <div className="py-2 flex items-center gap-3">
                      <div className="flex-1 h-px bg-[#58CC02]/40" />
                      <div className="text-[10px] font-black uppercase text-[#58CC02] tracking-wider flex items-center gap-1.5 bg-[#58CC02]/10 px-3 py-1 rounded-full border border-[#58CC02]/30">
                        <ArrowUp size={12} />
                        <span>Promotion Zone Cutoff (Top 5 Advance)</span>
                      </div>
                      <div className="flex-1 h-px bg-[#58CC02]/40" />
                    </div>
                  )}

                  {/* Relegation Zone Divider before Rank 26 */}
                  {trader.rank === 26 && (
                    <div className="py-2 flex items-center gap-3">
                      <div className="flex-1 h-px bg-rose-500/40" />
                      <div className="text-[10px] font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30">
                        <ArrowDown size={12} />
                        <span>Relegation Zone Cutoff (Bottom 5 Demote)</span>
                      </div>
                      <div className="flex-1 h-px bg-rose-500/40" />
                    </div>
                  )}

                  <div
                    className={`p-3 sm:p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                      trader.isUser
                        ? 'bg-[#58CC02]/15 border-[#58CC02] border-b-4 border-b-[#3C8901] shadow-lg ring-2 ring-[#58CC02]/30'
                        : isPromo
                        ? 'bg-[#182830] border-[#58CC02]/30 text-slate-300'
                        : isRelegated
                        ? 'bg-[#182830]/70 border-rose-500/20 text-slate-400'
                        : 'bg-[#182830] border-[#20323D] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank Indicator */}
                      <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        trader.rank === 1
                          ? 'bg-[#FFD700] text-slate-950 shadow-md font-black'
                          : trader.rank === 2
                          ? 'bg-[#C0C0C0] text-slate-950 font-black'
                          : trader.rank === 3
                          ? 'bg-[#CD7F32] text-white font-black'
                          : isPromo
                          ? 'bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/40'
                          : isRelegated
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-[#142127] text-slate-400 border border-[#20323D]'
                      }`}>
                        {trader.rank}
                      </div>

                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        trader.isUser ? 'bg-[#58CC02] text-white' : 'bg-[#20323D] text-[#1CB0F6]'
                      }`}>
                        {trader.initial}
                      </div>

                      {/* Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 truncate">
                          <span className={`text-xs font-black truncate ${trader.isUser ? 'text-white' : 'text-slate-200'}`}>
                            {trader.name}
                          </span>
                          {trader.isUser && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#58CC02] text-white shrink-0">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-bold text-[#77909D] flex items-center gap-2 truncate">
                          <span className="truncate">{trader.title}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-0.5 text-[#FF6B00] shrink-0">
                            <Flame size={10} className="fill-[#FF6B00]" />
                            <span>{trader.streak}d</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* DP Score */}
                    <div className="text-right shrink-0">
                      <div className={`text-xs sm:text-sm font-black ${trader.isUser ? 'text-[#58CC02]' : 'text-white'}`}>
                        {trader.dp.toLocaleString()} DP
                      </div>
                      <div className="text-[9px] font-bold text-[#52656D] uppercase">
                        {isPromo ? 'Advancing' : isRelegated ? 'Demoting' : 'Safe'}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : (
        /* 3. LEAGUE TIERS ROADMAP */
        <div className="duo-card p-5 sm:p-6 space-y-4 border-2 border-[#20323D] bg-[#142127]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white">Discipline League Roadmap</h2>
            <span className="text-xs font-black text-[#1CB0F6] uppercase">6 Division Tiers</span>
          </div>

          <div className="space-y-2.5">
            {LEAGUE_TIERS.map((tier, idx) => {
              const isUnlocked = effectiveDp >= tier.minDp;
              const isCurrent = idx === safeTierIndex;

              return (
                <div
                  key={tier.id}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-[#1CB0F6]/10 border-[#1CB0F6] border-b-4 border-b-[#147BB0] shadow-lg'
                      : isUnlocked
                      ? 'bg-[#182830] border-[#20323D] text-slate-300'
                      : 'bg-[#142127]/60 border-[#182830] text-slate-500 opacity-60'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 font-black ${
                      isCurrent
                        ? 'bg-[#1CB0F6] border-[#147BB0] text-white shadow-md'
                        : isUnlocked
                        ? 'bg-[#58CC02]/20 border-[#58CC02]/40 text-[#58CC02]'
                        : 'bg-[#20323D] border-[#20323D] text-slate-500'
                    }`}>
                      {isCurrent ? (
                        <Star size={18} className="fill-white" />
                      ) : isUnlocked ? (
                        <Check size={18} />
                      ) : (
                        <Lock size={16} />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{tier.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-[#1CB0F6] text-white">
                            CURRENT TIER
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-[#77909D] mt-0.5 max-w-md">
                        {tier.perk}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 pl-13 sm:pl-0">
                    <div className="text-xs font-black text-slate-300">
                      {tier.maxDp === Infinity ? `${tier.minDp.toLocaleString()}+ DP` : `${tier.minDp.toLocaleString()} – ${tier.maxDp.toLocaleString()} DP`}
                    </div>
                    <div className="text-[10px] font-bold text-[#52656D]">
                      {isUnlocked ? 'Unlocked' : `Requires ${tier.minDp.toLocaleString()} DP`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. PRIVACY & LOCAL-FIRST NOTE */}
      <div className="p-4 rounded-2xl bg-[#142127] border border-[#20323D] text-center space-y-1">
        <div className="flex items-center justify-center gap-2 text-xs font-black text-[#77909D] uppercase tracking-wider">
          <Shield size={14} className="text-[#1CB0F6]" />
          <span>Local & Private</span>
        </div>
        <p className="text-xs text-[#52656D] max-w-md mx-auto">
          Your trading logs and discipline stats are stored locally on your device.
        </p>
      </div>

    </main>
  );
}
