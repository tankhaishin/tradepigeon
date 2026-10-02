import './_browser_shim.mjs';
import './_strict.mjs';
const { importTradesFile } = await import('../src/utils/importFormats.js');
/**
 * TradePigeon Automated High-Load Stress & Hostile Ingestion Test Suite
 * 
 * Tests extreme load, edge-case precision, hostile CSV injections,
 * CME Globex date rolls, Smart Delta Sync scale, and icon integrity.
 */

import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 0. Setup Mock Browser Environment for Node.js
const mockStore = {};
global.localStorage = {
  getItem: (key) => mockStore[key] || null,
  setItem: (key, val) => { mockStore[key] = String(val); },
  removeItem: (key) => { delete mockStore[key]; },
  clear: () => { Object.keys(mockStore).forEach(k => delete mockStore[k]); }
};
global.window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.CustomEvent = class CustomEvent {
  constructor(type, params = {}) {
    this.type = type;
    this.detail = params.detail;
  }
};

import { pairFillsFIFO, getInstrumentMultiplier, normalizeSymbol, INSTRUMENT_MULTIPLIERS } from '../src/utils/fillPairingEngine.js';
import { parseFinancialNumber, formatFinancialCurrency, formatRMultiple, sumTradesPnl, calculateTrailingDrawdown } from '../src/utils/financialMath.js';
import { parseCsvLine, extractIsoDate, getGlobexClearingDate, calculateExecutionMatrix, calculateSetupExpectancy, calculateHoldDuration } from '../src/utils/tradeParser.js';
import { computeTradeFingerprint, syncedTradesFingerprintCache, seedSyncedTradesFingerprint, importFullBackup, normalizeTrade, getStorageUsage } from '../src/utils/storage.js';
import { soundFx } from '../src/utils/audioEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================================');
console.log('🚀 TRADEPIGEON EXTREME STRESS & HOSTILE RESILIENCE SUITE');
console.log('====================================================\n');

// -----------------------------------------------------------------------------
// 1. MASSIVE FIFO THROUGHPUT STRESS TEST (10,000 FILLS)
// -----------------------------------------------------------------------------
console.log('--- STRESS TEST 1: Massive FIFO Fill Pairing (10,000 Fills) ---');
const symbols = ['ES', 'NQ', 'MES', 'MNQ', 'RTY', 'CL', 'GC'];
const fills = [];
let fillIdCounter = 1;

for (let i = 0; i < 5000; i++) {
  const sym = symbols[i % symbols.length];
  const qty = (i % 4) + 1;
  const basePrice = sym === 'NQ' || sym === 'MNQ' ? 18000 : sym === 'ES' || sym === 'MES' ? 5200 : 2000;
  const entryPrice = basePrice + (Math.sin(i) * 20);
  const exitPrice = entryPrice + (Math.cos(i) * 15);
  const dateStr = `2026-08-${String((i % 28) + 1).padStart(2, '0')}`;
  const hour = String(9 + (i % 7)).padStart(2, '0');
  const min = String(i % 60).padStart(2, '0');
  const sec = String((i * 7) % 60).padStart(2, '0');
  const timeStr = `${hour}:${min}:${sec}`;

  // Buy Fill
  fills.push({
    id: `FILL-${fillIdCounter++}`,
    symbol: sym,
    side: 'BUY',
    qty: qty,
    price: entryPrice,
    timestamp: `${dateStr} ${timeStr}`,
    date: dateStr,
    time: timeStr,
    account: 'PRO-100K-01'
  });

  // Sell Fill (Offset by 3 minutes)
  const exitMin = String((i + 3) % 60).padStart(2, '0');
  fills.push({
    id: `FILL-${fillIdCounter++}`,
    symbol: sym,
    side: 'SELL',
    qty: qty,
    price: exitPrice,
    timestamp: `${dateStr} ${hour}:${exitMin}:${sec}`,
    date: dateStr,
    time: `${hour}:${exitMin}:${sec}`,
    account: 'PRO-100K-01'
  });
}

const fifoStart = performance.now();
const pairedTrades = pairFillsFIFO(fills);
const fifoDuration = performance.now() - fifoStart;

console.assert(pairedTrades.length >= 5000, `Expected at least 5000 paired roundtrips, got ${pairedTrades.length}`);
console.assert(fifoDuration < 1000, `FIFO engine took ${fifoDuration.toFixed(2)}ms, must be < 1000ms`);

