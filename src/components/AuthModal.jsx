import React, { useState } from 'react';
import { Mail, Lock, X, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import GoogleAuthButton from './GoogleAuthButton';
import { soundFx } from '../utils/audioEngine';
import { saveStoredData } from '../utils/storage';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'SIGN_IN' }) {
  const [mode, setMode] = useState(initialMode); // 'SIGN_IN' | 'SIGN_UP'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    soundFx.playSuccess();

    const emailClean = email.trim();
    const namePart = name.trim() || emailClean.split('@')[0].replace(/[._]/g, ' ');
    const nameClean = namePart.charAt(0).toUpperCase() + namePart.slice(1);

    const userObj = {
      name: nameClean,
      email: emailClean,
      picture: '/parrot_logo.png',
      sub: Date.now().toString(),
      authenticatedAt: new Date().toISOString()
    };

    saveStoredData('goodtrader_google_user', userObj);
    if (onAuthSuccess) onAuthSuccess(userObj);
    onClose();
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address above to reset password');
      return;
    }
    soundFx.playPop();
    setForgotSent(true);
    setTimeout(() => setForgotSent(false), 4000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="duo-card max-w-md w-full p-8 sm:p-10 space-y-6 border-2 border-[#20323D] bg-[#0D1635] rounded-3xl relative text-left shadow-2xl">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-[#142127] border border-[#20323D] transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header Icon + Titles */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#070C1E] border-2 border-[#FF6B00] border-b-4 border-b-[#C2410C] flex items-center justify-center p-1 shadow-lg">
            <img src="/parrot_logo.png" alt="TradePigeon Logo" className="w-full h-full object-cover" />
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white tracking-tight">
              {mode === 'SIGN_IN' ? 'Sign in' : 'Create Account'}
            </h2>
            <p className="text-xs font-bold text-slate-300">
              We help traders become profitable!
            </p>
          </div>
        </div>

        {/* 1. Google 1-Click Button */}
        <div className="w-full">
          <GoogleAuthButton 
            onAuthSuccess={(user) => {
              onClose();
              if (onAuthSuccess) onAuthSuccess(user);
            }} 
            className="w-full py-3.5 text-xs tracking-wider" 
            buttonText="Sign in with Google" 
          />
        </div>

        {/* 2. Divider Line: "or" */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-[#20323D]"></div>
          <span className="bg-[#0D1635] px-4 text-xs font-black uppercase text-slate-400 tracking-widest relative z-10">
            or
          </span>
        </div>

        {/* 3. Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'SIGN_UP' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 block">
                Full Name / Alias
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Trader"
                className="w-full p-3.5 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-bold text-xs outline-none focus:border-[#FF6B00] transition-colors"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. trader@domain.com"
              className={`w-full p-3.5 rounded-xl bg-[#142127] border-2 text-white font-bold text-xs outline-none transition-colors ${
                error ? 'border-rose-500 text-rose-200' : 'border-[#20323D] focus:border-[#FF6B00]'
              }`}
              required
              autoFocus
            />
            {error && (
              <span className="text-[11px] font-bold text-rose-400 block pt-0.5 animate-fade-in">
                {error}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full p-3.5 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-bold text-xs outline-none focus:border-[#FF6B00] transition-colors"
            />
          </div>

          {/* Forgot Password link */}
          <div className="flex items-center justify-between pt-0.5">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-bold text-[#1CB0F6] hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
            {forgotSent && (
              <span className="text-[10px] font-bold text-[#58CC02]">
                Reset link sent to email!
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="duo-btn-orange w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-2"
          >
            <span>{mode === 'SIGN_IN' ? 'Sign in' : 'Create Free Account'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="pt-2 text-center text-xs font-bold text-slate-300 border-t border-[#20323D]">
          {mode === 'SIGN_IN' ? (
            <span>
              Don’t have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('SIGN_UP');
                  setError('');
                }}
                className="text-[#FF6B00] font-black hover:underline ml-1 cursor-pointer"
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('SIGN_IN');
                  setError('');
                }}
                className="text-[#FF6B00] font-black hover:underline ml-1 cursor-pointer"
              >
                Sign in
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
