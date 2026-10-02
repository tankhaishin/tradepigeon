import { handleCors } from '../../utils/cors.js';

const DEFAULT_DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

async function sendDiscordWebhook(webhookUrl, embedPayload) {
  const url = webhookUrl || DEFAULT_DISCORD_WEBHOOK_URL;
  if (!url) {
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
      return { success: false, error: errText };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export default async function handler(req, res) {
  if (!handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const { title, description, color, fields, footerText, webhookUrl } = req.body || {};
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
          text: footerText || 'TradePigeon Real-Time Telemetry'
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  const result = await sendDiscordWebhook(webhookUrl, embedPayload);
  return res.json({ status: 'OK', sent: result.success });
}
