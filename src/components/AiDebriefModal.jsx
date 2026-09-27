import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, AlertCircle, ShieldCheck, CheckCircle2, ChevronRight, Award, X } from 'lucide-react';
import { Duo3dZenBadge, Duo3dPulseBadge, Duo3dCrosshairBadge, Duo3dRocketBadge } from './GamifiedFeatureBadges';
import { loadStoredData, saveStoredData } from '../utils/storage';
import { formatFinancialCurrency, parseFinancialNumber } from '../utils/financialMath';
import { soundFx } from '../utils/audioEngine';

import { generateIntelligentSessionDebrief } from '../utils/aiDebriefEngine';
import { generateAiDebriefWithGemini } from '../utils/geminiAiEngine';

export default function AiDebriefModal({ isOpen = true, onClose, selectedMood, onSaveSession, onFinish, currentDay = 1 }) {
  const [emotion, setEmotion] = useState('disciplined');
  const [followedPlan, setFollowedPlan] = useState(true);
  const [followedRules, setFollowedRules] = useState(true);
  const [notes, setNotes] = useState('');
  const [aiReport, setAiReport] = useState('');
  const [aiReportObj, setAiReportObj] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReportGenerated, setAiReportGenerated] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSetCompliance = (isCompliant) => {
    setFollowedPlan(isCompliant);
    setFollowedRules(isCompliant);
  };

  const getDayTrades = () => {
    const dayNum = currentDay || loadStoredData('tradepigeon_current_day', 1);
    const todayObj = new Date();
    const todayIso = todayObj.toISOString().split('T')[0];
    return loadStoredData(`tradepigeon_session_trades_day_${dayNum}`, null)
      || loadStoredData(`tradepigeon_session_trades_day_${todayIso}`, null)
      || loadStoredData(`tradepigeon_session_trades_day_${todayObj.getDate()}`, null)
      || loadStoredData('tradepigeon_session_trades', []);
  };

  const dayTrades = getDayTrades();
  const hasRecordedViolations = Array.isArray(dayTrades) && dayTrades.some(t => {
    const rawType = (t.type || '').toLowerCase();
    return rawType.includes('toxic') || rawType.includes('violate') || rawType === 'double_failure';
  });

  // Compute real-time grade, score, and status based on trader choices and recorded trades
  let currentGrade = 'A+';
  let currentScore = 'Score: 98/100';
  let currentStatus = 'COMPLIANT';

  if (followedPlan && !hasRecordedViolations) {
    if (emotion === 'disciplined') {
      currentGrade = 'A+';
      currentScore = 'Score: 98/100';
      currentStatus = 'COMPLIANT';
    } else if (emotion === 'anxious') {
      currentGrade = 'A-';
      currentScore = 'Score: 92/100';
      currentStatus = 'COMPLIANT';
    } else if (emotion === 'fomo') {
      currentGrade = 'B+';
      currentScore = 'Score: 88/100';
      currentStatus = 'COMPLIANT';
    } else if (emotion === 'revenge') {
      currentGrade = 'B';
      currentScore = 'Score: 82/100';
      currentStatus = 'CAUTION';
    }
  } else {
    if (emotion === 'revenge' || hasRecordedViolations) {
      currentGrade = hasRecordedViolations ? 'D' : 'F';
      currentScore = hasRecordedViolations ? 'Score: 50/100' : 'Score: 40/100';
      currentStatus = 'DEVIATED';
    } else {
      currentGrade = 'C';
      currentScore = 'Score: 65/100';
      currentStatus = 'DEVIATED';
    }
  }

  const handleGenerateAiReport = async () => {
    setIsAnalyzing(true);
    soundFx.playPop();
    const trades = getDayTrades();

    try {
      const report = await generateAiDebriefWithGemini({
        trades,
        emotion,
        followedPlan,
        selectedMood,
        notes
      });
      setAiReportObj(report);
      const summaryText = `${report.integrityAnalysis || ''}\n\n${report.psychologicalAnalysis || ''}`.trim();
      setAiReport(summaryText || 'Session execution evaluated: Risk parameters maintained.');
    } catch (err) {
      console.warn('Debrief generation error:', err);
      const fallback = generateIntelligentSessionDebrief({
        trades,
        emotion,
        followedPlan,
        selectedMood,
        notes
      });
      setAiReport(fallback);
    } finally {
      setIsAnalyzing(false);
      setAiReportGenerated(true);
    }
  };

  const handleFinish = () => {
    const dayNum = currentDay || loadStoredData('tradepigeon_current_day', 1);
    const todayObj = new Date();
    const todayIso = todayObj.toISOString().split('T')[0];
    const formattedDate = todayObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Calculate actual PnL from today's trades
    const dayTrades = getDayTrades();

    let totalPnlNum = 0;
    let setupName = 'Session Execution';
    if (Array.isArray(dayTrades) && dayTrades.length > 0) {
      dayTrades.forEach(t => {
        totalPnlNum += parseFinancialNumber(t.pnlNum !== undefined ? t.pnlNum : t.pnlValue !== undefined ? t.pnlValue : t.pnl, 0);
      });
      if (dayTrades[0]?.setup || dayTrades[0]?.strategy || dayTrades[0]?.name) {
        setupName = dayTrades[0].setup || dayTrades[0].strategy || dayTrades[0].name;
      }
    }
    const pnlFormatted = formatFinancialCurrency(totalPnlNum, { showPlus: true });

    const finalReport = aiReport || "Process discipline evaluated and recorded.";
    const debriefNote = notes && notes.trim() !== '' ? notes.trim() : finalReport;

    const historyItem = {
      id: `debrief_${Date.now()}`,
      date: formattedDate,
      isoDate: todayIso,
      day: dayNum,
      setup: setupName,
      grade: currentGrade,
      score: currentScore,
      mood: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      pnl: pnlFormatted,
      status: currentStatus,
      followedPlan,
      followedRules: followedPlan,
      notes: debriefNote,
      aiReport: finalReport,
      timestamp: new Date().toISOString()
    };

    // 1. Save debrief history to storage (automatically syncs to Cloud Firestore)
    const prevHistory = loadStoredData('tradepigeon_debrief_history', []);
    const updatedHistory = [historyItem, ...prevHistory.filter(h => h.id !== historyItem.id && h.isoDate !== todayIso)];
    saveStoredData('tradepigeon_debrief_history', updatedHistory);

    // 2. Award user DP (+150 DP)
    const currentDp = loadStoredData('tradepigeon_user_dp', 0);
    const newDp = Number(currentDp) + 150;
    saveStoredData('tradepigeon_user_dp', newDp);

    // 3. Update user stats & streak discipline
    const currentStats = loadStoredData('tradepigeon_user_stats', { streakDays: 0, tradesLogged: 0, disciplinePoints: 0 });
    let nextStreak = currentStats.streakDays || 0;

    if (followedPlan) {
      nextStreak += 1;
    } else {
      // Check for available streak freezes / shields
      const availableFreezes = Number(loadStoredData('tradepigeon_streak_freezes', 0)) || 0;
      if (availableFreezes > 0) {
        saveStoredData('tradepigeon_streak_freezes', Math.max(0, availableFreezes - 1));
        // Streak is protected by freeze shield
      } else {
        // Plan violation without shield resets streak to 0
        nextStreak = 0;
      }
    }

    const updatedStats = {
      ...currentStats,
      streakDays: nextStreak,
      tradesLogged: currentStats.tradesLogged !== undefined ? currentStats.tradesLogged : (Array.isArray(dayTrades) ? dayTrades.length : 0),
      disciplinePoints: newDp
    };
    saveStoredData('tradepigeon_user_stats', updatedStats);
    saveStoredData('tradepigeon_trading_status', 'DONE');
    saveStoredData('tradepigeon_vacation_active', false);

    // 4. Save session note for Calendar Tab
    saveStoredData(`tradepigeon_session_note_day_${dayNum}`, debriefNote);
    saveStoredData(`tradepigeon_session_note_day_${todayIso}`, debriefNote);
    saveStoredData(`tradepigeon_session_note_day_${todayObj.getDate()}`, debriefNote);

    // 5. Fire callbacks
    if (typeof onSaveSession === 'function') {
      onSaveSession(debriefNote, historyItem);
    }
    if (typeof onFinish === 'function') {
      onFinish(historyItem);
    }

    try {
      soundFx?.playLevelUp?.();
    } catch (_) {}

    setAiReportGenerated(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="duo-card max-w-xl w-full p-6 sm:p-8 space-y-6 border-2 border-[#FF6B00] relative max-h-[92vh] overflow-y-auto bg-[#182830]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#20323D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center text-xl font-black shrink-0">
              <ShieldCheck size={22} className="text-[#FF6B00]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6B00]">DAILY AUDIT</span>
              <h3 className="text-xl font-black text-white">Session Debrief</h3>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#142127] border border-[#20323D] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {!aiReportGenerated ? (
          /* QUESTIONNAIRE STEP */
          <div className="space-y-5">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider">
                1. How was your mindset today?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'disciplined', label: 'Disciplined', icon: <Duo3dZenBadge className="w-8 h-8 shrink-0 drop-shadow-md" />, activeStyle: 'bg-[#58CC02] border-[#46A302] border-b-4 border-b-[#388202] text-white shadow-lg font-black' },
                  { id: 'anxious', label: 'Anxious', icon: <Duo3dPulseBadge className="w-8 h-8 shrink-0 drop-shadow-md" />, activeStyle: 'bg-[#1CB0F6] border-[#1899D6] border-b-4 border-b-[#147BB0] text-white shadow-lg font-black' },
                  { id: 'revenge', label: 'Revenge', icon: <Duo3dCrosshairBadge className="w-8 h-8 shrink-0 drop-shadow-md" />, activeStyle: 'bg-[#FF4B4B] border-[#E53935] border-b-4 border-b-[#C62828] text-white shadow-lg font-black' },
                  { id: 'fomo', label: 'FOMO', icon: <Duo3dRocketBadge className="w-8 h-8 shrink-0 drop-shadow-md" />, activeStyle: 'bg-[#FFC800] border-[#B88E00] border-b-4 border-b-[#8A6B00] text-slate-950 shadow-lg font-black' },
                ].map((mood) => {
                  const isSelected = emotion === mood.id;
                  return (
                    <button
                      key={mood.id}
                      onClick={() => setEmotion(mood.id)}
                      className={`p-3.5 rounded-2xl border-2 font-black text-xs flex flex-col items-center gap-2 transition-all cursor-pointer ${
                        isSelected 
                          ? mood.activeStyle
                          : 'bg-[#142127] border-[#2B3D47] border-b-4 border-b-[#142127] text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="shrink-0">{mood.icon}</div>
                      <span>{mood.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider">
                2. Did you follow your risk rules?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSetCompliance(true)}
                  className={`p-3.5 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    followedPlan === true 
                      ? 'bg-[#58CC02] border-[#46A302] border-b-4 border-b-[#388202] text-white shadow-lg font-black' 
                      : 'bg-[#182830] border-[#2B3D47] border-b-4 border-b-[#142127] text-slate-300 hover:text-white'
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>Followed Rules</span>
                </button>
                <button
                  onClick={() => handleSetCompliance(false)}
                  className={`p-3.5 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    followedPlan === false 
                      ? 'bg-rose-600 border-rose-700 border-b-4 border-b-rose-900 text-white shadow-lg font-black' 
                      : 'bg-[#182830] border-[#2B3D47] border-b-4 border-b-[#142127] text-slate-300 hover:text-white'
                  }`}
                >
                  <AlertCircle size={16} />
                  <span>Broke Rules</span>
                </button>
              </div>
            </div>

            {/* TACTILE QUICK-TAKEAWAY CHIPS */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider block">
                3. Session Takeaway
              </label>

              {/* Quick Select 3D Chips */}
              <div className="flex flex-wrap gap-2 pb-1">
                {[
                  "Respected Stop-Loss",
                  "Followed Playbook Rules",
                  "Zero Revenge Trading",
                  "Waited For Clean Setup",
                  "Respected Max Daily Risk",
                  "No Impulse Trades"
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setNotes((prev) => prev ? `${prev}. ${chip}` : `${chip} on session execution.`);
                    }}
                    className="text-[11px] font-black px-3 py-1.5 rounded-xl bg-[#142127] border-2 border-[#20323D] border-b-4 text-slate-300 hover:text-white hover:border-[#1CB0F6] active:translate-y-0.5 transition-all cursor-pointer shadow-sm"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Log key session takeaways, market behavior, or execution observations..."
                rows={3}
                className="w-full p-4 rounded-2xl bg-[#142127] border-2 border-[#20323D] text-white text-sm font-black focus:border-[#1CB0F6] outline-none resize-none placeholder:text-slate-500 leading-relaxed shadow-inner"
              />
            </div>

            <button
              onClick={handleGenerateAiReport}
              disabled={isAnalyzing}
              className="duo-btn-green w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xl"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="animate-spin" size={18} />
                  <span>Evaluating Session Execution...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Complete Debrief (+150 DP)</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* REPORT BREAKDOWN STEP */
          <div className="space-y-5 animate-fade-in text-left">
            <div className="p-5 rounded-2xl bg-[#142127] border-2 border-[#FF6B00]/40 space-y-3">
              <div className="flex items-center justify-between text-xs font-black">
                <div className="flex items-center gap-2 text-[#FF6B00] uppercase tracking-wider">
                  <Sparkles size={16} />
                  <span>Session Diagnosis</span>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#1CB0F6]/20 text-[#1CB0F6] border border-[#1CB0F6]/40">
                  {aiReportObj?.aiModel || (aiReportObj?.isRealAi ? 'Gemini 1.5 Flash' : 'Process Rule Auditor')}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-300 leading-relaxed italic whitespace-pre-line">
                "{aiReport || 'Session execution evaluated: All risk parameters and stop-loss rules were respected. Keep position sizing static and focus on quality entries.'}"
              </p>

              {aiReportObj?.actionableRecommendations && aiReportObj.actionableRecommendations.length > 0 && (
                <div className="pt-2 border-t border-[#20323D] space-y-1.5">
                  <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Tactical Recommendations:</div>
                  <ul className="space-y-1">
                    {aiReportObj.actionableRecommendations.map((rec, i) => (
                      <li key={i} className="text-[11px] font-bold text-slate-200 flex items-start gap-1.5">
                        <span className="text-[#58CC02] font-black">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Behavioral Diagnostic Card */}
            <div className="p-5 rounded-3xl bg-[#142127] border-2 border-[#20323D] space-y-4">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-[#1CB0F6]">SESSION GRADE</span>
                <span className={`px-3 py-1 rounded-xl font-black ${followedPlan ? 'bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}`}>
                  GRADE: {currentGrade} {!followedPlan ? '(RULES BROKEN)' : ''}
                </span>
              </div>

              <div className="space-y-2 text-xs font-bold text-slate-300">
                <div className="p-3 rounded-2xl bg-[#182830] flex items-center justify-between">
                  <span>Start-of-Day Mindset:</span>
                  <span className="text-amber-400 font-black uppercase">{selectedMood || 'Neutral'}</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#182830] flex items-center justify-between">
                  <span>Targeted Directive:</span>
                  <span className="text-sky-300 font-black">{followedPlan ? 'Keep Position Sizing Static' : 'Mandatory 30m Walk Post-Loss'}</span>
                </div>
              </div>
            </div>

            {/* Reward Card */}
            <div className="p-4 rounded-2xl bg-[#58CC02]/15 border-2 border-[#58CC02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award size={24} className="text-[#58CC02]" />
                <div>
                  <div className="text-xs font-black text-white">Debrief Complete!</div>
                  <div className="text-[10px] font-bold text-slate-300">Saved to calendar.</div>
                </div>
              </div>
              <span className="text-sm font-black text-[#58CC02]">+150 DP</span>
            </div>

            <button
              onClick={handleFinish}
              className="duo-btn-green w-full py-4 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <span>Done (+150 DP)</span>
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
