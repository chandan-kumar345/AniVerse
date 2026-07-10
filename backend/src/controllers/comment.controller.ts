import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export async function getEpisodeComments(req: Request, res: Response) {
  try {
    const { animeId, epNum } = req.params;
    const episodeNumber = parseInt(epNum);

    if (!animeId || isNaN(episodeNumber)) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    // Fetch all comments for this episode
    const comments = await prisma.comment.findMany({
      where: {
        animeId,
        episodeNumber,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Create a tree of comments
    const commentMap = new Map<string, any>();
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    const rootComments: any[] = [];
    commentMap.forEach((comment) => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(comment);
        } else {
          // If parent is not in the list (e.g. deleted), treat as root or discard
          rootComments.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    // Sort replies inside roots by date asc (since comments list was fetched desc)
    const sortReplies = (c: any) => {
      c.replies.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      c.replies.forEach(sortReplies);
    };
    rootComments.forEach(sortReplies);

    return res.status(200).json({ comments: rootComments });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function createComment(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { animeId, episodeNumber, text, parentId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!animeId || episodeNumber === undefined || !text) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const comment = await prisma.comment.create({
      data: {
        userId,
        animeId,
        episodeNumber: parseInt(episodeNumber),
        text,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: 'Comment posted successfully',
      comment: {
        ...comment,
        replies: [],
      },
    });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function likeComment(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.update({
      where: { id },
      data: {
        likes: { increment: 1 },
      },
    });

    return res.status(200).json({ likes: comment.likes });
  } catch (error: any) {
    console.error('Error liking comment:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function deleteComment(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId !== userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.comment.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
