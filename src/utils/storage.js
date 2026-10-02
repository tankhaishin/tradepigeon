// TradePigeon LocalStorage & Cloud Firestore Persistence Manager
import { db, auth, isFirebaseConfigured } from '../config/firebase.js';
import { doc, setDoc, onSnapshot, collection, writeBatch, deleteDoc, getDocs } from 'firebase/firestore';
import { parseFinancialNumber, formatFinancialCurrency, formatRMultiple } from './financialMath.js';

// Legacy per-day trade keys. Trades now live in tradeStore.js; these are only read once for migration.
const isLegacyTradeKey = (k = '') =>
  k === 'tradepigeon_tradelogs' || k === 'goodtrader_tradelogs' || k.startsWith('tradepigeon_session_trades') ||
  k.startsWith('goodtrader_session_trades') || k.startsWith('day_');

const STORAGE_KEYS = {
  AUTH_USER: 'tradepigeon_auth_user',
  USER_STATS: 'tradepigeon_user_stats',
  USER_DP: 'tradepigeon_user_dp',
  STREAK_FREEZES: 'tradepigeon_streak_freezes',
  CALENDAR_DATA: 'tradepigeon_calendar_data',
  SETUPS: 'tradepigeon_setups',
  QUESTS: 'tradepigeon_quests',
  SHOP_ITEMS: 'tradepigeon_shop_items',
  ONBOARDING_COMPLETED: 'tradepigeon_onboarding_completed',
  ONBOARDING_STEP: 'tradepigeon_onboarding_step',
  ONBOARDING_DRAFT: 'tradepigeon_onboarding_draft',
  TRADE_HISTORY: 'tradepigeon_tradelogs',
  MAX_DAILY_LOSS: 'tradepigeon_max_daily_loss',
  RISK_TYPE: 'tradepigeon_risk_type'
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
  const seenAccountKeys = new Set();
  const result = [];

  for (const acc of accounts) {
    if (!acc || typeof acc !== 'object') continue;
    const name = String(acc.name || '').trim();
    if (!name || name.length < 2) continue;

    // Reject generic placeholder strings
    if (/^(dummy|placeholder|test)\s+account$/i.test(name)) continue;

    // Ensure valid identifier
    const rawKey = acc.id || acc.accountNumber || (acc.name && acc.broker ? `${acc.broker}-${acc.name}` : acc.name);
    if (!rawKey || String(rawKey).trim() === '') continue;

    const dedupeKey = String(rawKey).trim().toLowerCase();
    if (seenAccountKeys.has(dedupeKey)) continue;
    seenAccountKeys.add(dedupeKey);

    result.push(acc);
  }

  return result;
};

/**
 * Backward-Compatible Key Resolver:
 * Given any key, returns the canonical tradepigeon_* key and legacy alias.
 */
const resolveKeyAliases = (rawKey) => {
  if (!rawKey) return { canonicalKey: '', legacyKey: null };

  if (
    rawKey === 'tradepigeon_google_user' || 
    rawKey === 'goodtrader_google_user' || 
    rawKey === 'tradepigeon_auth_user' || 
    rawKey === 'goodtrader_auth_user'
  ) {
    return { canonicalKey: 'tradepigeon_auth_user', legacyKey: 'tradepigeon_google_user' };
  }

  // Normalize hyphenated current-day to canonical current_day
  let key = rawKey === 'tradepigeon_current-day' ? 'tradepigeon_current_day'
    : (rawKey === 'goodtrader_current-day' ? 'goodtrader_current_day' : rawKey);

  const canonicalKey = key.startsWith('goodtrader_') 
    ? key.replace('goodtrader_', 'tradepigeon_') 
    : key;
  const legacyKey = canonicalKey.startsWith('tradepigeon_')
    ? canonicalKey.replace('tradepigeon_', 'goodtrader_')
    : (canonicalKey.startsWith('goodtrader_') ? canonicalKey : null);
  return { canonicalKey, legacyKey };
};

/**
 * Safely snapshots all storage keys upfront into an array.
 * Prevents index skipping and iterator desynchronization when storage is mutated during loops.
 */
export const getStorageKeys = () => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const len = typeof localStorage.length === 'number' ? localStorage.length : 0;
    const keys = [];
    for (let i = 0; i < len; i++) {
      const k = typeof localStorage.key === 'function' ? localStorage.key(i) : null;
      if (k) keys.push(k);
    }
    if (keys.length > 0) return keys;
    return Object.keys(localStorage).filter(k => typeof localStorage[k] !== 'function');
  } catch {
    return [];
  }
};

/**
 * Auto-Migrates any legacy goodtrader_* localStorage keys to tradepigeon_* seamlessly.
 * Runs once safely in browser environments without wiping or mutating data structures.
 */
const runOneTimeLegacyKeyMigration = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const keysToMigrate = [];
    const allKeys = getStorageKeys();
    for (const k of allKeys) {
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

    // 2. Migrate legacy tradepigeon_google_user to canonical tradepigeon_auth_user
    const oldGoogleUser = localStorage.getItem('tradepigeon_google_user');
    const existingAuthUser = localStorage.getItem('tradepigeon_auth_user');
    if (existingAuthUser === null && oldGoogleUser !== null) {
      localStorage.setItem('tradepigeon_auth_user', oldGoogleUser);
    }
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

export const safeRemoveItem = (key) => {
  try {
    const { canonicalKey, legacyKey } = resolveKeyAliases(key);
    if (typeof localStorage !== 'undefined') {
      if (canonicalKey) localStorage.removeItem(canonicalKey);
      if (legacyKey) localStorage.removeItem(legacyKey);
    }
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('tradepigeon-storage-update', {
        detail: { key: canonicalKey, legacyKey, value: null, isDeleted: true }
      }));
      window.dispatchEvent(new CustomEvent('goodtrader-storage-update', {
        detail: { key: canonicalKey, legacyKey, value: null, isDeleted: true }
      }));
    }
  } catch (err) {
    console.warn(`[TradePigeon Storage] Failed to remove ${key}:`, err);
  }
};

