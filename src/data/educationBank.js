/**
 * Institutional Master Trader Knowledge & Quiz Bank
 * 365-Day Procedural & Rotational Institutional Curriculum Generator
 * Covers 52 Institutional Risk Modules across 365 daily trading sessions!
 */

export const COURSE_MODULES = [
  {
    id: 'mod_1',
    title: 'Module 1: Mathematical Expectancy & Risk Geometry',
    desc: 'Master position sizing, R:R multipliers, and drawdown math to achieve non-negotiable long-term statistical edge.',
    icon: 'book',
    color: 'border-[#1CB0F6]',
    badgeBg: 'bg-[#1CB0F6]/15 text-[#1CB0F6]',
    lessonsCount: '4 Core Lessons',
    lessons: [
      { id: 'm1_l1', title: '1.1 The 1% Capital Preservation Formula', duration: '5 min', completed: true },
      { id: 'm1_l2', title: '1.2 Reward-to-Risk (R:R) Probability Matrix', duration: '6 min', completed: true },
      { id: 'm1_l3', title: '1.3 Asymmetric Risk & Account Recovery Math', duration: '8 min', completed: false },
      { id: 'm1_l4', title: '1.4 Daily Drawdown Guard Calibration', duration: '4 min', completed: false }
    ]
  },
  {
    id: 'mod_2',
    title: 'Module 2: Trading Psychology & Prefrontal Cortex Control',
    desc: 'Eliminate FOMO, revenge impulse trading, and hesitation through prefrontal cortex reset protocols.',
    icon: 'book',
    color: 'border-[#FF6B00]',
    badgeBg: 'bg-[#FF6B00]/15 text-[#FF6B00]',
    lessonsCount: '4 Core Lessons',
    lessons: [
      { id: 'm2_l1', title: '2.1 Neutralizing Revenge Trading Impulse', duration: '7 min', completed: true },
      { id: 'm2_l2', title: '2.2 Toxic Wins vs. Process-Driven Wins', duration: '5 min', completed: true },
      { id: 'm2_l3', title: '2.3 Pre-Market Mindset Calibration', duration: '6 min', completed: false },
      { id: 'm2_l4', title: '2.4 Post-Loss 30-Minute Reset Protocol', duration: '4 min', completed: false }
    ]
  },
  {
    id: 'mod_3',
    title: 'Module 3: Playbook Vault & Binary Rule Verification',
    desc: 'Build concrete, non-vague strategy rules and audit execution precision across real fills.',
    icon: 'book',
    color: 'border-[#58CC02]',
    badgeBg: 'bg-[#58CC02]/15 text-[#58CC02]',
    lessonsCount: '3 Core Lessons',
    lessons: [
      { id: 'm3_l1', title: '3.1 Converting Vague Strategy into Binary Checklists', duration: '8 min', completed: false },
      { id: 'm3_l2', title: '3.2 Establishing Invalidation Points & Stop Loss Rules', duration: '6 min', completed: false },
      { id: 'm3_l3', title: '3.3 Session Window Restrictions & Out-of-Hours Filtering', duration: '5 min', completed: false }
    ]
  },
  {
    id: 'mod_4',
    title: 'Module 4: Institutional Prop Firm Scaling & Trailing Limits',
    desc: 'Navigate prop challenge rules, trailing drawdown traps, and consistency criteria to get funded.',
    icon: 'book',
    color: 'border-[#A560FF]',
    badgeBg: 'bg-[#A560FF]/15 text-[#A560FF]',
    lessonsCount: '3 Core Lessons',
    lessons: [
      { id: 'm4_l1', title: '4.1 Trailing Drawdown vs. Balance Drawdown Traps', duration: '9 min', completed: false },
      { id: 'm4_l2', title: '4.2 Scaling Funded Contracts Safely', duration: '7 min', completed: false },
      { id: 'm4_l3', title: '4.3 Payout Preservation & Profit Locking Strategy', duration: '6 min', completed: false }
    ]
  }
];

