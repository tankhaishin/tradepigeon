/**
 * TradePigeon High-Precision Futures & Multi-Asset FIFO Position Pairing Engine
 * Transforms raw single-leg broker execution fills into mathematically accurate closed round-trip trades.
 */

import { parseFinancialNumber, formatFinancialCurrency, formatRMultiple } from './financialMath.js';
import { extractIsoDate } from './tradeParser.js';

// Standard futures contract point multipliers (Dollar value per 1 full index/commodity point)
export const INSTRUMENT_MULTIPLIERS = {
  // E-mini & Micro Nasdaq 100
  'NQ': 20,
  'MNQ': 2,
  'ENQ': 20,

  // E-mini & Micro S&P 500
  'ES': 50,
  'MES': 5,
  'EP': 50,

  // E-mini & Micro Dow Jones
  'YM': 5,
  'MYM': 0.5,

  // E-mini & Micro Russell 2000
  'RTY': 50,
  'M2K': 5,

  // Crude Oil
  'CL': 1000,
  'MCL': 100,
  'QM': 500,

  // Gold
  'GC': 100,
  'MGC': 10,
  'QO': 50,

  // Silver
  'SI': 5000,
  'SIL': 1000,

  // Natural Gas
  'NG': 10000,
  'QG': 2500,

  // Euro FX
  '6E': 125000,
  'M6E': 12500,

  // Default fallback multiplier
  'DEFAULT': 1
};

/**
 * Normalizes symbol string to base ticker (e.g., 'NQU4' -> 'NQ', 'NQ1!' -> 'NQ', 'MESM26' -> 'MES')
 */
export function normalizeSymbol(rawSymbol = '') {
  if (!rawSymbol || typeof rawSymbol !== 'string') return 'NQ';
  const clean = rawSymbol.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');

  if (clean.startsWith('MNQ')) return 'MNQ';
  if (clean.startsWith('ENQ')) return 'ENQ';
  if (clean.startsWith('NQ')) return 'NQ';
  if (clean.startsWith('MES')) return 'MES';
  if (clean.startsWith('EP')) return 'EP';
  if (clean.startsWith('ES')) return 'ES';
  if (clean.startsWith('MYM')) return 'MYM';
  if (clean.startsWith('YM')) return 'YM';
  if (clean.startsWith('M2K')) return 'M2K';
  if (clean.startsWith('RTY')) return 'RTY';
  if (clean.startsWith('MCL')) return 'MCL';
  if (clean.startsWith('QM')) return 'QM';
  if (clean.startsWith('CL')) return 'CL';
  if (clean.startsWith('MGC')) return 'MGC';
  if (clean.startsWith('QO')) return 'QO';
  if (clean.startsWith('GC')) return 'GC';
  if (clean.startsWith('SIL')) return 'SIL';
  if (clean.startsWith('SI')) return 'SI';
  if (clean.startsWith('QG')) return 'QG';
  if (clean.startsWith('NG')) return 'NG';
  if (clean.startsWith('M6E')) return 'M6E';
  if (clean.startsWith('6E')) return '6E';

  return clean.slice(0, 4) || 'NQ';
}

/**
 * Retrieves the point value multiplier for an instrument
 */
export function getInstrumentMultiplier(rawSymbol = '') {
  const base = normalizeSymbol(rawSymbol);
  return INSTRUMENT_MULTIPLIERS[base] || INSTRUMENT_MULTIPLIERS.DEFAULT;
}

/**
 * Calculates human-readable duration between timestamps
 */
