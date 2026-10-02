import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Upload, X, AlertTriangle, ArrowRight, Undo2, Download } from 'lucide-react';
import { importTradesFile, TEMPLATE_CSV } from '../utils/importFormats';
import { addTrades, getTrades, recordImport, getImportHistory, undoImport } from '../utils/tradeStore';
import { loadStoredData, saveStoredData } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';
import { formatFinancialCurrency } from '../utils/financialMath';

const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
const TIMEZONES = [...new Set([browserTz, 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Singapore', 'Asia/Kuala_Lumpur', 'Australia/Sydney'])];

// One source per account: file-import accounts only. Synced accounts never take files (prevents double counting).
const fileAccounts = () => loadStoredData('tradepigeon_accounts_data', []).filter(a => a.source !== 'sync');

export default function StatementImportModal({ isOpen, onClose, onSuccess }) {
  const accounts = useMemo(() => (isOpen ? fileAccounts() : []), [isOpen]);
  const [account, setAccount] = useState('');
  const [newAccount, setNewAccount] = useState('');
  const [timeZone, setTimeZone] = useState(browserTz);
  const [feePerContract, setFeePerContract] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileText, setFileText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showSkipped, setShowSkipped] = useState(false);
  const [history, setHistory] = useState(() => getImportHistory());
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setHistory(getImportHistory());
    const first = fileAccounts()[0];
    setAccount(first ? first.name : '__new');
    if (first?.timeZone) setTimeZone(first.timeZone);
    setFeePerContract(first?.feePerContract ? String(first.feePerContract) : '');
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const accountName = (account === '__new' ? newAccount : account).trim();

  // Re-parse whenever file, account or timezone changes (ids depend on the account).
  const result = useMemo(() => {
    if (!fileText || !accountName) return null;
    const r = importTradesFile(fileText, { account: accountName, timeZone });
    // Files whose P&L is before fees (Tradovate) get the account's round-trip fee per contract.
    const fee = Math.max(0, parseFloat(feePerContract) || 0);
    const trades = r.trades.map(t => t.pnlIsGross && fee
      ? { ...t, feesNum: Math.round(fee * t.contracts * 100) / 100, pnlNum: Math.round((t.pnlNum - fee * t.contracts) * 100) / 100, pnlIsGross: false }
      : t);
    const existing = new Set(getTrades().map(t => t.id));
    const fresh = trades.filter(t => !existing.has(t.id));
    return { ...r, trades, fresh, already: trades.length - fresh.length, hasGross: r.trades.some(t => t.pnlIsGross) };
  }, [fileText, accountName, timeZone, feePerContract]);

  if (!isOpen) return null;

  const readFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setShowSkipped(false);
    const reader = new FileReader();
    reader.onload = (e) => setFileText(String(e.target.result || ''));
    reader.readAsText(file);
  };

  const pickAccount = (value) => {
    setAccount(value);
    const acc = accounts.find(a => a.name === value);
    if (acc?.timeZone) setTimeZone(acc.timeZone);
    setFeePerContract(acc?.feePerContract ? String(acc.feePerContract) : '');
  };

  const handleImport = () => {
    if (!result?.fresh.length) return;
    const importId = `IMP-${Date.now()}`;
    const { added, duplicates, previouslyDeleted } = addTrades(result.fresh, { source: 'file', importId });
    recordImport({ importId, fileName, account: accountName, format: result.formatName, added: added.length, duplicates: duplicates + result.already, previouslyDeleted, rejected: result.rejected.length });

    // Register / update the account (file-sourced, remembers its timezone).
    const all = loadStoredData('tradepigeon_accounts_data', []);
    const i = all.findIndex(a => a.name === accountName);
    const acc = { ...(i >= 0 ? all[i] : { id: `ACC-${Date.now()}`, name: accountName, accountNumber: accountName, broker: result.formatName, isActive: true }), source: 'file', timeZone, feePerContract: parseFloat(feePerContract) || 0, status: 'Imported', lastImportAt: Date.now() };
    if (i >= 0) all[i] = acc; else all.push(acc);
    saveStoredData('tradepigeon_accounts_data', all);

    soundFx.playSuccess();
    setHistory(getImportHistory());
    setFileText('');
    setFileName('');
    onSuccess?.(added.length, accountName);
  };

  const handleUndo = (importId) => {
    soundFx.playPop();
    undoImport(importId);
    setHistory(getImportHistory());
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE_CSV], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'tradepigeon-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const pnl = result ? result.fresh.reduce((s, t) => s + t.pnlNum, 0) : 0;
  const isGross = result?.fresh?.some(t => t.pnlIsGross);
  const recent = history.filter(h => !h.undone).slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="duo-card max-w-lg w-full p-6 space-y-5 border-2 border-[#1CB0F6] relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl bg-[#20323D] text-slate-400 hover:text-white cursor-pointer" aria-label="Close">
          <X size={16} />
        </button>

        <h3 className="text-2xl font-black text-white">Import trades</h3>

        {/* 1. Account + timezone of the file */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-300 block">Account</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <select value={account} onChange={(e) => pickAccount(e.target.value)} className="flex-1 min-w-0 p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-bold text-sm outline-none focus:border-[#1CB0F6]">
              {accounts.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
              <option value="__new">+ New account</option>
            </select>
            <select value={timeZone} onChange={(e) => setTimeZone(e.target.value)} title="Time zone of the times in your file" className="w-full sm:w-40 p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-bold text-xs outline-none focus:border-[#1CB0F6]">
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.split('/').pop().replace('_', ' ')} time</option>)}
            </select>
          </div>
          {account === '__new' && (
            <input autoFocus value={newAccount} onChange={(e) => setNewAccount(e.target.value)} placeholder="Name, e.g. Apex 50K #1" className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-bold text-sm outline-none focus:border-[#1CB0F6]" />
          )}
        </div>

        {/* 2. File */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); readFile(e.dataTransfer?.files?.[0]); }}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 rounded-3xl border-2 border-dashed cursor-pointer flex flex-col items-center gap-2 transition-all ${dragOver ? 'border-[#1CB0F6] bg-[#1CB0F6]/10' : 'border-[#1CB0F6]/40 bg-[#142127] hover:border-[#1CB0F6]'}`}
        >
          <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => { readFile(e.target.files?.[0]); e.target.value = ''; }} />
          <Upload size={24} className="text-[#1CB0F6]" />
          <div className="text-sm font-black text-white">{fileName || 'Choose or drop your CSV'}</div>
          <div className="text-[11px] font-bold text-[#7A8E99]">
            Tradovate · NinjaTrader 8 · <button type="button" onClick={(e) => { e.stopPropagation(); downloadTemplate(); }} className="underline hover:text-white inline-flex items-center gap-1"><Download size={10} />template</button>
          </div>
        </div>

        {/* 3. What will happen */}
        {result?.error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-300 text-xs font-bold flex gap-2.5">
            <AlertTriangle size={18} className="shrink-0" /><span>{result.error}</span>
          </div>
        )}
        {result && !result.error && (
          <div className="p-4 rounded-2xl bg-[#182830] border-2 border-[#2B3D47] space-y-2 text-sm">
            <div className="flex justify-between font-black text-white">
              <span>{result.fresh.length} new {result.fresh.length === 1 ? 'trade' : 'trades'}</span>
              <span className={pnl >= 0 ? 'text-[#58CC02]' : 'text-rose-400'}>{formatFinancialCurrency(pnl, { showPlus: true })}{isGross ? ' before fees' : ''}</span>
            </div>
            {result.already > 0 && <div className="text-xs font-bold text-[#7A8E99]">{result.already} already in your journal</div>}
            {result.rejected.length > 0 && (
              <div className="text-xs font-bold text-amber-300">
                <button type="button" onClick={() => setShowSkipped(!showSkipped)} className="underline">{result.rejected.length} {result.rejected.length === 1 ? 'row' : 'rows'} skipped</button>
                {showSkipped && <ul className="mt-1 space-y-0.5 text-amber-200/80">{result.rejected.slice(0, 20).map(r => <li key={r.line}>Row {r.line}: {r.reason}</li>)}</ul>}
              </div>
            )}
            {result.hasGross && (
              <label className="flex items-center justify-between gap-3 text-xs font-bold text-slate-300 pt-1">
                <span>Fees per contract, round trip</span>
                <span className="flex items-center gap-1">$<input type="number" min="0" step="0.01" inputMode="decimal" value={feePerContract} onChange={(e) => setFeePerContract(e.target.value)} placeholder="0.00" className="w-20 p-1.5 rounded-lg bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs outline-none focus:border-[#1CB0F6]" /></span>
              </label>
            )}
            <div className="text-[11px] font-bold text-[#52656D]">{result.formatName}</div>
          </div>
        )}

        <button
          type="button"
          onClick={handleImport}
          disabled={!result?.fresh?.length}
          className={`w-full py-3.5 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 ${result?.fresh?.length ? 'duo-btn-blue cursor-pointer' : 'bg-[#20323D] text-[#52656D] border-2 border-[#37464F] cursor-not-allowed opacity-60 rounded-2xl'}`}
        >
          Import <ArrowRight size={14} />
        </button>

        {/* Import history with undo */}
        {recent.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#20323D]">
            <div className="text-xs font-black text-slate-400">Recent imports</div>
            {recent.map(h => (
              <div key={h.importId} className="flex items-center justify-between gap-3 text-xs font-bold text-slate-300">
                <span className="truncate">{h.account} · {h.added} trades · {new Date(h.at).toLocaleDateString()}</span>
                <button onClick={() => handleUndo(h.importId)} className="flex items-center gap-1 text-[#1CB0F6] hover:text-white shrink-0 cursor-pointer"><Undo2 size={12} />Undo</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
