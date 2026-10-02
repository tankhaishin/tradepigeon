/**
 * Shared CORS and Request Validation Helper for Vercel Serverless Functions
 */

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

export function isOriginAllowed(origin) {
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

export function handleCors(req, res) {
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
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, stripe-signature'
  );

  if (req.method === 'OPTIONS') {
    if (origin && !originAllowed) {
      res.status(403).json({ error: 'CORS origin denied.' });
      return false;
    }
    res.status(200).end();
    return false;
  }

  if (origin && !originAllowed) {
    res.status(403).json({ success: false, error: 'Forbidden: CORS origin not permitted.' });
    return false;
  }

  return true;
}
