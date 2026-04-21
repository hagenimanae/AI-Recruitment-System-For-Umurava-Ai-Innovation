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

/**
 * =========================================
 * ✅ CORS CONFIG (PRODUCTION FIXED)
 * =========================================
 */
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://ai-recruitment-system-for-umurava-a-mu.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman / mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log('[CORS BLOCKED]', origin);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// ✅ IMPORTANT: handle preflight requests
app.options(/.*/, cors());

/**
 * =========================================
 * BODY PARSING
 * =========================================
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * =========================================
 * DEBUG MIDDLEWARE (VERY USEFUL)
 * =========================================
 */
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

/**
 * =========================================
 * HEALTH CHECK
 * =========================================
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    msg: 'API running successfully',
    jwtConfigured: !!process.env.JWT_SECRET
  });
});

/**
 * =========================================
 * ROUTES
 * =========================================
 */
app.use('/api/auth', authRoutes);
app.use('/api/jobs', protect, jobRoutes);
app.use('/api/applicants', protect, applicantRoutes);
app.use('/api/ai', protect, adminOnly, aiRoutes);

/**
 * =========================================
 * START SERVER
 * =========================================
 */
const start = async () => {
  try {
    console.log('[Server] Connecting to MongoDB...');
    await connectDB();

    app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
    });

  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
};

start();