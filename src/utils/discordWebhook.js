// TradePigeon 2.0 — Discord Webhook & Real-Time Event Dispatcher Engine

const DEFAULT_DISCORD_WEBHOOK = import.meta.env.VITE_DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1545026133425258582/imLEdPgYxqkew82A0HQA-mCiNk4UeApf31u3bbTNMVibLMRjiLn_-wJ67oFmDam_5htO';

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
  if (!webhookUrl) {
    console.warn('[Discord Webhook]: No VITE_DISCORD_WEBHOOK_URL specified in environment. Logged locally:', { title, description, fields });
    return false;
  }

  const payload = {
    username: 'TradePigeon Bot',
    avatar_url: 'https://tradepigeon.io/parrot_logo.png',
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
      console.log('[Discord Webhook]: Successfully dispatched alert:', title);
      return true;
    } else {
      console.error('[Discord Webhook Error]: Received status', response.status);
      return false;
    }
  } catch (error) {
    console.error('[Discord Webhook Exception]: Failed to send notification:', error);
    return false;
  }
}

/**
 * Specifically dispatches trader feedback & bug reports submitted from SupportFeedbackModal
 */
export async function sendDiscordFeedbackAlert({ type, rating, message, email }) {
  const typeColorMap = {
    BUG: 0xFF4B4B,    // Red for Bugs
    FEATURE: 0x1CB0F6, // Blue for Feature Ideas
    GENERAL: 0xFF6B00  // Orange for General Feedback
  };

  const stars = '⭐'.repeat(rating || 5);
  const color = typeColorMap[type] || 0x1CB0F6;

  return sendDiscordWebhookMessage({
    title: `📩 New Trader ${type === 'BUG' ? 'Bug Report' : type === 'FEATURE' ? 'Feature Idea' : 'Feedback'}`,
    description: message || 'No message content provided.',
    color: color,
    fields: [
      { name: 'Category', value: type, inline: true },
      { name: 'Rating', value: stars, inline: true },
      { name: 'Trader Email', value: email || 'Anonymous / Unspecified', inline: true }
    ],
    footerText: 'TradePigeon 2.0 Support Engine'
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
  const communityWebhookUrl = import.meta.env.VITE_DISCORD_COMMUNITY_WEBHOOK_URL || DEFAULT_DISCORD_WEBHOOK;
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

/**
 * Dispatches a 1-tap user scorecard share to Discord
 */
export async function sendDiscordScorecardShare({ username, winRate, disciplineScore, netPnl, streak }) {
  const communityWebhookUrl = import.meta.env.VITE_DISCORD_COMMUNITY_WEBHOOK_URL || DEFAULT_DISCORD_WEBHOOK;
  return sendDiscordWebhookMessage({
    webhookUrl: communityWebhookUrl,
    title: `📊 Daily Playbook Scorecard — ${username || 'Trader'}`,
    description: `Verified execution telemetry scorecard from TradePigeon 2.0.`,
    color: 0x1CB0F6, // TradePigeon Blue
    fields: [
      { name: 'Discipline Score', value: `🎯 ${disciplineScore || 98}%`, inline: true },
      { name: 'Win Rate', value: `📈 ${winRate || '68%'}`, inline: true },
      { name: 'Session Net P&L', value: `💰 ${netPnl || '+$1,450.00'}`, inline: true },
      { name: 'Streak Guard', value: `🔥 ${streak || 7} Days`, inline: true }
    ],
    footerText: 'TradePigeon Verified Telemetry Audit'
  });
}
