"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAnime = getAllAnime;
exports.getTrendingAnime = getTrendingAnime;
exports.getPopularAnime = getPopularAnime;
exports.getTopTenAnime = getTopTenAnime;
exports.getAnimeDetail = getAnimeDetail;
exports.getEpisodeDetail = getEpisodeDetail;
exports.getAutocompleteSuggestions = getAutocompleteSuggestions;
exports.getAllGenres = getAllGenres;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getAllAnime(req, res) {
    try {
        const { search, genre, type, status, year, limit, page } = req.query;
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 20;
        const skip = (pageNumber - 1) * limitNumber;
        const where = {};
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { englishTitle: { contains: search } },
            ];
        }
        if (genre) {
            where.genres = { contains: genre };
        }
        if (type) {
            where.type = type;
        }
        if (status) {
            where.status = status;
        }
        if (year) {
            where.releasedYear = parseInt(year);
        }
        const [animeList, total] = await prisma.$transaction([
            prisma.anime.findMany({
                where,
                skip,
                take: limitNumber,
                orderBy: { score: 'desc' },
            }),
            prisma.anime.count({ where }),
        ]);
        return res.status(200).json({
            animeList,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
            },
        });
    }
    catch (error) {
        console.error('Error fetching anime list:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
async function getTrendingAnime(_req, res) {
    try {
        const trending = await prisma.anime.findMany({
            where: { isTrending: true },
            take: 10,
            orderBy: { score: 'desc' },
        });
        return res.status(200).json({ trending });
    }
    catch (error) {
        console.error('Error fetching trending anime:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
async function getPopularAnime(_req, res) {
    try {
        const popular = await prisma.anime.findMany({
            where: { isPopular: true },
            take: 10,
            orderBy: { score: 'desc' },
        });
        return res.status(200).json({ popular });
    }
    catch (error) {
        console.error('Error fetching popular anime:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
async function getTopTenAnime(_req, res) {
    try {
        const topTen = await prisma.anime.findMany({
            take: 10,
            orderBy: { score: 'desc' },
        });
        return res.status(200).json({ topTen });
    }
    catch (error) {
        console.error('Error fetching top ten anime:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
async function getAnimeDetail(req, res) {
    try {
        const { id } = req.params;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const anime = await prisma.anime.findUnique({
            where: isUuid ? { id } : { slug: id },
            include: {
                episodes: {
                    orderBy: { episodeNumber: 'asc' },
                },
            },
        });
        if (!anime) {
            return res.status(404).json({ error: 'Anime not found' });
        }
        // Get related anime (simple query matching any common genre)
        const genresList = anime.genres.split(',').map((g) => g.trim());
        const relatedConditions = genresList.map((genre) => ({
            genres: { contains: genre },
        }));
        const related = await prisma.anime.findMany({
            where: {
                id: { not: anime.id },
                OR: relatedConditions,
            },
            take: 6,
        });
        return res.status(200).json({ anime, related });
    }
    catch (error) {
        console.error('Error fetching anime detail:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
async function getEpisodeDetail(req, res) {
    try {
        const { id, epNum } = req.params;
        const episodeNumber = parseInt(epNum);
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const anime = await prisma.anime.findUnique({
            where: isUuid ? { id } : { slug: id },
            select: { id: true, title: true, posterImage: true },
        });
        if (!anime) {
            return res.status(404).json({ error: 'Anime not found' });
        }
        const episode = await prisma.episode.findUnique({
            where: {
                animeId_episodeNumber: {
                    animeId: anime.id,
                    episodeNumber,
                },
            },
        });
        if (!episode) {
            return res.status(404).json({ error: 'Episode not found' });
        }
        // Check total episodes count to see if next episode exists
        const totalEpisodes = await prisma.episode.count({
            where: { animeId: anime.id },
        });
        const hasNext = episodeNumber < totalEpisodes;
        const hasPrev = episodeNumber > 1;
        return res.status(200).json({
            episode,
            animeName: anime.title,
            animePoster: anime.posterImage,
            hasPrev,
            hasNext,
            totalEpisodes,
        });
    }
    catch (error) {
        console.error('Error fetching episode detail:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
async function getAutocompleteSuggestions(req, res) {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(200).json({ suggestions: [] });
        }
        const suggestions = await prisma.anime.findMany({
            where: {
                OR: [
                    { title: { contains: q } },
                    { englishTitle: { contains: q } },
                ],
            },
            select: {
                id: true,
                slug: true,
                title: true,
                englishTitle: true,
                posterImage: true,
                score: true,
                releasedYear: true,
                type: true,
            },
            take: 6,
        });
        return res.status(200).json({ suggestions });
    }
    catch (error) {
        console.error('Error autocomplete query:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
async function getAllGenres(_req, res) {
    try {
        const anime = await prisma.anime.findMany({ select: { genres: true } });
        const genresSet = new Set();
        anime.forEach((a) => {
            a.genres.split(',').forEach((g) => genresSet.add(g.trim()));
        });
        return res.status(200).json({ genres: Array.from(genresSet).sort() });
    }
    catch (error) {
        console.error('Error fetching genres list:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
