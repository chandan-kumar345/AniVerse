"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminStats = getAdminStats;
exports.getAdminAnime = getAdminAnime;
exports.createAnime = createAnime;
exports.updateAnime = updateAnime;
exports.bulkImportAnime = bulkImportAnime;
exports.getVideoProviders = getVideoProviders;
exports.saveVideoMapping = saveVideoMapping;
exports.runVerificationAudit = runVerificationAudit;
exports.exportCatalogData = exportCatalogData;
exports.uploadImage = uploadImage;
exports.resolveAndCacheImageUrl = resolveAndCacheImageUrl;
exports.resolveImage = resolveImage;
exports.batchUpdateMedia = batchUpdateMedia;
exports.getAnimeEpisodes = getAnimeEpisodes;
exports.updateAnimeEpisodes = updateAnimeEpisodes;
exports.deleteAnimeEpisode = deleteAnimeEpisode;
exports.extractVideo = extractVideo;
const client_1 = require("@prisma/client");
const catalog_service_1 = require("../services/catalog.service");
const verification_service_1 = require("../services/verification.service");
const videoExtractor_service_1 = require("../services/videoExtractor.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const axios_1 = __importDefault(require("axios"));
const prisma = new client_1.PrismaClient();
/**
 * Get comprehensive catalog statistics for the admin dashboard
 */
async function getAdminStats(_req, res) {
    try {
        const totalTitles = await prisma.anime.count();
        const totalSeries = await prisma.anime.count({
            where: {
                OR: [
                    { contentType: 'series' },
                    { type: 'TV' }
                ]
            }
        });
        const totalMovies = await prisma.anime.count({
            where: {
                OR: [
                    { contentType: 'movie' },
                    { type: 'Movie' }
                ]
            }
        });
        const metadataVerified = await prisma.anime.count({
            where: {
                availabilityStatus: { in: ['METADATA_VERIFIED', 'MAPPING_VERIFIED', 'AVAILABLE'] }
            }
        });
        const availableTitles = await prisma.anime.count({
            where: { availabilityStatus: 'AVAILABLE' }
        });
        const unavailableTitles = await prisma.anime.count({
            where: { availabilityStatus: { in: ['UNAVAILABLE', 'DRAFT', 'ERROR'] } }
        });
        const verifiedEnglishDubs = await prisma.anime.count({
            where: { hasDub: true }
        });
        const verifiedHindiDubs = await prisma.anime.count({
            where: { hasHindi: true }
        });
        const totalEpisodes = await prisma.episode.count();
        const verifiedPlayableEpisodes = await prisma.episode.count({
            where: {
                videoMappings: {
                    some: {
                        verificationStatus: { in: ['AVAILABLE', 'MAPPING_VERIFIED'] }
                    }
                }
            }
        });
        const verifiedPlayableMovies = await prisma.anime.count({
            where: {
                OR: [{ contentType: 'movie' }, { type: 'Movie' }],
                videoMappings: {
                    some: {
                        verificationStatus: { in: ['AVAILABLE', 'MAPPING_VERIFIED'] }
                    }
                }
            }
        });
        const unverifiedMappings = await prisma.videoMapping.count({
            where: {
                verificationStatus: { in: ['UNVERIFIED', 'DRAFT', 'MAPPING_PENDING'] }
            }
        });
        const errorMappings = await prisma.videoMapping.count({
            where: { verificationStatus: 'ERROR' }
        });
        const providersCount = await prisma.videoProvider.count();
        return res.status(200).json({
            totalTitles,
            totalSeries,
            totalMovies,
            metadataVerified,
            availableTitles,
            unavailableTitles,
            verifiedEnglishDubs,
            verifiedHindiDubs,
            totalEpisodes,
            verifiedPlayableEpisodes,
            verifiedPlayableMovies,
            unverifiedMappings,
            errorMappings,
            providersCount
        });
    }
    catch (error) {
        console.error('Error fetching admin stats:', error);
        return res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
}
/**
 * Get paginated anime list with rich filters for admin management
 */
async function getAdminAnime(req, res) {
    try {
        const { search, contentType, status, availabilityStatus, hasDub, hasHindi, page, limit, sort, genre, rating } = req.query;
        const pageNumber = parseInt(page) || 1;
        const limitNumber = limit === 'all' || limit === '0' ? undefined : (parseInt(limit) || 20);
        const skip = limitNumber !== undefined ? (pageNumber - 1) * limitNumber : undefined;
        const where = {};
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { englishTitle: { contains: search } },
                { canonicalTitle: { contains: search } },
                { slug: { contains: search } }
            ];
        }
        if (contentType) {
            where.contentType = contentType;
        }
        if (status) {
            where.status = status;
        }
        if (availabilityStatus) {
            where.availabilityStatus = availabilityStatus;
        }
        if (rating) {
            where.rating = rating;
        }
        if (genre) {
            where.genres = { contains: genre };
        }
        if (hasDub !== undefined) {
            where.hasDub = hasDub === 'true';
        }
        if (hasHindi !== undefined) {
            where.hasHindi = hasHindi === 'true';
        }
        let orderBy = { updatedAt: 'desc' };
        if (sort === 'newest') {
            orderBy = { createdAt: 'desc' };
        }
        else if (sort === 'oldest') {
            orderBy = { createdAt: 'asc' };
        }
        else if (sort === 'title_asc') {
            orderBy = { title: 'asc' };
        }
        else if (sort === 'title_desc') {
            orderBy = { title: 'desc' };
        }
        else if (sort === 'updated') {
            orderBy = { updatedAt: 'desc' };
        }
        const [rawAnimeList, total] = await Promise.all([
            prisma.anime.findMany({
                where,
                ...(skip !== undefined ? { skip } : {}),
                ...(limitNumber !== undefined ? { take: limitNumber } : {}),
                orderBy,
                include: {
                    episodes: {
                        orderBy: { episodeNumber: 'asc' },
                        select: { id: true, episodeNumber: true, title: true, videoUrl: true, duration: true }
                    },
                    _count: {
                        select: {
                            episodes: true,
                            videoMappings: true
                        }
                    }
                }
            }),
            prisma.anime.count({ where })
        ]);
        const animeList = rawAnimeList.map((a) => ({
            ...a,
            videoUrl: a.episodes?.[0]?.videoUrl || null,
            episodes: a.episodes || []
        }));
        return res.status(200).json({
            animeList,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber || total,
                totalPages: limitNumber ? Math.ceil(total / limitNumber) : 1
            }
        });
    }
    catch (error) {
        console.error('Error fetching admin anime:', error);
        return res.status(500).json({ error: 'Failed to fetch anime list' });
    }
}
/**
 * Create a new anime manually
 */
