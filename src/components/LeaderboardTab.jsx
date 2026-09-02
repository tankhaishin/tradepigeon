import React from 'react';
import { Trophy, Crown, Flame, Gem, ShieldCheck } from 'lucide-react';
import { DuoShieldIcon, DuoTrophyIcon } from './DuoIcons';
import InteractiveParrotMascot from './InteractiveParrotMascot';

export default function LeaderboardTab() {
  const leaderboardUsers = [
    { rank: 1, name: 'Alex_ICT', xp: '4,250 DP', streak: '28d', badge: 'Diamond League', avatarBg: 'bg-amber-500/20 text-amber-400' },
    { rank: 2, name: 'Trader (YOU)', xp: '3,420 DP', streak: '14d', badge: 'Diamond League', avatarBg: 'bg-[#FF6B00] text-white' },
    { rank: 3, name: 'PropWizard', xp: '2,980 DP', streak: '19d', badge: 'Ruby League', avatarBg: 'bg-rose-500/20 text-rose-400' },
    { rank: 4, name: 'OrderFlowPro', xp: '2,410 DP', streak: '11d', badge: 'Ruby League', avatarBg: 'bg-sky-500/20 text-sky-400' },
    { rank: 5, name: 'ZenTrader', xp: '1,890 DP', streak: '8d', badge: 'Sapphire League', avatarBg: 'bg-purple-500/20 text-purple-400' },
  ];

  return (
    <main className="flex-1 min-h-screen lg:pl-28 xl:pl-80 xl:pr-[416px] bg-[#070C1E] p-4 sm:p-6 lg:p-10 text-white space-y-8 pb-24 lg:pb-10 max-w-full">
      {/* 1. HERO LEADERBOARD EMBLEM & CENTERED HEADER (MATCHING DUOLINGO LEADERBOARD DNA) */}
      <div className="flex flex-col items-center justify-center text-center space-y-3 py-2">
        {/* 3D League Emblem Cluster */}
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-[#FFB800] border-4 border-[#D99B00] border-b-6 border-b-[#B38000] text-slate-950 flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
            <DuoTrophyIcon className="w-12 h-12 shrink-0 drop-shadow-md" />
          </div>
          <span className="absolute -top-2 -right-2 text-[10px] font-black uppercase bg-[#FF6B00] text-white px-2.5 py-0.5 rounded-lg border border-[#C2410C] shadow-md animate-bounce">
            SEASON 12
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Diamond League Leaderboard</h1>
          <p className="text-xs font-bold text-[#94A3B8]">Community Discipline Division &bull; Ranked by DP Telemetry</p>
        </div>
      </div>

      {/* Ranks Table Card (HIGH-CRAFT DUOLINGO SPEC) */}
      <div className="duo-card p-5 sm:p-6 space-y-4">
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
