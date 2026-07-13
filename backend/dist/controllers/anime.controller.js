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
async function getAiredEpisodeCountFromAniList(malId) {
    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: `
          query ($malId: Int) {
            Media(idMal: $malId, type: ANIME) {
              status
              episodes
              nextAiringEpisode {
                episode
                airingAt
              }
            }
          }
        `,
                variables: { malId }
            })
        });
        if (!response.ok)
            return null;
        const resJson = (await response.json());
        const media = resJson.data?.Media;
        if (!media)
            return null;
        if (media.nextAiringEpisode) {
            const now = Math.floor(Date.now() / 1000);
            if (now >= media.nextAiringEpisode.airingAt) {
                return media.nextAiringEpisode.episode;
            }
            return media.nextAiringEpisode.episode - 1;
        }
        if (media.status === 'FINISHED') {
            return media.episodes || null;
        }
        return null;
    }
    catch (err) {
        console.error('Error fetching aired episode count from AniList:', err);
        return null;
    }
}
async function getDynamicEpisodeCount(title, malId, dbCount) {
    const titleLower = title.toLowerCase();
    // 1. Fetch exact aired count from AniList if malId exists
    if (malId) {
        const aniListCount = await getAiredEpisodeCountFromAniList(malId);
        if (aniListCount !== null) {
            return aniListCount;
        }
    }
    // 2. Mathematical fallbacks if AniList fails or malId is not set
    if (titleLower.includes('one piece') || malId === 21) {
        const startDate = new Date('2024-07-14');
        const startEp = 1112;
        const now = new Date();
        const msDiff = now.getTime() - startDate.getTime();
        if (msDiff > 0) {
            const weeksPassed = Math.floor(msDiff / (7 * 24 * 60 * 60 * 1000));
            return startEp + weeksPassed;
        }
        return startEp;
    }
    // Fallbacks for completed shows
    if (malId === 1735 || titleLower === 'naruto shippuden')
        return 500;
    if (malId === 20 || titleLower === 'naruto')
        return 220;
    if (titleLower.includes('boruto'))
        return 293;
    if (malId === 269 || (titleLower === 'bleach' && !titleLower.includes('thousand')))
        return 366;
    if (malId === 11061 || titleLower.includes('hunter x hunter'))
        return 148;
    if (titleLower.includes('fullmetal alchemist'))
        return 64;
    if (titleLower.includes('death note'))
        return 37;
    if (titleLower.includes('code geass'))
        return 25;
    if (titleLower.includes('my hero academia') && !titleLower.includes('season'))
        return 25;
    if (titleLower.includes('demon slayer') && titleLower.includes('entertainment'))
        return 11;
    if (titleLower.includes('demon slayer') && titleLower.includes('swordsmith'))
        return 11;
    if (titleLower.includes('demon slayer') && !titleLower.includes('mugen') && !titleLower.includes('hashira'))
        return 26;
    if (titleLower.includes('jujutsu kaisen') && !titleLower.includes('0'))
        return 24;
    if (titleLower.includes('classroom of the elite') && !titleLower.includes('season'))
        return 12;
    return Math.max(dbCount, 12);
}
async function getAllAnime(req, res) {
    try {
        const { search, genre, type, status, year, limit, page, letter, sort } = req.query;
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
            where.type = type.toUpperCase();
        }
        if (status) {
            where.status = status;
        }
        if (year) {
            where.releasedYear = parseInt(year);
        }
        if (letter) {
            const char = letter;
            if (char === '#') {
                where.OR = [
                    { title: { lte: '9', gte: '0' } }
                ];
            }
            else {
                where.OR = [
                    { title: { startsWith: char } },
                    { englishTitle: { startsWith: char } },
                ];
            }
        }
        let orderBy = { score: 'desc' };
        if (sort === 'latest') {
            orderBy = { createdAt: 'desc' };
        }
        else if (sort === 'updated') {
            orderBy = { updatedAt: 'desc' };
        }
        else if (sort === 'year') {
            orderBy = { releasedYear: 'desc' };
        }
        const [animeList, total] = await prisma.$transaction([
            prisma.anime.findMany({
                where,
                skip,
                take: limitNumber,
                orderBy,
                include: {
                    episodes: {
                        select: {
                            episodeNumber: true,
                        },
                        orderBy: {
                            episodeNumber: 'desc',
                        },
                        take: 1,
                    },
                },
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
            take: 30,
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
        // Determine dynamic real-world episode count limit
        const targetEpCount = await getDynamicEpisodeCount(anime.title, anime.malId, anime.episodes.length);
        if (anime.episodes.length < targetEpCount) {
            const sampleVideos = [
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutback.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            ];
            const existingEpNums = new Set(anime.episodes.map(e => e.episodeNumber));
            const newEpisodes = [...anime.episodes];
            for (let i = 1; i <= targetEpCount; i++) {
                if (!existingEpNums.has(i)) {
                    const videoUrl = sampleVideos[(i - 1 + anime.title.length) % sampleVideos.length];
                    newEpisodes.push({
                        id: `mock-${anime.id}-${i}`,
                        animeId: anime.id,
                        episodeNumber: i,
                        title: `Episode ${i}`,
                        videoUrl: videoUrl,
                        thumbnail: anime.bannerImage || anime.posterImage,
                        duration: '24 min',
                        createdAt: anime.createdAt,
                        updatedAt: anime.updatedAt,
                    });
                }
            }
            const isAiring = anime.status === 'Currently Airing';
            const episodesWithDub = newEpisodes.map(ep => {
                let epHasDub = true;
                if (isAiring && ep.episodeNumber >= targetEpCount - 1) {
                    epHasDub = false;
                }
                return {
                    ...ep,
                    hasDub: epHasDub
                };
            });
            episodesWithDub.sort((a, b) => a.episodeNumber - b.episodeNumber);
            anime.episodes = episodesWithDub;
        }
        // Get related anime (franchise movies/specials first, then genre fallback)
        let franchiseKeyword = anime.title.split(':')[0].split(' ')[0].trim();
        if (anime.title.includes('One Piece'))
            franchiseKeyword = 'One Piece';
        else if (anime.title.includes('Naruto') || anime.title.includes('Boruto'))
            franchiseKeyword = 'Naruto';
        else if (anime.title.toLowerCase().includes('bleach'))
            franchiseKeyword = 'Bleach';
        else if (anime.title.includes('Demon Slayer') || anime.title.includes('Kimetsu'))
            franchiseKeyword = 'Demon Slayer';
        else if (anime.title.includes('My Hero Academia'))
            franchiseKeyword = 'My Hero Academia';
        else if (anime.title.toLowerCase().includes('jujutsu kaisen'))
            franchiseKeyword = 'JUJUTSU KAISEN';
        else if (anime.title.includes('Classroom of the Elite'))
            franchiseKeyword = 'Classroom of the Elite';
        let related = await prisma.anime.findMany({
            where: {
                id: { not: anime.id },
                title: { contains: franchiseKeyword },
            },
            take: 8,
        });
        if (related.length < 8) {
            const genresList = anime.genres.split(',').map((g) => g.trim());
            const genreConditions = genresList.map((genre) => ({
                genres: { contains: genre },
            }));
            const existingIds = new Set(related.map((r) => r.id));
            const genreRelated = await prisma.anime.findMany({
                where: {
                    id: { notIn: [anime.id, ...Array.from(existingIds)] },
                    OR: genreConditions,
                },
                take: 8 - related.length,
            });
            related = [...related, ...genreRelated];
        }
        // Find seasons dynamically (siblings of the same franchise)
        let seasons = [];
        // Use franchiseKeyword for grouping instead of a simple prefix split
        let seasonSearchKey = franchiseKeyword;
        // For Boruto, search for Boruto specifically (not all Naruto entries)
        if (anime.title.includes('Boruto'))
            seasonSearchKey = 'Boruto';
        if (seasonSearchKey && seasonSearchKey.length > 2) {
            const siblings = await prisma.anime.findMany({
                where: {
                    OR: [
                        { title: { contains: seasonSearchKey } },
                        { englishTitle: { contains: seasonSearchKey } }
                    ]
                },
                select: { id: true, title: true, slug: true, releasedYear: true, type: true }
            });
            if (siblings.length > 1) {
                // Sort chronologically by release year
                siblings.sort((a, b) => (a.releasedYear || 0) - (b.releasedYear || 0));
                seasons = siblings.map((sibling, index) => {
                    const seasonMatch = sibling.title.match(/Season\s+(\d+)/i);
                    const seasonNum = seasonMatch ? parseInt(seasonMatch[1]) : (index + 1);
                    return {
                        seasonNumber: seasonNum,
                        title: sibling.title,
                        slug: sibling.slug,
                        type: sibling.type
                    };
                });
            }
        }
        return res.status(200).json({ anime, related, seasons });
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
            select: { id: true, title: true, status: true, posterImage: true, bannerImage: true, createdAt: true, updatedAt: true, malId: true },
        });
        if (!anime) {
            return res.status(404).json({ error: 'Anime not found' });
        }
        let episode = await prisma.episode.findUnique({
            where: {
                animeId_episodeNumber: {
                    animeId: anime.id,
                    episodeNumber,
                },
            },
        });
        // Determine dynamic real-world episode count limit
        const targetEpCount = await getDynamicEpisodeCount(anime.title, anime.malId, 12);
        if (!episode && episodeNumber > 0 && episodeNumber <= targetEpCount) {
            const sampleVideos = [
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutback.mp4',
                'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            ];
            const videoUrl = sampleVideos[(episodeNumber - 1 + anime.title.length) % sampleVideos.length];
            episode = {
                id: `mock-${anime.id}-${episodeNumber}`,
                animeId: anime.id,
                episodeNumber,
                title: `Episode ${episodeNumber}`,
                videoUrl: videoUrl,
                thumbnail: anime.bannerImage || anime.posterImage,
                duration: '24 min',
                createdAt: anime.createdAt,
                updatedAt: anime.updatedAt,
            };
        }
        if (!episode) {
            return res.status(404).json({ error: 'Episode not found' });
        }
        const hasNext = episodeNumber < targetEpCount;
        const hasPrev = episodeNumber > 1;
        // Check translation support: currently airing anime latest releases are not dubbed yet.
        // They will receive their dubbed releases in the future.
        const isAiring = anime.status === 'Currently Airing';
        let hasDub = true;
        if (isAiring && episodeNumber >= targetEpCount - 1) {
            hasDub = false;
        }
        return res.status(200).json({
            episode,
            animeName: anime.title,
            animePoster: anime.posterImage,
            hasPrev,
            hasNext,
            totalEpisodes: targetEpCount,
            hasDub
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
