import { auth, db } from '../config/firebase.js';
import { loadStoredData, saveStoredData, STORAGE_KEYS } from './storage.js';
import { 
  computeSubscriptionEntitlement, 
  syncSubscriptionToCloud,
  SUBSCRIPTION_STORAGE_KEYS 
} from './subscriptionEngine.js';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Checks whether Pro access is active right now.
 * Validates Stripe subscription, Coin Pass voucher expiry, and 7-Day Free Trial.
 */
export function isProActive() {
  const entitlement = computeSubscriptionEntitlement();
  return Boolean(entitlement?.isPro);
}

/**
 * Calls a billing endpoint securely with auth token fallback
 */
export async function billingFetch(action, body = null) {
  let token = null;
  try {
    await auth?.authStateReady?.();
    token = await auth?.currentUser?.getIdToken();
  } catch (authErr) {
    console.warn('[Billing Auth Warning]:', authErr.message);
  }

  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const endpoint = `/api/stripe/${action}`;
  const res = await fetch(endpoint, {
    method: body ? 'POST' : 'GET',
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Billing service error (${res.status})`);
  }
  return data;
}

/**
 * Syncs and refreshes Pro subscription status from Cloud Firestore and Stripe.
 */
export async function refreshProStatus() {
  try {
    const currentUser = auth?.currentUser || loadStoredData(STORAGE_KEYS.AUTH_USER, null);
    let cloudData = null;

    if (currentUser?.uid && db) {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          cloudData = userDoc.data();
        }
      } catch (cloudErr) {
        console.warn('[Cloud Subscription Fetch Notice]:', cloudErr.message);
      }
    }

    // Attempt to query Stripe for real-time subscription lifecycle updates
    if (currentUser?.email) {
      try {
        const stripeStatus = await billingFetch(`subscription-status?email=${encodeURIComponent(currentUser.email)}`);
        if (stripeStatus && stripeStatus.isPro !== undefined) {
          const updatedSub = {
            isPro: Boolean(stripeStatus.isPro),
            status: stripeStatus.status || 'active',
            proExpiresAt: stripeStatus.proExpiresAt || null,
            customerId: stripeStatus.customerId || null,
            subscriptionId: stripeStatus.subscriptionId || null,
            updatedAt: new Date().toISOString()
          };
          await syncSubscriptionToCloud(currentUser.uid, updatedSub);
          cloudData = { ...(cloudData || {}), subscription: updatedSub };
        }
      } catch (stripeErr) {
        // Silent fallback to cloud/local verification
      }
    }

    const entitlement = computeSubscriptionEntitlement(currentUser, cloudData);
    saveStoredData(SUBSCRIPTION_STORAGE_KEYS.IS_PRO, entitlement.isPro);
    saveStoredData(SUBSCRIPTION_STORAGE_KEYS.STATE, entitlement);
    
    return entitlement;
  } catch (err) {
    console.warn('[Pro Status Refresh Notice]:', err.message);
    return computeSubscriptionEntitlement();
  }
}

/**
 * Initiates Stripe Checkout session for Pro upgrade
 */
export async function startCheckout(plan = 'monthly', customerEmail = '', userId = '') {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tradepigeon.com';
  const currentUser = auth?.currentUser;

  const res = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planName: 'TradePigeon Pro Subscription',
      priceAmount: 9.99,
      customerEmail: customerEmail || currentUser?.email || '',
      userId: userId || currentUser?.uid || '',
      successUrl: `${origin}?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancelUrl: `${origin}?status=cancelled`
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to start Stripe checkout session.');
  }

  if (data?.url) {
    window.location.href = data.url;
  } else {
    throw new Error('Stripe checkout URL missing.');
  }
}

/**
 * Opens Stripe Customer Portal for self-service cancellation / billing management
 */
export async function openBillingPortal(customerEmail = '', customerId = '') {
  const currentUser = auth?.currentUser;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tradepigeon.com';

  const res = await fetch('/api/stripe/create-portal-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId: customerId || undefined,
      customerEmail: customerEmail || currentUser?.email || '',
      returnUrl: `${origin}`
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to open customer billing portal.');
  }

  if (data?.url) {
    window.location.href = data.url;
  } else {
    throw new Error('Billing portal URL missing.');
  }
}