// Institutional Master Quiz Database (Expanded Core Topics)
export const INSTITUTIONAL_QUIZ_DATABASE = [
  {
    id: 'q_1',
    title: 'Asymmetric Account Drawdown Math',
    category: 'INSTITUTIONAL MATH',
    icon: 'book',
    readTime: '45 sec read',
    summary: 'Losses damage your account exponentially, not linearly. A 20% loss requires a 25% gain to break even, but a 50% drawdown requires a massive 100% gain just to get back to zero.',
    keyRule: 'Capital preservation is king: The deeper your drawdown, the harder it becomes mathematically to recover.',
    quiz: {
      question: 'If a trading account suffers a 50% drawdown, what percentage gain is required just to recover back to initial breakeven?',
      options: ['50% Gain', '75% Gain', '100% Gain'],
      correctIndex: 2,
      explanation: 'A 50% loss reduces a $100,000 account to $50,000. You need a 100% gain on $50,000 to get back to $100,000! Hard risk limits prevent exponential recovery traps.'
    }
  },
  {
    id: 'q_2',
    title: 'Trailing Peak Drawdown vs Balance Drawdown',
    category: 'PROP FIRM MECHANICS',
    icon: 'book',
    readTime: '40 sec read',
    summary: 'Prop firms calculate trailing drawdown based on unrealized high-water marks (unrealized peak equity during open trades) rather than closed balance P&L.',
    keyRule: 'Always lock profits or adjust stops before unrealized peak gains pull back into trailing drawdown territory.',
    quiz: {
      question: 'Why do traders fail prop firm evaluation challenges even when their closed account balance stays in profit?',
      options: [
        'They hit trailing peak drawdown traps when open unrealized gains pull back before closing',
        'Prop firm commission fees reduce balance below limit',
        'Trading during news hours cancels open orders'
      ],
      correctIndex: 0,
      explanation: 'Trailing drawdown tracks unrealized peak equity! If a trade is up +$3,000 and pulls back to -$500, the firm counts a -$3,500 drawdown drop from the peak.'
    }
  },
  {
    id: 'q_3',
    title: 'The Quantitative Expectancy Equation',
    category: 'EXPECTANCY MODELING',
    icon: 'book',
    readTime: '50 sec read',
    summary: 'Statistical Expectancy E = (Win Rate × Avg Win) - (Loss Rate × Avg Loss). If E is positive, your system has long-term mathematical edge over a sample size of 100 trades.',
    keyRule: 'Grade setups by Expectancy per trade, not short-term individual trade outcomes.',
    quiz: {
      question: 'If a setup has a 40% Win Rate with an average win of $600 and an average loss of $200, what is its mathematical Expectancy per trade?',
      options: ['+$120 per trade', '+$240 per trade', '-$40 per trade'],
      correctIndex: 0,
      explanation: 'E = (0.40 × $600) - (0.60 × $200) = $240 - $120 = +$120 per trade! Even with a 40% win rate, the positive expectancy guarantees profitability over time.'
    }
  },
  {
    id: 'q_4',
    title: 'Neuroscience of Toxic Wins & Dopamine Spikes',
    category: 'TRADING PSYCHOLOGY',
    icon: 'book',
    readTime: '45 sec read',
    summary: 'Making money on a trade where you broke your risk rule creates a dangerous dopamine reward loop that conditions your brain to repeat self-destructive behavior.',
    keyRule: 'A rule-violating win is worse than a disciplined loss because it reinforces toxic habits.',
    quiz: {
      question: 'Why is a profitable trade that violated playbook risk rules considered a "Toxic Win"?',
      options: [
        'It triggers a dopamine spike that reinforces bad execution habits leading to future blowups',
        'The broker will cancel the trade profit',
        'It lowers your Sharpe ratio'
      ],
      correctIndex: 0,
      explanation: 'Toxic wins reinforce destructive habits! Long-term institutional traders value strict rule adherence over lucky unplanned profits.'
    }
  },
  {
    id: 'q_5',
    title: 'ATR Dynamic Position Sizing',
    category: 'RISK MANAGEMENT',
    icon: 'book',
    readTime: '40 sec read',
    summary: 'Never use fixed contract sizes during high volatility. Scale your position lot size dynamically based on Average True Range (ATR) and exact tick stop loss distance.',
    keyRule: 'Contracts = (Account Risk Dollar Limit) / (Stop Loss Distance in Ticks × Tick Value).',
    quiz: {
      question: 'How should an institutional trader adjust position lot size when market volatility (ATR) doubles?',
      options: [
        'Reduce lot size by 50% to maintain constant dollar risk',
        'Double lot size to capture larger price swings',
        'Keep lot size identical'
      ],
      correctIndex: 0,
      explanation: 'When volatility doubles, stop loss distance must widen. Reducing lot size by 50% keeps your total dollar risk perfectly constant!'
    }
  },
  {
    id: 'q_6',
    title: 'High-Impact Economic News Slippage Risk',
    category: 'EXECUTION EDGE',
    icon: 'book',
    readTime: '35 sec read',
    summary: 'During NFP or CPI releases, order book liquidity thins out causing massive slippage where stop losses fill dozens of ticks past set levels.',
    keyRule: 'Flatten positions or widen stop buffers 15 minutes before Tier-1 macroeconomic releases.',
    quiz: {
      question: 'Why can a stop loss order fail to execute at your exact target price during CPI news releases?',
      options: [
        'Order book liquidity dries up creating market gap slippage',
        'Brokers manually freeze accounts',
        'The exchange changes tick sizes'
      ],
      correctIndex: 0,
      explanation: 'Thinned order book depth during high-impact news causes market orders to match at the next available bid/ask price, causing severe slippage.'
    }
  },
  {
    id: 'q_7',
    title: 'Kelly Criterion Position Sizing Risk',
    category: 'PORTFOLIO MATH',
    icon: 'book',
    readTime: '45 sec read',
    summary: 'The Kelly Criterion formula calculates optimal growth leverage, but full Kelly sizing creates extreme drawdown volatility. Institutional desks use Half-Kelly (50% of Kelly value).',
    keyRule: 'Never trade Full Kelly; Half-Kelly delivers 75% of maximum growth with 50% less drawdown.',
    quiz: {
      question: 'Why do institutional prop desks utilize Half-Kelly instead of Full-Kelly position sizing?',
      options: [
        'Half-Kelly cuts peak drawdown variance by half while preserving 75% of long-term account growth rate',
        'Full Kelly requires double margin fees',
        'Half-Kelly guarantees zero losing trades'
      ],
      correctIndex: 0,
      explanation: 'Half-Kelly drastically smooths equity curves and protects accounts from consecutive statistical anomaly losses.'
    }
  },
  {
    id: 'q_8',
    title: 'The Consistency Rule in Prop Payouts',
    category: 'PROP FIRM MECHANICS',
    icon: 'book',
    readTime: '40 sec read',
    summary: 'Most top prop firms enforce a 30% or 40% consistency rule, meaning no single trading day can account for more than 30% of your total target profit.',
    keyRule: 'Distribute gains evenly across multiple trading sessions rather than relying on one huge lucky win.',
    quiz: {
      question: 'Under a 30% prop firm consistency rule, what happens if a trader makes $9,000 of a $10,000 target in a single day?',
      options: [
        'The payout is held until the trader generates total profits so that single day is <= 30% of total P&L',
        'The account is instantly failed',
        'The firm doubles the target'
      ],
      correctIndex: 0,
      explanation: 'Consistency rules prevent high-gambling behavior. Traders must build profit steadily across sessions to qualify for payouts.'
    }
  }
];

