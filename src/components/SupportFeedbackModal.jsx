import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, LifeBuoy, Send, CheckCircle2, X, Star, Bug, Sparkles, 
  Search, BookOpen, Activity, Download, ShieldCheck, ChevronRight, HelpCircle,
  ExternalLink, CreditCard, RefreshCw
} from 'lucide-react';
import { soundFx } from '../utils/audioEngine';
import { sendDiscordFeedbackAlert } from '../utils/discordWebhook';
import { getDiagnosticSnapshot, downloadDiagnosticReport } from '../utils/errorTelemetry';

const KNOWLEDGE_BASE = [
  {
    id: 'tradovate_token',
    category: 'Brokers',
    question: 'How do I connect my Tradovate or NinjaTrader account?',
    answer: 'Navigate to Connections > Add Broker. Enter your Tradovate or NinjaTrader username and password. We support both LIVE funded accounts and DEMO evaluation accounts. For multi-account prop firms (Apex, TopStep), select all accounts in the discovery screen to track them simultaneously.'
  },
  {
    id: 'csv_import',
    category: 'Imports',
    question: 'How do I import CSV statements from Apex, TopStep, or Rithmic?',
    answer: 'Export your account trade history as CSV from your broker or Rithmic Trader Pro. In TradePigeon, go to Playbooks > Import Broker CSV. Our smart CSV parser automatically detects and pairs buy/sell fills, subtracts commissions, and computes Net PnL.'
  },
  {
    id: 'toxic_win',
    category: 'Discipline',
    question: 'Why did my winning trade classify as a Toxic Win (Amber)?',
    answer: 'A Toxic Win occurs when you made money while breaking your trading plan (such as widening your stop loss, averaging down into a loser, or chasing). To prevent dangerous positive reinforcement of bad habits, TradePigeon highlights the PnL in amber rather than celebratory green.'
  },
  {
    id: 'trailing_drawdown',
    category: 'Risk',
    question: 'What is the difference between Trailing Drawdown and EOD Drawdown?',
    answer: 'Intraday Trailing Drawdown (used by Apex/Prop firms) trails your peak unrealized high-water mark during the trade in real time. End-of-Day (EOD) drawdown only calculates your threshold at market close. In TradePigeon, configure your risk buffer in Connections to ensure you never breach your liquidation threshold.'
  },
  {
    id: 'max_daily_loss',
    category: 'Risk',
    question: 'What happens when I hit my Max Daily Loss Limit?',
    answer: 'When your cumulative intraday losses reach your configured limit (e.g., -$500), TradePigeon automatically locks into Double Failure protection mode, advising you to step away from the charts to protect your prop firm evaluation.'
  },
  {
    id: 'lunch_chop',
    category: 'Sessions',
    question: 'How does the NY Lunch Chop trap detection work?',
    answer: 'Between 11:30 and 13:30 EST, institutional liquidity contracts and algorithmic stop-runs spike. If you lose more than -$50 across 2+ trades during lunch, TradePigeon flags an active Chop Trap warning on your dashboard.'
  }
];