export const safeGetItem = (key, fallback = null) => loadStoredData(key, fallback);
export const safeSetItem = (key, value) => saveStoredData(key, value);

// In-flight write debouncing map
const pendingCloudWrites = new Map();
let cloudUnsubscribe = null;
let tradesUnsubscribe = null;

// Smart Delta Sync Cache: Prevents re-writing unchanged historical trades to Firestore
export const syncedTradesFingerprintCache = new Map();

export function computeTradeFingerprint(trade) {
  if (!trade || !trade.id) return '';
  return `${trade.id}::${trade.pnl}::${trade.followedRules}::${trade.executionType || ''}::${trade.type || ''}::${trade.notes || ''}::${trade.setup || ''}::${trade.chartUrl || ''}::${trade.timestamp || ''}::${trade.confirmed || ''}`;
}

export function seedSyncedTradesFingerprint(trades = []) {
  if (!Array.isArray(trades)) return;
  trades.forEach(t => {
    if (t && t.id) {
      syncedTradesFingerprintCache.set(String(t.id), computeTradeFingerprint(t));
    }
  });
}

/**
 * Merges discrete cloud trades into local storage without dropping local edits
 */
export function mergeCloudTradesIntoLocal(cloudTrades = []) {
  if (!Array.isArray(cloudTrades) || cloudTrades.length === 0) return;
  const currentLocal = loadStoredData(STORAGE_KEYS.TRADE_HISTORY, []);
  const tradeMap = new Map();

  // Load existing local trades
  currentLocal.forEach(t => {
    if (t && t.id) tradeMap.set(String(t.id), t);
  });

  let hasUpdates = false;
  cloudTrades.forEach(ct => {
    if (ct && ct.id) {
      const existing = tradeMap.get(String(ct.id));
      if (!existing || JSON.stringify(existing) !== JSON.stringify(ct)) {
        tradeMap.set(String(ct.id), ct);
        hasUpdates = true;
      }
    }
  });

  if (hasUpdates) {
    const mergedList = Array.from(tradeMap.values());
    seedSyncedTradesFingerprint(mergedList);
    try {
      localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(mergedList));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tradepigeon-storage-update', { 
          detail: { key: STORAGE_KEYS.TRADE_HISTORY, value: mergedList, isFromCloud: true } 
        }));
      }
    } catch (_) {}
  }
}

