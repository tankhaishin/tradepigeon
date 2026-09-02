import React, { useState } from 'react';
import { MessageSquare, LifeBuoy, Send, CheckCircle2, X, Star, Bug, Sparkles } from 'lucide-react';
import { soundFx } from '../utils/audioEngine';
import { sendDiscordFeedbackAlert } from '../utils/discordWebhook';

export default function SupportFeedbackModal({ isOpen, onClose }) {
  const [feedbackType, setFeedbackType] = useState('FEATURE'); // FEATURE, BUG, GENERAL
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const discordInviteUrl = import.meta.env.VITE_DISCORD_INVITE_URL || 'https://discord.gg/tradepigeon';

  const handleSubmit = (e) => {
    e.preventDefault();
    soundFx.playSuccess();
    
    // Dispatch instant real-time webhook alert to your Discord admin channel!
    sendDiscordFeedbackAlert({
      type: feedbackType,
      rating: rating,
      message: message,
      email: email
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setMessage('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="duo-card max-w-md w-full p-6 sm:p-8 space-y-6 border-2 border-[#1CB0F6] relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-[#20323D] text-slate-400 hover:text-white cursor-pointer font-black text-xs"
        >
          Close
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-[#58CC02]/20 text-[#58CC02] flex items-center justify-center mx-auto border-2 border-[#58CC02]">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-black text-white">Feedback Dispatched!</h3>
            <p className="text-xs font-bold text-[#52656D]">Dispatched to the TradePigeon Discord engineering channel.</p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <LifeBuoy size={16} className="text-[#1CB0F6]" />
                <span className="text-[10px] font-black uppercase tracking-wider text-[#1CB0F6]">DIRECT TRADER SUPPORT & FEEDBACK</span>
              </div>
              <h2 className="text-2xl font-black text-white">How Can We Help?</h2>
              <p className="text-xs font-bold text-[#52656D]">Send feedback directly to the TradePigeon engineering team</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Selectors */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFeedbackType('FEATURE')}
                  className={`p-2.5 rounded-xl border-2 font-black text-xs flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    feedbackType === 'FEATURE'
                      ? 'bg-[#1CB0F6]/20 border-[#1CB0F6] text-[#1CB0F6]'
                      : 'bg-[#142127] border-[#20323D] text-[#52656D] hover:text-white'
                  }`}
                >
                  <Sparkles size={16} />
                  <span className="text-[10px]">Idea</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackType('BUG')}
                  className={`p-2.5 rounded-xl border-2 font-black text-xs flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    feedbackType === 'BUG'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                      : 'bg-[#142127] border-[#20323D] text-[#52656D] hover:text-white'
                  }`}
                >
                  <Bug size={16} />
                  <span className="text-[10px]">Report Bug</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackType('GENERAL')}
                  className={`p-2.5 rounded-xl border-2 font-black text-xs flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    feedbackType === 'GENERAL'
                      ? 'bg-[#FF6B00]/20 border-[#FF6B00] text-[#FF6B00]'
                      : 'bg-[#142127] border-[#20323D] text-[#52656D] hover:text-white'
                  }`}
                >
                  <MessageSquare size={16} />
                  <span className="text-[10px]">General</span>
                </button>
              </div>

              {/* Star Rating */}
              <div className="space-y-1 text-center">
                <label className="text-[10px] font-black uppercase text-[#52656D]">Rate Your Experience</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-125 cursor-pointer"
                    >
                      <Star size={20} fill={rating >= star ? '#F59E0B' : 'transparent'} className={rating >= star ? 'text-amber-400' : 'text-[#20323D]'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Optional */}
              <div>
                <label className="text-[10px] font-black uppercase text-[#52656D] block mb-1">Your Contact Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@domain.com"
                  className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-bold text-xs focus:border-[#1CB0F6] outline-none"
                />
              </div>

              {/* Message Details */}
              <div>
                <label className="text-[10px] font-black uppercase text-[#52656D] block mb-1">Feedback / Request Details</label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what feature you'd love to see or what issue you encountered..."
                  className="w-full p-3 rounded-xl bg-[#142127] border-2 border-[#20323D] text-white font-bold text-xs focus:border-[#1CB0F6] outline-none"
                />
              </div>

              <button
                type="submit"
                className="duo-btn-orange w-full py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={16} />
                <span>Submit Feedback to Discord</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
