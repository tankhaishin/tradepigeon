import express from 'express';
import cors from 'cors';
import WebSocket from 'ws';

const router = express.Router();

/**
 * TRADOVATE API CONFIGURATION
 * Sandbox: https://demo.tradovateapi.com/v1
 * Production: https://live.tradovateapi.com/v1
 */
const TRADOVATE_REST_URL = 'https://demo.tradovateapi.com/v1';
const TRADOVATE_WS_URL = 'wss://demo.tradovateapi.com/v1/websocket';

// Active in-memory session tokens & websocket listeners
const activeSyncSessions = new Map();

/**
 * 1. POST /api/tradovate/auth
 * Authenticates trader credentials with Tradovate REST API
 */
router.post('/auth', async (req, res) => {
  const { name, password, appId, appVersion, cid, sec } = req.body;

  if (!name || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required.' });
  }

  try {
    const response = await fetch(`${TRADOVATE_REST_URL}/auth/accesstokenrequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        password,
        appId: appId || 'GoodTraderApp',
        appVersion: appVersion || '2.0.0',
        cid: cid || 1,
        sec: sec || 'secret-key-goodtrader'
      })
    });

    const data = await response.json();

    if (data.errorText) {
      return res.status(401).json({ success: false, error: data.errorText });
    }

    const accessToken = data.accessToken;
    const userId = data.userId;

    // Start background WebSocket Telemetry listener for this user
    startTradovateWebSocketListener(userId, accessToken);

    return res.json({
      success: true,
      accessToken,
      userId,
      accountName: name,
      message: 'Tradovate API authenticated successfully. Telemetry listener active.'
    });

  } catch (err) {
    console.error('Tradovate Auth Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to connect to Tradovate API server.' });
  }
});

/**
 * 2. GET /api/tradovate/fills
 * Fetches recent trade execution fills for an authenticated account
 */
router.get('/fills', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Missing Authorization bearer token.' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const response = await fetch(`${TRADOVATE_REST_URL}/fill/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const fills = await response.json();

    if (!Array.isArray(fills)) {
      return res.status(400).json({ success: false, error: 'Invalid response from Tradovate fill API.' });
    }

    // Format fills for GoodTrader Execution Matrix
    const formattedLogs = fills.map((f, idx) => {
      const isBuy = f.action === 'Buy';
      const pnlNum = (f.price * (isBuy ? 1 : -1)) * (f.qty || 1); // Sample PnL calculation
      const isWin = pnlNum >= 0;

      return {
        id: `TV-${f.id || (1000 + idx)}`,
        time: f.timestamp ? new Date(f.timestamp).toLocaleTimeString() + ' NY' : 'NOW',
        symbol: f.symbol || 'NQ1!',
        side: isBuy ? 'BUY (LONG)' : 'SELL (SHORT)',
        size: `${f.qty || 1.0} Lots`,
        entry: (f.price || 18450).toFixed(2),
        exit: ((f.price || 18450) + (isWin ? 20 : -20)).toFixed(2),
        pnlNum: pnlNum,
        pnl: `${pnlNum >= 0 ? '+' : '-'}$${Math.abs(pnlNum).toFixed(2)}`,
        type: isWin ? 'FOLLOW_WIN' : 'FOLLOW_LOSS',
        setup: 'Tradovate Live Socket Fill',
        r: `${isWin ? '+' : ''}${(pnlNum / 350).toFixed(1)} R`
      };
    });

    return res.json({ success: true, count: formattedLogs.length, fills: formattedLogs });

  } catch (err) {
    console.error('Tradovate Fill Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch Tradovate fills.' });
  }
});

/**
 * 3. Real-Time WebSocket Connection Handler
 * Connects to Tradovate wss endpoint to listen for user order execution stream
 */
function startTradovateWebSocketListener(userId, accessToken) {
  if (activeSyncSessions.has(userId)) {
    console.log(`WebSocket listener already running for user ${userId}`);
    return;
  }

  try {
    const ws = new WebSocket(TRADOVATE_WS_URL);

    ws.on('open', () => {
      console.log(`[Tradovate WS] Connected for user ${userId}`);
      // Send WebSocket authorization handshake frame
      ws.send(`authorize\n1\n\n${JSON.stringify({ accessToken })}`);
    });

    ws.on('message', (message) => {
      const msgStr = message.toString();
      // Handle incoming execution/fill telemetry frames
      if (msgStr.includes('executionReport') || msgStr.includes('fill')) {
        console.log(`[Tradovate LIVE FILL EVENT] User ${userId}:`, msgStr);
      }
    });

    ws.on('close', () => {
      console.log(`[Tradovate WS] Disconnected for user ${userId}`);
      activeSyncSessions.delete(userId);
    });

    ws.on('error', (err) => {
      console.error(`[Tradovate WS Error] User ${userId}:`, err);
    });

    activeSyncSessions.set(userId, ws);
  } catch (err) {
    console.error('Failed to initiate Tradovate WebSocket:', err);
  }
}

export default router;