export const saveStoredData = (key, value) => {
  const { canonicalKey, legacyKey } = resolveKeyAliases(key);

  // Auto-deduplicate and sanitize accounts list on write
  if (canonicalKey === 'tradepigeon_accounts_data' && Array.isArray(value)) {
    value = sanitizeAccountsList(value);
  }

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

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('tradepigeon-storage-update', { 
        detail: { key: canonicalKey, legacyKey, value } 
      }));
      // Dispatch legacy event name for backward-compatibility with any existing listeners
      window.dispatchEvent(new CustomEvent('goodtrader-storage-update', { 
        detail: { key: canonicalKey, legacyKey, value } 
      }));
    }

    // Bidirectional sync between tradepigeon_user_dp and tradepigeon_user_stats.disciplinePoints
    if (canonicalKey === 'tradepigeon_user_dp') {
      try {
        const statsRaw = localStorage.getItem('tradepigeon_user_stats');
        const stats = statsRaw ? JSON.parse(statsRaw) : { ...DEFAULT_USER_STATS };
        const newDp = Number(value) || 0;
        if (stats.disciplinePoints !== newDp) {
          stats.disciplinePoints = newDp;
          localStorage.setItem('tradepigeon_user_stats', JSON.stringify(stats));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tradepigeon-storage-update', {
              detail: { key: 'tradepigeon_user_stats', value: stats }
            }));
          }
        }
      } catch (_) {}
    } else if (canonicalKey === 'tradepigeon_user_stats' && value && typeof value.disciplinePoints === 'number') {
      try {
        const currentDpRaw = localStorage.getItem('tradepigeon_user_dp');
        const currentDp = currentDpRaw !== null ? Number(JSON.parse(currentDpRaw)) : null;
        if (currentDp !== value.disciplinePoints) {
          localStorage.setItem('tradepigeon_user_dp', JSON.stringify(value.disciplinePoints));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tradepigeon-storage-update', {
              detail: { key: 'tradepigeon_user_dp', value: value.disciplinePoints }
            }));
          }
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn(`[TradePigeon Storage] Failed to save ${canonicalKey}:`, err);
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      console.error('[TradePigeon Storage] LocalStorage quota exceeded.');
      try {
        const nonCriticalKeys = ['tradepigeon_debrief_history', 'goodtrader_debrief_history', 'tradepigeon_stealth_mode'];
        nonCriticalKeys.forEach(k => localStorage.removeItem(k));
        localStorage.setItem(canonicalKey, serialized);
      } catch (_) {}
      if (typeof window !== 'undefined') {
        const usage = getStorageUsage();
        window.dispatchEvent(new CustomEvent('tradepigeon-storage-quota-exceeded', { detail: { key: canonicalKey, usage } }));
      }
    }
  }

  // 2. Dual-tier Cloud Firestore write when user is authenticated
  if (typeof window !== 'undefined' && isFirebaseConfigured && db && auth?.currentUser?.uid && !isLegacyTradeKey(canonicalKey)) {
    const uid = auth.currentUser.uid;
    if (pendingCloudWrites.has(canonicalKey)) {
      clearTimeout(pendingCloudWrites.get(canonicalKey));
    }

    const timer = setTimeout(async () => {
      pendingCloudWrites.delete(canonicalKey);
      try {
        // Subcollection Architecture: Store individual trades in discrete documents using Smart Delta Sync
        if ((canonicalKey === STORAGE_KEYS.TRADE_HISTORY || canonicalKey === 'tradepigeon_tradelogs') && Array.isArray(value)) {
          // Identify only trades that are new or have changed since last sync
          const dirtyTrades = value.filter(trade => {
            if (!trade || !trade.id) return false;
            const currentFp = computeTradeFingerprint(trade);
            return syncedTradesFingerprintCache.get(String(trade.id)) !== currentFp;
          });

          // Detect deleted trades (trades previously synced but no longer in value array)
          const currentTradeIdSet = new Set(value.map(t => (t && t.id ? String(t.id) : null)).filter(Boolean));
          const deletedTradeIds = [];
          for (const syncedId of syncedTradesFingerprintCache.keys()) {
            if (!currentTradeIdSet.has(syncedId)) {
              deletedTradeIds.push(syncedId);
            }
          }

          if (dirtyTrades.length > 0 || deletedTradeIds.length > 0) {
            const CHUNK_SIZE = 400;

            // Commit only dirty / modified trades
            for (let i = 0; i < dirtyTrades.length; i += CHUNK_SIZE) {
              const chunk = dirtyTrades.slice(i, i + CHUNK_SIZE);
              const batch = writeBatch(db);
              chunk.forEach(trade => {
                const tradeDocRef = doc(db, 'users', uid, 'trades', String(trade.id));
                batch.set(tradeDocRef, { ...trade, updatedAt: new Date().toISOString() }, { merge: true });
              });
              await batch.commit();
              chunk.forEach(trade => {
                syncedTradesFingerprintCache.set(String(trade.id), computeTradeFingerprint(trade));
              });
            }

            // Purge deleted trades from Firestore subcollection
            for (let i = 0; i < deletedTradeIds.length; i += CHUNK_SIZE) {
              const chunk = deletedTradeIds.slice(i, i + CHUNK_SIZE);
              const batch = writeBatch(db);
              chunk.forEach(id => {
                const tradeDocRef = doc(db, 'users', uid, 'trades', id);
                batch.delete(tradeDocRef);
              });
              await batch.commit();
              chunk.forEach(id => syncedTradesFingerprintCache.delete(id));
            }
          }

          // Write lightweight pointer in journal metadata
          const metaDocRef = doc(db, 'users', uid, 'journal', 'tradepigeon_tradelogs');
          await setDoc(metaDocRef, {
            key: canonicalKey,
            subcollectionMode: true,
            totalTradesCount: value.length,
            lastDeltaCount: dirtyTrades.length,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          return;
        }

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
 * Enables live desktop <-> mobile synchronicity and subcollection trade hydration.
 */
export const initCloudFirestoreSync = (uid) => {
  if (typeof window === 'undefined') return () => {};

  // Clean up any existing listeners
  if (cloudUnsubscribe) {
    try { cloudUnsubscribe(); } catch (_) {}
    cloudUnsubscribe = null;
  }
  if (tradesUnsubscribe) {
    try { tradesUnsubscribe(); } catch (_) {}
    tradesUnsubscribe = null;
  }

  if (!isFirebaseConfigured || !db || !uid) return () => {};

  // Seed delta sync cache from local cache so cold starts do not re-commit existing trades
  const initialLocalTrades = loadStoredData(STORAGE_KEYS.TRADE_HISTORY, []);
  seedSyncedTradesFingerprint(initialLocalTrades);

  try {
    const colRef = collection(db, 'users', uid, 'journal');
    
    // 1. Journal collection listener (User stats, playbooks, calendar, settings)
    cloudUnsubscribe = onSnapshot(colRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const docData = change.doc.data();
          if (docData && docData.key && docData.value !== undefined) {
            // If legacy trades are in single doc, trigger silent migration to subcollection
            if ((docData.key === 'tradepigeon_tradelogs' || docData.key === STORAGE_KEYS.TRADE_HISTORY) && Array.isArray(docData.value)) {
              if (docData.value.length > 0 && !docData.subcollectionMode) {
                setTimeout(async () => {
                  try {
                    const batch = writeBatch(db);
                    docData.value.slice(0, 80).forEach(t => {
                      if (t && t.id) {
                        const trRef = doc(db, 'users', uid, 'trades', String(t.id));
                        batch.set(trRef, { ...t, migratedAt: new Date().toISOString() }, { merge: true });
                      }
                    });
                    await batch.commit();
                  } catch (_) {}
                }, 2000);
              }
            }

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

    // Trades sync lives in tradeStore.initTradeCloudSync (tombstone-aware).

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
            if ((k === STORAGE_KEYS.TRADE_HISTORY || k === 'tradepigeon_tradelogs') && Array.isArray(localVal)) {
              // Migrate trades to subcollection in safe chunks without single 1MB document limit
              const CHUNK_SIZE = 400;
              for (let i = 0; i < localVal.length; i += CHUNK_SIZE) {
                const chunk = localVal.slice(i, i + CHUNK_SIZE);
                const batch = writeBatch(db);
                chunk.forEach(t => {
                  if (t && t.id) {
                    const trRef = doc(db, 'users', uid, 'trades', String(t.id));
                    batch.set(trRef, { ...t, migratedAt: new Date().toISOString() }, { merge: true });
                  }
                });
                await batch.commit();
              }
              const metaDocRef = doc(db, 'users', uid, 'journal', 'tradepigeon_tradelogs');
              await setDoc(metaDocRef, {
                key: k,
                subcollectionMode: true,
                totalTradesCount: localVal.length,
                updatedAt: new Date().toISOString()
              }, { merge: true });
              continue;
            }

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
      if (tradesUnsubscribe) {
        try { tradesUnsubscribe(); } catch (_) {}
        tradesUnsubscribe = null;
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

/**
 * Calculates current localStorage utilization and quota headroom.
 * Standard browser quota is ~5MB (5,242,880 bytes).
 * Returns { bytesUsed, kbUsed, mbUsed, percentUsed, isNearQuota }
 */
export const getStorageUsage = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { bytesUsed: 0, kbUsed: 0, mbUsed: '0.00', percentUsed: 0, isNearQuota: false };
  }
  let totalBytes = 0;
  try {
    const keys = getStorageKeys();
    for (const k of keys) {
      const val = localStorage.getItem(k) || '';
      totalBytes += (k.length + val.length) * 2;
    }
  } catch {
    // Graceful fallback
  }

  const maxBytes = 5 * 1024 * 1024; // 5MB
  const percentUsed = Math.min(100, Math.round((totalBytes / maxBytes) * 100));
  const mbUsed = (totalBytes / (1024 * 1024)).toFixed(2);
  const kbUsed = Math.round(totalBytes / 1024);
  const isNearQuota = percentUsed >= 80;

  return {
    bytesUsed: totalBytes,
    kbUsed,
    mbUsed,
    percentUsed,
    isNearQuota
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
  
  safeRemoveItem(canonicalDayKey);
  safeRemoveItem(legacyDayKey);
};

export const factoryResetCleanSlate = async ({ keepBrokerAccounts = true } = {}) => {
  if (typeof window === 'undefined') return;
  
  const savedAccounts = keepBrokerAccounts 
    ? (safeGetItem('tradepigeon_accounts_data') || safeGetItem('goodtrader_accounts_data')) 
    : null;

  // 0. Delete every trade through the trade store: tombstones propagate to the cloud and all devices.
  const tradeStore = await import('./tradeStore.js');
  tradeStore.deleteTrades(tradeStore.getTrades().map(t => t.id));
  localStorage.removeItem('tradepigeon_import_history');

  // 1. If Firebase is active and user is logged in, wipe subcollection trades & cloud journal
  if (isFirebaseConfigured && db && auth?.currentUser?.uid) {
    const uid = auth.currentUser.uid;
    try {

      // Reset cloud journal metadata
      const metaDocRef = doc(db, 'users', uid, 'journal', 'tradepigeon_tradelogs');
      await setDoc(metaDocRef, {
        key: 'tradepigeon_tradelogs',
        subcollectionMode: true,
        totalTradesCount: 0,
        clearedAt: new Date().toISOString()
      });

      // Clear other cloud journal documents
      const journalDocsToReset = [
        'tradepigeon_calendar_data',
        'tradepigeon_user_dp',
        'tradepigeon_debrief_history',
        'tradepigeon_playbook_setups'
      ];
      for (const jDoc of journalDocsToReset) {
        const jRef = doc(db, 'users', uid, 'journal', jDoc);
        await setDoc(jRef, { value: null, clearedAt: new Date().toISOString() }, { merge: true });
      }
    } catch (cloudErr) {
      console.warn('[Factory Reset Cloud Cleanup Notice]:', cloudErr.message);
    }
  }

  // 2. Remove all session trades, historical days, logs, notes, debriefs, and quests from localStorage
  const keysToRemove = [];
  const allStorageKeys = getStorageKeys();
  for (const k of allStorageKeys) {
    if (!k) continue;
    if (
      k.startsWith('day_') ||
      k.startsWith('tradepigeon_session_trades') || 
      k.startsWith('goodtrader_session_trades') || 
      k.startsWith('tradepigeon_session_note_') ||
      k.startsWith('goodtrader_session_note_') ||
      k.startsWith('tradepigeon_debrief_') ||
      k.startsWith('goodtrader_debrief_') ||
      k === 'tradepigeon_tradelogs' ||
      k === 'goodtrader_tradelogs' ||
      k === 'tradepigeon_debrief_history' || 
      k === 'goodtrader_debrief_history' || 
      k === 'tradepigeon_trading_status' || 
      k === 'goodtrader_trading_status' || 
      k === 'tradepigeon_calendar_data' ||
      k === 'goodtrader_calendar_data' ||
      k === 'tradepigeon_claimed_quests' ||
      k === 'tradepigeon_claimed_quests_date' ||
      k === 'tradepigeon_completed_steps' ||
      k === 'tradepigeon_completed_days' ||
      k === 'tradepigeon_playbook_setups' ||
      k === 'goodtrader_playbook_setups' ||
      k === 'tradepigeon_inventory' ||
      k === 'tradepigeon_streak_freezes' ||
      k === 'tradepigeon_active_items' ||
      (!keepBrokerAccounts && (
        k === 'tradepigeon_accounts_data' || 
        k === 'goodtrader_accounts_data' || 
        k === 'tradepigeon_synced_accounts'
      ))
    ) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach(k => safeRemoveItem(k));

  // 3. Reset user stats & DP
  saveStoredData('tradepigeon_user_stats', DEFAULT_USER_STATS);
  saveStoredData('goodtrader_user_stats', DEFAULT_USER_STATS);
  saveStoredData('tradepigeon_user_dp', 0);
  saveStoredData('goodtrader_user_dp', 0);
  saveStoredData('tradepigeon_debrief_history', []);
  saveStoredData('goodtrader_debrief_history', []);
  saveStoredData('tradepigeon_trading_status', 'TRADING');
  saveStoredData('goodtrader_trading_status', 'TRADING');

  // 4. Handle broker accounts
  if (keepBrokerAccounts && savedAccounts) {
    safeSetItem('tradepigeon_accounts_data', savedAccounts);
    safeSetItem('goodtrader_accounts_data', savedAccounts);
  } else {
    safeRemoveItem('tradepigeon_accounts_data');
    safeRemoveItem('goodtrader_accounts_data');
    safeRemoveItem('tradepigeon_synced_accounts');
  }

  window.dispatchEvent(new CustomEvent('tradepigeon-storage-update', { detail: { key: 'trades_cleared', value: Date.now() } }));
  window.dispatchEvent(new CustomEvent('goodtrader-storage-update', { detail: { key: 'trades_cleared', value: Date.now() } }));

  // 5. Reload page to initialize pristine clean slate
  if (window.location && typeof window.location.reload === 'function') {
    window.location.reload();
  }
};

export const exportFullBackup = () => {
  if (typeof window === 'undefined') return;
  const backup = {
    version: '2.0',
    appName: 'TradePigeon',
    exportedAt: new Date().toISOString(),
    data: {}
  };
  const allKeys = getStorageKeys();
  for (const key of allKeys) {
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

export const normalizeTrade = (t) => {
  if (!t || typeof t !== 'object') return t;

  const pnlNum = typeof t.pnlNum === 'number' 
    ? t.pnlNum 
    : typeof t.pnlValue === 'number' 
    ? t.pnlValue 
    : parseFinancialNumber(t.pnl, 0);

  const pnl = t.pnl || formatFinancialCurrency(pnlNum, { showPlus: true });

  const rawContracts = t.contracts !== undefined 
    ? t.contracts 
    : parseFinancialNumber(t.size, 1);
  const contracts = typeof rawContracts === 'number' && Number.isFinite(rawContracts) ? rawContracts : 1;
  const size = t.size || `${contracts} Lots`;

  const entry = t.entry || t.entryPrice || '0.00';
  const entryPrice = t.entryPrice || t.entry || '0.00';
  const entryPriceNum = typeof t.entryPriceNum === 'number' ? t.entryPriceNum : parseFinancialNumber(entry, 0);

  const exit = t.exit || t.exitPrice || '0.00';
  const exitPrice = t.exitPrice || t.exit || '0.00';
  const exitPriceNum = typeof t.exitPriceNum === 'number' ? t.exitPriceNum : parseFinancialNumber(exit, 0);

  const r = t.r || t.rMultiple || formatRMultiple(pnlNum, 350);
  const rMultiple = t.rMultiple || t.r || r;

  const time = t.time || t.executedTime || 'NOW';
  const executedTime = t.executedTime || t.time || time;

  const rawType = String(t.type || '').toLowerCase();
  const execType = String(t.executionType || '').toLowerCase();
  const isViolated = t.followedRules === false || t.violated === true || t.violatedRules === true ||
    rawType.includes('toxic') || rawType.includes('violate') || rawType.includes('double_failure') ||
    execType.includes('toxic') || execType.includes('double failure');

  const executionType = t.executionType || (
    isViolated
      ? (pnlNum > 5 ? 'Toxic Win' : pnlNum < -5 ? 'Double Failure' : 'Toxic Breakeven')
      : (pnlNum > 5 ? 'Disciplined Win' : pnlNum < -5 ? 'Disciplined Loss' : 'Disciplined Breakeven')
  );

  const type = t.type || (
    isViolated
      ? (pnlNum > 5 ? 'toxic_win' : pnlNum < -5 ? 'double_failure' : 'toxic_be')
      : (pnlNum > 5 ? 'win' : pnlNum < -5 ? 'good_loss' : 'breakeven')
  );

  const sideRaw = String(t.side || t.direction || (rawType.includes('short') ? 'SHORT' : 'BUY')).toUpperCase();
  const side = sideRaw.includes('SHORT') || sideRaw.includes('SELL') ? 'SELL' : 'BUY';
  const direction = side === 'SELL' ? 'SHORT' : 'LONG';

  return {
    ...t,
    pnlNum,
    pnlValue: pnlNum,
    pnl,
    contracts,
    size,
    entry,
    entryPrice,
    entryPriceNum,
    exit,
    exitPrice,
    exitPriceNum,
    r,
    rMultiple,
    time,
    executedTime,
    type,
    executionType,
    followedRules: !isViolated,
    side,
    direction
  };
};

export const saveSessionTrades = (trades, dateOrDay = 'today') => {
  if (typeof window === 'undefined') return;
  const normalized = Array.isArray(trades) ? trades.map(normalizeTrade) : [];
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const todayDom = now.getDate();
  const currentDay = loadStoredData('tradepigeon_current_day', 1);

  const isToday = dateOrDay === 'today' || dateOrDay === todayIso || dateOrDay === todayDom || dateOrDay === currentDay;

  if (isToday) {
    saveStoredData('tradepigeon_session_trades', normalized);
    saveStoredData(`tradepigeon_session_trades_day_${todayIso}`, normalized);
    saveStoredData(`tradepigeon_session_trades_day_${todayDom}`, normalized);
    saveStoredData(`tradepigeon_session_trades_day_${currentDay}`, normalized);
  } else {
    saveStoredData(`tradepigeon_session_trades_day_${dateOrDay}`, normalized);
  }
};

export const loadSessionTrades = (dateOrDay = 'today') => {
  if (typeof localStorage === 'undefined') return [];
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const todayDom = now.getDate();
  const currentDay = loadStoredData('tradepigeon_current_day', 1);

  const isToday = dateOrDay === 'today' || dateOrDay === todayIso || dateOrDay === todayDom || dateOrDay === currentDay;

  let loaded = null;
  if (isToday) {
    loaded = loadStoredData('tradepigeon_session_trades', null) ||
             loadStoredData(`tradepigeon_session_trades_day_${todayIso}`, null) ||
             loadStoredData(`tradepigeon_session_trades_day_${todayDom}`, null) ||
             loadStoredData(`tradepigeon_session_trades_day_${currentDay}`, null);
  } else {
    loaded = loadStoredData(`tradepigeon_session_trades_day_${dateOrDay}`, null) ||
             loadStoredData(`day_${dateOrDay}`, null);
  }

  const rawList = Array.isArray(loaded) ? loaded : Array.isArray(loaded?.trades) ? loaded.trades : [];
  return rawList.map(normalizeTrade);
};

export const addDisciplinePoints = (amount) => {
  if (typeof localStorage === 'undefined' || !amount || amount <= 0) return 0;
  const currentStats = loadStoredData('tradepigeon_user_stats', DEFAULT_USER_STATS);
  const currentDp = Number(currentStats.disciplinePoints) || Number(loadStoredData('tradepigeon_user_dp', 0)) || 0;
  const newDp = currentDp + amount;

  const updatedStats = {
    ...currentStats,
    disciplinePoints: newDp
  };
  saveStoredData('tradepigeon_user_stats', updatedStats);
  saveStoredData('tradepigeon_user_dp', newDp);
  return newDp;
};

export const spendDisciplinePoints = (amount) => {
  if (typeof localStorage === 'undefined' || !amount || amount <= 0) return false;
  const currentStats = loadStoredData('tradepigeon_user_stats', DEFAULT_USER_STATS);
  const currentDp = Number(currentStats.disciplinePoints) || Number(loadStoredData('tradepigeon_user_dp', 0)) || 0;
  if (currentDp < amount) return false;

  const newDp = currentDp - amount;
  const updatedStats = {
    ...currentStats,
    disciplinePoints: newDp
  };
  saveStoredData('tradepigeon_user_stats', updatedStats);
  saveStoredData('tradepigeon_user_dp', newDp);
  return true;
};

export const getAllStoredTrades = () => {
  if (typeof localStorage === 'undefined') return [];
  const allTrades = [];
  
  const allKeys = getStorageKeys();
  for (const key of allKeys) {
    if (!key) continue;
    
    if (
      key.startsWith('day_') || 
      key.startsWith('tradepigeon_session_trades') || 
      key.startsWith('goodtrader_session_trades') || 
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
              const pnlValue = t.pnlNum !== undefined ? t.pnlNum : (t.pnl !== undefined ? t.pnl : 0);
              const cleanPnlNum = typeof pnlValue === 'number' ? (isNaN(pnlValue) ? 0 : pnlValue) : parseFinancialNumber(pnlValue, 0);
              const cleanType = t.type || t.action || t.side || (cleanPnlNum > 0 ? 'win' : cleanPnlNum < 0 ? 'good_loss' : 'breakeven');
              const cleanSide = t.side || t.direction || t.action || (String(cleanType).toUpperCase().includes('SELL') || String(cleanType).toUpperCase().includes('SHORT') ? 'SHORT' : 'LONG');
              
              allTrades.push({
                ...t,
                id: t.id || `${key}_trade_${idx}`,
                date: t.date || defaultDate,
                account: t.account || 'Default Account',
                symbol: t.symbol || t.contract || 'ES',
                side: cleanSide,
                type: cleanType,
                executionType: t.executionType || '',
                followedRules: t.followedRules !== undefined ? Boolean(t.followedRules) : (
                  t.violatedRules === true || t.violated === true || 
                  ['toxic_win', 'toxic_be', 'double_failure', 'violate_win', 'violate_loss'].includes(String(cleanType).toLowerCase()) ||
                  ['toxic win', 'toxic breakeven', 'double failure'].includes(String(t.executionType || '').toLowerCase())
                    ? false
                    : true
                ),
                contracts: t.contracts || t.quantity || t.qty || 1,
                entryPrice: t.entryPrice || t.entry || '',
                exitPrice: t.exitPrice || t.exit || '',
                pnl: pnlValue,
                pnlNum: cleanPnlNum,
                rMultiple: t.rMultiple || t.r || '',
                setup: t.setup || t.playbook || 'General',
                status: t.status || (cleanPnlNum > 0 ? 'WIN' : cleanPnlNum < 0 ? 'LOSS' : 'BREAKEVEN'),
                executedTime: t.time || t.executedTime || '',
                mistake: t.mistake || '',
                notes: t.notes || '',
                chartUrl: t.chartUrl || ''
              });
            }
          });
        }
      } catch (_) {}
    }
  }

  // Deduplicate by ID and normalize all fields
  const seenIds = new Set();
  return allTrades
    .filter(t => {
      if (seenIds.has(t.id)) return false;
      seenIds.add(t.id);
      return true;
    })
    .map(normalizeTrade);
};

export const deleteStoredTrade = (tradeId) => {
  if (typeof window === 'undefined' || !tradeId) return false;
  let deletedCount = 0;

  // 1. Delete from tradepigeon_tradelogs & goodtrader_tradelogs
  ['tradepigeon_tradelogs', 'goodtrader_tradelogs'].forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const trades = JSON.parse(raw);
        if (Array.isArray(trades)) {
          const remaining = trades.filter(t => t && t.id !== tradeId);
          if (remaining.length !== trades.length) {
            deletedCount += (trades.length - remaining.length);
            saveStoredData(key, remaining);
          }
        }
      }
    } catch (_) {}
  });

  // 2. Delete from session day keys and calendar day keys
  const allKeys = getStorageKeys();
  for (const key of allKeys) {
    if (!key) continue;
    if (
      key.startsWith('day_') ||
      key.startsWith('tradepigeon_session_trades') ||
      key.startsWith('goodtrader_session_trades')
    ) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          const remaining = data.filter(t => t && t.id !== tradeId);
          if (remaining.length !== data.length) {
            deletedCount += (data.length - remaining.length);
            saveStoredData(key, remaining);
          }
        } else if (data && Array.isArray(data.trades)) {
          const remaining = data.trades.filter(t => t && t.id !== tradeId);
          if (remaining.length !== data.trades.length) {
            deletedCount += (data.trades.length - remaining.length);
            saveStoredData(key, { ...data, trades: remaining });
          }
        }
      } catch (_) {}
    }
  }

  // 3. Delete from Cloud Firestore subcollection to prevent real-time listener resurrection
  if (isFirebaseConfigured && db && auth?.currentUser?.uid) {
    try {
      const tradeDocRef = doc(db, 'users', auth.currentUser.uid, 'trades', String(tradeId));
      deleteDoc(tradeDocRef).catch(e => console.warn('[Firestore Trade Delete Notice]:', e.message));
    } catch (_) {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tradepigeon_trade_deleted', { detail: { tradeId } }));
  }

  return deletedCount > 0;
};

export const deleteMultipleStoredTrades = (tradeIds = []) => {
  if (typeof window === 'undefined' || !Array.isArray(tradeIds) || tradeIds.length === 0) return 0;
  const idsSet = new Set(tradeIds);
  let totalDeleted = 0;

  ['tradepigeon_tradelogs', 'goodtrader_tradelogs'].forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const trades = JSON.parse(raw);
        if (Array.isArray(trades)) {
          const remaining = trades.filter(t => t && !idsSet.has(t.id));
          if (remaining.length !== trades.length) {
            totalDeleted += (trades.length - remaining.length);
            saveStoredData(key, remaining);
          }
        }
      }
    } catch (_) {}
  });

  const allKeys = getStorageKeys();
  for (const key of allKeys) {
    if (!key) continue;
    if (
      key.startsWith('day_') ||
      key.startsWith('tradepigeon_session_trades') ||
      key.startsWith('goodtrader_session_trades')
    ) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          const remaining = data.filter(t => t && !idsSet.has(t.id));
          if (remaining.length !== data.length) {
            totalDeleted += (data.length - remaining.length);
            saveStoredData(key, remaining);
          }
        } else if (data && Array.isArray(data.trades)) {
          const remaining = data.trades.filter(t => t && !idsSet.has(t.id));
          if (remaining.length !== data.trades.length) {
            totalDeleted += (data.trades.length - remaining.length);
            saveStoredData(key, { ...data, trades: remaining });
          }
        }
      } catch (_) {}
    }
  }

  // 3. Delete from Cloud Firestore subcollection in batches
  if (isFirebaseConfigured && db && auth?.currentUser?.uid && tradeIds.length > 0) {
    try {
      const batch = writeBatch(db);
      tradeIds.slice(0, 450).forEach(id => {
        const tradeDocRef = doc(db, 'users', auth.currentUser.uid, 'trades', String(id));
        batch.delete(tradeDocRef);
      });
      batch.commit().catch(e => console.warn('[Firestore Batch Trade Delete Notice]:', e.message));
    } catch (_) {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tradepigeon_trade_deleted', { detail: { tradeIds } }));
  }

  return totalDeleted;
};

