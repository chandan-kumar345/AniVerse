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
const videoExtractor_service_1 = require("../services/videoExtractor.service");
const prisma = new client_1.PrismaClient();
function parseCSV(content) {
    const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0)
        return [];
    const results = [];
    const parseLine = (line) => {
        const match = line.match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g);
        if (!match)
            return [];
        return match.map((m) => {
            let val = m.startsWith(',') ? m.slice(1) : m;
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.slice(1, -1).replace(/""/g, '"');
            }
            return val.trim();
        });
    };
    const headers = parseLine(lines[0]).map((h) => h.toLowerCase());
    const hasHeader = headers.some((h) => h.includes('title'));
    const startIndex = hasHeader ? 1 : 0;
    // Identify column indices
    let titleIdx = 0;
    let posterIdx = 1;
    const epIndices = [];
    if (hasHeader) {
        titleIdx = headers.findIndex((h) => h.includes('title'));
        if (titleIdx === -1)
            titleIdx = 0;
        posterIdx = headers.findIndex((h) => h.includes('poster') || h.includes('image'));
        headers.forEach((h, idx) => {
            if (idx === titleIdx || idx === posterIdx)
                return;
            const match = h.match(/episode[_\s-]*(\d+)/i) || h.match(/ep[_\s-]*(\d+)/i);
            if (match) {
                epIndices.push({ idx, epNum: parseInt(match[1], 10) });
            }
            else if (h.includes('video') || h.includes('embed') || h.includes('url')) {
                epIndices.push({ idx, epNum: 1 });
            }
        });
    }
    else {
        // Default fallback: 0=title, 1=poster, 2=episode 1
        epIndices.push({ idx: 2, epNum: 1 });
    }
    for (let i = startIndex; i < lines.length; i++) {
        const parts = parseLine(lines[i]);
        if (parts.length === 0)
            continue;
        const title = parts[titleIdx] || '';
        const posterImage = posterIdx !== -1 ? (parts[posterIdx] || '') : '';
        const episodes = [];
        for (const epInfo of epIndices) {
            const rawUrl = parts[epInfo.idx];
            if (rawUrl && rawUrl.trim()) {
                const cleanUrl = (0, videoExtractor_service_1.cleanAndNormalizeVideoUrl)(rawUrl.trim());
                episodes.push({
                    episodeNumber: epInfo.epNum,
                    videoUrl: cleanUrl,
                });
            }
        }
        if (title) {
            results.push({ title, posterImage, episodes });
        }
    }
    return results;
}
async function main() {
    const rootCsvPath = path.join(__dirname, '..', '..', '..', 'anime_media_links.csv');
    const backendCsvPath = path.join(__dirname, '..', 'data', 'anime_media_links.csv');
    const csvPath = fs.existsSync(rootCsvPath) ? rootCsvPath : backendCsvPath;
    if (!fs.existsSync(csvPath)) {
        console.error(`[Error] CSV file not found at: ${csvPath}`);
        console.log('Please fill in anime_media_links.csv in your project root.');
        process.exit(1);
    }
    const rawData = fs.readFileSync(csvPath, 'utf8');
    const items = parseCSV(rawData);
    console.log(`=======================================================`);
    console.log(`AniVerse Multi-Episode CSV Media Importer`);
    console.log(`Found ${items.length} records in anime_media_links.csv`);
    console.log(`=======================================================\n`);
    let updatedCount = 0;
    let skippedCount = 0;
    for (const item of items) {
        if (!item.title) {
            skippedCount++;
            continue;
        }
        const anime = await prisma.anime.findFirst({
            where: {
                OR: [
                    { title: item.title },
                    { englishTitle: item.title }
                ]
            }
        });
        if (!anime) {
            console.warn(`[Not Found] Anime "${item.title}" not in database. Skipping.`);
            skippedCount++;
            continue;
        }
        const updateData = {};
        if (item.posterImage && item.posterImage.trim()) {
            updateData.posterImage = item.posterImage.trim();
        }
        if (Object.keys(updateData).length > 0) {
            await prisma.anime.update({
                where: { id: anime.id },
                data: updateData
            });
        }
        // Upsert all parsed episodes
        if (item.episodes && item.episodes.length > 0) {
            for (const ep of item.episodes) {
                await prisma.episode.upsert({
                    where: {
                        animeId_episodeNumber: {
                            animeId: anime.id,
                            episodeNumber: ep.episodeNumber
                        }
                    },
                    update: {
                        videoUrl: ep.videoUrl,
                        status: 'AVAILABLE'
                    },
                    create: {
                        animeId: anime.id,
                        episodeNumber: ep.episodeNumber,
                        title: `Episode ${ep.episodeNumber}`,
                        videoUrl: ep.videoUrl,
                        thumbnail: anime.posterImage,
                        status: 'AVAILABLE'
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
        const epLog = item.episodes.length > 0 ? `${item.episodes.length} Episodes Added` : 'No Episodes';
        console.log(`[OK] Updated: "${anime.title}" | Poster: ${item.posterImage ? 'YES' : 'NONE'} | ${epLog}`);
        updatedCount++;
    }
    console.log(`\n=======================================================`);
    console.log(`Import Complete!`);
    console.log(`Updated: ${updatedCount} | Skipped: ${skippedCount}`);
    console.log(`=======================================================`);
    await prisma.$disconnect();
}
main().catch(async (err) => {
    console.error('[Fatal Error]', err);
    await prisma.$disconnect();
    process.exit(1);
});
