// TradePigeon Platform & Prop Firm Auto-Identification Engine

export const SUPPORTED_PLATFORMS = [
  { 
    id: 'lucidtrading', 
    name: 'Lucid Trading', 
    subtitle: 'Prop Firm Multi-Account Socket Gateway',
    badge: 'PROP FIRM MULTI-ACCOUNT',
    color: '#00E5FF'
  },
  { 
    id: 'tradovate', 
    name: 'Tradovate', 
    subtitle: 'Official Web Platform & Direct API Gateway',
    badge: 'OFFICIAL API',
    color: '#FF6B00'
  },
  { 
    id: 'apex', 
    name: 'Apex Trader Funding', 
    subtitle: 'Tradovate & Rithmic Prop Accounts',
    badge: 'APEX PROP FIRM',
    color: '#FFD700'
  },
  { 
    id: 'topstep', 
    name: 'Topstep / MyFundedFutures', 
    subtitle: 'Futures Prop Firm Account Gateway',
    badge: 'FUTURES PROP FIRM',
    color: '#00E676'
  },
  { 
    id: 'metatrader5', 
    name: 'MetaTrader 5 / MT4', 
    subtitle: 'Official WebTerminal & Investor API',
    badge: 'OFFICIAL WEBTERMINAL',
    color: '#1CB0F6'
  },
  { 
    id: 'ninjatrader', 
    name: 'NinjaTrader', 
    subtitle: 'Official Account Portal & Live Stream',
    badge: 'OFFICIAL ACCOUNT PORTAL',
    color: '#58CC02'
  },
  { 
    id: 'tradelocker', 
    name: 'TradeLocker', 
    subtitle: 'Official Live Terminal & Socket Feed',
    badge: 'OFFICIAL LIVE WEB',
    color: '#CE82FF'
  },
  { 
    id: 'dxtrade', 
    name: 'DXTrade / Match-Trader', 
    subtitle: 'Prop Firm Direct Web Gateway',
    badge: 'DXTRADE GATEWAY',
    color: '#FF4081'
  }
];

export const detectPlatformFromAccountId = (accId = '') => {
  if (!accId || typeof accId !== 'string') return null;
  const clean = accId.trim().toUpperCase();
  if (!clean) return null;

  if (clean.startsWith('LUCID') || clean.includes('LUCID')) {
    return { id: 'lucidtrading', name: 'Lucid Trading', badge: 'LUCID PROP GATEWAY', type: 'Prop Firm' };
  }
  if (clean.startsWith('APEX') || clean.startsWith('PA-APEX') || clean.includes('APEX')) {
    return { id: 'apex', name: 'Apex Trader Funding', badge: 'APEX PROP ACCOUNT', type: 'Prop Firm' };
  }
  if (clean.startsWith('TOPSTEP') || clean.includes('TOPSTEP') || clean.startsWith('MFF')) {
    return { id: 'topstep', name: 'Topstep / Futures Prop', badge: 'TOPSTEP PROP ACCOUNT', type: 'Prop Firm' };
  }
  if (clean.startsWith('LFE') || clean.startsWith('DEMO') || clean.includes('TRADOVATE')) {
    return { id: 'tradovate', name: 'Tradovate Direct API', badge: 'TRADOVATE API', type: 'Futures Broker' };
  }
  if (/^\d{5,9}$/.test(clean)) {
    return { id: 'metatrader5', name: 'MetaTrader 5 / MT4', badge: 'MT4/MT5 INVESTOR', type: 'Forex / CFD' };
  }
  if (clean.startsWith('NT') || clean.includes('NINJA')) {
    return { id: 'ninjatrader', name: 'NinjaTrader Direct', badge: 'NINJAPORTAL', type: 'Futures Broker' };
  }
  if (clean.includes('@') || clean.startsWith('TL-') || clean.includes('TRADELOCKER')) {
    return { id: 'tradelocker', name: 'TradeLocker Live', badge: 'TRADELOCKER', type: 'Crypto / Forex' };
  }
  if (clean.startsWith('DX') || clean.includes('DXTRADE') || clean.includes('MATCH')) {
    return { id: 'dxtrade', name: 'DXTrade / Match-Trader', badge: 'DXTRADE GATEWAY', type: 'Prop Firm' };
  }

  return null;
};
