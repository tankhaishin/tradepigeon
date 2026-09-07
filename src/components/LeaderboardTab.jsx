import React from 'react';
import { Trophy, Crown, Flame, Gem, ShieldCheck, Lock, Users } from 'lucide-react';
import { DuoShieldIcon, DuoTrophyIcon } from './DuoIcons';
import InteractiveParrotMascot from './InteractiveParrotMascot';
import { loadStoredData, DEFAULT_USER_STATS } from '../utils/storage';

export default function LeaderboardTab() {
  const userDp = loadStoredData('goodtrader_user_dp', 0);
  const userStats = loadStoredData('goodtrader_user_stats', DEFAULT_USER_STATS);

  // Total registered traders telemetry threshold (Locks until 50 users)
  const totalUserCount = loadStoredData('goodtrader_total_user_count', 7);
  const REQUIRED_USERS = 50;
  const isLocked = totalUserCount < REQUIRED_USERS;
  const progressPercent = Math.min(100, Math.round((totalUserCount / REQUIRED_USERS) * 100));

  const leaderboardUsers = [
    { rank: 1, name: 'Alex_ICT', xp: '4,250 DP', streak: '28d', badge: 'Diamond League', avatarBg: 'bg-amber-500/20 text-amber-400' },
    { rank: 2, name: 'Trader (YOU)', xp: `${userDp || 0} DP`, streak: `${userStats.streakDays || 0}d`, badge: 'Diamond League', avatarBg: 'bg-[#FF6B00] text-white' },
    { rank: 3, name: 'PropWizard', xp: '2,980 DP', streak: '19d', badge: 'Ruby League', avatarBg: 'bg-rose-500/20 text-rose-400' },
    { rank: 4, name: 'OrderFlowPro', xp: '2,410 DP', streak: '11d', badge: 'Ruby League', avatarBg: 'bg-sky-500/20 text-sky-400' },
    { rank: 5, name: 'ZenTrader', xp: '1,890 DP', streak: '8d', badge: 'Sapphire League', avatarBg: 'bg-purple-500/20 text-purple-400' },
  ];

  return (
    <main className="flex-1 min-h-screen lg:pl-28 xl:pl-80 xl:pr-[416px] bg-[#070C1E] p-4 sm:p-6 lg:p-10 text-white space-y-8 pb-24 lg:pb-10 max-w-full relative">
      
      {/* 1. HERO LEADERBOARD EMBLEM & CENTERED HEADER */}
      <div className="flex flex-col items-center justify-center text-center space-y-3 py-2">
        {/* 3D League Emblem Cluster */}
        <div className="relative flex items-center justify-center">
          <div className={`w-20 h-20 rounded-3xl border-4 flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform ${
            isLocked 
              ? 'bg-[#182830] border-[#20323D] text-slate-500' 
              : 'bg-[#FFB800] border-[#D99B00] border-b-6 border-b-[#B38000] text-slate-950'
          }`}>
            {isLocked ? (
              <Lock className="w-10 h-10 shrink-0 text-amber-400" />
            ) : (
              <DuoTrophyIcon className="w-12 h-12 shrink-0 drop-shadow-md" />
            )}
          </div>
          <span className={`absolute -top-2 -right-2 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg border shadow-md ${
            isLocked
              ? 'bg-amber-500 text-slate-950 border-amber-600'
              : 'bg-[#FF6B00] text-white border-[#C2410C] animate-bounce'
          }`}>
            {isLocked ? 'LOCKED' : 'SEASON 12'}
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Diamond League Leaderboard</h1>
          <p className="text-xs font-bold text-[#94A3B8]">Community Discipline Division &bull; Ranked by DP Telemetry</p>
        </div>
      </div>

      {/* 2. LOCKED LEADERBOARD OVERLAY & UNLOCK PROGRESS CARD */}
      {isLocked && (
        <div className="duo-card p-6 sm:p-8 space-y-6 border-2 border-amber-500/40 bg-[#182830]/90 backdrop-blur-md relative z-10 text-center max-w-xl mx-auto shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-amber-400 shadow-inner">
            <Lock size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">Leaderboard Unlocks at 50 Traders</h2>
            <p className="text-xs sm:text-sm font-bold text-[#77909D] leading-relaxed max-w-md mx-auto">
              Global discipline rankings and league competition activate as soon as 50 total traders register on the platform.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 max-w-md mx-auto">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Users size={14} className="text-[#1CB0F6]" />
                <span>Traders Registered</span>
              </span>
              <span className="text-[#58CC02]">{totalUserCount} / {REQUIRED_USERS} ({progressPercent}%)</span>
            </div>
            
            <div className="w-full h-4 bg-[#142127] rounded-full border border-[#20323D] overflow-hidden p-0.5 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-[#1CB0F6] to-[#58CC02] rounded-full transition-all duration-700 shadow-md"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. RANKS TABLE CARD (BLURRED / PREVIEW MODE WHEN LOCKED) */}
      <div className={`duo-card p-5 sm:p-6 space-y-4 transition-all ${
        isLocked ? 'opacity-40 blur-[2px] pointer-events-none select-none' : ''
      }`}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-white">Diamond League Rankings</h2>
          <span className="text-xs font-black text-[#1CB0F6] uppercase">Top 5 Active</span>
        </div>

        <div className="space-y-1">
          {leaderboardUsers.map((user) => (
            <div
              key={user.rank}
              className={`p-3.5 rounded-2xl flex items-center justify-between transition-all ${
                user.rank === 2
                  ? 'bg-[#1CB0F6]/10 border-2 border-[#1CB0F6]'
                  : 'hover:bg-[#182830]'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className={`font-black text-sm w-6 text-center ${user.rank === 1 ? 'text-amber-400' : 'text-[#77909D]'}`}>
                  #{user.rank}
                </span>
                <div className={`w-9 h-9 rounded-xl ${user.avatarBg} flex items-center justify-center font-black text-sm`}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-black text-white">{user.name}</div>
                  <div className="text-xs font-bold text-[#77909D] flex items-center gap-1.5 mt-0.5">
                    <span>{user.badge}</span>
                    <span>&bull;</span>
                    <Flame size={12} className="text-[#FF6B00] fill-[#FF6B00]" />
                    <span>{user.streak}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-black text-[#58CC02]">{user.xp}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
