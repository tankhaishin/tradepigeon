import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { soundFx } from '../utils/audioEngine';

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isLiveCloud } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        if (!displayName.trim()) {
          setError('Please enter your trader handle or name.');
          setIsSubmitting(false);
          return;
        }
        await signUpWithEmail(email, password, displayName.trim());
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (err) {
      console.warn('[Auth Error]:', err);
      let msg = err.message || 'Authentication failed.';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        msg = 'Invalid email or password. Please check your credentials.';
      } else if (msg.includes('email-already-in-use')) {
        msg = 'An account with this email already exists. Try signing in.';
      } else if (msg.includes('weak-password')) {
        msg = 'Password should be at least 6 characters.';
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      console.warn('[Google Auth Error]:', err);
      setError(err.message || 'Google sign-in was cancelled or blocked.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-md bg-[#0D1635] border-2 border-[#1C2A4E] border-b-8 border-b-[#141F3C] rounded-3xl p-6 sm:p-8 space-y-6 text-white shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            soundFx.playPop();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Mascot & Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#070C1E] border-2 border-[#FF6B00] border-b-4 border-b-[#C2410C] flex items-center justify-center shadow-lg shrink-0">
            <img src="/parrot_logo.png" alt="TradePigeon" className="w-8 h-8 object-cover rounded-xl" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">
              {mode === 'signup' ? 'Create Cloud Account' : 'Welcome Back'}
            </h3>
            <p className="text-xs font-bold text-slate-400">
              Sync your trading journal seamlessly across desktop & mobile
            </p>
          </div>
        </div>

        {/* Cloud Badge */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] font-bold">
          <ShieldCheck size={16} className="shrink-0 text-sky-400" />
          <span>{isLiveCloud ? 'Live Cloud Sync Active • 256-bit Encrypted' : 'Encrypted Cloud Journal Sync'}</span>
        </div>

        {/* Google 1-Click Button */}
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-sm border-2 border-slate-200 border-b-4 border-b-slate-300 transition-all flex items-center justify-center gap-3 cursor-pointer active:translate-y-0.5 shadow-md"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#1C2A4E]" />
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">or with email</span>
          <div className="flex-1 h-px bg-[#1C2A4E]" />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                Trader Handle / Display Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex NQ Trader"
                  className="w-full bg-[#142127] border-2 border-[#20323D] rounded-xl pl-10 pr-3 py-2.5 text-xs font-black text-white focus:outline-none focus:border-[#FF6B00]"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@gmail.com"
                className="w-full bg-[#142127] border-2 border-[#20323D] rounded-xl pl-10 pr-3 py-2.5 text-xs font-black text-white focus:outline-none focus:border-[#FF6B00]"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full bg-[#142127] border-2 border-[#20323D] rounded-xl pl-10 pr-3 py-2.5 text-xs font-black text-white focus:outline-none focus:border-[#FF6B00]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-[#FF6B00] hover:bg-[#FF8533] border-2 border-[#FF6B00] border-b-4 border-b-[#C2410C] text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5 shadow-lg"
          >
            <span>{isSubmitting ? 'Authenticating...' : mode === 'signup' ? 'Create Account & Sync' : 'Sign In & Sync'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Mode Switcher */}
        <div className="text-center pt-2">
          {mode === 'signup' ? (
            <p className="text-xs text-slate-400 font-bold">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  soundFx.playPop();
                  setMode('signin');
                  setError('');
                }}
                className="text-[#FF6B00] hover:underline font-black cursor-pointer"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-400 font-bold">
              New to TradePigeon?{' '}
              <button
                type="button"
                onClick={() => {
                  soundFx.playPop();
                  setMode('signup');
                  setError('');
                }}
                className="text-[#FF6B00] hover:underline font-black cursor-pointer"
              >
                Create Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
