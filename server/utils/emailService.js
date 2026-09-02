/**
 * Transactional Email Helper for TradePigeon 2.0
 * Supports Resend, SendGrid, or SMTP for welcome emails & receipt notifications.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'TradePigeon <support@tradepigeon.io>';

/**
 * Send Welcome Email on New Signups
 */
export async function sendWelcomeEmail(userEmail, userName = 'Trader') {
  if (!RESEND_API_KEY) {
    console.log(`[Email Mock]: Welcome email queued for ${userEmail} (Resend API Key missing - set RESEND_API_KEY to send live).`);
    return { success: true, isMock: true };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: [userEmail],
        subject: 'Welcome to TradePigeon — Built for Prop Trader Survival 🚀',
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #070C1E; color: #FFFFFF; padding: 30px; borderRadius: 16px;">
            <h1 style="color: #FF6B00; margin-bottom: 10px;">Welcome to TradePigeon, ${userName}! 👋</h1>
            <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">
              You have taken the first step toward process-first discipline. TradePigeon is engineered to separate true strategy edge from toxic lucky wins.
            </p>
            <div style="background-color: #0D1635; border: 2px solid #1C2A4E; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #58CC02; margin-top: 0;">🚀 Quick Start Checklist:</h3>
              <ul style="color: #F1F5F9; font-size: 13px; padding-left: 20px; line-height: 1.8;">
                <li>Set your Daily Loss Limit cap in the Session Cockpit.</li>
                <li>Tag your setup playbook criteria on every trade.</li>
                <li>Complete your 60-second pre-market risk quiz daily.</li>
              </ul>
            </div>
            <a href="https://app.tradepigeon.io" style="background-color: #FF6B00; color: #FFFFFF; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">
              Launch Session Cockpit →
            </a>
          </div>
        `
      })
    });

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('[Email Error]: Failed to send welcome email:', error.message);
    return { success: false, error: error.message };
  }
}
