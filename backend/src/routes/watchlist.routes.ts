import { Router } from 'express';
import {
  getUserWatchlist,
  addToOrUpdateWatchlist,
  removeFromWatchlist,
  checkWatchlistStatus,
} from '../controllers/watchlist.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getUserWatchlist);
router.post('/', addToOrUpdateWatchlist);
router.delete('/:animeId', removeFromWatchlist);
router.get('/status/:animeId', checkWatchlistStatus);

export default router;
