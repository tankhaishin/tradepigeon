import { handleCors } from '../_lib/cors.js';
import { verifyUser, getEntitlement } from '../_lib/account.js';

export default async function handler(req, res) {
  if (!handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const user = await verifyUser(req);
  if (!user) return res.status(401).json({ error: 'Please sign in again.' });
  if (!(await getEntitlement(user)).isPro) return res.status(402).json({ error: 'AI debriefs are a Pro feature.' });

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.length > 20000) {
    return res.status(400).json({ error: 'A valid prompt string is required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Server GEMINI_API_KEY is not configured on the backend.' });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 800,
          thinkingConfig: { thinkingBudget: 0 } // 2.5 thinking tokens would eat the 800-token budget
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AI debrief] Gemini', response.status, errText.slice(0, 300));
      return res.status(response.status === 429 ? 429 : 502).json({ error: 'AI service is busy. Please try again.' });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('[Vercel AI Debrief Proxy Error]:', error.message);
    return res.status(500).json({ error: 'AI service error.' });
  }
}
