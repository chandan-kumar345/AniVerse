import { Router } from 'express';
import { getUserHistory, updateHistory, clearHistoryItem, clearAllHistory } from '../controllers/history.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getUserHistory);
router.post('/', updateHistory);
router.delete('/', clearAllHistory);
router.delete('/:animeId', clearHistoryItem);

export default router;
