// The single source of truth for trades.
// - One map { [id]: trade } in localStorage, mirrored to Firestore users/{uid}/trades/{id}.
// - Deletes leave a tombstone (locally and in the cloud) so they never come back from another device or a re-sync.
// - IDs are deterministic, so re-importing the same file or re-syncing the same fills adds nothing.
import { db, isFirebaseConfigured } from '../config/firebase.js';
import { doc, setDoc, onSnapshot, collection, writeBatch } from 'firebase/firestore';
import { normalizeTrade } from './storage.js';

const TRADES_KEY = 'tradepigeon_trades_v2';
const TOMBSTONES_KEY = 'tradepigeon_trade_tombstones';
const IMPORTS_KEY = 'tradepigeon_import_history';
export const TRADES_CHANGED_EVENT = 'tradepigeon-trades-changed';

// ---------- identity ----------

// FNV-1a 32-bit, twice with different seeds -> 16 hex chars. Deterministic across browsers/devices.
function hash(str) {
  let h1 = 0x811c9dc5, h2 = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x5bd1e995);
  }
  return ((h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0'));
}

/**
 * Stable trade id. Prefer the broker's own ids (fill/trade ids) scoped to the account;
 * otherwise hash the trade's content so the same trade always gets the same id.
 */
export function makeTradeId({ account = '', brokerTradeId = '', symbol = '', side = '', qty = '', entryTime = '', exitTime = '', entryPrice = '', exitPrice = '' }) {
  const acc = String(account).trim().toLowerCase();
  if (brokerTradeId) return `T-${hash(`${acc}|bid|${brokerTradeId}`)}`;
  return `T-${hash([acc, String(symbol).toUpperCase(), side, qty, entryTime, exitTime, entryPrice, exitPrice].join('|'))}`;
}

// ---------- CME session date ----------

// Wall-clock parts of a UTC instant in America/New_York.
function etParts(ms) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false, weekday: 'short' });
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, hour: +p.hour % 24, weekday: p.weekday };
}

/**
 * CME Globex trade date for an instant: trading after 18:00 ET belongs to the next day's session;
 * Friday-evening/Saturday/Sunday-before-18:00 never happen in practice, but roll Sat/Sun forward to Monday.
 */
export function sessionDateFor(ms) {
  if (!Number.isFinite(ms)) return null;
  const { y, m, d, hour } = etParts(ms);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (hour >= 18) date.setUTCDate(date.getUTCDate() + 1);
  const dow = date.getUTCDay();
  if (dow === 6) date.setUTCDate(date.getUTCDate() + 2);
  if (dow === 0) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** Current CME session date (what "today" means in a futures journal). */
export const todaySessionDate = () => sessionDateFor(Date.now());

// ---------- local persistence ----------

const readJson = (key, fallback) => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
};
const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const readMap = () => readJson(TRADES_KEY, {});
const emit = () => typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent(TRADES_CHANGED_EVENT));

export function getTrades() {
  return Object.values(readMap())
    .map(normalizeTrade)
    .sort((a, b) => (b.exitTimeMs || b.entryTimeMs || 0) - (a.exitTimeMs || a.entryTimeMs || 0) || String(b.date).localeCompare(String(a.date)));
}

export const getTradesForDate = (isoDate) => getTrades().filter(t => t.date === isoDate);
export const getTradesForAccount = (account) => getTrades().filter(t => t.account === account);
export const onTradesChange = (cb) => {
  window.addEventListener(TRADES_CHANGED_EVENT, cb);
  return () => window.removeEventListener(TRADES_CHANGED_EVENT, cb);
};

/**
 * Adds trades. Existing ids and deleted (tombstoned) ids are skipped, never overwritten,
 * so user edits survive re-imports and deleted trades stay deleted.
 * @returns {{ added: object[], duplicates: number, previouslyDeleted: number }}
 */
