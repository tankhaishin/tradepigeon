import { handleCors } from '../utils/cors.js';
import { generateRiskAlertHtml } from '../../server/routes/email.js';

const resendApiKey = process.env.RESEND_API_KEY || '';

export default async function handler(req, res) {
  if (!handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const {
    recipientEmail,
    traderName,
    alertType,
    currentLoss,
    maxLimit,
    symbol,
    consecutiveLosses,
    recommendedAction
  } = req.body || {};

  if (!recipientEmail || typeof recipientEmail !== 'string') {
    return res.status(400).json({ error: 'Valid recipientEmail is required.' });
  }

  if (!resendApiKey) {
    return res.json({
      success: true,
      isMock: true,
      message: 'Risk alert simulated (set RESEND_API_KEY for live delivery).'
    });
  }

  try {
    const html = generateRiskAlertHtml({
      traderName,
      alertType,
      currentLoss,
      maxLimit,
      symbol,
      consecutiveLosses,
      recommendedAction
    });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.SENDER_EMAIL || 'TradePigeon Risk Engine <alerts@tradepigeon.com>',
        to: [recipientEmail],
        subject: `⚠️ URGENT RISK LOCKOUT: ${alertType || 'Daily Max Loss Approaching'}`,
        html
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Resend API error', details: errText });
    }

    const data = await response.json();
    return res.json({ success: true, messageId: data.id });
  } catch (error) {
    console.error('[Vercel Email Risk Alert Error]:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
