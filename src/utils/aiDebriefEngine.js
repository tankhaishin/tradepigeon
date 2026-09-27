import { formatFinancialCurrency, parseFinancialNumber } from './financialMath.js';

// Helper to build a comprehensive 3-part institutional trading audit
export function generateIntelligentSessionDebrief({
  trades = [],
  emotion = 'disciplined',
  followedPlan = true,
  selectedMood = 'Neutral',
  notes = ''
}) {
  const totalTrades = trades.length;
  let netPnl = 0;
  let winCount = 0;
  let lossCount = 0;
  let beCount = 0;
  let toxicWinCount = 0;
  let toxicBeCount = 0;
  let doubleFailureCount = 0;
  let missedCount = 0;
  let totalR = 0;
  const hesitationReasons = [];

  trades.forEach(t => {
    const pnl = parseFinancialNumber(t.pnlNum !== undefined ? t.pnlNum : t.pnlValue !== undefined ? t.pnlValue : t.pnl, 0);
    netPnl += pnl;

    const r = parseFinancialNumber(t.rMultiple !== undefined ? t.rMultiple : t.r !== undefined ? t.r : t.rmult, 0);
    totalR += r;

    const rawType = (t.type || '').toLowerCase();
    const execType = (t.executionType || '').toLowerCase();
    const hasBreach = t.followedRules === false || t.violated === true || t.violatedRules === true ||
      rawType.includes('toxic') || rawType.includes('violate') || rawType.includes('double_failure') || rawType.includes('double failure') ||
      execType.includes('toxic') || execType.includes('double failure');

    if (rawType.includes('missed') || execType.includes('missed')) {
      missedCount++;
    } else if (hasBreach) {
      if (rawType.includes('win') || execType.includes('win') || (pnl > 5 && !rawType.includes('loss') && !execType.includes('loss'))) {
        toxicWinCount++;
      } else if (rawType.includes('loss') || rawType.includes('double') || execType.includes('loss') || execType.includes('double') || pnl < -5) {
        doubleFailureCount++;
      } else {
        toxicBeCount++;
      }
    } else {
      if (rawType === 'win' || rawType.includes('win') || execType.includes('win') || (pnl > 5 && !rawType.includes('loss') && !execType.includes('loss'))) {
        winCount++;
      } else if (rawType === 'good_loss' || rawType.includes('loss') || execType.includes('loss') || pnl < -5) {
        lossCount++;
      } else {
        beCount++;
      }
    }

    if (t.reason) hesitationReasons.push(t.reason);
  });

  const ruleBreaks = toxicWinCount + toxicBeCount + doubleFailureCount;
  const pnlStr = formatFinancialCurrency(netPnl, { showPlus: true });
  const rStr = totalR >= 0 ? `+${totalR.toFixed(1)}R` : `${totalR.toFixed(1)}R`;

  // 1. Execution Integrity Diagnosis
  let integrityAnalysis = "";
  if (totalTrades === 0) {
    integrityAnalysis = "Zero trades executed today. Preserving capital and waiting patiently when market conditions lack valid playbook criteria is a core discipline edge.";
  } else if (ruleBreaks > 0 || !followedPlan) {
    const breaches = ruleBreaks > 0 ? ruleBreaks : 1;
    integrityAnalysis = `Plan deviation detected across ${breaches} of ${totalTrades} execution(s) (Net Realized: ${pnlStr}, ${rStr}). ${
      toxicWinCount > 0
        ? `${toxicWinCount} toxic win(s) logged—winning while breaking rules reinforces dangerous habits that cause large future drawdowns. `
        : ""
    }${
      doubleFailureCount > 0
        ? `${doubleFailureCount} double failure(s) logged where playbook rules were breached AND risk capital was lost. `
        : ""
    }${
      toxicBeCount > 0
        ? `${toxicBeCount} toxic breakeven(s) logged where rules were broken despite avoiding financial loss. `
        : ""
    }Process discipline must take absolute precedence over short-term PnL.`;
  } else {
    integrityAnalysis = `Flawless execution integrity verified across ${totalTrades} trade(s) (Net Realized: ${pnlStr}, ${rStr}). ${
      winCount > 0 ? `${winCount} disciplined win(s) ` : ""
    }${lossCount > 0 ? `and ${lossCount} valid stop-loss(es) taken cleanly ` : ""}${beCount > 0 ? `and ${beCount} breakeven(s) ` : ""}with zero unauthorized deviations. Risk boundaries were strictly maintained.`;
  }

  // 2. Psychological & Cognitive Bias Diagnosis
  let psychAnalysis = "";
  const moodContext = selectedMood && selectedMood !== 'Neutral' ? ` (Pre-session mindset: ${selectedMood})` : "";
  if (emotion === 'revenge') {
    psychAnalysis = `Revenge impulse state active${moodContext}. An emotional urge to quickly win back capital after a loss overrides risk protocols and mathematical expectancy. Step away immediately.`;
  } else if (emotion === 'fomo') {
    psychAnalysis = `FOMO tension detected${moodContext}. Entering late or chasing moves indicates anxiety over missed opportunities. Remember: markets produce high-probability setups every week.`;
  } else if (emotion === 'anxious') {
    psychAnalysis = `Heightened anxiety observed${moodContext}. Execution friction usually stems from position sizing being too large for your risk tolerance. Dial back contracts to stay detached.`;
  } else {
    psychAnalysis = `Disciplined mindset maintained${moodContext}. Objective, calm execution maintained through both wins and losses. Process-driven focus protects long-term longevity.`;
  }

  if (hesitationReasons.length > 0 || missedCount > 0) {
    const uniqueReasons = [...new Set(hesitationReasons)];
    const reasonLabels = uniqueReasons.map(r => {
      if (r === 'fear') return 'post-loss fear';
      if (r === 'paralysis') return 'over-analysis paralysis';
      if (r === 'fast_move') return 'price velocity panic';
      if (r === 'distracted') return 'screen distraction';
      if (r === 'rules') return 'rule ambiguity';
      return r;
    }).join(', ');
    psychAnalysis += ` ${missedCount > 0 ? `${missedCount} setup(s) missed due to hesitation.` : ''} Identified execution friction: ${reasonLabels || 'hesitation'}. Hesitation occurs when traders confuse single-trade uncertainty with long-term edge invalidity.`;
  }

  // 3. Tactical Directives for Tomorrow
  const directives = [];
  directives.push("Pre-Flight Gate: Complete and lock your binary playbook checklist before taking trade #1.");
  if (!followedPlan || ruleBreaks > 0) {
    directives.push("Position Sizing: Cut contract sizing by 50% (or trade 1 Micro contract) until 3 consecutive 100% compliant sessions are logged.");
    directives.push("Circuit Breaker: Enforce a mandatory 20-minute walk away from all screens immediately following any stop-out.");
  } else {
    directives.push("Position Sizing: Maintain static risk sizing. Do NOT escalate contract size following profitable days.");
    directives.push("Execution Trigger: Continue executing immediately upon playbook criteria alignment without waiting for 'extra confirmation'.");
  }

  if (notes && notes.trim().length > 0) {
    directives.push(`Trader Focus Note: "${notes.trim()}"`);
  }

  return `[1. EXECUTION INTEGRITY AUDIT]\n${integrityAnalysis}\n\n[2. PSYCHOLOGICAL BIAS & FRICTION]\n${psychAnalysis}\n\n[3. ACTION DIRECTIVES FOR TOMORROW]\n• ${directives.join('\n• ')}`;
}
