import React from 'react';
import InteractiveParrotMascot from './InteractiveParrotMascot';

// Placeholder for features we haven't built for real yet (no fake data in front of paying users).
export default function ComingSoon({ title, line }) {
  return (
    <div className="max-w-md mx-auto py-24 px-6 text-center space-y-4">
      <InteractiveParrotMascot pose="reading" className="w-20 h-20 mx-auto" />
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <p className="text-sm font-bold text-slate-400">{line}</p>
      <span className="inline-block px-3 py-1 rounded-full bg-[#FF6B00]/15 border border-[#FF6B00]/40 text-[#FF6B00] text-xs font-black uppercase tracking-wider">Coming soon</span>
    </div>
  );
}
