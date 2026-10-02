import { auth, db } from '../config/firebase.js';
import { deleteUser } from 'firebase/auth';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { computeSubscriptionEntitlement } from './subscriptionEngine.js';

const SUBCOLLECTIONS = ['trades', 'journal', 'accounts', 'debriefs'];
const RECENT_LOGIN_MS = 5 * 60 * 1000;

/**
 * Permanently deletes the signed-in user's cloud data, then their login, then this device's copy.
 * Order matters: data first (needs auth), login last. Refuses while a paid subscription is active,
 * so nobody keeps getting billed for a deleted account.
 * @returns {{ ok: true } | { ok: false, reason: 'subscription' | 'reauth' | 'error', message: string }}
 */
export async function deleteMyAccount() {
  const user = auth?.currentUser;
  if (!user) return { ok: false, reason: 'error', message: 'Please sign in first.' };

  const ent = computeSubscriptionEntitlement(user);
  if (ent?.source === 'stripe' && ent?.isPro) {
    return { ok: false, reason: 'subscription', message: 'Cancel your Pro subscription first (Manage billing), then delete your account.' };
  }

  // Firebase only lets a fresh session delete a login; check before touching any data.
  const lastSignIn = Date.parse(user.metadata?.lastSignInTime || 0);
  if (!lastSignIn || Date.now() - lastSignIn > RECENT_LOGIN_MS) {
    return { ok: false, reason: 'reauth', message: 'For your safety, sign out and sign back in, then delete within 5 minutes.' };
  }

  try {
    const uid = user.uid;
    for (const name of SUBCOLLECTIONS) {
      const snap = await getDocs(collection(db, 'users', uid, name));
      for (let i = 0; i < snap.docs.length; i += 400) {
        const batch = writeBatch(db);
        snap.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', uid));
    await batch.commit();

    await deleteUser(user);

    Object.keys(localStorage).filter(k => k.startsWith('tradepigeon_') || k.startsWith('goodtrader_') || k.startsWith('day_')).forEach(k => localStorage.removeItem(k));
    return { ok: true };
  } catch (err) {
    console.error('[deleteMyAccount]', err);
    if (String(err.code || '').includes('requires-recent-login')) {
      return { ok: false, reason: 'reauth', message: 'Your data is deleted. Sign out and back in once more to finish removing your login.' };
    }
    return { ok: false, reason: 'error', message: 'Something went wrong part-way. Email support@tradepigeon.com and we will finish deleting your account.' };
  }
}
