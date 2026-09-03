import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle2, Plus, Trash2, Bell, ShieldAlert, Volume2 } from 'lucide-react';
import { DuoOrphanRadarIcon, DuoHazardIcon, DuoCheckCircleIcon, DuoPlusIcon } from './DuoIcons';
import { soundFx } from '../utils/audioEngine';
import { loadStoredData, saveStoredData, subscribeToStorageUpdate } from '../utils/storage';
import { sendTelegramMobilePush } from './MobileAlertSettings';

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
          
          // 1. Desktop Browser Push Notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('🚨 UNATTENDED PENDING ORDER ALERT', {
              body: `You still have an un-canceled ${order.side} on ${order.symbol} (${order.price}). Cancel on your broker terminal before leaving!`,
              icon: '/parrot_logo.png'
            });
          }

          // 2. Telegram Mobile Phone Push Notification (Sends to your iPhone/Android lockscreen)
          sendTelegramMobilePush(
            `🚨 *UNATTENDED PENDING ORDER ALERT*\n\nYou still have an un-canceled *${order.side}* sitting open on *${order.symbol}* (@ ${order.price}) for ${elapsedMins}m!\n\n⚠️ *Action Required*: Cancel order on Tradovate/MT5/NinjaTrader before stepping away from your desk!`
          );
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

  // Runs 100% in background — Zero UI clutter
  return null;
}