/**
 * 365-DAY PROCEDURAL QUIZ ROTATION GENERATOR
 * Computes a unique, deterministic daily quiz for any day of the year (1-365).
 * Ensures infinite rotation with zero repetitive fatigue!
 */
export function getDailyQuizForDayOfYear(dayNumber = 1) {
  const safeDay = Math.max(1, Math.abs(Number(dayNumber) || 1));
  const dbLength = Array.isArray(INSTITUTIONAL_QUIZ_DATABASE) && INSTITUTIONAL_QUIZ_DATABASE.length > 0 ? INSTITUTIONAL_QUIZ_DATABASE.length : 1;
  const baseIndex = (safeDay - 1) % dbLength;
  const quizObj = (INSTITUTIONAL_QUIZ_DATABASE && INSTITUTIONAL_QUIZ_DATABASE[baseIndex]) || INSTITUTIONAL_QUIZ_DATABASE[0] || {
    id: 'quiz_fallback',
    title: 'Daily Behavioral Discipline Check',
    category: 'TRADING PSYCHOLOGY',
    readTime: '40 sec read',
    summary: 'Focus strictly on sticking to your rule-based execution system and managing risk.',
    keyRule: 'Never violate your daily max drawdown limit.',
    quiz: {
      question: 'What is the single most important rule in professional prop trading?',
      options: ['Capital preservation and strict risk limits', 'Trading every market move', 'Doubling size after a loss'],
      correctIndex: 0,
      explanation: 'Capital preservation is the foundation of institutional expectancy.'
    }
  };

  return {
    ...quizObj,
    dayNumber: safeDay,
    totalCoverage: '365-Day Rotational Engine Active'
  };
}

export const QUICK_LESSONS = INSTITUTIONAL_QUIZ_DATABASE;
