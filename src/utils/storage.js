// GoodTrader 2.0 LocalStorage Persistence Manager

const STORAGE_KEYS = {
  USER_STATS: 'goodtrader_user_stats',
  CALENDAR_DATA: 'goodtrader_calendar_data',
  SETUPS: 'goodtrader_setups',
  QUESTS: 'goodtrader_quests',
  SHOP_ITEMS: 'goodtrader_shop_items',
  ONBOARDING_COMPLETED: 'goodtrader_onboarding_completed'
};

// Initial Default State
export const DEFAULT_USER_STATS = {
  streakDays: 14,
  disciplinePoints: 3400,
  hearts: 5,
  maxHearts: 5,
  level: 4,
  levelTitle: 'Disciplined Trader',
  username: 'ApexTrader_99',
  joinedDate: 'Aug 2026',
  tradesLogged: 42,
  overallWinRate: '68%',
  totalProfit: '+$8,750.00'
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
    console.warn(`[GoodTrader Storage] Failed to load ${key}:`, err);
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
    console.warn(`[GoodTrader Storage] Failed to save ${key}:`, err);
  }
};

export const subscribeToStorageUpdate = (callback) => {
  if (typeof window === 'undefined') return () => {};
  const handler = (event) => {
    if (callback) callback(event.detail);
  };
  window.addEventListener('goodtrader-storage-update', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('goodtrader-storage-update', handler);
    window.removeEventListener('storage', handler);
  };
};

export const sanitizeAccountBasketData = (accounts, baskets) => {
  if (!Array.isArray(accounts) || accounts.length === 0) return accounts;
  const validBasketNames = new Set((baskets || []).map(b => b.name));

  return accounts.map(acc => {
    // If account has an invalid, orphaned, or legacy basket name that doesn't exist in current baskets
    if (!acc.basketName || !validBasketNames.has(acc.basketName)) {
      const defaultBasket = (baskets && baskets[0] && baskets[0].name) ? baskets[0].name : 'Standard Risk (1.0%)';
      return { ...acc, basketName: defaultBasket };
    }
    return acc;
  });
};

export { STORAGE_KEYS };
