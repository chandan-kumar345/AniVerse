import { Router } from 'express';
import {
  getAllAnime,
  getTrendingAnime,
  getPopularAnime,
  getTopTenAnime,
  getAnimeDetail,
  getEpisodeDetail,
  getAutocompleteSuggestions,
  getAllGenres,
  getEpisodeSources,
} from '../controllers/anime.controller';

const router = Router();

router.get('/', getAllAnime);
router.get('/trending', getTrendingAnime);
router.get('/popular', getPopularAnime);
router.get('/top-ten', getTopTenAnime);
router.get('/search/suggest', getAutocompleteSuggestions);
router.get('/genres', getAllGenres);
router.get('/:id', getAnimeDetail);
router.get('/:id/episodes/:epNum/sources', getEpisodeSources);
router.get('/:id/episodes/:epNum', getEpisodeDetail);

export default router;
