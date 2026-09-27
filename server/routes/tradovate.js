import express from 'express';
import WebSocket from 'ws';
import {
  authenticateTradovate,
  fetchTradovateFills,
  fetchTradovateCashBalance
} from '../utils/tradovateShared.js';

const router = express.Router();

/**
 * TRADOVATE API CONFIGURATION
 */
const TRADOVATE_WS_URL = 'wss://demo.tradovateapi.com/v1/websocket';

// Active in-memory session tokens & websocket listeners
const activeSyncSessions = new Map();

/**
 * 1. POST /api/tradovate/auth
 * Authenticates trader credentials with Tradovate REST API
 */
router.post('/auth', async (req, res) => {
  const { name, password, appId, appVersion, cid, sec, env = 'LIVE' } = req.body || {};

  try {
    const result = await authenticateTradovate({
      name,
      password,
      appId,
      appVersion,
      cid,
      sec,
      env
    });

    if (result.status === 200 && result.data?.userId && result.data?.accessToken) {
      // Start background WebSocket Telemetry listener for this user
      startTradovateWebSocketListener(result.data.userId, result.data.accessToken);
    }

    return res.status(result.status).json(result.data);
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
  const env = req.query.env || 'LIVE';

  try {
    const result = await fetchTradovateFills({ token: authHeader, env });
    return res.status(result.status).json(result.data);
  } catch (err) {
    console.error('Tradovate Fill Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch Tradovate fills.' });
  }
});

/**
 * 3. GET /api/tradovate/balance
 * Fetches cash balance snapshot for an authenticated account
 */
router.get('/balance', async (req, res) => {
  const authHeader = req.headers.authorization;
  const env = req.query.env || 'LIVE';

  try {
    const result = await fetchTradovateCashBalance({ token: authHeader, env });
    return res.status(result.status).json(result.data);
  } catch (err) {
    console.error('Tradovate Balance Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch Tradovate cash balance.' });
  }
});

/**
 * 4. Real-Time WebSocket Connection Handler
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