export const updateStoredTrade = (tradeId, fieldsToMerge) => {
  if (typeof window === 'undefined' || !tradeId || !fieldsToMerge) return false;
  let updatedCount = 0;

  ['tradepigeon_tradelogs', 'goodtrader_tradelogs'].forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const trades = JSON.parse(raw);
        if (Array.isArray(trades)) {
          let touched = false;
          const updated = trades.map(t => {
            if (t && t.id === tradeId) {
              touched = true;
              return { ...t, ...fieldsToMerge };
            }
            return t;
          });
          if (touched) {
            updatedCount++;
            saveStoredData(key, updated);
          }
        }
      }
    } catch (_) {}
  });

  const allKeys = getStorageKeys();
  for (const key of allKeys) {
    if (!key) continue;
    if (
      key.startsWith('day_') ||
      key.startsWith('tradepigeon_session_trades') ||
      key.startsWith('goodtrader_session_trades')
    ) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          let touched = false;
          const updated = data.map(t => {
            if (t && t.id === tradeId) {
              touched = true;
              return { ...t, ...fieldsToMerge };
            }
            return t;
          });
          if (touched) {
            updatedCount++;
            saveStoredData(key, updated);
          }
        } else if (data && Array.isArray(data.trades)) {
          let touched = false;
          const updatedTrades = data.trades.map(t => {
            if (t && t.id === tradeId) {
              touched = true;
              return { ...t, ...fieldsToMerge };
            }
            return t;
          });
          if (touched) {
            updatedCount++;
            saveStoredData(key, { ...data, trades: updatedTrades });
          }
        }
      } catch (_) {}
    }
  }

  // 3. Update Cloud Firestore subcollection document directly
  if (isFirebaseConfigured && db && auth?.currentUser?.uid && updatedCount > 0) {
    try {
      const tradeDocRef = doc(db, 'users', auth.currentUser.uid, 'trades', String(tradeId));
      setDoc(tradeDocRef, { ...fieldsToMerge, updatedAt: new Date().toISOString() }, { merge: true }).catch(e => console.warn('[Firestore Trade Update Notice]:', e.message));
    } catch (_) {}
  }

  return updatedCount > 0;
};