async function createAnime(req, res) {
    try {
        const { title, contentType = 'series', type, englishTitle, description, genres, score, releasedYear, posterImage, bannerImage, hasDub, hasHindi, rating, videoUrl } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Anime title is required' });
        }
        const parsedGenres = genres
            ? (Array.isArray(genres) ? genres : genres.split(',').map((g) => g.trim()).filter(Boolean))
            : undefined;
        const anime = await catalog_service_1.CatalogService.importTitle({
            title: title.trim(),
            contentType: contentType === 'movie' ? 'movie' : 'series',
            englishTitle,
            genres: parsedGenres,
            releasedYear: releasedYear ? parseInt(releasedYear) : undefined,
            hasDub: hasDub === true || hasDub === 'true',
            hasHindi: hasHindi === true || hasHindi === 'true'
        });
        const updateData = {};
        if (description)
            updateData.description = description;
        if (posterImage)
            updateData.posterImage = posterImage;
        if (bannerImage)
            updateData.bannerImage = bannerImage;
        if (score !== undefined && score !== null && score !== '' && !isNaN(parseFloat(score)))
            updateData.score = parseFloat(score);
        if (type)
            updateData.type = type;
        if (rating)
            updateData.rating = rating;
        if (parsedGenres && parsedGenres.length > 0) {
            updateData.genres = parsedGenres.join(', ');
        }
        if (Object.keys(updateData).length > 0) {
            await prisma.anime.update({
                where: { id: anime.id },
                data: updateData
            });
        }
        if (typeof videoUrl === 'string' && videoUrl.trim()) {
            const cleanUrl = (0, videoExtractor_service_1.cleanAndNormalizeVideoUrl)(videoUrl.trim());
            await prisma.episode.upsert({
                where: {
                    animeId_episodeNumber: {
                        animeId: anime.id,
                        episodeNumber: 1
                    }
                },
                update: { videoUrl: cleanUrl, status: 'AVAILABLE' },
                create: {
                    animeId: anime.id,
                    episodeNumber: 1,
                    title: 'Episode 1',
                    videoUrl: cleanUrl,
                    status: 'AVAILABLE'
                }
            });
            await prisma.anime.update({
                where: { id: anime.id },
                data: { availabilityStatus: 'AVAILABLE' }
            });
        }
        const fullAnime = await prisma.anime.findUnique({
            where: { id: anime.id },
            include: { episodes: true }
        });
        return res.status(201).json({ message: 'Anime created successfully', anime: fullAnime });
    }
    catch (error) {
        console.error('Error creating anime:', error);
        return res.status(500).json({ error: 'Failed to create anime' });
    }
}
/**
 * Update an existing anime's metadata and verification status
 */
