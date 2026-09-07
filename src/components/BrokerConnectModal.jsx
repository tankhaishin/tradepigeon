import React, { useState, useEffect } from 'react';
import { 
  Link2, CheckCircle2, ShieldAlert, Cpu, Lock, Key, Server, RefreshCw, X, Shield, Zap, ExternalLink, Activity
} from 'lucide-react';
import { TradovateLogo, MetaTrader5Logo, NinjaTraderLogo, TradeLockerLogo, CsvLogo } from './BrokerLogos';
import { loadStoredData, saveStoredData } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';

export default function BrokerConnectModal({ isOpen, onClose, onAccountAdded }) {
  const [authSuccess, setAuthSuccess] = useState(false);
  const [connectingBroker, setConnectingBroker] = useState(null);

  useEffect(() => {
    const handleOAuthMessage = (event) => {
      if (event.data?.type === 'TRADEPIGEON_BROKER_OAUTH_SUCCESS') {
        const { account } = event.data;
        if (account) {
          const existingAccounts = loadStoredData('goodtrader_accounts_data', []);
          saveStoredData('goodtrader_accounts_data', [account, ...existingAccounts]);
          
          soundFx.playSuccess();
          setAuthSuccess(true);
          setConnectingBroker(null);

          setTimeout(() => {
            if (onAccountAdded) {
              onAccountAdded({ account });
            }
            setAuthSuccess(false);
            onClose();
          }, 1400);
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [onAccountAdded, onClose]);

  if (!isOpen) return null;

  const platforms = [
    { 
      id: 'tradovate', 
      name: 'Tradovate', 
      subtitle: 'NinjaTrader / Futures Direct Socket',
      icon: TradovateLogo, 
      badge: 'POPULAR LIVE OAUTH',
      color: '#FF6B00'
    },
    { 
      id: 'metatrader5', 
      name: 'MetaTrader 5 / MT4', 
      subtitle: 'Read-Only Investor API Bridge',
      icon: MetaTrader5Logo, 
      badge: 'INSTITUTIONAL SYNC',
      color: '#1CB0F6'
    },
    { 
      id: 'tradelocker', 
      name: 'TradeLocker', 
      subtitle: 'OAuth Security Keyhole',
      icon: TradeLockerLogo, 
      badge: 'DIRECT OAUTH',
      color: '#CE82FF'
    },
    { 
      id: 'ninjatrader', 
      name: 'NinjaTrader Desktop', 
      subtitle: 'Live API Telemetry Stream',
      icon: NinjaTraderLogo, 
      badge: 'ULTRA LOW LATENCY',
      color: '#58CC02'
    },
  ];

  const handleLaunchBrokerOAuth = (brokerId) => {
    soundFx.playPop();
    setConnectingBroker(brokerId);

    const width = 560;
    const height = 680;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const popup = window.open(
      `/broker-oauth.html?broker=${brokerId}`,
      `BrokerOAuth_${brokerId}`,
      `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,scrollbars=yes`
    );

    if (popup) {
      popup.focus();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="duo-card max-w-xl w-full p-6 sm:p-8 space-y-6 border-2 border-[#FF6B00] relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-[#142127] border border-[#20323D] transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-[#20323D]">
          <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/20 border border-[#FF6B00]/40 text-[#FF6B00] flex items-center justify-center text-2xl font-black shrink-0">
            <Activity size={24} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6B00]">DIRECT BROKER OAUTH GATEWAY</span>
            <h3 className="text-xl font-black text-white">Connect Broker Account</h3>
          </div>
        </div>

        {authSuccess ? (
          <div className="py-10 text-center space-y-4 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#58CC02]/20 border-2 border-[#58CC02] text-[#58CC02] flex items-center justify-center animate-bounce">
              <CheckCircle2 size={42} />
            </div>
            <h4 className="text-xl font-black text-white">Broker OAuth Authorized!</h4>
            <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto">
              Live socket auto-sync is active. Fills and position risk limits are now tracked automatically in real time!
            </p>
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-white">Select Your Trading Broker / Platform</h4>
              <p className="text-xs font-bold text-slate-400">Click any broker below to launch the official direct OAuth 2.0 login popup window</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {platforms.map((p) => {
                const PlatformIcon = p.icon;
                const isConnecting = connectingBroker === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleLaunchBrokerOAuth(p.id)}
                    className={`p-4 rounded-2xl bg-[#142127] border-2 text-left transition-all group cursor-pointer flex flex-col justify-between space-y-3 ${
                      isConnecting ? 'border-[#FF6B00] bg-[#FF6B00]/10 scale-[1.02]' : 'border-[#20323D] hover:border-[#FF6B00] hover:bg-[#FF6B00]/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <PlatformIcon className="w-8 h-8 object-contain shrink-0" />
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/30 flex items-center gap-1">
                        <span>{p.badge}</span>
                        <ExternalLink size={10} />
                      </span>
                    </div>

                    <div>
                      <div className="text-sm font-black text-white group-hover:text-[#FF6B00] transition-colors flex items-center justify-between">
                        <span>{p.name}</span>
                        {isConnecting && <RefreshCw size={14} className="animate-spin text-[#FF6B00]" />}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">{p.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-[#182830] border border-[#20323D] text-[11px] font-bold text-slate-300 flex items-start gap-2.5">
              <Shield size={16} className="text-[#58CC02] shrink-0 mt-0.5" />
              <span>
                Clicking a broker launches an official OAuth popup window where you sign in on the broker's secure site. TradePigeon never receives your master password.
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