export const restoreStoredTrade = (trade) => {
  if (typeof window === 'undefined' || !trade || !trade.id) return;
  // 1. Put back into tradepigeon_tradelogs
  const existingLogs = loadStoredData('tradepigeon_tradelogs', []);
  if (!existingLogs.some(t => t && t.id === trade.id)) {
    saveStoredData('tradepigeon_tradelogs', [trade, ...existingLogs]);
  }
  // 2. Put back into its date session key if present
  if (trade.date) {
    const isoKey = `tradepigeon_session_trades_day_${trade.date}`;
    const isoTrades = loadStoredData(isoKey, []);
    if (!isoTrades.some(t => t && t.id === trade.id)) {
      saveStoredData(isoKey, [trade, ...isoTrades]);
    }
  }
  // 3. Put back into active today session keys if applicable
  const todayIso = new Date().toISOString().slice(0, 10);
  if (!trade.date || trade.date === todayIso) {
    const currentDay = loadStoredData('tradepigeon_current_day', 1);
    const dayKey = `tradepigeon_session_trades_day_${currentDay}`;
    const dayTrades = loadStoredData(dayKey, []);
    if (!dayTrades.some(t => t && t.id === trade.id)) {
      saveStoredData(dayKey, [trade, ...dayTrades]);
    }
    const sessionTrades = loadStoredData('tradepigeon_session_trades', []);
    if (!sessionTrades.some(t => t && t.id === trade.id)) {
      saveStoredData('tradepigeon_session_trades', [trade, ...sessionTrades]);
    }
  }
};

