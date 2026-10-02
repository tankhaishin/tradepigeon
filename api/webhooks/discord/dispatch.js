import { handleCors } from '../../_lib/cors.js';
import { verifyUser } from '../../_lib/account.js';

const DEFAULT_DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

async function sendDiscordWebhook(embedPayload) {
  // Only ever posts to the owner's own webhook; user webhooks are called directly from the browser.
  const url = DEFAULT_DISCORD_WEBHOOK_URL;
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

  if (!(await verifyUser(req))) return res.status(401).json({ error: 'Please sign in again.' });

  const { title, description, color, fields, footerText } = req.body || {};
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

  const result = await sendDiscordWebhook(embedPayload);
  return res.json({ status: 'OK', sent: result.success });
}
