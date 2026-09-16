// TradePigeon LocalStorage & Cloud Firestore Persistence Manager
import { db, auth, isFirebaseConfigured } from '../config/firebase';
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';

const STORAGE_KEYS = {
  USER_STATS: 'tradepigeon_user_stats',
  CALENDAR_DATA: 'tradepigeon_calendar_data',
  SETUPS: 'tradepigeon_setups',
  QUESTS: 'tradepigeon_quests',
  SHOP_ITEMS: 'tradepigeon_shop_items',
  ONBOARDING_COMPLETED: 'tradepigeon_onboarding_completed',
  ONBOARDING_STEP: 'tradepigeon_onboarding_step',
  ONBOARDING_DRAFT: 'tradepigeon_onboarding_draft'
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
    const idLower = String(acc.id || '').toLowerCase();
    
    // Explicitly purge unauthenticated placeholder dummy strings
    if (dummyKeywords.some(kw => nameLower.includes(kw) || brokerLower.includes(kw) || accNumLower.includes(kw) || idLower.includes(kw))) {
      return false;
    }
    
    // Retain valid accounts with proper identification
    if (acc.accountNumber && String(acc.accountNumber).trim() !== '') return true;
    if (acc.id && String(acc.id).trim() !== '') return true;
    if (acc.name && String(acc.name).trim() !== '') return true;
    return false;
  });
};

/**
 * Backward-Compatible Key Resolver:
 * Given any key, returns the canonical tradepigeon_* key and legacy goodtrader_* key.
 */
const resolveKeyAliases = (key) => {
  const canonicalKey = key.startsWith('goodtrader_') 
    ? key.replace('goodtrader_', 'tradepigeon_') 
    : key;
  const legacyKey = canonicalKey.startsWith('tradepigeon_')
    ? canonicalKey.replace('tradepigeon_', 'goodtrader_')
    : (canonicalKey.startsWith('goodtrader_') ? canonicalKey : null);
  return { canonicalKey, legacyKey };
};

/**
 * Auto-Migrates any legacy goodtrader_* localStorage keys to tradepigeon_* seamlessly.
 * Runs once safely in browser environments without wiping or mutating data structures.
 */
const runOneTimeLegacyKeyMigration = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const keysToMigrate = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('goodtrader_')) {
        keysToMigrate.push(k);
      }
    }

    keysToMigrate.forEach(legacyKey => {
      const targetKey = legacyKey.replace('goodtrader_', 'tradepigeon_');
      const existingNewVal = localStorage.getItem(targetKey);
      const legacyVal = localStorage.getItem(legacyKey);
      
      // If the target tradepigeon_* doesn't exist yet, copy legacy value over
      if (existingNewVal === null && legacyVal !== null) {
        localStorage.setItem(targetKey, legacyVal);
      }
    });
  } catch (err) {
    console.warn('[TradePigeon Storage] Legacy migration notice:', err);
  }
};

// Immediately invoke migration upon initialization
runOneTimeLegacyKeyMigration();

