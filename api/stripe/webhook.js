import Stripe from 'stripe';

const isProduction = process.env.NODE_ENV === 'production';
const stripeApiKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeApiKey ? new Stripe(stripeApiKey, { apiVersion: '2023-10-16' }) : null;

// Disable Vercel's default body parser so we can get raw buffer for cryptographic signature check
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const sig = req.headers['stripe-signature'];
  let event;
  let rawBody;

  try {
    rawBody = await getRawBody(req);
  } catch (readErr) {
    return res.status(400).send(`Webhook Error reading body: ${readErr.message}`);
  }

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret && stripe) {
      if (!sig) {
        return res.status(400).send('Webhook Error: Missing stripe-signature header.');
      }
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      if (isProduction && stripeApiKey) {
        console.warn('[Stripe Webhook Notice]: STRIPE_WEBHOOK_SECRET is not configured in production.');
      }
      event = JSON.parse(rawBody.toString('utf-8'));
    }
  } catch (err) {
    console.error('[Stripe Webhook Signature Verification Error]:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event?.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const key = session.client_reference_id || session.customer_email || session.id;
        console.log(`✅ [Stripe Webhook] Checkout completed for ${key}. Customer: ${session.customer}, Subscription: ${session.subscription}`);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const isActive = sub.status === 'active' || sub.status === 'trialing';
        console.log(`✅ [Stripe Webhook] Subscription ${sub.id} status: ${sub.status} (isPro: ${isActive})`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        console.log(`⚠️ [Stripe Webhook] Subscription ${sub.id} canceled/deleted.`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log(`💳 [Stripe Webhook] Invoice ${invoice.id} paid. Period end: ${invoice.lines?.data?.[0]?.period?.end}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.warn(`🚨 [Stripe Webhook] Invoice payment failed for customer ${invoice.customer}.`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Received unhandled event type: ${event?.type}`);
    }

    return res.status(200).json({ received: true, type: event?.type });
  } catch (processErr) {
    console.error('[Stripe Webhook Handler Error]:', processErr.message);
    return res.status(500).json({ error: 'Failed to process webhook event.' });
  }
}
