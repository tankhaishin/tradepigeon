import Stripe from 'stripe';
import { handleCors } from '../utils/cors.js';

const isProduction = process.env.NODE_ENV === 'production';
const stripeApiKey = process.env.STRIPE_SECRET_KEY || (!isProduction ? 'sk_test_mock_tradepigeon_key_2026' : '');
const stripe = stripeApiKey ? new Stripe(stripeApiKey, { apiVersion: '2023-10-16' }) : null;

export default async function handler(req, res) {
  if (!handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { customerId, returnUrl, customerEmail } = req.body || {};

    if (!process.env.STRIPE_SECRET_KEY) {
      if (isProduction) {
        return res.status(503).json({ error: 'Stripe billing portal is not configured in production.' });
      }
      return res.json({
        url: returnUrl || 'http://localhost:5175/profile?billing_portal=simulated',
        isMock: true,
        message: 'Simulated Customer Portal Session'
      });
    }

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe client is not initialized.' });
    }

    let targetCustomerId = customerId;

    if (!targetCustomerId && customerEmail) {
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (customers.data.length > 0) {
        targetCustomerId = customers.data[0].id;
      }
    }

    if (!targetCustomerId) {
      return res.status(404).json({ error: 'No active Stripe billing profile found for this account.' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: targetCustomerId,
      return_url: returnUrl || `${req.headers.origin || 'https://tradepigeon.com'}`
    });

    res.json({ url: portalSession.url });
  } catch (error) {
    console.error('[Vercel Stripe Portal Error]:', error.message);
    res.status(500).json({ error: error.message });
  }
}
