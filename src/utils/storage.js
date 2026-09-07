// TradePigeon LocalStorage Persistence Manager

const STORAGE_KEYS = {
  USER_STATS: 'goodtrader_user_stats',
  CALENDAR_DATA: 'goodtrader_calendar_data',
  SETUPS: 'goodtrader_setups',
  QUESTS: 'goodtrader_quests',
  SHOP_ITEMS: 'goodtrader_shop_items',
  ONBOARDING_COMPLETED: 'goodtrader_onboarding_completed',
  ONBOARDING_STEP: 'goodtrader_onboarding_step',
  ONBOARDING_DRAFT: 'goodtrader_onboarding_draft'
};

// Initial Clean Production Default State
export const DEFAULT_USER_STATS = {
  streakDays: 0,
  disciplinePoints: 0,
  hearts: 5,
  maxHearts: 5,
  level: 1,
  levelTitle: 'Rookie Trader',
  username: 'Disciplined_Trader',
  joinedDate: 'Sep 2026',
  tradesLogged: 0,
  overallWinRate: '0%',
  totalProfit: '$0.00'
};

export const loadStoredData = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    if (parsed === null || parsed === undefined) return fallback;

    // Automatically merge object fallbacks so new schema properties are never undefined
    if (typeof fallback === 'object' && !Array.isArray(fallback) && fallback !== null) {
      return { ...fallback, ...parsed };
    }
    return parsed;
  } catch (err) {
    console.warn(`[TradePigeon Storage] Failed to load ${key}:`, err);
    return fallback;
  }
};

export const saveStoredData = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('goodtrader-storage-update', { detail: { key, value } }));
    }
  } catch (err) {
    console.warn(`[TradePigeon Storage] Failed to save ${key}:`, err);
  }
};

export const subscribeToStorageUpdate = (callback) => {
  const handler = (event) => {
    if (callback) callback(event.detail);
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('goodtrader-storage-update', handler);
  }
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('goodtrader-storage-update', handler);
    }
  };
};

export const sanitizeAccountBasketData = (baskets = []) => {
  if (!Array.isArray(baskets)) return [];
  return baskets.map((b) => ({
    id: b.id || 'default_basket',
    name: b.name || 'Primary Risk Basket',
    accountCount: b.accountCount || 1,
    maxDrawdown: b.maxDrawdown || 500,
    currentLoss: b.currentLoss || 0,
    status: b.status || 'ACTIVE'
  }));
};

