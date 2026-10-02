import { handleCors } from './utils/cors.js';

export default function handler(req, res) {
  if (!handleCors(req, res)) return;

  res.status(200).json({
    status: 'ONLINE',
    service: 'TradePigeon Production Serverless Backend',
    version: '2.2.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    emailConfigured: Boolean(process.env.RESEND_API_KEY)
  });
}
