import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '../config/firebase';
import { saveStoredData, loadStoredData, STORAGE_KEYS, initCloudFirestoreSync } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';

const AuthContext = createContext({
  user: null,
  loading: true,
  isLiveCloud: false,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOutUser: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadStoredData('tradepigeon_google_user', null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // In offline / local mode, use existing stored local session
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const formattedUser = {
          uid: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Trader',
          email: fbUser.email || '',
          picture: fbUser.photoURL || '/parrot_logo.png',
          authenticatedAt: new Date().toISOString()
        };

        // Sync or retrieve user profile document in Firestore
        if (db) {
          try {
            const userDocRef = doc(db, 'users', fbUser.uid);
            const userSnap = await getDoc(userDocRef);
            if (!userSnap.exists()) {
              await setDoc(userDocRef, {
                uid: fbUser.uid,
                email: fbUser.email || '',
                displayName: fbUser.displayName || 'Trader',
                photoURL: fbUser.photoURL || '/parrot_logo.png',
                plan: 'PRO_TRIAL',
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString()
              }, { merge: true });
            } else {
              await setDoc(userDocRef, { lastLoginAt: new Date().toISOString() }, { merge: true });
            }
          } catch (docErr) {
            console.warn('[Firestore Profile Sync Notice]:', docErr.message);
          }
        }

        setUser(formattedUser);
        saveStoredData('tradepigeon_google_user', formattedUser);
        initCloudFirestoreSync(fbUser.uid);
      } else {
        setUser(null);
        saveStoredData('tradepigeon_google_user', null);
        initCloudFirestoreSync(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    soundFx.playPop();
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      // Offline local mode fallback
      const guestUser = {
        uid: `local_${Date.now()}`,
        name: 'Local Trader',
        email: 'trader@local.dev',
        picture: '/parrot_logo.png',
        authenticatedAt: new Date().toISOString()
      };
      setUser(guestUser);
      saveStoredData('tradepigeon_google_user', guestUser);
      soundFx.playSuccess();
      return guestUser;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      soundFx.playSuccess();
      return result.user;
    } catch (popupErr) {
      // If popup was blocked by mobile Safari or iframe, attempt redirect
      if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
        return await signInWithRedirect(auth, googleProvider);
      }
      throw popupErr;
    }
  };

  const signInWithEmail = async (email, password) => {
    soundFx.playPop();
    if (!isFirebaseConfigured || !auth) {
      const guestUser = {
        uid: `local_${Date.now()}`,
        name: email.split('@')[0],
        email: email,
        picture: '/parrot_logo.png',
        authenticatedAt: new Date().toISOString()
      };
      setUser(guestUser);
      saveStoredData('tradepigeon_google_user', guestUser);
      soundFx.playSuccess();
      return guestUser;
    }

    const result = await signInWithEmailAndPassword(auth, email, password);
    soundFx.playSuccess();
    return result.user;
  };

  const signUpWithEmail = async (email, password, displayName) => {
    soundFx.playPop();
    if (!isFirebaseConfigured || !auth) {
      const guestUser = {
        uid: `local_${Date.now()}`,
        name: displayName || email.split('@')[0],
        email: email,
        picture: '/parrot_logo.png',
        authenticatedAt: new Date().toISOString()
      };
      setUser(guestUser);
      saveStoredData('tradepigeon_google_user', guestUser);
      soundFx.playSuccess();
      return guestUser;
    }

    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    soundFx.playSuccess();
    return result.user;
  };

  const signOutUser = async () => {
    soundFx.playPop();
    initCloudFirestoreSync(null);
    if (auth && isFirebaseConfigured) {
      await signOut(auth);
    }
    setUser(null);
    saveStoredData('tradepigeon_google_user', null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLiveCloud: isFirebaseConfigured,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOutUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
