/**
 * Vercel Serverless Function: /api/tradovate
 * Handles CORS-safe proxying between TradePigeon web client and Tradovate REST API
 */

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action = 'auth', env = 'LIVE' } = req.query || {};
  const baseUrl = env === 'DEMO' 
    ? 'https://demo.tradovateapi.com/v1' 
    : 'https://live.tradovateapi.com/v1';

  try {
    // 1. AUTHENTICATE & DISCOVER SUB-ACCOUNTS
    if (req.method === 'POST' && (action === 'auth' || req.url.includes('/auth'))) {
      const { name, password, appId = 'TradePigeon', appVersion = '2.0.0', cid = 1, sec = 'tradepigeon-telemetry' } = req.body || {};

      if (!name || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required.' });
      }

      // Handshake with Tradovate Access Token Request
      const authRes = await fetch(`${baseUrl}/auth/accesstokenrequest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          password,
          appId,
          appVersion,
          cid,
          sec
        })
      });

      const authData = await authRes.json();

      if (authData.errorText || !authData.accessToken) {
        return res.status(401).json({ 
          success: false, 
          error: authData.errorText || 'Authentication failed. Please verify your Tradovate credentials.' 
        });
      }

      const accessToken = authData.accessToken;
      const userId = authData.userId;
      const expirationTime = authData.expirationTime;

      // Query all sub-accounts registered under this login
      let accountsList = [];
      try {
        const accRes = await fetch(`${baseUrl}/account/list`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        const accountsData = await accRes.json();
        if (Array.isArray(accountsData)) {
          accountsList = accountsData.map(acc => ({
            id: acc.id,
            name: acc.name,
            accountType: acc.accountType || (env === 'DEMO' ? 'Demo' : 'Funded'),
            active: acc.active !== false,
            clearingHouseId: acc.clearingHouseId
          }));
        }
      } catch (accErr) {
        console.warn('Failed to query Tradovate sub-account list:', accErr);
      }

      // If no sub-accounts array returned, fallback to username
      if (accountsList.length === 0) {
        accountsList = [{
          id: userId || 'primary',
          name: name,
          accountType: env === 'DEMO' ? 'Demo' : 'Live Funded',
          active: true
        }];
      }

      return res.status(200).json({
        success: true,
        accessToken,
        userId,
        expirationTime,
        environment: env,
        accounts: accountsList,
        message: `Successfully connected ${accountsList.length} Tradovate account(s).`
      });
    }

    // 2. FETCH EXECUTION FILLS
    if (req.method === 'GET' && (action === 'fills' || req.url.includes('/fills'))) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ success: false, error: 'Missing Authorization header.' });
      }

      const fillRes = await fetch(`${baseUrl}/fill/list`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      const fills = await fillRes.json();
      if (!Array.isArray(fills)) {
        return res.status(400).json({ success: false, error: 'Unable to retrieve fills from Tradovate.', details: fills });
      }

      const formattedFills = fills.map((f, idx) => {
        const isBuy = f.action === 'Buy';
        const pnlNum = (f.price * (isBuy ? 1 : -1)) * (f.qty || 1);
        const isWin = pnlNum >= 0;

        return {
          id: `TV-${f.id || (1000 + idx)}`,
          time: f.timestamp ? new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'NOW',
          symbol: f.symbol || 'NQ1!',
          side: isBuy ? 'BUY' : 'SELL',
          qty: f.qty || 1,
          price: f.price || 0,
          pnlNum: pnlNum,
          pnl: `${pnlNum >= 0 ? '+' : '-'}$${Math.abs(pnlNum).toFixed(2)}`,
          type: isWin ? 'win' : 'good_loss',
          playbook: 'Tradovate Direct Telemetry',
          account: f.accountId || 'Tradovate Live',
          verified: true
        };
      });

      return res.status(200).json({ success: true, count: formattedFills.length, fills: formattedFills });
    }

    // 3. FETCH CASH BALANCE SNAPSHOT
    if (req.method === 'GET' && (action === 'balance' || req.url.includes('/balance'))) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ success: false, error: 'Missing Authorization header.' });
      }

      const balRes = await fetch(`${baseUrl}/cashBalance/getcashbalancesnapshot`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      const balanceData = await balRes.json();
      return res.status(200).json({ success: true, balance: balanceData });
    }

    return res.status(404).json({ success: false, error: 'Tradovate API action not supported.' });

  } catch (error) {
    console.error('Tradovate Proxy Serverless Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal proxy server error.' });
  }
}
