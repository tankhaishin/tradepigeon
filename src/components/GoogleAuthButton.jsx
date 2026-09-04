import React, { useEffect, useState } from 'react';
import { soundFx } from '../utils/audioEngine';
import { loadStoredData, saveStoredData } from '../utils/storage';

export default function GoogleAuthButton({ onAuthSuccess, className = '', buttonText = 'Sign in with Google' }) {
  const [user, setUser] = useState(() => {
    const saved = loadStoredData('goodtrader_google_user', null);
    // Purge mock Alex Trader account from browser memory
    if (saved && (saved.email === 'alex.trader@gmail.com' || saved.name === 'Alex Trader')) {
      saveStoredData('goodtrader_google_user', null);
      return null;
    }
    return saved;
  });

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Initialize Google Identity Services (GIS) Client
  useEffect(() => {
    /* global google */
    if (typeof window !== 'undefined' && window.google?.accounts?.id && clientId && !clientId.includes('example')) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialResponse
      });
    }
  }, [clientId]);

  const handleGoogleCredentialResponse = (response) => {
    try {
      // Decode JWT payload (standard 3-part base64)
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);

      const googleUser = {
        name: payload.name || 'Verified Trader',
        email: payload.email || 'trader@tradepigeon.com',
        picture: payload.picture || '/parrot_logo.png',
        sub: payload.sub || Date.now().toString(),
        authenticatedAt: new Date().toISOString()
      };

      soundFx.playSuccess();
      saveStoredData('goodtrader_google_user', googleUser);
      setUser(googleUser);
      if (onAuthSuccess) onAuthSuccess(googleUser);
    } catch (err) {
      console.warn('[GoogleAuth] GIS Credential parsing error:', err);
    }
  };

  const handleGoogleSignIn = () => {
    soundFx.playPop();
    /* global google */
    if (typeof window !== 'undefined' && window.google?.accounts?.id && clientId && !clientId.includes('example')) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialResponse
      });
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('[GoogleAuth] Prompt skipped or closed.');
        }
      });
    } else {
      alert('Google Client ID is initializing. Please ensure VITE_GOOGLE_CLIENT_ID is set in Vercel.');
    }
  };

  const handleSignOut = () => {
    soundFx.playPop();
    try {
      localStorage.clear();
    } catch (err) {
      console.warn('[Storage Clear]:', err);
    }
    setUser(null);
    if (onAuthSuccess) onAuthSuccess(null);
    window.location.href = window.location.origin;
  };

  if (user) {
    return (
      <div className={`flex items-center gap-3 p-2 px-3 rounded-2xl bg-[#182830] border-2 border-[#58CC02] border-b-4 border-b-[#46A302] ${className}`}>
        <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-xl object-cover border border-[#58CC02]" onError={(e) => { e.target.src = '/parrot_logo.png'; }} />
        <div className="text-left leading-tight hidden sm:block">
          <div className="text-xs font-black text-white">{user.name}</div>
          <div className="text-[9px] font-bold text-[#58CC02]">{user.email}</div>
        </div>
        <button
          onClick={handleSignOut}
          className="text-[9px] font-black uppercase text-slate-400 hover:text-rose-400 ml-1 px-2 py-0.5 rounded-lg bg-[#131F24] border border-[#20323D] cursor-pointer"
          title="Sign out of Google Account"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleGoogleSignIn}
      className={`px-4 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-300 border-b-4 border-b-slate-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition-all cursor-pointer ${className}`}
      title="Sign in with Google Account"
    >
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
      <span>{buttonText}</span>
    </button>
  );
}
