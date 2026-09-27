import React, { useState } from 'react';
import { Send, Smartphone, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { soundFx } from '../utils/audioEngine';
import { loadStoredData, saveStoredData } from '../utils/storage';

export default function MobileAlertSettings() {
  const [telegramChatId, setTelegramChatId] = useState(() => loadStoredData('tradepigeon_telegram_chat_id', ''));
  const [telegramBotToken, setTelegramBotToken] = useState(() => loadStoredData('tradepigeon_telegram_bot_token', ''));
  const [isSaved, setIsSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    soundFx.playSuccess();
    saveStoredData('tradepigeon_telegram_chat_id', telegramChatId.trim());
    saveStoredData('tradepigeon_telegram_bot_token', telegramBotToken.trim());
    setIsSaved(true);
    setFeedback({ type: 'success', text: 'Mobile alert settings saved successfully!' });
    setTimeout(() => {
      setIsSaved(false);
    }, 4000);
  };

  const handleTestTelegram = async () => {
    if (!telegramChatId.trim()) {
      soundFx.playPop();
      setFeedback({ type: 'error', text: 'Please enter your Telegram Chat ID first.' });
      return;
    }

    if (!telegramBotToken.trim() || telegramBotToken.includes('example_token')) {
      soundFx.playPop();
      setFeedback({ 
        type: 'info', 
        text: 'To send live test alerts, enter your Bot Token created via @BotFather on Telegram.' 
      });
      return;
    }

    soundFx.playPop();
    setIsTesting(true);
    setFeedback(null);

    const message = `🚨 *TradePigeon Mobile Alert Test*\n\nYour iPhone/Android lockscreen push notifications are connected! You will receive instant mobile alerts for unattended pending orders & risk limits.`;

    try {
      const response = await fetch(`https://api.telegram.org/bot${telegramBotToken.trim()}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId.trim(),
          text: message,
          parse_mode: 'Markdown'
        })
      });
      const data = await response.json();
      if (data.ok) {
        soundFx.playSuccess();
        setFeedback({ type: 'success', text: '✓ Test push alert delivered to your Telegram phone!' });
      } else {
        soundFx.playPop();
        setFeedback({ 
          type: 'error', 
          text: `Telegram API: ${data.description || 'Check your Chat ID & Bot Token'}` 
        });
      }
    } catch (err) {
      console.warn('[Telegram Alert Test]:', err);
      setFeedback({ type: 'error', text: 'Failed to reach Telegram API. Check your internet connection.' });
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
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded-xl border text-xs font-black flex items-center gap-2 animate-fade-in ${
          feedback.type === 'success' 
            ? 'bg-[#58CC02]/20 border-[#58CC02] text-[#58CC02]' :
          feedback.type === 'error'
            ? 'bg-rose-500/20 border-rose-500 text-rose-400'
            : 'bg-[#1CB0F6]/20 border-[#1CB0F6] text-[#1CB0F6]'
        }`}>
          {feedback.type === 'success' && <CheckCircle2 size={16} className="shrink-0" />}
          {feedback.type === 'error' && <AlertTriangle size={16} className="shrink-0" />}
          {feedback.type === 'info' && <Info size={16} className="shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

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
            placeholder="Optional - Enter bot token from @BotFather on Telegram"
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
  const chatId = loadStoredData('tradepigeon_telegram_chat_id', '');
  const botToken = loadStoredData('tradepigeon_telegram_bot_token', '');

  if (!chatId || !botToken || botToken.includes('example_token')) return false;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
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
