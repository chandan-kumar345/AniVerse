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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
function generateSlug(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
async function main() {
    const dataFilePath = path.join(__dirname, '..', 'data', 'custom_18plus_anime.json');
    if (!fs.existsSync(dataFilePath)) {
        console.error(`[Error] Data file not found at: ${dataFilePath}`);
        console.log('Please create the file or add your anime objects to backend/src/data/custom_18plus_anime.json');
        process.exit(1);
    }
    let rawData = '';
    try {
        rawData = fs.readFileSync(dataFilePath, 'utf8');
    }
    catch (err) {
        console.error(`[Error] Failed to read ${dataFilePath}:`, err.message);
        process.exit(1);
    }
    let items = [];
    try {
        items = JSON.parse(rawData);
        if (!Array.isArray(items)) {
            throw new Error('Data file must contain a JSON array of anime objects');
        }
    }
    catch (err) {
        console.error(`[Error] Invalid JSON format in ${dataFilePath}:`, err.message);
        process.exit(1);
    }
    console.log(`=======================================================`);
    console.log(`AniVerse Custom 18+ Anime Importer`);
    console.log(`Found ${items.length} titles in custom_18plus_anime.json`);
    console.log(`=======================================================\n`);
    let createdCount = 0;
    let skippedCount = 0;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.title || !item.title.trim()) {
            console.warn(`[Skip #${i + 1}] Missing title. Skipping.`);
            skippedCount++;
            continue;
        }
        const title = item.title.trim();
        const slug = (item.slug && item.slug.trim()) || generateSlug(title);
        // Ensure genres string contains '18+'
        const rawGenres = item.genres ? item.genres.split(',').map((g) => g.trim()).filter(Boolean) : ['Mature'];
        if (!rawGenres.includes('18+')) {
            rawGenres.push('18+');
        }
        const finalGenres = rawGenres.join(', ');
        const contentType = item.contentType === 'movie' ? 'movie' : 'series';
        const type = item.type || (contentType === 'movie' ? 'Movie' : 'OVA');
        const rating = item.rating || '18+';
        const availabilityStatus = item.availabilityStatus || (item.episodes && item.episodes.length > 0 ? 'AVAILABLE' : 'MAPPING_PENDING');
        try {
            const existing = await prisma.anime.findUnique({ where: { slug } });
            // Determine posterImage safely to PERMANENTLY protect uploaded / custom posters
            let finalPoster;
            if (item.posterImage && item.posterImage.trim() && !item.posterImage.includes('unsplash')) {
                // Explicit non-placeholder poster provided in input
                finalPoster = item.posterImage.trim();
            }
            else if (existing?.posterImage && !existing.posterImage.includes('unsplash')) {
                // Keep existing custom / uploaded poster permanently!
                finalPoster = existing.posterImage;
            }
            else if (existing?.posterImage) {
                finalPoster = existing.posterImage;
            }
            else {
                finalPoster = item.posterImage || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';
            }
            const finalBanner = (item.bannerImage && item.bannerImage.trim()) || existing?.bannerImage || null;
            const anime = await prisma.anime.upsert({
                where: { slug },
                update: {
                    title,
                    englishTitle: item.englishTitle || null,
                    japaneseTitle: item.japaneseTitle || null,
                    contentType,
                    type,
                    genres: finalGenres,
                    rating,
                    score: item.score ?? 7.0,
                    status: item.status || 'Finished Airing',
                    releasedYear: item.releasedYear || new Date().getFullYear(),
                    duration: item.duration || (contentType === 'movie' ? '90 min' : '25 min'),
                    description: item.description || `Mature anime release: ${title}.`,
                    posterImage: finalPoster,
                    bannerImage: finalBanner,
                    availabilityStatus,
                    hasSub: item.hasSub !== false,
                    hasDub: Boolean(item.hasDub),
                    hasHindi: Boolean(item.hasHindi),
                },
                create: {
                    title,
                    englishTitle: item.englishTitle || null,
                    japaneseTitle: item.japaneseTitle || null,
                    slug,
                    contentType,
                    type,
                    genres: finalGenres,
                    rating,
                    score: item.score ?? 7.0,
                    status: item.status || 'Finished Airing',
                    releasedYear: item.releasedYear || new Date().getFullYear(),
                    duration: item.duration || (contentType === 'movie' ? '90 min' : '25 min'),
                    description: item.description || `Mature anime release: ${title}.`,
                    posterImage: finalPoster,
                    bannerImage: finalBanner,
                    availabilityStatus,
                    hasSub: item.hasSub !== false,
                    hasDub: Boolean(item.hasDub),
                    hasHindi: Boolean(item.hasHindi),
                },
            });
            // Import episodes if provided
            if (item.episodes && Array.isArray(item.episodes) && item.episodes.length > 0) {
                for (const ep of item.episodes) {
                    if (!ep.videoUrl)
                        continue;
                    const epNum = Number(ep.episodeNumber) || 1;
                    await prisma.episode.upsert({
                        where: {
                            animeId_episodeNumber: {
                                animeId: anime.id,
                                episodeNumber: epNum,
                            },
                        },
                        update: {
                            title: ep.title || `Episode ${epNum}`,
                            videoUrl: ep.videoUrl,
                            thumbnail: ep.thumbnail || anime.posterImage,
                            duration: ep.duration || anime.duration,
                            status: 'AVAILABLE',
                        },
                        create: {
                            animeId: anime.id,
                            episodeNumber: epNum,
                            title: ep.title || `Episode ${epNum}`,
                            videoUrl: ep.videoUrl,
                            thumbnail: ep.thumbnail || anime.posterImage,
                            duration: ep.duration || anime.duration,
                            status: 'AVAILABLE',
                        },
                    });
                }
            }
            if (item.videoUrl && item.videoUrl.trim()) {
                await prisma.episode.upsert({
                    where: {
                        animeId_episodeNumber: {
                            animeId: anime.id,
                            episodeNumber: 1,
                        },
                    },
                    update: {
                        videoUrl: item.videoUrl.trim(),
                        status: 'AVAILABLE',
                    },
                    create: {
                        animeId: anime.id,
                        episodeNumber: 1,
                        title: 'Episode 1',
                        videoUrl: item.videoUrl.trim(),
                        thumbnail: anime.posterImage,
                        status: 'AVAILABLE',
                    },
                });
                await prisma.anime.update({
                    where: { id: anime.id },
                    data: { availabilityStatus: 'AVAILABLE' },
                });
            }
            console.log(`[OK] Imported: "${title}" (slug: ${slug}) -> Genres: [${finalGenres}]`);
            createdCount++;
        }
        catch (err) {
            console.error(`[Error] Failed to upsert "${title}":`, err.message);
            skippedCount++;
        }
    }
    console.log(`\n=======================================================`);
    console.log(`Import Finished!`);
    console.log(`Processed: ${createdCount} | Skipped: ${skippedCount}`);
    console.log(`=======================================================`);
    await prisma.$disconnect();
}
main().catch(async (e) => {
    console.error('[Fatal Error]', e);
    await prisma.$disconnect();
    process.exit(1);
});