export default function SupportFeedbackModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('FAQ'); // 'FAQ' | 'TICKET' | 'STATUS'
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState('tradovate_token');

  // Ticket Form State
  const [feedbackType, setFeedbackType] = useState('BUG'); // BUG, FEATURE, ACCOUNT, GENERAL
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [attachDiagnostics, setAttachDiagnostics] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Live System Status Ping
  const [serverHealth, setServerHealth] = useState(null);
  const [isPingingHealth, setIsPingingHealth] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    // Ping server health
    checkServerHealth();

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const checkServerHealth = async () => {
    setIsPingingHealth(true);
    const start = Date.now();
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setServerHealth({
        ...data,
        latencyMs: Date.now() - start,
        isOnline: res.ok
      });
    } catch (err) {
      setServerHealth({
        status: 'OFFLINE_OR_UNAVAILABLE',
        latencyMs: Date.now() - start,
        isOnline: false
      });
    } finally {
      setIsPingingHealth(false);
    }
  };

  const filteredFaqs = useMemo(() => {
    const q = faqSearch.trim().toLowerCase();
    if (!q) return KNOWLEDGE_BASE;
    return KNOWLEDGE_BASE.filter(f => 
      f.question.toLowerCase().includes(q) || 
      f.answer.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
    );
  }, [faqSearch]);

  if (!isOpen) return null;

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    soundFx.playSuccess();
    const snapshot = attachDiagnostics ? getDiagnosticSnapshot() : null;

    sendDiscordFeedbackAlert({
      type: feedbackType,
      rating,
      message,
      email,
      diagnosticSnapshot: snapshot
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setMessage('');
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in">
      <div className="duo-card max-w-xl w-full p-5 sm:p-7 space-y-5 border-2 border-[#1CB0F6] relative shadow-2xl max-h-[92vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#20323D] pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1CB0F6]/15 border border-[#1CB0F6]/30 flex items-center justify-center text-[#1CB0F6]">
              <LifeBuoy size={18} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">Help &amp; Support Desk</h2>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#52656D]">
                Knowledge Base &bull; Diagnostics &bull; Direct Support
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#20323D] text-slate-400 hover:text-white cursor-pointer font-black text-xs transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* 3-Tab Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#142127] border border-[#20323D] shrink-0">
          <button
            type="button"
            onClick={() => { soundFx.playPop(); setActiveTab('FAQ'); }}
            className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'FAQ'
                ? 'bg-[#1CB0F6] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen size={13} />
            <span>FAQs</span>
          </button>

          <button
            type="button"
            onClick={() => { soundFx.playPop(); setActiveTab('TICKET'); }}
            className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'TICKET'
                ? 'bg-[#58CC02] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send size={13} />
            <span>Submit Ticket</span>
          </button>

          <button
            type="button"
            onClick={() => { soundFx.playPop(); setActiveTab('STATUS'); }}
            className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'STATUS'
                ? 'bg-[#FF6B00] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity size={13} />
            <span>Diagnostics</span>
          </button>
        </div>

        {/* Scrollable Tab Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">

          {/* ==================================================== */}
          {/* TAB 1: KNOWLEDGE BASE / FAQs                         */}
          {/* ==================================================== */}
          {activeTab === 'FAQ' && (
            <div className="space-y-3 animate-fade-in">
              {/* Search Box */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="Search broker setup, toxic wins, trailing drawdown..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#142127] border border-[#20323D] text-xs font-bold text-white placeholder-slate-500 focus:border-[#1CB0F6] outline-none"
                />
              </div>

              {/* FAQs Accordion */}
              <div className="space-y-2">
                {filteredFaqs.map((faq) => {
                  const isExpanded = expandedFaqId === faq.id;
                  return (
                    <div 
                      key={faq.id}
                      className="rounded-2xl border border-[#20323D] bg-[#142127] overflow-hidden transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          soundFx.playPop();
                          setExpandedFaqId(isExpanded ? null : faq.id);
                        }}
                        className="w-full p-3.5 text-left flex items-center justify-between gap-2 cursor-pointer hover:bg-[#1a2c35] transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#1CB0F6]/15 text-[#1CB0F6] border border-[#1CB0F6]/30">
                            {faq.category}
                          </span>
                          <span className="text-xs font-black text-white">{faq.question}</span>
                        </div>
                        <ChevronRight size={14} className={`text-slate-400 transform transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-1 text-xs font-bold text-slate-300 leading-relaxed border-t border-[#20323D]/50 bg-[#0d161a]/60">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Community Help Card */}
              <div className="p-3.5 rounded-2xl bg-[#142127] border border-[#20323D] flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-white">Can't find what you need?</div>
                  <div className="text-[10px] font-bold text-slate-400">Join our Discord community or submit a ticket.</div>
                </div>
                <button
                  onClick={() => setActiveTab('TICKET')}
                  className="duo-btn-blue px-3 py-1.5 text-xs font-black uppercase cursor-pointer"
                >
                  Ask Support &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: TICKET SUBMISSION                             */}
          {/* ==================================================== */}
          {activeTab === 'TICKET' && (
            <div className="animate-fade-in">
              {isSubmitted ? (
                <div className="py-10 text-center space-y-3 animate-fade-in">
                  <div className="w-16 h-16 rounded-3xl bg-[#58CC02]/20 text-[#58CC02] flex items-center justify-center mx-auto border-2 border-[#58CC02]">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-xl font-black text-white">Ticket Dispatched!</h3>
                  <p className="text-xs font-bold text-[#52656D]">
                    Our engineering team has received your ticket along with system diagnostics.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  {/* Category Selection */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Category</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFeedbackType('BUG')}
                        className={`p-2.5 rounded-xl border-2 font-black text-xs flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          feedbackType === 'BUG'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                            : 'bg-[#142127] border-[#20323D] text-[#52656D] hover:text-white'
                        }`}
                      >
                        <Bug size={15} />
                        <span className="text-[10px]">Bug Report</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFeedbackType('FEATURE')}
                        className={`p-2.5 rounded-xl border-2 font-black text-xs flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          feedbackType === 'FEATURE'
                            ? 'bg-[#1CB0F6]/20 border-[#1CB0F6] text-[#1CB0F6]'
                            : 'bg-[#142127] border-[#20323D] text-[#52656D] hover:text-white'
                        }`}
                      >
                        <Sparkles size={15} />
                        <span className="text-[10px]">Feature Idea</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFeedbackType('ACCOUNT')}
                        className={`p-2.5 rounded-xl border-2 font-black text-xs flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          feedbackType === 'ACCOUNT'
                            ? 'bg-[#CE82FF]/20 border-[#CE82FF] text-[#CE82FF]'
                            : 'bg-[#142127] border-[#20323D] text-[#52656D] hover:text-white'
                        }`}
                      >
                        <CreditCard size={15} />
                        <span className="text-[10px]">Billing / Account</span>
                      </button>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Describe the issue or suggestion</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please include details (e.g. broker name, contract, or what you expected to see)..."
                      required
                      rows={3}
                      className="w-full p-3 rounded-xl bg-[#142127] border border-[#20323D] text-xs font-bold text-white placeholder-slate-500 focus:border-[#58CC02] outline-none resize-none"
                    />
                  </div>

                  {/* Email & Diagnostics Checkbox */}
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Your Email (for ticket updates)</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="trader@domain.com"
                        className="w-full p-2.5 rounded-xl bg-[#142127] border border-[#20323D] text-xs font-bold text-white placeholder-slate-500 focus:border-[#58CC02] outline-none"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-[#142127] border border-[#20323D]">
                      <input
                        type="checkbox"
                        checked={attachDiagnostics}
                        onChange={(e) => setAttachDiagnostics(e.target.checked)}
                        className="rounded border-[#20323D] text-[#58CC02] focus:ring-0 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-300">
                        Attach sanitized diagnostic snapshot (App version, storage quota, recent error logs)
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="duo-btn-green w-full py-3 text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send size={14} />
                    <span>Dispatch Support Ticket</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: SYSTEM HEALTH & DIAGNOSTICS                   */}
          {/* ==================================================== */}
          {activeTab === 'STATUS' && (
            <div className="space-y-4 animate-fade-in">
              {/* Server Status Header */}
              <div className="p-3.5 rounded-2xl bg-[#142127] border border-[#20323D] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${serverHealth?.isOnline ? 'bg-[#58CC02] animate-pulse' : 'bg-rose-500'}`} />
                  <div>
                    <div className="text-xs font-black text-white">TradePigeon Backend Gateway</div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {serverHealth?.isOnline ? `Latency: ${serverHealth.latencyMs}ms • Version: ${serverHealth.version || '2.1.0'}` : 'Checking connectivity...'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={checkServerHealth}
                  disabled={isPingingHealth}
                  className="p-1.5 rounded-lg bg-[#20323D] hover:bg-[#2B3D47] text-slate-300 hover:text-white cursor-pointer transition-all"
                  title="Ping Server"
                >
                  <RefreshCw size={13} className={isPingingHealth ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Service Matrix */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-[#142127] border border-[#20323D] space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500">Tradovate Socket API</span>
                  <div className="flex items-center gap-1.5 text-white font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#58CC02]" />
                    <span>Operational</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#142127] border border-[#20323D] space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500">Stripe Billing Gateway</span>
                  <div className="flex items-center gap-1.5 text-white font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#58CC02]" />
                    <span>Operational</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#142127] border border-[#20323D] space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500">Cloud Storage Sync</span>
                  <div className="flex items-center gap-1.5 text-white font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#58CC02]" />
                    <span>Subcollection Mode</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#142127] border border-[#20323D] space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500">CME Market Hours</span>
                  <div className="flex items-center gap-1.5 text-white font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#1CB0F6]" />
                    <span>Active Session</span>
                  </div>
                </div>
              </div>

              {/* Self-Service Diagnostics Download */}
              <div className="p-4 rounded-2xl bg-[#0D1635] border border-[#20325C] space-y-3">
                <div className="flex items-center gap-2 text-white font-black text-xs">
                  <ShieldCheck size={16} className="text-[#58CC02]" />
                  <span>Sanitized Diagnostic Bundle</span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 leading-normal">
                  Download a secure, sanitized JSON snapshot of your current app state, storage usage, and error logs for self-troubleshooting or attaching to email support.
                </p>
                <button
                  type="button"
                  onClick={downloadDiagnosticReport}
                  className="duo-btn-blue w-full py-2.5 text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download Diagnostic Report (.json)</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
