import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import animeRoutes from './routes/anime.routes';
import watchlistRoutes from './routes/watchlist.routes';
import historyRoutes from './routes/history.routes';
import commentRoutes from './routes/comment.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Render / Cloudflare reverse proxies
app.set('trust proxy', 1);

// Allowed origins for CORS (Local dev + Vercel production & preview deployments)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((u) => u.trim()) : []),
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((u) => u.trim()) : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Automatically allow all *.vercel.app deployment domains and specified origins
      if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        origin.endsWith('.vercel.app') ||
        /\.vercel\.app$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

import * as path from 'path';
import * as fs from 'fs';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Main API Routes
app.use('/api/auth', authRoutes);
app.use('/api/anime', animeRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);

// Health check and root routes for Render deployment
app.get('/', (_req, res) => {
  res.json({ message: 'Welcome to the AniVerse Anime Platform API!', status: 'running' });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'AniVerse API', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'AniVerse API', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`[AniVerse Server] running on http://localhost:${PORT}`);
});
