import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle2, Plus, Trash2, Bell, ShieldAlert, Volume2 } from 'lucide-react';
import { soundFx } from '../utils/audioEngine';
import { loadStoredData, saveStoredData, subscribeToStorageUpdate } from '../utils/storage';

export default function PendingOrdersRadar() {
  const [pendingOrders, setPendingOrders] = useState(() => 
    loadStoredData('goodtrader_pending_orders', [])
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [symbol, setSymbol] = useState('NQ1!');
  const [side, setSide] = useState('LIMIT BUY');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('1');

  useEffect(() => {
    saveStoredData('goodtrader_pending_orders', pendingOrders);
  }, [pendingOrders]);

  useEffect(() => {
    const unsubscribe = subscribeToStorageUpdate(({ key, value }) => {
      if (key === 'goodtrader_pending_orders') {
        setPendingOrders(value || []);
      }
    });
    return unsubscribe;
  }, []);

  // Request Desktop Notification Permission
  const requestNotificationPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  };

  // Trigger Desktop Push Notification when order is unattended > 15m
  useEffect(() => {
    if (pendingOrders.length === 0) return;

    const interval = setInterval(() => {
      pendingOrders.forEach((order) => {
        const elapsedMins = Math.floor((Date.now() - order.createdAt) / (1000 * 60));
        if (elapsedMins === 15 || elapsedMins === 30 || elapsedMins === 45) {
          soundFx.playWarning();
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('🚨 UNATTENDED PENDING ORDER ALERT', {
              body: `You still have an un-canceled ${order.side} on ${order.symbol} (${order.price}). Cancel on your broker terminal before leaving!`,
              icon: '/parrot_logo.png'
            });
          }
        }
      });
    }, 1000 * 60);

    return () => clearInterval(interval);
  }, [pendingOrders]);

  const handleAddPendingOrder = (e) => {
    e.preventDefault();
    soundFx.playPop();
    requestNotificationPermission();

    const newOrder = {
      id: `po_${Date.now()}`,
      symbol: symbol.toUpperCase() || 'NQ1!',
      side,
      price: price || 'Market Limit',
      qty: parseInt(qty, 10) || 1,
      createdAt: Date.now()
    };
    const updated = [...pendingOrders, newOrder];
    setPendingOrders(updated);
    setIsAddModalOpen(false);
    setPrice('');
  };

  const handleClearOrder = (id) => {
    soundFx.playSuccess();
    const updated = pendingOrders.filter(o => o.id !== id);
    setPendingOrders(updated);
  };

  const formatElapsed = (createdAt) => {
    const mins = Math.floor((Date.now() - createdAt) / (1000 * 60));
    if (mins < 1) return 'Just set';
    if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m unattended`;
    return `${mins}m unattended`;
  };

  const hasHighRiskOrphan = pendingOrders.some(o => (Date.now() - o.createdAt) > 1000 * 60 * 15);

  return (
    <div className="duo-card p-4 rounded-2xl bg-[#0D1635] border-2 border-[#1C2A4E] border-b-4 border-b-[#15203D] space-y-3 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-xl ${pendingOrders.length > 0 ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-[#182830] text-[#52656D]'}`}>
            <ShieldAlert size={16} />
          </div>
          <div>
            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
              <span>Orphan Pending Order Radar</span>
              {pendingOrders.length > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[9px]">
                  {pendingOrders.length} ACTIVE
                </span>
              )}
            </h4>
            <p className="text-[10px] font-bold text-slate-400">Prevents un-canceled limit fills from blowing accounts</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="duo-btn-blue text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 cursor-pointer"
        >
          <Plus size={12} />
          <span>Track Order</span>
        </button>
      </div>

      {/* High-Risk Orphan Alert Banner */}
      {hasHighRiskOrphan && (
        <div className="p-2.5 rounded-xl bg-rose-500/15 border-2 border-rose-500/50 flex items-center gap-2 text-rose-300 animate-pulse">
          <AlertTriangle size={16} className="shrink-0 text-rose-400" />
          <div className="text-[10px] font-bold leading-tight">
            <span className="font-black text-rose-200 uppercase block">🚨 UNATTENDED PENDING ORDER DETECTED</span>
            You have pending orders open over 15 minutes! Cancel orders on broker terminal before stepping away.
          </div>
        </div>
      )}

      {/* Orders List */}
      {pendingOrders.length === 0 ? (
        <div className="p-3 rounded-xl bg-[#142127]/60 border border-[#20323D] text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-[#58CC02] text-xs font-black">
            <CheckCircle2 size={14} />
            <span>ALL PENDING ORDERS CLEARED</span>
          </div>
          <p className="text-[9px] font-bold text-slate-400">No orphan limit/stop orders left on the market.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pendingOrders.map((order) => {
            const isOrphan = (Date.now() - order.createdAt) > 1000 * 60 * 15;
            return (
              <div 
                key={order.id} 
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  isOrphan 
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' 
                    : 'bg-[#142127] border-[#20323D] text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                    order.side.includes('BUY') ? 'bg-[#58CC02]/20 text-[#58CC02]' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {order.side}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-white text-xs">{order.symbol}</span>
                      <span className="text-[10px] font-bold text-slate-400">@{order.price} ({order.qty}x)</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
                      <Clock size={10} className={isOrphan ? 'text-amber-400 animate-spin' : ''} />
                      <span className={isOrphan ? 'text-amber-300 font-black' : ''}>{formatElapsed(order.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleClearOrder(order.id)}
                  className="px-2 py-1 rounded-lg bg-[#20323D] hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 text-[10px] font-black border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                  title="Mark order as Canceled / Filled"
                >
                  <CheckCircle2 size={12} className="text-[#58CC02]" />
                  <span>Canceled</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Order Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleAddPendingOrder} className="duo-card max-w-sm w-full p-5 space-y-4 border-2 border-amber-500 relative bg-[#0D1635] text-left">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                <ShieldAlert size={12} /> ORPHAN GUARD
              </span>
              <h3 className="text-base font-black text-white">Track Pending Limit / Stop Order</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Asset Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full bg-[#142127] border-2 border-[#20323D] rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none focus:border-amber-400"
                  placeholder="e.g. NQ1!, ES1!"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Order Type</label>
                  <select
                    value={side}
                    onChange={(e) => setSide(e.target.value)}
                    className="w-full bg-[#142127] border-2 border-[#20323D] rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="LIMIT BUY">LIMIT BUY</option>
                    <option value="LIMIT SELL">LIMIT SELL</option>
                    <option value="STOP BUY">STOP BUY</option>
                    <option value="STOP SELL">STOP SELL</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Price Level</label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-[#142127] border-2 border-[#20323D] rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none focus:border-amber-400"
                    placeholder="e.g. 21,420.00"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-1/2 py-2.5 rounded-xl bg-[#142127] text-slate-400 font-black text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 duo-btn-orange py-2.5 text-xs font-black uppercase cursor-pointer"
              >
                Track Order
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
