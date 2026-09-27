import {
  authenticateTradovate,
  fetchTradovateFills,
  fetchTradovateCashBalance
} from '../server/utils/tradovateShared.js';

const ALLOWED_ORIGINS = [
  'https://tradepigeon.com',
  'https://www.tradepigeon.com',
  'https://app.tradepigeon.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://localhost:3001'
];

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (process.env.APP_URL && origin === process.env.APP_URL) return true;
  if (process.env.NODE_ENV !== 'production') {
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  }
  if (/^https:\/\/[a-z0-9-]+-.*\.vercel\.app$/.test(origin) || origin.endsWith('.tradepigeon.com')) {
    return true;
  }
  return false;
}

export default async function handler(req, res) {
  // CORS Security Enforcement
  const origin = req.headers.origin;
  const originAllowed = isOriginAllowed(origin);

  if (origin && originAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', 'https://tradepigeon.com');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    if (origin && !originAllowed) {
      res.status(403).json({ error: 'CORS origin denied.' });
      return;
    }
    res.status(200).end();
    return;
  }

  if (origin && !originAllowed) {
    return res.status(403).json({ success: false, error: 'Forbidden: CORS origin not permitted.' });
  }

  const { action = 'auth', env = 'LIVE' } = req.query || {};

  try {
    // 1. AUTHENTICATE & DISCOVER SUB-ACCOUNTS
    if (req.method === 'POST' && (action === 'auth' || req.url.includes('/auth'))) {
      const { name, password, appId, appVersion, cid, sec } = req.body || {};
      const result = await authenticateTradovate({
        name,
        password,
        appId,
        appVersion,
        cid,
        sec,
        env
      });
      return res.status(result.status).json(result.data);
    }

    // 2. FETCH EXECUTION FILLS
    if (req.method === 'GET' && (action === 'fills' || req.url.includes('/fills'))) {
      const authHeader = req.headers.authorization;
      const result = await fetchTradovateFills({ token: authHeader, env });
      return res.status(result.status).json(result.data);
    }

    // 3. FETCH CASH BALANCE SNAPSHOT
    if (req.method === 'GET' && (action === 'balance' || req.url.includes('/balance'))) {
      const authHeader = req.headers.authorization;
      const result = await fetchTradovateCashBalance({ token: authHeader, env });
      return res.status(result.status).json(result.data);
    }

    return res.status(404).json({ success: false, error: 'Tradovate API action not supported.' });

  } catch (error) {
    console.error('Tradovate Proxy Serverless Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal proxy server error.' });
  }
}
