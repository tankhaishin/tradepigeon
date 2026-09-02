import React from 'react';

// 1. Tradovate Real Official Logo PNG
export function TradovateLogo({ className = "w-5 h-5" }) {
  return <img src="/images/brokers/tradovate.png" alt="Tradovate Official Logo" className={`${className} object-contain`} />;
}

// 2. MetaTrader 5 Real Official Logo PNG
export function MetaTrader5Logo({ className = "w-5 h-5" }) {
  return <img src="/images/brokers/metatrader5.png" alt="MetaTrader 5 Official Logo" className={`${className} object-contain`} />;
}

// 3. NinjaTrader Real Official Logo PNG
export function NinjaTraderLogo({ className = "w-5 h-5" }) {
  return <img src="/images/brokers/ninjatrader.png" alt="NinjaTrader Official Logo" className={`${className} object-contain`} />;
}

// 4. TradeLocker Real Official Logo PNG
export function TradeLockerLogo({ className = "w-5 h-5" }) {
  return <img src="/images/brokers/tradelocker.png" alt="TradeLocker Official Logo" className={`${className} object-contain`} />;
}

// 5. Universal CSV Logo
export function CsvLogo({ className = "w-5 h-5" }) {
  return <img src="/images/brokers/csv.svg" alt="Universal CSV Logo" className={`${className} object-contain`} />;
}
