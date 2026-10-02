import { authHeaders } from './proStatus.js';
const DEFAULT_DISCORD_WEBHOOK = import.meta.env?.VITE_DISCORD_WEBHOOK_URL || '';

let lastDispatchTimestamp = 0;
const MIN_DISPATCH_INTERVAL_MS = 1500;

/**
 * Sends a rich Discord Embed notification to your admin Discord channel
 */
export async function sendDiscordWebhookMessage({
  webhookUrl = DEFAULT_DISCORD_WEBHOOK,
  title,
  description,
  color = 0x1CB0F6, // TradePigeon Blue hex (1880310 in decimal)
  fields = [],
  footerText = 'TradePigeon 2.0 Real-Time Telemetry'
}) {
  // Network offline safety check
  if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) {
    return false;
  }

  // 1. Primary: Secure backend proxy dispatch (keeps webhook token strictly on the server)
  if (typeof window !== 'undefined' && (!webhookUrl || webhookUrl === DEFAULT_DISCORD_WEBHOOK)) {
    try {
      const proxyRes = await fetch('/api/webhooks/discord/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ title, description, color, fields, footerText })
      });
      if (proxyRes.ok) {
        return true;
      }
    } catch (_) {
      // Fall through to direct dispatch if backend proxy is offline
    }
  }

  if (!webhookUrl) {
    if (import.meta.env?.DEV) {
      console.log('[Discord Webhook (Local Dev)]:', { title, description, fields });
    }
    return false;
  }

  // Rate-limiting throttle to prevent Discord HTTP 429
  const now = Date.now();
  const timeSinceLast = now - lastDispatchTimestamp;
  if (timeSinceLast < MIN_DISPATCH_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_DISPATCH_INTERVAL_MS - timeSinceLast));
  }
  lastDispatchTimestamp = Date.now();

  const payload = {
    username: 'TradePigeon Bot',
    avatar_url: 'https://tradepigeon.com/favicon.svg',
    embeds: [
      {
        title: title,
        description: description,
        color: color,
        fields: fields,
        footer: {
          text: footerText
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      return true;
    } else if (response.status === 429) {
      console.warn('[Discord Webhook]: Rate limited (429). Backing off.');
      lastDispatchTimestamp = Date.now() + 5000;
      return false;
    } else {
      console.warn('[Discord Webhook Notice]: Received status', response.status);
      return false;
    }
  } catch (error) {
    console.warn('[Discord Webhook Notice]: Failed to send notification:', error?.message || error);
    return false;
  }
}

/**
 * Specifically dispatches trader feedback & bug reports submitted from SupportFeedbackModal
 */
export async function sendDiscordFeedbackAlert({ type, rating, message, email, diagnosticSnapshot = null }) {
  const typeColorMap = {
    BUG: 0xFF4B4B,     // Red for Bugs
    FEATURE: 0x1CB0F6, // Blue for Feature Ideas
    GENERAL: 0xFF6B00, // Orange for General Feedback
    ACCOUNT: 0xCE82FF  // Purple for Billing/Account
  };

  const stars = '⭐'.repeat(rating || 5);
  const color = typeColorMap[type] || 0x1CB0F6;

  const fields = [
    { name: 'Category', value: type, inline: true },
    { name: 'Rating', value: stars, inline: true },
    { name: 'Trader Email', value: email || 'Anonymous / Unspecified', inline: true }
  ];

  if (diagnosticSnapshot) {
    fields.push({
      name: 'System Telemetry',
      value: `App: v${diagnosticSnapshot.appVersion || '2.1.0'} | Screen: ${diagnosticSnapshot.screenResolution || 'N/A'}\nStorage: ${diagnosticSnapshot.storageQuota?.usedKb || 0} KB (${diagnosticSnapshot.storageQuota?.itemsCount || 0} keys)`,
      inline: false
    });
    if (diagnosticSnapshot.recentErrorsCount > 0) {
      fields.push({
        name: 'Recent Errors',
        value: `Total: ${diagnosticSnapshot.recentErrorsCount} | Last: ${diagnosticSnapshot.recentErrors?.[0]?.message?.slice(0, 100) || 'None'}`,
        inline: false
      });
    }
  }

  return sendDiscordWebhookMessage({
    title: `📩 New Trader ${type === 'BUG' ? 'Bug Report' : type === 'FEATURE' ? 'Feature Idea' : type === 'ACCOUNT' ? 'Account Inquiry' : 'Feedback'}`,
    description: message || 'No message content provided.',
    color: color,
    fields: fields,
    footerText: 'TradePigeon Institutional Support Desk'
  });
}

/**
 * Dispatches live sales alerts when a trader upgrades to Pro via Stripe
 */
export async function sendDiscordSaleAlert({ userEmail, planName, amount }) {
  return sendDiscordWebhookMessage({
    title: '🎉 New Pro Trader Subscription!',
    description: `A trader has just unlocked **TradePigeon Pro**!`,
    color: 0x58CC02, // Duolingo/Pigeon Green
    fields: [
      { name: 'Plan', value: planName || 'Pro Monthly', inline: true },
      { name: 'Amount', value: `$${amount || '9.99'}`, inline: true },
      { name: 'User', value: userEmail || 'Subscriber', inline: true }
    ],
    footerText: 'TradePigeon Revenue Engine'
  });
}

/**
 * Dispatches real-time alerts when a new trader completes onboarding / sign up
 */
export async function sendDiscordSignupAlert({ username, strategy, experience, email }) {
  return sendDiscordWebhookMessage({
    title: '🐣 New Trader Joined TradePigeon!',
    description: `A new operator has completed onboarding and initiated their behavioral protocol.`,
    color: 0xFFC800, // Gold/Yellow
    fields: [
      { name: 'Trader Handle', value: username || 'New Trader', inline: true },
      { name: 'Playbook Strategy', value: strategy || 'Multi-Asset Expectancy', inline: true },
      { name: 'Experience Tier', value: experience || 'Active Trader', inline: true },
      { name: 'Trader Email', value: email || 'Anonymous / Local', inline: true }
    ],
    footerText: 'TradePigeon 2.0 Telemetry Engine'
  });
}

/**
 * Dispatches community milestone alerts when a trader hits a major streak or leaderboard win
 */
export async function sendDiscordLeaderboardMilestoneAlert({ username, streak, dp, league }) {
  const communityWebhookUrl = import.meta.env?.VITE_DISCORD_COMMUNITY_WEBHOOK_URL || DEFAULT_DISCORD_WEBHOOK;
  return sendDiscordWebhookMessage({
    webhookUrl: communityWebhookUrl,
    title: `🔥 Streak Milestone Unlocked: ${streak} Days!`,
    description: `Trader **${username || 'Trader'}** has maintained 100% flawless execution discipline!`,
    color: 0xFF6B00, // Orange Flame
    fields: [
      { name: 'Active Streak', value: `🔥 ${streak || 1} Days`, inline: true },
      { name: 'Discipline Points', value: `⚡ ${dp || 0} DP`, inline: true },
      { name: 'League Rank', value: `🏆 ${league || 'Diamond League'}`, inline: true }
    ],
    footerText: 'TradePigeon 2.0 Community Discipline Feed'
  });
}