async function updateAnime(req, res) {
    try {
        const { id } = req.params;
        const data = req.body;
        const existing = await prisma.anime.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Anime not found' });
        }
        let resolvedPosterImage = undefined;
        if (data.posterImage !== undefined) {
            if (data.posterImage && String(data.posterImage).trim()) {
                const rawPoster = String(data.posterImage).trim();
                if ((rawPoster.startsWith('http://') || rawPoster.startsWith('https://')) && !rawPoster.startsWith('/uploads/')) {
                    const isLikelyWebPage = /(tvshows?|episodes?|watch|anime|series)\//i.test(rawPoster) || !/\.(jpe?g|png|webp|gif|svg|avif)(\?.*)?$/i.test(rawPoster);
                    if (isLikelyWebPage) {
                        try {
                            resolvedPosterImage = await resolveAndCacheImageUrl(rawPoster);
                        }
                        catch (_) {
                            resolvedPosterImage = rawPoster;
                        }
                    }
                    else {
                        resolvedPosterImage = rawPoster;
                    }
                }
                else {
                    resolvedPosterImage = rawPoster;
                }
            }
            else {
                resolvedPosterImage = null;
            }
        }
        await prisma.anime.update({
            where: { id },
            data: {
                ...(data.title ? { title: data.title } : {}),
                ...(data.englishTitle !== undefined ? { englishTitle: data.englishTitle } : {}),
                ...(data.canonicalTitle !== undefined ? { canonicalTitle: data.canonicalTitle } : {}),
                ...(data.japaneseTitle !== undefined ? { japaneseTitle: data.japaneseTitle } : {}),
                ...(data.contentType ? { contentType: data.contentType } : {}),
                ...(data.description ? { description: data.description } : {}),
                ...(data.genres ? { genres: data.genres } : {}),
                ...(resolvedPosterImage !== undefined ? { posterImage: resolvedPosterImage } : {}),
                ...(data.bannerImage !== undefined ? { bannerImage: data.bannerImage ? String(data.bannerImage).trim() : null } : {}),
                ...(data.score !== undefined && data.score !== null && data.score !== '' && !isNaN(parseFloat(data.score)) ? { score: parseFloat(data.score) } : {}),
                ...(data.status ? { status: data.status } : {}),
                ...(data.availabilityStatus ? { availabilityStatus: data.availabilityStatus } : {}),
                ...(data.hasDub !== undefined ? { hasDub: Boolean(data.hasDub) } : {}),
                ...(data.hasHindi !== undefined ? { hasHindi: Boolean(data.hasHindi) } : {}),
                ...(data.rating ? { rating: data.rating } : {}),
                ...(data.releasedYear && !isNaN(parseInt(data.releasedYear)) ? { releasedYear: parseInt(data.releasedYear) } : {}),
                lastVerifiedAt: new Date()
            }
        });
        if (typeof data.videoUrl === 'string' && data.videoUrl.trim().length > 0) {
            const cleanUrl = (0, videoExtractor_service_1.cleanAndNormalizeVideoUrl)(data.videoUrl.trim());
            await prisma.episode.upsert({
                where: {
                    animeId_episodeNumber: {
                        animeId: id,
                        episodeNumber: 1
                    }
                },
                update: {
                    videoUrl: cleanUrl,
                    status: cleanUrl ? 'AVAILABLE' : 'DRAFT'
                },
                create: {
                    animeId: id,
                    episodeNumber: 1,
                    title: 'Episode 1',
                    videoUrl: cleanUrl,
                    status: cleanUrl ? 'AVAILABLE' : 'DRAFT'
                }
            });
            await prisma.anime.update({
                where: { id },
                data: { availabilityStatus: 'AVAILABLE' }
            });
        }
        if (Array.isArray(data.episodes) && data.episodes.length > 0) {
            for (const ep of data.episodes) {
                if (!ep.episodeNumber)
                    continue;
                const rawEpUrl = typeof ep.videoUrl === 'string' ? ep.videoUrl : '';
                const cleanUrl = (0, videoExtractor_service_1.cleanAndNormalizeVideoUrl)(rawEpUrl.trim());
                await prisma.episode.upsert({
                    where: {
                        animeId_episodeNumber: {
                            animeId: id,
                            episodeNumber: Number(ep.episodeNumber)
                        }
                    },
                    update: {
                        title: ep.title || `Episode ${ep.episodeNumber}`,
                        videoUrl: cleanUrl,
                        duration: ep.duration || '24 min',
                        status: cleanUrl ? 'AVAILABLE' : 'DRAFT'
                    },
                    create: {
                        animeId: id,
                        episodeNumber: Number(ep.episodeNumber),
                        title: ep.title || `Episode ${ep.episodeNumber}`,
                        videoUrl: cleanUrl,
                        duration: ep.duration || '24 min',
                        status: cleanUrl ? 'AVAILABLE' : 'DRAFT'
                    }
                });
            }
            const totalEps = await prisma.episode.count({ where: { animeId: id } });
            await prisma.anime.update({
                where: { id },
                data: {
                    totalEpisodes: totalEps,
                    availabilityStatus: 'AVAILABLE'
                }
            });
        }
        const fullAnime = await prisma.anime.findUnique({
            where: { id },
            include: {
                episodes: {
                    orderBy: { episodeNumber: 'asc' }
                }
            }
        });
        return res.status(200).json({ message: 'Anime updated successfully', anime: fullAnime });
    }
    catch (error) {
        console.error('Error updating anime:', error);
        return res.status(500).json({ error: error.message || 'Failed to update anime' });
    }
}
/**
 * Bulk import anime titles
 */
