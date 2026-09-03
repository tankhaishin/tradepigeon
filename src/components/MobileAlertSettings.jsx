import React, { useState, useEffect } from 'react';
import { Send, Smartphone, Bell, CheckCircle2, ShieldAlert, Key } from 'lucide-react';
import { soundFx } from '../utils/audioEngine';
import { loadStoredData, saveStoredData } from '../utils/storage';

export default function MobileAlertSettings() {
  const [telegramChatId, setTelegramChatId] = useState(() => loadStoredData('goodtrader_telegram_chat_id', ''));
  const [telegramBotToken, setTelegramBotToken] = useState(() => loadStoredData('goodtrader_telegram_bot_token', ''));
  const [isSaved, setIsSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    soundFx.playSuccess();
    saveStoredData('goodtrader_telegram_chat_id', telegramChatId);
    saveStoredData('goodtrader_telegram_bot_token', telegramBotToken);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestTelegram = async () => {
    if (!telegramChatId) {
      alert('Please enter your Telegram Chat ID first!');
      return;
    }
    soundFx.playPop();
    setIsTesting(true);

    const token = telegramBotToken || '7129384756:AAFE-example_token_tradepigeon';
    const message = `🚨 *TradePigeon Mobile Alert Test*\n\nYour iPhone/Android lockscreen push notifications are connected! You will receive instant mobile alerts for unattended pending orders & risk limits.`;

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });
      const data = await response.json();
      if (data.ok) {
        soundFx.playSuccess();
        alert('✅ Test push notification sent to your Telegram phone!');
      } else {
        alert(`Telegram notification error: ${data.description || 'Check your Chat ID & Bot Token'}`);
      }
    } catch (err) {
      console.warn('[Telegram Alert Test]:', err);
      alert('Failed to send Telegram message. Please check your Telegram Chat ID.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="duo-card p-5 rounded-2xl bg-[#0D1635] border-2 border-[#1C2A4E] space-y-4 text-left">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
          <Smartphone size={18} />
        </div>
        <div>
          <h3 className="text-sm font-black text-white">Mobile Phone Push Notifications</h3>
          <p className="text-[11px] font-bold text-slate-400">Receive instant lockscreen alerts on your iPhone/Android when away from desk</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Telegram Chat ID (For Lockscreen Push)</label>
          <input
            type="text"
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
            placeholder="e.g. 129384756 (Get from @userinfobot on Telegram)"
            className="w-full bg-[#142127] border-2 border-[#20323D] rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none focus:border-sky-400"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Custom Bot Token (Optional)</label>
          <input
            type="text"
            value={telegramBotToken}
            onChange={(e) => setTelegramBotToken(e.target.value)}
            placeholder="Optional - Leave blank to use TradePigeon Alert Bot"
            className="w-full bg-[#142127] border-2 border-[#20323D] rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none focus:border-sky-400"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            className="duo-btn-green px-4 py-2 text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 size={14} />
            <span>{isSaved ? 'Saved!' : 'Save Mobile Push Settings'}</span>
          </button>

          <button
            type="button"
            onClick={handleTestTelegram}
            disabled={isTesting}
            className="duo-btn-blue px-3 py-2 text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer"
          >
            <Send size={14} />
            <span>{isTesting ? 'Sending...' : 'Test Phone Alert'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Global helper to dispatch mobile Telegram push notifications
 */
export async function sendTelegramMobilePush(messageText) {
  const chatId = loadStoredData('goodtrader_telegram_chat_id', '');
  const botToken = loadStoredData('goodtrader_telegram_bot_token', '');

  if (!chatId) return false;

  const token = botToken || '7129384756:AAFE-example_token_tradepigeon';

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'Markdown'
      })
    });
    return response.ok;
  } catch (err) {
    console.warn('[Telegram Mobile Push Error]:', err);
    return false;
  }
}
