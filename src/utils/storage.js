// TradePigeon LocalStorage Persistence Manager

const STORAGE_KEYS = {
  USER_STATS: 'goodtrader_user_stats',
  CALENDAR_DATA: 'goodtrader_calendar_data',
  SETUPS: 'goodtrader_setups',
  QUESTS: 'goodtrader_quests',
  SHOP_ITEMS: 'goodtrader_shop_items',
  ONBOARDING_COMPLETED: 'goodtrader_onboarding_completed'
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

export { STORAGE_KEYS };
