import express from 'express';

const router = express.Router();
const isProduction = process.env.NODE_ENV === 'production';
const resendApiKey = process.env.RESEND_API_KEY || '';

/**
 * Generates an institutional responsive HTML template for Daily Discipline Briefings
 */
export function generateDailyBriefingHtml({
  traderName = 'Trader',
  date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  grade = 'A',
  netPnl = '+$450.00',
  rMultiple = '+1.3 R',
  winRate = '67%',
  rulesAdherence = '100%',
  streakDays = 5,
  keyTakeaway = 'Consistent discipline maintained. Zero rule violations in midday chop.'
}) {
  const isPositive = !netPnl.startsWith('-');
  const pnlColor = isPositive ? '#58CC02' : '#FF4B4B';
  const gradeColor = grade.startsWith('A') ? '#58CC02' : grade.startsWith('B') ? '#1CB0F6' : grade.startsWith('C') ? '#FF9600' : '#FF4B4B';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TradePigeon Daily Briefing</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070C1E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #070C1E; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #0D1635; border: 2px solid #20325C; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 28px 32px; background-color: #14203E; border-bottom: 2px solid #20325C;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 11px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; color: #1CB0F6;">POST-MARKET DISCIPLINE REPORT</span>
                    <h1 style="margin: 6px 0 0 0; font-size: 22px; font-weight: 900; color: #FFFFFF;">Daily Trading Debrief</h1>
                    <span style="font-size: 12px; font-weight: 700; color: #788B96;">${date} &bull; ${traderName}</span>
                  </td>
                  <td align="right" valign="top">
                    <!-- Streak Pill -->
                    <div style="display: inline-block; background-color: rgba(255, 107, 0, 0.15); border: 1px solid rgba(255, 107, 0, 0.4); border-radius: 12px; padding: 6px 12px; text-align: center;">
                      <span style="font-size: 16px;">🔥</span>
                      <span style="font-size: 13px; font-weight: 900; color: #FF6B00; margin-left: 4px;">${streakDays} Days</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Core Performance Metrics Grid -->
          <tr>
            <td style="padding: 28px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <!-- Grade Box -->
                  <td width="30%" align="center" style="background-color: #14203E; border: 2px solid #20325C; border-radius: 18px; padding: 18px 8px;">
                    <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #788B96; letter-spacing: 1px;">Execution</div>
                    <div style="font-size: 32px; font-weight: 900; color: ${gradeColor}; margin: 4px 0;">${grade}</div>
                    <div style="font-size: 10px; font-weight: 700; color: #A0B2C6;">Grade</div>
                  </td>
                  <td width="5%"></td>
                  <!-- Net PnL Box -->
                  <td width="65%" style="background-color: #14203E; border: 2px solid #20325C; border-radius: 18px; padding: 18px 20px;">
                    <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #788B96; letter-spacing: 1px;">Net Realized PnL</div>
                    <div style="font-size: 26px; font-weight: 900; font-family: monospace; color: ${pnlColor}; margin: 4px 0;">${netPnl}</div>
                    <div style="font-size: 11px; font-weight: 800; color: #FF6B00;">${rMultiple} Expectancy</div>
                  </td>
                </tr>
              </table>

              <!-- Secondary Stats Row -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 14px;">
                <tr>
                  <td width="48%" style="background-color: #14203E; border: 1px solid #20325C; border-radius: 14px; padding: 12px 16px;">
                    <span style="font-size: 10px; font-weight: 800; color: #788B96; text-transform: uppercase;">Win Rate:</span>
                    <span style="font-size: 13px; font-weight: 900; color: #FFFFFF; float: right;">${winRate}</span>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background-color: #14203E; border: 1px solid #20325C; border-radius: 14px; padding: 12px 16px;">
                    <span style="font-size: 10px; font-weight: 800; color: #788B96; text-transform: uppercase;">Plan Adherence:</span>
                    <span style="font-size: 13px; font-weight: 900; color: #58CC02; float: right;">${rulesAdherence}</span>
                  </td>
                </tr>
              </table>

              <!-- Key Behavioral Takeaway -->
              <div style="margin-top: 20px; padding: 16px 20px; background-color: rgba(28, 176, 246, 0.08); border: 1px solid rgba(28, 176, 246, 0.25); border-radius: 16px;">
                <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #1CB0F6; letter-spacing: 1px; margin-bottom: 4px;">KEY TAKEAWAY</div>
                <div style="font-size: 13px; font-weight: 700; color: #E2E8F0; line-height: 1.5;">${keyTakeaway}</div>
              </div>

              <!-- CTA Button -->
              <div style="margin-top: 28px; text-align: center;">
                <a href="https://tradepigeon.com" target="_blank" style="display: inline-block; background-color: #58CC02; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; padding: 14px 32px; border-radius: 16px; border-bottom: 4px solid #388202; box-shadow: 0 4px 12px rgba(88, 204, 2, 0.3);">
                  View Full Journal &amp; Playbooks &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #070C1E; border-top: 1px solid #20325C; text-align: center;">
              <p style="margin: 0; font-size: 10px; font-weight: 700; color: #52656D; line-height: 1.5;">
                TradePigeon institutional trader discipline tracker.<br/>
                To update your alert preferences, visit your Profile settings.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generates an institutional responsive HTML template for Emergency Risk Breach Alerts
 */
export function generateRiskAlertHtml({
  traderName = 'Trader',
  account = 'Apex-01',
  breachType = 'Max Daily Loss Limit Breached',
  currentLoss = '-$850.00',
  lossLimit = '$500.00',
  actionTaken = 'Trading lockdown initiated. Steer clear of revenge trades.'
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>CRITICAL RISK BREACH</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070C1E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #FFFFFF;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #1A0D14; border: 2px solid #FF4B4B; border-radius: 24px; overflow: hidden;">
          <tr>
            <td style="padding: 24px 32px; background-color: rgba(255, 75, 75, 0.15); border-bottom: 2px solid #FF4B4B;">
              <span style="font-size: 11px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; color: #FF4B4B;">⚠️ URGENT RISK TELEMETRY</span>
              <h1 style="margin: 6px 0 0 0; font-size: 20px; font-weight: 900; color: #FFFFFF;">${breachType}</h1>
              <span style="font-size: 12px; font-weight: 700; color: #FFA3A3;">Target Account: ${account} &bull; ${traderName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 32px;">
              <div style="background-color: #140A10; border: 1px solid rgba(255, 75, 75, 0.3); border-radius: 16px; padding: 18px;">
                <table width="100%">
                  <tr>
                    <td style="font-size: 12px; color: #A0AEC0;">Current Realized Loss:</td>
                    <td align="right" style="font-size: 16px; font-weight: 900; font-family: monospace; color: #FF4B4B;">${currentLoss}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 12px; color: #A0AEC0;">Configured Daily Limit:</td>
                    <td align="right" style="font-size: 16px; font-weight: 900; font-family: monospace; color: #FFFFFF;">${lossLimit}</td>
                  </tr>
                </table>
              </div>
              <div style="margin-top: 18px; padding: 14px; background-color: rgba(255, 75, 75, 0.1); border-left: 4px solid #FF4B4B; border-radius: 8px; font-size: 12px; line-height: 1.5; color: #FED7D7;">
                <strong>Protective Action:</strong> ${actionTaken}
              </div>
              <div style="margin-top: 24px; text-align: center;">
                <a href="https://tradepigeon.com" target="_blank" style="display: inline-block; background-color: #FF4B4B; color: #FFFFFF; text-decoration: none; font-size: 12px; font-weight: 900; text-transform: uppercase; padding: 12px 28px; border-radius: 14px;">
                  Open Risk Cockpit
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Middleware: Enforces valid email format and authorized caller in production
 */
function validateEmailRequest(req, res, next) {
  const { recipientEmail } = req.body;
  if (!recipientEmail || typeof recipientEmail !== 'string' || !EMAIL_REGEX.test(recipientEmail.trim())) {
    return res.status(400).json({ error: 'A valid recipientEmail is required' });
  }

  // Security Guard: In production, require internal API secret to prevent open-relay email spam
  if (isProduction && process.env.INTERNAL_API_SECRET) {
    const providedSecret = req.headers['x-internal-secret'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '');
    if (providedSecret !== process.env.INTERNAL_API_SECRET) {
      return res.status(403).json({ error: 'Unauthorized: Missing or invalid email dispatch credentials' });
    }
  }

  next();
}

// 1. Send Daily Discipline Briefing Email
router.post('/send-briefing', validateEmailRequest, async (req, res) => {
  try {
    const { recipientEmail, ...briefingData } = req.body;
    const htmlContent = generateDailyBriefingHtml(briefingData);

    if (resendApiKey) {
      // Live delivery via Resend API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'TradePigeon <briefings@tradepigeon.com>',
          to: [recipientEmail.trim()],
          subject: `Daily Trading Debrief: Grade ${briefingData.grade || 'A'} (${briefingData.date || 'Today'})`,
          html: htmlContent
        })
      });

      const data = await response.json();
      return res.json({ success: true, provider: 'resend', id: data.id });
    }

    // Development / non-production mock fallback
    console.log(`📧 [Email Simulation] Daily Briefing dispatched to ${recipientEmail}`);
    return res.json({
      success: true,
      provider: 'mock',
      message: `Briefing email simulated for ${recipientEmail}. Set RESEND_API_KEY for live delivery.`,
      previewLength: htmlContent.length
    });
  } catch (error) {
    console.error('[Email Briefing Error]:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 2. Send Risk Breach Emergency Email
router.post('/send-risk-alert', validateEmailRequest, async (req, res) => {
  try {
    const { recipientEmail, ...alertData } = req.body;
    const htmlContent = generateRiskAlertHtml(alertData);

    if (resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'TradePigeon Risk <risk@tradepigeon.com>',
          to: [recipientEmail.trim()],
          subject: `⚠️ RISK ALERT: ${alertData.breachType || 'Loss Limit Reached'} on ${alertData.account || 'Account'}`,
          html: htmlContent
        })
      });

      const data = await response.json();
      return res.json({ success: true, provider: 'resend', id: data.id });
    }

    console.log(`🚨 [Email Simulation] Risk Alert dispatched to ${recipientEmail} for ${alertData.account}`);
    return res.json({
      success: true,
      provider: 'mock',
      message: `Risk alert simulated for ${recipientEmail}`
    });
  } catch (error) {
    console.error('[Email Risk Alert Error]:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 3. Browser preview endpoint for inspection (Development only)
router.get('/preview-briefing', (req, res) => {
  if (isProduction) {
    return res.status(404).send('Not Found');
  }

  const html = generateDailyBriefingHtml({
    traderName: req.query.name || 'AlphaTrader',
    grade: req.query.grade || 'A+',
    netPnl: req.query.pnl || '+$1,250.00',
    rMultiple: req.query.r || '+3.5 R',
    winRate: '75%',
    rulesAdherence: '100%',
    streakDays: 8,
    keyTakeaway: 'Great adherence on London sweeps. Held runner into NY AM momentum without touching stop.'
  });
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
