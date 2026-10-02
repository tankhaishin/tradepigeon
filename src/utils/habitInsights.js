// Money behind the 7 execution labels: the "track discipline, not P&L" headline.
const RULE_BREAK = new Set(['toxic_win', 'toxic_be', 'double_failure']);

/** @param {object[]} trades normalized trades (from tradeStore) */
export function habitSummary(trades) {
  const out = { labeled: 0, needsLabel: 0, ruleBreaks: { count: 0, pnl: 0 }, toxicWins: { count: 0, pnl: 0 }, doubleFailures: { count: 0, pnl: 0 } };
  for (const t of trades) {
    if (t.type === 'missed_trade') continue;
    if (t.needsLabel) { out.needsLabel++; continue; }
    out.labeled++;
    const pnl = Number(t.pnlNum) || 0;
    if (!RULE_BREAK.has(t.type)) continue;
    out.ruleBreaks.count++; out.ruleBreaks.pnl += pnl;
    // Classify a rule break by its actual result, so older inconsistent labels can't show "toxic wins: −$21".
    const o = outcomeOf(pnl);
    if (o === 'win') { out.toxicWins.count++; out.toxicWins.pnl += pnl; }
    if (o === 'loss') { out.doubleFailures.count++; out.doubleFailures.pnl += pnl; }
  }
  for (const k of ['ruleBreaks', 'toxicWins', 'doubleFailures']) out[k].pnl = Math.round(out[k].pnl * 100) / 100;
  return out;
}

const money = (n) => `${n < 0 ? '−' : '+'}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

/** One short line for the headline, or null when nothing is labelled yet. */
export function habitHeadline(s) {
  if (!s.labeled) return null;
  if (!s.ruleBreaks.count) return { tone: 'good', text: `Clean so far: all ${plural(s.labeled, 'trade')} followed your plan.` };
  const parts = [];
  if (s.toxicWins.count) parts.push(`Toxic wins: ${plural(s.toxicWins.count, 'trade')}, ${money(s.toxicWins.pnl)} you can't count on`);
  if (s.doubleFailures.count) parts.push(`Double failures cost you ${money(s.doubleFailures.pnl)}`);
  if (!parts.length) parts.push(`${plural(s.ruleBreaks.count, 'rule break')}`);
  return { tone: 'warn', text: parts.join(' · ') };
}

// Outcome decides which two labels are possible; the only question for the trader is "did you follow your plan?"
// (same ±$5 breakeven band as normalizeTrade)
export function outcomeOf(pnl) {
  const n = Number(pnl) || 0;
  return n > 5 ? 'win' : n < -5 ? 'loss' : 'be';
}
const VALID = { win: ['win', 'toxic_win'], loss: ['good_loss', 'double_failure'], be: ['breakeven', 'toxic_be'] };
export const validLabelIds = (pnl) => VALID[outcomeOf(pnl)];
