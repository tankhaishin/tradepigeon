import express from 'express';

const router = express.Router();

/**
 * POST /api/ai/debrief
 * Secure server-side proxy for Google Gemini 1.5 Flash AI psychological debriefs.
 * Shields the GEMINI_API_KEY from exposure in client browser bundles.
 */
router.post('/debrief', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'A valid prompt string is required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Server GEMINI_API_KEY is not configured on the backend.' });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 800
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Gemini API responded with ${response.status}`, details: errText });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('[Server AI Debrief Proxy Error]:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
