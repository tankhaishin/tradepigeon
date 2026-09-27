import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import tradovateRouter from './routes/tradovate.js';
import stripeRouter from './routes/stripe.js';
import webhooksRouter from './routes/webhooks.js';
import emailRouter from './routes/email.js';
import aiRouter from './routes/ai.js';

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// 1. HTTP Security Headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://*.stripe.com', 'https://apis.google.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
      connectSrc: [
        "'self'", 
        'https:', 
        'http:', 
        'wss:', 
        'ws:',
        'https://*.tradovateapi.com',
        'https://*.firebaseio.com',
        'https://*.googleapis.com',
        'https://api.stripe.com',
        'https://api.resend.com'
      ],
      frameSrc: ["'self'", 'https://*.stripe.com', 'https://*.google.com'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com']
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

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

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server, mobile app, CLI tools, or same-origin requests
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    if (process.env.APP_URL && origin === process.env.APP_URL) return callback(null, true);
    if (!isProduction) {
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
    }
    if (/^https:\/\/[a-z0-9-]+-.*\.vercel\.app$/.test(origin) || origin.endsWith('.tradepigeon.com')) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy violation: Origin ${origin} is not allowed.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'stripe-signature']
};

app.use(cors(corsOptions));

// 2. Strict Rate Limiting to Protect Against Brute-Force & Denial of Service
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a few minutes before retrying.' }
});

const authAndBrokerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 40, // 40 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Security threshold exceeded. High volume of auth/proxy requests detected.' }
});

// Apply general limiter across all API routes except webhooks
app.use('/api', (req, res, next) => {
  if (req.path.includes('/webhook')) {
    return next(); // Exempt webhooks from client IP limits
  }
  return generalApiLimiter(req, res, next);
});

// Preserve raw body buffer for Stripe webhook signature validation
app.use(express.json({
  verify: (req, _res, buf) => {
    if (req.originalUrl && req.originalUrl.includes('/webhook')) {
      req.rawBody = buf;
    }
  }
}));

// CORS error handler
app.use((err, _req, res, next) => {
  if (err && err.message && err.message.includes('CORS policy violation')) {
    return res.status(403).json({ error: err.message });
  }
  next(err);
});

// 3. Health & System Telemetry
const startTime = Date.now();
app.get('/api/health', (_req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const memory = process.memoryUsage();
  res.json({
    status: 'ONLINE',
    service: 'TradePigeon Institutional Backend Server',
    version: '2.1.0',
    uptime: `${Math.floor(uptimeSeconds / 60)}m ${uptimeSeconds % 60}s`,
    timestamp: new Date().toISOString(),
    environment: isProduction ? 'production' : 'development',
    memoryUsageMb: {
      rss: Math.round(memory.rss / 1024 / 1024),
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024)
    }
  });
});

// 4. Mount API Routers
app.use('/api/tradovate', authAndBrokerLimiter, tradovateRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/webhooks/discord', webhooksRouter);
app.use('/api/email', emailRouter);
app.use('/api/ai', aiRouter);

app.listen(PORT, () => {
  console.log(`🚀 TradePigeon Backend Server running on http://localhost:${PORT}`);
});
