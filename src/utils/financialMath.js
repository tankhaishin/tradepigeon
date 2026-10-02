/**
 * TradePigeon High-Precision Financial Math & Parsing Engine
 * Bulletproof parsing and formatting for prices, PnL, R-multiples, and win rates.
 * Prevents JavaScript comma truncation bugs (e.g. parseFloat("19,850.25") -> 19)
 * and parenthesis negative accounting format (e.g. "($450.00)" -> -450).
 */

/**
 * Extracts a pure numerical float from any input (number, formatted currency string, accounting string).
 * @param {number|string|null|undefined} val
 * @param {number} fallback
 * @returns {number}
 */
export function parseFinancialNumber(val, fallback = 0) {
  if (typeof val === 'number') {
    return isNaN(val) || !isFinite(val) ? fallback : val;
  }
  if (!val || typeof val !== 'string') {
    return fallback;
  }

  const trimmed = val.trim();
  if (trimmed === '' || trimmed === '-' || trimmed === 'N/A' || trimmed.includes('CLOSED')) {
    return fallback;
  }

  // Detect negative accounting parenthesis format: ($450.00), (450.00), $(450.00) (Tradovate)
  const noCurrency = trimmed.replace(/[$€£\s]/g, '');
  const isParenthesisNegative = noCurrency.startsWith('(') && noCurrency.endsWith(')');
  
  // Detect standard negative sign: -$450.00 or -450 or $-450
  const isExplicitNegative = /^\s*-\s*[$€£]?|^\s*[$€£]\s*-/.test(trimmed);

  // Remove commas, currency symbols, spaces, plus signs, and parentheses
  const cleanStr = trimmed
    .replace(/,/g, '')
    .replace(/[$€£]/g, '')
    .replace(/[()]/g, '')
    .replace(/[+]/g, '')
    .trim();

  const num = parseFloat(cleanStr);
  if (isNaN(num) || !isFinite(num)) {
    return fallback;
  }

  // If was parenthesis or negative sign, ensure negative value
  if (isParenthesisNegative || isExplicitNegative) {
    return -Math.abs(num);
  }

  return num;
}

/**
 * Formats a numerical value into a clean, localized USD currency string.
 * Examples: +$1,250.00, -$450.00, $0.00
 * @param {number|string} val
 * @param {object} options
 * @returns {string}
 */
export function formatFinancialCurrency(val, { showPlus = true, decimals = 2 } = {}) {
  const num = parseFinancialNumber(val, 0);
  const isZero = Math.abs(num) < 0.00001;

  if (isZero) {
    return decimals > 0 ? `$0.${'0'.repeat(decimals)}` : '$0';
  }

  const sign = num > 0 ? (showPlus ? '+' : '') : '-';
  const absFormatted = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return `${sign}$${absFormatted}`;
}

/**
 * Formats a balance amount (e.g. $50,000.00). Never shows a leading plus sign.
 * @param {number|string} val
 * @param {string} fallback
 * @returns {string}
 */
