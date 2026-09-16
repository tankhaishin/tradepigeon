import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertTriangle, FileText, ArrowRight, Layers } from 'lucide-react';
import { parseTradeFile } from '../utils/tradeParser';
import { loadStoredData, saveStoredData } from '../utils/storage';
import { soundFx } from '../utils/audioEngine';
import { formatFinancialCurrency, sumTradesPnl } from '../utils/financialMath';

export default function StatementImportModal({ isOpen, onClose, onSuccess }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [parsedTrades, setParsedTrades] = useState([]);
  const [accountName, setAccountName] = useState('Broker Account');
  const [errorMsg, setErrorMsg] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFile = (file) => {
    if (!file) return;
    setErrorMsg('');
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        setFileContent(text);
        const trades = parseTradeFile(text, file.name);
        if (!trades || trades.length === 0) {
          setErrorMsg('No valid trades found in this file. Please ensure it is a valid broker statement.');
          setParsedTrades([]);
          return;
        }
        setParsedTrades(trades);

        // Detect default account name
        const detectedAcc = trades.find(t => t.account && t.account !== 'CSV Import')?.account;
        if (detectedAcc) {
          setAccountName(detectedAcc);
        } else {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\s-]/g, ' ').trim();
          setAccountName(cleanName ? `CSV-${cleanName.slice(0, 16)}` : 'Broker Account');
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to parse trade statement.');
        setParsedTrades([]);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer?.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const totalPnL = sumTradesPnl(parsedTrades);
  const winCount = parsedTrades.filter(t => (t.pnlNum !== undefined ? t.pnlNum : 0) >= 0).length;
  const lossCount = parsedTrades.length - winCount;

  const handleCommitImport = () => {
    if (parsedTrades.length === 0) return;
    setIsImporting(true);
    soundFx.playSuccess();

    try {
      const currentDay = loadStoredData('goodtrader_current-day', 1);
      const sessionKey = `goodtrader_session_trades_day_${currentDay}`;
      const existingSessionTrades = loadStoredData(sessionKey, []);

      // Assign the specified account name to all trades
      const normalizedTrades = parsedTrades.map((t, idx) => ({
        ...t,
        id: t.id || `CSV-${Date.now()}-${idx}`,
        account: accountName.trim() || t.account || 'Broker Account'
      }));

      // Deduplicate by signature
      const seen = new Set(existingSessionTrades.map(t => `${t.date}_${t.account}_${t.symbol}_${t.pnlNum}_${t.time}`));
      const newTrades = normalizedTrades.filter(t => !seen.has(`${t.date}_${t.account}_${t.symbol}_${t.pnlNum}_${t.time}`));

      const mergedSessionTrades = [...newTrades, ...existingSessionTrades];
      saveStoredData(sessionKey, mergedSessionTrades);

      // Also register or update the account in goodtrader_accounts_data
      const currentAccounts = loadStoredData('goodtrader_accounts_data', []);
      const existingAccIndex = currentAccounts.findIndex(a => 
        (a.name && a.name.toLowerCase() === accountName.trim().toLowerCase()) ||
        (a.accountNumber && a.accountNumber.toLowerCase() === accountName.trim().toLowerCase())
      );

      let updatedAccounts = [...currentAccounts];
      if (existingAccIndex >= 0) {
        updatedAccounts[existingAccIndex] = {
          ...updatedAccounts[existingAccIndex],
          pnl: (Number(updatedAccounts[existingAccIndex].pnl || 0) + totalPnL),
          status: 'Active',
          lastSync: 'Just now'
        };
      } else {
        updatedAccounts.push({
          id: `ACC-${Date.now()}`,
          name: accountName.trim(),
          accountNumber: accountName.trim(),
          broker: 'Statement Import',
          pnl: totalPnL,
          status: 'Active',
          type: 'MANUAL_IMPORT',
          lastSync: 'Just now',
          isActive: true
        });
      }
      saveStoredData('goodtrader_accounts_data', updatedAccounts);

      if (onSuccess) {
        onSuccess(newTrades.length, accountName.trim());
      }

      onClose();
    } catch (err) {
      setErrorMsg('Error saving imported trades: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="duo-card max-w-lg w-full p-6 space-y-5 border-2 border-[#1CB0F6] relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-[#20323D] text-slate-400 hover:text-white cursor-pointer font-black text-xs transition-colors"
          title="Close Modal"
        >
          <X size={16} />
        </button>

        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#1CB0F6]">STATEMENT INGESTION</span>
          <h3 className="text-2xl font-black text-white">Import Broker Statement</h3>
          <p className="text-xs font-bold text-[#52656D]">
            Upload your CSV or HTML statement from Tradovate, NinjaTrader, MT5, or Rithmic
          </p>
        </div>

        {/* Contained Drag-and-Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
            dragOver 
              ? 'border-[#1CB0F6] bg-[#1CB0F6]/10 scale-[1.01]' 
              : 'border-[#1CB0F6]/40 bg-[#142127] hover:border-[#1CB0F6]'
          }`}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".csv,.html,.htm,.txt"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="hidden" 
          />
          <div className="w-12 h-12 rounded-2xl bg-[#1CB0F6]/15 border border-[#1CB0F6]/30 text-[#1CB0F6] flex items-center justify-center">
            <Upload size={24} />
          </div>
          <div className="text-center">
            <div className="text-sm font-black text-white">
              {selectedFile ? selectedFile.name : 'Click to Browse or Drag & Drop File Here'}
            </div>
            <div className="text-[10px] font-bold text-[#52656D] mt-0.5">
              {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB statement file` : 'Supports .CSV and .HTML broker statements'}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2.5">
            <AlertTriangle size={18} className="shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Parsed Preview Card */}
        {parsedTrades.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#182830] border-2 border-[#2B3D47] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400">Parsed Trades:</span>
              <span className="font-black text-white">{parsedTrades.length} fills ({winCount}W / {lossCount}L)</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400">Total Net PnL:</span>
              <span className={`font-black ${totalPnL >= 0 ? 'text-[#58CC02]' : 'text-rose-400'}`}>
                {formatFinancialCurrency(totalPnL)}
              </span>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Assign to Account Name:
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Apex 50k #1, Tradovate Live"
                className="w-full p-2.5 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-black text-xs outline-none focus:border-[#1CB0F6]"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="duo-btn-dark flex-1 py-3 text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCommitImport}
            disabled={parsedTrades.length === 0 || isImporting}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
              parsedTrades.length > 0 && !isImporting
                ? 'duo-btn-blue cursor-pointer'
                : 'bg-[#20323D] text-[#52656D] border-2 border-[#37464F] cursor-not-allowed opacity-50'
            }`}
          >
            <span>{isImporting ? 'Importing...' : 'Import to Journal'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