export function formatDuration(startMs, endMs) {
  if (!startMs || !endMs || isNaN(startMs) || isNaN(endMs)) return '15m';
  const diffMins = Math.max(1, Math.round(Math.abs(endMs - startMs) / (1000 * 60)));
  if (diffMins < 60) return `${diffMins}m`;
  const hours = Math.floor(diffMins / 60);
  const remainingMins = diffMins % 60;
  if (hours < 24) return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

/**
 * Pairs raw execution fills into closed round-trip trades using First-In-First-Out (FIFO) matching.
 * 
 * @param {Array} rawFills - Array of fill objects: { id, symbol, side/action, qty, price, timestamp/time, accountId }
 * @param {object} options - { baseRisk: 350, maxLossLimit: 500 }
 * @returns {Array} Array of closed trades with real PnL, duration, and execution classification
 */
export function pairFillsFIFOWithOpenPositions(rawFills = [], options = {}) {
  if (!Array.isArray(rawFills) || rawFills.length === 0) return { closedTrades: [], openPositions: [] };

  const baseRisk = options.baseRisk || 350;
  const maxLossLimit = options.maxLossLimit || 500;

  // 1. Sort fills chronologically
  const sortedFills = [...rawFills].map((f, idx) => {
    let combinedDateTime = f.timestamp;
    if (!combinedDateTime) {
      if (f.date && f.time) {
        combinedDateTime = `${f.date} ${f.time}`;
      } else {
        combinedDateTime = f.date || f.time || new Date().toISOString();
      }
    }

    let parsed = new Date(combinedDateTime);
    if (isNaN(parsed.getTime()) && f.time) {
      const fallbackDate = f.date || new Date().toISOString().slice(0, 10);
      parsed = new Date(`${fallbackDate} ${f.time}`);
    }

    const timeMs = !isNaN(parsed.getTime())
      ? parsed.getTime()
      : (Date.now() - (rawFills.length - idx) * 60000);

    const sideClean = String(f.action || f.side || f.type || 'BUY').toUpperCase();
    const isBuy = sideClean.includes('BUY') || sideClean.includes('LONG');
    const qty = Math.max(1, parseFinancialNumber(f.qty || f.quantity || f.contracts || f.size, 1));
    const price = parseFinancialNumber(f.price || f.entry || f.exit, 0);

    const fillSymbol = f.symbol || f.contract || f.contractName || f.ticker || f.instrument || 'NQ';

    // Extract real date string: prioritize f.date, then parsed timestamp date, then timeMs date
    const dateStr = extractIsoDate(f.date) || 
      (!isNaN(parsed.getTime()) ? parsed.toISOString().split('T')[0] : new Date(timeMs).toISOString().split('T')[0]);

    const timeStr = f.time || 
      (typeof combinedDateTime === 'string' && combinedDateTime.length > 10 ? combinedDateTime : new Date(timeMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    return {
      raw: f,
      id: f.id || `FILL-${idx + 1}`,
      symbol: fillSymbol,
      baseSymbol: normalizeSymbol(fillSymbol),
      multiplier: getInstrumentMultiplier(fillSymbol),
      isBuy,
      side: isBuy ? 'BUY' : 'SELL',
      qty,
      remainingQty: qty,
      price,
      timeMs,
      timeStr,
      dateStr,
      account: f.account || f.accountId || 'Primary Account'
    };
  }).sort((a, b) => a.timeMs - b.timeMs);

  // 2. FIFO Position Queues per symbol and account
  const positionQueues = {}; // key: `${symbol}_${account}` -> array of open fill chunks
  const closedTrades = [];

  sortedFills.forEach((fill) => {
    const queueKey = `${fill.baseSymbol}_${fill.account}`;
    if (!positionQueues[queueKey]) {
      positionQueues[queueKey] = [];
    }

    const queue = positionQueues[queueKey];

    // If queue is empty or has fills in the SAME direction, add to open inventory
    if (queue.length === 0 || queue[0].isBuy === fill.isBuy) {
      queue.push(fill);
      return;
    }

    // Incoming fill is in the OPPOSITE direction -> Match against FIFO inventory
    while (queue.length > 0 && fill.remainingQty > 0) {
      const openLeg = queue[0];
      const matchedQty = Math.min(openLeg.remainingQty, fill.remainingQty);

      openLeg.remainingQty -= matchedQty;
      fill.remainingQty -= matchedQty;

      // Closed trade calculations
      const isLong = openLeg.isBuy;
      const entryPrice = openLeg.price;
      const exitPrice = fill.price;
      const pointDiff = exitPrice - entryPrice;
      const grossPnl = pointDiff * openLeg.multiplier * matchedQty * (isLong ? 1 : -1);

      // Deduct commissions / fees if present in broker fill data (scaled per matched contract)
      const openFeeTotal = parseFinancialNumber(openLeg.raw?.fee || openLeg.raw?.commission || openLeg.raw?.fees || 0, 0);
      const closeFeeTotal = parseFinancialNumber(fill.raw?.fee || fill.raw?.commission || fill.raw?.fees || 0, 0);
      const openFeePerUnit = openLeg.qty > 0 ? Math.abs(openFeeTotal) / openLeg.qty : 0;
      const closeFeePerUnit = fill.qty > 0 ? Math.abs(closeFeeTotal) / fill.qty : 0;
      const matchedFees = (openFeePerUnit + closeFeePerUnit) * matchedQty;
      const realizedPnl = Math.round((grossPnl - matchedFees) * 100) / 100;

      const isWin = realizedPnl > 5;
      const isLoss = realizedPnl < -5;

      // Classification: Only losses exceeding maxLossLimit or explicit rule mistakes constitute a breach
      const isLossBreach = realizedPnl < -maxLossLimit;
      const isViolated = Boolean(
        isLossBreach ||
        openLeg.raw.mistake || fill.raw.mistake ||
        openLeg.raw.violated || fill.raw.violated ||
        openLeg.raw.violatedRules || fill.raw.violatedRules ||
        openLeg.raw.followedRules === false || fill.raw.followedRules === false
      );

      let tradeType = 'breakeven';
      if (!isViolated) {
        tradeType = isWin ? 'win' : isLoss ? 'good_loss' : 'breakeven';
      } else {
        tradeType = isWin ? 'toxic_win' : isLoss ? 'double_failure' : 'toxic_be';
      }

      const holdDuration = formatDuration(openLeg.timeMs, fill.timeMs);

      closedTrades.push({
        id: `TRD-${openLeg.id}-${fill.id}`,
        symbol: openLeg.symbol,
        side: isLong ? 'BUY (LONG)' : 'SELL (SHORT)',
        direction: isLong ? 'LONG' : 'SHORT',
        contracts: matchedQty,
        entryPrice: entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        exitPrice: exitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        entryPriceNum: entryPrice,
        exitPriceNum: exitPrice,
        pnlNum: Math.round(realizedPnl * 100) / 100,
        pnl: formatFinancialCurrency(realizedPnl, { showPlus: true }),
        r: formatRMultiple(realizedPnl, baseRisk),
        rMultiple: formatRMultiple(realizedPnl, baseRisk),
        type: tradeType,
        followedRules: !isViolated,
        status: isWin ? 'WIN' : isLoss ? 'LOSS' : 'BE',
        setup: openLeg.raw.setup || fill.raw.setup || 'FIFO Closed Trade',
        time: fill.timeStr,
        executedTime: fill.timeStr,
        date: fill.dateStr,
        account: fill.account,
        holdDuration,
        isClosed: true,
        confirmed: true
      });

      // Remove fully matched open leg
      if (openLeg.remainingQty <= 0) {
        queue.shift();
      }
    }

    // If incoming fill still has unmatched quantity, it opens a position in the new direction
    if (fill.remainingQty > 0) {
      queue.push(fill);
    }
  });

  // Collect all leftover inventory across all symbol+account queues as active open positions
  const openPositions = [];
  for (const queue of Object.values(positionQueues)) {
    for (const leg of queue) {
      if (leg.remainingQty > 0) {
        openPositions.push({
          id: `OPEN-${leg.id}`,
          fillId: leg.id,
          symbol: leg.symbol,
          side: leg.isBuy ? 'BUY (LONG)' : 'SELL (SHORT)',
          direction: leg.isBuy ? 'LONG' : 'SHORT',
          contracts: leg.remainingQty,
          entryPrice: leg.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          entryPriceNum: leg.price,
          time: leg.timeStr,
          date: leg.dateStr,
          timeMs: leg.timeMs,
          account: leg.account,
          multiplier: leg.multiplier,
          isOpen: true
        });
      }
    }
  }

  return { closedTrades, openPositions };
}

/**
 * Standard FIFO pairing returning only closed round-trip trades.
 * 100% backward-compatible with all existing views and tests.
 */
export function pairFillsFIFO(rawFills = [], options = {}) {
  const result = pairFillsFIFOWithOpenPositions(rawFills, options);
  return result.closedTrades;
}
