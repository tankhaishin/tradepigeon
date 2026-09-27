import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

/**
 * Real-Time Network Connectivity & Offline Resilience Banner
 * Duolingo-styled high-visibility status bar for live futures traders
 */
export default function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' && 'onLine' in navigator ? navigator.onLine : true;
  });
  const [showReconnectedBanner, setShowReconnectedBanner] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedBanner(true);
      const timer = setTimeout(() => {
        setShowReconnectedBanner(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedBanner(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div 
        role="status"
        aria-live="assertive"
        className="sticky top-0 z-50 w-full bg-[#FF9600] text-[#142028] px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-black tracking-wide shadow-lg border-b-2 border-[#D97D00]"
      >
        <WifiOff size={15} className="shrink-0 animate-pulse text-[#142028]" />
        <span>OFFLINE MODE: Local cache active. All trades will sync automatically when reconnected.</span>
      </div>
    );
  }

  if (showReconnectedBanner) {
    return (
      <div 
        role="status"
        aria-live="polite"
        className="sticky top-0 z-50 w-full bg-[#58CC02] text-white px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-black tracking-wide shadow-lg border-b-2 border-[#46A302] transition-all"
      >
        <Wifi size={15} className="shrink-0 text-white" />
        <span>BACK ONLINE: Connection restored. Cloud persistence is active.</span>
      </div>
    );
  }

  return null;
}
