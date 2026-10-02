// Strict broker file import. Every row either becomes an exact trade or is rejected with a reason.
// Nothing is guessed: no default symbol, side, size, price or date.
import { parseCsvLine, detectDelimiter } from './tradeParser.js';
import { parseFinancialNumber } from './financialMath.js';
import { getInstrumentMultiplier, formatDuration } from './fillPairingEngine.js';
import { makeTradeId, sessionDateFor } from './tradeStore.js';

// ---------- time ----------

// Offset (ms) of a timezone at a UTC instant.
function tzOffsetMs(utcMs, timeZone) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).formatToParts(new Date(utcMs)).map(x => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - utcMs;
}

/** Wall-clock time in `timeZone` -> UTC ms (DST-correct). */
export function wallTimeToUtc(y, mo, d, h, mi, s, timeZone) {
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  let utc = guess - tzOffsetMs(guess, timeZone);
  utc = guess - tzOffsetMs(utc, timeZone); // second pass settles DST boundaries
  return utc;
}

const DATE_TIME = /^\s*(\d{1,4})[/.\-](\d{1,2})[/.\-](\d{1,4})[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?\s*(AM|PM)?\s*$/i;

/** Decide day/month order for a whole file from all its timestamps. */
export function detectDateOrder(values) {
  for (const v of values) {
    const m = DATE_TIME.exec(v || '');
    if (!m || m[1].length === 4) continue;
    if (+m[1] > 12) return 'DMY';
    if (+m[2] > 12) return 'MDY';
  }
  return 'MDY';
}

/** Parses a broker timestamp in the file's timezone. Returns UTC ms or null. */
export function parseTimestamp(value, timeZone, order = 'MDY') {
  const m = DATE_TIME.exec(value || '');
  if (!m) return null;
  let y, mo, d;
  if (m[1].length === 4) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else if (order === 'DMY') { d = +m[1]; mo = +m[2]; y = +m[3]; }
  else { mo = +m[1]; d = +m[2]; y = +m[3]; }
  if (y < 100) y += 2000;
  let h = +m[4];
  const ap = (m[7] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23) return null;
  return wallTimeToUtc(y, mo, d, h, +m[5], +(m[6] || 0), timeZone);
}

const etClock = (ms) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ms));

// ---------- csv ----------

function readCsv(text) {
  const lines = String(text || '').replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const delim = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delim).map(h => h.trim().toLowerCase());
  const rows = lines.slice(1).map((line, i) => {
    const cells = parseCsvLine(line, delim);
    const row = {};
    headers.forEach((h, j) => { row[h] = (cells[j] ?? '').trim(); });
    return { row, line: i + 2 };
  });
  return { headers, rows };
}

const has = (headers, cols) => cols.every(c => headers.includes(c));
const num = (v) => {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  const n = parseFinancialNumber(String(v), NaN);
  return Number.isFinite(n) ? n : null;
};

/** "MNQ 12-26" / "MNQZ6" / "MNQZ2026" -> "MNQ" */
export function rootSymbol(symbol) {
  const s = String(symbol || '').toUpperCase().trim().split(/\s+/)[0];
  return s.replace(/[FGHJKMNQUVXZ]\d{1,4}$/, '') || s;
}

function buildTrade({ account, symbol, side, qty, entryMs, exitMs, entryPrice, exitPrice, pnl, fees, pnlIsGross, brokerTradeId }) {
  const net = Math.round((pnl - (fees || 0)) * 100) / 100;
  return {
    id: makeTradeId({ account, brokerTradeId, symbol, side, qty, entryTime: entryMs, exitTime: exitMs, entryPrice, exitPrice }),
    account,
    symbol,
    root: rootSymbol(symbol),
    side,
    contracts: qty,
    size: `${qty} ${qty === 1 ? 'contract' : 'contracts'}`,
    entryPriceNum: entryPrice,
    exitPriceNum: exitPrice,
    entry: String(entryPrice),
    exit: String(exitPrice),
    entryTimeMs: entryMs,
    exitTimeMs: exitMs,
    date: sessionDateFor(exitMs),
    time: `${etClock(entryMs)} ET`,
    holdDuration: formatDuration(entryMs, exitMs),
    pnlNum: net,
    feesNum: fees || 0,
    pnlIsGross: Boolean(pnlIsGross),
    setup: '',
    notes: ''
  };
}

