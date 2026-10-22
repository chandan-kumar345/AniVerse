import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export async function getUserHistory(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const history = await prisma.watchHistory.findMany({
      where: { userId },
      include: {
        anime: {
          select: {
            id: true,
            slug: true,
            title: true,
            englishTitle: true,
            posterImage: true,
            bannerImage: true,
            type: true,
            rating: true,
            score: true,
            duration: true,
            totalEpisodes: true,
            genres: true,
            hasSub: true,
            hasDub: true,
            hasHindi: true,
          },
        },
        episode: {
          select: {
            title: true,
            episodeNumber: true,
            thumbnail: true,
            duration: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.status(200).json({ history });
  } catch (error: any) {
    console.error('Error fetching watch history:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function updateHistory(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { animeId, episodeNumber, watchedTime, duration, progressPercentage } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!animeId || episodeNumber === undefined || episodeNumber === null) {
      return res.status(400).json({ error: 'Missing required parameters: animeId and episodeNumber' });
    }

    const parsedEpNum = parseInt(episodeNumber as any, 10);
    if (isNaN(parsedEpNum) || parsedEpNum < 1) {
      return res.status(400).json({ error: 'Invalid episodeNumber' });
    }

    // Resolve animeId if it was passed as a slug
    let targetAnimeId = animeId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(animeId);
    if (!isUuid) {
      const found = await prisma.anime.findUnique({ where: { slug: animeId } });
      if (found) {
        targetAnimeId = found.id;
      } else {
        return res.status(404).json({ error: 'Anime not found' });
      }
    } else {
      const animeExists = await prisma.anime.findUnique({ where: { id: targetAnimeId } });
      if (!animeExists) {
        return res.status(404).json({ error: 'Anime not found' });
      }
    }

    // Ensure Episode record exists to satisfy foreign key relation
    let ep = await prisma.episode.findUnique({
      where: {
        animeId_episodeNumber: {
          animeId: targetAnimeId,
          episodeNumber: parsedEpNum,
        },
      },
    });

    if (!ep) {
      ep = await prisma.episode.create({
        data: {
          animeId: targetAnimeId,
          episodeNumber: parsedEpNum,
          title: `Episode ${parsedEpNum}`,
          videoUrl: `https://vidsrc.pm/embed/anime?ep=${parsedEpNum}`,
        },
      });
    }

    // Compute progress & duration defaults (default anime episode is 24 mins = 1440 secs)
    const effectiveDuration = duration && Number(duration) > 0 ? Number(duration) : 1440;
    let effectiveWatchedTime = 0;
    let effectiveProgress = 0;

    if (progressPercentage !== undefined && progressPercentage !== null) {
      effectiveProgress = Math.min(Math.max(Number(progressPercentage), 0), 100);
      effectiveWatchedTime = watchedTime !== undefined ? Number(watchedTime) : (effectiveProgress / 100) * effectiveDuration;
    } else if (watchedTime !== undefined && watchedTime !== null) {
      effectiveWatchedTime = Math.max(0, Number(watchedTime));
      effectiveProgress = Math.min((effectiveWatchedTime / effectiveDuration) * 100, 100);
    } else {
      // Default to 15% progress if user just began streaming
      effectiveProgress = 15;
      effectiveWatchedTime = (effectiveProgress / 100) * effectiveDuration;
    }

    const history = await prisma.watchHistory.upsert({
      where: {
        userId_animeId: {
          userId,
          animeId: targetAnimeId,
        },
      },
      update: {
        episodeNumber: parsedEpNum,
        watchedTime: effectiveWatchedTime,
        duration: effectiveDuration,
        progressPercentage: effectiveProgress,
      },
      create: {
        userId,
        animeId: targetAnimeId,
        episodeNumber: parsedEpNum,
        watchedTime: effectiveWatchedTime,
        duration: effectiveDuration,
        progressPercentage: effectiveProgress,
      },
    });

    return res.status(200).json({
      message: 'Watch progress saved successfully',
      history,
    });
  } catch (error: any) {
    console.error('Error saving watch history:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function clearHistoryItem(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { animeId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let targetAnimeId = animeId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(animeId);
    if (!isUuid) {
      const found = await prisma.anime.findUnique({ where: { slug: animeId } });
      if (found) targetAnimeId = found.id;
    }

    await prisma.watchHistory.deleteMany({
      where: {
        userId,
        animeId: targetAnimeId,
      },
    });

    return res.status(200).json({ message: 'Watch history item cleared' });
  } catch (error: any) {
    console.error('Error clearing watch history item:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function clearAllHistory(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await prisma.watchHistory.deleteMany({
      where: { userId },
    });

    return res.status(200).json({ message: 'All watch history cleared' });
  } catch (error: any) {
    console.error('Error clearing all watch history:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
