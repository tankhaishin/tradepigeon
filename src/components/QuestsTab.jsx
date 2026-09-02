import React, { useState, useEffect } from 'react';
import { DuoChestIcon, DuoLightningIcon, DuoIceIcon, DuoLockIcon, DuoShieldIcon } from './DuoIcons';
import EducationalQuizNode from './EducationalQuizNode';
import { CheckCircle2, Lock, Sparkles, Award } from 'lucide-react';
import InteractiveParrotMascot from './InteractiveParrotMascot';
import { loadStoredData, saveStoredData, STORAGE_KEYS } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';

export default function QuestsTab() {
  const [claimedQuestIds, setClaimedQuestIds] = useState(() => loadStoredData('goodtrader_claimed_quests', []));
  const [completedSteps, setCompletedSteps] = useState(() => loadStoredData('goodtrader_completed_steps', [1]));
  const [userDp, setUserDp] = useState(() => loadStoredData('goodtrader_user_dp', 450));

  useEffect(() => {
    saveStoredData('goodtrader_claimed_quests', claimedQuestIds);
  }, [claimedQuestIds]);

  useEffect(() => {
    const handleStepSync = () => {
      setCompletedSteps(loadStoredData('goodtrader_completed_steps', [1]));
      setUserDp(loadStoredData('goodtrader_user_dp', 450));
    };
    window.addEventListener('storage', handleStepSync);
    return () => window.removeEventListener('storage', handleStepSync);
  }, []);

  // Compute active weekly quest season (1-52 weeks rotation)
  const currentWeekNumber = Math.ceil((new Date().getDate() + new Date().getDay()) / 7);
  const seasonalThemes = [
    { title: 'SEASON 12: RISK FORTRESS DRILLS', badge: 'WEEKLY SEASONAL ROTATION', desc: 'Focus on 100% stop-loss discipline and drawdown preservation' },
    { title: 'SEASON 13: PLAYBOOK PRECISION WEEK', badge: 'WEEKLY SEASONAL ROTATION', desc: 'Focus on binary entry checklist compliance' },
    { title: 'SEASON 14: NEUROSCIENCE & TILT MASTERY', badge: 'WEEKLY SEASONAL ROTATION', desc: 'Focus on 30-minute post-loss prefrontal cortex resets' }
  ];
  const activeSeason = seasonalThemes[currentWeekNumber % seasonalThemes.length];

  const quests = [
    {
      id: 101,
      title: 'Maintain 14-Day Streak',
      reward: '+500 DP',
      rewardVal: 500,
      current: 14,
      target: 14,
      completed: true,
      icon: <DuoChestIcon className="w-8 h-8" />
    },
    {
      id: 102,
      title: 'Execute 5 A+ Setup Fills',
      reward: '+250 DP',
      rewardVal: 250,
      current: 3,
      target: 5,
      completed: false,
      icon: <DuoIceIcon className="w-8 h-8" />
    },
    {
      id: 103,
      title: 'Complete 5 Risk Lock Checks',
      reward: '+200 DP',
      rewardVal: 200,
      current: 5,
      target: 5,
      completed: true,
      icon: <DuoShieldIcon className="w-8 h-8" />
    },
    {
      id: 104,
      title: 'Pass 3 Psychology Quizzes',
      reward: '+150 DP',
      rewardVal: 150,
      current: 2,
      target: 3,
      completed: false,
      icon: <DuoLightningIcon className="w-8 h-8" />
    },
  ];

  const handleClaimReward = (quest) => {
    if (!claimedQuestIds.includes(quest.id)) {
      soundFx.playLevelUp();
      const updatedClaimed = [...claimedQuestIds, quest.id];
      setClaimedQuestIds(updatedClaimed);
      saveStoredData('goodtrader_claimed_quests', updatedClaimed);

      const newDp = userDp + quest.rewardVal;
      setUserDp(newDp);
      saveStoredData('goodtrader_user_dp', newDp);

      window.dispatchEvent(new CustomEvent('goodtrader_claim_reward', { detail: { questId: quest.id, rewardVal: quest.rewardVal } }));
    }
  };

  return (
    <main className="flex-1 min-h-screen lg:pl-28 xl:pl-80 xl:pr-[416px] bg-[#070C1E] p-4 sm:p-6 lg:p-8 text-white space-y-6 pb-24 lg:pb-10 max-w-full overflow-hidden">
      
      {/* 1. TOP HEADER: CLEAN FLOATING HEADER */}
      <div className="flex items-center gap-3">
        <DuoChestIcon className="w-9 h-9 shrink-0" />
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Discipline Quests</h1>
      </div>

      {/* 2. LEADERBOARD CHALLENGE UNLOCK CARD (MATCHING USER HERO CARD DNA) */}
      <div className="duo-card p-6 space-y-4">
        <h2 className="text-xl font-black text-white">Unlock Leaderboards!</h2>
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
          <div className="shrink-0">
            <DuoShieldIcon className="w-20 h-20 sm:w-24 sm:h-24 filter drop-shadow-xl" />
          </div>
          <div className="flex-1 w-full space-y-1 text-right">
            <p className="text-base font-black text-white">Complete 2 more units</p>
            <p className="text-xs font-bold text-[#77909D]">Enter the Diamond League challenge</p>
          </div>
        </div>
      </div>

      {/* 3. DAILY QUESTS CARD (MATCHING USER SCREENSHOT BOX 2) */}
      <div className="duo-card p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">Daily Quests</h2>
          <span className="text-xs font-black text-[#1CB0F6] uppercase cursor-pointer hover:underline">View All</span>
        </div>

        <div className="space-y-4">
          {quests.map((q) => {
            const percent = Math.min(100, Math.round((q.current / q.target) * 100));
            const isClaimed = claimedQuestIds.includes(q.id);
            const canClaim = q.completed && !isClaimed;

            return (
              <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#20323D] last:border-0 last:pb-0">
                <div className="flex items-center gap-4 flex-1">
                  <div className="shrink-0">{q.icon}</div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-base font-black text-white">{q.title}</h3>
                    
                    {/* Authentic Duolingo Progress Bar with End Chest */}
                    <div className="relative flex items-center gap-2 max-w-md">
                      <div className="flex-1 h-5 rounded-full bg-[#142127] border border-[#20323D] overflow-hidden relative flex items-center justify-center">
                        <div 
                          className={`absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500 ${percent === 100 ? 'bg-[#58CC02]' : 'bg-[#FFC800]'}`} 
                          style={{ width: `${percent}%` }} 
                        />
                        <span className="relative z-10 text-[10px] font-black text-white drop-shadow-sm">
                          {q.current} / {q.target}
                        </span>
                      </div>
                      <DuoChestIcon className="w-6 h-6 shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Claim Reward Button State */}
                <div className="shrink-0 sm:self-center">
                  {isClaimed ? (
                    <span className="px-3.5 py-1.5 rounded-xl bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/40 text-xs font-black flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> CLAIMED
                    </span>
                  ) : canClaim ? (
                    <button 
                      onClick={() => handleClaimReward(q)}
                      className="duo-btn-orange px-4 py-2 text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      CLAIM {q.reward}
                    </button>
                  ) : (
                    <span className="text-xs font-black text-[#FF6B00]">
                      {q.reward}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. DAILY MICRO-QUIZ CHALLENGE */}
      <EducationalQuizNode 
        onQuizComplete={() => {
          soundFx.playSuccess();
          const currentStats = loadStoredData(STORAGE_KEYS.USER_STATS, DEFAULT_USER_STATS);
          const updatedStats = {
            ...currentStats,
            disciplinePoints: (currentStats.disciplinePoints || 3400) + 50
          };
          saveStoredData(STORAGE_KEYS.USER_STATS, updatedStats);
        }} 
      />

    </main>
  );
}