async function bulkImportAnime(req, res) {
    try {
        const { titles, contentType = 'series', defaultHasDub = true, defaultHasHindi = false, defaultGenres, defaultRating } = req.body;
        if (!Array.isArray(titles) || titles.length === 0) {
            return res.status(400).json({ error: 'An array of titles is required for bulk import' });
        }
        await catalog_service_1.CatalogService.seedDefaultProviders();
        const results = [];
        const errors = [];
        for (let i = 0; i < titles.length; i++) {
            const item = titles[i];
            const titleStr = typeof item === 'string' ? item.trim() : item.title?.trim();
            if (!titleStr)
                continue;
            const itemType = (typeof item === 'object' && item.contentType) ? item.contentType : contentType;
            const itemHasDub = (typeof item === 'object' && item.hasDub !== undefined) ? item.hasDub : defaultHasDub;
            const itemHasHindi = (typeof item === 'object' && item.hasHindi !== undefined) ? item.hasHindi : defaultHasHindi;
            const itemMalId = (typeof item === 'object' && item.malId) ? item.malId : undefined;
            const itemGenres = (typeof item === 'object' && item.genres) ? item.genres : defaultGenres;
            const itemRating = (typeof item === 'object' && item.rating) ? item.rating : defaultRating;
            try {
                const imported = await catalog_service_1.CatalogService.importTitle({
                    title: titleStr,
                    contentType: itemType,
                    hasDub: itemHasDub,
                    hasHindi: itemHasHindi,
                    malId: itemMalId
                });
                const updateData = {};
                if (itemGenres) {
                    const raw = Array.isArray(itemGenres) ? itemGenres : itemGenres.split(',').map((g) => g.trim());
                    const existing = imported.genres ? imported.genres.split(',').map((g) => g.trim()) : [];
                    updateData.genres = Array.from(new Set([...existing, ...raw])).filter(Boolean).join(', ');
                }
                if (itemRating) {
                    updateData.rating = itemRating;
                }
                if (typeof item === 'object' && item.posterImage) {
                    updateData.posterImage = item.posterImage;
                }
                if (typeof item === 'object' && item.description) {
                    updateData.description = item.description;
                }
                if (Object.keys(updateData).length > 0) {
                    await prisma.anime.update({
                        where: { id: imported.id },
                        data: updateData
                    });
                }
                const videoUrl = typeof item === 'object' ? (item.videoUrl || item.episodes?.[0]?.videoUrl) : undefined;
                if (videoUrl && videoUrl.trim()) {
                    await prisma.episode.upsert({
                        where: {
                            animeId_episodeNumber: {
                                animeId: imported.id,
                                episodeNumber: 1
                            }
                        },
                        update: { videoUrl: videoUrl.trim(), status: 'AVAILABLE' },
                        create: {
                            animeId: imported.id,
                            episodeNumber: 1,
                            title: 'Episode 1',
                            videoUrl: videoUrl.trim(),
                            status: 'AVAILABLE'
                        }
                    });
                    await prisma.anime.update({
                        where: { id: imported.id },
                        data: { availabilityStatus: 'AVAILABLE' }
                    });
                }
                results.push({ title: titleStr, id: imported.id, slug: imported.slug, status: 'IMPORTED' });
            }
            catch (err) {
                errors.push({ title: titleStr, error: err.message });
            }
        }
        return res.status(200).json({
            message: `Bulk import completed: ${results.length} succeeded, ${errors.length} failed`,
            importedCount: results.length,
            failedCount: errors.length,
            results,
            errors
        });
    }
    catch (error) {
        console.error('Error in bulk import:', error);
        return res.status(500).json({ error: 'Bulk import failed' });
    }
}
/**
 * Get all configured video providers
 */
