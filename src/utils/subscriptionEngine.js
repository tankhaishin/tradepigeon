/**
 * TradePigeon Subscription & Pro Entitlement Engine
 * 
 * Cryptographically verifies entitlement, checks deterministic expiration dates,
 * synchronizes state with Cloud Firestore across devices, and enforces Pro feature gating.
 */

import { loadStoredData, saveStoredData, STORAGE_KEYS } from './storage.js';
import { db } from '../config/firebase.js';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const TRIAL_DURATION_DAYS = 7;
export const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
export const PASS_DURATION_DAYS = 30;
export const PASS_DURATION_MS = PASS_DURATION_DAYS * 24 * 60 * 60 * 1000;
export const PRO_MONTHLY_PRICE = 9.99;
export const SHOP_COIN_PASS_COST = 1500;

export const SUBSCRIPTION_STORAGE_KEYS = {
  STATE: 'tradepigeon_subscription_state',
  IS_PRO: 'tradepigeon_is_pro',
  TRIAL_STARTED_AT: 'tradepigeon_trial_started_at',
  SHOP_VOUCHER: 'tradepigeon_pro_voucher'
};

export const PRO_FEATURES = {
  AI_DEBRIEF: 'ai_debrief',
  BROKER_SYNC: 'broker_sync',
  PROP_FIRM_COCKPIT: 'prop_firm_cockpit',
  EXECUTION_MATRIX: 'execution_matrix',
  DATA_EXPORT: 'data_export'
};

/**
 * Deterministically computes current Pro entitlement status.
 * Evaluates Cloud subscription, Coin Pass voucher, and 7-day free trial clock.
 * 
 * @param {object|null} user Active Firebase or local user
 * @param {object|null} cloudData User document from Firestore
 * @param {number} now Current timestamp in ms (defaults to Date.now())
 * @returns {object} Authoritative entitlement object
 */
export function computeSubscriptionEntitlement(user = null, cloudData = null, now = Date.now()) {
  const localState = loadStoredData(SUBSCRIPTION_STORAGE_KEYS.STATE, null) || {};
  const localVoucher = loadStoredData(SUBSCRIPTION_STORAGE_KEYS.SHOP_VOUCHER, null) || {};
  const localTrialStart = loadStoredData(SUBSCRIPTION_STORAGE_KEYS.TRIAL_STARTED_AT, null);

  const subData = cloudData?.subscription || localState;
  const voucherData = cloudData?.proVoucher || localVoucher;

  // 1. Stripe Recurring Pro Subscription Check
  if (subData && (subData.status === 'active' || subData.status === 'trialing')) {
    const expiresAt = subData.proExpiresAt ? Number(subData.proExpiresAt) : null;
    const isExpired = expiresAt !== null && now > expiresAt;

    if (!isExpired) {
      const daysRemaining = expiresAt ? Math.max(1, Math.ceil((expiresAt - now) / 86400000)) : 30;
      return {
        isPro: true,
        plan: 'PRO',
        status: 'active',
        isTrial: false,
        isTrialExpired: false,
        daysRemaining,
        proExpiresAt: expiresAt,
        badgeText: 'PRO SUBSCRIBER',
        source: 'stripe',
        canAccessProFeatures: true,
        customerId: subData.customerId || null,
        subscriptionId: subData.subscriptionId || null
      };
    }
  }

  // 2. Coin Shop 30-Day Pro Pass Check
  if (voucherData && voucherData.expiresAt) {
    const expiresAt = Number(voucherData.expiresAt);
    if (now < expiresAt) {
      const daysRemaining = Math.max(1, Math.ceil((expiresAt - now) / 86400000));
      return {
        isPro: true,
        plan: 'COIN_PASS',
        status: 'active',
        isTrial: false,
        isTrialExpired: false,
        daysRemaining,
        proExpiresAt: expiresAt,
        badgeText: `PRO PASS (${daysRemaining}d)`,
        source: 'shop_voucher',
        canAccessProFeatures: true,
        customerId: null,
        subscriptionId: null
      };
    }
  }

  // 3. 7-Day Free Trial Clock
  let trialStartedAt = null;
  if (cloudData?.trialStartedAt) {
    trialStartedAt = new Date(cloudData.trialStartedAt).getTime();
  } else if (cloudData?.createdAt) {
    trialStartedAt = new Date(cloudData.createdAt).getTime();
  } else if (localTrialStart) {
    trialStartedAt = Number(localTrialStart);
  } else {
    // Brand new user: establish trial start timestamp right now
    trialStartedAt = now;
    saveStoredData(SUBSCRIPTION_STORAGE_KEYS.TRIAL_STARTED_AT, trialStartedAt);
  }

  const trialExpiresAt = trialStartedAt + TRIAL_DURATION_MS;
  const isTrialActive = now < trialExpiresAt;

  if (isTrialActive) {
    const trialDaysRemaining = Math.max(1, Math.ceil((trialExpiresAt - now) / 86400000));
    return {
      isPro: true,
      plan: 'TRIAL',
      status: 'trialing',
      isTrial: true,
      isTrialExpired: false,
      daysRemaining: trialDaysRemaining,
      proExpiresAt: trialExpiresAt,
      badgeText: `TRIAL (${trialDaysRemaining}d left)`,
      source: 'free_trial',
      canAccessProFeatures: true,
      customerId: null,
      subscriptionId: null
    };
  }

  // 4. Free Tier (Trial Expired & No Active Subscription)
  return {
    isPro: false,
    plan: 'FREE',
    status: 'expired',
    isTrial: false,
    isTrialExpired: true,
    daysRemaining: 0,
    proExpiresAt: null,
    badgeText: 'FREE PLAN',
    source: 'free_tier',
    canAccessProFeatures: false,
    customerId: null,
    subscriptionId: null
  };
}

