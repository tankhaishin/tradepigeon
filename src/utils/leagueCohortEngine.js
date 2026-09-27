// TradePigeon Weekly League Cohort Engine
// Simulates realistic 30-trader weekly competitive division cohorts (Duolingo style)
// Deterministically seeded per calendar week and division tier

const TRADER_POOLS = [
  { name: 'ApexSurvivor', title: 'Topstep 150k Funded', streak: 14 },
  { name: 'DeltaScalper_99', title: 'NQ Momentum Trader', streak: 8 },
  { name: 'ZenTrader_Sam', title: 'Process First', streak: 21 },
  { name: 'LiquidityHunter', title: 'ES Volume Profile', streak: 5 },
  { name: 'RiskFirst_Elena', title: 'Micro Scalper', streak: 19 },
  { name: 'ICT_SilverBullet', title: 'London Killzone Specialist', streak: 11 },
  { name: 'OrderFlow_Marcus', title: 'Footprint Trader', streak: 6 },
  { name: 'PatiencePays', title: 'Trend Continuation', streak: 12 },
  { name: 'VWAP_Seeker', title: 'Mean Reversion Edge', streak: 3 },
  { name: 'FundedTitan_Alex', title: 'Apex 300k Elite', streak: 17 },
  { name: 'CandleWhisperer', title: 'Price Action Purist', streak: 9 },
  { name: 'GammaRider_Mia', title: '0DTE Spreads', streak: 4 },
  { name: 'DisciplinedHawk', title: 'A+ Setup Sniper', streak: 16 },
  { name: 'BreakoutGuard', title: 'Opening Bell Trader', streak: 7 },
  { name: 'ChartAlchemist', title: 'Structure & Liquidity', streak: 13 },
  { name: 'MacroWave_David', title: 'Treasury & Index Flow', streak: 10 },
  { name: 'StrikeZone_Dan', title: 'Pullback Scalper', streak: 2 },
  { name: 'LevelToLevel', title: 'Key S/R Respect', streak: 15 },
  { name: 'CleanExecution', title: '1-Trade-Per-Day', streak: 22 },
  { name: 'StopLossDefender', title: 'Zero Averaging Down', streak: 18 },
  { name: 'AlgoTracker_Ken', title: 'Fair Value Gap Edge', streak: 5 },
  { name: 'RevengeFree_Joe', title: 'Rebuilt Discipline', streak: 9 },
  { name: 'PureMath_Leo', title: 'Expectancy Mindset', streak: 14 },
  { name: 'StealthScalp', title: '1-Min Momentum', streak: 7 },
  { name: 'FocusFlow_Nora', title: 'Morning Killzone', streak: 20 },
  { name: 'SessionSniper', title: 'NY AM Runner', streak: 11 },
  { name: 'CapitalShield', title: 'Preservation First', streak: 25 },
  { name: 'BufferBoss', title: 'Apex Trailing Edge', streak: 8 },
  { name: 'PigeonPro_Kai', title: 'Duolingo Trader', streak: 15 }
];

/**
 * Returns current ISO week identifier (e.g., '2026-W39')
 */
export function getCurrentWeekId() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo < 10 ? '0' : ''}${weekNo}`;
}

/**
 * Computes time remaining until weekly league end (Sunday 23:59:59 EST)
 */
export function getLeagueTimeRemaining() {
  const now = new Date();
  // Target: Next Sunday 23:59:59
  const dayOfWeek = now.getDay(); // 0 is Sunday
  const daysUntilSunday = (7 - dayOfWeek) % 7;
  const target = new Date(now);
  target.setDate(now.getDate() + daysUntilSunday);
  target.setHours(23, 59, 59, 999);

  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, formatted: `${days}d ${hours}h ${minutes}m` };
}

/**
 * Deterministic pseudo-random number generator seeded by string
 */
function pseudoRandom(seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates an active 30-trader cohort for the user's division tier
 * 
 * @param {object} params
 * @param {string} params.tierId - 'bronze' | 'silver' | 'gold' | 'sapphire' | 'ruby' | 'diamond'
 * @param {number} params.minDp - Division minimum DP
 * @param {number} params.maxDp - Division maximum DP
 * @param {number} params.userDp - User's current Discipline Points
 * @param {string} params.userName - User's display name
 * @param {number} params.userStreak - User's active streak days
 * @returns {object} { competitors: Array, userRank: number, isPromotion: boolean, isRelegation: boolean }
 */
export function buildWeeklyLeagueCohort({
  tierId = 'bronze',
  minDp = 0,
  maxDp = 499,
  userDp = 0,
  userName = 'You',
  userStreak = 0
}) {
  const weekId = getCurrentWeekId();
  const effectiveMaxDp = maxDp === Infinity ? (minDp + 2500) : maxDp;
  const span = Math.max(200, effectiveMaxDp - minDp);

  // Generate 29 competitor bots deterministically for this week and tier
  const cohort = TRADER_POOLS.slice(0, 29).map((trader, idx) => {
    const seed = `${weekId}-${tierId}-${trader.name}-${idx}`;
    const randFraction = pseudoRandom(seed);
    
    // Spread scores across the tier range with dynamic clustering
    const basePoints = Math.round(minDp + (span * (0.05 + randFraction * 0.90)));
    const jitter = Math.floor(pseudoRandom(`${seed}-jitter`) * 40) - 20;
    const finalDp = Math.max(minDp, basePoints + jitter);

    return {
      id: `bot_${tierId}_${idx}`,
      isUser: false,
      name: trader.name,
      title: trader.title,
      dp: finalDp,
      streak: trader.streak,
      initial: trader.name.charAt(0).toUpperCase()
    };
  });

  // Inject current user
  const userEntry = {
    id: 'active_user',
    isUser: true,
    name: userName || 'You',
    title: 'You (Active Trader)',
    dp: userDp || 0,
    streak: userStreak || 0,
    initial: (userName || 'Y').charAt(0).toUpperCase()
  };

  cohort.push(userEntry);

  // Sort descending by Discipline Points
  cohort.sort((a, b) => b.dp - a.dp);

  // Assign rankings & zone classifications
  let userRank = 1;
  const rankedCompetitors = cohort.map((trader, index) => {
    const rank = index + 1;
    if (trader.isUser) userRank = rank;

    let zone = 'safe'; // Ranks 6 to 25
    if (rank <= 5) zone = 'promotion'; // Top 5
    else if (rank >= 26) zone = 'relegation'; // Bottom 5

    return {
      ...trader,
      rank,
      zone
    };
  });

  return {
    weekId,
    competitors: rankedCompetitors,
    userRank,
    isPromotion: userRank <= 5,
    isRelegation: userRank >= 26,
    timeRemaining: getLeagueTimeRemaining()
  };
}