async function getVideoProviders(_req, res) {
    try {
        const providers = await prisma.videoProvider.findMany({
            orderBy: { priority: 'asc' },
            include: {
                _count: {
                    select: { mappings: true }
                }
            }
        });
        return res.status(200).json({ providers });
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to fetch video providers' });
    }
}
/**
 * Add or update a video mapping for an anime or episode
 */
async function saveVideoMapping(req, res) {
    try {
        const { animeId, episodeId, providerId, providerVideoId, playbackUrl, embedUrl, audioVersions = [] } = req.body;
        if (!animeId || !providerId) {
            return res.status(400).json({ error: 'animeId and providerId are required' });
        }
        const mapping = await prisma.videoMapping.create({
            data: {
                animeId,
                episodeId: episodeId || null,
                providerId,
                providerVideoId,
                playbackUrl,
                embedUrl,
                verificationStatus: 'UNVERIFIED',
                lastVerifiedAt: new Date()
            }
        });
        // Save audio versions if provided
        if (Array.isArray(audioVersions) && audioVersions.length > 0) {
            for (const av of audioVersions) {
                await prisma.audioVersion.create({
                    data: {
                        mappingId: mapping.id,
                        episodeId: episodeId || null,
                        animeId: animeId,
                        providerId: providerId,
                        language: av.language || 'Japanese',
                        isDub: av.isDub || false,
                        providerVideoId: av.providerVideoId || providerVideoId,
                        playbackUrl: av.playbackUrl || playbackUrl,
                        isAvailable: av.isAvailable !== false,
                        verificationStatus: 'MAPPING_VERIFIED',
                        lastVerifiedAt: new Date()
                    }
                });
            }
        }
        // Run verification on this new mapping immediately
        const verifyResult = await verification_service_1.VerificationService.verifyMapping(mapping.id);
        return res.status(201).json({
            message: 'Video mapping saved and verified',
            mappingId: mapping.id,
            verification: verifyResult
        });
    }
    catch (error) {
        console.error('Error saving video mapping:', error);
        return res.status(500).json({ error: 'Failed to save video mapping' });
    }
}
/**
 * Trigger full catalog verification audit
 */
async function runVerificationAudit(_req, res) {
    try {
        const result = await verification_service_1.VerificationService.runFullCatalogAudit();
        return res.status(200).json({
            message: 'Full catalog verification audit complete',
            audit: result
        });
    }
    catch (error) {
        console.error('Error during verification audit:', error);
        return res.status(500).json({ error: 'Verification audit failed' });
    }
}
/**
 * Export full catalog dataset as JSON
 */
async function exportCatalogData(_req, res) {
    try {
        const catalog = await prisma.anime.findMany({
            include: {
                seasons: true,
                episodes: {
                    include: {
                        videoMappings: true,
                        audioVersions: true
                    }
                },
                videoMappings: true
            }
        });
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="aniverse-catalog-export.json"');
        return res.status(200).send(JSON.stringify(catalog, null, 2));
    }
    catch (error) {
        console.error('Error exporting catalog:', error);
        return res.status(500).json({ error: 'Failed to export catalog' });
    }
}
/**
 * Upload an image file (base64) directly to local storage /uploads/posters/
 */
