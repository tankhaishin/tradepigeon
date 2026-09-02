/**
 * Dynamic Dialogue & Market Wizard Quote Bank for TradeParrot Companion
 */

export const MARKET_WIZARD_QUOTES = [
  { quote: "Win or lose, everybody gets what they want out of the market. Some people seem to like to lose, so they win by losing money.", author: "Ed Seykota (Market Wizard)" },
  { quote: "Elements of good trading: (1) Cutting losses, (2) Cutting losses, and (3) Cutting losses.", author: "Ed Seykota" },
  { quote: "It’s not whether you’re right or wrong that’s important, but how much money you make when you’re right and how much you lose when you’re wrong.", author: "Stanley Druckenmiller" },
  { quote: "The key to trading success is emotional discipline. If intelligence were the key, there would be a lot more people making money trading.", author: "Victor Sperandeo" },
  { quote: "I always define my risk, and I don't have to worry about it.", author: "Tony Saliba" },
  { quote: "Don't focus on making money; focus on protecting what you have.", author: "Paul Tudor Jones" },
  { quote: "Rule #1: Never lose money. Rule #2: Never forget rule #1.", author: "Warren Buffett" }
];

export const DIALOGUE_BANK = {
  // Session Initial Greetings (Step 1 - Before selecting mood)
  initialGreeting: [
    "Yo! The market session is live. Tap your mindset choice so we don't do anything stupid today.",
    "Sup Trader! Active session is open. Pick your mindset check before taking any fills.",
    "Ready to execute? Tell me where your head is at right now so I can keep you out of trouble.",
    "Let's get it! Tap your mindset check. High discipline, zero emotion today."
  ],

  // REVENGE MOOD VARIATIONS
  revenge: [
    "Woah bro... angry revenge mode?! Don't be stupid today man. Breathe, drop position size, or I'm locking your account!",
    "Hold up! Tilted and wanting payback from the market? That's a 1-way ticket to blowing your prop challenge. Take 5 deep breaths!",
    "Easy tiger! The market doesn't care about your last loss. Revenge trading will destroy your account discipline. Cool down man!",
    "Revenge mode active?! Drop size to 0.25R right now. No emotional revenge bets on my watch!"
  ],

  // ANXIOUS / FOMO MOOD VARIATIONS
  anxious: [
    "Feeling jittery? Slow and steady man. Don't you dare overtrade or chase candles. Stick to the plan.",
    "FOMO creeping in? Remember: missing a move costs $0. Chasing a move costs your entire account. Wait for your setup!",
    "Breathe man. The market will be here tomorrow. Drop your lot size in half and let the setup come to you.",
    "Anxious energy detected! Do NOT chase candles. If you missed the entry, let it go. Patience makes P&L!"
  ],

  // TIRED / FATIGUE MOOD VARIATIONS
  tired: [
    "Low energy? Drink some coffee and don't take dumb setups. Less is more today bro.",
    "Brain fog is real. If you're fatigued, take a max of 1 A+ setup today. Zero micro-scalping!",
    "Yawning at the charts? Low energy means low discipline. Set strict stop losses and don't overtrade man.",
    "Tired eyes miss key levels. Keep it ultra simple today: 1 clean setup or no trades at all."
  ],

  // ZEN / FLOW STATE MOOD VARIATIONS
  zen: [
    "In the zone! Now that's what I'm talking about. Lock it in and let's execute with zero emotion.",
    "Flow state active! Clear head, sharp edge. Execute your playbook with surgical precision today man.",
    "Zen mindset! Perfect. Stick to your risk rules and let the market pay you.",
    "Pure laser focus! No FOMO, no fear. Execute like an institutional algorithm today!"
  ],

  // STEP 2: LIVE COCKPIT VARIATIONS
  step2: [
    "Nice! Check your live P&L below. Remember bro: don't give back your morning gains to the market.",
    "Equity cockpit live! Keep an eye on your risk parameters. Protect your capital at all costs.",
    "Look at those numbers! Stay grounded man — big green days are when traders get arrogant and give it all back.",
    "P&L trajectory updated! Maintain your risk discipline for the rest of the session."
  ],

  // STEP 3: SETUP TAGGING VARIATIONS
  step3: [
    "Tag your setups and upload chart proof. No ghost trades allowed on my watch!",
    "Bulk tag your executions right now! Accountability is what separates 99% of losers from prop pros.",
    "Time to audit your fills! Tag the exact strategy edge you used for each trade.",
    "Attach your chart screenshots man! What gets measured gets managed."
  ],

  // STEP 4: VAULT LOCK DEBRIEF VARIATIONS
  step4: [
    "Session finished! Time for truth: did you stick to your risk rules or did you tilt?",
    "Market closed! Answer the golden question to seal your daily P&L vault for +150 DP.",
    "Truth time bro: did you execute with flawless discipline today or did you break rules?",
    "Vault ready for lock! Answer honestly so we can log your real daily consistency index."
  ],

  // COMPLETED ALL STEPS VARIATIONS
  completed: [
    "Protocol sealed! You earned +300 DP (Discipline Points) today. Proud of you man, flawless discipline!",
    "Boom! All steps locked for the day. You executed like a true Market Wizard today bro!",
    "Session complete! You protected your account rules and earned 300 DP. Enjoy your evening man!",
    "Flawless execution! Vault is sealed. Rest up and we'll do it all over again tomorrow!"
  ]
};

export function getRandomDialogue(key) {
  if (DIALOGUE_BANK[key]) {
    const list = DIALOGUE_BANK[key];
    return list[Math.floor(Math.random() * list.length)];
  }
  return "";
}

export function getRandomMarketWizardQuote() {
  return MARKET_WIZARD_QUOTES[Math.floor(Math.random() * MARKET_WIZARD_QUOTES.length)];
}
