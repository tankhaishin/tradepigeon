import React, { useState } from 'react';
import { X, BookOpen, Shield, ShieldCheck, AlertTriangle, AlertCircle, Clock, Zap, CheckCircle2, Flame, Award, ChevronRight } from 'lucide-react';
import { DuoBookIcon, DuoDisciplinedWinIcon, DuoDisciplinedLossIcon, DuoDisciplinedBeIcon, DuoToxicWinIcon, DuoToxicBeIcon, DuoDoubleFailureIcon, DuoMissedTradeIcon } from './DuoIcons';
import { soundFx } from '../utils/audioEngine';

export default function GuidebookModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('matrix');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="duo-card max-w-2xl w-full p-6 sm:p-8 space-y-6 border-2 border-[#1CB0F6] relative max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-[#20323D] pb-4">
          <div className="flex items-center gap-3">
            <DuoBookIcon className="w-10 h-10 shrink-0 drop-shadow-md" />
            <div>
              <span className="text-[10px] font-black uppercase text-[#1CB0F6] tracking-wider block">OFFICIAL PROTOCOL HANDBOOK</span>
              <h2 className="text-2xl font-black text-white leading-tight">GoodTrader Guidebook</h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playPop();
              onClose();
            }}
            className="p-2 rounded-xl bg-[#142127] hover:bg-[#20323D] text-slate-400 hover:text-white cursor-pointer transition-all border border-[#20323D]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 bg-[#142127] p-1.5 rounded-2xl border border-[#20323D]">
          {[
            { id: 'matrix', label: 'Execution Matrix' },
            { id: 'grades', label: 'Heatmap Grades' },
            { id: 'score', label: 'Discipline Score' },
            { id: 'debrief', label: 'Debrief Protocol' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                soundFx.playPop();
                setActiveTab(tab.id);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer text-center ${
                activeTab === tab.id
                  ? 'bg-[#1CB0F6] text-white shadow-md'
                  : 'text-[#52656D] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Execution Matrix Taxonomy */}
        {activeTab === 'matrix' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">The 7 Behavioral Execution Categories</h3>
            
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#58CC02] border-b-4 border-[#388202] text-white flex items-start gap-3 shadow-md">
                <DuoDisciplinedWinIcon className="w-8 h-8 shrink-0 drop-shadow" />
                <div>
                  <h4 className="text-base font-black">Disciplined Win (Green)</h4>
                  <p className="text-xs font-bold opacity-90 mt-0.5 leading-relaxed">
                    Pure Edge: Strategy playbook rules followed 100%, and positive expectancy materialized into profit.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#1CB0F6] border-b-4 border-[#147BB0] text-white flex items-start gap-3 shadow-md">
                <DuoDisciplinedLossIcon className="w-8 h-8 shrink-0 drop-shadow" />
                <div>
                  <h4 className="text-base font-black">Disciplined Loss (Cyan)</h4>
                  <p className="text-xs font-bold opacity-90 mt-0.5 leading-relaxed">
                    Cost of Doing Business: Strategy playbook followed 100%, stop loss taken cleanly without hesitation or revenge.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#CE82FF] border-b-4 border-[#9D28EC] text-white flex items-start gap-3 shadow-md">
                <DuoDisciplinedBeIcon className="w-8 h-8 shrink-0 drop-shadow" />
                <div>
                  <h4 className="text-base font-black">Disciplined BE (Purple)</h4>
                  <p className="text-xs font-bold opacity-90 mt-0.5 leading-relaxed">
                    Capital Preservation: Systematic risk-free breakeven exit according to pre-planned trade management rules.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFC800] border-b-4 border-[#8A6B00] text-slate-950 flex items-start gap-3 shadow-md">
                <DuoToxicWinIcon className="w-8 h-8 shrink-0 drop-shadow" />
                <div>
                  <h4 className="text-base font-black">Toxic Win (Gold)</h4>
                  <p className="text-xs font-bold opacity-90 mt-0.5 leading-relaxed">
                    Toxic Dopamine Danger: Strategy rule violated (FOMO chase, over-leveraged size), but lucky market movement yielded profit.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#00F0FF] border-b-4 border-[#00B3BF] text-slate-950 flex items-start gap-3 shadow-md">
                <DuoToxicBeIcon className="w-8 h-8 shrink-0 drop-shadow" />
                <div>
                  <h4 className="text-base font-black">Toxic BE (Teal)</h4>
                  <p className="text-xs font-bold opacity-90 mt-0.5 leading-relaxed">
                    Suffocated Trade: Rule violated by moving stop loss to BE prematurely out of fear or round-tripping a 3R winner.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FF4B4B] border-b-4 border-[#C62828] text-white flex items-start gap-3 shadow-md">
                <DuoDoubleFailureIcon className="w-8 h-8 shrink-0 drop-shadow" />
                <div>
                  <h4 className="text-base font-black">Double Failure (Red)</h4>
                  <p className="text-xs font-bold opacity-90 mt-0.5 leading-relaxed">
                    Account Equity Damaged: Strategy rule broken AND equity damaged (revenge tilt, moving stops, over-trading).
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500 border-b-4 border-amber-700 text-slate-950 flex items-start gap-3 shadow-md">
                <DuoMissedTradeIcon className="w-8 h-8 shrink-0 drop-shadow" />
                <div>
                  <h4 className="text-base font-black">Missed Trade (Amber)</h4>
                  <p className="text-xs font-bold opacity-90 mt-0.5 leading-relaxed">
                    Hesitation Log: A valid playbook setup presented, but fear or hesitation prevented execution.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Discipline Heatmap Grading Scale */}
        {activeTab === 'grades' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">Heatmap Letter Grade Breakdown</h3>
            
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3.5 rounded-2xl bg-[#58CC02] text-white space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black">A+</span>
                  <span className="text-[10px] font-black uppercase opacity-80">Flawless Win</span>
                </div>
                <p className="text-xs font-bold opacity-90">100% Process followed + Profitable session.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#1CB0F6] text-white space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black">A</span>
                  <span className="text-[10px] font-black uppercase opacity-80">Disciplined Loss / BE</span>
                </div>
                <p className="text-xs font-bold opacity-90">100% Process followed + Good Loss or BE taken.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFC800] text-slate-950 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black">C</span>
                  <span className="text-[10px] font-black uppercase opacity-80">Toxic Win</span>
                </div>
                <p className="text-xs font-bold opacity-90">Rule Broken + Lucky Win (Toxic Dopamine).</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#00F0FF] text-slate-950 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black">C-</span>
                  <span className="text-[10px] font-black uppercase opacity-80">Toxic BE</span>
                </div>
                <p className="text-xs font-bold opacity-90">Rule Broken + Suffocated Trade / Early BE.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FF4B4B] text-white space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black">F</span>
                  <span className="text-[10px] font-black uppercase opacity-80">Double Failure</span>
                </div>
                <p className="text-xs font-bold opacity-90">Rule Broken + Account equity damaged.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500 text-slate-950 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black">M</span>
                  <span className="text-[10px] font-black uppercase opacity-80">Missed Trade</span>
                </div>
                <p className="text-xs font-bold opacity-90">Valid setup presented + Hesitation.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Discipline Score Formula */}
        {activeTab === 'score' && (
          <div className="space-y-4 text-left animate-fade-in">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">How Your Discipline Score Is Calculated</h3>
            
            <div className="p-5 rounded-2xl bg-[#142127] border-2 border-[#20323D] space-y-4">
              <div className="text-center p-4 rounded-xl bg-[#182830] border border-[#20323D]">
                <span className="text-xs font-black uppercase text-[#1CB0F6] block mb-1">DISCIPLINE ADHERENCE FORMULA</span>
                <div className="text-lg font-black font-mono text-white">
                  Score (%) = (Disciplined Fills / Total Fills) × 100
                </div>
              </div>

              <div className="space-y-2 text-xs font-bold text-slate-300">
                <p>&bull; <strong className="text-[#58CC02]">Disciplined Fills</strong> include: Disciplined Wins, Disciplined Losses, and Disciplined BEs.</p>
                <p>&bull; <strong className="text-rose-400">Rule Violations</strong> include: Toxic Wins, Toxic BEs, and Double Failures.</p>
                <p>&bull; A Discipline Score above <strong className="text-[#58CC02]">85%</strong> is required to pass funded evaluations and build long-term expectancy.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: 60-Second Guided Debrief Protocol */}
        {activeTab === 'debrief' && (
          <div className="space-y-4 text-left animate-fade-in">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">The 60-Second Guided Debrief Protocol</h3>
            
            <div className="p-5 rounded-2xl bg-[#142127] border-2 border-[#20323D] space-y-3 text-xs font-bold text-slate-300 leading-relaxed">
              <p>
                At the end of every trading session, click <strong className="text-white">DONE TODAY</strong> to trigger your 60-second guided debrief.
              </p>
              <p>
                This protocol resets your prefrontal cortex, logs your daily key session takeaway, awards +350 DP experience points, and protects your streak!
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            soundFx.playPop();
            onClose();
          }}
          className="duo-btn-blue w-full py-3.5 text-xs font-black uppercase tracking-wider cursor-pointer"
        >
          Close Protocol Guidebook
        </button>
      </div>
    </div>
  );
}
