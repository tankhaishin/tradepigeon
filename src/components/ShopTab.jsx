import React, { useState, useEffect } from 'react';
import { Check, Sparkles, ShieldCheck } from 'lucide-react';
import { DuoIceIcon, DuoShopIcon, DuoGemIcon, DuoStarIcon } from './DuoIcons';
import { loadStoredData, saveStoredData, subscribeToStorageUpdate, STORAGE_KEYS, DEFAULT_USER_STATS, spendDisciplinePoints } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';
import { useAuth } from '../context/AuthContext';
import { activateShopProPass, SUBSCRIPTION_STORAGE_KEYS } from '../utils/subscriptionEngine';

export default function ShopTab() {
  const [userDp, setUserDp] = useState(() => loadStoredData('tradepigeon_user_dp', 0));
  const [userStats, setUserStats] = useState(() => loadStoredData('tradepigeon_user_stats', DEFAULT_USER_STATS));
  const [purchasedItems, setPurchasedItems] = useState(() => loadStoredData(STORAGE_KEYS.SHOP_ITEMS, []));
  const [streakFreezes, setStreakFreezes] = useState(() => loadStoredData('tradepigeon_streak_freezes', 1));
  const [purchaseToast, setPurchaseToast] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdate(({ key, value }) => {
      if (key === 'tradepigeon_user_dp') {
        setUserDp(Number(value) || 0);
      }
      if (key === 'tradepigeon_user_stats') {
        setUserStats(value || DEFAULT_USER_STATS);
      }
      if (key === 'tradepigeon_streak_freezes') {
        setStreakFreezes(Number(value) || 0);
      }
      if (key === STORAGE_KEYS.SHOP_ITEMS) {
        setPurchasedItems(value || []);
      }
    });
    return unsubscribe;
  }, []);

  const [weekendShields, setWeekendShields] = useState(() => loadStoredData('tradepigeon_weekend_shields', 0));

  const { user } = useAuth();
  const [proVoucher, setProVoucher] = useState(() => loadStoredData(SUBSCRIPTION_STORAGE_KEYS.SHOP_VOUCHER, null));

  const isVoucherActive = proVoucher?.expiresAt && Date.now() < Number(proVoucher.expiresAt);
  const voucherDaysLeft = isVoucherActive ? Math.ceil((Number(proVoucher.expiresAt) - Date.now()) / 86400000) : 0;

  const shopItems = [
    {
      id: 'streak_freeze',
      name: 'Streak Freeze',
      price: 500,
      icon: <DuoIceIcon className="w-12 h-12 shrink-0 drop-shadow-md" />,
      tag: 'STREAK',
      tagStyle: 'bg-[#FF6B00] text-white',
      desc: streakFreezes > 0 ? `Protects your streak if you miss a trading day. (Owned: ${streakFreezes})` : 'Protects your streak if you miss a trading day.',
      isLocked: false,
      isConsumable: true
    },
    {
      id: 'weekend_shield',
      name: 'Weekend Rest Shield',
      price: 300,
      icon: <ShieldCheck className="w-10 h-10 text-[#58CC02] shrink-0 drop-shadow-md" />,
      tag: 'REST',
      tagStyle: 'bg-[#58CC02] text-white',
      desc: weekendShields > 0 ? `Safeguards discipline score on holiday market breaks. (Owned: ${weekendShields})` : 'Safeguards discipline score on holiday market breaks.',
      isLocked: false,
      isConsumable: true
    },
    {
      id: 'sound_pack_bell',
      name: 'Floor Bell Sound Pack',
      price: 1200,
      icon: <Sparkles className="w-10 h-10 text-[#FFD700] shrink-0 drop-shadow-md" />,
      tag: 'AUDIO',
      tagStyle: 'bg-[#FFD700] text-slate-950 font-black',
      desc: 'Unlocks vintage Wall Street opening bell and mechanical trading floor chimes.',
      isLocked: false,
      isConsumable: false
    },
    {
      id: 'chart_theme_cyber',
      name: 'Cyber Neon Chart Theme',
      price: 1500,
      icon: <DuoGemIcon className="w-10 h-10 text-cyan-400 shrink-0 drop-shadow-md" />,
      tag: 'THEME',
      tagStyle: 'bg-cyan-500 text-slate-950 font-black',
      desc: 'High-contrast cyan & emerald glow styling for the interactive equity curve.',
      isLocked: false,
      isConsumable: false
    },
    {
      id: 'hud_stealth',
      name: 'Stealth Mode R-Multiple HUD',
      price: 2000,
      icon: <ShieldCheck className="w-10 h-10 text-[#1CB0F6] shrink-0 drop-shadow-md" />,
      tag: 'UTILITY',
      tagStyle: 'bg-[#1CB0F6] text-white',
      desc: 'Displays all PnL figures strictly in R-multiples to eliminate dollar attachment.',
      isLocked: false,
      isConsumable: false
    },
    {
      id: 'free_sub_month',
      name: '1 Month Pro Pass Voucher',
      price: 1500,
      icon: <DuoStarIcon className="w-12 h-12 shrink-0 drop-shadow-md" />,
      tag: 'PRO',
      tagStyle: 'bg-[#1CB0F6] text-white',
      desc: isVoucherActive 
        ? `Pro Pass Active! (${voucherDaysLeft} days remaining). Purchase again to extend by 30 days.` 
        : 'Unlock 30 days of automated broker sync, Gemini AI debriefs, and prop firm drawdown HUD.',
      isLocked: false,
      isConsumable: true
    }
  ];

  const handleBuy = async (item) => {
    if (userDp < item.price) return;
    if (!item.isConsumable && purchasedItems.includes(item.id)) return;

    soundFx.playLevelUp();
    const success = spendDisciplinePoints(item.price);
    if (!success) return;

    const newDp = Math.max(0, userDp - item.price);
    setUserDp(newDp);
    setUserStats(prev => ({
      ...prev,
      disciplinePoints: newDp
    }));

    if (item.id === 'streak_freeze') {
      const nextFreezes = streakFreezes + 1;
      setStreakFreezes(nextFreezes);
      saveStoredData('tradepigeon_streak_freezes', nextFreezes);
      setPurchaseToast(`Streak Freeze acquired! (${nextFreezes} available)`);
    } else if (item.id === 'weekend_shield') {
      const nextShields = weekendShields + 1;
      setWeekendShields(nextShields);
      saveStoredData('tradepigeon_weekend_shields', nextShields);
      setPurchaseToast(`Weekend Rest Shield acquired! (${nextShields} available)`);
    } else if (item.id === 'free_sub_month') {
      const newVoucher = await activateShopProPass(user?.uid, newDp);
      setProVoucher(newVoucher);
      setPurchaseToast('Pro Pass unlocked! 30 days added to your account.');
    } else {
      const updatedPurchased = [...purchasedItems, item.id];
      setPurchasedItems(updatedPurchased);
      saveStoredData(STORAGE_KEYS.SHOP_ITEMS, updatedPurchased);
      
      if (item.id === 'sound_pack_bell') {
        saveStoredData('tradepigeon_sound_pack', 'bell');
        setPurchaseToast('Floor Bell sound pack unlocked and activated!');
      } else if (item.id === 'chart_theme_cyber') {
        saveStoredData('tradepigeon_chart_theme', 'cyber_neon');
        setPurchaseToast('Cyber Neon chart theme unlocked and activated!');
      } else if (item.id === 'hud_stealth') {
        saveStoredData('tradepigeon_stealth_mode', true);
        setPurchaseToast('Stealth Mode R-Multiple HUD enabled!');
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
                  {isBought ? (
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