export const exportTradesCsv = async () => {
  if (typeof window === 'undefined') return { success: false, error: 'No window context' };
  const uniqueTrades = (await import('./tradeStore.js')).getTrades();

  if (uniqueTrades.length === 0) {
    return { success: false, error: 'No trades found in your journal to export.' };
  }

  const escapeCsv = (val) => `"${String(val !== undefined && val !== null ? val : '').replace(/"/g, '""')}"`;
  const headers = ['Date', 'Account', 'Symbol', 'Side', 'Contracts', 'Entry Price', 'Exit Price', 'PnL ($)', 'R Multiple', 'Setup', 'Status', 'Execution Time', 'Mistake', 'Discipline Notes'];
  const rows = uniqueTrades.map(t => [
    escapeCsv(t.date),
    escapeCsv(t.account),
    escapeCsv(t.symbol),
    escapeCsv(t.side || (String(t.type).toUpperCase().includes('SHORT') ? 'SHORT' : 'LONG')),
    escapeCsv(t.contracts || t.size),
    escapeCsv(t.entryPrice || t.entry),
    escapeCsv(t.exitPrice || t.exit),
    escapeCsv(t.pnl),
    escapeCsv(t.rMultiple || t.r),
    escapeCsv(t.setup),
    escapeCsv(t.status || t.executionType || t.type),
    escapeCsv(t.executedTime || t.time),
    escapeCsv(t.mistake),
    escapeCsv(t.notes || t.reflection || t.comment)
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
  return { success: true, count: uniqueTrades.length };
};

export const importFullBackup = (backupInput) => {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return { success: false, error: 'No browser environment' };
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

  const isAccountMatch = (acc) => {
    if (!acc) return false;
    const strAcc = String(acc).toLowerCase().trim();
    const strTarget = String(accountIdentifier).toLowerCase().trim();
    return strAcc === strTarget || strAcc.includes(strTarget) || strTarget.includes(strAcc);
  };

  // 1. Wipe from tradelogs
  ['tradepigeon_tradelogs', 'goodtrader_tradelogs'].forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const trades = JSON.parse(raw);
        if (Array.isArray(trades)) {
          const remaining = trades.filter(t => !isAccountMatch(t?.account));
          if (remaining.length !== trades.length) {
            totalWiped += (trades.length - remaining.length);
            saveStoredData(key, remaining);
          }
        }
      }
    } catch (_) {}
  });

  // 2. Wipe from session day keys and calendar day keys
  const allKeys = getStorageKeys();
  for (const key of allKeys) {
    if (
      key &&
      (key.startsWith('day_') ||
       key.startsWith('tradepigeon_session_trades') ||
       key.startsWith('goodtrader_session_trades'))
    ) {
      const { canonicalKey, legacyKey } = resolveKeyAliases(key);
      if (processedKeys.has(canonicalKey)) continue;
      processedKeys.add(canonicalKey);

      try {
        const raw = localStorage.getItem(canonicalKey) || localStorage.getItem(legacyKey);
        if (!raw) continue;
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          const remaining = data.filter(t => !isAccountMatch(t?.account));
          const removed = data.length - remaining.length;
          if (removed > 0) {
            totalWiped += removed;
            saveStoredData(canonicalKey, remaining);
          }
        } else if (data && Array.isArray(data.trades)) {
          const remaining = data.trades.filter(t => !isAccountMatch(t?.account));
          const removed = data.trades.length - remaining.length;
          if (removed > 0) {
            totalWiped += removed;
            saveStoredData(canonicalKey, { ...data, trades: remaining });
          }
        }
      } catch (_) {}
    }
  }

  return totalWiped;
};

export { STORAGE_KEYS };