export function addTrades(trades, { source = 'manual', importId = null } = {}) {
  const map = readMap();
  const tombs = readJson(TOMBSTONES_KEY, {});
  const now = Date.now();
  const added = [];
  let duplicates = 0, previouslyDeleted = 0;
  for (const t of trades) {
    if (!t?.id) throw new Error('addTrades: every trade needs an id (use makeTradeId)');
    if (tombs[t.id]) { previouslyDeleted++; continue; }
    if (map[t.id]) { duplicates++; continue; }
    const stored = { ...t, source, importId, createdAt: now, updatedAt: now };
    map[t.id] = stored;
    added.push(stored);
  }
  if (added.length) {
    writeJson(TRADES_KEY, map);
    cloudWrite(added);
    emit();
  }
  return { added, duplicates, previouslyDeleted };
}

export function updateTrade(id, fields) {
  const map = readMap();
  if (!map[id]) return false;
  map[id] = { ...map[id], ...fields, id, updatedAt: Date.now() };
  writeJson(TRADES_KEY, map);
  cloudWrite([map[id]]);
  emit();
  return true;
}

export function deleteTrades(ids) {
  const map = readMap();
  const tombs = readJson(TOMBSTONES_KEY, {});
  const now = Date.now();
  const removed = [];
  for (const id of ids) {
    if (map[id]) removed.push(map[id]);
    delete map[id];
    tombs[id] = now;
  }
  writeJson(TRADES_KEY, map);
  writeJson(TOMBSTONES_KEY, tombs);
  cloudWrite(ids.map(id => ({ id, deleted: true, updatedAt: now })));
  emit();
  return removed; // keep for "Undo"
}

/** Undo for a delete: brings the exact trades back and clears their tombstones. */
export function restoreTrades(trades) {
  const map = readMap();
  const tombs = readJson(TOMBSTONES_KEY, {});
  const now = Date.now();
  const restored = trades.filter(t => t?.id).map(t => ({ ...t, deleted: undefined, updatedAt: now }));
  for (const t of restored) { map[t.id] = t; delete tombs[t.id]; }
  writeJson(TRADES_KEY, map);
  writeJson(TOMBSTONES_KEY, tombs);
  cloudWrite(restored);
  emit();
}

/**
 * Makes the stored trades for one session date equal `list` (for screens that edit a day's list as a whole).
 * New trades are added, changed ones updated, and trades of that date missing from the list are deleted (tombstoned).
 */
export function setDayTrades(isoDate, list) {
  const map = readMap();
  const byId = new Map(list.filter(t => t?.id).map(t => [t.id, t]));
  const toAdd = [], toUpdate = [], toDelete = [];
  for (const [id, t] of byId) {
    const cur = map[id];
    if (!cur) toAdd.push({ date: isoDate, ...t });
    else {
      // Screens hand back normalized trades; compare against the normalized stored copy, ignoring timestamps.
      const curN = normalizeTrade(cur);
      if (Object.keys(t).some(k => k !== 'updatedAt' && k !== 'createdAt' && JSON.stringify(t[k]) !== JSON.stringify(curN[k]))) toUpdate.push(t);
    }
  }
  for (const t of Object.values(map)) if (t.date === isoDate && !byId.has(t.id)) toDelete.push(t.id);
  if (toAdd.length) addTrades(toAdd, { source: 'manual' });
  toUpdate.forEach(t => updateTrade(t.id, t));
  if (toDelete.length) deleteTrades(toDelete);
  return { added: toAdd.length, updated: toUpdate.length, deleted: toDelete.length };
}

// ---------- import history ----------

export const getImportHistory = () => readJson(IMPORTS_KEY, []);

export function recordImport({ importId, fileName, account, format, added, duplicates, previouslyDeleted, rejected }) {
  const list = getImportHistory();
  list.unshift({ importId, fileName, account, format, added, duplicates, previouslyDeleted, rejected, at: Date.now(), undone: false });
  writeJson(IMPORTS_KEY, list.slice(0, 200));
}

/** Removes every trade that came from one import. */
export function undoImport(importId) {
  const ids = Object.values(readMap()).filter(t => t.importId === importId).map(t => t.id);
  deleteTrades(ids);
  // An undone import may be re-imported later, so forget its tombstones.
  const tombs = readJson(TOMBSTONES_KEY, {});
  ids.forEach(id => delete tombs[id]);
  writeJson(TOMBSTONES_KEY, tombs);
  writeJson(IMPORTS_KEY, getImportHistory().map(i => i.importId === importId ? { ...i, undone: true } : i));
  emit();
  return ids.length;
}

