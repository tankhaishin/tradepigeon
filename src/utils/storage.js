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

export const sanitizeAccountsList = (accounts = []) => {
  if (!Array.isArray(accounts)) return [];
  const dummyKeywords = ['ninjatrader live account', 'tradovate live account', 'dummy account', 'placeholder account'];
  return accounts.filter((acc) => {
    if (!acc || typeof acc !== 'object') return false;
    const nameLower = String(acc.name || '').toLowerCase();
    const brokerLower = String(acc.broker || '').toLowerCase();
    const accNumLower = String(acc.accountNumber || '').toLowerCase();
    
    // Explicitly purge unauthenticated placeholder dummy strings
    if (dummyKeywords.some(kw => nameLower.includes(kw) || brokerLower.includes(kw) || accNumLower.includes(kw))) {
      return false;
    }
    
    // Retain valid accounts with proper account numbers
    if (acc.accountNumber && String(acc.accountNumber).trim() !== '' && !dummyKeywords.some(kw => accNumLower.includes(kw))) return true;
    if (acc.id && (String(acc.id).startsWith('BROKER-') || String(acc.id).startsWith('ACC-') || String(acc.id).startsWith('TRADOVATE-'))) return true;
    return false;
  });
};

export const loadStoredData = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    if (parsed === null || parsed === undefined) return fallback;

    if (key === 'goodtrader_accounts_data' && Array.isArray(parsed)) {
      return sanitizeAccountsList(parsed);
    }

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

export const resetTodaySession = (activeDay) => {
  if (typeof window === 'undefined') return;
  const dayKey = `goodtrader_session_trades_day_${activeDay}`;
  localStorage.removeItem(dayKey);
  window.dispatchEvent(new CustomEvent('goodtrader-storage-update', { detail: { key: dayKey, value: [] } }));
};

export const factoryResetCleanSlate = ({ keepBrokerAccounts = true } = {}) => {
  if (typeof window === 'undefined') return;
  
  const savedAccounts = keepBrokerAccounts ? localStorage.getItem('goodtrader_accounts_data') : null;

  // 1. Remove all session trades and history
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith('goodtrader_session_trades_') || k === 'goodtrader_debrief_history' || k === 'goodtrader_trading_status' || k === 'goodtrader_calendar_data')) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));

  // 2. Reset user stats & DP
  localStorage.setItem('goodtrader_user_stats', JSON.stringify(DEFAULT_USER_STATS));
  localStorage.setItem('goodtrader_user_dp', '0');
  localStorage.setItem('goodtrader_debrief_history', '[]');
  localStorage.setItem('goodtrader_trading_status', JSON.stringify('TRADING'));

  // 3. Handle broker accounts
  if (keepBrokerAccounts && savedAccounts) {
    localStorage.setItem('goodtrader_accounts_data', savedAccounts);
  } else {
    localStorage.removeItem('goodtrader_accounts_data');
  }

  // 4. Reload page to initialize pristine clean slate
  window.location.reload();
};

export const exportFullBackup = () => {
  if (typeof window === 'undefined') return;
  const backup = {
    version: '1.0',
    appName: 'TradePigeon',
    exportedAt: new Date().toISOString(),
    data: {}
  };
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('goodtrader_')) {
      try {
        backup.data[key] = JSON.parse(localStorage.getItem(key));
      } catch (e) {
        backup.data[key] = localStorage.getItem(key);
      }
    }
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `tradepigeon_journal_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importFullBackup = (backupInput) => {
  if (typeof window === 'undefined') return { success: false, error: 'No browser environment' };
  try {
    const parsed = typeof backupInput === 'string' ? JSON.parse(backupInput) : backupInput;
    if (!parsed || !parsed.data || typeof parsed.data !== 'object') {
      return { success: false, error: 'Invalid backup file. Missing data payload.' };
    }
    const keys = Object.keys(parsed.data);
    if (keys.length === 0) {
      return { success: false, error: 'Backup file contains no TradePigeon data.' };
    }
    keys.forEach(k => {
      if (k.startsWith('goodtrader_')) {
        const val = parsed.data[k];
        localStorage.setItem(k, typeof val === 'string' ? val : JSON.stringify(val));
      }
    });
    return { success: true, count: keys.length };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to parse JSON backup.' };
  }
};

export const wipeAccountTrades = (accountIdentifier) => {
  if (typeof window === 'undefined' || !accountIdentifier) return 0;
  let totalWiped = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('goodtrader_session_trades_')) {
      try {
        const trades = JSON.parse(localStorage.getItem(key)) || [];
        if (Array.isArray(trades)) {
          const remaining = trades.filter(t => {
            const acc = t.account || '';
            const match = acc === accountIdentifier || 
                          String(acc).includes(accountIdentifier) || 
                          String(accountIdentifier).includes(acc);
            return !match;
          });
          const removed = trades.length - remaining.length;
          if (removed > 0) {
            totalWiped += removed;
            localStorage.setItem(key, JSON.stringify(remaining));
            window.dispatchEvent(new CustomEvent('goodtrader-storage-update', { detail: { key, value: remaining } }));
          }
        }
      } catch (e) {
        // ignore parse error
      }
    }
  }
  return totalWiped;
};

export { STORAGE_KEYS };
