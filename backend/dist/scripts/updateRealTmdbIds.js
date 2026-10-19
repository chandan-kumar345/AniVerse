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
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const https_1 = __importDefault(require("https"));
const prisma = new client_1.PrismaClient();
function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https_1.default.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                const redirectUrl = response.headers.location;
                if (!redirectUrl) {
                    reject(new Error('Redirect without location'));
                    return;
                }
                file.close();
                downloadFile(redirectUrl, dest).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                file.close();
                reject(new Error(`Failed to download: status ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}
function extractTmdbId(tmdbRaw, isMovie) {
    if (!tmdbRaw)
        return null;
    if (typeof tmdbRaw === 'number')
        return tmdbRaw;
    if (Array.isArray(tmdbRaw) && tmdbRaw.length > 0) {
        const first = tmdbRaw[0];
        return typeof first === 'number' ? first : extractTmdbId(first, isMovie);
    }
    if (typeof tmdbRaw === 'object') {
        let val = isMovie ? (tmdbRaw.movie ?? tmdbRaw.tv) : (tmdbRaw.tv ?? tmdbRaw.movie);
        if (!val)
            val = tmdbRaw.movie || tmdbRaw.tv;
        if (typeof val === 'number')
            return val;
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'number')
            return val[0];
    }
    return null;
}
const MANUAL_TMDB_MAP = {
    'dragon-ball-super': 62710,
    'dragon-ball-z': 12971,
    'dragon-ball': 12696,
    'classroom-of-the-elite-iii': 72636,
    'tower-of-god-season-2': 98978,
    'shangri-la-frontier-season-2': 205424,
    'clannad-after-story': 34509,
    'the-boy-and-the-heron': 508883,
    'my-hero-academia-youre-next': 1159311,
    'earwig-and-the-witch': 683340,
    'paprika': 4977,
    'a-whisker-away': 664574,
    'fatestay-night-heavens-feel-i-presage-flower': 399404,
    'fatestay-night-heavens-feel-ii-lost-butterfly': 514593,
    'fatestay-night-heavens-feel-iii-spring-song': 514594,
    'rascal-does-not-dream-of-a-sister-venturing-out': 1026859,
    'the-first-slam-dunk': 837881,
    'kurokos-basketball-the-movie-last-game': 440249,
    'free-the-final-stroke-the-second-volume': 855855,
    'psycho-pass-sinners-of-the-system-case1': 511679,
    'tekkonkinkreet': 13753,
    'detective-conan-the-phantom-of-baker-street': 44001,
    'detective-conan-the-bride-of-halloween': 913205,
    'detective-conan-black-iron-submarine': 1058694,
    'lupin-the-iiird-fujikos-lie': 593781,
    'lupin-iii-the-first': 595743,
    'stand-by-me-doraemon': 285087,
    'stand-by-me-doraemon-2': 638027,
    'shin-chan-fast-asleep-the-dreaming-world-big-assault': 400495,
    'shin-chan-invasion-alien-shiriri': 437651,
    'new-dimension-crayon-shin-chan-the-movie-battle-of-supernatural-powers': 1058693,
    'rezero-starting-life-in-another-world-memory-snow': 521876,
    'rezero-starting-life-in-another-world-the-frozen-bond': 595671,
    'seven-deadly-sins-the-movie-prisoners-of-the-sky': 505706,
    'the-seven-deadly-sins-cursed-by-light': 813258,
    'digimon-adventure-02-the-beginning': 1007826,
    'doukyuusei-classmates': 381691,
    'kizumonogatari-i-tekketsu-hen': 365851,
    'kizumonogatari-ii-nekketsu-hen': 408220,
    'kizumonogatari-iii-reiketsu-hen': 425667,
    'mobile-suit-gundam-cucuruz-doans-island': 892040,
    'blue-lock-season-2-series': 135898,
    'spy-x-family-code-white': 1062807,
    'blue-lock-season-2': 135898
};
async function main() {
    console.log('--- STARTING ACCURATE TMDB ID HYDRATION FOR ALL ANIME ---');
    const cacheDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }
    const cacheFile = path.join(cacheDir, 'anime-list-mini.json');
    if (!fs.existsSync(cacheFile) || fs.statSync(cacheFile).size < 10000) {
        console.log('Downloading authoritative Anime-to-TMDb crosswalk mapping database...');
        await downloadFile('https://raw.githubusercontent.com/Fribb/anime-lists/master/anime-list-mini.json', cacheFile);
        console.log('Mapping database downloaded successfully. Size:', (fs.statSync(cacheFile).size / 1024 / 1024).toFixed(2), 'MB');
    }
    else {
        console.log('Using cached authoritative Anime-to-TMDb mapping database.');
    }
    const rawData = fs.readFileSync(cacheFile, 'utf-8');
    const mappingList = JSON.parse(rawData);
    console.log(`Loaded ${mappingList.length} verified anime mappings.`);
    // Build high-speed lookup maps
    const malMap = new Map();
    const anilistMap = new Map();
    for (const item of mappingList) {
        if (item.mal_id)
            malMap.set(item.mal_id, item);
        if (item.anilist_id)
            anilistMap.set(item.anilist_id, item);
    }
    const allAnime = await prisma.anime.findMany();
    console.log(`Found ${allAnime.length} anime in AniVerse database.`);
    let updatedCount = 0;
    let notFoundCount = 0;
    for (const anime of allAnime) {
        let entry;
        if (anime.malId && malMap.has(anime.malId)) {
            entry = malMap.get(anime.malId);
        }
        else if (anime.anilistId && anilistMap.has(anime.anilistId)) {
            entry = anilistMap.get(anime.anilistId);
        }
        const isMovie = anime.contentType === 'movie' || anime.type?.toUpperCase() === 'MOVIE';
        let tmdbVal = entry ? extractTmdbId(entry.themoviedb_id, isMovie) : null;
        if (!tmdbVal && MANUAL_TMDB_MAP[anime.slug]) {
            tmdbVal = MANUAL_TMDB_MAP[anime.slug];
        }
        if (tmdbVal) {
            await prisma.anime.update({
                where: { id: anime.id },
                data: { tmdbId: tmdbVal }
            });
            updatedCount++;
        }
        else {
            notFoundCount++;
        }
    }
    const totalWithTmdb = await prisma.anime.count({
        where: { tmdbId: { not: null } }
    });
    console.log('--- TMDB ID HYDRATION COMPLETED ---');
    console.log(`Updated with verified TMDb IDs: ${updatedCount}`);
    console.log(`Total anime with verified TMDb ID in DB: ${totalWithTmdb} / ${allAnime.length} (${((totalWithTmdb / allAnime.length) * 100).toFixed(1)}%)`);
    console.log(`Unmapped count: ${notFoundCount}`);
    // Test Another
    const another = await prisma.anime.findFirst({ where: { slug: 'another' } });
    console.log('Verified Another Anime in DB:', {
        title: another?.title,
        slug: another?.slug,
        malId: another?.malId,
        tmdbId: another?.tmdbId
    });
    await prisma.$disconnect();
}
main().catch(async (e) => {
    console.error('Error during TMDB hydration:', e);
    await prisma.$disconnect();
    process.exit(1);
});
