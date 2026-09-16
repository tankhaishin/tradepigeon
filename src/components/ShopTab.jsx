import React, { useState, useEffect } from 'react';
import { Check, Lock, Sparkles, ShieldCheck } from 'lucide-react';
import { DuoIceIcon, DuoShopIcon, DuoTrophyIcon, DuoGemIcon, DuoStarIcon } from './DuoIcons';
import { loadStoredData, saveStoredData, subscribeToStorageUpdate, STORAGE_KEYS, DEFAULT_USER_STATS } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';

export default function ShopTab() {
  const [userDp, setUserDp] = useState(() => loadStoredData('goodtrader_user_dp', 0));
  const [userStats, setUserStats] = useState(() => loadStoredData('goodtrader_user_stats', DEFAULT_USER_STATS));
  const [purchasedItems, setPurchasedItems] = useState(() => loadStoredData(STORAGE_KEYS.SHOP_ITEMS, []));
  const [streakFreezes, setStreakFreezes] = useState(() => loadStoredData('goodtrader_streak_freezes', 1));
  const [purchaseToast, setPurchaseToast] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdate(({ key, value }) => {
      if (key === 'goodtrader_user_dp') {
        setUserDp(Number(value) || 0);
      }
      if (key === 'goodtrader_user_stats') {
        setUserStats(value || DEFAULT_USER_STATS);
      }
      if (key === 'goodtrader_streak_freezes') {
        setStreakFreezes(Number(value) || 0);
      }
      if (key === STORAGE_KEYS.SHOP_ITEMS) {
        setPurchasedItems(value || []);
      }
    });
    return unsubscribe;
  }, []);

  const shopItems = [
    {
      id: 'streak_freeze',
      name: 'Vacation & Rest Day Shield',
      price: 500,
      icon: <DuoIceIcon className="w-12 h-12 shrink-0 drop-shadow-md" />,
      tag: 'UTILITY SHIELD',
      tagStyle: 'bg-[#FF6B00] text-white',
      desc: `Protects your multi-session streak when taking a planned vacation or mandatory cooling-off rest day. Currently owned: ${streakFreezes}`,
      isLocked: false,
      isConsumable: true
    },
    {
      id: 'free_sub_month',
      name: '1-Month Pro Subscription Pass ($9.99 Value)',
      price: 5000,
      icon: <DuoStarIcon className="w-12 h-12 shrink-0 drop-shadow-md" />,
      tag: 'DISCIPLINE REWARD',
      tagStyle: 'bg-[#1CB0F6] text-white',
      desc: 'Redeem 5,000 Discipline Points (earned from consistent, compliant execution) for 1 Free Month of Pro.',
      isLocked: false,
      isConsumable: false
    },
    {
      id: 'prop_pass',
      name: 'Prop Account Challenge Voucher ($50K Account)',
      price: 50000,
      icon: <DuoTrophyIcon className="w-12 h-12 shrink-0 drop-shadow-md" />,
      tag: 'INSTITUTIONAL UNDERWRITING',
      tagStyle: 'bg-[#FFC800] text-slate-900',
      desc: 'Earned through 180 consecutive sessions of verified discipline. Currently undergoing institutional underwriting.',
      isLocked: true,
      isConsumable: false
    }
  ];

  const handleBuy = (item) => {
    if (item.isLocked || userDp < item.price) return;
    if (!item.isConsumable && purchasedItems.includes(item.id)) return;

    soundFx.playLevelUp();
    const newDp = Math.max(0, userDp - item.price);
    setUserDp(newDp);
    saveStoredData('goodtrader_user_dp', newDp);

    const updatedStats = {
      ...userStats,
      disciplinePoints: newDp
    };
    setUserStats(updatedStats);
    saveStoredData('goodtrader_user_stats', updatedStats);

    if (item.id === 'streak_freeze') {
      const nextFreezes = streakFreezes + 1;
      setStreakFreezes(nextFreezes);
      saveStoredData('goodtrader_streak_freezes', nextFreezes);
      setPurchaseToast(`Purchased Vacation Shield! You now have ${nextFreezes} shields available.`);
    } else {
      const updatedPurchased = [...purchasedItems, item.id];
      setPurchasedItems(updatedPurchased);
      saveStoredData(STORAGE_KEYS.SHOP_ITEMS, updatedPurchased);
      if (item.id === 'free_sub_month') {
        saveStoredData('goodtrader_is_pro', true);
        setPurchaseToast('Pro Pass unlocked! 1-Month Pro Subscription applied to your account.');
      }
    }

    setTimeout(() => {
      setPurchaseToast('');
    }, 4000);
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

        {/* User DP Balance Counter Badge */}
        <div className="flex items-center gap-2.5 bg-[#182830] px-4 py-2 rounded-2xl border-2 border-[#1CB0F6] border-b-4 border-b-[#147BB0] shadow-md shrink-0">
          <DuoGemIcon className="w-7 h-7 shrink-0" />
          <div className="text-left">
            <span className="text-[9px] font-black text-[#77909D] uppercase tracking-wider block">BALANCE</span>
            <span className="text-lg font-black text-[#1CB0F6] leading-none">{userDp.toLocaleString()} DP</span>
          </div>
        </div>
      </div>

      {/* PURCHASE CONFIRMATION TOAST */}
      {purchaseToast && (
        <div className="p-4 rounded-2xl bg-[#58CC02]/20 border-2 border-[#58CC02] text-white text-xs font-black flex items-center gap-3 animate-fade-in shadow-lg">
          <Sparkles className="text-[#58CC02] shrink-0" size={20} />
          <span>{purchaseToast}</span>
        </div>
      )}

      {/* 2. DISCIPLINE POWER-UPS CARD CONTAINER (HARMONIZED DUO-CARD) */}
      <div className="duo-card p-6 rounded-3xl bg-[#182830] border-2 border-[#20323D] space-y-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#20323D]">
          <h3 className="text-lg font-black text-white">Discipline Power-Ups</h3>
          <span className="text-xs font-black text-[#77909D] uppercase tracking-wider">REDEEM DISCIPLINE POINTS</span>
        </div>

        <div className="space-y-6">
          {shopItems.map((item) => {
            const isBought = !item.isConsumable && purchasedItems.includes(item.id);
            const canAfford = userDp >= item.price;
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
                      <Lock size={14} />
                      <span>LOCKED</span>
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
                      <span>{item.price.toLocaleString()} DP</span>
                    </button>
                  ) : (
                    <div className="px-4 py-2.5 rounded-2xl bg-[#131F24] border-2 border-[#1CB0F6]/50 border-b-4 border-b-[#147BB0]/40 text-[#1CB0F6] font-black text-xs uppercase tracking-wider flex items-center gap-2">
                      <DuoGemIcon className="w-4 h-4 shrink-0" />
                      <span>{item.price.toLocaleString()} DP</span>
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
