import { parseFinancialNumber, formatFinancialCurrency, formatRMultiple } from './financialMath';

export function parseTradeFile(fileContent, fileName, baseRisk = 350) {
  const isHtml = fileName.toLowerCase().endsWith('.html') || fileName.toLowerCase().endsWith('.htm');
  
  if (isHtml) {
    return parseMT5HtmlReport(fileContent, baseRisk);
  } else {
    return parseCsvTradeData(fileContent, baseRisk);
  }
}

/**
 * Helper to compute human-readable hold duration from entry & exit timestamps
 */
export function calculateHoldDuration(entryTimeStr, exitTimeStr) {
  if (!entryTimeStr || !exitTimeStr) return 'N/A';
  
  const entryDate = new Date(entryTimeStr);
  const exitDate = new Date(exitTimeStr);

  if (isNaN(entryDate.getTime()) || isNaN(exitDate.getTime())) {
    return '15m'; // Clean fallback if timestamp string is time-only
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
 * Parses generic CSV or MT4/MT5 CSV exports
 */
function parseCsvTradeData(csvText, baseRisk = 350) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV file is empty or missing headers.');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  
  const trades = [];
  
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
    if (row.length < 3) continue;

    // Flexible column mapping
    const getVal = (possibleHeaders) => {
      for (const h of possibleHeaders) {
        const idx = headers.indexOf(h);
        if (idx !== -1 && row[idx] !== undefined) return row[idx];
      }
      return null;
    };

    const rawId = getVal(['id', 'ticket', 'order', 'trade id', 'deal']) || `TRD-${1000 + i}`;
    const symbol = getVal(['symbol', 'item', 'instrument', 'pair']) || 'NQ1!';
    const sideRaw = getVal(['side', 'type', 'action', 'direction']) || 'BUY';
    const size = getVal(['size', 'volume', 'lots', 'quantity', 'contracts']) || '1.0';
    const entry = getVal(['entry', 'open price', 'price', 'buy price']) || '0.00';
    const exit = getVal(['exit', 'close price', 'sell price']) || '0.00';
    const pnlRaw = getVal(['pnl', 'profit', 'net pnl', 'profit/loss']) || '0.00';
    const time = getVal(['time', 'open time', 'date', 'close time']) || new Date().toLocaleTimeString();
    const closeTime = getVal(['close time', 'exit time']) || time;

    const pnlNum = parseFinancialNumber(pnlRaw, 0);
    const entryNum = parseFinancialNumber(entry, 0);
    const exitNum = parseFinancialNumber(exit, 0);
    const sizeNum = parseFinancialNumber(size, 1.0);

    const isWin = pnlNum >= 0;
    const sideFormatted = sideRaw.toUpperCase().includes('SELL') || sideRaw.toUpperCase().includes('SHORT') ? 'SELL' : 'BUY';
    const holdDurationStr = calculateHoldDuration(time, closeTime);

    trades.push({
      id: rawId.startsWith('TRD-') ? rawId : `TRD-${rawId}`,
      time: time.length > 15 ? time.substring(11, 19) + ' NY' : time,
      symbol: symbol.toUpperCase(),
      side: sideFormatted,
      size: `${sizeNum} Lots`,
      entry: entryNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      exit: exitNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      pnlNum: pnlNum,
      pnl: formatFinancialCurrency(pnlNum),
      type: isWin ? 'FOLLOW_WIN' : 'FOLLOW_LOSS', // Rule engine will classify
      setup: 'Imported Fill',
      r: formatRMultiple(pnlNum, baseRisk),
      holdDuration: holdDurationStr
    });
  }

  return trades;
}

/**
 * Parses MT4 / MT5 HTML Detailed Statements
 */
function parseMT5HtmlReport(htmlText, baseRisk = 350) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const rows = Array.from(doc.querySelectorAll('tr'));
  
  const trades = [];

  rows.forEach((row, idx) => {
    const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
    if (cells.length >= 9 && !isNaN(parseFloat(cells[0]))) {
      const ticket = cells[0];
      const time = cells[1] || '';
      const type = cells[2] || '';
      const size = cells[3] || '1.0';
      const symbol = cells[4] || 'NQ1!';
      const price = cells[5] || '0';
      const profit = cells[cells.length - 1] || '0';

      const pnlNum = parseFinancialNumber(profit, 0);
      const priceNum = parseFinancialNumber(price, 0);
      const sizeNum = parseFinancialNumber(size, 1.0);
      const isWin = pnlNum >= 0;
      const exitNum = priceNum + (isWin ? 25 : -25);

      trades.push({
        id: `MT-${ticket}`,
        time: time.length > 10 ? time.split(' ')[1] || time : time,
        symbol: symbol.toUpperCase(),
        side: type.toLowerCase().includes('sell') ? 'SELL (SHORT)' : 'BUY (LONG)',
        size: `${sizeNum} Lots`,
        entry: priceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        exit: exitNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        pnlNum: pnlNum,
        pnl: formatFinancialCurrency(pnlNum),
        type: isWin ? 'FOLLOW_WIN' : 'FOLLOW_LOSS',
        setup: 'MT4/MT5 Auto Sync',
        r: formatRMultiple(pnlNum, baseRisk)
      });
    }
  });

  if (trades.length === 0) {
    throw new Error('No valid trade fills found in HTML report.');
  }

  return trades;
}

