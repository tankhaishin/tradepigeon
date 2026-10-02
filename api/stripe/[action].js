import createCheckoutSession from './create-checkout-session.js';
import createPortalSession from './create-portal-session.js';
import verifySession from './verify-session.js';
import subscriptionStatus from './subscription-status.js';
import webhookHandler from './webhook.js';

export default async function handler(req, res) {
  const { action } = req.query || {};

  switch (action) {
    case 'create-checkout-session':
      return createCheckoutSession(req, res);
    case 'create-portal-session':
      return createPortalSession(req, res);
    case 'verify-session':
      return verifySession(req, res);
    case 'subscription-status':
    case 'status':
      return subscriptionStatus(req, res);
    case 'webhook':
      return webhookHandler(req, res);
    default:
      return res.status(404).json({ error: `Stripe action '${action}' not supported.` });
  }
}
