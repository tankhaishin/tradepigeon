/**
 * Dynamic Dialogue & Market Wizard Quote Bank for TradePigeon Companion
 * Clean, respectful, non-robotic trading friend tone with non-repeating smart rotation.
 */

export const MARKET_WIZARD_QUOTES = [
  { quote: "Win or lose, everybody gets what they want out of the market. Some people seem to like to lose, so they win by losing money.", author: "Ed Seykota" },
  { quote: "Elements of good trading: (1) Cutting losses, (2) Cutting losses, and (3) Cutting losses.", author: "Ed Seykota" },
  { quote: "It's not whether you're right or wrong that's important, but how much money you make when you're right and how much you lose when you're wrong.", author: "Stanley Druckenmiller" },
  { quote: "The key to trading success is emotional discipline. If intelligence were the key, there would be a lot more people making money trading.", author: "Victor Sperandeo" },
  { quote: "I always define my risk, and I don't have to worry about it.", author: "Tony Saliba" },
  { quote: "Don't focus on making money; focus on protecting what you have.", author: "Paul Tudor Jones" },
  { quote: "Rule #1: Never lose money. Rule #2: Never forget rule #1.", author: "Warren Buffett" }
];

export const DIALOGUE_BANK = {
  // Session Initial Greetings (Step 1 - Before selecting mood)
  initialGreeting: [
    "Welcome back, my friend! Select your mindset check so we can execute with absolute clarity today.",
    "Good to see you. Tell me how your head is feeling so we keep your risk parameters locked in.",
    "Ready for today's market session? Take a moment to log your mindset before taking any fills.",
    "Active session is open. Let's start with a quick mindset check to ensure high discipline today.",
    "Welcome! Clear heads build strong consistency. Select your emotional state before looking for entries."
  ],

  // REVENGE MOOD VARIATIONS
  revenge: [
    "High emotional energy detected. Let's drop your position size in half or step away so we protect your account for tomorrow.",
    "Wanting payback from a recent loss is completely human, but impulse entries will only drain your capital. Take 5 deep breaths.",
    "The market doesn't care about our last loss, my friend. Let's stick to your stop-loss rules and wait for a clean setup.",
    "Tilted energy hurts execution. Step back from the screen for 15 minutes to let your prefrontal cortex reset.",
    "Revenge mode flagged. Remember: protecting your capital today ensures you have edge and energy for tomorrow."
  ],

  // ANXIOUS / FOMO MOOD VARIATIONS
  anxious: [
    "Feeling jittery? Slow and steady. Missing a move costs $0, but chasing price can cost your entire account.",
    "FOMO is just an impulse. Take a deep breath and let the setup come to you at your defined price level.",
    "Anxious energy is your signal to slow down. Cut position size by 50% and wait for an A+ playbook pattern.",
    "Patience is your highest-margin edge. If you missed the initial entry, let it go and focus on the next clean structure.",
    "Remember, my friend: preserving capital during high volatility is just as valuable as a winning trade."
  ],

  // TIRED / FATIGUE MOOD VARIATIONS
  tired: [
    "Brain fog is real today. If fatigue is setting in, keep your execution ultra simple: 1 clean setup or no trades at all.",
    "Low energy often leads to low discipline. Set strict hard stop losses before taking any fill.",
    "Feeling tired? Consider taking a rest day or capping your total trades to 1 high-conviction playbook setup.",
    "Tired eyes miss subtle market shifts. Give yourself permission to trade small or sit on your hands today.",
    "Rest is a core part of long-term trading performance. Protect your equity when your focus isn't at 100%."
  ],

  // ZEN / FLOW STATE MOOD VARIATIONS
  zen: [
    "Laser-focused mindset! Execute your playbook with calm precision and let the market do the work.",
    "In the zone! Stay grounded, stick to your position sizing, and protect your capital at all times.",
    "Clear mind, sharp edge. Maintain your risk discipline for every fill you take today.",
    "Flow state active! Trust your process, respect your stops, and let profits take care of themselves.",
    "Ideal mindset for execution. Stay patient and execute only when your exact rules are met."
  ],

  // STEP 2: LIVE COCKPIT VARIATIONS
  step2: [
    "Equity cockpit live! Keep a close eye on your risk parameters and protect your gains.",
    "Your live P&L is tracking. Stay grounded—strong morning performance requires disciplined risk control.",
    "Session trajectory updated. Remember to protect what you've earned and avoid over-trading.",
    "P&L parameters locked. Execute your playbook and don't let green trades turn into unmanaged losses.",
    "Cockpit active. Maintain consistent risk management through the end of the session."
  ],

  // STEP 3: SETUP TAGGING VARIATIONS
  step3: [
    "Tag your executions now. Documenting your setup proof is how you refine your true trading edge.",
    "Audit your fills for the session. What gets measured gets managed and improved over time.",
    "Tag the exact playbook strategy used for each entry. Clear documentation builds long-term confidence.",
    "Attach your chart screenshots and setup tags. Honest accountability separates real pros from amateur gamblers.",
    "Log your trade details while execution rationale is fresh in your mind."
  ],

  // STEP 4: VAULT LOCK DEBRIEF VARIATIONS
  step4: [
    "Session closed! Answer your post-session audit questions to lock in your consistency index for +150 DP.",
    "Time for post-session reflection: did you follow your stop-loss and position sizing rules today?",
    "Vault ready for lock! Log your honest review so we can track your true behavioral progress over time.",
    "Market complete for the day. Complete your debrief to seal your daily discipline record.",
    "Final step for today: reflect on your execution quality to earn your +150 Discipline Points."
  ],

  // COMPLETED ALL STEPS VARIATIONS
  completed: [
    "Protocol sealed! You earned +300 Discipline Points today. Exceptional adherence to your trading plan!",
    "All steps locked for the day! You executed with professional risk control today, my friend.",
    "Session complete! Your account rules were protected and +300 DP has been credited to your index.",
    "Flawless daily audit! Rest up, recharge, and we will execute with the same clarity tomorrow.",
    "Consistency milestone achieved! Your daily discipline vault is securely locked for the session."
  ]
};

// Memory store to prevent returning the same quote twice in a row
const lastPickedIndices = {};

export function getRandomDialogue(key) {
  const list = DIALOGUE_BANK[key];
  if (!list || list.length === 0) return "";
  
  if (list.length === 1) return list[0];

  const lastIdx = lastPickedIndices[key] !== undefined ? lastPickedIndices[key] : -1;
  let nextIdx;
  do {
    nextIdx = Math.floor(Math.random() * list.length);
  } while (nextIdx === lastIdx && list.length > 1);

  lastPickedIndices[key] = nextIdx;
  return list[nextIdx];
}

export function getRandomMarketWizardQuote() {
  return MARKET_WIZARD_QUOTES[Math.floor(Math.random() * MARKET_WIZARD_QUOTES.length)];
}

