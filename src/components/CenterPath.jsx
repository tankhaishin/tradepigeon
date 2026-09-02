import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Lock, ArrowRight, ShieldCheck, Flame, Heart, Gem, CheckSquare, Zap, ArrowLeft, Layers, Check, RefreshCw, RotateCcw, Save, Plus, Trash2, Pencil, X, BookOpen, BarChart2, Tag, ChevronDown, ChevronUp, PlayCircle, Award, Sparkles, Lightbulb, AlertCircle, FileText, XCircle } from 'lucide-react';
import { DuoShieldIcon, DuoLightningIcon, DuoChestIcon, DuoLockIcon, DuoIceIcon, DuoStarIcon, DuoBookIcon, DuoHeadphonesIcon, DuoDumbbellIcon, DuoTrophyIcon, DuoHomeIcon, DuoPalmtreeIcon, DuoCalendarIcon } from './DuoIcons';
import { Duo3dChartBadge, Duo3dPulseBadge, Duo3dBellBadge, Duo3dZenBadge, Duo3dCheckBadge } from './DuolingoFeatureBadges';
import InteractiveParrotMascot from './InteractiveParrotMascot';
import { getRandomDialogue, getRandomMarketWizardQuote } from '../data/dialogueBank';
import { COURSE_MODULES } from '../data/educationBank';
import { loadStoredData, saveStoredData, sanitizeAccountBasketData, STORAGE_KEYS } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';

import AiDebriefModal from './AiDebriefModal';
import InteractiveEquityCurve from './InteractiveEquityCurve';
import RightStatusHub from './RightStatusHub';
import GuidebookModal from './GuidebookModal';

