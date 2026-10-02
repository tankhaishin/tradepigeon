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
    const { planName, priceAmount, successUrl, cancelUrl, customerEmail, userId } = req.body || {};

    // In non-production or if keys aren't set, return mock session URL for testing
    if (!process.env.STRIPE_SECRET_KEY) {
      if (isProduction) {
        return res.status(503).json({ error: 'Stripe payments are not configured in production environment.' });
      }
      return res.json({
        id: `cs_test_mock_${Date.now()}`,
        url: successUrl || 'http://localhost:5175/?payment=success',
        isMock: true,
        message: 'Stripe Dev Test Mode Active'
      });
    }

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe client is not initialized.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerEmail || undefined,
      client_reference_id: userId || undefined,
      metadata: {
        userId: userId || '',
        customerEmail: customerEmail || ''
      },
      subscription_data: {
        metadata: {
          userId: userId || '',
          customerEmail: customerEmail || ''
        }
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planName || 'TradePigeon Pro Subscription',
              description: 'Automated Broker Sync, Gemini AI Debriefs & Playbook Expectancy Engine',
            },
            unit_amount: Math.round((priceAmount || 9.99) * 100), // $9.99 in cents
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${req.headers.origin || 'https://tradepigeon.com'}?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: cancelUrl || `${req.headers.origin || 'https://tradepigeon.com'}?status=cancelled`,
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('[Vercel Stripe Checkout Error]:', error.message);
    res.status(500).json({ error: error.message });
  }
}
