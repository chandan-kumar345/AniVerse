import { Router } from 'express';
import {
  getEpisodeComments,
  createComment,
  likeComment,
  deleteComment,
} from '../controllers/comment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Publicly viewable comments
router.get('/:animeId/:epNum', getEpisodeComments);

// Authenticated comment actions
router.post('/', authMiddleware, createComment);
router.post('/:id/like', likeComment); // Can be public or authenticated. Let's allow public to keep it simple
router.delete('/:id', authMiddleware, deleteComment);

export default router;
