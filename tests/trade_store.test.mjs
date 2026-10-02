import './_strict.mjs';
import './_browser_shim.mjs';
const S = await import('../src/utils/tradeStore.js');

// --- session dates (CME 18:00 ET rollover, DST-correct) ---
const et = (iso) => Date.parse(iso); // ISO with explicit offset
console.assert(S.sessionDateFor(et('2026-09-22T09:35:00-04:00')) === '2026-09-22', 'RTH trade belongs to same day');
console.assert(S.sessionDateFor(et('2026-09-22T18:30:00-04:00')) === '2026-09-23', '18:30 ET belongs to next session');
console.assert(S.sessionDateFor(et('2026-09-22T17:59:00-04:00')) === '2026-09-22', '17:59 ET still same session');
console.assert(S.sessionDateFor(et('2026-09-25T18:30:00-04:00')) === '2026-09-28', 'Friday evening rolls to Monday');
console.assert(S.sessionDateFor(et('2026-09-27T18:05:00-04:00')) === '2026-09-28', 'Sunday open is Monday session');
console.assert(S.sessionDateFor(et('2026-11-02T18:30:00-05:00')) === '2026-11-03', 'Rollover after DST ends (EST)');
console.assert(S.sessionDateFor(et('2026-03-09T19:00:00-04:00')) === '2026-03-10', 'Rollover after DST starts (EDT)');

// --- ids are deterministic and account-scoped ---
const base = { account: 'APEX-1', symbol: 'MNQZ6', side: 'BUY', qty: 1, entryTime: '2026-09-22T13:35:00Z', exitTime: '2026-09-22T13:40:00Z', entryPrice: 20000, exitPrice: 20010 };
console.assert(S.makeTradeId(base) === S.makeTradeId({ ...base }), 'same trade -> same id');
console.assert(S.makeTradeId(base) !== S.makeTradeId({ ...base, account: 'APEX-2' }), 'copy-traded on another account -> different id');
console.assert(S.makeTradeId({ account: 'a', brokerTradeId: '123' }) === S.makeTradeId({ account: 'A', brokerTradeId: '123' }), 'account case-insensitive');

// --- add / duplicate / delete / tombstone / restore / undo import ---
const mk = (o) => ({ ...base, ...o, id: S.makeTradeId({ ...base, ...o }), date: '2026-09-22', pnlNum: 20 });
let events = 0; S.onTradesChange(() => events++);
const r1 = S.addTrades([mk({}), mk({ exitPrice: 20020 })], { source: 'file', importId: 'imp1' });
console.assert(r1.added.length === 2 && r1.duplicates === 0, 'two trades added');
const r2 = S.addTrades([mk({}), mk({ exitPrice: 20020 })], { source: 'file', importId: 'imp2' });
console.assert(r2.added.length === 0 && r2.duplicates === 2, 're-import adds nothing');
console.assert(S.getTrades().length === 2, 'store holds 2');
console.assert(S.getTradesForDate('2026-09-22').length === 2, 'date query');

const id0 = mk({}).id;
S.updateTrade(id0, { notes: 'my note' });
S.addTrades([mk({})], { source: 'file' });
console.assert(S.getTrades().find(t => t.id === id0).notes === 'my note', 'user edit survives re-import');

const removed = S.deleteTrades([id0]);
console.assert(S.getTrades().length === 1, 'deleted');
console.assert(S.addTrades([mk({})]).previouslyDeleted === 1, 'deleted trade does not come back on re-import');
S.restoreTrades(removed);
console.assert(S.getTrades().length === 2 && S.getTrades().find(t => t.id === id0).notes === 'my note', 'undo delete restores exactly');

S.recordImport({ importId: 'imp1', fileName: 'x.csv', account: 'APEX-1', format: 'tradovate', added: 2, duplicates: 0, previouslyDeleted: 0, rejected: 0 });
console.assert(S.undoImport('imp1') === 2 && S.getTrades().length === 0, 'undo import removes its trades');
console.assert(S.getImportHistory()[0].undone === true, 'history marks undone');
console.assert(S.addTrades([mk({})], { importId: 'imp3' }).added.length === 1, 'undone import can be imported again');
console.assert(events > 0, 'change events fire');

let threw = false; try { S.addTrades([{ symbol: 'NQ' }]); } catch { threw = true; }
console.assert(threw, 'trades without id are rejected');
console.log('✓ trade store: ids, session dates, duplicates, tombstones, undo');

// setDayTrades: edit a whole day as a list
const day = '2026-09-23';
const d1 = { ...mk({ exitPrice: 1 }), date: day }, d2 = { ...mk({ exitPrice: 2 }), date: day };
S.addTrades([d1, d2]);
let res = S.setDayTrades(day, [{ ...d1, type: 'toxic_win' }, { id: 'MAN-1', symbol: 'MES', pnlNum: 5 }]);
console.assert(res.added === 1 && res.updated === 1 && res.deleted === 1, `setDayTrades counts ${JSON.stringify(res)}`);
const dayList = S.getTradesForDate(day);
console.assert(dayList.length === 2 && dayList.find(t => t.id === d1.id).type === 'toxic_win' && dayList.find(t => t.id === 'MAN-1'), 'day list now matches');
console.assert(S.addTrades([d2]).previouslyDeleted === 1, 'trade removed from the day stays deleted');
res = S.setDayTrades(day, S.getTradesForDate(day));
console.assert(res.added === 0 && res.updated === 0 && res.deleted === 0, 'no-op when unchanged');
console.log('✓ setDayTrades');
