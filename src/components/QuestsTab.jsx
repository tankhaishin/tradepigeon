import React, { useState, useEffect } from 'react';
import { DuoChestIcon, DuoLightningIcon, DuoIceIcon, DuoShieldIcon } from './DuoIcons';
import EducationalQuizNode from './EducationalQuizNode';
import { CheckCircle2, Lock, Sparkles, Award } from 'lucide-react';
import { loadStoredData, saveStoredData, subscribeToStorageUpdate, STORAGE_KEYS, DEFAULT_USER_STATS, getAllStoredTrades, addDisciplinePoints } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';

const DAILY_QUEST_IDS = [103, 104];

const getInitialClaimedQuests = () => {
  const todayIso = new Date().toISOString().slice(0, 10);
  const lastClaimDate = loadStoredData('tradepigeon_claimed_quests_date', '');
  const claimed = loadStoredData('tradepigeon_claimed_quests', []);
  const claimedList = Array.isArray(claimed) ? claimed : [];

  if (lastClaimDate && lastClaimDate !== todayIso) {
    // Rollover: clear daily quests (103, 104) while preserving milestone quests (101, 102)
    const filtered = claimedList.filter(id => !DAILY_QUEST_IDS.includes(id));
    saveStoredData('tradepigeon_claimed_quests', filtered);
    saveStoredData('tradepigeon_claimed_quests_date', todayIso);
    return filtered;
  }
  if (!lastClaimDate) {
    saveStoredData('tradepigeon_claimed_quests_date', todayIso);
  }
  return claimedList;
};

