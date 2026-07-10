import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export async function getUserWatchlist(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { status } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const where: any = { userId };
    if (status) {
      where.status = status as string;
    }

    const watchlist = await prisma.watchlist.findMany({
      where,
      include: {
        anime: {
          select: {
            id: true,
            title: true,
            englishTitle: true,
            posterImage: true,
            score: true,
            type: true,
            status: true,
            genres: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.status(200).json({ watchlist });
  } catch (error: any) {
    console.error('Error fetching watchlist:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function addToOrUpdateWatchlist(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { animeId, status } = req.body; // status: WATCHING, COMPLETED, PLAN_TO_WATCH, DROPPED

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!animeId || !status) {
      return res.status(400).json({ error: 'animeId and status are required' });
    }

    const validStatuses = ['WATCHING', 'COMPLETED', 'PLAN_TO_WATCH', 'DROPPED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status type' });
    }

    const watchlist = await prisma.watchlist.upsert({
      where: {
        userId_animeId: {
          userId,
          animeId,
        },
      },
      update: { status },
      create: {
        userId,
        animeId,
        status,
      },
    });

    return res.status(200).json({
      message: 'Watchlist updated successfully',
      watchlist,
    });
  } catch (error: any) {
    console.error('Error updating watchlist:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function removeFromWatchlist(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { animeId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await prisma.watchlist.delete({
      where: {
        userId_animeId: {
          userId,
          animeId,
        },
      },
    });

    return res.status(200).json({ message: 'Removed from watchlist successfully' });
  } catch (error: any) {
    console.error('Error removing from watchlist:', error);
    // If not found
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Watchlist item not found' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function checkWatchlistStatus(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { animeId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const watchlistItem = await prisma.watchlist.findUnique({
      where: {
        userId_animeId: {
          userId,
          animeId,
        },
      },
    });

    return res.status(200).json({
      inWatchlist: !!watchlistItem,
      status: watchlistItem ? watchlistItem.status : null,
    });
  } catch (error: any) {
    console.error('Error checking watchlist status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