// ---------- cloud mirror ----------

let cloudUid = null;
let unsubscribe = null;

function cloudWrite(docs) {
  if (!cloudUid || !db || !docs.length) return;
  const uid = cloudUid;
  (async () => {
    for (let i = 0; i < docs.length; i += 400) {
      const batch = writeBatch(db);
      docs.slice(i, i + 400).forEach(d => {
        const clean = JSON.parse(JSON.stringify(d)); // drop undefined (Firestore rejects it)
        batch.set(doc(db, 'users', uid, 'trades', d.id), clean, { merge: !d.deleted });
      });
      await batch.commit();
    }
  })().catch(err => console.warn('[TradeStore cloud write]', err.message));
}

/** Two-way sync with Firestore. Newest updatedAt wins per trade; tombstones always delete. */
export function initTradeCloudSync(uid) {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  cloudUid = uid || null;
  if (!uid || !isFirebaseConfigured || !db) return;

  let firstSnapshot = true;
  unsubscribe = onSnapshot(collection(db, 'users', uid, 'trades'), (snap) => {
    const map = readMap();
    const tombs = readJson(TOMBSTONES_KEY, {});
    const cloudIds = new Set();
    let changed = false;

    // A doc removed outright (e.g. in the console) after we've synced counts as a delete.
    if (!firstSnapshot) {
      snap.docChanges().filter(c => c.type === 'removed').forEach(c => {
        if (map[c.doc.id]) { delete map[c.doc.id]; tombs[c.doc.id] = Date.now(); changed = true; }
      });
    }

    snap.docs.forEach(d => {
      const remote = d.data();
      const id = d.id;
      cloudIds.add(id);
      if (remote.deleted) {
        if (map[id]) { delete map[id]; changed = true; }
        if (!tombs[id]) { tombs[id] = remote.updatedAt || Date.now(); changed = true; }
        return;
      }
      if (tombs[id] && tombs[id] >= (remote.updatedAt || 0)) { cloudWrite([{ id, deleted: true, updatedAt: tombs[id] }]); return; }
      const local = map[id];
      if (!local || (remote.updatedAt || 0) > (local.updatedAt || 0)) {
        map[id] = { ...remote, id };
        changed = true;
      }
    });

    // First connection: push local-only trades and tombstones the cloud hasn't seen (offline work, migration).
    if (firstSnapshot) {
      firstSnapshot = false;
      const missing = Object.values(map).filter(t => !cloudIds.has(t.id));
      const missingTombs = Object.entries(tombs).filter(([id]) => !cloudIds.has(id)).map(([id, at]) => ({ id, deleted: true, updatedAt: at }));
      cloudWrite([...missing, ...missingTombs]);
    }

    if (changed) {
      writeJson(TRADES_KEY, map);
      writeJson(TOMBSTONES_KEY, tombs);
      emit();
    }
  }, err => console.warn('[TradeStore cloud listener]', err.message));
}

// ---------- one-time migration from the old scattered keys ----------

const MIGRATED_KEY = 'tradepigeon_trades_v2_migrated';

export function migrateLegacyTrades(collectLegacy) {
  if (readJson(MIGRATED_KEY, false)) return 0;
  const legacy = collectLegacy();
  const map = readMap();
  let count = 0;
  for (const t of legacy) {
    const id = t.id || makeTradeId({ account: t.account, symbol: t.symbol, side: t.side, qty: t.contracts, entryTime: `${t.date} ${t.time || ''}`, exitTime: '', entryPrice: t.entry, exitPrice: t.exit });
    if (!map[id]) { map[id] = { ...t, id, source: t.source || 'legacy', updatedAt: Date.now() }; count++; }
  }
  writeJson(TRADES_KEY, map);
  writeJson(MIGRATED_KEY, true);
  if (count) emit();
  return count;
}
