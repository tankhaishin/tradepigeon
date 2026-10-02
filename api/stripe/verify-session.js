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

  const { sessionId } = req.body || {};
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ verified: false, error: 'Valid checkout sessionId is required.' });
  }

  // Handle mock sessions in development
  if (sessionId.startsWith('cs_test_mock_')) {
    if (isProduction && process.env.STRIPE_SECRET_KEY) {
      return res.status(403).json({ verified: false, error: 'Mock checkout sessions are prohibited in production.' });
    }
    const mockExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
    return res.json({
      verified: true,
      isPro: true,
      subscription: {
        isPro: true,
        plan: 'PRO',
        status: 'active',
        proExpiresAt: mockExpiry,
        customerId: 'cus_mock_123',
        subscriptionId: 'sub_mock_123',
        verifiedAt: new Date().toISOString()
      },
      isMock: true,
      message: 'Mock session verified successfully.'
    });
  }

  if (!stripe) {
    if (!isProduction) {
      const mockExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
      return res.json({
        verified: true,
        isPro: true,
        subscription: {
          isPro: true,
          plan: 'PRO',
          status: 'active',
          proExpiresAt: mockExpiry,
          customerId: 'cus_dev_fallback',
          subscriptionId: 'sub_dev_fallback',
          verifiedAt: new Date().toISOString()
        },
        isMock: true
      });
    }
    return res.status(500).json({ verified: false, error: 'Stripe backend client is not configured.' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      return res.status(404).json({ verified: false, error: 'Checkout session not found on Stripe.' });
    }

    const isPaid = session.payment_status === 'paid' || session.status === 'complete';
    if (!isPaid) {
      return res.status(402).json({
        verified: false,
        isPro: false,
        status: session.status,
        error: 'Payment not completed on Stripe.'
      });
    }

    let proExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // default 30 days
    if (session.subscription) {
      try {
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        if (sub?.current_period_end) {
          proExpiresAt = sub.current_period_end * 1000;
        }
      } catch (subErr) {
        console.warn('[Stripe Subscription Period Retrieval Notice]:', subErr.message);
      }
    }

    const entitlement = {
      isPro: true,
      plan: 'PRO',
      status: 'active',
      proExpiresAt,
      customerId: session.customer,
      subscriptionId: session.subscription,
      customerEmail: session.customer_email || session.metadata?.customerEmail || '',
      userId: session.client_reference_id || session.metadata?.userId || '',
      verifiedAt: new Date().toISOString()
    };

    return res.json({
      verified: true,
      isPro: true,
      status: 'active',
      subscription: entitlement,
      customerId: session.customer,
      subscriptionId: session.subscription
    });
  } catch (err) {
    console.error('[Vercel Stripe Verify Session Error]:', err.message);
    return res.status(500).json({ verified: false, error: err.message });
  }
}
