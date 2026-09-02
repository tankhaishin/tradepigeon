import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
// Initialize Stripe with key or test fallback
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_goodtrader_key_2026', {
  apiVersion: '2023-10-16',
});

// 1. Create Checkout Session for GoodTrader Pro / Gems Top-up
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { planId, planName, priceAmount, successUrl, cancelUrl } = req.body;

    // If live key is missing, return test mock session URL
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.json({
        id: `cs_test_mock_${Date.now()}`,
        url: successUrl || 'http://localhost:5175/?payment=success',
        isMock: true,
        message: 'Stripe Test Mode Active'
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planName || 'GoodTrader Pro Subscription',
              description: 'Access to Automated Broker Sync & Playbook Analytics Engine',
            },
            unit_amount: (priceAmount || 29) * 100, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin || 'http://localhost:5175'}?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${req.headers.origin || 'http://localhost:5175'}?status=cancelled`,
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('[Stripe Route Error]:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 2. Stripe Webhook Listener
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(req.body);
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful checkout payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log(`✅ [Stripe] Payment received for session ${session.id}! Granting GoodTrader Pro access.`);
  }

  res.json({ received: true });
});

export default router;
