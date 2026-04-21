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

// ✅ SIMPLE & RELIABLE CORS CONFIG
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://ai-recruitment-system-for-umurava-a-mu.vercel.app'
  ],
  credentials: true
}));

// ✅ BODY PARSING
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ HEALTH CHECK
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    msg: 'API running',
    jwtConfigured: !!process.env.JWT_SECRET
  });
});

// ✅ ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/jobs', protect, jobRoutes);
app.use('/api/applicants', protect, applicantRoutes);
app.use('/api/ai', protect, adminOnly, aiRoutes);

// ✅ START SERVER
const start = async () => {
  try {
    console.log('[Server] Connecting DB...');
    await connectDB();

    app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
    });

  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
};

start();