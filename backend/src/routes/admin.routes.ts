import { Router } from 'express';
import {
  getAdminStats,
  getAdminAnime,
  createAnime,
  updateAnime,
  bulkImportAnime,
  getVideoProviders,
  saveVideoMapping,
  runVerificationAudit,
  exportCatalogData,
  uploadImage,
  resolveImage,
  batchUpdateMedia,
  getAnimeEpisodes,
  updateAnimeEpisodes,
  deleteAnimeEpisode,
  extractVideo,
} from '../controllers/admin.controller';
import { adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Secure all admin routes with admin authorization middleware
router.use(adminMiddleware);

router.get('/stats', getAdminStats);
router.get('/anime', getAdminAnime);
router.post('/anime', createAnime);
router.put('/anime/:id', updateAnime);
router.get('/anime/:id/episodes', getAnimeEpisodes);
router.put('/anime/:id/episodes', updateAnimeEpisodes);
router.delete('/anime/:id/episodes/:epNum', deleteAnimeEpisode);
router.post('/extract-video', extractVideo);
router.post('/import/bulk', bulkImportAnime);
router.post('/upload/image', uploadImage);
router.post('/resolve-image', resolveImage);
router.post('/media/batch', batchUpdateMedia);
router.get('/providers', getVideoProviders);
router.post('/mappings', saveVideoMapping);
router.post('/verify/audit', runVerificationAudit);
router.get('/export', exportCatalogData);

export default router;
