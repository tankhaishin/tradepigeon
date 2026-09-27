// TradePigeon Gemini Generative AI Debrief Engine
// Combines real Google Gemini generative AI insights with audited deterministic mathematical grounding

import { generateIntelligentSessionDebrief } from './aiDebriefEngine.js';
import { formatFinancialCurrency, parseFinancialNumber } from './financialMath.js';

/**
 * Parses and validates Gemini JSON output, stripping code fences if present.
 */
export function parseGeminiResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  try {
    const cleanJson = rawText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    return JSON.parse(cleanJson);
  } catch {
    return null;
  }
}

/**
 * Generates an institutional trading session debrief.
 * When a Gemini API key is available, queries Google Gemini 1.5 Flash for deep, personalized psychological coaching.
 * If offline or key is missing, seamlessly falls back to our audited deterministic diagnostic engine.
 * 
 * @param {object} params
 * @param {Array} params.trades - Executed trades
 * @param {string} params.emotion - 'disciplined' | 'revenge' | 'fomo' | 'anxious' | 'neutral'
 * @param {boolean} params.followedPlan - Whether entry/exit rules were adhered to
 * @param {string} params.selectedMood - Pre-session emotional check
 * @param {string} params.notes - Trader's post-session journal notes
 * @param {string} [params.apiKey] - Optional custom Gemini API key
 * @returns {Promise<object>} Debrief report
 */
export async function generateAiDebriefWithGemini({
  trades = [],
  emotion = 'disciplined',
  followedPlan = true,
  selectedMood = 'Neutral',
  notes = '',
  apiKey = null
}) {
  // Always compute deterministic baseline metrics first (so math is 100% verified)
  const baseline = generateIntelligentSessionDebrief({
    trades,
    emotion,
    followedPlan,
    selectedMood,
    notes
  });

  let storedGeminiKey = '';
  if (typeof window !== 'undefined') {
    try {
      storedGeminiKey = localStorage.getItem('tradepigeon_gemini_api_key') || '';
    } catch (_) {}
  }

  const activeKey = apiKey || 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || 
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    storedGeminiKey;

  // Construct rigorous prompt for Gemini
  const prompt = `You are the lead risk officer and performance psychologist at a top proprietary trading firm.
Analyze this trader's market session and provide direct, compassionate, but mathematically disciplined coaching.

SESSION DATA:
- Total Trades: ${trades.length}
- Net Realized PnL: ${formatFinancialCurrency(baseline.netPnl, { showPlus: true })}
- Execution Adherence: ${followedPlan ? 'Followed Rules 100%' : 'Rules Breached'}
- Pre-Session Mindset: ${selectedMood}
- Post-Session Emotional State: ${emotion}
- Toxic Wins (winning while breaking rules): ${baseline.toxicWinCount || 0}
- Double Failures (losing while breaking rules): ${baseline.doubleFailureCount || 0}
- Trader's Journal Reflection: "${notes || 'No notes entered.'}"

INSTRUCTIONS:
Provide a structured JSON response with exactly the following 4 keys:
1. "integrityAnalysis": (String) 2-3 sentences evaluating their execution discipline. If they had toxic wins, warn them sternly about false reinforcement.
2. "psychologicalAnalysis": (String) 2-3 sentences diagnosing cognitive biases (FOMO, revenge, anxiety, tilt) based on their mood and notes.
3. "actionableRecommendations": (Array of 2-3 strings) Concrete tactical rules for tomorrow (e.g. max loss stop, contract sizing, stepping away).
4. "executionGrade": (String) Letter grade ('A+', 'A', 'B', 'C', 'D', or 'F') based on DISCIPLINE, not PnL. Rule-breaking wins get C or D.

Return ONLY the valid raw JSON object without markdown formatting or backticks.`;

  try {
    let candidateText = null;

    // 1. Primary: Attempt backend server proxy (shields API key from browser bundles)
    if (typeof window !== 'undefined' && !apiKey) {
      try {
        const proxyRes = await fetch('/api/ai/debrief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        if (proxyRes.ok) {
          const proxyData = await proxyRes.json();
          candidateText = proxyData?.candidates?.[0]?.content?.parts?.[0]?.text;
        } else if (proxyRes.status === 429) {
          console.warn('[Gemini AI Engine] Proxy rate limited (429). Retrying after backoff...');
          await new Promise((r) => setTimeout(r, 1200));
          const retryRes = await fetch('/api/ai/debrief', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
          });
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            candidateText = retryData?.candidates?.[0]?.content?.parts?.[0]?.text;
          }
        }
      } catch (_) {
        // Fall back to direct or local auditor
      }
    }

    // 2. Secondary: Direct fetch with key if activeKey is present and proxy did not succeed
    if (!candidateText) {
      if (!activeKey) {
        return {
          ...baseline,
          isRealAi: false,
          aiModel: 'Deterministic Heuristic Auditor (Local)',
          provider: 'TradePigeon Rule Engine'
        };
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`;
      let response = await fetch(url, {
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

      // Handle 429/503 burst rate-limit with single backoff retry
      if (response.status === 429 || response.status === 503) {
        console.warn('[Gemini AI Engine] Rate limit encountered. Executing backoff retry...');
        await new Promise((r) => setTimeout(r, 1500));
        response = await fetch(url, {
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
      }

      if (!response.ok) {
        throw new Error(`Gemini API responded with status ${response.status}`);
      }

      const data = await response.json();
      candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    if (!candidateText) {
      throw new Error('Empty response payload from Gemini');
    }

    // Clean potential markdown code fences and parse AI output
    const parsedAi = parseGeminiResponse(candidateText);
    if (!parsedAi) {
      throw new Error('Could not parse structured JSON from Gemini response');
    }

    return {
      netPnl: baseline.netPnl,
      totalTrades: baseline.totalTrades,
      isRealAi: true,
      aiModel: 'Gemini 1.5 Flash',
      provider: 'Google Gemini',
      integrityAnalysis: parsedAi.integrityAnalysis || baseline.integrityAnalysis,
      psychologicalAnalysis: parsedAi.psychologicalAnalysis || baseline.psychologicalAnalysis,
      actionableRecommendations: Array.isArray(parsedAi.actionableRecommendations) ? parsedAi.actionableRecommendations : baseline.actionableRecommendations,
      executionGrade: parsedAi.executionGrade || (followedPlan ? 'A' : 'D')
    };
  } catch (err) {
    console.warn('[Gemini AI Engine] Falling back to deterministic auditor:', err.message);
    return {
      ...baseline,
      isRealAi: false,
      aiModel: 'Deterministic Heuristic Auditor (Fallback)',
      provider: 'TradePigeon Rule Engine',
      fallbackNotice: 'AI model unreachable; process-rule audit applied.'
    };
  }
}