export function formatBalance(val, fallback = '$50,000.00') {
  if (!val && val !== 0) return fallback;
  const num = parseFinancialNumber(val, 50000);
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Computes R-Multiple based on PnL and risk unit (default: $350).
 * @param {number|string} pnl
 * @param {number} baseRisk
 * @param {number} decimals
 * @returns {string} e.g. "+2.4 R" or "-1.0 R"
 */
export function formatRMultiple(pnl, baseRisk = 350, decimals = 1) {
  let risk = 350;
  let dec = decimals;
  if (typeof baseRisk === 'object' && baseRisk !== null) {
    risk = baseRisk.baseRisk || 350;
    dec = baseRisk.decimals !== undefined ? baseRisk.decimals : 1;
  } else {
    risk = baseRisk > 0 ? baseRisk : 350;
  }
  const num = parseFinancialNumber(pnl, 0);
  const rVal = (num / risk).toFixed(dec);
  const numR = parseFloat(rVal);
  if (Math.abs(numR) < 0.001) return dec > 0 ? `0.${'0'.repeat(dec)} R` : '0 R';
  return `${numR > 0 ? '+' : ''}${rVal} R`;
}

/**
 * Safely calculates percentage avoiding division by zero.
 * @param {number} numerator
 * @param {number} denominator
 * @returns {string} e.g. "68%"
 */
export function calculatePercentage(numerator, denominator) {
  const num = parseFinancialNumber(numerator, 0);
  const den = parseFinancialNumber(denominator, 0);
  if (den <= 0) return '0%';
  const pct = Math.round((num / den) * 100);
  return `${Math.max(0, Math.min(100, pct))}%`;
}

/**
 * Safely sums the total PnL from an array of trades.
 * Inspects t.pnlNum, t.pnlValue, or t.pnl.
 * @param {Array} trades
 * @returns {number}
 */
export function sumTradesPnl(trades = []) {
  if (!Array.isArray(trades)) return 0;
  let total = 0;
  for (let i = 0; i < trades.length; i++) {
    const t = trades[i];
    if (!t) continue;
    if (typeof t.pnlNum === 'number' && !isNaN(t.pnlNum)) {
      total += t.pnlNum;
    } else if (typeof t.pnlValue === 'number' && !isNaN(t.pnlValue)) {
      total += t.pnlValue;
    } else {
      total += parseFinancialNumber(t.pnl, 0);
    }
  }
  return Math.round(total * 100) / 100;
}

/**
 * Calculates High-Water Mark (Peak Equity) and Trailing Drawdown Buffer for Prop Firm Accounts.
 * @param {Array} trades List of trades for the session/account
 * @param {number|string} trailingBuffer Total max trailing drawdown threshold (e.g. 2500 for $2,500)
 * @returns {object} { peakPnL, currentPnL, drawdownFromPeak, bufferRemaining, bufferPercent, trailingThreshold, isBreached, isWarning }
 */
export function calculateTrailingDrawdown(trades = [], trailingBuffer = 2500) {
  const maxBuffer = Math.abs(parseFinancialNumber(trailingBuffer, 2500));
  if (!Array.isArray(trades) || trades.length === 0) {
    return {
      peakPnL: 0,
      currentPnL: 0,
      drawdownFromPeak: 0,
      bufferRemaining: maxBuffer,
      bufferPercent: 100,
      trailingThreshold: -maxBuffer,
      isBreached: false,
      isWarning: false
    };
  }

  // Sort trades chronologically if timestamps are available
  const chronTrades = [...trades].sort((a, b) => {
    const timeA = a.timestamp || a.time || 0;
    const timeB = b.timestamp || b.time || 0;
    if (typeof timeA === 'number' && typeof timeB === 'number') {
      return timeA - timeB;
    }
    return 0;
  });

  let running = 0;
  let peak = 0;

  for (const t of chronTrades) {
    let p = 0;
    if (typeof t.pnlNum === 'number' && !isNaN(t.pnlNum)) {
      p = t.pnlNum;
    } else if (typeof t.pnlValue === 'number' && !isNaN(t.pnlValue)) {
      p = t.pnlValue;
    } else {
      p = parseFinancialNumber(t.pnl, 0);
    }
    running += p;
    if (running > peak) {
      peak = running;
    }
  }

  const currentPnL = sumTradesPnl(trades);
  const drawdownFromPeak = Math.max(0, peak - currentPnL);
  const bufferRemaining = Math.max(0, maxBuffer - drawdownFromPeak);
  const bufferPercent = Math.min(100, Math.max(0, Math.round((bufferRemaining / maxBuffer) * 100)));
  const trailingThreshold = peak - maxBuffer;
  const isBreached = currentPnL <= trailingThreshold;
  const isWarning = bufferPercent <= 30;

  return {
    peakPnL: Math.round(peak * 100) / 100,
    currentPnL: Math.round(currentPnL * 100) / 100,
    drawdownFromPeak: Math.round(drawdownFromPeak * 100) / 100,
    bufferRemaining: Math.round(bufferRemaining * 100) / 100,
    bufferPercent,
    trailingThreshold: Math.round(trailingThreshold * 100) / 100,
    isBreached,
    isWarning
  };
}
