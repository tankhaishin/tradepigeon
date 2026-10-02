import Stripe from 'stripe';
import { handleCors } from '../utils/cors.js';

const isProduction = process.env.NODE_ENV === 'production';
const stripeApiKey = process.env.STRIPE_SECRET_KEY || (!isProduction ? 'sk_test_mock_tradepigeon_key_2026' : '');
const stripe = stripeApiKey ? new Stripe(stripeApiKey, { apiVersion: '2023-10-16' }) : null;

export default async function handler(req, res) {
  if (!handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
  }

  const { customerId, email } = req.query || {};

  if (!stripe || !process.env.STRIPE_SECRET_KEY) {
    return res.json({
      isPro: false,
      status: 'inactive',
      message: 'Stripe not configured or in dev mode'
    });
  }

  try {
    let targetCustomerId = customerId;
    if (!targetCustomerId && email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        targetCustomerId = customers.data[0].id;
      }
    }

    if (!targetCustomerId) {
      return res.json({ isPro: false, status: 'inactive' });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: targetCustomerId,
      status: 'all',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return res.json({ isPro: false, status: 'none' });
    }

    const sub = subscriptions.data[0];
    const isActive = sub.status === 'active' || sub.status === 'trialing';

    return res.json({
      isPro: isActive,
      status: sub.status,
      proExpiresAt: sub.current_period_end ? sub.current_period_end * 1000 : null,
      customerId: targetCustomerId,
      subscriptionId: sub.id,
      cancelAtPeriodEnd: sub.cancel_at_period_end
    });
  } catch (err) {
    console.error('[Vercel Stripe Subscription Status Error]:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
