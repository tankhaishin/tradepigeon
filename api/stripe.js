import { handleCors } from './_lib/cors.js';
import { verifyUser, getStripe, findCustomer, getEntitlement } from './_lib/account.js';

// /api/stripe/status | verify-session | create-checkout-session | create-portal-session
// Every action acts on the signed-in caller only; emails/ids from the request body are ignored.
export default async function handler(req, res) {
  if (!handleCors(req, res)) return;
  const action = req.query?.action;

  const user = await verifyUser(req);
  if (!user) return res.status(401).json({ error: 'Please sign in again.' });

  try {
    if (action === 'status' || action === 'verify-session') {
      return res.json(await getEntitlement(user));
    }

    const stripe = getStripe();
    if (!stripe) return res.status(503).json({ error: 'Payments are not configured yet.' });
    const origin = process.env.APP_URL || 'https://www.tradepigeon.com';
    const customer = await findCustomer(stripe, user.email);

    if (action === 'create-checkout-session' && req.method === 'POST') {
      const annual = req.body?.plan === 'annual';
      const priceId = annual ? process.env.STRIPE_ANNUAL_PRICE_ID : process.env.STRIPE_PRICE_ID;
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        ...(customer ? { customer: customer.id } : { customer_email: user.email }),
        client_reference_id: user.uid,
        line_items: [priceId
          ? { price: priceId, quantity: 1 }
          : {
              price_data: {
                currency: 'usd',
                unit_amount: annual ? 7999 : 999,
                recurring: { interval: annual ? 'year' : 'month' },
                product_data: { name: 'TradePigeon Pro' }
              },
              quantity: 1
            }],
        success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}&status=success`,
        cancel_url: `${origin}/?status=cancelled`
      });
      return res.json({ url: session.url });
    }

    if (action === 'create-portal-session' && req.method === 'POST') {
      if (!customer) return res.status(404).json({ error: 'No billing profile yet for this account.' });
      const portal = await stripe.billingPortal.sessions.create({ customer: customer.id, return_url: origin });
      return res.json({ url: portal.url });
    }

    return res.status(404).json({ error: 'Unknown billing action.' });
  } catch (err) {
    console.error('[stripe]', action, err.message);
    return res.status(500).json({ error: 'Billing service error. Please try again.' });
  }
}
