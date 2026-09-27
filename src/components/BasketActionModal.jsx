import React from 'react';
import { X } from 'lucide-react';

export default function BasketActionModal({
  modalState,
  onClose,
  onConfirm,
  onTextChange
}) {
  React.useEffect(() => {
    if (!modalState) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && typeof onClose === 'function') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalState, onClose]);

  if (!modalState) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="duo-card max-w-md w-full p-6 space-y-5 border-2 border-[#1CB0F6] relative shadow-2xl"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#20323D]">
          <h3 className="text-base font-black text-white">
            {modalState.type === 'add_rule' && 'Add Strategy Entry Rule'}
            {modalState.type === 'rename' && 'Rename Strategy Basket'}
            {modalState.type === 'add' && 'Create Risk Management Basket'}
            {modalState.type === 'delete' && 'Delete Strategy Basket'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {modalState.type === 'delete' ? (
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">"{modalState.basketName}"</strong>? Accounts in this basket will be moved to <span className="text-amber-400">No Trade Today</span>.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-[#142127] border-2 border-[#20323D] text-slate-300 hover:bg-[#182830] font-black text-xs uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 border-2 border-rose-600 text-white font-black text-xs uppercase cursor-pointer shadow-lg"
              >
                Delete Basket
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onConfirm} className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                {modalState.type === 'add_rule' && 'Rule / Confluence Description'}
                {modalState.type === 'rename' && 'New Basket Name'}
                {modalState.type === 'add' && 'New Basket Name (e.g. Scalp Pack, 0.25% Risk)'}
              </label>
              <input
                type="text"
                autoFocus
                value={modalState.text || ''}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder={
                  modalState.type === 'add_rule' ? 'e.g. 15m Liquidity Swept, FVG Filled' :
                  modalState.type === 'rename' ? 'e.g. Primary Funded Pack' : 'e.g. Aggressive 1.5%'
                }
                className="w-full bg-[#142127] border-2 border-[#20323D] rounded-xl px-3.5 py-2.5 text-xs font-black text-white focus:outline-none focus:border-[#1CB0F6]"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-[#142127] border-2 border-[#20323D] text-slate-300 hover:bg-[#182830] font-black text-xs uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!modalState.text || !modalState.text.trim()}
                className="flex-1 py-3 rounded-2xl duo-btn-green font-black text-xs uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