export const loadStoredData = (key, fallback) => {
  try {
    const { canonicalKey, legacyKey } = resolveKeyAliases(key);
    
    // 1. First attempt to read from canonical tradepigeon_* key
    let item = localStorage.getItem(canonicalKey);

    // 2. If null, fall back to legacy goodtrader_* key and auto-migrate to canonical
    if (item === null && legacyKey) {
      const legacyItem = localStorage.getItem(legacyKey);
      if (legacyItem !== null) {
        item = legacyItem;
        try {
          localStorage.setItem(canonicalKey, legacyItem);
        } catch (_) {}
      }
    }

    if (!item) return fallback;
    const parsed = JSON.parse(item);
    if (parsed === null || parsed === undefined) return fallback;

    if ((canonicalKey === 'tradepigeon_accounts_data' || key === 'goodtrader_accounts_data') && Array.isArray(parsed)) {
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

// In-flight write debouncing map
const pendingCloudWrites = new Map();
let cloudUnsubscribe = null;

export const saveStoredData = (key, value) => {
  const { canonicalKey, legacyKey } = resolveKeyAliases(key);
  const serialized = JSON.stringify(value);

  // 1. Instant local write (0ms latency for UI)
  try {
    localStorage.setItem(canonicalKey, serialized);
    // Also mirror to legacy key during transition so older cached sessions don't break
    if (legacyKey && legacyKey !== canonicalKey) {
      try {
        localStorage.setItem(legacyKey, serialized);
      } catch (_) {}
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tradepigeon-storage-update', { 
        detail: { key: canonicalKey, legacyKey, value } 
      }));
      // Dispatch legacy event name for backward-compatibility with any existing listeners
      window.dispatchEvent(new CustomEvent('goodtrader-storage-update', { 
        detail: { key: canonicalKey, legacyKey, value } 
      }));
    }
  } catch (err) {
    console.warn(`[TradePigeon Storage] Failed to save ${canonicalKey}:`, err);
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      console.error('[TradePigeon Storage] LocalStorage quota exceeded.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tradepigeon-storage-quota-exceeded', { detail: { key: canonicalKey } }));
      }
    }
  }

  // 2. Dual-tier Cloud Firestore write when user is authenticated
  if (typeof window !== 'undefined' && isFirebaseConfigured && db && auth?.currentUser?.uid) {
    const uid = auth.currentUser.uid;
    if (pendingCloudWrites.has(canonicalKey)) {
      clearTimeout(pendingCloudWrites.get(canonicalKey));
    }

    const timer = setTimeout(async () => {
      pendingCloudWrites.delete(canonicalKey);
      try {
        const safeDocId = canonicalKey.replace(/\//g, '_');
        const docRef = doc(db, 'users', uid, 'journal', safeDocId);
        await setDoc(docRef, {
          key: canonicalKey,
          value,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (cloudErr) {
        console.warn(`[Firestore Cloud Write Notice on ${canonicalKey}]:`, cloudErr.message);
      }
    }, 300);

    pendingCloudWrites.set(canonicalKey, timer);
  }
};

/**
 * Initializes real-time two-way sync with Cloud Firestore for the authenticated user.
 * Enables live desktop <-> mobile synchronicity.
 */
export const initCloudFirestoreSync = (uid) => {
  if (typeof window === 'undefined') return () => {};

  // Clean up any existing listener
  if (cloudUnsubscribe) {
    try { cloudUnsubscribe(); } catch (_) {}
    cloudUnsubscribe = null;
  }

  if (!isFirebaseConfigured || !db || !uid) return () => {};

  try {
    const colRef = collection(db, 'users', uid, 'journal');
    
    cloudUnsubscribe = onSnapshot(colRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const docData = change.doc.data();
          if (docData && docData.key && docData.value !== undefined) {
            try {
              const { canonicalKey, legacyKey } = resolveKeyAliases(docData.key);
              const currentRaw = localStorage.getItem(canonicalKey);
              const currentParsed = currentRaw ? JSON.parse(currentRaw) : null;
              
              if (JSON.stringify(currentParsed) !== JSON.stringify(docData.value)) {
                const serialized = JSON.stringify(docData.value);
                localStorage.setItem(canonicalKey, serialized);
                if (legacyKey && legacyKey !== canonicalKey) {
                  try { localStorage.setItem(legacyKey, serialized); } catch (_) {}
                }
                window.dispatchEvent(new CustomEvent('tradepigeon-storage-update', { 
                  detail: { key: canonicalKey, legacyKey, value: docData.value, isFromCloud: true } 
                }));
                window.dispatchEvent(new CustomEvent('goodtrader-storage-update', { 
                  detail: { key: canonicalKey, legacyKey, value: docData.value, isFromCloud: true } 
                }));
              }
            } catch (_) {}
          }
        }
      });
    }, (snapErr) => {
      console.warn('[Firestore Sync Listener Notice]:', snapErr.message);
    });

    // Automatic Migration: Migrate local keys to Cloud Firestore if user has existing local journal data
    setTimeout(async () => {
      const keysToMigrate = [
        STORAGE_KEYS.USER_STATS,
        STORAGE_KEYS.CALENDAR_DATA,
        'tradepigeon_accounts_data',
        'tradepigeon_playbook_setups',
        'tradepigeon_baskets_list',
        'tradepigeon_user_dp',
        'tradepigeon_debrief_history',
        'tradepigeon_trading_status',
        'tradepigeon_stealth_mode'
      ];

      for (const k of keysToMigrate) {
        const localVal = loadStoredData(k, null);
        if (localVal !== null && localVal !== undefined) {
          try {
            const safeDocId = k.replace(/\//g, '_');
            const docRef = doc(db, 'users', uid, 'journal', safeDocId);
            await setDoc(docRef, {
              key: k,
              value: localVal,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (_) {}
        }
      }
    }, 1500);

    return () => {
      if (cloudUnsubscribe) {
        try { cloudUnsubscribe(); } catch (_) {}
        cloudUnsubscribe = null;
      }
    };
  } catch (err) {
    console.warn('[Firestore Sync Init Notice]:', err.message);
    return () => {};
  }
};

export const subscribeToStorageUpdate = (callback) => {
  const localHandler = (event) => {
    if (callback) callback(event.detail);
  };

  const crossTabHandler = (event) => {
    if (!callback || !event.key) return;
    try {
      const parsedValue = event.newValue ? JSON.parse(event.newValue) : null;
      const { canonicalKey, legacyKey } = resolveKeyAliases(event.key);
      callback({ key: canonicalKey, legacyKey, value: parsedValue });
    } catch (_) {
      callback({ key: event.key, value: event.newValue });
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('tradepigeon-storage-update', localHandler);
    window.addEventListener('goodtrader-storage-update', localHandler);
    window.addEventListener('storage', crossTabHandler);
  }
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('tradepigeon-storage-update', localHandler);
      window.removeEventListener('goodtrader-storage-update', localHandler);
      window.removeEventListener('storage', crossTabHandler);
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
  const canonicalDayKey = `tradepigeon_session_trades_day_${activeDay}`;
  const legacyDayKey = `goodtrader_session_trades_day_${activeDay}`;
  
  localStorage.removeItem(canonicalDayKey);
  localStorage.removeItem(legacyDayKey);
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tradepigeon-storage-update', { detail: { key: canonicalDayKey, value: [] } }));
    window.dispatchEvent(new CustomEvent('goodtrader-storage-update', { detail: { key: canonicalDayKey, value: [] } }));
  }
};

export const factoryResetCleanSlate = ({ keepBrokerAccounts = true } = {}) => {
  if (typeof window === 'undefined') return;
  
  const savedAccounts = keepBrokerAccounts 
    ? (localStorage.getItem('tradepigeon_accounts_data') || localStorage.getItem('goodtrader_accounts_data')) 
    : null;

  // 1. Remove all session trades and history
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (
      k.startsWith('tradepigeon_session_trades_') || 
      k.startsWith('goodtrader_session_trades_') || 
      k === 'tradepigeon_debrief_history' || 
      k === 'goodtrader_debrief_history' || 
      k === 'tradepigeon_trading_status' || 
      k === 'goodtrader_trading_status' || 
      k === 'tradepigeon_calendar_data' ||
      k === 'goodtrader_calendar_data'
    )) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));

  // 2. Reset user stats & DP
  const defaultStatsStr = JSON.stringify(DEFAULT_USER_STATS);
  localStorage.setItem('tradepigeon_user_stats', defaultStatsStr);
  localStorage.setItem('goodtrader_user_stats', defaultStatsStr);
  localStorage.setItem('tradepigeon_user_dp', '0');
  localStorage.setItem('goodtrader_user_dp', '0');
  localStorage.setItem('tradepigeon_debrief_history', '[]');
  localStorage.setItem('goodtrader_debrief_history', '[]');
  localStorage.setItem('tradepigeon_trading_status', JSON.stringify('TRADING'));
  localStorage.setItem('goodtrader_trading_status', JSON.stringify('TRADING'));

  // 3. Handle broker accounts
  if (keepBrokerAccounts && savedAccounts) {
    localStorage.setItem('tradepigeon_accounts_data', savedAccounts);
    localStorage.setItem('goodtrader_accounts_data', savedAccounts);
  } else {
    localStorage.removeItem('tradepigeon_accounts_data');
    localStorage.removeItem('goodtrader_accounts_data');
  }

  // 4. Reload page to initialize pristine clean slate
  window.location.reload();
};