async function uploadImage(req, res) {
    try {
        const { image, fileName } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'Image data is required' });
        }
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let buffer;
        let ext = 'jpg';
        if (matches && matches.length === 3) {
            const mime = matches[1];
            if (mime.includes('png'))
                ext = 'png';
            else if (mime.includes('webp'))
                ext = 'webp';
            else if (mime.includes('gif'))
                ext = 'gif';
            buffer = Buffer.from(matches[2], 'base64');
        }
        else {
            buffer = Buffer.from(image, 'base64');
        }
        const safeName = (fileName || `poster-${Date.now()}`)
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .replace(/_+/g, '_');
        const finalFileName = `${safeName}-${Date.now()}.${ext}`;
        const postersDir = path.join(__dirname, '..', '..', 'uploads', 'posters');
        if (!fs.existsSync(postersDir)) {
            fs.mkdirSync(postersDir, { recursive: true });
        }
        const filePath = path.join(postersDir, finalFileName);
        fs.writeFileSync(filePath, buffer);
        const publicUrl = `/uploads/posters/${finalFileName}`;
        return res.status(200).json({ url: publicUrl, fileName: finalFileName });
    }
    catch (error) {
        console.error('Error uploading image:', error);
        return res.status(500).json({ error: 'Failed to upload image' });
    }
}
/**
 * Automatically resolve direct image from either:
 * 1) A webpage URL (extracts og:image, twitter:image, image_src, or poster img)
 * 2) An external direct image URL
 * Then downloads and caches it locally into /uploads/posters/ to prevent hotlink blocks/403s.
 */
