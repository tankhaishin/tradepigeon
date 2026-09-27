import React from 'react';
import { FileText, XCircle } from 'lucide-react';
import { DuoPalmtreeIcon } from './DuoIcons';
import InteractiveParrotMascot from './InteractiveParrotMascot';

export default function MercyModal({
  isOpen,
  onClose,
  mercyDateStr,
  onMarkRestDay,
  onLogDebrief,
  onResetStreak
}) {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && typeof onClose === 'function') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="duo-card max-w-md w-full p-6 sm:p-8 space-y-6 border-2 border-[#1CB0F6] relative shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <InteractiveParrotMascot pose="welcoming" className="w-16 h-16 shrink-0" />
          <div>
            <span className="text-[10px] font-black uppercase text-[#1CB0F6] tracking-wider">
              STREAK PROTECTOR &bull; CHECK-IN
            </span>
            <h3 className="text-xl font-black text-white">Missed Session Catch-Up</h3>
          </div>
        </div>

        <p className="text-xs font-bold text-slate-300 leading-relaxed bg-[#142127] p-4 rounded-2xl border-2 border-[#20323D]">
          Hey! We noticed you didn't log yesterday's trading session ({mercyDateStr}). What happened?
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onMarkRestDay}
            className="duo-btn-green w-full py-3.5 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <DuoPalmtreeIcon className="w-4 h-4 shrink-0" />
            <span>It Was An Offline Rest Day</span>
          </button>

          <button
            type="button"
            onClick={onLogDebrief}
            className="duo-btn-blue w-full py-3.5 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText size={16} />
            <span>Log Yesterday's Debrief Now</span>
          </button>

          <button
            type="button"
            onClick={onResetStreak}
            className="w-full py-3 rounded-2xl bg-[#142127] hover:bg-[#182830] text-slate-400 font-black text-xs uppercase tracking-wider transition-all border-2 border-[#20323D] cursor-pointer flex items-center justify-center gap-2"
          >
            <XCircle size={16} className="text-rose-400" />
            <span>I Tilted & Missed Day (Reset Streak)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
