"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserHistory = getUserHistory;
exports.updateHistory = updateHistory;
exports.clearHistoryItem = clearHistoryItem;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getUserHistory(req, res) {
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
    }
    catch (error) {
        console.error('Error fetching watch history:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
async function updateHistory(req, res) {
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
    }
    catch (error) {
        console.error('Error saving watch history:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
async function clearHistoryItem(req, res) {
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
    }
    catch (error) {
        console.error('Error clearing watch history item:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