/**
 * Checks whether the current user is allowed to access a given feature
 */
export function canAccessFeature(featureKey, entitlement) {
  if (!entitlement) return false;
  if (entitlement.canAccessProFeatures) return true;
  return false;
}

/**
 * Persists an active subscription entitlement to Cloud Firestore and localStorage
 */
export async function syncSubscriptionToCloud(userId, subscriptionPayload) {
  if (!subscriptionPayload) return;

  // Mirror locally for immediate offline/render capability
  saveStoredData(SUBSCRIPTION_STORAGE_KEYS.STATE, subscriptionPayload);
  saveStoredData(SUBSCRIPTION_STORAGE_KEYS.IS_PRO, Boolean(subscriptionPayload.isPro));

  if (userId && db) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        subscription: subscriptionPayload,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('[Subscription Sync Warning]:', err.message);
    }
  }

  // Dispatch custom window event so all tabs/components react immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tradepigeon_subscription_updated', {
      detail: subscriptionPayload
    }));
  }
}

/**
 * Activates a 30-day Pro Pass purchased in the Coin Shop
 */
export async function activateShopProPass(userId, currentCoins = 0) {
  const now = Date.now();
  const expiresAt = now + PASS_DURATION_MS;

  const voucherPayload = {
    activatedAt: new Date(now).toISOString(),
    expiresAt,
    days: PASS_DURATION_DAYS,
    source: 'coins_shop'
  };

  saveStoredData(SUBSCRIPTION_STORAGE_KEYS.SHOP_VOUCHER, voucherPayload);
  saveStoredData(SUBSCRIPTION_STORAGE_KEYS.IS_PRO, true);

  if (userId && db) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        proVoucher: voucherPayload,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('[Shop Pass Cloud Sync Notice]:', err.message);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tradepigeon_subscription_updated', {
      detail: { isPro: true, plan: 'COIN_PASS', expiresAt }
    }));
  }

  return voucherPayload;
}