async function resolveAndCacheImageUrl(rawUrl) {
    let targetUrl = rawUrl.trim();
    if (!targetUrl || targetUrl.startsWith('/uploads/'))
        return targetUrl;
    const hasImageExtension = /\.(jpe?g|png|webp|gif|svg|avif)(\?.*)?$/i.test(targetUrl);
    const isLikelyWebPage = !hasImageExtension || /(tvshows?|episodes?|watch|anime|series)\//i.test(targetUrl);
    if (isLikelyWebPage) {
        try {
            const pageRes = await axios_1.default.get(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                },
                timeout: 8000
            });
            const html = String(pageRes.data);
            const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
            const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
                || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
            const linkMatch = html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i);
            const posterMatch = html.match(/<img[^>]+(?:class|id)=["'][^"']*(?:poster|cover|thumbnail)[^"']*["'][^>]+(?:src|data-src)=["']([^"']+)["']/i)
                || html.match(/<div[^>]+class=["'][^"']*(?:poster|cover)[^"']*["'][^>]*>\s*<img[^>]+(?:src|data-src)=["']([^"']+)["']/i);
            const found = (ogMatch && ogMatch[1]) || (twMatch && twMatch[1]) || (linkMatch && linkMatch[1]) || (posterMatch && posterMatch[1]);
            if (found) {
                let extracted = found.trim();
                if (extracted.startsWith('//'))
                    extracted = `https:${extracted}`;
                else if (extracted.startsWith('/')) {
                    try {
                        const origin = new URL(targetUrl).origin;
                        extracted = `${origin}${extracted}`;
                    }
                    catch (_) { }
                }
                targetUrl = extracted;
            }
        }
        catch (e) {
            console.warn('Could not extract og:image from webpage:', e.message);
        }
    }
    // Download and cache the image locally into /uploads/posters/
    try {
        const imgRes = await axios_1.default.get(targetUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': targetUrl
            },
            timeout: 8000
        });
        const contentType = String(imgRes.headers['content-type'] || '');
        let ext = 'jpg';
        if (contentType.includes('png'))
            ext = 'png';
        else if (contentType.includes('webp'))
            ext = 'webp';
        else if (contentType.includes('gif'))
            ext = 'gif';
        else if (contentType.includes('avif'))
            ext = 'avif';
        else {
            const matchExt = targetUrl.match(/\.(jpe?g|png|webp|gif|avif)/i);
            if (matchExt)
                ext = matchExt[1].toLowerCase().replace('jpeg', 'jpg');
        }
        const safeName = `poster-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const postersDir = path.join(__dirname, '..', '..', 'uploads', 'posters');
        if (!fs.existsSync(postersDir)) {
            fs.mkdirSync(postersDir, { recursive: true });
        }
        const filePath = path.join(postersDir, safeName);
        fs.writeFileSync(filePath, Buffer.from(imgRes.data));
        return `/uploads/posters/${safeName}`;
    }
    catch (err) {
        console.warn('Could not cache image locally, keeping resolved URL:', err.message);
        return targetUrl;
    }
}
/**
 * Controller endpoint to resolve and cache an image URL (or webpage link)
 */
async function resolveImage(req, res) {
    try {
        const { url } = req.body;
        if (!url || typeof url !== 'string' || !url.trim()) {
            return res.status(400).json({ error: 'Valid URL is required' });
        }
        const resolvedUrl = await resolveAndCacheImageUrl(url.trim());
        return res.status(200).json({ url: resolvedUrl });
    }
    catch (err) {
        console.error('Error in resolveImage:', err);
        return res.status(500).json({ error: err.message || 'Failed to resolve image' });
    }
}
/**
 * Fast bulk update for images and video embed URLs across multiple anime
 */
async function batchUpdateMedia(req, res) {
    try {
        const { items } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Array of items required' });
        }
        let updatedCount = 0;
        for (const item of items) {
            if (!item.id && !item.slug && !item.title)
                continue;
            let anime = await prisma.anime.findFirst({
                where: {
                    OR: [
                        ...(item.id ? [{ id: item.id }] : []),
                        ...(item.slug ? [{ slug: item.slug }] : []),
                        ...(item.title ? [{ title: item.title }] : [])
                    ]
                }
            });
            if (!anime)
                continue;
            const updateData = {};
            if (typeof item.posterImage === 'string' && item.posterImage.trim()) {
                updateData.posterImage = item.posterImage.trim();
            }
            if (typeof item.bannerImage === 'string' && item.bannerImage.trim()) {
                updateData.bannerImage = item.bannerImage.trim();
            }
            if (typeof item.rating === 'string' && item.rating.trim()) {
                updateData.rating = item.rating.trim();
            }
            if (Object.keys(updateData).length > 0) {
                await prisma.anime.update({
                    where: { id: anime.id },
                    data: updateData
                });
            }
            if (typeof item.videoUrl === 'string' && item.videoUrl.trim()) {
                const cleanUrl = (0, videoExtractor_service_1.cleanAndNormalizeVideoUrl)(item.videoUrl.trim());
                await prisma.episode.upsert({
                    where: {
                        animeId_episodeNumber: {
                            animeId: anime.id,
                            episodeNumber: 1
                        }
                    },
                    update: {
                        videoUrl: cleanUrl,
                        status: cleanUrl ? 'AVAILABLE' : 'DRAFT'
                    },
                    create: {
                        animeId: anime.id,
                        episodeNumber: 1,
                        title: 'Episode 1',
                        videoUrl: cleanUrl,
                        status: cleanUrl ? 'AVAILABLE' : 'DRAFT'
                    }
                });
                await prisma.anime.update({
                    where: { id: anime.id },
                    data: { availabilityStatus: 'AVAILABLE' }
                });
            }
            // Support multi-episodes in batch update
            if (Array.isArray(item.episodes) && item.episodes.length > 0) {
                for (const ep of item.episodes) {
                    if (!ep.episodeNumber)
                        continue;
                    const cleanUrl = (0, videoExtractor_service_1.cleanAndNormalizeVideoUrl)((ep.videoUrl || '').trim());
                    await prisma.episode.upsert({
                        where: {
                            animeId_episodeNumber: {
                                animeId: anime.id,
                                episodeNumber: Number(ep.episodeNumber)
                            }
                        },
                        update: {
                            title: ep.title || `Episode ${ep.episodeNumber}`,
                            videoUrl: cleanUrl,
                            duration: ep.duration || '24 min',
                            status: cleanUrl ? 'AVAILABLE' : 'DRAFT'
                        },
                        create: {
                            animeId: anime.id,
                            episodeNumber: Number(ep.episodeNumber),
                            title: ep.title || `Episode ${ep.episodeNumber}`,
                            videoUrl: cleanUrl,
                            duration: ep.duration || '24 min',
                            status: cleanUrl ? 'AVAILABLE' : 'DRAFT'
                        }
                    });
                }
                const totalEps = await prisma.episode.count({ where: { animeId: anime.id } });
                await prisma.anime.update({
                    where: { id: anime.id },
                    data: {
                        totalEpisodes: totalEps,
                        availabilityStatus: 'AVAILABLE'
                    }
                });
            }
            updatedCount++;
        }
        return res.status(200).json({
            message: `Successfully updated media for ${updatedCount} titles`,
            updatedCount
        });
    }
    catch (error) {
        console.error('Error in batchUpdateMedia:', error);
        return res.status(500).json({ error: 'Failed to batch update media' });
    }
}
/**
 * Get all episodes for an anime
 */
async function getAnimeEpisodes(req, res) {
    try {
        const { id } = req.params;
        const episodes = await prisma.episode.findMany({
            where: { animeId: id },
            orderBy: { episodeNumber: 'asc' }
        });
        return res.status(200).json({ episodes });
    }
    catch (error) {
        console.error('Error getting anime episodes:', error);
        return res.status(500).json({ error: 'Failed to get anime episodes' });
    }
}
/**
 * Update / Replace episodes for an anime in bulk
 */
async function updateAnimeEpisodes(req, res) {
    try {
        const { id } = req.params;
        const { episodes } = req.body;
        if (!Array.isArray(episodes)) {
            return res.status(400).json({ error: 'episodes must be an array' });
        }
        const anime = await prisma.anime.findUnique({ where: { id } });
        if (!anime) {
            return res.status(404).json({ error: 'Anime not found' });
        }
        const submittedEpNumbers = episodes
            .map((ep) => Number(ep.episodeNumber))
            .filter((n) => !isNaN(n) && n > 0);
        if (submittedEpNumbers.length > 0) {
            await prisma.episode.deleteMany({
                where: {
                    animeId: id,
                    episodeNumber: { notIn: submittedEpNumbers }
                }
            });
        }
        for (const ep of episodes) {
            if (!ep.episodeNumber)
                continue;
            let cleanUrl = (0, videoExtractor_service_1.cleanAndNormalizeVideoUrl)((ep.videoUrl || '').trim());
            if (cleanUrl.startsWith('http') && !cleanUrl.includes('/new_player/') && !cleanUrl.includes('/embed/') && !cleanUrl.includes('/e/')) {
                try {
                    const extracted = await (0, videoExtractor_service_1.extractCleanEmbedFromWebPage)(cleanUrl);
                    if (extracted.cleanUrl) {
                        cleanUrl = extracted.cleanUrl;
                    }
                }
                catch (_) { }
            }
            await prisma.episode.upsert({
                where: {
                    animeId_episodeNumber: {
                        animeId: id,
                        episodeNumber: Number(ep.episodeNumber)
                    }
                },
                update: {
                    title: ep.title || `Episode ${ep.episodeNumber}`,
                    videoUrl: cleanUrl,
                    duration: ep.duration || '24 min',
                    status: cleanUrl ? 'AVAILABLE' : 'DRAFT'
                },
                create: {
                    animeId: id,
                    episodeNumber: Number(ep.episodeNumber),
                    title: ep.title || `Episode ${ep.episodeNumber}`,
                    videoUrl: cleanUrl,
                    duration: ep.duration || '24 min',
                    status: cleanUrl ? 'AVAILABLE' : 'DRAFT'
                }
            });
        }
        const allEpisodes = await prisma.episode.findMany({
            where: { animeId: id },
            orderBy: { episodeNumber: 'asc' }
        });
        const hasPlayable = allEpisodes.some((e) => e.videoUrl && e.videoUrl.trim().length > 0);
        await prisma.anime.update({
            where: { id },
            data: {
                totalEpisodes: allEpisodes.length,
                availabilityStatus: hasPlayable ? 'AVAILABLE' : anime.availabilityStatus
            }
        });
        return res.status(200).json({
            message: `Successfully saved ${allEpisodes.length} episodes for ${anime.title}`,
            episodes: allEpisodes
        });
    }
    catch (error) {
        console.error('Error updating anime episodes:', error);
        return res.status(500).json({ error: 'Failed to update anime episodes' });
    }
}
/**
 * Delete a specific episode of an anime
 */
async function deleteAnimeEpisode(req, res) {
    try {
        const { id, epNum } = req.params;
        const episodeNumber = parseInt(epNum);
        await prisma.episode.deleteMany({
            where: {
                animeId: id,
                episodeNumber
            }
        });
        const count = await prisma.episode.count({ where: { animeId: id } });
        await prisma.anime.update({
            where: { id },
            data: { totalEpisodes: count }
        });
        return res.status(200).json({ message: `Episode ${episodeNumber} deleted successfully` });
    }
    catch (error) {
        console.error('Error deleting episode:', error);
        return res.status(500).json({ error: 'Failed to delete episode' });
    }
}
/**
 * Inspect a URL and extract the clean video embed or direct stream
 */
async function extractVideo(req, res) {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        const result = await (0, videoExtractor_service_1.extractCleanEmbedFromWebPage)(url);
        return res.status(200).json(result);
    }
    catch (error) {
        console.error('Error extracting video:', error);
        return res.status(500).json({ error: 'Failed to extract video embed' });
    }
}
