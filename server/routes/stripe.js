import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const isProduction = process.env.NODE_ENV === 'production';

// Initialize Stripe with key or non-production fallback
const stripeApiKey = process.env.STRIPE_SECRET_KEY || (!isProduction ? 'sk_test_mock_tradepigeon_key_2026' : '');
const stripe = stripeApiKey ? new Stripe(stripeApiKey, {
  apiVersion: '2023-10-16',
}) : null;

// In-memory subscription cache for fast entitlement verification (backed by webhook updates)
export const SUBSCRIPTION_STORE = new Map();

// 1. Create Checkout Session for TradePigeon Pro / Gems Top-up
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { planName, priceAmount, successUrl, cancelUrl, customerEmail, userId } = req.body;

    // If live key is missing, return test mock session URL only in non-production
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
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planName || 'TradePigeon Pro Subscription',
              description: 'Automated Broker Sync, Killzone Telemetry & Playbook Expectancy Engine',
            },
            unit_amount: (priceAmount || 9.99) * 100, // Amount in cents ($9.99/mo)
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${req.headers.origin || 'http://localhost:5175'}?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: cancelUrl || `${req.headers.origin || 'http://localhost:5175'}?status=cancelled`,
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('[Stripe Checkout Route Error]:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 2. Create Stripe Customer Portal Session for Self-Service Billing Management
router.post('/create-portal-session', async (req, res) => {
  try {
    const { customerId, returnUrl, customerEmail } = req.body;

    // Development mock fallback
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

    // Look up customer by email if customer ID wasn't provided directly
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
      return_url: returnUrl || `${req.headers.origin || 'http://localhost:5175'}?portal=return`
    });

    res.json({ url: portalSession.url });
  } catch (error) {
    console.error('[Stripe Portal Route Error]:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 3. Cryptographically Verify Stripe Checkout Session
router.post('/verify-session', async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ verified: false, error: 'Valid checkout sessionId is required.' });
  }

  // Handle simulated / mock sessions in non-production
  if (sessionId.startsWith('cs_test_mock_')) {
    if (isProduction && process.env.STRIPE_SECRET_KEY) {
      return res.status(403).json({ verified: false, error: 'Mock checkout sessions are prohibited in production.' });
    }
    return res.json({
      verified: true,
      isPro: true,
      status: 'active',
      isMock: true,
      message: 'Mock session verified.'
    });
  }

  if (!stripe) {
    if (!isProduction) {
      return res.json({ verified: true, isPro: true, status: 'active', isMock: true });
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
      return res.status(402).json({ verified: false, isPro: false, status: session.status, error: 'Payment not completed.' });
    }

    const key = session.client_reference_id || session.customer_email;
    if (key) {
      SUBSCRIPTION_STORE.set(key, {
        isPro: true,
        status: 'active',
        customerId: session.customer,
        subscriptionId: session.subscription,
        isDunning: false,
        verifiedAt: new Date().toISOString()
      });
    }

    res.json({
      verified: true,
      isPro: true,
      status: 'active',
      customerId: session.customer,
      subscriptionId: session.subscription
    });
  } catch (err) {
    console.error('[Stripe Session Verification Error]:', err.message);
    res.status(500).json({ verified: false, error: err.message });
  }
});

// 4. Query Subscription & Dunning Status
router.get('/subscription-status', (req, res) => {
  const { userId, email } = req.query;
  const key = userId || email;
  if (!key) {
    return res.status(400).json({ error: 'userId or email is required' });
  }

  const sub = SUBSCRIPTION_STORE.get(key) || {
    isPro: false,
    status: 'inactive',
    isDunning: false
  };

  res.json(sub);
});

// 4. Stripe Webhook Listener with Full Lifecycle & Dunning Support
router.post('/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      if (!sig) {
        return res.status(400).send('Webhook Error: Missing stripe-signature header.');
      }
      const rawPayload = req.rawBody || req.body;
      event = stripe.webhooks.constructEvent(rawPayload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      if (isProduction) {
        return res.status(400).send('Webhook Error: Webhook signature verification required in production.');
      }
      event = typeof req.body === 'string' || Buffer.isBuffer(req.body)
        ? JSON.parse(req.body.toString())
        : (req.rawBody ? JSON.parse(req.rawBody.toString()) : req.body);
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle Lifecycle Events
  switch (event?.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const key = session.client_reference_id || session.customer_email;
      if (key) {
        SUBSCRIPTION_STORE.set(key, {
          isPro: true,
          status: 'active',
          customerId: session.customer,
          subscriptionId: session.subscription,
          isDunning: false,
          updatedAt: new Date().toISOString()
        });
      }
      console.log(`✅ [Stripe Webhook] Checkout completed for ${key || session.id}. Pro entitlement granted.`);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const key = sub.metadata?.userId || sub.customer;
      const isActive = sub.status === 'active' || sub.status === 'trialing';
      const isPastDue = sub.status === 'past_due';

      SUBSCRIPTION_STORE.set(key, {
        isPro: isActive,
        status: sub.status,
        customerId: sub.customer,
        subscriptionId: sub.id,
        isDunning: isPastDue,
        currentPeriodEnd: sub.current_period_end,
        updatedAt: new Date().toISOString()
      });
      console.log(`🔄 [Stripe Webhook] Subscription ${sub.id} updated -> Status: ${sub.status}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const key = sub.metadata?.userId || sub.customer;
      SUBSCRIPTION_STORE.set(key, {
        isPro: false,
        status: 'canceled',
        customerId: sub.customer,
        subscriptionId: sub.id,
        isDunning: false,
        updatedAt: new Date().toISOString()
      });
      console.log(`❌ [Stripe Webhook] Subscription ${sub.id} canceled. Pro entitlement revoked.`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const key = invoice.customer_email || invoice.customer;
      if (key) {
        const existing = SUBSCRIPTION_STORE.get(key) || {};
        SUBSCRIPTION_STORE.set(key, {
          ...existing,
          isDunning: true,
          lastPaymentError: invoice.last_finalization_error?.message || 'Card payment declined',
          updatedAt: new Date().toISOString()
        });
      }
      console.warn(`⚠️ [Stripe Webhook] Dunning alert: Invoice payment failed for ${key}.`);
      break;
    }

    default:
      // Other unhandled events
      break;
  }

  res.json({ received: true });
});

export default router;