export default function CenterPath() {
  const [activeStep, setActiveStep] = useState(() => loadStoredData('goodtrader_active_step', 1));
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [isGuidebookModalOpen, setIsGuidebookModalOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(() => loadStoredData('goodtrader_completed_steps', []));
  const [currentDay, setCurrentDay] = useState(() => loadStoredData('goodtrader_current_day', 1));
  const [completedDays, setCompletedDays] = useState(() => loadStoredData('goodtrader_completed_days', []));
  const [isVacationActive, setIsVacationActive] = useState(() => loadStoredData('goodtrader_vacation_active', false));
  const [showDetailsState, setShowDetailsState] = useState({});

  useEffect(() => {
    const checkVacation = () => {
      setIsVacationActive(loadStoredData('goodtrader_vacation_active', false));
    };
    window.addEventListener('storage', checkVacation);
    const interval = setInterval(checkVacation, 1000);
    return () => {
      window.removeEventListener('storage', checkVacation);
      clearInterval(interval);
    };
  }, []);
  const unitTitles = [
    "Foundations of Discipline",
    "Advanced Risk Cockpit & Sizing",
    "Playbook Execution Mastery",
    "Emotional Reset & Mindset",
    "Capital Preservation & Discipline",
    "30-Day Execution Consistency"
  ];

  const unitThemes = [
    {
      bg: "bg-[#1CB0F6]",
      border: "border-[#1899D6]",
      borderB: "border-b-[#147BB0]",
      shadow: "shadow-xl",
      badgeBg: "bg-black/20",
      badgeText: "text-sky-100",
      text: "text-white"
    },
    {
      bg: "bg-[#58CC02]",
      border: "border-[#46A302]",
      borderB: "border-b-[#3C8901]",
      shadow: "shadow-xl",
      badgeBg: "bg-black/20",
      badgeText: "text-emerald-100",
      text: "text-white"
    },
    {
      bg: "bg-[#FFC800]",
      border: "border-[#E5B200]",
      borderB: "border-b-[#B88E00]",
      shadow: "shadow-xl",
      badgeBg: "bg-black/20",
      badgeText: "text-amber-950",
      text: "text-amber-950"
    },
    {
      bg: "bg-[#CE82FF]",
      border: "border-[#A559D6]",
      borderB: "border-b-[#853BB8]",
      shadow: "shadow-xl",
      badgeBg: "bg-black/20",
      badgeText: "text-purple-100",
      text: "text-white"
    },
    {
      bg: "bg-[#FF4B4B]",
      border: "border-[#EA2B2B]",
      borderB: "border-b-[#C61F1F]",
      shadow: "shadow-xl",
      badgeBg: "bg-black/20",
      badgeText: "text-rose-100",
      text: "text-white"
    },
    {
      bg: "bg-[#FF6B00]",
      border: "border-[#E05E00]",
      borderB: "border-b-[#B84D00]",
      shadow: "shadow-xl",
      badgeBg: "bg-black/20",
      badgeText: "text-orange-100",
      text: "text-white"
    }
  ];

  const [visibleUnit, setVisibleUnit] = useState(() => Math.ceil(currentDay / 5));
  const currentTheme = unitThemes[(visibleUnit - 1) % unitThemes.length] || unitThemes[0];

  useEffect(() => {
    const handleScroll = () => {
      const unitElements = document.querySelectorAll('[data-unit-num]');
      unitElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 260 && rect.bottom >= 80) {
          const unitNum = parseInt(el.getAttribute('data-unit-num'), 10);
          if (unitNum && unitNum !== visibleUnit) {
            setVisibleUnit(unitNum);
          }
        }
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleUnit]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedMarketRegime, setSelectedMarketRegime] = useState('trending');
  const [selectedCockpitAcc, setSelectedCockpitAcc] = useState('ALL');
  const [isDebriefOpen, setIsDebriefOpen] = useState(false);
  const [selectedSetupTags, setSelectedSetupTags] = useState(['Breakout & Retest', 'S/R Level Sweep']);
  const [expandedModuleId, setExpandedModuleId] = useState('mod_1');
  const [basketsList, setBasketsList] = useState(() => loadStoredData('goodtrader_baskets_list', [
    { 
      id: 'b_1', 
      name: 'Basket A'
    },
    { 
      id: 'b_2', 
      name: 'Basket B'
    }
  ]));

  const [basketCheckedRules, setBasketCheckedRules] = useState({});

  const [accountsData, setAccountsData] = useState(() => loadStoredData('goodtrader_accounts_data', [
    { 
      id: 1, 
      name: 'Account 1 ($150k)', 
      basketName: 'Basket A',
      type: 'FUNDED ACCOUNT', 
      broker: 'Broker Socket 1', 
      sizeVal: 150000,
      pnl: 2450, 
      maxLossVal: 2500,
      riskPct: 0.50,
      fills: '3 Win Fills Today' 
    },
    { 
      id: 2, 
      name: 'Account 2 ($100k)', 
      basketName: 'Basket A',
      type: 'FUNDED ACCOUNT', 
      broker: 'Broker Socket 2', 
      sizeVal: 100000,
      pnl: 1800, 
      maxLossVal: 1500,
      riskPct: 0.40,
      fills: '2 Win Fills Today' 
    },
    { 
      id: 3, 
      name: 'Account 3 ($50k)', 
      basketName: 'Basket B',
      type: 'EVALUATION STEP 1', 
      broker: 'Broker Socket 3', 
      sizeVal: 50000,
      pnl: 0, 
      maxLossVal: 1000,
      riskPct: 0.25,
      fills: 'No Fills Today' 
    },
  ]));

  const formatAccSize = (acc) => {
    if (!acc) return '$100k';
    const raw = acc.sizeVal !== undefined ? acc.sizeVal : (acc.size !== undefined ? acc.size : 100000);
    const num = parseFloat(raw);
    if (isNaN(num) || num <= 0) return '$100k';
    return `$${(num / 1000).toFixed(0)}k`;
  };
  const [draggedAccountId, setDraggedAccountId] = useState(null);
  const [activeDragTargetBasket, setActiveDragTargetBasket] = useState(null);
  const [presetToast, setPresetToast] = useState('');

  const handleSavePreset = () => {
    saveStoredData('goodtrader_basket_preset', accountsData);
    saveStoredData('goodtrader_accounts_data', accountsData);
    setPresetToast('Preset saved! Future daily sessions will auto-load this setup.');
    setTimeout(() => setPresetToast(''), 3000);
  };

  const handleLoadPreset = () => {
    const saved = loadStoredData('goodtrader_basket_preset', null);
    if (saved) {
      setAccountsData(saved);
      saveStoredData('goodtrader_accounts_data', saved);
      setPresetToast('Saved preset loaded successfully!');
    } else {
      setPresetToast('ℹ️ Using current default basket configuration.');
    }
    setTimeout(() => setPresetToast(''), 3000);
  };

  const handleDropAccountToBasket = (targetBasketName) => {
    if (!draggedAccountId) return;
    
    const updated = accountsData.map(acc => {
      if (acc.id === draggedAccountId) {
        return { ...acc, basketName: targetBasketName };
      }
      return acc;
    });

    setAccountsData(updated);
    saveStoredData('goodtrader_accounts_data', updated);
    setDraggedAccountId(null);
    setActiveDragTargetBasket(null);
    soundFx.playSuccess();
  };

  const [selectedAccountToEdit, setSelectedAccountToEdit] = useState(null);
  const [tempAccountPnlInput, setTempAccountPnlInput] = useState('');
  const [tempAccountType, setTempAccountType] = useState('FUNDED ACCOUNT');
  const [tempRiskPctInput, setTempRiskPctInput] = useState('0.50');
  const [tempMaxLossInput, setTempMaxLossInput] = useState('1000');
  const [tempBasketName, setTempBasketName] = useState('Basket A');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');

  const [strategyLibrary, setStrategyLibrary] = useState(() => loadStoredData('goodtrader_strategy_library', [
    { id: 'strat_1', name: 'Breakout & Retest (Key S/R)', rules: ['Key Liquidity Level Swept', '15m Candle Confirmation', 'Minimum 2.0 R:R Target'] },
    { id: 'strat_2', name: 'Key S/R Sweep (Liquidity Grab)', rules: ['Asian High/Low Swept', 'Displacement Back into Range', 'Stop Loss Above Sweep High'] },
    { id: 'strat_3', name: 'Trend Continuation (VWAP Pullback)', rules: ['HTF Trend Direction Aligned', 'VWAP Retest Level Held', 'First Pullback of Session'] },
    { id: 'strat_4', name: 'Custom Playbook Strategy', rules: ['Risk Cap Must Not Exceed 0.50%', 'Manual Exit Rules Enforced'] }
  ]));

  const handleAddRuleToStrategy = (stratId) => {
    const newRuleText = prompt('Enter Custom Entry Rule / Confluence (e.g., FVG Tapped, News Clear for 30m):');
    if (!newRuleText || newRuleText.trim() === '') return;
    const cleanRule = newRuleText.trim();

    const updated = strategyLibrary.map(s => s.id === stratId ? { ...s, rules: [...s.rules, cleanRule] } : s);
    setStrategyLibrary(updated);
    saveStoredData('goodtrader_strategy_library', updated);
    soundFx.playSuccess();
  };

  const handleRemoveRuleFromStrategy = (stratId, ruleIndex) => {
    const updated = strategyLibrary.map(s => s.id === stratId ? { ...s, rules: s.rules.filter((_, idx) => idx !== ruleIndex) } : s);
    setStrategyLibrary(updated);
    saveStoredData('goodtrader_strategy_library', updated);
    soundFx.playPop();
  };

  const [selectedPlaybookId, setSelectedPlaybookId] = useState('strat_1');
  const [checkedRuleIndices, setCheckedRuleIndices] = useState([0, 1, 2]);

  const [isMercyModalOpen, setIsMercyModalOpen] = useState(false);
  const [mercyDateStr, setMercyDateStr] = useState('');

  const totalCumulativePnl = accountsData.reduce((acc, curr) => acc + (parseFloat(curr.pnl) || 0), 0);

  useEffect(() => {
    const sanitized = sanitizeAccountBasketData(accountsData, basketsList);
    setAccountsData(sanitized);
    saveStoredData('goodtrader_accounts_data', sanitized);

    if (selectedCockpitAcc !== 'ALL') {
      const exists = sanitized.some(a => String(a.id) === String(selectedCockpitAcc) || a.name === selectedCockpitAcc);
      if (!exists) setSelectedCockpitAcc('ALL');
    }

    // Check for missed day / mercy catch-up
    const lastDebriefDate = loadStoredData('goodtrader_last_debrief_date', null);
    const todayStr = new Date().toLocaleDateString();
    
    if (lastDebriefDate && lastDebriefDate !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString();
      
      const processedMercyDate = loadStoredData('goodtrader_processed_mercy_date', null);
      if (processedMercyDate !== yesterdayStr && yesterday.getDay() !== 0 && yesterday.getDay() !== 6) {
        const purchasedShopItemsRaw = loadStoredData(STORAGE_KEYS.SHOP_ITEMS, []);
        const purchasedShopItems = Array.isArray(purchasedShopItemsRaw) ? purchasedShopItemsRaw : [];
        if (purchasedShopItems.includes('streak_freeze')) {
          const updatedShopItems = purchasedShopItems.filter(i => i !== 'streak_freeze');
          saveStoredData(STORAGE_KEYS.SHOP_ITEMS, updatedShopItems);
          saveStoredData('goodtrader_processed_mercy_date', yesterdayStr);
          setPresetToast('Streak Shield automatically consumed! Your 14-Day Streak is protected.');
          setTimeout(() => setPresetToast(''), 4000);
        } else {
          setMercyDateStr(yesterdayStr);
          setIsMercyModalOpen(true);
        }
      }
    }
  }, []);

  const handleResync = () => {
    setIsSyncing(true);
    soundFx.playPop();
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccessMsg('Broker Sockets & Statements Synced Successfully!');
      soundFx.playSuccess();
      setTimeout(() => setSyncSuccessMsg(''), 3000);
    }, 900);
  };

  const handleRenameBasket = (oldName) => {
    const newName = prompt(`Rename "${oldName}" to:`, oldName);
    if (!newName || newName.trim() === '' || newName === oldName) return;
    const cleanName = newName.trim();
    
    const updatedBaskets = basketsList.map(b => b.name === oldName ? { ...b, name: cleanName } : b);
    setBasketsList(updatedBaskets);
    saveStoredData('goodtrader_baskets_list', updatedBaskets);

    const updatedAccounts = accountsData.map(acc => acc.basketName === oldName ? { ...acc, basketName: cleanName } : acc);
    setAccountsData(updatedAccounts);
    saveStoredData('goodtrader_accounts_data', updatedAccounts);
    soundFx.playSuccess();
  };

  const handleAddNewBasket = () => {
    const basketNameInput = prompt('Enter New Risk Management Basket Name (e.g., Aggressive 1.5%, Conservative 0.25%, Scalp Pack):');
    if (!basketNameInput || basketNameInput.trim() === '') return;
    const cleanName = basketNameInput.trim();
    const newBasket = { 
      id: `b_${Date.now()}`, 
      name: cleanName,
      riskLabel: 'Custom Risk Profile'
    };
    const updatedBaskets = [...basketsList, newBasket];
    setBasketsList(updatedBaskets);
    saveStoredData('goodtrader_baskets_list', updatedBaskets);
    soundFx.playSuccess();
  };

  const handleDeleteBasket = (basketId, basketName) => {
    if (basketsList.length <= 1) {
      console.warn('You must keep at least 1 active strategy basket.');
      return;
    }
    if (!confirm(`Delete basket "${basketName}"? Accounts in this basket will be moved to No Trade Today.`)) return;

    const updatedBaskets = basketsList.filter(b => b.id !== basketId);
    setBasketsList(updatedBaskets);
    saveStoredData('goodtrader_baskets_list', updatedBaskets);

    const updatedAccounts = accountsData.map(acc => 
      acc.basketName === basketName ? { ...acc, basketName: 'No Trade Today' } : acc
    );
    setAccountsData(updatedAccounts);
    saveStoredData('goodtrader_accounts_data', updatedAccounts);
    soundFx.playPop();
  };

  const handleSaveAccountPnlOverride = (e) => {
    e.preventDefault();
    if (!selectedAccountToEdit) return;
    const parsedPnl = parseFloat(tempAccountPnlInput) || 0;
    const parsedRiskPct = parseFloat(tempRiskPctInput) || 0.5;
    const parsedMaxLoss = parseFloat(tempMaxLossInput) || 1000;

    const updated = accountsData.map(acc => 
      acc.id === selectedAccountToEdit.id ? { 
        ...acc, 
        pnl: parsedPnl,
        type: tempAccountType,
        riskPct: parsedRiskPct,
        maxLossVal: parsedMaxLoss,
        basketName: tempBasketName
      } : acc
    );
    setAccountsData(updated);
    saveStoredData('goodtrader_accounts_data', updated);
    soundFx.playSuccess();
    setSelectedAccountToEdit(null);
  };

  useEffect(() => {
    saveStoredData('goodtrader_active_step', activeStep);
  }, [activeStep]);

  useEffect(() => {
    saveStoredData('goodtrader_completed_steps', completedSteps);
  }, [completedSteps]);

  // Market Wizard Quote of the Day state
  const [wizardQuote, setWizardQuote] = useState(getRandomMarketWizardQuote());

  // Dynamic randomized parrot speech bubble text
  const [parrotSpeech, setParrotSpeech] = useState(getRandomDialogue('initialGreeting'));

  const currentParrotPose = 
    activeStep > 4 ? 'celebrating' :
    activeStep === 4 ? 'thinking' :
    selectedMood === 'revenge' ? 'revenge' :
    selectedMood === 'anxious' ? 'anxious' :
    selectedMood === 'tired' ? 'tired' :
    selectedMood === 'zen' ? 'happy' : 'neutral';

  useEffect(() => {
    if (activeStep > 4) {
      setParrotSpeech(getRandomDialogue('completed'));
    } else if (activeStep === 4) {
      setParrotSpeech(getRandomDialogue('step4'));
    } else if (activeStep === 3) {
      setParrotSpeech(getRandomDialogue('step3'));
    } else if (activeStep === 2) {
      setParrotSpeech(getRandomDialogue('step2'));
    } else if (selectedMood) {
      setParrotSpeech(getRandomDialogue(selectedMood));
    } else {
      setParrotSpeech(getRandomDialogue('initialGreeting'));
    }
  }, [selectedMood, activeStep]);

  const moods = [
    { id: 'zen', label: 'In The Zone (Flow State)', icon: <DuoShieldIcon className="w-7 h-7" />, badge: 'PRO EDGE' },
    { id: 'anxious', label: 'Slightly Anxious / FOMO', icon: <DuoLightningIcon className="w-7 h-7" />, badge: 'CAUTION' },
    { id: 'revenge', label: 'Eager to Revenge Loss', icon: <Flame size={24} className="text-rose-500 fill-rose-500" />, badge: 'HIGH RISK' },
    { id: 'tired', label: 'Low Energy / Fatigue', icon: <DuoIceIcon className="w-7 h-7" />, badge: 'FATIGUE' },
  ];

  useEffect(() => {
    saveStoredData('goodtrader_current_day', currentDay);
  }, [currentDay]);

  useEffect(() => {
    saveStoredData('goodtrader_completed_days', completedDays);
  }, [completedDays]);

  const markStepComplete = (stepNum) => {
    soundFx.playSuccess();
    const newCompletedSteps = completedSteps.includes(stepNum) ? completedSteps : [...completedSteps, stepNum];
    setCompletedSteps(newCompletedSteps);

    if (stepNum === 4) {
      if (!completedDays.includes(currentDay)) {
        const nextCompletedDays = [...completedDays, currentDay];
        setCompletedDays(nextCompletedDays);
        saveStoredData('goodtrader_completed_days', nextCompletedDays);
      }
      const nextDay = currentDay + 1;
      setCurrentDay(nextDay);
      saveStoredData('goodtrader_current_day', nextDay);
      setCompletedSteps([]);
      saveStoredData('goodtrader_completed_steps', []);
      setActiveStep(1);
      setIsStepModalOpen(false);
    } else {
      setActiveStep(stepNum + 1);
    }
  };

  const toggleSetupTag = (tag) => {
    if (selectedSetupTags.includes(tag)) {
      setSelectedSetupTags(selectedSetupTags.filter(t => t !== tag));
    } else {
      setSelectedSetupTags([...selectedSetupTags, tag]);
    }
  };

  return (
    <main className="flex-1 min-h-screen lg:pl-28 xl:pl-80 xl:pr-8 bg-[#070C1E] p-4 sm:p-6 lg:p-8 text-white space-y-8 pb-24 lg:pb-10 max-w-full overflow-x-clip">
      
      {/* 2-COLUMN UNIFIED PROTOCOL DASHBOARD GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start w-full max-w-7xl mx-auto">
        
        {/* LEFT STAGE (7 Cols): 3D PROTOCOL PATH & JOURNEY MAP */}
        <div className="xl:col-span-7 space-y-6 flex flex-col items-center">
          
          {/* 2. DUOLINGO MULTI-DAY CAMPAIGN MAP (30-DAY JOURNEY / 6 UNITS) */}
          <div className="relative py-4 flex flex-col items-center space-y-10 z-10 w-full">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((dayNum) => {
              const isDayCompleted = completedDays.includes(dayNum);
              const isDayActive = dayNum === currentDay;
              const isDayLocked = dayNum > currentDay;
              const isUnitStart = (dayNum - 1) % 5 === 0;
              const unitNum = Math.ceil(dayNum / 5);

              const unitTitles = [
                "Foundations of Discipline",
                "Advanced Risk Cockpit & Sizing",
                "Playbook Execution Mastery",
                "Emotional Reset & Mindset",
                "Capital Preservation & Discipline",
                "30-Day Execution Consistency"
              ];

              return (
                <div key={dayNum} id={`day-node-${dayNum}`} className="w-full max-w-lg mx-auto relative flex flex-col items-center space-y-4 scroll-mt-28">
                  
                  {/* UNIT SECTION HEADER BANNER (EXACT MATCH WITH IMAGE 1) */}
                  {isUnitStart && (() => {
                    return (
                      <div data-unit-num={unitNum} className="w-full my-4 p-5 sm:p-6 rounded-3xl bg-[#1CB0F6] border-2 border-[#1899D6] border-b-8 border-b-[#147BB0] text-white space-y-3 shadow-2xl relative text-left">
                        {/* Top Badges & Right Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 border border-white/30 px-3 py-1 rounded-full text-white">
                              UNIT {unitNum} OF 6 &bull; SESSION {dayNum} OF 30
                            </span>
                            <span className="text-[11px] font-black uppercase tracking-wider bg-[#FFC800] text-slate-950 px-3 py-1 rounded-full border border-amber-500 shadow-sm">
                              14-SESSION STREAK
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                soundFx.playPop();
                                setCompletedSteps([]);
                                saveStoredData('goodtrader_completed_steps', []);
                              }}
                              className="px-3.5 py-1.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-black border border-white/30 flex items-center gap-1.5 cursor-pointer backdrop-blur-sm transition-all active:scale-95 shadow-sm"
                            >
                              <RotateCcw size={14} />
                              <span>Reset</span>
                            </button>

                            <button
                              onClick={() => {
                                soundFx.playPop();
                                setIsGuidebookModalOpen(true);
                              }}
                              className="px-3.5 py-1.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-black border border-white/30 flex items-center gap-1.5 cursor-pointer backdrop-blur-sm transition-all active:scale-95 shadow-sm"
                            >
                              <BookOpen size={14} />
                              <span>Guidebook</span>
                            </button>
                          </div>
                        </div>

                        {/* Main Title Header */}
                        <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                          Unit {unitNum}: {unitTitles[unitNum - 1] || `Unit ${unitNum}`}
                        </h3>
                      </div>
                    );
                  })()}

                  {/* ACTIVE DAY HEADER ROW BANNER */}
                  {isDayActive && (
                    isVacationActive ? (
                      <div className="w-full p-4 rounded-2xl bg-[#142127] border-2 border-[#00F0FF] border-b-4 border-b-[#00D8E6] text-white flex items-center justify-between shadow-xl">
                        <div className="flex items-center gap-3">
                          <DuoPalmtreeIcon className="w-7 h-7 text-[#00F0FF] shrink-0" />
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#00F0FF]">
                              STREAK PROTECTED &bull; VACATION FREEZE ACTIVE
                            </span>
                            <h4 className="text-sm font-black text-white">
                              Daily Execution Protocol Is Paused
                            </h4>
                          </div>
                        </div>
                        <span className="text-[10px] font-black px-3 py-1 rounded-xl bg-[#00F0FF] text-slate-900 uppercase tracking-wider font-black shadow-md">
                          FREEZE
                        </span>
                      </div>
                    ) : (
                      <div className="w-full p-4 rounded-2xl bg-[#1CB0F6] border-2 border-[#1899D6] border-b-4 border-b-[#147BB0] text-white flex items-center justify-between shadow-xl animate-pulse">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-sky-100">
                            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} &bull; SESSION {dayNum}
                          </span>
                          <h4 className="text-sm font-black text-white">
                            Session {dayNum} Active Protocol
                          </h4>
                        </div>
                        <span className="text-[10px] font-black px-3 py-1 rounded-xl bg-white text-[#1CB0F6] uppercase tracking-wider shadow-md">
                          IN PROGRESS
                        </span>
                      </div>
                    )
                  )}

                  {/* SOLID COLOR 3D DUOLINGO COMPLETED DAY CARD */}
                  {isDayCompleted ? (
                    <div 
                      onClick={() => soundFx.playPop()}
                      className="w-full max-w-xl mx-auto p-6 sm:p-8 rounded-3xl border-2 border-[#58CC02] border-b-[6px] border-b-[#388202] bg-[#0D1635] text-white space-y-6 shadow-xl hover:shadow-[0_20px_50px_rgba(88,204,2,0.25)] hover:-translate-y-1 active:translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden relative group text-left"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-[#58CC02]" />

                      {/* Top Header Badge */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Duo3dCheckBadge className="w-11 h-11 shrink-0 drop-shadow-lg group-hover:scale-110 transition-transform" />
                          <div>
                            <span className="text-xs font-black uppercase tracking-widest text-[#58CC02] block">
                              DAY {dayNum} AUDIT LOGGED
                            </span>
                            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight group-hover:text-[#58CC02] transition-colors">
                              Flawless Execution
                            </h3>
                          </div>
                        </div>
                        <span className="text-xs font-black text-white bg-[#58CC02] border-b-4 border-b-[#388202] px-4 py-1.5 rounded-2xl shadow-md">
                          +350 DP
                        </span>
                      </div>

                      {/* 1. HERO SESSION DEBRIEF NOTE */}
                      <div className="flex items-start gap-3.5 py-3 border-y border-[#1C2A4E]">
                        <Duo3dZenBadge className="w-10 h-10 shrink-0 drop-shadow-md mt-0.5" />
                        <p className="text-base font-black text-white leading-snug italic flex-1 min-w-0">
                          "{loadStoredData(`goodtrader_session_note_day_${dayNum}`, 'Respected 1.0R stop loss on NQ sweep. Zero tilt chasing after first loss.')}"
                        </p>
                      </div>

                      {/* 2. PROCESS-FIRST BEHAVIORAL MATRIX (VIBRANT ONLY FOR CATEGORIES WITH TRADES TAKEN) */}
                      {(() => {
                        const categories = [
                          { id: 'win', label: 'DISCIPLINED WIN', count: 1, pnl: '+$1,290.00', activeBg: 'bg-[#58CC02] border-b-4 border-[#388202] text-white shadow-[#58CC02]/25' },
                          { id: 'good_loss', label: 'DISCIPLINED LOSS', count: 1, pnl: '-$425.00', activeBg: 'bg-[#1CB0F6] border-b-4 border-[#147BB0] text-white shadow-[#1CB0F6]/25' },
                          { id: 'breakeven', label: 'DISCIPLINED BE', count: 0, pnl: '$0.00', activeBg: 'bg-[#CE82FF] border-b-4 border-[#9D28EC] text-white' },
                          { id: 'toxic_win', label: 'TOXIC WIN', count: 0, pnl: '$0.00', activeBg: 'bg-[#FFC800] border-b-4 border-[#8A6B00] text-slate-950' },
                          { id: 'toxic_be', label: 'TOXIC BE', count: 0, pnl: '$0.00', activeBg: 'bg-[#00F0FF] border-b-4 border-[#00B3BF] text-slate-950' },
                          { id: 'double_failure', label: 'DOUBLE FAILURE', count: 0, pnl: '$0.00', activeBg: 'bg-[#FF4B4B] border-b-4 border-[#C62828] text-white' },
                          { id: 'missed_trade', label: 'MISSED TRADE', count: 0, pnl: '0 Setups', activeBg: 'bg-amber-500 border-b-4 border-amber-700 text-slate-950', isFullWidth: true },
                        ];

                        return (
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            {categories.map((cat) => {
                              const hasTrades = cat.count > 0;
                              return (
                                <div
                                  key={cat.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    soundFx.playPop();
                                  }}
                                  className={`p-4 rounded-2xl transition-all duration-150 space-y-1.5 shadow-md hover:-translate-y-1 hover:scale-105 active:translate-y-0.5 cursor-pointer ${
                                    cat.isFullWidth ? 'col-span-2' : ''
                                  } ${
                                    hasTrades
                                      ? `${cat.activeBg} shadow-lg ring-2 ring-white/20`
                                      : 'bg-[#182830] border-2 border-[#20323D] text-slate-300 hover:border-[#1CB0F6]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-wider block opacity-95">
                                      {cat.label}
                                    </span>
                                    {hasTrades && (
                                      <span className="text-[10px] font-black font-mono opacity-90 bg-black/25 px-2 py-0.5 rounded-lg border border-white/20">
                                        {cat.pnl}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xl font-black leading-none">
                                    {cat.id === 'missed_trade' ? `${cat.count} Missed` : `${cat.count} ${cat.count === 1 ? 'Trade' : 'Trades'}`}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <>
                      {/* UPCOMING LOCKED DAY BANNER */}
                      {isDayLocked && (
                        <div className="w-full p-3 rounded-2xl bg-[#182830]/60 border-2 border-[#20323D] text-slate-500 flex items-center justify-between opacity-70">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                              SESSION {dayNum} UPCOMING
                            </span>
                            <h4 className="text-xs font-black text-slate-400">
                              Session {dayNum} Milestone
                            </h4>
                          </div>
                          <span className="text-[9px] font-black uppercase text-slate-500 px-2 py-0.5 rounded bg-black/20">
                            LOCKED
                          </span>
                        </div>
                      )}

                      {/* 3D S-CURVE PATH CONNECTOR SVG CONTAINER (ACTIVE DAY ONLY) */}
                      <div className="relative w-[360px] mx-auto py-4 min-h-[460px] flex flex-col items-center">
                        <svg className="absolute top-0 left-0 w-[360px] h-[460px] pointer-events-none z-0" viewBox="0 0 360 460">
                          <path 
                            d="M 180 50 C 270 90, 270 140, 260 160 C 245 195, 100 220, 100 270 C 100 310, 180 340, 180 380" 
                            fill="none" 
                            stroke="#142127" 
                            strokeWidth="28" 
                            strokeLinecap="round"
                          />
                          <path 
                            d="M 180 50 C 270 90, 270 140, 260 160 C 245 195, 100 220, 100 270 C 100 310, 180 340, 180 380" 
                            fill="none" 
                            stroke="#2B3840" 
                            strokeWidth="22" 
                            strokeLinecap="round"
                          />
                          <path 
                            d="M 180 50 C 270 90, 270 140, 260 160 C 245 195, 100 220, 100 270 C 100 310, 180 340, 180 380" 
                            fill="none" 
                            stroke={isDayActive ? "#1899D6" : "#20323D"} 
                            strokeWidth="16" 
                            strokeLinecap="round"
                          />
                          <path 
                            d="M 180 50 C 270 90, 270 140, 260 160 C 245 195, 100 220, 100 270 C 100 310, 180 340, 180 380" 
                            fill="none" 
                            stroke={isDayActive ? "#1CB0F6" : "#283C49"} 
                            strokeWidth="12" 
                            strokeLinecap="round"
                          />
                          <path 
                            d="M 180 50 C 270 90, 270 140, 260 160 C 245 195, 100 220, 100 270 C 100 310, 180 340, 180 380" 
                            fill="none" 
                            stroke={isDayActive ? "#8BE4FF" : "#52656D"} 
                            strokeWidth="3" 
                            strokeDasharray="8 8"
                            strokeLinecap="round"
                          />
                        </svg>

                        {/* 4 CORE BUTTON NODES PER ACTIVE DAY */}
                        <div className="relative z-10 w-full space-y-8 flex flex-col items-center pt-2">
                          {[
                            { stepNum: 1, title: "1. Mindset Check", icon: <DuoStarIcon className="w-8 h-8" />, x: 0 },
                            { stepNum: 2, title: "2. Risk Cockpit", icon: <DuoShieldIcon className="w-7 h-7" />, x: 80 },
                            { stepNum: 3, title: "3. Playbook Rules", icon: <DuoChestIcon className="w-8 h-8" />, x: -80 },
                            { stepNum: 4, title: "4. Session Audit & Log", icon: <DuoTrophyIcon className="w-9 h-9" />, x: 0 },
                          ].map((node) => {
                            const isStepCompleted = isDayActive && completedSteps.includes(node.stepNum);
                            const isCurrentNextStep = isDayActive && !isStepCompleted && (node.stepNum === 1 || completedSteps.includes(node.stepNum - 1));
                            const isStepActive = isDayActive && activeStep === node.stepNum;
                            const isStepHighlighted = isCurrentNextStep || isStepActive;
                            const isStepLocked = isDayLocked || (!isStepCompleted && !isStepHighlighted);

                            return (
                              <div 
                                key={node.stepNum} 
                                className={`relative flex flex-col items-center transition-all duration-300 ${isStepActive ? 'z-50' : 'z-10'}`}
                                style={{ transform: `translateX(${node.x}px)` }}
                              >
                                {/* ORANGE TRADEPIGEON MASCOT PLANTED DIRECTLY ON TOP OF 3D PUCK */}
                                {isCurrentNextStep && (
                                  <motion.div 
                                    layoutId="activeMascotPigeon"
                                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                                    onClick={() => {
                                      setActiveStep(node.stepNum);
                                      setIsStepModalOpen(true);
                                      soundFx.playPop();
                                    }}
                                    className="absolute -top-16 left-1/2 -translate-x-1/2 z-30 cursor-pointer flex flex-col items-center group pointer-events-auto"
                                  >
                                    {/* Speech Badge Above Head */}
                                    <div className="px-3 py-0.5 bg-[#1CB0F6] border-2 border-[#1899D6] border-b-4 border-b-[#147BB0] rounded-xl text-white font-black text-[11px] uppercase tracking-wider animate-bounce shadow-xl whitespace-nowrap mb-0.5">
                                      START
                                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1CB0F6] rotate-45" />
                                    </div>

                                    {/* Hero 3D TradePigeon Mascot Standing Solidly On Button */}
                                    <InteractiveParrotMascot 
                                      pose={isStepCompleted ? 'happy' : 'map_perched'} 
                                      className="w-14 h-14 group-hover:scale-110 transition-transform" 
                                    />
                                    
                                    {/* Contact Ground Foot Shadow */}
                                    <div className="w-9 h-2 bg-black/50 rounded-[50%] blur-[1px] -mt-1.5 z-0" />
                                  </motion.div>
                                )}

                                {/* Oval Outer Track Socket Trench (Matching Real Duolingo) */}
                                <div className={`relative flex items-center justify-center rounded-[50%] transition-all ${
                                  isStepHighlighted 
                                    ? 'w-[98px] h-[86px] bg-[#142127] border-4 border-[#1CB0F6]' 
                                    : 'w-[98px] h-[86px] bg-[#142127]/90 border-4 border-[#20323D]'
                                }`}>
                                  {/* Oval 3D Puck Base Container */}
                                  <div className="relative w-[78px] h-[66px]">
                                    {/* Bottom 3D Oval Base (Offset 10px downwards) */}
                                    <div className={`absolute bottom-0 left-0 w-[78px] h-[56px] rounded-[50%] ${
                                      isStepLocked 
                                        ? 'bg-[#0E171B]'
                                        : isStepCompleted 
                                        ? 'bg-[#3B8A02]' 
                                        : isStepHighlighted 
                                        ? 'bg-[#147BB0]' 
                                        : 'bg-[#16232B]'
                                    }`} />

                                    {/* Top Floating Oval Face Disk */}
                                    <button
                                      disabled={isStepLocked}
                                      onClick={() => {
                                        if (isDayActive) {
                                          setActiveStep(node.stepNum);
                                          setIsStepModalOpen(true);
                                          soundFx.playPop();
                                        }
                                      }}
                                      className={`absolute top-0 left-0 w-[78px] h-[56px] rounded-[50%] flex items-center justify-center font-black duo-oval-top-face ${
                                        isStepLocked 
                                          ? 'bg-[#142127] text-[#37464F] cursor-not-allowed'
                                          : isStepCompleted
                                          ? 'bg-[#58CC02] text-white cursor-pointer'
                                          : isStepHighlighted
                                          ? 'bg-[#1CB0F6] text-white cursor-pointer'
                                          : 'bg-[#20323D] text-[#93A5B1] hover:text-white cursor-pointer'
                                      }`}
                                    >
                                      {isStepLocked ? (
                                        <Lock size={20} className="text-[#37464F]" />
                                      ) : isStepCompleted ? (
                                        <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center">
                                          <Check className="w-6 h-6 stroke-[3.5] text-white" />
                                        </div>
                                      ) : (
                                        node.icon
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Node Label */}
                                <span className={`text-[11px] font-black mt-1.5 px-2.5 py-0.5 rounded-lg text-center ${
                                  isStepActive ? 'text-[#1CB0F6] bg-[#182830] border border-[#1CB0F6]' : isStepCompleted ? 'text-[#58CC02]' : 'text-[#52656D]'
                                }`}>
                                  {node.title}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {/* GRAND FINISH LINE & GRADUATION SHRINE (AFTER DAY 30) */}
            <div className="w-full max-w-lg mx-auto my-8 p-6 rounded-3xl bg-[#FFC800] border-4 border-[#E5B200] border-b-8 border-b-[#B88E00] text-[#4B3C00] flex flex-col items-center text-center space-y-4 shadow-2xl">
              <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center border-4 border-white/50 shadow-inner">
                <DuoTrophyIcon className="w-12 h-12" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider bg-black/10 px-3 py-1 rounded-xl">
                  SEASON 1 FINISH LINE &bull; DAY 30 MILESTONE
                </span>
                <h3 className="text-xl font-black text-black leading-tight pt-1">
                  30-Day Execution Consistency Badge
                </h3>
                <p className="text-xs font-bold text-amber-950/80 max-w-sm">
                  30 days doesn't make you a guru—it proves you can follow a rules-based process without tilting. Claim your 30-Day Badge and unlock Season 2!
                </p>
              </div>
              <button 
                onClick={() => {
                  soundFx.playTrophy();
                }}
                className="w-full py-3.5 rounded-2xl bg-black text-white font-black text-xs uppercase tracking-wider hover:bg-slate-900 transition-all cursor-pointer shadow-lg border-b-4 border-b-slate-800"
              >
                🏆 Claim 30-Day Execution Badge
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT STAGE (5 Cols): REAL INTERACTIVE RIGHT STATUS & CALENDAR HUB */}
        <div className="xl:col-span-5 space-y-6 xl:sticky xl:top-8 xl:self-start">
          <RightStatusHub isInPage={true} />
        </div>

      </div>

      {/* FIXED CENTRAL SCREEN DUOLINGO STEP MODAL (NO COLLISION, NO SQUISHING, FULL WIDTH) */}
      <AnimatePresence>
        {isStepModalOpen && activeStep && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-[#1CB0F6] border-4 border-[#1899D6] border-b-8 border-b-[#147BB0] rounded-3xl p-6 sm:p-8 text-white shadow-[0_25px_80px_rgba(0,0,0,0.85)] relative space-y-6 text-left my-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/20">
                <div>
                  <span className="text-xs font-black uppercase text-sky-100 tracking-wider">
                    DAY {currentDay} &bull; STEP {activeStep} OF 4 &bull; {activeStep === 1 ? '+50 DP' : activeStep === 2 ? '+50 DP' : activeStep === 3 ? '+100 DP' : '+150 DP'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mt-0.5">
                    {activeStep === 1 && "Step 1: Mindset Check"}
                    {activeStep === 2 && "Step 2: Lock Session Risk"}
                    {activeStep === 3 && "Step 3: Playbook Rules"}
                    {activeStep === 4 && "Step 4: Session Debrief"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsStepModalOpen(false)}
                  className="w-9 h-9 rounded-2xl bg-black/20 hover:bg-black/35 text-white font-black text-base flex items-center justify-center transition-all cursor-pointer shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* STEP 1: MINDSET CHECK */}
              {activeStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <p className="text-sm font-bold text-sky-50">Select your mindset before trading today:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {moods.map((m) => {
                      const isSelected = selectedMood === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setSelectedMood(m.id)}
                          className={`p-4 rounded-2xl border-2 border-b-4 text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected 
                              ? 'bg-white border-white border-b-4 border-b-slate-200 text-[#1CB0F6] shadow-xl scale-[1.02]' 
                              : 'bg-black/20 border-white/20 border-b-4 border-b-black/30 text-white hover:bg-black/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="shrink-0">{m.icon}</span>
                            <div>
                              <div className={`text-sm font-black ${isSelected ? 'text-[#1CB0F6]' : 'text-white'}`}>{m.label}</div>
                              <div className={`text-[10px] font-black uppercase mt-0.5 ${isSelected ? 'text-[#1899D6]' : 'text-sky-100/80'}`}>{m.badge}</div>
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-black text-xs ${
                            isSelected ? 'border-[#1CB0F6] bg-[#1CB0F6] text-white' : 'border-white/40'
                          }`}>
                            {isSelected && <Check size={12} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      disabled={!selectedMood}
                      onClick={() => {
                        markStepComplete(1);
                        setIsStepModalOpen(false); // Close modal to return to 3D map!
                        setActiveStep(2); // TradePigeon hops down to Step 2!
                        soundFx.playLevelUp();
                      }}
                      className={`duo-btn-green w-full py-4 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl ${
                        !selectedMood ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <span>Lock Mindset (+50 DP)</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: HIGH-CONTRAST DUOLINGO 3D ARCADE BASKET COCKPIT */}
              {activeStep === 2 && (
                <div className="space-y-6 animate-fade-in select-none">
                  {/* Header & Quick Preset Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-lg sm:text-xl font-black text-white">
                        Assign Your Accounts
                      </h4>
                      <p className="text-xs sm:text-sm font-bold text-sky-100">
                        Drag accounts into your active risk groups for today:
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleAddNewBasket()}
                        className="px-3.5 py-2 rounded-2xl bg-white/20 hover:bg-white/30 border-2 border-white/40 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
                      >
                        <Plus size={15} />
                        <span>+ New Group</span>
                      </button>
                      <button
                        onClick={() => {
                          handleSavePreset();
                          soundFx.playSuccess();
                        }}
                        className="px-3.5 py-2 rounded-2xl bg-white text-[#1CB0F6] border-2 border-white border-b-4 border-b-slate-200 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-95"
                      >
                        <Save size={15} />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => {
                          handleLoadPreset();
                          soundFx.playPop();
                        }}
                        className="px-3.5 py-2 rounded-2xl bg-[#FFC800] hover:bg-[#E5B200] border-2 border-[#E5B200] border-b-4 border-b-[#CC9E00] text-slate-900 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
                      >
                        <RefreshCw size={15} />
                        <span>Load</span>
                      </button>
                    </div>
                  </div>

                  {presetToast && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500 text-white font-black text-xs animate-fade-in text-center shadow-lg border-2 border-emerald-400">
                      {presetToast}
                    </div>
                  )}

                  {/* UNASSIGNED ACCOUNTS INVENTORY RACK */}
                  {(() => {
                    const unassignedAccs = accountsData.filter(a => !a.basketName || a.basketName === 'UNASSIGNED');

                    return (
                      <div 
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDropAccountToBasket('UNASSIGNED');
                        }}
                        className="p-5 rounded-3xl bg-white border-4 border-slate-200 border-b-8 border-b-slate-300 text-slate-900 shadow-2xl space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-500">
                          <span className="flex items-center gap-2">
                            <Layers size={16} className="text-[#1CB0F6]" />
                            <span>UNASSIGNED ACCOUNTS ({unassignedAccs.length})</span>
                          </span>
                          <span className="text-[#1CB0F6]">DRAG TO ASSIGN</span>
                        </div>

                        {unassignedAccs.length === 0 ? (
                          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-800 text-xs font-black flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                              <span>All accounts locked for today's session!</span>
                            </div>
                            <button
                              onClick={() => {
                                const reset = accountsData.map(a => ({ ...a, basketName: 'UNASSIGNED' }));
                                setAccountsData(reset);
                                saveStoredData('goodtrader_accounts_data', reset);
                                soundFx.playPop();
                              }}
                              className="px-3 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-[10px] uppercase font-black transition-all cursor-pointer"
                            >
                              Unassign All
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-36 overflow-y-auto pr-1">
                            {unassignedAccs.map((acc) => (
                              <div
                                key={acc.id}
                                draggable
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  e.dataTransfer.setData('text/plain', String(acc.id));
                                  e.dataTransfer.effectAllowed = 'move';
                                  setDraggedAccountId(acc.id);
                                }}
                                onDragEnd={(e) => {
                                  e.stopPropagation();
                                  setDraggedAccountId(null);
                                }}
                                className={`p-3 rounded-2xl bg-[#F7F9FA] border-2 border-slate-200 border-b-4 border-b-slate-300 font-black text-xs cursor-grab active:cursor-grabbing shadow-md hover:scale-[1.03] transition-all flex items-center justify-between gap-2 select-none ${
                                  draggedAccountId === acc.id ? 'opacity-40 scale-95 ring-4 ring-[#FFC800]' : ''
                                }`}
                              >
                                <div className="truncate">
                                  <span className="font-extrabold text-slate-800 block truncate">{acc.name}</span>
                                  <span className="text-[#1899D6] text-[10px] font-black">{formatAccSize(acc)}</span>
                                </div>
                                <span className="text-slate-300 text-base">⋮⋮</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 3D SIDE-BY-SIDE BASKET MAGNET SLOTS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
                    {[
                      ...basketsList,
                      {
                        id: 'b_offduty',
                        name: 'No Trade Today',
                        strategyName: 'Accounts Shielded From Session Risk',
                        isOffDuty: true
                      }
                    ].map((basket, idx) => {
                      const assignedAccs = accountsData.filter(a => a.basketName === basket.name);
                      const isTargeted = activeDragTargetBasket === basket.name;

                      // Distinct bright 3D Duolingo theme colors per basket
                      const themeStyles = basket.isOffDuty
                        ? isTargeted
                          ? 'bg-[#FF4B4B] border-4 border-white border-b-8 border-b-slate-200 text-white scale-[1.03] shadow-2xl ring-4 ring-white'
                          : 'bg-[#FF4B4B] border-4 border-[#EA2B2B] border-b-8 border-b-[#C62121] text-white'
                        : idx % 3 === 0
                          ? isTargeted
                            ? 'bg-[#58CC02] border-4 border-white border-b-8 border-b-slate-200 text-white scale-[1.03] shadow-2xl ring-4 ring-white'
                            : 'bg-[#58CC02] border-4 border-[#46A302] border-b-8 border-b-[#3B8A02] text-white'
                          : idx % 3 === 1
                            ? isTargeted
                              ? 'bg-[#FFC800] border-4 border-white border-b-8 border-b-slate-200 text-slate-900 scale-[1.03] shadow-2xl ring-4 ring-white'
                              : 'bg-[#FFC800] border-4 border-[#E5B200] border-b-8 border-b-[#CC9E00] text-slate-900'
                            : isTargeted
                              ? 'bg-[#1CB0F6] border-4 border-white border-b-8 border-b-slate-200 text-white scale-[1.03] shadow-2xl ring-4 ring-white'
                              : 'bg-[#1CB0F6] border-4 border-[#1899D6] border-b-8 border-b-[#147BB0] text-white';

                      return (
                        <div
                          key={basket.id}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (activeDragTargetBasket !== basket.name) setActiveDragTargetBasket(basket.name);
                          }}
                          onDragLeave={(e) => {
                            e.stopPropagation();
                            setActiveDragTargetBasket(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDropAccountToBasket(basket.name);
                          }}
                          className={`min-h-[210px] p-5 rounded-3xl transition-all flex flex-col justify-between relative shadow-xl ${themeStyles}`}
                        >
                          {/* Basket Header */}
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="text-base font-black flex items-center gap-2 min-w-0">
                                <span className="flex items-center gap-1.5 truncate">
                                  {basket.isOffDuty && <Lock size={14} className="text-white shrink-0" />}
                                  <span className="truncate">{basket.name}</span>
                                </span>
                                {!basket.isOffDuty && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRenameBasket(basket.name);
                                    }}
                                    className="p-1 rounded-md bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-all cursor-pointer"
                                    title="Rename basket label"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                )}
                              </h5>
                              
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-black uppercase px-3 py-1 rounded-xl bg-black/20 text-white shadow-sm">
                                  {assignedAccs.length} Accs
                                </span>

                                {!basket.isOffDuty && basketsList.length > 1 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteBasket(basket.id, basket.name);
                                    }}
                                    className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-white transition-all cursor-pointer"
                                    title="Delete basket"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* MAGNET DROP ZONE / ASSIGNED TOKENS */}
                          <div className="my-3">
                            {assignedAccs.length === 0 ? (
                              <div className={`h-20 rounded-2xl border-4 border-dashed flex flex-col items-center justify-center text-center p-3 transition-all ${
                                isTargeted 
                                  ? 'border-white bg-white/40 scale-105 shadow-inner' 
                                  : 'border-white/40 bg-black/10'
                              }`}>
                                <span className="text-xs font-black uppercase tracking-wider">
                                  {isTargeted ? 'DROP TOKEN HERE!' : basket.isOffDuty ? 'DROP HERE TO PAUSE' : 'DROP ACCOUNT TOKEN HERE'}
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-2 p-1">
                                {assignedAccs.map((acc) => (
                                  <div
                                    key={acc.id}
                                    draggable
                                    onDragStart={(e) => {
                                      e.stopPropagation();
                                      e.dataTransfer.setData('text/plain', String(acc.id));
                                      e.dataTransfer.effectAllowed = 'move';
                                      setDraggedAccountId(acc.id);
                                    }}
                                    onDragEnd={(e) => {
                                      e.stopPropagation();
                                      setDraggedAccountId(null);
                                    }}
                                    className={`px-3 py-2 rounded-2xl bg-white text-slate-900 border-2 border-white border-b-4 border-b-slate-300 font-black text-xs flex items-center justify-between gap-2 shadow-md hover:bg-slate-50 cursor-grab active:cursor-grabbing transition-all ${
                                      draggedAccountId === acc.id ? 'opacity-40 scale-95 ring-4 ring-[#FFC800]' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <span className="truncate">{acc.name}</span>
                                      <span className="text-[#1CB0F6] font-black shrink-0">{formatAccSize(acc)}</span>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Unassign account back to top rack
                                        const updated = accountsData.map(a => a.id === acc.id ? { ...a, basketName: 'UNASSIGNED' } : a);
                                        setAccountsData(updated);
                                        saveStoredData('goodtrader_accounts_data', updated);
                                        soundFx.playPop();
                                      }}
                                      className="w-4 h-4 rounded-full bg-slate-200 hover:bg-rose-500 hover:text-white text-slate-600 font-black text-[10px] flex items-center justify-center transition-all cursor-pointer ml-1"
                                      title="Unassign account"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Simple Status Footer */}
                          <div className="pt-2 border-t border-black/10 flex items-center justify-between text-xs font-black">
                            <span>STATUS:</span>
                            <span className="text-white font-black uppercase flex items-center gap-1">
                              {basket.isOffDuty ? <Lock size={12} /> : <Zap size={12} />}
                              <span>{basket.isOffDuty ? 'PAUSED TODAY' : 'READY TO TRADE'}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Clean Session Summary & Continue Button */}
                  {(() => {
                    const activeTradingAccs = accountsData.filter(a => a.basketName !== 'No Trade Today' && a.basketName !== 'UNASSIGNED');
                    const pausedAccs = accountsData.filter(a => a.basketName === 'No Trade Today');

                    return (
                      <div className="space-y-4 pt-2">
                        <div className="p-3.5 rounded-2xl bg-black/30 border-2 border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-black text-white">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#58CC02] animate-pulse"></span>
                            <span>Session Summary:</span>
                          </div>
                          <span className="text-amber-300 font-black">
                            {activeTradingAccs.length} Active Trading &bull; {pausedAccs.length} Off-Duty Paused
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            markStepComplete(2);
                            setIsStepModalOpen(false); // Return to 3D map!
                            setActiveStep(3); // TradePigeon hops down to Step 3!
                            soundFx.playLevelUp();
                          }}
                          className="duo-btn-green w-full py-4 text-base font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl cursor-pointer"
                        >
                          <span>Lock Baskets & Continue Session (+50 DP)</span>
                          <ArrowRight size={20} />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* STEP 3: HIGH-CONTRAST UNBREAKABLE SINGLE PLAYBOOK CHECKLIST */}
              {activeStep === 3 && (
                <div className="space-y-6 animate-fade-in select-none">
                  <div>
                    <h4 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      Playbook Pre-Flight Checklist
                    </h4>
                    <p className="text-xs sm:text-sm font-bold text-sky-100">
                      Select your trading playbook and verify your mandatory entry rules for today's session:
                    </p>
                  </div>

                  {(() => {
                    const activeStrat = strategyLibrary.find(s => s.id === selectedPlaybookId) || strategyLibrary[0];
                    const activeBaskets = basketsList.filter(b => {
                      if (b.isOffDuty || b.name.includes('Off-Duty') || b.name.includes('No Trade')) return false;
                      const accsInBasket = accountsData.filter(a => a.basketName === b.name);
                      return accsInBasket.length > 0;
                    });

                    return (
                      <div className="p-5 rounded-3xl bg-white border-4 border-slate-200 border-b-8 border-b-slate-300 text-slate-900 shadow-2xl space-y-4">
                        {/* 1. 3D MARKET REGIME SELECTOR BAR */}
                        <div className="space-y-2.5 pb-3.5 border-b-2 border-slate-100">
                          <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-wider">
                            <span>1. MARKET CONDITION TODAY</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { id: 'trending', label: 'Trending / Expansion', icon: <Duo3dChartBadge className="w-7 h-7 shrink-0 drop-shadow-md" />, style: 'bg-[#58CC02] border-[#46A302] border-b-4 border-b-[#388202] text-white' },
                              { id: 'ranging', label: 'Range-Bound / Sweep', icon: <Duo3dPulseBadge className="w-7 h-7 shrink-0 drop-shadow-md" />, style: 'bg-[#1CB0F6] border-[#1899D6] border-b-4 border-b-[#147BB0] text-white' },
                              { id: 'news', label: 'High-Impact News', icon: <Duo3dBellBadge className="w-7 h-7 shrink-0 drop-shadow-md" />, style: 'bg-[#FF4B4B] border-[#E53935] border-b-4 border-b-[#C62828] text-white' },
                              { id: 'neutral', label: 'Neutral / Mixed', icon: <Duo3dZenBadge className="w-7 h-7 shrink-0 drop-shadow-md" />, style: 'bg-[#FFC800] border-[#B88E00] border-b-4 border-b-[#8A6B00] text-slate-950' },
                            ].map((regime) => {
                              const isSelected = selectedMarketRegime === regime.id;
                              return (
                                <button
                                  key={regime.id}
                                  onClick={() => {
                                    setSelectedMarketRegime(regime.id);
                                    soundFx.playPop();
                                  }}
                                  className={`p-3 rounded-2xl border-2 font-black text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                                    isSelected 
                                      ? regime.style + ' shadow-md font-black scale-[1.02]' 
                                      : 'bg-[#F7F9FA] border-slate-200 border-b-4 border-b-slate-300 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <div className="shrink-0">{regime.icon}</div>
                                  <span className="text-center text-[11px] leading-tight">{regime.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. ACTIVE STRATEGY PLAYBOOK SELECTOR (PLAYBOOK A, B, C, D) */}
                        <div className="space-y-2.5 pb-3 border-b-2 border-slate-100">
                          <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-wider">
                            <span>2. SELECT PLAYBOOK</span>
                            <span className="text-[#1CB0F6] font-extrabold">{activeStrat ? activeStrat.name : ''}</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {strategyLibrary.slice(0, 4).map((strat, idx) => {
                              const letters = ['A', 'B', 'C', 'D'];
                              const letter = letters[idx] || `${idx + 1}`;
                              const isSelected = strat.id === selectedPlaybookId;
                              const themeColors = [
                                'bg-[#58CC02] border-[#46A302] border-b-4 border-b-[#388202] text-white',
                                'bg-[#1CB0F6] border-[#1899D6] border-b-4 border-b-[#147BB0] text-white',
                                'bg-[#FF6B00] border-[#C2410C] border-b-4 border-b-[#9A3412] text-white',
                                'bg-[#FFC800] border-[#B88E00] border-b-4 border-b-[#8A6B00] text-slate-950',
                              ];
                              const colorStyle = themeColors[idx % 4];

                              return (
                                <button
                                  key={strat.id}
                                  onClick={() => {
                                    setSelectedPlaybookId(strat.id);
                                    setCheckedRuleIndices([]);
                                    soundFx.playPop();
                                  }}
                                  className={`p-3 rounded-2xl border-2 font-black text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                                    isSelected
                                      ? colorStyle + ' shadow-md scale-[1.02]'
                                      : 'bg-[#F7F9FA] border-slate-200 border-b-4 border-b-slate-300 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-1 text-xs sm:text-sm font-black">
                                    <span>PLAYBOOK {letter}</span>
                                  </div>
                                  <span className="text-[10px] font-extrabold opacity-80 truncate max-w-full">{strat.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 3D Interactive Rule Verification Checklist */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs font-black uppercase text-slate-400 tracking-wider">
                            <span>VERIFY ENTRY RULES ({checkedRuleIndices.length}/{activeStrat.rules.length} VERIFIED)</span>
                          </div>

                          {activeStrat.rules.length === 0 ? (
                            <div className="p-5 rounded-3xl bg-[#FFC800] border-4 border-[#E5B200] border-b-8 border-b-[#CC9E00] text-slate-900 text-center space-y-2 shadow-2xl my-3 select-none">
                              <div className="flex items-center justify-center gap-2 font-black text-base text-slate-900">
                                <AlertCircle size={18} strokeWidth={3} />
                                <span>No Rules Configured for This Playbook</span>
                              </div>
                              <p className="text-xs font-bold text-slate-800 leading-relaxed">
                                Configure your entry rules in the Playbooks tab to enable pre-flight verification.
                              </p>
                            </div>
                          ) : (
                            activeStrat.rules.map((rule, idx) => {
                              const isChecked = checkedRuleIndices.includes(idx);
                              return (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    const updated = isChecked ? checkedRuleIndices.filter(i => i !== idx) : [...checkedRuleIndices, idx];
                                    setCheckedRuleIndices(updated);
                                    soundFx.playPop();
                                  }}
                                  className={`p-4 rounded-2xl border-2 border-b-4 font-black text-sm transition-all cursor-pointer flex items-center justify-between gap-3 shadow-md select-none ${
                                    isChecked 
                                      ? 'bg-[#58CC02] border-[#46A302] border-b-4 border-b-[#3B8A02] text-white scale-[1.01]' 
                                      : 'bg-[#F7F9FA] border-slate-200 border-b-4 border-b-slate-300 text-slate-800 hover:bg-slate-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center text-xs font-black transition-all ${
                                      isChecked ? 'bg-white text-[#58CC02] border-white' : 'border-slate-300 bg-white text-transparent'
                                    }`}>
                                      <Check size={14} strokeWidth={4} />
                                    </div>
                                    <span>{rule}</span>
                                  </div>

                                  <span className={`text-xs uppercase tracking-wider font-black px-2.5 py-1 rounded-xl ${
                                    isChecked ? 'bg-black/20 text-white' : 'bg-slate-200 text-slate-500'
                                  }`}>
                                    {isChecked ? 'VERIFIED' : 'CONFIRM'}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Continue Button */}
                  {(() => {
                    const activeStrat = strategyLibrary.find(s => s.id === selectedPlaybookId) || strategyLibrary[0];
                    const hasZeroRules = activeStrat.rules.length === 0;

                    return (
                      <button
                        onClick={() => {
                          if (hasZeroRules) return;
                          markStepComplete(3);
                          setIsStepModalOpen(false); // Return to 3D map!
                          setActiveStep(4); // TradePigeon hops down to Step 4!
                          soundFx.playLevelUp();
                        }}
                        disabled={hasZeroRules}
                        className={`duo-btn-green w-full py-4 text-base font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl ${
                          hasZeroRules ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'
                        }`}
                      >
                        <span>{hasZeroRules ? 'Add At Least 1 Entry Rule To Lock Session' : 'Lock Pre-Flight Checklist & Start Session (+100 DP)'}</span>
                        <ArrowRight size={20} />
                      </button>
                    );
                  })()}
                </div>
              )}

              {/* STEP 4: POST-SESSION AUDIT & DEBRIEF */}
              {activeStep === 4 && (
                <div className="space-y-6 animate-fade-in text-center">
                  <div className="p-6 rounded-3xl bg-black/20 border-2 border-white/30 space-y-4">
                    <h4 className="text-xl font-black text-white">Ready to Audit Your Trading Session?</h4>
                    <p className="text-sm font-bold text-sky-50 max-w-md mx-auto">
                      Run the Post-Session Audit to evaluate rule adherence, log emotional triggers, and complete your session journal.
                    </p>
                    <button
                      onClick={() => setIsDebriefOpen(true)}
                      className="duo-btn-orange w-full py-4 text-sm font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer shadow-xl"
                    >
                      <Sparkles size={18} />
                      <span>Launch Post-Session Audit (+150 DP)</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SESSION DEBRIEF ACCOUNTABILITY MODAL */}
      <AiDebriefModal 
        isOpen={isDebriefOpen} 
        selectedMood={selectedMood}
        onSaveSession={(userNotes) => {
          if (userNotes && userNotes.trim() !== '') {
            saveStoredData(`goodtrader_session_note_day_${currentDay}`, userNotes.trim());
          }
          markStepComplete(4);
          setIsStepModalOpen(false);
          setIsDebriefOpen(false);
          soundFx.playSuccess();
        }}
        onClose={() => {
          setIsDebriefOpen(false);
          setIsStepModalOpen(false);
        }} 
      />

      {/* 3D DUOLINGO MERCY CATCH-UP MODAL */}
      {isMercyModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="duo-card max-w-md w-full p-6 sm:p-8 space-y-6 border-2 border-[#1CB0F6] relative shadow-2xl">
            <div className="flex items-center gap-3">
              <InteractiveParrotMascot pose="welcoming" className="w-16 h-16 shrink-0" />
              <div>
                <span className="text-[10px] font-black uppercase text-[#1CB0F6] tracking-wider">STREAK PROTECTOR &bull; CHECK-IN</span>
                <h3 className="text-xl font-black text-white">Missed Session Catch-Up</h3>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-300 leading-relaxed bg-[#142127] p-4 rounded-2xl border-2 border-[#20323D]">
              Hey! We noticed you didn't log yesterday's trading session ({mercyDateStr}). What happened?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  soundFx.playSuccess();
                  saveStoredData('goodtrader_processed_mercy_date', mercyDateStr);
                  setIsMercyModalOpen(false);
                  setPresetToast('Yesterday marked as Rest Day! Your active streak is intact.');
                  setTimeout(() => setPresetToast(''), 4000);
                }}
                className="duo-btn-green w-full py-3.5 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <DuoPalmtreeIcon className="w-4 h-4 shrink-0" />
                <span>It Was An Offline Rest Day</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playPop();
                  saveStoredData('goodtrader_processed_mercy_date', mercyDateStr);
                  setIsMercyModalOpen(false);
                  setIsDebriefOpen(true);
                }}
                className="duo-btn-blue w-full py-3.5 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                <span>Log Yesterday's Debrief Now</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playPop();
                  saveStoredData('goodtrader_processed_mercy_date', mercyDateStr);
                  setIsMercyModalOpen(false);
                  setPresetToast('Honesty acknowledged! Streak reset, +50 DP awarded.');
                  setTimeout(() => setPresetToast(''), 4000);
                }}
                className="w-full py-3 rounded-2xl bg-[#142127] hover:bg-[#182830] text-slate-400 font-black text-xs uppercase tracking-wider transition-all border-2 border-[#20323D] cursor-pointer flex items-center justify-center gap-2"
              >
                <XCircle size={16} className="text-rose-400" />
                <span>I Tilted & Missed Day (Reset Streak)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GUIDEBOOK MODAL */}
      <GuidebookModal 
        isOpen={isGuidebookModalOpen} 
        onClose={() => setIsGuidebookModalOpen(false)} 
      />
    </main>
  );
}
