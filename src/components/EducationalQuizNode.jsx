import React, { useState } from 'react';
import { CheckCircle2, XCircle, Award, HelpCircle } from 'lucide-react';
import { DuoBookIcon, DuoBrainIcon, DuoShieldIcon, DuoChartIcon } from './DuoIcons';
import { getDailyQuizForDayOfYear } from '../data/educationBank';
import { soundFx } from '../utils/audioEngine';

export default function EducationalQuizNode({ onQuizComplete }) {
  const [selectedLesson, setSelectedLesson] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return getDailyQuizForDayOfYear(dayOfYear);
  });
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleOptionClick = (index) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    if (index === selectedLesson.quiz.correctIndex) {
      soundFx.playSuccess();
      if (onQuizComplete) onQuizComplete();
    } else {
      soundFx.playPop();
    }
  };

  const renderIcon = () => {
    const cat = selectedLesson?.category || '';
    if (cat.includes('PSYCHOLOGY')) return <DuoBrainIcon className="w-9 h-9 shrink-0" />;
    if (cat.includes('RISK')) return <DuoShieldIcon className="w-9 h-9 shrink-0" />;
    if (cat.includes('EXPECTANCY') || cat.includes('EDGE')) return <DuoChartIcon className="w-9 h-9 shrink-0" />;
    return <DuoBookIcon className="w-9 h-9 shrink-0" />;
  };

  return (
    <div className="duo-card p-6 border-2 border-[#1CB0F6]/40 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#20323D]">
        <div className="flex items-center gap-3">
          {renderIcon()}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#1CB0F6]">{selectedLesson.category}</span>
              <span className="text-[9px] font-black bg-[#20323D] text-[#93A5B1] px-2 py-0.5 rounded-md">{selectedLesson.readTime}</span>
            </div>
            <h3 className="text-lg font-black text-white">{selectedLesson.title}</h3>
          </div>
        </div>
        <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black">
          +50 DP Quiz
        </span>
      </div>

      {/* Lesson Concept Card */}
      <div className="p-4 rounded-2xl bg-[#142127] border-2 border-[#20323D] space-y-2">
        <p className="text-xs font-bold text-slate-200 leading-relaxed">
          {selectedLesson.summary}
        </p>
        <div className="p-3 rounded-xl bg-[#1CB0F6]/10 border border-[#1CB0F6]/30 text-xs font-black text-[#1CB0F6] flex items-center gap-2">
          <span>Core Rule:</span>
          <span className="text-white font-bold">{selectedLesson.keyRule}</span>
        </div>
      </div>

      {/* Interactive Micro-Quiz Question */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-xs font-black text-white">
          <HelpCircle size={16} className="text-[#1CB0F6]" />
          <span>Quick Micro-Quiz: {selectedLesson.quiz.question}</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {selectedLesson.quiz.options.map((option, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrect = idx === selectedLesson.quiz.correctIndex;
            let btnStyle = "bg-[#142127] border-[#20323D] border-b-[#2B3D47] text-white hover:bg-[#182830]";

            if (isAnswered) {
              if (isCorrect) {
                btnStyle = "bg-[#58CC02]/20 border-[#58CC02] border-b-[#46A302] text-white";
              } else if (isSelected) {
                btnStyle = "bg-rose-500/20 border-rose-500 border-b-rose-700 text-white";
              }
            }

            return (
              <button
                key={option}
                onClick={() => handleOptionClick(idx)}
                disabled={isAnswered}
                className={`p-3.5 rounded-2xl border-2 border-b-4 text-left text-xs font-black transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
              >
                <span>{option}</span>
                {isAnswered && isCorrect && <CheckCircle2 size={18} className="text-[#58CC02] shrink-0" />}
                {isAnswered && isSelected && !isCorrect && <XCircle size={18} className="text-rose-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Explanation Feedback Banner */}
        {isAnswered && (
          <div className={`p-4 rounded-2xl border-2 flex items-start gap-3 mt-3 animate-fade-in ${
            selectedAnswer === selectedLesson.quiz.correctIndex 
              ? 'bg-[#58CC02]/15 border-[#58CC02]' 
              : 'bg-rose-500/15 border-rose-500'
          }`}>
            <Award size={20} className={selectedAnswer === selectedLesson.quiz.correctIndex ? 'text-[#58CC02]' : 'text-rose-500'} />
            <div>
              <div className="text-xs font-black text-white">
                {selectedAnswer === selectedLesson.quiz.correctIndex ? 'Correct! +50 DP Earned!' : 'Incorrect Choice!'}
              </div>
              <p className="text-xs font-bold text-slate-300 mt-0.5">
                {selectedLesson.quiz.explanation}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