export const buildDefaultPlaybooks = (tradingStyle = 'BLANK', strategyName = '') => {
  const cleanName = strategyName.trim();
  const primaryName = cleanName || (
    tradingStyle === 'SMC' ? 'Smart Money Concepts (SMC)' :
    tradingStyle === 'ORDERFLOW' ? 'Order Flow Imbalance' :
    tradingStyle === 'PRICE_ACTION' ? 'Breakout & Retest (Key S/R Level)' : 'Custom Strategy 1'
  );

  const getChecklistForStyle = (style) => {
    switch (style) {
      case 'SMC':
        return [
          'HTF Liquidity Sweep (Asia / Prev Day High/Low)',
          'Change of Character (CHOCH) / Market Structure Shift',
          'Fair Value Gap (FVG) or Order Block Entry Zone',
          'Minimum 2.5 R:R Target Defined'
        ];
      case 'ORDERFLOW':
        return [
          'Cumulative Volume Delta (CVD) Divergence at Key Level',
          'Stacked Buying / Selling Imbalance on Footprint',
          'POC (Point of Control) Support/Resistance Bounce',
          'Aggressive Volume Absorption Confirmation'
        ];
      case 'PRICE_ACTION':
        return [
          'Higher timeframe key level break',
          'Volume surge on breakout candle',
          '1-min / 5-min retest into former resistance',
          'Bullish engulfing confirmation candle'
        ];
      default:
        return [
          'Setup Rule 1: Key Level / Zone Identified',
          'Setup Rule 2: Entry Signal Confirmation',
          'Setup Rule 3: Stop Loss & Target R:R Defined',
          'Setup Rule 4: Risk Parameters Verified'
        ];
    }
  };

  return [
    {
      id: 1,
      name: primaryName,
      winRate: '0%',
      winRateVal: 0,
      avgRr: '0.0 R',
      count: 0,
      netProfit: '$0.00',
      tier: 'PRIMARY SETUP',
      color: 'border-[#58CC02]',
      tagBg: 'bg-[#58CC02]/15 text-[#58CC02]',
      bestTime: 'New York Session',
      sparkline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tradeMetrics: {
        avgHoldTime: '-',
        sharpeRatio: '-',
        profitFactor: '-',
        maxDrawdownR: '0.0 R',
        execPrecision: '100% Plan Adherence'
      },
      checklist: getChecklistForStyle(tradingStyle),
      psychologyMistake: tradingStyle === 'SMC' 
        ? 'Chasing entry before displacement candle closes.'
        : tradingStyle === 'ORDERFLOW'
        ? 'Failing to wait for delta absorption confirmation.'
        : 'Chasing the initial breakout before waiting for the retest loses discipline.'
    },
    {
      id: 2,
      name: tradingStyle === 'SMC' ? 'Order Block Retest' : tradingStyle === 'ORDERFLOW' ? 'Volume Profile Value Area Pullback' : 'Trend Continuation Pullback',
      winRate: '0%',
      winRateVal: 0,
      avgRr: '0.0 R',
      count: 0,
      netProfit: '$0.00',
      tier: 'SECONDARY SETUP',
      color: 'border-[#1CB0F6]',
      tagBg: 'bg-[#1CB0F6]/15 text-[#1CB0F6]',
      bestTime: 'New York Session',
      sparkline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tradeMetrics: {
        avgHoldTime: '-',
        sharpeRatio: '-',
        profitFactor: '-',
        maxDrawdownR: '0.0 R',
        execPrecision: '100% Plan Adherence'
      },
      checklist: [
        'Clear higher-high & higher-low structure',
        'Pullback into VWAP / Moving Average / OB',
        'Stop-Loss placed below structure pivot'
      ],
      psychologyMistake: 'Entering mid-move without waiting for pullback structure.'
    },
    {
      id: 3,
      name: tradingStyle === 'SMC' ? 'Judas Swing Liquidity Raid' : tradingStyle === 'ORDERFLOW' ? 'Delta Exhaustion & Reversal' : 'Key Support / Resistance Sweep',
      winRate: '0%',
      winRateVal: 0,
      avgRr: '0.0 R',
      count: 0,
      netProfit: '$0.00',
      tier: 'REVERSAL EDGE',
      color: 'border-[#FF6B00]',
      tagBg: 'bg-[#FF6B00]/15 text-[#FF6B00]',
      bestTime: 'New York Session',
      sparkline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tradeMetrics: {
        avgHoldTime: '-',
        sharpeRatio: '-',
        profitFactor: '-',
        maxDrawdownR: '0.0 R',
        execPrecision: '100% Plan Adherence'
      },
      checklist: [
        'Clean equal highs/lows targeted',
        'Aggressive wick sweep past key level',
        'Quick displacement close back inside range'
      ],
      psychologyMistake: 'Failing to place stop-loss above the sweep wick.'
    },
    {
      id: 4,
      name: tradingStyle === 'SMC' ? 'Premium / Discount Zone Reversion' : tradingStyle === 'ORDERFLOW' ? 'VWAP Band Mean Reversion' : 'VWAP Mean Reversion',
      winRate: '0%',
      winRateVal: 0,
      avgRr: '0.0 R',
      count: 0,
      netProfit: '$0.00',
      tier: 'MEAN REVERSION',
      color: 'border-[#A560FF]',
      tagBg: 'bg-[#A560FF]/15 text-[#A560FF]',
      bestTime: 'New York Session',
      sparkline: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tradeMetrics: {
        avgHoldTime: '-',
        sharpeRatio: '-',
        profitFactor: '-',
        maxDrawdownR: '0.0 R',
        execPrecision: '100% Plan Adherence'
      },
      checklist: [
        '2+ Standard Deviations away from VWAP',
        'Divergence on momentum indicator',
        'Reversion candle back toward mean'
      ],
      psychologyMistake: 'Trading reversion during high-impact news events.'
    }
  ];
};

export { STORAGE_KEYS };
