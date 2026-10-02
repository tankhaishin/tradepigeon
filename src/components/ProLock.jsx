import React, { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { isProActive } from '../utils/proStatus';

// Shows children to Pro users; Free users see them blurred with an upgrade button.
export default function ProLock({ feature, children }) {
  const [isPro, setIsPro] = useState(isProActive);
  useEffect(() => {
    const update = () => setIsPro(isProActive());
    window.addEventListener('tradepigeon_subscription_updated', update);
    return () => window.removeEventListener('tradepigeon_subscription_updated', update);
  }, []);
  if (isPro) return children;
  return (
    <div className="relative">
      <div aria-hidden="true" className="blur-sm pointer-events-none select-none opacity-60">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('tradepigeon_open_paywall', { detail: { feature } }))}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FF6B00] border-b-4 border-[#C2410C] text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg"
        >
          <Lock size={14} /> Unlock with Pro
        </button>
      </div>
    </div>
  );
}
