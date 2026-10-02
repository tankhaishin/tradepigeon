import { auth } from '../config/firebase.js';
import { saveStoredData } from './storage.js';
import { computeSubscriptionEntitlement, SUBSCRIPTION_STORAGE_KEYS } from './subscriptionEngine.js';

/**
 * Pro access right now (server-confirmed Stripe/trial cache + local coin pass).
 * Display/gating only: server-side features re-check Pro on every call.
 */
export function isProActive() {
  return Boolean(computeSubscriptionEntitlement()?.isPro);
}

// Authorization header for our /api endpoints as the signed-in Firebase user.
export async function authHeaders() {
  try {
    await auth?.authStateReady?.(); // checkout returns can land before Firebase restores the session
    const token = await auth?.currentUser?.getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function billingFetch(action, body = null) {
  const res = await fetch(`/api/stripe/${action}`, {
    method: body ? 'POST' : 'GET',
    headers: { ...(await authHeaders()), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Billing service error (${res.status})`);
  return data;
}

/** Asks the server (Stripe + account age) for this account's Pro status and caches it locally. */
export async function refreshProStatus() {
  try {
    const server = await billingFetch('status');
    const cloudData = {
      subscription: server.source === 'stripe' ? server : null,
      trialStartedAt: server.trialStartedAt ? new Date(server.trialStartedAt).toISOString() : undefined
    };
    saveStoredData(SUBSCRIPTION_STORAGE_KEYS.STATE, server.source === 'stripe' ? server : null);
    if (server.trialStartedAt) saveStoredData(SUBSCRIPTION_STORAGE_KEYS.TRIAL_STARTED_AT, server.trialStartedAt);

    const entitlement = computeSubscriptionEntitlement(auth?.currentUser, cloudData);
    saveStoredData(SUBSCRIPTION_STORAGE_KEYS.IS_PRO, entitlement.isPro);
    window.dispatchEvent(new CustomEvent('tradepigeon_subscription_updated', { detail: entitlement }));
    return entitlement;
  } catch (err) {
    console.warn('[Pro Status Refresh Notice]:', err.message);
    return computeSubscriptionEntitlement(); // keep last known state when offline / signed out
  }
}

export async function startCheckout(plan = 'monthly') {
  const { url } = await billingFetch('create-checkout-session', { plan });
  window.location.href = url;
}

export async function openBillingPortal() {
  const { url } = await billingFetch('create-portal-session', {});
  window.location.href = url;
}