export const exportFullBackup = () => {
  if (typeof window === 'undefined') return;
  const backup = {
    version: '2.0',
    appName: 'TradePigeon',
    exportedAt: new Date().toISOString(),
    data: {}
  };
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('tradepigeon_') || key.startsWith('goodtrader_') || key.startsWith('day_'))) {
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

export const getAllStoredTrades = () => {
  if (typeof window === 'undefined') return [];
  const allTrades = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    if (
      key.startsWith('day_') || 
      key.startsWith('tradepigeon_session_trades_') || 
      key.startsWith('goodtrader_session_trades_') || 
      key === 'tradepigeon_tradelogs' ||
      key === 'goodtrader_tradelogs'
    ) {
      try {
        const raw = localStorage.getItem(key);
        const data = JSON.parse(raw);
        const trades = Array.isArray(data) ? data : (data?.trades || []);
        if (Array.isArray(trades)) {
          trades.forEach((t, idx) => {
            if (t && (t.pnl !== undefined || t.pnlNum !== undefined || t.symbol || t.account)) {
              const defaultDate = key.startsWith('day_') ? key.replace('day_', '') : new Date().toISOString().slice(0, 10);
              const pnlValue = t.pnlNum !== undefined ? t.pnlNum : (t.pnl || 0);
              const cleanPnlNum = typeof pnlValue === 'number' ? pnlValue : (parseFloat(String(pnlValue).replace(/[^0-9.-]/g, '')) || 0);
              allTrades.push({
                id: t.id || `${key}_trade_${idx}_${Date.now()}`,
                date: t.date || defaultDate,
                account: t.account || 'Default Account',
                symbol: t.symbol || t.contract || 'ES',
                type: t.action || t.side || t.type || 'BUY',
                contracts: t.contracts || t.quantity || t.qty || 1,
                entryPrice: t.entryPrice || t.entry || '',
                exitPrice: t.exitPrice || t.exit || '',
                pnl: pnlValue,
                pnlNum: cleanPnlNum,
                rMultiple: t.rMultiple || t.r || '',
                setup: t.setup || t.playbook || 'General',
                status: t.status || (cleanPnlNum >= 0 ? 'WIN' : 'LOSS'),
                executedTime: t.time || t.executedTime || '',
                mistake: t.mistake || '',
                notes: t.notes || ''
              });
            }
          });
        }
      } catch (_) {}
    }
  }

  // Deduplicate trades by unique signature
  const seen = new Set();
  return allTrades.filter(t => {
    const sig = `${t.date}_${t.account}_${t.symbol}_${t.pnlNum}_${t.executedTime}`;
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
};

export const exportTradesCsv = () => {
  if (typeof window === 'undefined') return;
  const uniqueTrades = getAllStoredTrades();

  if (uniqueTrades.length === 0) {
    alert('No trades found in your journal to export.');
    return;
  }

  const headers = ['Date', 'Account', 'Symbol', 'Side', 'Contracts', 'Entry Price', 'Exit Price', 'PnL ($)', 'R Multiple', 'Setup', 'Status', 'Execution Time', 'Mistake', 'Discipline Notes'];
  const rows = uniqueTrades.map(t => [
    `"${t.date}"`,
    `"${t.account}"`,
    `"${t.symbol}"`,
    `"${t.type}"`,
    `"${t.contracts}"`,
    `"${t.entryPrice}"`,
    `"${t.exitPrice}"`,
    `"${t.pnl}"`,
    `"${t.rMultiple}"`,
    `"${t.setup}"`,
    `"${t.status}"`,
    `"${t.executedTime}"`,
    `"${(t.mistake || '').replace(/"/g, '""')}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `tradepigeon_trades_export_${dateStr}.csv`;
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
      if (k.startsWith('tradepigeon_') || k.startsWith('goodtrader_') || k.startsWith('day_')) {
        const val = parsed.data[k];
        saveStoredData(k, val);
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
  const processedKeys = new Set();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('tradepigeon_session_trades_') || key.startsWith('goodtrader_session_trades_'))) {
      const { canonicalKey, legacyKey } = resolveKeyAliases(key);
      if (processedKeys.has(canonicalKey)) continue;
      processedKeys.add(canonicalKey);

      try {
        const trades = JSON.parse(localStorage.getItem(canonicalKey) || localStorage.getItem(legacyKey)) || [];
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
            const serialized = JSON.stringify(remaining);
            localStorage.setItem(canonicalKey, serialized);
            if (legacyKey) {
              try { localStorage.setItem(legacyKey, serialized); } catch (_) {}
            }
            window.dispatchEvent(new CustomEvent('tradepigeon-storage-update', { detail: { key: canonicalKey, value: remaining } }));
            window.dispatchEvent(new CustomEvent('goodtrader-storage-update', { detail: { key: canonicalKey, value: remaining } }));
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
