import React, { useEffect } from 'react';
import { Lock, X, Sparkles } from 'lucide-react';
import InteractiveParrotMascot from './InteractiveParrotMascot';

export default function ComingSoonModal({ isOpen, onClose, featureName = 'Feature' }) {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, 2800);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-fade-in cursor-pointer pointer-events-auto max-w-md w-full px-4"
    >
      <div 
        onClick={onClose}
        className="p-4 sm:p-4.5 rounded-3xl bg-[#182830] border-2 border-[#FF6B00] border-b-6 border-b-[#C2410C] text-white flex items-center justify-between gap-4 shadow-[0_15px_40px_rgba(0,0,0,0.85)] backdrop-blur-lg group hover:scale-[1.02] transition-all"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/20 border border-[#FF6B00]/40 flex items-center justify-center shrink-0">
            <InteractiveParrotMascot pose="calculating" size={44} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#FF6B00] tracking-wider">
              <Lock size={12} />
              <span>PHASE 2 ROADMAP</span>
            </div>
            <h4 className="text-sm font-black text-white truncate">
              {featureName} Coming Soon!
            </h4>
            <p className="text-[11px] font-medium text-slate-400 truncate">
              Calibrating for Phase 2. Click anywhere or wait to dismiss.
            </p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-2 rounded-xl bg-black/30 hover:bg-black/50 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