// ---------- formats ----------

const FORMATS = [
  {
    id: 'tradovate',
    name: 'Tradovate (Performance report)',
    required: ['symbol', 'qty', 'buyprice', 'sellprice', 'pnl', 'boughttimestamp', 'soldtimestamp'],
    parse(r, ctx) {
      const qty = num(r.qty), buy = num(r.buyprice), sell = num(r.sellprice), pnl = num(r.pnl);
      const bought = parseTimestamp(r.boughttimestamp, ctx.timeZone, ctx.order);
      const sold = parseTimestamp(r.soldtimestamp, ctx.timeZone, ctx.order);
      if (!r.symbol) return 'missing symbol';
      if (!(qty > 0)) return 'missing or invalid qty';
      if (buy === null || sell === null) return 'missing buy/sell price';
      if (pnl === null) return 'missing pnl';
      if (bought === null || sold === null) return 'unreadable timestamp';
      const isLong = bought <= sold; // bought first = long
      return buildTrade({
        account: ctx.account, symbol: r.symbol.toUpperCase(), side: isLong ? 'BUY' : 'SELL', qty,
        entryMs: isLong ? bought : sold, exitMs: isLong ? sold : bought,
        entryPrice: isLong ? buy : sell, exitPrice: isLong ? sell : buy,
        pnl, fees: 0, pnlIsGross: true, // Tradovate's Performance P&L excludes commissions
        brokerTradeId: r.buyfillid && r.sellfillid ? `${r.buyfillid}:${r.sellfillid}` : ''
      });
    },
    timestamps: (r) => [r.boughttimestamp, r.soldtimestamp]
  },
  {
    id: 'ninjatrader',
    name: 'NinjaTrader 8 (Trades tab)',
    required: ['instrument', 'market pos.', 'qty', 'entry price', 'exit price', 'entry time', 'exit time', 'profit'],
    parse(r, ctx) {
      const qty = num(r.qty), entry = num(r['entry price']), exit = num(r['exit price']), profit = num(r.profit);
      const entryMs = parseTimestamp(r['entry time'], ctx.timeZone, ctx.order);
      const exitMs = parseTimestamp(r['exit time'], ctx.timeZone, ctx.order);
      const pos = String(r['market pos.'] || '').toLowerCase();
      if (!r.instrument) return 'missing instrument';
      if (pos !== 'long' && pos !== 'short') return 'missing Market pos. (Long/Short)';
      if (!(qty > 0)) return 'missing or invalid qty';
      if (entry === null || exit === null) return 'missing entry/exit price';
      if (profit === null) return 'missing profit';
      if (entryMs === null || exitMs === null) return 'unreadable time';
      // NT8 "Profit" is before commission; "Commission" is the fee.
      const fees = Math.abs(num(r.commission) || 0);
      return buildTrade({
        account: ctx.account, symbol: r.instrument.toUpperCase(), side: pos === 'long' ? 'BUY' : 'SELL', qty,
        entryMs, exitMs, entryPrice: entry, exitPrice: exit, pnl: profit, fees,
        brokerTradeId: r['trade number'] ? `${r['trade number']}#${r['entry time']}` : ''
      });
    },
    timestamps: (r) => [r['entry time'], r['exit time']]
  },
  {
    id: 'template',
    name: 'TradePigeon template',
    required: ['symbol', 'side', 'qty', 'entry_time', 'exit_time', 'entry_price', 'exit_price'],
    parse(r, ctx) {
      const qty = num(r.qty), entry = num(r.entry_price), exit = num(r.exit_price);
      const entryMs = parseTimestamp(r.entry_time, ctx.timeZone, ctx.order);
      const exitMs = parseTimestamp(r.exit_time, ctx.timeZone, ctx.order);
      const sideRaw = String(r.side || '').toLowerCase();
      const side = ['long', 'buy'].includes(sideRaw) ? 'BUY' : ['short', 'sell'].includes(sideRaw) ? 'SELL' : null;
      if (!r.symbol) return 'missing symbol';
      if (!side) return 'side must be long/short';
      if (!(qty > 0)) return 'missing or invalid qty';
      if (entry === null || exit === null) return 'missing entry/exit price';
      if (entryMs === null || exitMs === null) return 'unreadable time';
      let pnl = num(r.pnl);
      if (pnl === null) {
        const mult = getInstrumentMultiplier(rootSymbol(r.symbol));
        if (!mult || mult === 1) return 'no pnl and unknown contract size';
        pnl = (side === 'BUY' ? exit - entry : entry - exit) * qty * mult;
      }
      return buildTrade({
        account: ctx.account, symbol: r.symbol.toUpperCase(), side, qty,
        entryMs, exitMs, entryPrice: entry, exitPrice: exit, pnl, fees: Math.abs(num(r.fees) || 0)
      });
    },
    timestamps: (r) => [r.entry_time, r.exit_time]
  }
];