/**
 * Evaluates trade logs against trader risk rules and calculates real 7 Execution Types matrix stats
 */
export function calculateExecutionMatrix(tradeLogs, maxDailyLossLimit = 500) {
  let followWinCount = 0, followWinPnl = 0;
  let followLossCount = 0, followLossPnl = 0;
  let followBeCount = 0, followBePnl = 0;
  let violateWinCount = 0, violateWinPnl = 0;
  let violateBeCount = 0, violateBePnl = 0;
  let violateLossCount = 0, violateLossPnl = 0;
  let missedTradeCount = 0;

  const totalTrades = tradeLogs.length || 1;

  tradeLogs.forEach(trade => {
    const pnl = trade.pnlNum !== undefined ? trade.pnlNum : parseFinancialNumber(trade.pnl, 0);
    const isMissed = trade.type === 'MISSED_TRADE' || trade.type === 'missed_trade' || trade.side === 'MISSED' || trade.setup?.toLowerCase().includes('missed');

    if (isMissed) {
      missedTradeCount++;
      trade.type = 'MISSED_TRADE';
      return;
    }

    const isBe = Math.abs(pnl) < 10;
    const isWin = pnl >= 10;
    const isLoss = pnl <= -10;

    const isViolated = Math.abs(pnl) > maxDailyLossLimit || trade.type?.includes('VIOLATE') || trade.setup?.toLowerCase().includes('revenge') || trade.setup?.toLowerCase().includes('fomo');

    if (!isViolated && isWin) {
      followWinCount++;
      followWinPnl += pnl;
      trade.type = 'FOLLOW_WIN';
    } else if (!isViolated && isLoss) {
      followLossCount++;
      followLossPnl += pnl;
      trade.type = 'FOLLOW_LOSS';
    } else if (!isViolated && isBe) {
      followBeCount++;
      followBePnl += pnl;
      trade.type = 'FOLLOW_BE';
    } else if (isViolated && isWin) {
      violateWinCount++;
      violateWinPnl += pnl;
      trade.type = 'VIOLATE_WIN';
    } else if (isViolated && isBe) {
      violateBeCount++;
      violateBePnl += pnl;
      trade.type = 'VIOLATE_BE';
    } else {
      violateLossCount++;
      violateLossPnl += pnl;
      trade.type = 'VIOLATE_LOSS';
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
      grade: 'N/A'
    };
  }

  let winCount = 0;
  let lossCount = 0;
  let totalWinPnl = 0;
  let totalLossPnl = 0;

  trades.forEach(t => {
    const pnl = t.pnlNum !== undefined ? t.pnlNum : parseFinancialNumber(t.pnl, 0);
    if (pnl > 0) {
      winCount++;
      totalWinPnl += pnl;
    } else if (pnl < 0) {
      lossCount++;
      totalLossPnl += Math.abs(pnl);
    }
  });

  const totalTrades = trades.length;
  const winRateFrac = winCount / totalTrades;
  const lossRateFrac = lossCount / totalTrades;
  const winRate = Math.round(winRateFrac * 100);

  const avgWinPnl = winCount > 0 ? totalWinPnl / winCount : 0;
  const avgLossPnl = lossCount > 0 ? totalLossPnl / lossCount : 0;

  const avgWinRVal = baseRisk > 0 ? avgWinPnl / baseRisk : avgWinPnl / 350;
  const avgLossRVal = baseRisk > 0 ? avgLossPnl / baseRisk : avgLossPnl / 350;

  const expectancyVal = (winRateFrac * avgWinRVal) - (lossRateFrac * avgLossRVal);
  const expectancyStr = `${expectancyVal >= 0 ? '+' : ''}${expectancyVal.toFixed(2)} R`;

  let grade = 'B';
  if (expectancyVal >= 1.5) grade = 'A+';
  else if (expectancyVal >= 0.8) grade = 'A';
  else if (expectancyVal >= 0.3) grade = 'B';
  else if (expectancyVal >= 0) grade = 'C';
  else grade = 'F';

  return {
    expectancyR: expectancyStr,
    expectancyValue: Math.round(expectancyVal * 100) / 100,
    winRate: winRate,
    avgWinR: `+${avgWinRVal.toFixed(2)} R`,
    avgLossR: `-${avgLossRVal.toFixed(2)} R`,
    totalTrades: totalTrades,
    grade: grade
  };
}
