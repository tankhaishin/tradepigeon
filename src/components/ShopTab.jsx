import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { DuoIceIcon, DuoShopIcon, DuoTrophyIcon, DuoGemIcon, DuoStarIcon } from './DuoIcons';
import { loadStoredData, saveStoredData, STORAGE_KEYS } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';

export default function ShopTab() {
  const [userGems, setUserGems] = useState(() => loadStoredData('goodtrader_user_gems', 3420));
  const [purchasedItems, setPurchasedItems] = useState(() => loadStoredData(STORAGE_KEYS.SHOP_ITEMS, []));

  useEffect(() => {
    saveStoredData('goodtrader_user_gems', userGems);
  }, [userGems]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.SHOP_ITEMS, purchasedItems);
  }, [purchasedItems]);

  const shopItems = [
    {
      id: 'free_sub_month',
      name: '1-Month Pro Subscription Pass ($9.99 Value)',
      price: 25000,
      icon: <DuoStarIcon className="w-12 h-12 shrink-0 drop-shadow-md" />,
      tag: '6-MONTH DISCIPLINE REWARD',
      tagStyle: 'bg-[#1CB0F6] text-white',
      desc: 'Redeem 25,000 DP Gems (earned from ~6 months of consistent execution) for 1 Free Month of Pro.',
      isLocked: false
    },
    {
      id: 'streak_freeze',
      name: 'Vacation & Rest Day Shield',
      price: 1000,
      icon: <DuoIceIcon className="w-12 h-12 shrink-0 drop-shadow-md" />,
      tag: 'UTILITY SHIELD',
      tagStyle: 'bg-[#FF6B00] text-white',
      desc: 'Protects your multi-session streak when taking a planned vacation or mandatory cooling-off rest day.',
      isLocked: false
    },
    {
      id: 'prop_pass',
      name: 'Prop Account Challenge Voucher ($50K Account)',
      price: 50000,
      icon: <DuoTrophyIcon className="w-12 h-12 shrink-0 drop-shadow-md" />,
      tag: 'INSTITUTIONAL UNDERWRITING',
      tagStyle: 'bg-[#FFC800] text-slate-900',
      desc: 'Earned through 180 consecutive sessions of verified discipline. Currently undergoing institutional underwriting.',
      isLocked: true
    }
  ];

  const handleBuy = (item) => {
    if (!item.isLocked && userGems >= item.price && !purchasedItems.includes(item.id)) {
      soundFx.playSuccess();
      setUserGems(userGems - item.price);
      setPurchasedItems([...purchasedItems, item.id]);
    }
  };

  return (
    <main className="flex-1 min-h-screen lg:pl-28 xl:pl-80 xl:pr-[416px] bg-[#070C1E] p-4 sm:p-6 lg:p-8 text-white space-y-6 pb-24 lg:pb-10 max-w-full overflow-hidden">
      
      {/* 1. TOP HEADER: HARMONIZED WITH ALL OTHER TABS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <DuoShopIcon className="w-10 h-10 shrink-0" />
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Discipline Shop</h2>
          </div>
        </div>

        {/* User Gems Balance Counter Badge */}
        <div className="flex items-center gap-2.5 bg-[#182830] px-4 py-2 rounded-2xl border-2 border-[#1CB0F6] border-b-4 border-b-[#147BB0] shadow-md shrink-0">
          <DuoGemIcon className="w-7 h-7 shrink-0" />
          <div className="text-left">
            <span className="text-[9px] font-black text-[#77909D] uppercase tracking-wider block">BALANCE</span>
            <span className="text-lg font-black text-[#1CB0F6] leading-none">{userGems.toLocaleString()} GEMS</span>
          </div>
        </div>
      </div>

      {/* 2. DISCIPLINE POWER-UPS CARD CONTAINER (HARMONIZED DUO-CARD) */}
      <div className="duo-card p-6 rounded-3xl bg-[#182830] border-2 border-[#20323D] space-y-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#20323D]">
          <h3 className="text-lg font-black text-white">Discipline Power-Ups</h3>
          <span className="text-xs font-black text-[#77909D] uppercase tracking-wider">REDEEM DP GEMS</span>
        </div>

        <div className="space-y-6">
          {shopItems.map((item) => {
            const isBought = purchasedItems.includes(item.id);
            const canAfford = userGems >= item.price;
            const isLocked = item.isLocked;

            return (
              <div 
                key={item.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-[#20323D] last:border-0 last:pb-0"
              >
                {/* Item Details */}
                <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                  <div className="p-3 rounded-2xl bg-[#131F24] border border-[#20323D] shrink-0 shadow-inner">
                    {item.icon}
                  </div>
                  
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base sm:text-lg font-black text-white leading-tight">{item.name}</h4>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg shadow-sm shrink-0 ${item.tagStyle}`}>
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#77909D] leading-relaxed">{item.desc}</p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="shrink-0 sm:self-center">
                  {isLocked ? (
                    <div className="px-4 py-2.5 rounded-2xl bg-[#131F24] border-2 border-[#20323D] text-[#77909D] font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-not-allowed">
                      <span>🔒 LOCKED</span>
                    </div>
                  ) : isBought ? (
                    <div className="px-4 py-2.5 rounded-2xl bg-[#58CC02] border-2 border-[#46A302] border-b-4 border-b-[#388202] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md">
                      <Check size={16} strokeWidth={3} />
                      <span>ACTIVE</span>
                    </div>
                  ) : canAfford ? (
                    <button
                      onClick={() => handleBuy(item)}
                      className="duo-btn-orange px-5 py-2.5 text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer font-black"
                    >
                      <DuoGemIcon className="w-4 h-4 shrink-0" />
                      <span>{item.price.toLocaleString()} GEMS</span>
                    </button>
                  ) : (
                    <div className="px-4 py-2.5 rounded-2xl bg-[#131F24] border-2 border-[#1CB0F6]/50 border-b-4 border-b-[#147BB0]/40 text-[#1CB0F6] font-black text-xs uppercase tracking-wider flex items-center gap-2">
                      <DuoGemIcon className="w-4 h-4 shrink-0" />
                      <span>{item.price.toLocaleString()} GEMS</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
