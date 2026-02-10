import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cron from 'node-cron';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import monitorRoutes from './routes/monitorRoutes.js';
import { auth } from './middleware/auth.js';
import { runMonitoringCycle } from './services/monitorEngine.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/monitors', auth, monitorRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const start = async () => {
  await connectDB();

  cron.schedule('*/20 * * * * *', async () => {
    try {
      await runMonitoringCycle();
    } catch (error) {
      console.error('Monitoring cycle failed:', error.message);
    }
  });

  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`API running on ${port}`));
};

start();
