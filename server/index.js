import express from 'express';
import cors from 'cors';
import tradovateRouter from './routes/tradovate.js';
import stripeRouter from './routes/stripe.js';
import webhooksRouter from './routes/webhooks.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ONLINE', service: 'GoodTrader Telemetry Server', version: '2.0.0' });
});

// Tradovate & NinjaTrader API Connector Route
app.use('/api/tradovate', tradovateRouter);

// Stripe Payments & Subscription Route
app.use('/api/stripe', stripeRouter);

// Discord Webhooks & Business Intelligence Route
app.use('/api/webhooks/discord', webhooksRouter);

app.listen(PORT, () => {
  console.log(`🚀 GoodTrader Telemetry Backend Server running on http://localhost:${PORT}`);
});
