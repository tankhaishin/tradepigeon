import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, Lock, X, AlertTriangle } from 'lucide-react';

export default function LegalModal({ isOpen, onClose, documentType = 'TERMS' }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const fileName = documentType === 'PRIVACY' ? '/PRIVACY.md' : '/TERMS.md';

    fetch(fileName)
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[Legal Modal Load Error]:', err);
        setContent('# Terms & Risk Disclaimer\n\nGoodTrader is an educational trading psychology and behavioral tracking software. Trading futures and forex carries substantial risk of loss.');
        setLoading(false);
      });
  }, [isOpen, documentType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="duo-card max-w-3xl w-full p-6 sm:p-8 space-y-6 border-2 border-[#1CB0F6] relative max-h-[88vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#20323D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1CB0F6]/20 text-[#1CB0F6] flex items-center justify-center text-xl font-black shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#1CB0F6]">LEGAL & RISK COMPLIANCE</span>
              <h3 className="text-xl font-black text-white">
                {documentType === 'PRIVACY' ? 'Privacy Policy & Data Security' : 'Terms of Service & CFTC Risk Disclaimer'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#142127] hover:bg-[#20323D] text-[#52656D] hover:text-white transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Markdown Text Viewer Body */}
        <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-[#142127] border-2 border-[#20323D] text-xs font-medium text-slate-300 leading-relaxed space-y-4">
          {loading ? (
            <div className="py-12 text-center text-[#52656D] font-bold">Loading legal document...</div>
          ) : (
            <div className="whitespace-pre-line font-sans">
              {content}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#20323D] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#52656D]">
            <Lock size={12} className="text-[#58CC02]" />
            <span>256-Bit SSL Encrypted • CFTC Rule 4.41 Compliant</span>
          </div>

          <button
            onClick={onClose}
            className="duo-btn-blue px-6 py-2.5 text-xs uppercase"
          >
            Understand & Close
          </button>
        </div>
      </div>
    </div>
  );
}