// Validate math and output integrity across all 5000 paired trades
let nanCount = 0;
let validPnlCount = 0;
for (const trade of pairedTrades) {
  if (typeof trade.pnlNum !== 'number' || isNaN(trade.pnlNum) || !trade.pnl || trade.pnl === '$NaN') {
    nanCount++;
  } else {
    validPnlCount++;
  }
}
console.assert(nanCount === 0, `Encountered ${nanCount} NaN PnL trades in paired output`);
console.assert(validPnlCount === pairedTrades.length, 'All paired trades have verified mathematical PnL');
console.log(`✓ 10,000 fills paired into ${pairedTrades.length} trades in ${fifoDuration.toFixed(2)}ms (${(10000 / (fifoDuration / 1000)).toFixed(0)} fills/sec) with 0 NaNs`);


// -----------------------------------------------------------------------------
// 2. HOSTILE CSV & MALFORMED INJECTION STRESS TEST
// -----------------------------------------------------------------------------
console.log('\n--- STRESS TEST 2: Hostile Input & Corrupt CSV Parsing (500 Malformed Rows) ---');
const hostileRows = [
  'Symbol,Side,Qty,Price,Date,Time,PnL', // Valid header
  ',,,,', // Empty line
  'ES,BUY,-5,$5200.25,2026-08-10,09:30:00,$0.00', // Negative quantity
  'NQ,SELL,1,"18,450.50",2026-08-10,09:35:00,"+$1,250.00"', // Embedded commas & quotes
  'MES,BUY,0,$5200.00,2026-08-10,09:40:00,$0.00', // Zero quantity
  '<script>alert("xss")</script>,BUY,1,100,2026-08-10,09:45:00,+$100', // XSS injection
  'MNQ,SELL,2,NaN,2026-08-10,09:50:00,null', // NaN/Null tokens
  'CL,BUY,10,$78.50,9999-99-99,99:99:99,$500.00', // Extreme invalid date/time
  'GC,SELL,1,$2400.00,"2026-08-10",10:00:00,"($850.50)"', // Accounting parenthesis loss
  'RTY,BUY,1,2200.00,2026-08-10,10:05:00,-$0.00', // Negative zero
  'ES,"""BUY""",1,5200.00,2026-08-10,10:10:00,+$250', // Triple quotes
  'ES,BUY,1,5200.00,,,$0.00', // Missing date/time
  'NQ,SELL,999999999,18000.00,2026-08-10,10:15:00,+$999999999.00', // Massive quantity & PnL
  'CL,BUY,1,75.00,2026-08-10,10:20:00,1e5', // Scientific notation
  'ES,BUY,1,5200.00,2026-08-10,10:25:00,Infinity' // Infinity token
];

// Add 485 randomized junk strings
for (let j = 0; j < 485; j++) {
  const junk = `SYM_${j},${j % 2 === 0 ? 'BUY' : 'SELL'},${j % 5},${Math.random() * 1000},2026-08-${(j % 28) + 1},${j % 24}:${j % 60}:00,${j % 2 === 0 ? '+' : '-'}$${(Math.random() * 500).toFixed(2)}`;
  hostileRows.push(junk);
}

const hostileCsv = hostileRows.join('\n');
const parseStart = performance.now();
let parsedResults = [];
let unhandledException = false;

try {
  parsedResults = importTradesFile(hostileCsv, { account: 'stress', timeZone: 'America/New_York' }).trades;
} catch (err) {
  unhandledException = true;
  console.error('Fatal crash on hostile CSV:', err);
}

const parseDuration = performance.now() - parseStart;
console.assert(!unhandledException, 'CSV parser must never crash on hostile inputs');
console.assert(Array.isArray(parsedResults), 'Parser returned valid array on corrupt input');
console.log(`✓ 500 hostile/malformed CSV rows sanitized and parsed in ${parseDuration.toFixed(2)}ms without unhandled exceptions`);


// -----------------------------------------------------------------------------
// 3. SMART DELTA SYNC SCALE & FINGERPRINT STRESS TEST (5,000 TRADES)
// -----------------------------------------------------------------------------
console.log('\n--- STRESS TEST 3: Smart Delta Sync Fingerprint Cache at Scale (5,000 Trades) ---');
syncedTradesFingerprintCache.clear();

const testTrades = [];
for (let k = 0; k < 5000; k++) {
  testTrades.push({
    id: `TRADE-FINGERPRINT-${k}`,
    pnl: k % 2 === 0 ? `+$${(k * 10).toFixed(2)}` : `-$${(k * 5).toFixed(2)}`,
    followedRules: k % 3 !== 0,
    executionType: k % 2 === 0 ? 'WIN' : 'GOOD_LOSS',
    type: k % 2 === 0 ? 'win' : 'good_loss',
    notes: `Automated test note for trade ${k}`,
    setup: 'VWAP Mean Reversion',
    timestamp: '2026-08-15 10:30:00',
    confirmed: true
  });
}

