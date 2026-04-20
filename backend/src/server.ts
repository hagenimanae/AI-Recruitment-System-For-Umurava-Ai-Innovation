import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import jobRoutes from './routes/jobRoutes';
import applicantRoutes from './routes/applicantRoutes';
import aiRoutes from './routes/aiRoutes';
import authRoutes from './routes/authRoutes';
import { protect, adminOnly } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allow all origins for now - restrict in production
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'ok', msg: 'AI Recruitment System API is running' });
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', protect, jobRoutes);  // All job routes require authentication
app.use('/api/applicants', protect, applicantRoutes);  // All applicant routes require authentication
app.use('/api/ai', protect, adminOnly, aiRoutes);  // AI screening - admin only

const start = async () => {
  console.log('[Server] Starting...');
  console.log('[Server] Connecting to database...');
  await connectDB();
  console.log('[Server] Database connected, starting HTTP server...');
  app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`);
    console.log(`[Server] Health check: http://localhost:${PORT}/health`);
  });
};

start().catch(err => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
