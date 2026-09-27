import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Command, Navigation, Zap, ShieldCheck } from 'lucide-react';
import { soundFx } from '../utils/audioEngine';

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Global Navigation',
      icon: <Navigation size={14} className="text-[#1CB0F6]" />,
      items: [
        { key: '1', label: 'Daily Discipline Path & Rituals' },
        { key: '2', label: 'Calendar & Execution Breakdown' },
        { key: '3', label: 'Playbook Setups & Confluences' },
        { key: '4', label: 'Broker Accounts & Data Sync' },
        { key: '5', label: 'Trader Profile, Risk & Storage' }
      ]
    },
    {
      title: 'Power-Trader Actions',
      icon: <Zap size={14} className="text-[#FF6B00]" />,
      items: [
        { key: 'N / M', label: 'Log Manual Trade entry modal' },
        { key: 'D', label: 'Jump to Mindset & AI Debrief' },
        { key: 'S', label: 'Toggle Sound FX & Haptics On / Off' },
        { key: '?', label: 'Open / Close this Shortcuts HUD' },
        { key: 'Esc', label: 'Dismiss open modals and drawers' }
      ]
    }
  ];

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            soundFx.playPop();
            onClose();
          }
        }}
        className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-[#0D1635] border-2 border-[#20325C] border-b-4 border-b-[#14203E] rounded-3xl p-6 sm:p-7 text-white shadow-[0_25px_80px_rgba(0,0,0,0.85)] relative space-y-6 text-left my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#20325C]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/20 border border-[#FF6B00]/40 text-[#FF6B00] flex items-center justify-center shadow-inner">
                <Command size={20} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-[#FF6B00] tracking-widest">
                  PRO SPEED CONTROLS
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                  Keyboard Shortcuts HUD
                </h3>
              </div>
            </div>
            <button
              onClick={() => {
                soundFx.playPop();
                onClose();
              }}
              className="w-9 h-9 rounded-2xl bg-[#14203E] hover:bg-[#1E2E55] text-slate-300 hover:text-white font-black flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Shortcut Groups */}
          <div className="space-y-5">
            {shortcutGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                  {group.icon}
                  <span>{group.title}</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {group.items.map((item, iIdx) => (
                    <div 
                      key={iIdx} 
                      className="p-3 rounded-2xl bg-[#14203E]/60 border border-[#20325C] flex items-center justify-between gap-3"
                    >
                      <span className="text-xs font-bold text-slate-200">
                        {item.label}
                      </span>
                      <kbd className="px-2.5 py-1 rounded-lg bg-[#070C1E] border border-[#2B3D66] border-b-2 font-mono text-xs font-black text-amber-400 shadow-sm shrink-0">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Pro Tip */}
          <div className="pt-2 border-t border-[#20325C] flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#58CC02]" />
              <span>Active across all views when typing focus is not inside an input.</span>
            </div>
            <span className="font-mono text-slate-500 hidden sm:inline">Press [Esc] to exit</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
