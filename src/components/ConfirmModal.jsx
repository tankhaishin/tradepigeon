import React, { useEffect } from 'react';
import { AlertTriangle, LogOut, Trash2, X, ShieldAlert } from 'lucide-react';
import { soundFx } from '../utils/audioEngine';

/**
 * ConfirmModal Component
 * Sleek Duolingo-styled modal replacing native browser window.confirm popups.
 */
export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  icon = null,
  onConfirm,
  onCancel
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        soundFx.playPop();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    soundFx.playSuccess();
    onConfirm();
  };

  const handleCancel = () => {
    soundFx.playPop();
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-[#070C1E]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="duo-card bg-[#0D1635] border-2 border-[#20325C] shadow-2xl rounded-3xl max-w-md w-full p-6 text-center space-y-4 relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Close "X" Button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-[#14203E] hover:bg-[#20325C] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        {/* Mascot / Icon Badge */}
        <div className="flex justify-center pt-2">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-b-4 shadow-lg ${
            variant === 'danger'
              ? 'bg-rose-500/15 border-rose-500/40 border-b-rose-600 text-rose-400'
              : variant === 'warning'
              ? 'bg-amber-500/15 border-amber-500/40 border-b-amber-600 text-amber-400'
              : 'bg-[#1CB0F6]/15 border-[#1CB0F6]/40 border-b-[#1CB0F6] text-[#1CB0F6]'
          }`}>
            {icon ? (
              icon
            ) : variant === 'danger' ? (
              <Trash2 size={28} strokeWidth={2.5} />
            ) : variant === 'warning' ? (
              <AlertTriangle size={28} strokeWidth={2.5} />
            ) : (
              <ShieldAlert size={28} strokeWidth={2.5} />
            )}
          </div>
        </div>

        {/* Title & Body */}
        <div className="space-y-1.5 px-2">
          <h3 className="text-xl font-black text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm font-bold text-slate-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-3">
          <button
            type="button"
            onClick={handleCancel}
            className="py-3 px-4 rounded-2xl bg-[#14203E] hover:bg-[#1C2A4E] text-slate-300 hover:text-white font-black text-xs uppercase tracking-wider border-2 border-[#20325C] border-b-4 border-b-[#15203D] active:translate-y-[2px] transition-all cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className={`py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider border-2 border-b-4 active:translate-y-[2px] transition-all cursor-pointer shadow-lg ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 border-rose-700 border-b-rose-900 text-white'
                : variant === 'warning'
                ? 'bg-[#FF6B00] hover:bg-[#FF8533] border-[#CC5500] border-b-[#994000] text-white'
                : 'bg-[#58CC02] hover:bg-[#61E002] border-[#46A302] border-b-[#357A02] text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
