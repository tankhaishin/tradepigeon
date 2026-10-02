import React, { createContext, useContext, useState, useEffect } from 'react';
import { refreshProStatus } from '../utils/proStatus';
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
  const [user, setUser] = useState(() => loadStoredData(STORAGE_KEYS.AUTH_USER, null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const isGoogle = fbUser.providerData?.some(p => p.providerId === 'google.com');
        const formattedUser = {
          uid: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Trader',
          email: fbUser.email || '',
          picture: fbUser.photoURL || null,
          authProvider: isGoogle ? 'google' : 'password',
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
                photoURL: fbUser.photoURL || null,
                authProvider: formattedUser.authProvider,
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
        saveStoredData(STORAGE_KEYS.AUTH_USER, formattedUser);
        initCloudFirestoreSync(fbUser.uid);
        refreshProStatus();
      } else {
        setUser(null);
        saveStoredData(STORAGE_KEYS.AUTH_USER, null);
        saveStoredData('tradepigeon_is_pro', false);
        initCloudFirestoreSync(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    soundFx.playPop();
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      const guestUser = {
        uid: `local_${Date.now()}`,
        name: 'Local Trader',
        email: 'trader@local.dev',
        picture: null,
        authProvider: 'guest',
        authenticatedAt: new Date().toISOString()
      };
      setUser(guestUser);
      saveStoredData(STORAGE_KEYS.AUTH_USER, guestUser);
      soundFx.playSuccess();
      return guestUser;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const formatted = {
        uid: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Trader',
        email: fbUser.email || '',
        picture: fbUser.photoURL || null,
        authProvider: 'google',
        authenticatedAt: new Date().toISOString()
      };
      soundFx.playSuccess();
      return formatted;
    } catch (popupErr) {
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
        picture: null,
        authProvider: 'guest',
        authenticatedAt: new Date().toISOString()
      };
      setUser(guestUser);
      saveStoredData(STORAGE_KEYS.AUTH_USER, guestUser);
      soundFx.playSuccess();
      return guestUser;
    }

    const result = await signInWithEmailAndPassword(auth, email, password);
    const fbUser = result.user;
    const formatted = {
      uid: fbUser.uid,
      name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Trader',
      email: fbUser.email || '',
      picture: fbUser.photoURL || null,
      authProvider: 'password',
      authenticatedAt: new Date().toISOString()
    };
    soundFx.playSuccess();
    return formatted;
  };

  const signUpWithEmail = async (email, password, displayName) => {
    soundFx.playPop();
    if (!isFirebaseConfigured || !auth) {
      const guestUser = {
        uid: `local_${Date.now()}`,
        name: displayName || email.split('@')[0],
        email: email,
        picture: null,
        authProvider: 'guest',
        authenticatedAt: new Date().toISOString()
      };
      setUser(guestUser);
      saveStoredData(STORAGE_KEYS.AUTH_USER, guestUser);
      soundFx.playSuccess();
      return guestUser;
    }

    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    const fbUser = result.user;
    const formatted = {
      uid: fbUser.uid,
      name: displayName || fbUser.displayName || fbUser.email?.split('@')[0] || 'Trader',
      email: fbUser.email || '',
      picture: fbUser.photoURL || null,
      authProvider: 'password',
      authenticatedAt: new Date().toISOString()
    };
    soundFx.playSuccess();
    return formatted;
  };

  const signOutUser = async () => {
    soundFx.playPop();
    initCloudFirestoreSync(null);
    if (auth && isFirebaseConfigured) {
      await signOut(auth);
    }
    setUser(null);
    saveStoredData(STORAGE_KEYS.AUTH_USER, null);
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
