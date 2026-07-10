import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import animeRoutes from './routes/anime.routes';
import watchlistRoutes from './routes/watchlist.routes';
import historyRoutes from './routes/history.routes';
import commentRoutes from './routes/comment.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(
  cors({
    origin: '*', // We can restrict this to frontend domain later if needed
    credentials: true,
  })
);

app.use(express.json());

// Main API Routes
app.use('/api/auth', authRoutes);
app.use('/api/anime', animeRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/comments', commentRoutes);

// Health check and root route
app.get('/', (_req, res) => {
  res.json({ message: 'Welcome to the Bankai TV Anime Platform API!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`[Bankai TV Server] running on http://localhost:${PORT}`);
});
