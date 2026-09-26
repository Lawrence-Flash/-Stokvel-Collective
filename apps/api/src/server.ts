import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import poolRoutes from './routes/pool.routes';
import fulfillmentRoutes from './routes/fulfillment.routes';
import { poolQueue } from './jobs/poolMonitor';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'stokvel-api',
  });
});

// Mount Routes
app.use('/auth', authRoutes);
app.use('/api', poolRoutes);
app.use('/api', fulfillmentRoutes);

// Periodic cron-like job registration with BullMQ (every 60 seconds)
const registerQueueJobs = async () => {
  try {
    await poolQueue.add(
      'evaluate-expired-pools',
      {},
      {
        repeat: {
          every: 60000, // every 1 minute
        },
      }
    );
    console.log('BullMQ pool expiration recurring worker registered.');
  } catch (err: any) {
    console.warn('Queue scheduling warning:', err.message);
  }
};

registerQueueJobs();

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Stokvel Collective API listening on port ${PORT}`);
});

export default app;
