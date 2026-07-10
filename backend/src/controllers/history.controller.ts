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
            title: true,
            englishTitle: true,
            posterImage: true,
            type: true,
          },
        },
        episode: {
          select: {
            title: true,
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
    const { animeId, episodeNumber, watchedTime, duration } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!animeId || episodeNumber === undefined || watchedTime === undefined || !duration) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const progressPercentage = Math.min((watchedTime / duration) * 100, 100);

    const history = await prisma.watchHistory.upsert({
      where: {
        userId_animeId: {
          userId,
          animeId,
        },
      },
      update: {
        episodeNumber,
        watchedTime,
        duration,
        progressPercentage,
      },
      create: {
        userId,
        animeId,
        episodeNumber,
        watchedTime,
        duration,
        progressPercentage,
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

    await prisma.watchHistory.delete({
      where: {
        userId_animeId: {
          userId,
          animeId,
        },
      },
    });

    return res.status(200).json({ message: 'Watch history item cleared' });
  } catch (error: any) {
    console.error('Error clearing watch history item:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
