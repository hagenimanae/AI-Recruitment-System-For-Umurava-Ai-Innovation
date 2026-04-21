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

// Allow frontend origins
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = [
  'http://localhost:3000', 
  'http://127.0.0.1:3000',
  FRONTEND_URL,
  'https://ai-recruitment-system-for-umurava-a-mu.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('[CORS] Blocked origin:', origin);
      return callback(null, false);
    }
    console.log('[CORS] Allowed origin:', origin);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Note: CORS middleware above already handles preflight (OPTIONS) requests automatically

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({ 
    status: 'ok', 
    msg: 'AI Recruitment System API is running',
    jwtConfigured: !!process.env.JWT_SECRET,
    jwtSecretPrefix: process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'using default'
  });
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
