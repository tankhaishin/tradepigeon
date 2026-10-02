import { parseFinancialNumber, formatFinancialCurrency, formatRMultiple } from './financialMath.js';

/**
 * Helper to compute human-readable hold duration from entry & exit timestamps
 */
export function calculateHoldDuration(entryTimeStr, exitTimeStr) {
  if (!entryTimeStr || !exitTimeStr) return 'N/A';
  
  const parseTimeOrDate = (str) => {
    if (!str) return null;
    const trimmed = String(str).trim();
    let d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
    d = new Date(`1970-01-01T${trimmed}`);
    if (!isNaN(d.getTime())) return d;
    d = new Date(`1970-01-01 ${trimmed}`);
    if (!isNaN(d.getTime())) return d;
    return null;
  };

  const entryDate = parseTimeOrDate(entryTimeStr);
  const exitDate = parseTimeOrDate(exitTimeStr);

  if (!entryDate || !exitDate) {
    return '15m'; // Clean fallback if timestamp string is completely unparseable
  }

  const diffMs = Math.abs(exitDate - entryDate);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ${diffMins % 60}m`;
  }
  return `${Math.max(1, diffMins)}m`;
}

/**
 * Detects CSV delimiter: comma, semicolon, or tab
 */
export function detectDelimiter(firstLine) {
  if (!firstLine || typeof firstLine !== 'string') return ',';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
  if (semicolonCount > commaCount) return ';';
  return ',';
}

/**
 * Splits a CSV line into cells respecting quotes and escaped quotes
 */
export function parseCsvLine(line, delimiter = ',') {
  if (!line) return [];
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      cells.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim().replace(/^"|"$/g, ''));
  return cells;
}

/**
 * Robustly extracts an ISO date (YYYY-MM-DD) from various broker date formats:
 * - YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD (e.g., 2026-08-15, 2026.08.15)
 * - MM/DD/YYYY, M/D/YYYY (e.g., 10/14/2025, 9/5/2025)
 * - DD/MM/YYYY when day > 12 (e.g., 25/08/2025)
 * - Full ISO and timestamp strings (e.g. 2026-08-15T09:30:00Z, 2025.10.14 09:30:00)
 */
export function extractIsoDate(rawDateStr) {
  if (!rawDateStr) return '';
  const trimmed = String(rawDateStr).trim();
  if (!trimmed) return '';

  // 1. Check YYYY[-/.]MM[-/.]DD (e.g. 2026-08-15, 2026/08/15, 2026.08.15)
  const ymdMatch = trimmed.match(/^(\d{4})[-/. ](\d{1,2})[-/. ](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = String(ymdMatch[2]).padStart(2, '0');
    const d = String(ymdMatch[3]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. Check MM/DD/YYYY or DD/MM/YYYY (e.g. 10/14/2025, 9/5/2025)
  const mdyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (mdyMatch) {
    const part1 = parseInt(mdyMatch[1], 10);
    const part2 = parseInt(mdyMatch[2], 10);
    const y = mdyMatch[3];

    // If first number > 12, it must be DD/MM/YYYY
    if (part1 > 12 && part2 <= 12) {
      const d = String(part1).padStart(2, '0');
      const m = String(part2).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    // Standard US MM/DD/YYYY
    const m = String(part1).padStart(2, '0');
    const d = String(part2).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 3. Check text date formats like "15 Aug 2026" or "August 15, 2026"
  let baseIso = '';
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    baseIso = parsed.toISOString().slice(0, 10);
  }

  if (!baseIso) return '';

  return baseIso;
}

/**
 * Calculates official CME Globex clearing business date.
 * Futures market sessions begin at 18:00 EST (6:00 PM) of the prior calendar day:
 * Sunday 18:00+ -> Monday Clearing Date
 * Monday 18:00+ -> Tuesday Clearing Date, etc.
 */
export function getGlobexClearingDate(isoDate, timeStr = '') {
  if (!isoDate) return '';
  if (!timeStr) return isoDate;

  const timeMatch = String(timeStr).match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return isoDate;

  let hour = parseInt(timeMatch[1], 10);
  const isPm = /pm/i.test(timeStr);
  if (isPm && hour < 12) hour += 12;
  const isAm = /am/i.test(timeStr);
  if (isAm && hour === 12) hour = 0;

  // 18:00+ EST marks Globex session open for the next business trade date
  if (hour >= 18) {
    const d = new Date(`${isoDate}T12:00:00Z`);
    if (!isNaN(d.getTime())) {
      d.setUTCDate(d.getUTCDate() + 1);
      // If rolled to Saturday, advance to Monday
      if (d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 2);
      return d.toISOString().slice(0, 10);
    }
  }

  return isoDate;
}

/**
 * Classifies an individual trade into one of the 7 execution archetypes:
 * FOLLOW_WIN (Disciplined Win), FOLLOW_LOSS (Disciplined Loss), FOLLOW_BE (Disciplined BE),
 * VIOLATE_WIN (Toxic Win), VIOLATE_BE (Toxic BE), VIOLATE_LOSS (Double Failure), MISSED_TRADE (Missed Setup).
 */
export const TRADE_BEHAVIOR_TAGS = [
  { id: 'scaled_out', label: 'Scaled Out / Partials', shortLabel: 'Partials', category: 'positive', desc: 'Locked in profit on partial contracts (TP1)' },
  { id: 'trailed_be', label: 'Trailed Stop to BE', shortLabel: 'Trailed BE', category: 'positive', desc: 'Protected risk by moving stop to entry' },
  { id: 'trailed_structure', label: 'Trailed Structure', shortLabel: 'Trailed', category: 'positive', desc: 'Trailed stop behind market swing highs/lows' },
  { id: 'held_runner', label: 'Held Runner', shortLabel: 'Runner', category: 'positive', desc: 'Allowed remaining contract to hit full target' },
  { id: 'respected_stop', label: 'Respected Stop', shortLabel: 'Respected SL', category: 'positive', desc: 'Accepted initial risk without tampering' },
  { id: 'widened_stop', label: 'Widened Stop Loss', shortLabel: 'Widened SL', category: 'toxic', desc: 'Moved stop further away to avoid loss (RULE VIOLATION)' },
  { id: 'averaged_down', label: 'Averaged Down', shortLabel: 'Averaged Down', category: 'toxic', desc: 'Added size into a losing position (RULE VIOLATION)' },
  { id: 'early_exit', label: 'Exited Early (Fear)', shortLabel: 'Early Exit', category: 'warning', desc: 'Cut winner prematurely before target reached' },
  { id: 'chased_entry', label: 'Chased Entry / FOMO', shortLabel: 'Chased', category: 'toxic', desc: 'Entered late after market impulse (RULE VIOLATION)' }
];

export function classifyTradeExecution(trade, maxDailyLossLimit = 1000) {
  if (!trade) {
    return {
      id: 'FOLLOW_WIN',
      label: 'Disciplined Win',
      shortLabel: 'DISC. WIN',
      color: '#58CC02',
      badgeBg: 'bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/30',
      pnlColor: 'text-[#58CC02]',
      isToxicWin: false,
      isDisciplined: true,
      managementTags: []
    };
  }

  const managementTags = Array.isArray(trade.managementTags) ? trade.managementTags : [];
  const hasToxicManagement = managementTags.some(tag => 
    tag === 'widened_stop' || 
    tag === 'averaged_down' || 
    tag === 'chased_entry'
  );

  // Explicit missed trade check
  const isMissed = 
    trade.type === 'MISSED_TRADE' || 
    trade.type === 'missed_trade' || 
    trade.type === 'missed' || 
    trade.side === 'MISSED' || 
    trade.executionType === 'Missed Setup' ||
    trade.setup?.toLowerCase().includes('missed');

  if (isMissed) {
    return {
      id: 'MISSED_TRADE',
      label: 'Missed Setup',
      shortLabel: 'MISSED',
      color: '#FF9600',
      badgeBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      pnlColor: 'text-amber-400',
      isToxicWin: false,
      isDisciplined: false,
      managementTags
    };
  }

  const pnl = trade.pnlNum !== undefined ? trade.pnlNum : parseFinancialNumber(trade.pnl, 0);
  const isBe = Math.abs(pnl) < 10;
  const isWin = pnl >= 10;
  const isLoss = pnl <= -10;

  const rawType = String(trade.type || trade.executionType || '').toLowerCase();

  const isExplicitViolate = 
    rawType.includes('violate') ||
    rawType.includes('toxic') ||
    rawType === 'double_failure' ||
    rawType === 'double failure' ||
    trade.setup?.toLowerCase().includes('revenge') ||
    trade.setup?.toLowerCase().includes('fomo') ||
    trade.grade === 'F' ||
    trade.followedRules === false ||
    trade.violatedRules === true ||
    hasToxicManagement;

  const isExplicitFollow =
    !hasToxicManagement && (
      rawType.includes('follow') ||
      rawType === 'win' ||
      rawType === 'good_loss' ||
      rawType === 'breakeven' ||
      rawType.includes('disciplined') ||
      trade.followedRules === true
    );

  const isLossLimitBreached = pnl < -Math.abs(maxDailyLossLimit);
  const isViolated = isExplicitViolate || (!isExplicitFollow && isLossLimitBreached);

  if (rawType === 'toxic_win' || rawType === 'violate_win' || (isViolated && isWin)) {
    return {
      id: 'VIOLATE_WIN',
      label: 'Toxic Win',
      shortLabel: 'TOXIC WIN',
      color: '#FFC800',
      badgeBg: 'bg-[#FFC800]/20 text-[#FFC800] border border-[#FFC800]/30',
      pnlColor: 'text-amber-400',
      isToxicWin: true,
      isDisciplined: false,
      managementTags
    };
  }

  if (rawType === 'toxic_be' || rawType === 'violate_be' || (isViolated && isBe)) {
    return {
      id: 'VIOLATE_BE',
      label: 'Toxic BE',
      shortLabel: 'TOXIC BE',
      color: '#00F0FF',
      badgeBg: 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30',
      pnlColor: 'text-[#00F0FF]',
      isToxicWin: false,
      isDisciplined: false,
      managementTags
    };
  }

  if (rawType === 'double_failure' || rawType === 'violate_loss' || (isViolated && isLoss)) {
    return {
      id: 'VIOLATE_LOSS',
      label: 'Double Failure',
      shortLabel: 'DOUBLE FAIL',
      color: '#FF4B4B',
      badgeBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
      pnlColor: 'text-rose-400',
      isToxicWin: false,
      isDisciplined: false,
      managementTags
    };
  }

  if (rawType === 'win' || rawType === 'follow_win' || (!isViolated && isWin)) {
    return {
      id: 'FOLLOW_WIN',
      label: 'Disciplined Win',
      shortLabel: 'DISC. WIN',
      color: '#58CC02',
      badgeBg: 'bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/30',
      pnlColor: 'text-[#58CC02]',
      isToxicWin: false,
      isDisciplined: true,
      managementTags
    };
  }

  if (rawType === 'good_loss' || rawType === 'follow_loss' || (!isViolated && isLoss)) {
    return {
      id: 'FOLLOW_LOSS',
      label: 'Disciplined Loss',
      shortLabel: 'DISC. LOSS',
      color: '#1CB0F6',
      badgeBg: 'bg-[#1CB0F6]/20 text-[#1CB0F6] border border-[#1CB0F6]/30',
      pnlColor: 'text-rose-400',
      isToxicWin: false,
      isDisciplined: true,
      managementTags
    };
  }

  return {
    id: 'FOLLOW_BE',
    label: 'Disciplined BE',
    shortLabel: 'DISC. BE',
    color: '#CE82FF',
    badgeBg: 'bg-[#CE82FF]/20 text-[#CE82FF] border border-[#CE82FF]/30',
    pnlColor: 'text-[#CE82FF]',
    isToxicWin: false,
    isDisciplined: true,
    managementTags
  };
}

/**
 * Evaluates trade logs against trader risk rules and calculates real 7 Execution Types matrix stats
 */
export function calculateExecutionMatrix(tradeLogs, maxDailyLossLimit = 500) {
  const safeLogs = Array.isArray(tradeLogs) ? tradeLogs : [];
  let followWinCount = 0, followWinPnl = 0;
  let followLossCount = 0, followLossPnl = 0;
  let followBeCount = 0, followBePnl = 0;
  let violateWinCount = 0, violateWinPnl = 0;
  let violateBeCount = 0, violateBePnl = 0;
  let violateLossCount = 0, violateLossPnl = 0;
  let missedTradeCount = 0;

  const totalTrades = safeLogs.length || 1;

  safeLogs.forEach(trade => {
    const classification = classifyTradeExecution(trade, maxDailyLossLimit);
    const pnl = trade.pnlNum !== undefined ? trade.pnlNum : parseFinancialNumber(trade.pnl, 0);

    if (classification.id === 'MISSED_TRADE') {
      missedTradeCount++;
    } else if (classification.id === 'FOLLOW_WIN') {
      followWinCount++;
      followWinPnl += pnl;
    } else if (classification.id === 'FOLLOW_LOSS') {
      followLossCount++;
      followLossPnl += pnl;
    } else if (classification.id === 'FOLLOW_BE') {
      followBeCount++;
      followBePnl += pnl;
    } else if (classification.id === 'VIOLATE_WIN') {
      violateWinCount++;
      violateWinPnl += pnl;
    } else if (classification.id === 'VIOLATE_BE') {
      violateBeCount++;
      violateBePnl += pnl;
    } else {
      violateLossCount++;
      violateLossPnl += pnl;
    }
  });

  const formatPnl = (val) => `${val >= 0 ? '+' : '-'}$${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatCount = (c) => `${c} ${c === 1 ? 'Trade' : 'Trades'}`;

  return [
    { 
      id: 'FOLLOW_WIN', 
      title: 'Disciplined Win', 
      percent: Math.round((followWinCount / totalTrades) * 100),
      count: formatCount(followWinCount), 
      pnl: formatPnl(followWinPnl), 
      color: '#58CC02', 
      badgeBg: 'bg-[#58CC02]/15 text-[#58CC02]'
    },
    { 
      id: 'FOLLOW_LOSS', 
      title: 'Disciplined Loss', 
      percent: Math.round((followLossCount / totalTrades) * 100),
      count: formatCount(followLossCount), 
      pnl: formatPnl(followLossPnl), 
      color: '#1CB0F6', 
      badgeBg: 'bg-[#1CB0F6]/15 text-[#1CB0F6]'
    },
    { 
      id: 'FOLLOW_BE', 
      title: 'Disciplined BE', 
      percent: Math.round((followBeCount / totalTrades) * 100),
      count: formatCount(followBeCount), 
      pnl: formatPnl(followBePnl), 
      color: '#CE82FF', 
      badgeBg: 'bg-[#CE82FF]/15 text-[#CE82FF]'
    },
    { 
      id: 'VIOLATE_WIN', 
      title: 'Toxic Win', 
      percent: Math.round((violateWinCount / totalTrades) * 100),
      count: formatCount(violateWinCount), 
      pnl: formatPnl(violateWinPnl), 
      color: '#FFC800', 
      badgeBg: 'bg-amber-500/15 text-amber-400'
    },
    { 
      id: 'VIOLATE_BE', 
      title: 'Toxic BE', 
      percent: Math.round((violateBeCount / totalTrades) * 100),
      count: formatCount(violateBeCount), 
      pnl: formatPnl(violateBePnl), 
      color: '#00F0FF', 
      badgeBg: 'bg-[#00F0FF]/15 text-[#00F0FF]'
    },
    { 
      id: 'VIOLATE_LOSS', 
      title: 'Double Failure', 
      percent: Math.round((violateLossCount / totalTrades) * 100),
      count: formatCount(violateLossCount), 
      pnl: formatPnl(violateLossPnl), 
      color: '#FF4B4B', 
      badgeBg: 'bg-rose-500/15 text-rose-400'
    },
    { 
      id: 'MISSED_TRADE', 
      title: 'Missed Setup', 
      percent: Math.round((missedTradeCount / totalTrades) * 100),
      count: formatCount(missedTradeCount), 
      pnl: '$0.00', 
      color: '#FF9600', 
      badgeBg: 'bg-amber-500/15 text-amber-400'
    }
  ];
}

/**
 * Formats dollar PnL or R-Multiple based on Process-First Stealth Mode
 */
export function formatCurrencyOrR(pnlNum, isStealth = false, baseRisk = 350) {
  if (isStealth) {
    const rVal = baseRisk > 0 ? (pnlNum / baseRisk).toFixed(2) : (pnlNum / 350).toFixed(2);
    return `${rVal >= 0 ? '+' : ''}${rVal} R`;
  }
  return `${pnlNum >= 0 ? '+' : '-'}$${Math.abs(pnlNum).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Calculates mathematical Expectancy (R per trade) and Win Rate telemetry for a setup
 * Expectancy = (Win Rate % * Avg Win R) - (Loss Rate % * Avg Loss R)
 */
export function calculateSetupExpectancy(trades = [], baseRisk = 350) {
  if (!Array.isArray(trades) || trades.length === 0) {
    return {
      expectancyR: '+0.00 R',
      expectancyValue: 0,
      winRate: 0,
      avgWinR: '+0.00 R',
      avgLossR: '-0.00 R',
      totalTrades: 0,
      missedCount: 0,
      grade: 'N/A'
    };
  }

  // Separate executed trades from missed setups so missed setups don't artificially depress win rate & expectancy
  const executedTrades = trades.filter(t => {
    const isMissed = t.type === 'MISSED_TRADE' || t.type === 'missed_trade' || t.type === 'missed' || t.side === 'MISSED' || t.setup?.toLowerCase().includes('missed');
    return !isMissed;
  });

  const missedCount = trades.length - executedTrades.length;

  if (executedTrades.length === 0) {
    return {
      expectancyR: '+0.00 R',
      expectancyValue: 0,
      expectancyDollar: 0,
      winRate: 0,
      lossRate: 0,
      winCount: 0,
      lossCount: 0,
      beCount: 0,
      totalWinPnl: 0,
      totalLossPnl: 0,
      netProfit: 0,
      profitFactor: '0.0',
      avgWinPnl: 0,
      avgLossPnl: 0,
      avgWinR: '+0.00 R',
      avgLossR: '-0.00 R',
      maxDrawdown: 0,
      maxDrawdownR: '0.0 R',
      planAdherencePct: 100,
      execPrecision: '100% Plan Adherence',
      sharpeRatio: '0.0',
      totalTrades: 0,
      missedCount,
      grade: 'N/A'
    };
  }

  let winCount = 0;
  let lossCount = 0;
  let totalWinPnl = 0;
  let totalLossPnl = 0;

  executedTrades.forEach(t => {
    const pnl = t.pnlNum !== undefined ? t.pnlNum : parseFinancialNumber(t.pnl, 0);
    if (pnl > 0) {
      winCount++;
      totalWinPnl += pnl;
    } else if (pnl < 0) {
      lossCount++;
      totalLossPnl += Math.abs(pnl);
    }
  });

  const totalTrades = executedTrades.length;
  const winRateFrac = winCount / totalTrades;
  const lossRateFrac = lossCount / totalTrades;
  const winRate = Math.round(winRateFrac * 100);
  const beCount = totalTrades - winCount - lossCount;
  const netProfit = Math.round((totalWinPnl - totalLossPnl) * 100) / 100;

  let profitFactor = '0.0';
  if (totalLossPnl === 0) {
    profitFactor = totalWinPnl > 0 ? 'MAX' : '0.0';
  } else {
    profitFactor = (totalWinPnl / totalLossPnl).toFixed(2);
  }

  const avgWinPnl = winCount > 0 ? totalWinPnl / winCount : 0;
  const avgLossPnl = lossCount > 0 ? totalLossPnl / lossCount : 0;

  const avgWinRVal = baseRisk > 0 ? avgWinPnl / baseRisk : avgWinPnl / 350;
  const avgLossRVal = baseRisk > 0 ? avgLossPnl / baseRisk : avgLossPnl / 350;

  const expectancyVal = (winRateFrac * avgWinRVal) - (lossRateFrac * avgLossRVal);
  const expectancyStr = `${expectancyVal >= 0 ? '+' : ''}${expectancyVal.toFixed(2)} R`;

  // Max Drawdown in R and $
  let peak = 0;
  let running = 0;
  let maxDd = 0;
  executedTrades.forEach(t => {
    const pnl = t.pnlNum !== undefined ? t.pnlNum : parseFinancialNumber(t.pnl, 0);
    running += pnl;
    if (running > peak) peak = running;
    const dd = peak - running;
    if (dd > maxDd) maxDd = dd;
  });
  const maxDrawdownRVal = baseRisk > 0 ? (maxDd / baseRisk).toFixed(1) : (maxDd / 350).toFixed(1);
  const maxDrawdownR = `${maxDrawdownRVal} R`;

  // Plan Adherence / Rule execution precision
  const followedCount = executedTrades.filter(t => t.followedRules !== false && !t.violated && !t.violatedRules).length;
  const planAdherencePct = Math.round((followedCount / totalTrades) * 100);
  const execPrecision = `${planAdherencePct}% Plan Adherence`;

  // Sharpe Ratio (Sample mean R / std dev R)
  const rMultiples = executedTrades.map(t => {
    const pnl = t.pnlNum !== undefined ? t.pnlNum : parseFinancialNumber(t.pnl, 0);
    return baseRisk > 0 ? pnl / baseRisk : pnl / 350;
  });
  const meanR = rMultiples.reduce((s, r) => s + r, 0) / (rMultiples.length || 1);
  const variance = rMultiples.reduce((s, r) => s + Math.pow(r - meanR, 2), 0) / (rMultiples.length || 1);
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (meanR / stdDev).toFixed(2) : '0.0';

  let grade = 'B';
  if (expectancyVal >= 1.5) grade = 'A+';
  else if (expectancyVal >= 0.8) grade = 'A';
  else if (expectancyVal >= 0.3) grade = 'B';
  else if (expectancyVal >= 0) grade = 'C';
  else grade = 'F';

  return {
    expectancyR: expectancyStr,
    expectancyValue: Math.round(expectancyVal * 100) / 100,
    expectancyDollar: totalTrades > 0 ? Math.round((netProfit / totalTrades) * 100) / 100 : 0,
    winRate: winRate,
    lossRate: Math.round(lossRateFrac * 100),
    winCount,
    lossCount,
    beCount,
    totalWinPnl: Math.round(totalWinPnl * 100) / 100,
    totalLossPnl: Math.round(totalLossPnl * 100) / 100,
    netProfit,
    profitFactor,
    avgWinPnl: Math.round(avgWinPnl * 100) / 100,
    avgLossPnl: Math.round(avgLossPnl * 100) / 100,
    avgWinR: `+${avgWinRVal.toFixed(2)} R`,
    avgLossR: `-${avgLossRVal.toFixed(2)} R`,
    maxDrawdown: Math.round(maxDd * 100) / 100,
    maxDrawdownR,
    planAdherencePct,
    execPrecision,
    sharpeRatio,
    totalTrades: totalTrades,
    missedCount: missedCount,
    grade: grade
  };
}

/**
 * Standard CME & US Futures Market Sessions & Killzones (EST / New York Time)
 */
export const MARKET_SESSIONS = [
  {
    id: 'ny_am',
    name: 'NY AM Killzone',
    shortName: 'NY AM',
    hours: '09:30 - 11:30 EST',
    startMin: 570,
    endMin: 690,
    color: '#58CC02',
    badgeBg: 'bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/30',
    desc: 'Prime institutional auction, opening bell breakout momentum.',
    isTrap: false
  },
  {
    id: 'ny_lunch',
    name: 'NY Lunch Chop',
    shortName: 'LUNCH',
    hours: '11:30 - 13:30 EST',
    startMin: 690,
    endMin: 810,
    color: '#FF9600',
    badgeBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    desc: 'Low liquidity, mean-reversion chop, algorithmic stop traps.',
    isTrap: true
  },
  {
    id: 'ny_pm',
    name: 'NY PM Killzone',
    shortName: 'NY PM',
    hours: '13:30 - 16:00 EST',
    startMin: 810,
    endMin: 960,
    color: '#00F0FF',
    badgeBg: 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30',
    desc: 'Afternoon trend continuation, treasury close & MOC imbalance.',
    isTrap: false
  },
  {
    id: 'london',
    name: 'London Open',
    shortName: 'LONDON',
    hours: '02:00 - 05:00 EST',
    startMin: 120,
    endMin: 300,
    color: '#1CB0F6',
    badgeBg: 'bg-[#1CB0F6]/20 text-[#1CB0F6] border border-[#1CB0F6]/30',
    desc: 'European morning volatility, FTSE/DAX overlap, early trend.',
    isTrap: false
  },
  {
    id: 'ny_pre',
    name: 'NY Pre-Market',
    shortName: 'PRE-MKT',
    hours: '07:00 - 09:30 EST',
    startMin: 420,
    endMin: 570,
    color: '#CE82FF',
    badgeBg: 'bg-[#CE82FF]/20 text-[#CE82FF] border border-[#CE82FF]/30',
    desc: 'US macro economic data releases (CPI/NFP/PPI at 08:30 EST).',
    isTrap: false
  },
  {
    id: 'asia_overnight',
    name: 'Asia / Overnight',
    shortName: 'OVERNIGHT',
    hours: '18:00 - 02:00 EST',
    startMin: 1080,
    endMin: 120,
    color: '#A0B2C6',
    badgeBg: 'bg-slate-700/30 text-slate-300 border border-slate-600/30',
    desc: 'Globex overnight session, Tokyo/Sydney liquidity, quiet ranges.',
    isTrap: false
  }
];

/**
 * Maps minutes from midnight (0-1439) in US Eastern Time to a CME market session
 */
function getSessionFromMins(totalMins) {
  // 1. London: 02:00 (120) to 05:00 (300)
  if (totalMins >= 120 && totalMins < 300) {
    return MARKET_SESSIONS.find(s => s.id === 'london');
  }

  // 2. NY Pre-Market: 07:00 (420) to 09:30 (570)
  if (totalMins >= 420 && totalMins < 570) {
    return MARKET_SESSIONS.find(s => s.id === 'ny_pre');
  }

  // 3. NY AM Killzone: 09:30 (570) to 11:30 (690)
  if (totalMins >= 570 && totalMins < 690) {
    return MARKET_SESSIONS.find(s => s.id === 'ny_am');
  }

  // 4. NY Lunch Chop: 11:30 (690) to 13:30 (810)
  if (totalMins >= 690 && totalMins < 810) {
    return MARKET_SESSIONS.find(s => s.id === 'ny_lunch');
  }

  // 5. NY PM Killzone: 13:30 (810) to 16:00 (960)
  if (totalMins >= 810 && totalMins < 960) {
    return MARKET_SESSIONS.find(s => s.id === 'ny_pm');
  }

  // 6. Asia / Overnight (everything else, e.g. 16:00 - 02:00, 05:00 - 07:00)
  return MARKET_SESSIONS.find(s => s.id === 'asia_overnight');
}

/**
 * Resolves a trade execution time to a CME market session
 * Handles bare timestamps ("09:45:10", "14:30"), local ISO strings ("2026-09-22T09:45:00"),
 * and explicit UTC broker timestamps ("2026-09-22T13:45:00Z") converted to America/New_York.
 */
export function resolveMarketSession(timeStr) {
  if (!timeStr) {
    return MARKET_SESSIONS[0]; // fallback to NY AM
  }

  const trimmed = typeof timeStr === 'string' ? timeStr.trim() : String(timeStr).trim();

  // 1. If explicit UTC / offset string (e.g. "2026-09-22T13:45:00Z" or "+00:00"), convert to New York time
  const isExplicitUtcOrOffset = (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed)) && trimmed.includes('-');
  if (isExplicitUtcOrOffset) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      try {
        const nyFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          hour: 'numeric',
          minute: 'numeric',
          hour12: false
        });
        const parts = nyFormatter.formatToParts(d);
        const hVal = parts.find(p => p.type === 'hour')?.value;
        const mVal = parts.find(p => p.type === 'minute')?.value;
        if (hVal !== undefined && mVal !== undefined) {
          let hours = parseInt(hVal, 10);
          if (hours === 24) hours = 0;
          const minutes = parseInt(mVal, 10);
          return getSessionFromMins((hours * 60) + minutes);
        }
      } catch (_) {}
    }
  }

  // 2. Bare time string or local datetime (e.g. "09:45", "14:30:00", "2026-09-22 09:45:00")
  let rawTime = trimmed;
  if (rawTime.includes('T')) {
    rawTime = rawTime.split('T')[1] || rawTime;
  } else if (rawTime.includes(' ')) {
    const parts = rawTime.split(' ');
    if (parts.length > 1 && parts[1].includes(':')) {
      rawTime = parts[1];
    }
  }

  const timeMatch = rawTime.match(/(\d{1,2}):(\d{1,2})/);
  if (!timeMatch) {
    return MARKET_SESSIONS[0];
  }

  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const totalMins = (hours * 60) + minutes;

  return getSessionFromMins(totalMins);
}

/**
 * Calculates aggregate performance breakdown by market session
 */
export function calculateSessionMetrics(tradeLogs = [], baseRisk = 350) {
  const safeLogs = Array.isArray(tradeLogs) ? tradeLogs : [];
  const sessionStats = {};
  MARKET_SESSIONS.forEach(s => {
    sessionStats[s.id] = {
      ...s,
      totalTrades: 0,
      winCount: 0,
      lossCount: 0,
      beCount: 0,
      netPnl: 0,
      totalWinPnl: 0,
      totalLossPnl: 0,
      followedCount: 0,
      trades: []
    };
  });

  safeLogs.forEach(trade => {
    if (!trade) return;
    const session = resolveMarketSession(trade.time || trade.timestamp);
    const stat = sessionStats[session.id] || sessionStats['asia_overnight'];
    const pnl = trade.pnlNum !== undefined ? trade.pnlNum : parseFinancialNumber(trade.pnl, 0);

    stat.totalTrades++;
    stat.netPnl += pnl;
    stat.trades.push(trade);

    if (pnl > 10) {
      stat.winCount++;
      stat.totalWinPnl += pnl;
    } else if (pnl < -10) {
      stat.lossCount++;
      stat.totalLossPnl += Math.abs(pnl);
    } else {
      stat.beCount++;
    }

    if (trade.followedRules !== false && !trade.violated && !trade.violatedRules) {
      stat.followedCount++;
    }
  });

  return MARKET_SESSIONS.map(s => {
    const stat = sessionStats[s.id];
    const total = stat.totalTrades;
    const winRate = total > 0 ? Math.round((stat.winCount / total) * 100) : 0;
    const adherence = total > 0 ? Math.round((stat.followedCount / total) * 100) : 100;
    
    let pf = '0.0';
    if (stat.totalLossPnl === 0 && stat.totalWinPnl > 0) {
      pf = 'MAX';
    } else if (stat.totalLossPnl > 0) {
      pf = (stat.totalWinPnl / stat.totalLossPnl).toFixed(2);
    }

    const rMultiple = baseRisk > 0 ? (stat.netPnl / baseRisk).toFixed(1) : (stat.netPnl / 350).toFixed(1);
    const rStr = `${stat.netPnl >= 0 ? '+' : ''}${rMultiple} R`;
    const formattedPnl = formatFinancialCurrency(stat.netPnl, { showPlus: true });

    // Warning flag if losing in a trap session (like NY lunch)
    const isChopTrapWarning = s.isTrap && stat.netPnl < -50 && total >= 2;

    return {
      ...s,
      totalTrades: total,
      winCount: stat.winCount,
      lossCount: stat.lossCount,
      beCount: stat.beCount,
      winRate,
      adherence,
      profitFactor: pf,
      netPnl: Math.round(stat.netPnl * 100) / 100,
      formattedPnl,
      rMultiple: rStr,
      isChopTrapWarning
    };
  });
}
