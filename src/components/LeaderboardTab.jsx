import React, { useState, useEffect } from 'react';
import { Flame, Lock, Trophy } from 'lucide-react';
import { DuoTrophyIcon } from './DuoIcons';
import { loadStoredData, subscribeToStorageUpdate, DEFAULT_USER_STATS } from '../utils/storage';

export default function LeaderboardTab() {
  const [userDp, setUserDp] = useState(() => loadStoredData('goodtrader_user_dp', 0));
  const [userStats, setUserStats] = useState(() => loadStoredData('goodtrader_user_stats', DEFAULT_USER_STATS));

  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdate(({ key, value }) => {
      if (key === 'goodtrader_user_dp') {
        setUserDp(Number(value) || 0);
      }
      if (key === 'goodtrader_user_stats') {
        setUserStats(value || DEFAULT_USER_STATS);
      }
    });
    return unsubscribe;
  }, []);

  // Total registered traders in active division cohort
  const totalUserCount = loadStoredData('goodtrader_total_user_count', 68);
  const isLocked = totalUserCount < 50;

  const peerTraders = [
    { name: 'Alex_ICT', rawDp: 4250, streak: '28d', badge: 'Diamond League', avatarBg: 'bg-amber-500/20 text-amber-400' },
    { name: 'PropWizard', rawDp: 2980, streak: '19d', badge: 'Ruby League', avatarBg: 'bg-rose-500/20 text-rose-400' },
    { name: 'OrderFlowPro', rawDp: 2410, streak: '11d', badge: 'Ruby League', avatarBg: 'bg-sky-500/20 text-sky-400' },
    { name: 'ZenTrader', rawDp: 1890, streak: '8d', badge: 'Sapphire League', avatarBg: 'bg-purple-500/20 text-purple-400' },
    { name: 'MacroAlpha', rawDp: 1120, streak: '6d', badge: 'Sapphire League', avatarBg: 'bg-teal-500/20 text-teal-400' },
  ];

  const userTrader = {
    name: 'Trader (YOU)',
    rawDp: userDp || 0,
    streak: `${userStats.streakDays || 0}d`,
    badge: userDp >= 3000 ? 'Diamond League' : userDp >= 1500 ? 'Ruby League' : 'Sapphire League',
    avatarBg: 'bg-[#FF6B00] text-white',
    isUser: true
  };

  const leaderboardUsers = [...peerTraders, userTrader]
    .sort((a, b) => b.rawDp - a.rawDp)
    .map((trader, idx) => ({
      ...trader,
      rank: idx + 1,
      xp: `${trader.rawDp.toLocaleString()} DP`
    }));

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

      {/* 2. LOCKED LEADERBOARD OVERLAY */}
      {isLocked && (
        <div className="duo-card p-6 sm:p-8 space-y-4 border-2 border-amber-500/40 bg-[#182830]/90 backdrop-blur-md relative z-10 text-center max-w-xl mx-auto shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-amber-400 shadow-inner">
            <Lock size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">Leaderboard Unlocks at 50 Traders</h2>
            <p className="text-xs sm:text-sm font-bold text-[#77909D] leading-relaxed max-w-md mx-auto">
              Global discipline rankings and league competition activate as soon as 50 total traders register on the platform.
            </p>
          </div>
        </div>
      )}

      {/* 3. RANKS TABLE CARD (BLURRED / PREVIEW MODE WHEN LOCKED) */}
      <div className={`duo-card p-5 sm:p-6 space-y-4 transition-all ${
        isLocked ? 'opacity-40 blur-[2px] pointer-events-none select-none' : ''
      }`}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-white">Diamond League Rankings</h2>
          <span className="text-xs font-black text-[#1CB0F6] uppercase">Top {leaderboardUsers.length} Active</span>
        </div>

        <div className="space-y-1">
          {leaderboardUsers.map((user) => (
            <div
              key={user.name}
              className={`p-3.5 rounded-2xl flex items-center justify-between transition-all ${
                user.isUser
                  ? 'bg-[#1CB0F6]/15 border-2 border-[#1CB0F6] border-b-4 border-b-[#147BB0] shadow-md'
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
