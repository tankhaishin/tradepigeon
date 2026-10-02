import './_strict.mjs';
import './_browser_shim.mjs';
const { importTradesFile, parseTimestamp, detectDateOrder, rootSymbol, TEMPLATE_CSV } = await import('../src/utils/importFormats.js');
const { parseFinancialNumber } = await import('../src/utils/financialMath.js');
const NY = 'America/New_York';

// money
console.assert(parseFinancialNumber('$(90.00)') === -90, 'Tradovate $(90.00) is a loss');
console.assert(parseFinancialNumber('($1,250.50)') === -1250.5, 'accounting negative');
console.assert(parseFinancialNumber('$45.00') === 45, 'positive');

// time
console.assert(parseTimestamp('09/22/2026 09:35:12', NY) === Date.parse('2026-09-22T09:35:12-04:00'), 'MDY in NY (EDT)');
console.assert(parseTimestamp('9/22/2026 9:35:12 PM', NY) === Date.parse('2026-09-22T21:35:12-04:00'), '12h PM');
console.assert(parseTimestamp('12/01/2026 09:30:00', NY) === Date.parse('2026-12-01T09:30:00-05:00'), 'EST in winter');
console.assert(parseTimestamp('22.09.2026 13:35:12', 'Europe/Berlin', 'DMY') === Date.parse('2026-09-22T13:35:12+02:00'), 'DMY Berlin');
console.assert(detectDateOrder(['03/04/2026 10:00', '25/04/2026 10:00']) === 'DMY', 'detects DMY from any day>12');
console.assert(parseTimestamp('garbage', NY) === null, 'bad time -> null');
console.assert(rootSymbol('MNQ 12-26') === 'MNQ' && rootSymbol('MNQZ6') === 'MNQ' && rootSymbol('ESZ2026') === 'ES', 'root symbols');

// Tradovate Performance export
const tv = `symbol,_priceFormat,_priceFormatType,_tickSize,buyFillId,sellFillId,qty,buyPrice,sellPrice,pnl,boughtTimestamp,soldTimestamp,duration
MNQZ6,-2,0,0.25,1001,1002,2,20000.00,20010.00,$40.00,09/22/2026 09:35:12,09/22/2026 09:40:00,4min 48sec
MNQZ6,-2,0,0.25,1004,1003,1,20020.00,20030.00,$(20.00),09/22/2026 10:05:00,09/22/2026 10:01:00,4min
ESZ6,-2,0,0.25,1005,1006,1,5000.00,4998.00,$(100.00),09/22/2026 18:30:00,09/22/2026 18:45:00,15min
MNQZ6,-2,0,0.25,1007,1008,,20000,20001,$2.00,09/22/2026 11:00:00,09/22/2026 11:01:00,1min`;
const r = importTradesFile(tv, { account: 'APEX-1', timeZone: NY });
console.assert(r.format === 'tradovate', 'detect tradovate');
console.assert(r.trades.length === 3 && r.rejected.length === 1 && /qty/.test(r.rejected[0].reason) && r.rejected[0].line === 5, 'bad row rejected with line + reason, not defaulted');
const [a, b, c] = r.trades;
console.assert(a.side === 'BUY' && a.contracts === 2 && a.pnlNum === 40 && a.date === '2026-09-22' && a.entryPriceNum === 20000, 'long trade exact');
console.assert(b.side === 'SELL' && b.pnlNum === -20 && b.entryPriceNum === 20030 && b.exitPriceNum === 20020, 'short (sold first) exact, loss negative');
console.assert(c.date === '2026-09-23' && c.pnlNum === -100 && c.root === 'ES', 'evening trade -> next session; ES not NQ');
console.assert(a.pnlIsGross === true, 'tradovate P&L flagged as before fees');
console.assert(importTradesFile(tv, { account: 'APEX-1', timeZone: NY }).trades[0].id === a.id, 're-import yields same ids');
console.assert(importTradesFile(tv, { account: 'APEX-2', timeZone: NY }).trades[0].id !== a.id, 'same fills, other account -> different ids');

// NinjaTrader 8 Trades export
const nt = `Trade number,Instrument,Account,Strategy,Market pos.,Qty,Entry price,Exit price,Entry time,Exit time,Entry name,Exit name,Profit,Cum. net profit,Commission,MAE,MFE,ETD,Bars
1,MNQ 12-26,Sim101,,Short,3,20010.00,20000.00,9/22/2026 9:35:12 AM,9/22/2026 9:41:00 AM,Sell,Buy,$60.00,$57.84,$2.16,$0,$0,$0,1
2,MNQ 12-26,Sim101,,Long,1,20000.00,19990.00,9/22/2026 1:00:00 PM,9/22/2026 1:05:00 PM,Buy,Sell,($20.00),$37.12,$0.72,$0,$0,$0,1`;
const n = importTradesFile(nt, { account: 'ignored-uses-file-account', timeZone: NY });
console.assert(n.format === 'ninjatrader' && n.trades.length === 2 && n.rejected.length === 0, 'detect NT8');
console.assert(n.trades[0].side === 'SELL' && n.trades[0].contracts === 3 && n.trades[0].pnlNum === 57.84 && n.trades[0].account === 'ignored-uses-file-account', 'NT short, qty 3, net of commission, chosen account');
const cum = n.trades.reduce((x, t) => x + t.pnlNum, 0);
console.assert(Math.abs(cum - 37.12) < 0.001, `sum of net P&L matches NinjaTrader Cum. net profit (got ${cum})`);
const mixed = nt.replace('2,MNQ 12-26,Sim101', '2,MNQ 12-26,Sim202');
console.assert(/2 accounts/.test(importTradesFile(mixed, { account: 'x', timeZone: NY }).error || ''), 'multi-account file rejected with clear message');
console.assert(n.trades[1].pnlNum === -20.72 && n.trades[1].time === '13:00 ET', 'NT loss net of commission; PM time');

// template
const t = importTradesFile(TEMPLATE_CSV, { account: 'x', timeZone: NY });
console.assert(t.format === 'template' && t.trades.length === 1 && t.trades[0].pnlNum === 40.76, 'template pnl net of fees');
const noPnl = importTradesFile('symbol,side,qty,entry_time,exit_time,entry_price,exit_price\nMNQZ6,long,1,2026-09-22 09:35:00,2026-09-22 09:40:00,20000,20010', { account: 'x', timeZone: NY });
console.assert(noPnl.trades[0].pnlNum === 20, 'MNQ +10pts x1 = $20 (not NQ $200)');

// unknown file
console.assert(importTradesFile('foo,bar\n1,2', { account: 'x', timeZone: NY }).error, 'unknown format -> clear error, nothing imported');
console.log('✓ strict import: Tradovate, NinjaTrader, template, money, time, rejection');
const { limitToRecent } = await import('../src/utils/importFormats.js');
const now = Date.parse('2026-10-03T12:00:00Z');
const sample = [{ exitTimeMs: now - 5 * 86400000 }, { exitTimeMs: now - 40 * 86400000 }];
console.assert(limitToRecent(sample, true, now).trades.length === 1 && limitToRecent(sample, true, now).olderSkipped === 1, 'trial keeps last 30 days only');
console.assert(limitToRecent(sample, false, now).trades.length === 2, 'Pro imports everything');
console.log('✓ trial import limited to 30 days');
