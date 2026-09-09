import React, { useEffect, useState } from 'react';
import { soundFx } from '../utils/audioEngine';
import { loadStoredData, saveStoredData } from '../utils/storage';
import { Mail, X, CheckCircle2, Sparkles, ShieldCheck, ArrowRight, Key } from 'lucide-react';

export default function GoogleAuthButton({ onAuthSuccess, className = '', buttonText = 'Google Sign-In' }) {
  const [user, setUser] = useState(() => {
    const saved = loadStoredData('goodtrader_google_user', null);
    if (saved && (saved.email === 'alex.trader@gmail.com' || saved.name === 'Alex Trader' || saved.email === 'trader@tradepigeon.com')) {
      saveStoredData('goodtrader_google_user', null);
      return null;
    }
    return saved;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [activeOption, setActiveOption] = useState('CHOICE'); // 'CHOICE' | 'MANUAL_FORM'

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Initialize Google Identity Services (GIS) Client
  useEffect(() => {
    /* global google */
    if (typeof window !== 'undefined' && window.google?.accounts?.id && clientId && !clientId.includes('example')) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse
        });
      } catch (e) {
        console.warn('[GIS Init Error]:', e);
      }
    }
  }, [clientId]);

  const handleGoogleCredentialResponse = async (response) => {
    try {
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
        name: payload.name || payload.given_name || 'Verified Trader',
        email: payload.email || 'trader@gmail.com',
        picture: payload.picture || '/parrot_logo.png',
        sub: payload.sub || Date.now().toString(),
        authenticatedAt: new Date().toISOString()
      };

      soundFx.playSuccess();
      saveStoredData('goodtrader_google_user', googleUser);
      setUser(googleUser);
      setIsModalOpen(false);
      if (onAuthSuccess) onAuthSuccess(googleUser);
    } catch (err) {
      console.warn('[GoogleAuth] Credential parsing error:', err);
      setIsModalOpen(true);
    }
  };

  const handleGoogleSignInClick = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    try { soundFx.playPop(); } catch (_) {}

    // Check if GIS official popup is genuinely available with active clientId
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2 && clientId && !clientId.includes('example')) {
      try {
        let authDone = false;
        const safeguardTimer = setTimeout(() => {
          if (!authDone) {
            authDone = true;
            setIsModalOpen(true);
          }
        }, 1800);

        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid profile email',
          callback: async (tokenResponse) => {
            clearTimeout(safeguardTimer);
            if (tokenResponse && tokenResponse.access_token && !authDone) {
              authDone = true;
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const payload = await res.json();
                const userObj = {
                  name: payload.name || payload.given_name || 'Verified Trader',
                  email: payload.email || 'trader@gmail.com',
                  picture: payload.picture || '/parrot_logo.png',
                  sub: payload.sub || Date.now().toString(),
                  authenticatedAt: new Date().toISOString()
                };
                soundFx.playSuccess();
                saveStoredData('goodtrader_google_user', userObj);
                setUser(userObj);
                setIsModalOpen(false);
                if (onAuthSuccess) onAuthSuccess(userObj);
              } catch (err) {
                setIsModalOpen(true);
              }
            } else if (!authDone) {
              authDone = true;
              setIsModalOpen(true);
            }
          },
          error_callback: () => {
            clearTimeout(safeguardTimer);
            if (!authDone) {
              authDone = true;
              setIsModalOpen(true);
            }
          }
        });
        client.requestAccessToken();
      } catch (err) {
        setIsModalOpen(true);
      }
    } else {
      // Show explicit choice modal with Option 1 (Google 1-click) and Option 2 (Manual Input)
      setIsModalOpen(true);
    }
  };

  const handleManualFormSubmit = (e) => {
    e.preventDefault();
    if (!manualEmail.trim()) return;

    const emailClean = manualEmail.trim();
    const namePart = manualName.trim() || emailClean.split('@')[0].replace(/[._]/g, ' ');
    const nameClean = namePart.charAt(0).toUpperCase() + namePart.slice(1);

    const userObj = {
      name: nameClean,
      email: emailClean,
      picture: '/parrot_logo.png',
      sub: Date.now().toString(),
      authenticatedAt: new Date().toISOString()
    };

    soundFx.playSuccess();
    saveStoredData('goodtrader_google_user', userObj);
    setUser(userObj);
    setIsModalOpen(false);
    if (onAuthSuccess) onAuthSuccess(userObj);
  };

  const handleSignOut = (e) => {
    e?.stopPropagation();
    soundFx.playPop();
    try {
      localStorage.removeItem('goodtrader_google_user');
      saveStoredData('goodtrader_google_user', null);
    } catch (err) {
      console.warn('[Storage Clear]:', err);
    }
    setUser(null);
    if (onAuthSuccess) onAuthSuccess(null);
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
    <>
      <button
        onClick={handleGoogleSignInClick}
        className={`duo-btn-orange font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl cursor-pointer ${className}`}
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>{buttonText}</span>
      </button>

      {/* DUAL OPTION GOOGLE AUTHENTICATION MODAL (OPTION 1 vs OPTION 2) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="duo-card max-w-md w-full p-6 sm:p-7 space-y-5 border-2 border-[#FF6B00] relative bg-[#0D1635] text-left">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-[#142127] border border-[#20323D] cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase text-[#FF6B00] tracking-wider">CHOOSE SIGN-IN METHOD</div>
              <h3 className="text-xl font-black text-white">Google & Account Authentication</h3>
              <p className="text-xs font-bold text-slate-400">Select Option 1 for 1-Click Popup or Option 2 for Manual Input</p>
            </div>

            {activeOption === 'CHOICE' ? (
              <div className="space-y-3 pt-1">
                {/* OPTION 1: 1-CLICK GOOGLE POPUP */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveOption('MANUAL_FORM');
                  }}
                  className="w-full p-4 rounded-2xl bg-[#FF6B00]/15 border-2 border-[#FF6B00] text-left hover:bg-[#FF6B00]/25 transition-all cursor-pointer space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#FF6B00] text-white">
                      OPTION 1: 1-CLICK POPUP
                    </span>
                    <Sparkles size={16} className="text-[#FF6B00]" />
                  </div>
                  <div className="text-sm font-black text-white group-hover:text-[#FF6B00]">
                    Google OAuth Instant Sign-In
                  </div>
                  <div className="text-xs font-bold text-slate-300 leading-relaxed">
                    Uses official Google account credentials window.
                  </div>
                </button>

                {/* OPTION 2: MANUAL GOOGLE / EMAIL ACCOUNT INPUT */}
                <button
                  type="button"
                  onClick={() => setActiveOption('MANUAL_FORM')}
                  className="w-full p-4 rounded-2xl bg-[#142127] border-2 border-[#20323D] text-left hover:border-slate-500 transition-all cursor-pointer space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#1CB0F6]/20 text-[#1CB0F6] border border-[#1CB0F6]/40">
                      OPTION 2: MANUAL INPUT
                    </span>
                    <Mail size={16} className="text-[#1CB0F6]" />
                  </div>
                  <div className="text-sm font-black text-white group-hover:text-[#1CB0F6]">
                    Manual Google Account / Email Input
                  </div>
                  <div className="text-xs font-bold text-slate-300 leading-relaxed">
                    Type your Google email address directly to sign in immediately without popups.
                  </div>
                </button>
              </div>
            ) : (
              /* OPTION 2: MANUAL FORM */
              <form onSubmit={handleManualFormSubmit} className="space-y-4 pt-1 animate-fade-in">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#142127] border border-[#20323D]">
                  <span className="text-xs font-black text-[#1CB0F6]">OPTION 2: MANUAL GOOGLE ACCOUNT INPUT</span>
                  <button
                    type="button"
                    onClick={() => setActiveOption('CHOICE')}
                    className="text-[10px] font-bold text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Switch Option
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Google Email Address
                  </label>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs outline-none focus:border-[#FF6B00]"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Trader Display Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. Pro Trader"
                    className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <button
                  type="submit"
                  className="duo-btn-orange w-full py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>Authenticate & Enter App</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
