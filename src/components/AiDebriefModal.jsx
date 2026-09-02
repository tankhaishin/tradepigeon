import React, { useState } from 'react';
import { Sparkles, Brain, AlertTriangle, AlertCircle, ShieldCheck, CheckCircle2, ChevronRight, Award, Bot } from 'lucide-react';
import { Duo3dZenBadge, Duo3dPulseBadge, Duo3dCrosshairBadge, Duo3dRocketBadge } from './DuolingoFeatureBadges';
import InteractiveParrotMascot from './InteractiveParrotMascot';

export default function AiDebriefModal({ isOpen, onClose, selectedMood, onSaveSession }) {
  const [emotion, setEmotion] = useState('disciplined');
  const [followedPlan, setFollowedPlan] = useState(true);
  const [followedRules, setFollowedRules] = useState(true);
  const [notes, setNotes] = useState('');
  const [aiReport, setAiReport] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReportGenerated, setAiReportGenerated] = useState(false);

  if (!isOpen) return null;

  const handleGenerateAiReport = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAiReportGenerated(true);
    }, 600);
  };

  const handleFinish = () => {
    if (typeof onSaveSession === 'function') {
      onSaveSession(notes);
    }
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
              <Bot size={22} className="text-[#FF6B00]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6B00]">SESSION DEBRIEF ENGINE</span>
              <h3 className="text-xl font-black text-white">Post-Session Accountability Audit</h3>
            </div>
          </div>
        </div>

        {!aiReportGenerated ? (
          /* QUESTIONNAIRE STEP */
          <div className="space-y-5">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider">
                1. What was your emotional mindset during today's trading session?
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
                2. Did you strictly follow your pre-defined Stop-Loss & Max Drawdown limits?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFollowedPlan(true)}
                  className={`p-3.5 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    followedPlan === true 
                      ? 'bg-[#58CC02] border-[#46A302] border-b-4 border-b-[#388202] text-white shadow-lg font-black' 
                      : 'bg-[#182830] border-[#2B3D47] border-b-4 border-b-[#142127] text-slate-300 hover:text-white'
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>Yes, 100% Compliant</span>
                </button>
                <button
                  onClick={() => setFollowedPlan(false)}
                  className={`p-3.5 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    followedPlan === false 
                      ? 'bg-rose-600 border-rose-700 border-b-4 border-b-rose-900 text-white shadow-lg font-black' 
                      : 'bg-[#182830] border-[#2B3D47] border-b-4 border-b-[#142127] text-slate-300 hover:text-white'
                  }`}
                >
                  <AlertCircle size={16} />
                  <span>No, Deviated</span>
                </button>
              </div>
            </div>

            {/* TACTILE QUICK-TAKEAWAY CHIPS */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-black text-slate-200 uppercase tracking-wider block">
                3. Key Session Takeaway & Debrief Note
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
                  <span>Complete Session Audit (+150 DP)</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* REPORT BREAKDOWN STEP */
          <div className="space-y-5 animate-fade-in text-left">
            <div className="p-5 rounded-2xl bg-[#142127] border-2 border-[#FF6B00]/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-[#FF6B00] uppercase tracking-wider">
                <Sparkles size={16} />
                <span>TradePigeon AI Execution Diagnosis</span>
              </div>
              <p className="text-xs font-bold text-slate-300 leading-relaxed italic whitespace-pre-line">
                "{aiReport || 'Session execution evaluated: All risk parameters and stop-loss rules were respected. Keep position sizing static and focus on quality entries.'}"
              </p>
            </div>

            {/* AI Behavioral Diagnostic Card */}
            <div className="p-5 rounded-3xl bg-[#142127] border-2 border-[#20323D] space-y-4">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-[#1CB0F6]">SESSION SCORE & BEHAVIOR DIAGNOSTIC</span>
                <span className={`px-3 py-1 rounded-xl font-black ${followedRules ? 'bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}`}>
                  {followedRules ? 'DISCIPLINE GRADE: A+' : 'DISCIPLINE GRADE: C (RULES BROKEN)'}
                </span>
              </div>

              <div className="space-y-2 text-xs font-bold text-slate-300">
                <div className="p-3 rounded-2xl bg-[#182830] flex items-center justify-between">
                  <span>Start-of-Day Mindset:</span>
                  <span className="text-amber-400 font-black uppercase">{selectedMood || 'Neutral'}</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#182830] flex items-center justify-between">
                  <span>Targeted Behavioral Fix:</span>
                  <span className="text-sky-300 font-black">{followedRules ? 'Keep Position Sizing Static' : 'Mandatory 30m Walk Post-Loss'}</span>
                </div>
              </div>
            </div>

            {/* Reward Card */}
            <div className="p-4 rounded-2xl bg-[#58CC02]/15 border-2 border-[#58CC02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award size={24} className="text-[#58CC02]" />
                <div>
                  <div className="text-xs font-black text-white">Session Audit Completed!</div>
                  <div className="text-[10px] font-bold text-slate-300">Session saved to your lifetime consistency index.</div>
                </div>
              </div>
              <span className="text-sm font-black text-[#58CC02]">+150 DP (Discipline Points)</span>
            </div>

            <button
              onClick={handleFinish}
              className="duo-btn-green w-full py-4 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <span>Save Session Audit (+150 DP)</span>
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