export const SUPPORTED_FORMATS = FORMATS.map(f => ({ id: f.id, name: f.name, required: f.required }));
export const TEMPLATE_CSV = 'account,symbol,side,qty,entry_time,exit_time,entry_price,exit_price,pnl,fees\nAPEX-12345,MNQZ6,long,2,2026-09-22 09:35:00,2026-09-22 09:41:30,20000.25,20010.75,42.00,1.24\n';

/**
 * @param {string} text  CSV content
 * @param {{ account: string, timeZone: string }} opts  account the file belongs to; timezone its times are in
 * @returns {{ format: string|null, formatName: string|null, trades: object[], rejected: {line:number, reason:string}[], error?: string }}
 */
export function importTradesFile(text, { account, timeZone }) {
  const { headers, rows } = readCsv(text);
  if (!headers.length) return { format: null, formatName: null, trades: [], rejected: [], error: 'The file is empty.' };
  const fmt = FORMATS.find(f => has(headers, f.required));
  if (!fmt) {
    return {
      format: null, formatName: null, trades: [], rejected: [],
      error: 'We don\'t recognise this file. Supported: Tradovate Performance export, NinjaTrader 8 Trades export, or the TradePigeon template.'
    };
  }
  // Trades always belong to the account the user picked; a file mixing accounts would silently merge them.
  const fileAccounts = [...new Set(rows.map(({ row }) => (row.account || '').trim()).filter(Boolean))];
  if (fileAccounts.length > 1) {
    return { format: fmt.id, formatName: fmt.name, trades: [], rejected: [], error: `This file has trades from ${fileAccounts.length} accounts (${fileAccounts.slice(0, 3).join(', ')}). Export one account at a time.` };
  }
  const order = detectDateOrder(rows.flatMap(({ row }) => fmt.timestamps(row)));
  const ctx = { account, timeZone, order };
  const trades = [], rejected = [], seen = new Set();
  for (const { row, line } of rows) {
    const out = fmt.parse(row, ctx);
    if (typeof out === 'string') { rejected.push({ line, reason: out }); continue; }
    if (seen.has(out.id)) { rejected.push({ line, reason: 'duplicate row in this file' }); continue; }
    seen.add(out.id);
    trades.push(out);
  }
  return { format: fmt.id, formatName: fmt.name, trades, rejected };
}

export const TRIAL_IMPORT_DAYS = 30;

/** During the free trial only the last 30 days import (keeps trial storage small; full history is Pro). */
export function limitToRecent(trades, isTrial, now = Date.now()) {
  if (!isTrial) return { trades, olderSkipped: 0 };
  const cutoff = now - TRIAL_IMPORT_DAYS * 86400000;
  const kept = trades.filter(t => (t.exitTimeMs || t.entryTimeMs || 0) >= cutoff);
  return { trades: kept, olderSkipped: trades.length - kept.length };
}
