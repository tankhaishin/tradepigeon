import express from 'express';

const router = express.Router();

// DISCORD WEBHOOK URL (Can also be set in environment variables VITE_DISCORD_WEBHOOK_URL / DISCORD_WEBHOOK_URL)
const DEFAULT_DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

/**
 * Helper to dispatch structured embed notifications to Discord Webhooks
 */
async function sendDiscordWebhook(webhookUrl, embedPayload) {
  const url = webhookUrl || DEFAULT_DISCORD_WEBHOOK_URL;
  if (!url) {
    console.warn('[Discord Webhook]: No webhook URL configured. Skipping notification.');
    return { success: false, reason: 'No Webhook URL' };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embedPayload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Discord Webhook Error]:', errText);
      return { success: false, error: errText };
    }

    return { success: true };
  } catch (err) {
    console.error('[Discord Webhook Exception]:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 1. DISCORD WEBHOOK: NEW USER SIGNUP / ONBOARDING NOTIFICATION
 * Route: POST /api/webhooks/discord/new-signup
 */
router.post('/new-signup', async (req, res) => {
  const { traderName, email, tradingStyle, strategyName, maxDailyLoss, brokerPlatform, webhookUrl } = req.body;

  const embedPayload = {
    username: "TradePigeon 2.0 Telemetry Bot",
    avatar_url: "https://raw.githubusercontent.com/tradepigeon/assets/main/parrot_logo.png",
    embeds: [
      {
        title: "🎉 NEW TRADER SIGNED UP!",
        description: `A new trader just completed their **TradePigeon 2.0** edge calibration protocol!`,
        color: 0x58CC02, // TradePigeon Brand Green
        fields: [
          { name: "👤 Trader Name", value: traderName || "New Operator", inline: true },
          { name: "📧 Email", value: email || "operator@tradepigeon.com", inline: true },
          { name: "⚙️ Methodology", value: tradingStyle || "Custom Strategy", inline: true },
          { name: "🛡️ Strategy Name", value: strategyName || "Strategy 1", inline: true },
          { name: "📉 Max Daily Risk Limit", value: maxDailyLoss || "$1,000", inline: true },
          { name: "🔌 Broker Platform", value: (brokerPlatform || "Tradovate").toUpperCase(), inline: true },
        ],
        footer: {
          text: "TradePigeon 2.0 Business Intelligence Engine • Real-time Webhook",
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  const result = await sendDiscordWebhook(webhookUrl, embedPayload);
  return res.json({ status: 'OK', sent: result.success });
});

/**
 * 2. DISCORD WEBHOOK: STRIPE SUBSCRIPTION / UPGRADE EVENT
 * Route: POST /api/webhooks/discord/subscription-success
 */
router.post('/subscription-success', async (req, res) => {
  const { traderName, planName, amount, currency, webhookUrl } = req.body;

  const embedPayload = {
    username: "TradePigeon VIP Sales Bot",
    avatar_url: "https://raw.githubusercontent.com/tradepigeon/assets/main/parrot_logo.png",
    embeds: [
      {
        title: "⚡ NEW PRO SUBSCRIPTION PURCHASED!",
        description: `**${traderName || 'Disciplined Trader'}** just upgraded to **${planName || 'TradePigeon Pro'}**!`,
        color: 0x58CC02, // TradePigeon Green
        fields: [
          { name: "💳 Plan", value: planName || "TradePigeon Pro ($29/mo)", inline: true },
          { name: "💰 Revenue", value: `$${amount || '29.00'} ${currency || 'USD'}`, inline: true },
          { name: "🔥 Status", value: "ACTIVE (Recurring)", inline: true },
        ],
        footer: {
          text: "Stripe Payment Gateway • Live Telemetry",
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  const result = await sendDiscordWebhook(webhookUrl, embedPayload);
  return res.json({ status: 'OK', sent: result.success });
});

/**
 * 3. GENERAL TELEMETRY DISPATCH PROXY
 * Route: POST /api/webhooks/discord/dispatch
 * Securely proxies client feedback, error telemetry, or signup alerts without exposing Discord webhook URL to frontend.
 */
router.post('/dispatch', async (req, res) => {
  const { title, description, color, fields, footerText, webhookUrl } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const embedPayload = {
    username: 'TradePigeon Bot',
    avatar_url: 'https://tradepigeon.com/favicon.svg',
    embeds: [
      {
        title,
        description: description || '',
        color: color || 0x1CB0F6,
        fields: Array.isArray(fields) ? fields : [],
        footer: {
          text: footerText || 'TradePigeon 2.0 Real-Time Telemetry'
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  const result = await sendDiscordWebhook(webhookUrl, embedPayload);
  return res.json({ status: 'OK', sent: result.success });
});

export default router;
