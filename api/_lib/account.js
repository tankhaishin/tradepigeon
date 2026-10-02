import Stripe from 'stripe';

// Server-side source of truth for who the caller is and whether they're Pro.
// Pro = active/trialing Stripe subscription, or within 7 days of Firebase account creation.

export const TRIAL_MS = 7 * 86400000;
const PAID_STATUSES = ['active', 'trialing', 'past_due'];

// Verifies the Firebase ID token by asking Google who owns it (no admin SDK / service account needed).
export async function verifyUser(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const apiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (!token || !apiKey) return null;
  try {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token })
    });
    if (!r.ok) return null;
    const u = (await r.json()).users?.[0];
    if (!u?.email) return null;
    return { uid: u.localId, email: u.email.toLowerCase(), createdAt: Number(u.createdAt) || Date.now() };
  } catch {
    return null;
  }
}

export function getStripe() {
  return process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
}

export async function findCustomer(stripe, email) {
  const { data } = await stripe.customers.list({ email, limit: 1 });
  return data[0] || null;
}

// Pure decision, unit-tested in tests/test_suite.mjs.
export function decideEntitlement(subs = [], createdAt, now = Date.now()) {
  const paid = subs.find(s => PAID_STATUSES.includes(s.status));
  if (paid) {
    return {
      isPro: true,
      source: 'stripe',
      status: paid.status,
      proExpiresAt: paid.current_period_end ? paid.current_period_end * 1000 : null,
      customerId: paid.customer || null
    };
  }
  const trialEnd = createdAt + TRIAL_MS;
  if (now < trialEnd) return { isPro: true, source: 'free_trial', status: 'trialing', proExpiresAt: trialEnd, trialStartedAt: createdAt };
  return { isPro: false, source: 'free_tier', status: subs[0]?.status || 'none', proExpiresAt: null, trialStartedAt: createdAt };
}

export async function getEntitlement(user) {
  const stripe = getStripe();
  let subs = [];
  if (stripe) {
    const customer = await findCustomer(stripe, user.email);
    if (customer) subs = (await stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 10 })).data;
  }
  return decideEntitlement(subs, user.createdAt);
}
