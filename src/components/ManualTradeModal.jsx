import React, { useState } from 'react';
import { PlusCircle, X, Check, ShieldAlert, DollarSign, Tag, TrendingUp, TrendingDown, Clock, Calendar, Image as ImageIcon } from 'lucide-react';
import { soundFx } from '../utils/audioEngine';
import { loadStoredData, saveStoredData, STORAGE_KEYS } from '../utils/storage';

export default function ManualTradeModal({ isOpen, onClose, onTradeAdded }) {
  const [symbol, setSymbol] = useState('NQ');
  const [direction, setDirection] = useState('LONG');
  const [pnl, setPnl] = useState('');
  const [isProfitable, setIsProfitable] = useState(true);
  const [rMultiple, setRMultiple] = useState('1.5');
  const [setupTag, setSetupTag] = useState('London Liquidity Sweep');
  const [grade, setGrade] = useState('A+');
  const [executionType, setExecutionType] = useState('Disciplined Win');
  const [notes, setNotes] = useState('');
  const [contracts, setContracts] = useState('2');
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  if (!isOpen) return null;

  const executionOptions = [
    { grade: 'A+', type: 'Disciplined Win', desc: 'Followed plan 100% & hit target', color: 'border-[#58CC02] bg-[#58CC02]/10 text-[#58CC02]' },
    { grade: 'A', type: 'Disciplined Loss', desc: 'Followed plan 100% & hit stop-loss', color: 'border-[#1CB0F6] bg-[#1CB0F6]/10 text-[#1CB0F6]' },
    { grade: 'A', type: 'Disciplined Breakeven', desc: 'Protected equity when momentum stalled', color: 'border-[#CE82FF] bg-[#CE82FF]/10 text-[#CE82FF]' },
    { grade: 'C', type: 'Toxic Win', desc: 'Violated rules but got lucky on PnL', color: 'border-amber-400 bg-amber-400/10 text-amber-400' },
    { grade: 'F', type: 'Double Failure', desc: 'Broke rules & took an emotional loss', color: 'border-rose-500 bg-rose-500/10 text-rose-400' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    soundFx.playSuccess();

    const numericPnl = parseFloat(pnl.replace(/[^0-9.-]/g, '')) || 0;
    const finalPnlValue = isProfitable ? Math.abs(numericPnl) : -Math.abs(numericPnl);

    const newTrade = {
      id: `manual_${Date.now()}`,
      symbol: symbol.toUpperCase(),
      direction,
      pnl: finalPnlValue >= 0 ? `+$${finalPnlValue.toFixed(2)}` : `-$${Math.abs(finalPnlValue).toFixed(2)}`,
      pnlValue: finalPnlValue,
      rMultiple: `${finalPnlValue >= 0 ? '+' : '-'}${Math.abs(parseFloat(rMultiple) || 1).toFixed(2)}R`,
      setup: setupTag,
      grade,
      executionType,
      contracts: parseInt(contracts, 10) || 1,
      time,
      date: new Date().toISOString().split('T')[0],
      notes: notes.trim(),
      isManual: true
    };

    // Save to stored trade history
    const existingTrades = loadStoredData(STORAGE_KEYS.TRADE_HISTORY, []);
    const updatedTrades = [newTrade, ...existingTrades];
    saveStoredData(STORAGE_KEYS.TRADE_HISTORY, updatedTrades);

    if (onTradeAdded) {
      onTradeAdded(newTrade);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="duo-card max-w-lg w-full bg-[#0D1635] border-2 border-[#1C2A4E] border-b-8 border-b-[#14203E] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 text-left">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-[#14203E] hover:bg-[#1C2A4E] border border-[#233560] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-[#FF6B00]/15 border border-[#FF6B00]/30 text-[#FF6B00] text-[10px] font-black uppercase tracking-wider">
              MANUAL LOGGING
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Log Manual Trade Execution</h2>
          <p className="text-xs font-bold text-slate-400">Record execution parameters, PnL, and discipline grades manually.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Symbol & Direction Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Ticker Symbol</label>
              <input 
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g. NQ, ES, GC"
                required
                className="w-full p-3 rounded-2xl bg-[#14203E] border-2 border-[#20325C] text-xs font-black text-white focus:border-[#FF6B00] outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Direction</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#14203E] border-2 border-[#20325C]">
                <button
                  type="button"
                  onClick={() => setDirection('LONG')}
                  className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                    direction === 'LONG' ? 'bg-[#58CC02] text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp size={14} />
                  <span>LONG</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('SHORT')}
                  className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                    direction === 'SHORT' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingDown size={14} />
                  <span>SHORT</span>
                </button>
              </div>
            </div>
          </div>

          {/* PnL & Win/Loss Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Net Profit / Loss ($)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 text-xs font-black">$</span>
                <input 
                  type="number"
                  step="0.01"
                  value={pnl}
                  onChange={(e) => setPnl(e.target.value)}
                  placeholder="450.00"
                  required
                  className="w-full p-3 pl-8 rounded-2xl bg-[#14203E] border-2 border-[#20325C] text-xs font-black text-white focus:border-[#FF6B00] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Outcome</label>
              <button
                type="button"
                onClick={() => setIsProfitable(!isProfitable)}
                className={`w-full p-3 rounded-2xl border-2 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                  isProfitable 
                    ? 'bg-[#58CC02]/15 border-[#58CC02] text-[#58CC02]' 
                    : 'bg-rose-500/15 border-rose-500 text-rose-400'
                }`}
              >
                {isProfitable ? 'WIN (+)' : 'LOSS (-)'}
              </button>
            </div>
          </div>

          {/* Risk R & Contracts */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Risk Multiple (R)</label>
              <input 
                type="number"
                step="0.1"
                value={rMultiple}
                onChange={(e) => setRMultiple(e.target.value)}
                placeholder="1.5"
                className="w-full p-3 rounded-2xl bg-[#14203E] border-2 border-[#20325C] text-xs font-black text-white focus:border-[#FF6B00] outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Contracts / Lots</label>
              <input 
                type="number"
                value={contracts}
                onChange={(e) => setContracts(e.target.value)}
                placeholder="2"
                className="w-full p-3 rounded-2xl bg-[#14203E] border-2 border-[#20325C] text-xs font-black text-white focus:border-[#FF6B00] outline-none"
              />
            </div>
          </div>

          {/* Strategy Playbook Tag */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Playbook Setup Tag</label>
            <input 
              type="text"
              value={setupTag}
              onChange={(e) => setSetupTag(e.target.value)}
              placeholder="e.g. London Liquidity Sweep"
              className="w-full p-3 rounded-2xl bg-[#14203E] border-2 border-[#20325C] text-xs font-black text-white focus:border-[#FF6B00] outline-none"
            />
          </div>

          {/* Execution Discipline Grade Picker */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">Behavioral Execution Grade</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {executionOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.type}
                  onClick={() => {
                    setGrade(opt.grade);
                    setExecutionType(opt.type);
                  }}
                  className={`p-2.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                    executionType === opt.type 
                      ? `${opt.color} shadow-lg ring-2 ring-white/20` 
                      : 'bg-[#14203E]/60 border-[#20325C] text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black">{opt.type}</div>
                    <div className="text-[9px] font-bold opacity-75">{opt.desc}</div>
                  </div>
                  <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-black/30 border border-current/20">
                    {opt.grade}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Trade Notes (Optional)</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key observations, emotion audit, or chart notes..."
              rows={2}
              className="w-full p-3 rounded-2xl bg-[#14203E] border-2 border-[#20325C] text-xs font-bold text-white focus:border-[#FF6B00] outline-none resize-none"
            />
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            className="duo-btn-orange w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl cursor-pointer"
          >
            <PlusCircle size={18} />
            <span>SAVE MANUAL TRADE ENTRY</span>
          </button>
        </form>

      </div>
    </div>
  );
}