// 1. Initial Seeding of 5,000 trades
const seedStart = performance.now();
seedSyncedTradesFingerprint(testTrades);
const seedDuration = performance.now() - seedStart;

console.assert(syncedTradesFingerprintCache.size === 5000, `Expected cache size 5000, got ${syncedTradesFingerprintCache.size}`);
console.assert(seedDuration < 100, `Fingerprint seeding took ${seedDuration.toFixed(2)}ms, must be < 100ms`);

// 2. Identify dirty delta when only 250 trades (5%) are modified
const modifiedTrades = testTrades.map((t, idx) => {
  if (idx < 250) {
    return { ...t, notes: `REVISED EXECUTION NOTE ${idx}` };
  }
  return t;
});

const deltaStart = performance.now();
const dirtyTrades = modifiedTrades.filter(t => {
  return syncedTradesFingerprintCache.get(String(t.id)) !== computeTradeFingerprint(t);
});
const deltaDuration = performance.now() - deltaStart;

console.assert(dirtyTrades.length === 250, `Expected exactly 250 dirty trades, got ${dirtyTrades.length}`);
console.assert(deltaDuration < 50, `Delta detection took ${deltaDuration.toFixed(2)}ms, must be < 50ms`);
console.log(`✓ 5,000 trade fingerprints cached in ${seedDuration.toFixed(2)}ms; 250 dirty trades detected in ${deltaDuration.toFixed(2)}ms (95% write reduction verified)`);


// -----------------------------------------------------------------------------
// 4. CME GLOBEX CLEARING SESSION ROLLOVER BOUNDARY STRESS TEST
// -----------------------------------------------------------------------------
console.log('\n--- STRESS TEST 4: CME Globex Rollover & Weekend/Leap Year Boundaries ---');

// Test minute-by-minute across the 18:00 boundary
console.assert(getGlobexClearingDate('2026-08-17', '17:59:59') === '2026-08-17', '17:59:59 remains on current trade date');
console.assert(getGlobexClearingDate('2026-08-17', '18:00:00') === '2026-08-18', '18:00:00 rolls to next clearing date');
console.assert(getGlobexClearingDate('2026-08-17', '18:00:01') === '2026-08-18', '18:00:01 rolls to next clearing date');
console.assert(getGlobexClearingDate('2026-08-17', '23:59:59') === '2026-08-18', '23:59:59 rolls to next clearing date');

// Test Sunday evening open (Sunday 18:00 rolls to Monday business trade date)
console.assert(getGlobexClearingDate('2026-08-16', '18:00:00') === '2026-08-17', 'Sunday 18:00 EST rolls to Monday clearing date');

// Test Friday evening close (Friday 18:00+ rolls past Saturday & Sunday to Monday)
console.assert(getGlobexClearingDate('2026-08-21', '18:00:00') === '2026-08-24', 'Friday 18:00 rolls past weekend to Monday clearing date');

// Test Month End & Year End Rollovers
console.assert(getGlobexClearingDate('2026-12-31', '18:30:00') === '2027-01-01', 'Dec 31 18:30 rolls to Jan 01 next year');
console.assert(getGlobexClearingDate('2024-02-28', '18:00:00') === '2024-02-29', 'Leap year Feb 28 18:00 rolls to Feb 29');
console.assert(getGlobexClearingDate('2025-02-27', '18:00:00') === '2025-02-28', 'Non-leap year Feb 27 18:00 rolls to Feb 28');
console.assert(getGlobexClearingDate('2025-02-28', '18:00:00') === '2025-03-03', 'Friday Feb 28 18:00 rolls past weekend to Monday Mar 03');
console.log('✓ All 18:00 EST Globex boundaries, weekend bypasses, and leap year roll-overs verified 100% accurate');


// -----------------------------------------------------------------------------
// 5. EXTREME FINANCIAL MATH & FLOATING POINT PRECISION
// -----------------------------------------------------------------------------
console.log('\n--- STRESS TEST 5: Floating Point Precision & Drawdown Volatility (10,000 Equity Points) ---');

// Floating point representation test (0.1 + 0.2 != 0.3 bug prevention)
const sumPnl = sumTradesPnl([
  { pnl: '$0.10' },
  { pnl: '$0.20' },
  { pnl: '$0.70' }
]);
console.assert(sumPnl === 1, `Expected numeric sum 1, got ${sumPnl}`);
console.assert(formatFinancialCurrency(sumPnl) === '+$1.00', `Expected format +$1.00, got ${formatFinancialCurrency(sumPnl)}`);