export default function QuestsTab() {
  const [claimedQuestIds, setClaimedQuestIds] = useState(getInitialClaimedQuests);
  const [completedSteps, setCompletedSteps] = useState(() => loadStoredData('tradepigeon_completed_steps', []));
  const [debriefHistory, setDebriefHistory] = useState(() => loadStoredData('tradepigeon_debrief_history', []));
  const [tradingStatus, setTradingStatus] = useState(() => loadStoredData('tradepigeon_trading_status', 'TRADING'));
  const [completedDays, setCompletedDays] = useState(() => loadStoredData('tradepigeon_completed_days', []));
  const [userDp, setUserDp] = useState(() => loadStoredData('tradepigeon_user_dp', 0));
  const [userStats, setUserStats] = useState(() => loadStoredData('tradepigeon_user_stats', DEFAULT_USER_STATS));

  useEffect(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const lastClaimDate = loadStoredData('tradepigeon_claimed_quests_date', '');
    if (lastClaimDate && lastClaimDate !== todayIso) {
      setClaimedQuestIds(prev => {
        const filtered = prev.filter(id => !DAILY_QUEST_IDS.includes(id));
        saveStoredData('tradepigeon_claimed_quests', filtered);
        saveStoredData('tradepigeon_claimed_quests_date', todayIso);
        return filtered;
      });
    }

    const unsubscribe = subscribeToStorageUpdate(({ key, value }) => {
      if (key === 'tradepigeon_claimed_quests') setClaimedQuestIds(value || []);
      if (key === 'tradepigeon_completed_steps') setCompletedSteps(value || []);
      if (key === 'tradepigeon_debrief_history') setDebriefHistory(value || []);
      if (key === 'tradepigeon_trading_status') setTradingStatus(value || 'TRADING');
      if (key === 'tradepigeon_completed_days') setCompletedDays(value || []);
      if (key === 'tradepigeon_user_dp') setUserDp(Number(value) || 0);
      if (key === 'tradepigeon_user_stats') setUserStats(value || DEFAULT_USER_STATS);
      if (
        key === 'tradepigeon_tradelogs' ||
        key === 'goodtrader_tradelogs' ||
        key === 'trades_cleared' ||
        (key && (key.startsWith('tradepigeon_session_trades') || key.startsWith('goodtrader_session_trades') || key.startsWith('day_')))
      ) {
        setUserStats(loadStoredData('tradepigeon_user_stats', DEFAULT_USER_STATS));
      }
    });
    return unsubscribe;
  }, []);

  // Compute active weekly quest focus (1-52 weeks rotation)
  const currentWeekNumber = Math.ceil((new Date().getDate() + new Date().getDay()) / 7);
  const seasonalThemes = [
    { title: 'WEEKLY FOCUS: RISK DISCIPLINE', badge: 'WEEKLY ROTATION', desc: 'Focus on 100% stop-loss discipline and drawdown preservation' },
    { title: 'WEEKLY FOCUS: PLAYBOOK CHECKLISTS', badge: 'WEEKLY ROTATION', desc: 'Focus on binary entry checklist compliance before every execution' },
    { title: 'WEEKLY FOCUS: EMOTIONAL COOL-DOWN', badge: 'WEEKLY ROTATION', desc: 'Focus on mandatory cool-downs after losses to prevent tilt and revenge trading' }
  ];
  const activeSeason = seasonalThemes[currentWeekNumber % seasonalThemes.length];

  const streakDays = userStats.streakDays || 0;
  const storedTrades = getAllStoredTrades();
  const tradesLogged = Math.max(
    userStats.tradesLogged || 0,
    storedTrades.filter(t => t.followedRules !== false).length
  );

  // Resilient quest completion checks that persist across step resets
  const hasCompletedAudit = completedSteps.includes(4) || 
    (Array.isArray(debriefHistory) && debriefHistory.length > 0) || 
    tradingStatus === 'DONE' || 
    (Array.isArray(completedDays) && completedDays.length > 0);

  const hasCompletedMindset = completedSteps.includes(1) || 
    hasCompletedAudit || 
    tradingStatus === 'DONE' || 
    (Array.isArray(completedDays) && completedDays.length > 0) ||
    completedSteps.length > 0;

  const quests = [
    {
      id: 101,
      title: 'Maintain 7-Day Discipline Streak',
      reward: '+500 XP',
      rewardVal: 500,
      current: Math.min(7, streakDays),
      target: 7,
      completed: streakDays >= 7,
      icon: <DuoChestIcon className="w-8 h-8" />
    },
    {
      id: 102,
      title: 'Execute 5 Disciplined Fills',
      reward: '+250 XP',
      rewardVal: 250,
      current: Math.min(5, tradesLogged),
      target: 5,
      completed: tradesLogged >= 5,
      icon: <DuoIceIcon className="w-8 h-8" />
    },
    {
      id: 103,
      title: 'Complete Post-Session Audit',
      reward: '+200 XP',
      rewardVal: 200,
      current: hasCompletedAudit ? 1 : 0,
      target: 1,
      completed: hasCompletedAudit,
      icon: <DuoShieldIcon className="w-8 h-8" />
    },
    {
      id: 104,
      title: 'Complete Pre-Market Mindset Check',
      reward: '+150 XP',
      rewardVal: 150,
      current: hasCompletedMindset ? 1 : 0,
      target: 1,
      completed: hasCompletedMindset,
      icon: <DuoLightningIcon className="w-8 h-8" />
    },
  ];

  const handleClaimReward = (quest) => {
    if (!claimedQuestIds.includes(quest.id)) {
      soundFx.playLevelUp();
      const todayIso = new Date().toISOString().slice(0, 10);
      const updatedClaimed = [...claimedQuestIds, quest.id];
      setClaimedQuestIds(updatedClaimed);
      saveStoredData('tradepigeon_claimed_quests', updatedClaimed);
      saveStoredData('tradepigeon_claimed_quests_date', todayIso);

      const newDp = addDisciplinePoints(quest.rewardVal);
      setUserDp(newDp);
      setUserStats(prev => ({
        ...prev,
        disciplinePoints: newDp
      }));

      window.dispatchEvent(new CustomEvent('tradepigeon_claim_reward', { detail: { questId: quest.id, rewardVal: quest.rewardVal } }));
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
          const currentDp = typeof currentStats.disciplinePoints === 'number'
            ? currentStats.disciplinePoints
            : (loadStoredData('tradepigeon_user_dp', 0));
          const newDp = currentDp + 50;
          const updatedStats = {
            ...currentStats,
            disciplinePoints: newDp
          };
          saveStoredData(STORAGE_KEYS.USER_STATS, updatedStats);
          saveStoredData('tradepigeon_user_dp', newDp);
          setUserDp(newDp);
        }} 
      />

    </main>
  );
}