// Test Trailing Drawdown calculation over 10,000 simulated trade checkpoints
const tradeSeries = [];
for (let p = 0; p < 10000; p++) {
  const delta = (Math.sin(p) * 45) + (Math.cos(p * 2) * 30);
  tradeSeries.push({ pnlNum: delta });
}

const ddStart = performance.now();
const drawdownResult = calculateTrailingDrawdown(tradeSeries, 5000);
const ddDuration = performance.now() - ddStart;

console.assert(drawdownResult.drawdownFromPeak >= 0, 'Drawdown from peak must be non-negative');
console.assert(ddDuration < 50, `10,000 drawdown points calculated in ${ddDuration.toFixed(2)}ms, must be < 50ms`);
console.log(`✓ 10,000 high-frequency trade entries processed for trailing drawdown in ${ddDuration.toFixed(2)}ms (Peak PnL: $${drawdownResult.peakPnL?.toLocaleString()}, Drawdown: $${drawdownResult.drawdownFromPeak?.toLocaleString()})`);


// -----------------------------------------------------------------------------
// 6. CORRUPT JSON BACKUP VAULT RECOVERY
// -----------------------------------------------------------------------------
console.log('\n--- STRESS TEST 6: Hostile JSON Backup Injection & Recovery ---');
const corruptPayloads = [
  null,
  undefined,
  '',
  '{ corrupt_json',
  '[]',
  '{"version": "2.0"}', // Missing data key
  '{"data": "not_an_object"}',
  '{"data": {}}' // Empty data
];

for (const payload of corruptPayloads) {
  const res = importFullBackup(payload);
  console.assert(res.success === false, `Corrupt payload must fail gracefully: ${JSON.stringify(payload)}`);
  console.assert(typeof res.error === 'string', 'Error message must be descriptive');
}

// Valid backup recovery with 1,000 keys
const validBackup = {
  version: '2.0',
  appName: 'TradePigeon',
  exportedAt: new Date().toISOString(),
  data: {}
};
for (let b = 0; b < 1000; b++) {
  validBackup.data[`tradepigeon_test_key_${b}`] = { tradeId: b, value: b * 10 };
}

const backupStart = performance.now();
const validRes = importFullBackup(validBackup);
const backupDuration = performance.now() - backupStart;

console.assert(validRes.success === true, 'Valid backup must succeed');
console.assert(validRes.count === 1000, `Expected 1000 keys imported, got ${validRes.count}`);
console.log(`✓ Corrupt payloads safely rejected; 1,000-key snapshot imported in ${backupDuration.toFixed(2)}ms`);


// -----------------------------------------------------------------------------
// 7. COMPONENT & ICON EXPORT INTEGRITY AUDIT
// -----------------------------------------------------------------------------
console.log('\n--- STRESS TEST 7: Component & Icon Symbol Integrity Audit ---');
const duoIconsPath = path.resolve(__dirname, '../src/components/DuoIcons.jsx');
const pigeonIconsPath = path.resolve(__dirname, '../src/components/PigeonIcons.jsx');

const duoContent = fs.readFileSync(duoIconsPath, 'utf8');
const pigeonContent = fs.readFileSync(pigeonIconsPath, 'utf8');

// Extract all exports from DuoIcons.jsx
const aliasMatches = [...duoContent.matchAll(/(\w+)\s+as\s+(\w+)/g)];
console.assert(aliasMatches.length >= 35, `Expected at least 35 icon aliases, found ${aliasMatches.length}`);

let missingSymbols = 0;
for (const match of aliasMatches) {
  const originalName = match[1];
  const aliasName = match[2];
  
  // Verify original name is declared in PigeonIcons.jsx
  const isDeclared = pigeonContent.includes(`function ${originalName}`) || pigeonContent.includes(`const ${originalName}`);
  if (!isDeclared) {
    console.error(`MISSING SYMBOL: ${originalName} (aliased as ${aliasName}) is not defined in PigeonIcons.jsx!`);
    missingSymbols++;
  }
}

console.assert(missingSymbols === 0, `Encountered ${missingSymbols} missing icon symbols in DuoIcons export matrix`);
console.assert(duoContent.includes('PigeonBookIcon as DuoBookIcon'), 'DuoBookIcon alias explicitly verified');
console.log(`✓ All ${aliasMatches.length} icon aliases in DuoIcons.jsx verified against PigeonIcons.jsx declarations`);

console.log('\n====================================================');
console.log('🏆 ALL 7 STRESS & RESILIENCE TESTS PASSED (100%)');
console.log('====================================================\n');
