"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUB_ONLY_SLUGS = exports.SUB_ONLY_MAL_IDS = exports.ANIWAVE_SLUG_MAP = exports.HINDI_KEYWORD_REGEX = exports.HINDI_DUBBED_MAL_IDS = void 0;
exports.checkIfAnimeHasHindi = checkIfAnimeHasHindi;
exports.checkIfAnimeHasDub = checkIfAnimeHasDub;
exports.getAllAnime = getAllAnime;
exports.getTrendingAnime = getTrendingAnime;
exports.getPopularAnime = getPopularAnime;
exports.getTopTenAnime = getTopTenAnime;
exports.getAnimeDetail = getAnimeDetail;
exports.getEpisodeDetail = getEpisodeDetail;
exports.getAutocompleteSuggestions = getAutocompleteSuggestions;
exports.getAllGenres = getAllGenres;
exports.getEpisodeSources = getEpisodeSources;
exports.downloadEpisode = downloadEpisode;
exports.downloadFileProxy = downloadFileProxy;
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const videoExtractor_service_1 = require("../services/videoExtractor.service");
const prisma = new client_1.PrismaClient();
exports.HINDI_DUBBED_MAL_IDS = new Set([
    51009, 40748, 48561, // JJK S2, S1, Movie 0
    38000, 47778, 49776, 51019, 55701, 40456, // Demon Slayer
    52299, 58567, // Solo Leveling S1, S2
    44511, // Chainsaw Man
    31964, 35247, 36456, 38408, 41587, 49918, 55894, // MHA
    12971, 62710, 36946, 48903, 14837, 25389, // Dragon Ball
    20, 1735, 34566, // Naruto
    21, 50410, // One Piece
    1535, // Death Note
    52588, 54492, 59489, // Kaiju No. 8
    50265, 53887, // Spy x Family
    49596, 54865, // Blue Lock
    34572, // Black Clover
    30984, 45576, 53998, 56206, // Bleach
    50594, 38826, 32281, // Suzume, Weathering With You, Your Name
    57334, // Dandadan
    54900, // Wind Breaker
    38691, 40852, 48549, 55358, // Dr. Stone
    37430, 39551, 53580, // Slime
    52742, // Haikyu!!
]);
exports.HINDI_KEYWORD_REGEX = /\b(jujutsu|demon slayer|kimetsu|solo leveling|chainsaw man|my hero academia|boku no hero|dragon ball|naruto|boruto|one piece|death note|kaiju|spy x family|blue lock|black clover|bleach|suzume|weathering with you|your name|dandadan|dan da dan|wind breaker|dr\.?\s*stone|slime)\b/i;
exports.ANIWAVE_SLUG_MAP = {
    'solo-leveling': 'ore-dake-level-up-na-ken-76040',
    'solo-leveling-season-2': 'ore-dake-level-up-na-ken-season-2-arise-from-the-shadow-82064',
    'jujutsu-kaisen': 'jujutsu-kaisen-tv-534',
    'jujutsu-kaisen-season-2': 'jujutsu-kaisen-2nd-season-80674',
    'demon-slayer': 'kimetsu-no-yaiba-47',
    'demon-slayer-kimetsu-no-yaiba': 'kimetsu-no-yaiba-47',
    'attack-on-titan': 'shingeki-no-kyojin-4',
    'shingeki-no-kyojin': 'shingeki-no-kyojin-4',
    'one-piece': 'one-piece-100',
    'naruto': 'naruto-677',
    'naruto-shippuden': 'naruto-shippuuden-676',
    'bleach': 'bleach-140',
    'bleach-thousand-year-blood-war': 'bleach-sennen-kessen-hen-80126',
    'chainsaw-man': 'chainsaw-man-80327',
    'my-hero-academia': 'boku-no-hero-academia-38',
    'boku-no-hero-academia': 'boku-no-hero-academia-38',
    'death-note': 'death-note-60',
    'hunter-x-hunter': 'hunter-x-hunter-2011-82',
    'frieren-beyond-journeys-end': 'sousou-no-frieren-81338',
    'sousou-no-frieren': 'sousou-no-frieren-81338',
    'blue-lock': 'blue-lock-80414',
    'blue-lock-season-2': 'blue-lock-vs-u-20-japan-82084',
    'dandadan': 'dandadan-82411',
    'kaiju-no-8': 'kaijuu-8-gou-81822',
    'kaiju-8': 'kaijuu-8-gou-81822',
    'wind-breaker': 'wind-breaker-81781',
    'tower-of-god': 'kami-no-tou-1111',
    'dr-stone': 'dr-stone-103',
    'vinland-saga': 'vinland-saga-104',
    'tokyo-ghoul': 'tokyo-ghoul-76',
    'spy-x-family': 'spy-x-family-80108',
    'grand-blue-dreaming': 'grand-blue-802',
    'grand-blue': 'grand-blue-802',
    'aoashi': 'ao-ashi-80164',
    'ao-ashi': 'ao-ashi-80164',
    'aoashi-season-2': 'ao-ashi-80164',
    'im-dating-a-dark-summoner': 'im-dating-a-dark-summoner',
    'dark-summoner-to-dekiteiru': 'dark-summoner-to-dekiteiru'
};
function checkIfAnimeHasHindi(anime) {
    if (!anime)
        return false;
    if (anime.malId && exports.HINDI_DUBBED_MAL_IDS.has(anime.malId))
        return true;
    if (anime.title && exports.HINDI_KEYWORD_REGEX.test(anime.title))
        return true;
    if (anime.slug && exports.HINDI_KEYWORD_REGEX.test(anime.slug))
        return true;
    return false;
}
exports.SUB_ONLY_MAL_IDS = new Set([
    61578, // Even the Student Council Has Its Holes!
    63509, // I'm Dating a Dark Summoner
]);
exports.SUB_ONLY_SLUGS = new Set([
    'even-the-student-council-has-its-holes',
    'im-dating-a-dark-summoner',
    'dark-summoner-to-dekiteiru',
]);
function checkIfAnimeHasDub(anime) {
    if (!anime)
        return false;
    if (anime.hasDub === false)
        return false;
    // 18+ and Mature titles are strictly Japanese Sub only (no licensed English dub)
    const isMature = anime.rating === '18+' ||
        anime.rating === 'Rx' ||
        anime.rating === 'R+' ||
        Boolean(anime.genres && (anime.genres.includes('18+') ||
            /hentai|mature/i.test(anime.genres)));
    if (isMature)
        return false;
    if (anime.malId && exports.SUB_ONLY_MAL_IDS.has(anime.malId))
        return false;
    if (anime.slug && exports.SUB_ONLY_SLUGS.has(anime.slug))
        return false;
    return Boolean(anime.hasDub ?? true);
}
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}
async function autoHealMalId(animeId, title) {
    try {
        console.log(`[Auto-Heal] malId is null for "${title}". Attempting to fetch from AniList...`);
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: `
          query ($search: String) {
            Media(search: $search, type: ANIME) {
              idMal
            }
          }
        `,
                variables: { search: title }
            })
        });
        if (!response.ok)
            return null;
        const resData = await response.json();
        const idMal = resData?.data?.Media?.idMal;
        if (idMal) {
            console.log(`[Auto-Heal] Resolved malId ${idMal} for "${title}". Updating database...`);
            await prisma.anime.update({
                where: { id: animeId },
                data: { malId: idMal }
            });
            return idMal;
        }
        return null;
    }
    catch (err) {
        console.error(`[Auto-Heal] Failed to resolve malId for "${title}":`, err);
        return null;
    }
}
async function fetchSeasonsFromAniList(searchKey) {
    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: `
          query ($search: String) {
            Page(page: 1, perPage: 15) {
              media(search: $search, type: ANIME) {
                idMal
                title {
                  romaji
                  english
                  native
                }
                format
                status
                startDate {
                  year
                }
              }
            }
          }
        `,
                variables: { search: searchKey }
            })
        });
        if (!response.ok)
            return [];
        const data = await response.json();
        const mediaList = data?.data?.Page?.media || [];
        return mediaList;
    }
    catch (err) {
        console.error('Error fetching seasons from AniList:', err);
        return [];
    }
}
async function findOrCreateAnimeBySlugOrId(idOrSlug) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    let anime = await prisma.anime.findUnique({
        where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
        include: {
            episodes: {
                orderBy: { episodeNumber: 'asc' },
            },
        },
    });
    if (anime) {
        // AUTO-HEAL: If malId is null, fetch and save it on-demand!
        if (!anime.malId) {
            const idMal = await autoHealMalId(anime.id, anime.title);
            if (idMal) {
                anime.malId = idMal;
            }
        }
        return anime;
    }
    // If not found and it's not a UUID, let's try to query AniList using the slug
    if (isUuid)
        return null;
    try {
        const searchQuery = idOrSlug.replace(/-/g, ' ');
        console.log(`Anime "${idOrSlug}" not found locally. Attempting to fetch from AniList via search query: "${searchQuery}"...`);
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: `
          query ($search: String) {
            Page(page: 1, perPage: 1) {
              media(search: $search, type: ANIME, sort: [POPULARITY_DESC]) {
                idMal
                title {
                  romaji
                  english
                  native
                }
                description
                bannerImage
                coverImage {
                  extraLarge
                  large
                }
                averageScore
                format
                status
                startDate {
                  year
                }
                genres
                duration
                studios(isMain: true) {
                  nodes {
                    name
                  }
                }
              }
            }
          }
        `,
                variables: { search: searchQuery }
            })
        });
        if (!response.ok) {
            console.error(`AniList search for "${searchQuery}" failed:`, response.statusText);
            return null;
        }
        const resData = (await response.json());
        const media = resData?.data?.Page?.media?.[0] || resData?.data?.Media;
        if (!media) {
            console.log(`AniList returned no media for search: "${searchQuery}"`);
            return null;
        }
        const animeTitle = media.title.english || media.title.romaji || media.title.native;
        const resolvedSlug = idOrSlug || slugify(animeTitle);
        // Double check if resolvedSlug or malId exists in DB to prevent duplicates
        let existingAnime = await prisma.anime.findFirst({
            where: {
                OR: [
                    { slug: resolvedSlug },
                    { slug: slugify(animeTitle) },
                    ...(media.idMal ? [{ malId: media.idMal }] : [])
                ]
            },
            include: { episodes: { orderBy: { episodeNumber: 'asc' } } }
        });
        if (existingAnime) {
            return existingAnime;
        }
        const cleanedDescription = media.description ? media.description.replace(/<[^>]*>/g, '') : 'No description available.';
        let status = 'Finished Airing';
        if (media.status === 'RELEASING') {
            status = 'Currently Airing';
        }
        else if (media.status === 'NOT_YET_RELEASED') {
            status = 'Not Yet Aired';
        }
        const score = media.averageScore ? media.averageScore / 10 : 7.5;
        const type = media.format || 'TV';
        const studio = media.studios?.nodes?.[0]?.name || 'Unknown';
        const genres = media.genres ? media.genres.join(', ') : 'Action';
        const releasedYear = media.startDate?.year || new Date().getFullYear();
        const duration = media.duration ? `${media.duration} min` : '24 min';
        console.log(`Dynamically importing anime "${animeTitle}" to database with slug "${resolvedSlug}"`);
        // Create the anime
        const newAnime = await prisma.anime.create({
            data: {
                malId: media.idMal,
                slug: resolvedSlug,
                title: animeTitle,
                englishTitle: media.title.english || null,
                description: cleanedDescription,
                bannerImage: media.bannerImage || media.coverImage?.extraLarge || media.coverImage?.large,
                posterImage: media.coverImage?.extraLarge || media.coverImage?.large,
                rating: 'PG-13',
                score,
                type,
                studio,
                status,
                releasedYear,
                duration,
                genres,
                isTrending: false,
                isPopular: false
            }
        });
        // Determine how many episodes to seed
        const targetEpCount = await getDynamicEpisodeCount(newAnime.title, newAnime.malId, 12, newAnime.type);
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
        const episodeData = [];
        for (let i = 1; i <= targetEpCount; i++) {
            const videoUrl = sampleVideos[(i - 1 + newAnime.title.length) % sampleVideos.length];
            episodeData.push({
                animeId: newAnime.id,
                episodeNumber: i,
                title: `Episode ${i}`,
                videoUrl,
                thumbnail: newAnime.bannerImage || newAnime.posterImage,
                duration: '24 min'
            });
        }
        await prisma.episode.createMany({
            data: episodeData
        });
        // Return the newly created anime with episodes
        const createdAnime = await prisma.anime.findUnique({
            where: { id: newAnime.id },
            include: {
                episodes: {
                    orderBy: { episodeNumber: 'asc' },
                },
            },
        });
        return createdAnime;
    }
    catch (err) {
        console.error(`Failed to dynamically fetch/create anime with slug "${idOrSlug}":`, err);
        return null;
    }
}
async function searchAndImportFromAniList(searchQuery) {
    try {
        console.log(`No local results found for "${searchQuery}". Querying AniList for dynamic import...`);
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: `
          query ($search: String) {
            Page(page: 1, perPage: 1) {
              media(search: $search, type: ANIME, sort: [POPULARITY_DESC]) {
                idMal
                title {
                  romaji
                  english
                  native
                }
                description
                bannerImage
                coverImage {
                  extraLarge
                  large
                }
                averageScore
                format
                status
                startDate {
                  year
                }
                genres
                duration
                studios(isMain: true) {
                  nodes {
                    name
                  }
                }
              }
            }
          }
        `,
                variables: { search: searchQuery }
            })
        });
        if (!response.ok) {
            console.error(`AniList search for "${searchQuery}" failed:`, response.statusText);
            return null;
        }
        const resData = (await response.json());
        const media = resData?.data?.Page?.media?.[0] || resData?.data?.Media;
        if (!media) {
            console.log(`AniList returned no media for search: "${searchQuery}"`);
            return null;
        }
        const animeTitle = media.title.english || media.title.romaji || media.title.native;
        const resolvedSlug = slugify(animeTitle);
        // Double check if resolvedSlug or malId exists in DB to prevent duplicates
        let existingAnime = await prisma.anime.findFirst({
            where: {
                OR: [
                    { slug: resolvedSlug },
                    ...(media.idMal ? [{ malId: media.idMal }] : [])
                ]
            }
        });
        if (existingAnime) {
            return existingAnime;
        }
        const cleanedDescription = media.description ? media.description.replace(/<[^>]*>/g, '') : 'No description available.';
        let status = 'Finished Airing';
        if (media.status === 'RELEASING') {
            status = 'Currently Airing';
        }
        else if (media.status === 'NOT_YET_RELEASED') {
            status = 'Not Yet Aired';
        }
        const score = media.averageScore ? media.averageScore / 10 : 7.5;
        const type = media.format || 'TV';
        const studio = media.studios?.nodes?.[0]?.name || 'Unknown';
        const genres = media.genres ? media.genres.join(', ') : 'Action';
        const releasedYear = media.startDate?.year || new Date().getFullYear();
        const duration = media.duration ? `${media.duration} min` : '24 min';
        console.log(`Dynamically importing anime "${animeTitle}" to database with slug "${resolvedSlug}"`);
        // Create the anime
        const newAnime = await prisma.anime.create({
            data: {
                malId: media.idMal,
                slug: resolvedSlug,
                title: animeTitle,
                englishTitle: media.title.english || null,
                description: cleanedDescription,
                bannerImage: media.bannerImage || media.coverImage?.extraLarge || media.coverImage?.large,
                posterImage: media.coverImage?.extraLarge || media.coverImage?.large,
                rating: 'PG-13',
                score,
                type,
                studio,
                status,
                releasedYear,
                duration,
                genres,
                isTrending: false,
                isPopular: false
            }
        });
        // Determine how many episodes to seed
        const targetEpCount = await getDynamicEpisodeCount(newAnime.title, newAnime.malId, 12, newAnime.type);
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
        const episodeData = [];
        for (let i = 1; i <= targetEpCount; i++) {
            const videoUrl = sampleVideos[(i - 1 + newAnime.title.length) % sampleVideos.length];
            episodeData.push({
                animeId: newAnime.id,
                episodeNumber: i,
                title: `Episode ${i}`,
                videoUrl,
                thumbnail: newAnime.bannerImage || newAnime.posterImage,
                duration: '24 min'
            });
        }
        await prisma.episode.createMany({
            data: episodeData
        });
        return newAnime;
    }
    catch (err) {
        console.error(`Failed to dynamically fetch/create anime with search query "${searchQuery}":`, err);
        return null;
    }
}
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
        if (media.episodes) {
            return media.episodes;
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
const EPISODE_COUNT_CACHE = new Map();
const KNOWN_EPISODE_COUNTS = {
    19: 74, // Monster
    269: 366, // Bleach
    41467: 13, // Bleach: Thousand-Year Blood War
    53998: 13, // Bleach TYBW Part 2
    57495: 13, // Bleach TYBW Part 3
    20: 220, // Naruto
    1735: 500, // Naruto Shippuden
    34566: 293, // Boruto: Naruto Next Generations
    11061: 148, // Hunter x Hunter (2011)
    136: 62, // Hunter x Hunter (1999)
    5114: 64, // Fullmetal Alchemist: Brotherhood
    121: 51, // Fullmetal Alchemist (2003)
    1535: 37, // Death Note
    16498: 25, // Attack on Titan Season 1
    25777: 12, // Attack on Titan Season 2
    35760: 22, // Attack on Titan Season 3
    40028: 16, // Attack on Titan Final Season Part 1
    48583: 12, // Attack on Titan Final Season Part 2
    1575: 25, // Code Geass R1
    2904: 25, // Code Geass R2
    9253: 24, // Steins;Gate
    30484: 23, // Steins;Gate 0
    1: 26, // Cowboy Bebop
    37521: 24, // Vinland Saga Season 1
    49387: 24, // Vinland Saga Season 2
    33: 25, // Berserk (1997)
    32379: 12, // Berserk (2016)
    34055: 12, // Berserk (2017)
    31339: 12, // Drifters
    30: 26, // Neon Genesis Evangelion
    245: 43, // Great Teacher Onizuka
    877: 47, // Nana
    777: 10, // Hellsing Ultimate
    42310: 10, // Cyberpunk: Edgerunners
    44511: 12, // Chainsaw Man
    40748: 24, // Jujutsu Kaisen Season 1
    51009: 23, // Jujutsu Kaisen Season 2
    38000: 26, // Demon Slayer Season 1
    47778: 11, // Demon Slayer: Entertainment District
    51019: 11, // Demon Slayer: Swordsmith Village
    55701: 8, // Demon Slayer: Hashira Training
    31964: 13, // My Hero Academia Season 1
    33486: 25, // My Hero Academia Season 2
    36456: 25, // My Hero Academia Season 3
    38408: 25, // My Hero Academia Season 4
    41587: 25, // My Hero Academia Season 5
    49918: 25, // My Hero Academia Season 6
    53580: 21, // My Hero Academia Season 7
    20583: 25, // Haikyuu!! Season 1
    28891: 25, // Haikyuu!! Season 2
    32935: 10, // Haikyuu!! Season 3
    38883: 25, // Haikyuu!! Season 4
    32182: 12, // Mob Psycho 100
    37510: 13, // Mob Psycho 100 II
    50172: 12, // Mob Psycho 100 III
    30276: 12, // One Punch Man
    34134: 12, // One Punch Man Season 2
    22319: 12, // Tokyo Ghoul
    27899: 12, // Tokyo Ghoul Root A
    36511: 12, // Tokyo Ghoul:re
    37806: 12, // Tokyo Ghoul:re 2nd
    22535: 24, // Parasyte -the maxim-
    13601: 22, // Psycho-Pass
    31043: 12, // Erased
    4224: 25, // Toradora!
    23273: 22, // Your Lie in April
    2167: 23, // Clannad
    4181: 24, // Clannad: After Story
    33352: 13, // Violet Evergarden
    29803: 13, // Overlord
    31240: 25, // Re:Zero
    11757: 25, // Sword Art Online
    30831: 10, // KonoSuba
    48316: 20, // The Eminence in Shadow
    39535: 11, // Mushoku Tensei
    52991: 28, // Frieren: Beyond Journey's End
    52299: 12, // Solo Leveling
    52588: 12, // Kaiju No. 8
    57334: 12, // Dandadan
    49596: 24, // Blue Lock
    38671: 12, // Dr. Stone
    34572: 170, // Black Clover
    12696: 153, // Dragon Ball
    813: 291, // Dragon Ball Z
    30694: 131, // Dragon Ball Super
    223: 64, // Dragon Ball GT
    6702: 175, // Fairy Tail
    918: 201, // Gintama
    14719: 26, // JoJo Season 1
    20899: 48, // JoJo Stardust Crusaders
    31478: 39, // JoJo Diamond is Unbreakable
    37991: 39, // JoJo Golden Wind
    48661: 38, // JoJo Stone Ocean
    39551: 24, // Slime Isekai Season 2
    34599: 12, // Made in Abyss
    37105: 12, // Grand Blue Dreaming
    49052: 24, // Aoashi Season 1
    61603: 12, // Aoashi Season 2
    63509: 12 // I'm Dating a Dark Summoner
};
async function getDynamicEpisodeCount(title, malId, dbCount, type) {
    if (type && (type.toUpperCase() === 'MOVIE' || type.toUpperCase() === 'SPECIAL')) {
        return 1;
    }
    const titleLower = title.toLowerCase().trim();
    if (titleLower.includes('movie') || titleLower.includes('film') || titleLower.includes('gekijouban')) {
        return 1;
    }
    // 1. Check in-memory cache first
    if (malId && EPISODE_COUNT_CACHE.has(malId)) {
        return EPISODE_COUNT_CACHE.get(malId);
    }
    if (EPISODE_COUNT_CACHE.has(titleLower)) {
        return EPISODE_COUNT_CACHE.get(titleLower);
    }
    // 2. Exact check in known completed series dictionary
    if (malId && KNOWN_EPISODE_COUNTS[malId]) {
        EPISODE_COUNT_CACHE.set(malId, KNOWN_EPISODE_COUNTS[malId]);
        return KNOWN_EPISODE_COUNTS[malId];
    }
    // 3. Fetch exact aired count from AniList if malId exists
    if (malId) {
        const aniListCount = await getAiredEpisodeCountFromAniList(malId);
        if (aniListCount !== null && aniListCount > 0) {
            EPISODE_COUNT_CACHE.set(malId, aniListCount);
            return aniListCount;
        }
    }
    // 4. Mathematical fallbacks for ongoing franchises
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
    // 5. Popular title name matches
    if (titleLower === 'monster' || titleLower.startsWith('monster ('))
        return 74;
    if (titleLower.includes('drifters'))
        return 12;
    if (titleLower === 'naruto shippuden')
        return 500;
    if (titleLower === 'naruto')
        return 220;
    if (titleLower.includes('boruto'))
        return 293;
    if (titleLower === 'bleach')
        return 366;
    if (titleLower.includes('hunter x hunter'))
        return 148;
    if (titleLower.includes('fullmetal alchemist'))
        return 64;
    if (titleLower.includes('death note'))
        return 37;
    if (titleLower.includes('code geass'))
        return 25;
    if (titleLower.includes('cowboy bebop'))
        return 26;
    if (titleLower.includes('steins;gate') || titleLower.includes('steins gate'))
        return 24;
    if (titleLower.includes('vinland saga'))
        return 24;
    if (titleLower.includes('berserk'))
        return 25;
    if (titleLower.includes('jojos bizarre adventure') || titleLower.includes("jojo's bizarre adventure"))
        return 26;
    if (titleLower.includes('black clover'))
        return 170;
    if (titleLower.includes('fairy tail'))
        return 175;
    if (titleLower.includes('gintama'))
        return 201;
    // 6. If this anime has more than 1 episode in the database, respect that count
    if (dbCount > 1) {
        return dbCount;
    }
    // 7. Standard anime season fallback (at least 12 episodes for TV series, never just 1!)
    return 12;
}
async function getAllAnime(req, res) {
    try {
        const { search, genre, type, contentType, status, year, limit, page, letter, sort, hasDub, hasHindi, availabilityStatus } = req.query;
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 20;
        const skip = (pageNumber - 1) * limitNumber;
        const where = {};
        const andConditions = [];
        if (search) {
            andConditions.push({
                OR: [
                    { title: { contains: search } },
                    { englishTitle: { contains: search } },
                ]
            });
        }
        if (genre) {
            const g = genre.trim();
            if (g === '18+' || g === '18%2B' || g.toLowerCase() === '18+' || g.toLowerCase() === 'mature') {
                andConditions.push({
                    OR: [
                        { genres: { contains: '18+' } },
                        { rating: '18+' },
                        { genres: { contains: 'Ecchi' } }
                    ]
                });
            }
            else {
                where.genres = { contains: g };
            }
        }
        if (type) {
            const t = type.trim().toLowerCase();
            if (t === 'movie') {
                andConditions.push({
                    OR: [
                        { type: 'Movie' },
                        { type: 'MOVIE' },
                        { type: 'movie' },
                        { contentType: 'movie' }
                    ]
                });
            }
            else if (t === 'tv') {
                andConditions.push({
                    OR: [
                        { type: 'TV' },
                        { type: 'tv' },
                        { type: 'Tv' },
                        { contentType: 'series' }
                    ]
                });
            }
            else {
                andConditions.push({
                    OR: [
                        { type: type.toUpperCase() },
                        { type: type }
                    ]
                });
            }
        }
        if (contentType) {
            const ct = contentType.toLowerCase();
            if (ct === 'movie') {
                andConditions.push({
                    OR: [
                        { contentType: 'movie' },
                        { type: 'Movie' },
                        { type: 'MOVIE' },
                        { type: 'movie' }
                    ]
                });
            }
            else if (ct === 'series') {
                andConditions.push({
                    OR: [
                        { contentType: 'series' },
                        { type: { in: ['TV', 'OVA', 'ONA', 'Special', 'tv', 'Tv'] } }
                    ]
                });
            }
        }
        if (hasDub !== undefined && (hasDub === 'true' || hasDub === 'false')) {
            where.hasDub = hasDub === 'true';
        }
        if (hasHindi !== undefined && (hasHindi === 'true' || hasHindi === 'false')) {
            where.hasHindi = hasHindi === 'true';
        }
        if (availabilityStatus) {
            where.availabilityStatus = availabilityStatus;
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
                andConditions.push({
                    OR: [
                        { title: { lte: '9', gte: '0' } }
                    ]
                });
            }
            else {
                andConditions.push({
                    OR: [
                        { title: { startsWith: char } },
                        { englishTitle: { startsWith: char } },
                    ]
                });
            }
        }
        if (andConditions.length > 0) {
            where.AND = andConditions;
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
        let [animeList, total] = await prisma.$transaction([
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
        if (total === 0 && search && typeof search === 'string') {
            const importedAnime = await searchAndImportFromAniList(search);
            if (importedAnime) {
                // Re-run the query so we fetch the newly imported anime
                [animeList, total] = await prisma.$transaction([
                    prisma.anime.findMany({
                        where: {
                            OR: [
                                { title: { contains: search } },
                                { englishTitle: { contains: search } },
                            ],
                        },
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
                    prisma.anime.count({
                        where: {
                            OR: [
                                { title: { contains: search } },
                                { englishTitle: { contains: search } },
                            ],
                        },
                    }),
                ]);
            }
        }
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
        const anime = await findOrCreateAnimeBySlugOrId(id);
        if (!anime) {
            return res.status(404).json({ error: 'Anime not found' });
        }
        const targetEpCount = await getDynamicEpisodeCount(anime.title, anime.malId, anime.episodes.length, anime.type);
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
            const existingEpNums = new Set(anime.episodes.map((e) => e.episodeNumber));
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
            const animeHasDub = checkIfAnimeHasDub(anime);
            const episodesWithDub = newEpisodes.map(ep => {
                let epHasDub = animeHasDub;
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
        else {
            const isAiring = anime.status === 'Currently Airing';
            const animeHasDub = checkIfAnimeHasDub(anime);
            const episodesWithDub = anime.episodes.map((ep) => {
                let epHasDub = animeHasDub;
                if (isAiring && ep.episodeNumber >= targetEpCount - 1) {
                    epHasDub = false;
                }
                return {
                    ...ep,
                    hasDub: epHasDub
                };
            });
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
            // 1. Fetch seasons from local database
            const localSiblings = await prisma.anime.findMany({
                where: {
                    OR: [
                        { title: { contains: seasonSearchKey } },
                        { englishTitle: { contains: seasonSearchKey } }
                    ]
                },
                select: { id: true, title: true, slug: true, releasedYear: true, type: true, malId: true }
            });
            // 2. Fetch seasons from AniList to include any not imported yet
            const externalMedia = await fetchSeasonsFromAniList(seasonSearchKey);
            // Combine them, avoiding duplicates by MAL ID or Slug
            const seasonsMap = new Map();
            // Load local siblings first
            for (const sib of localSiblings) {
                seasonsMap.set(sib.slug, {
                    title: sib.title,
                    slug: sib.slug,
                    releasedYear: sib.releasedYear,
                    type: sib.type,
                    malId: sib.malId
                });
            }
            // Add external siblings if they contain the search key and are not duplicates
            const searchKeyLower = seasonSearchKey.toLowerCase();
            for (const ext of externalMedia) {
                const titleText = ext.title.english || ext.title.romaji || ext.title.native || '';
                const titleTextLower = titleText.toLowerCase();
                // Ensure title matches our franchise keyword
                if (titleTextLower.includes(searchKeyLower)) {
                    const generatedSlug = slugify(titleText);
                    // Check if already in map by generated slug or malId
                    const alreadyExists = Array.from(seasonsMap.values()).some((s) => s.slug === generatedSlug || (s.malId && ext.idMal && s.malId === ext.idMal));
                    if (!alreadyExists) {
                        seasonsMap.set(generatedSlug, {
                            title: titleText,
                            slug: generatedSlug,
                            releasedYear: ext.startDate?.year || new Date().getFullYear(),
                            type: ext.format || 'TV',
                            malId: ext.idMal
                        });
                    }
                }
            }
            // Convert to array
            const combinedSiblings = Array.from(seasonsMap.values());
            if (combinedSiblings.length > 0) {
                // Sort chronologically by release year
                combinedSiblings.sort((a, b) => (a.releasedYear || 0) - (b.releasedYear || 0));
                seasons = combinedSiblings.map((sibling, index) => {
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
        const hasHindi = checkIfAnimeHasHindi(anime);
        const hasDub = checkIfAnimeHasDub(anime);
        const hasSub = anime.hasSub !== false;
        const availableAudios = [];
        if (hasSub)
            availableAudios.push('sub');
        if (hasDub)
            availableAudios.push('dub');
        if (hasHindi)
            availableAudios.push('hindi');
        return res.status(200).json({
            anime: {
                ...anime,
                hasHindi,
                hasDub,
                hasSub,
                isMultiAudio: availableAudios.length > 1,
                availableAudios
            },
            related,
            seasons
        });
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
        const anime = await findOrCreateAnimeBySlugOrId(id);
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
        const targetEpCount = await getDynamicEpisodeCount(anime.title, anime.malId, 12, anime.type);
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
                seasonId: null,
                seasonNumber: 1,
                episodeNumber,
                title: `Episode ${episodeNumber}`,
                synopsis: null,
                releaseDate: null,
                videoUrl: videoUrl,
                dubVideoUrl: anime.hasDub ? videoUrl : null,
                hindiVideoUrl: anime.hasHindi ? videoUrl : null,
                thumbnail: anime.bannerImage || anime.posterImage,
                duration: '24 min',
                status: 'AVAILABLE',
                createdAt: anime.createdAt,
                updatedAt: anime.updatedAt,
            };
        }
        if (!episode) {
            return res.status(404).json({ error: 'Episode not found' });
        }
        const hasNext = episodeNumber < targetEpCount;
        const hasPrev = episodeNumber > 1;
        const hasDub = checkIfAnimeHasDub(anime);
        const hasSub = anime.hasSub !== false;
        const hasHindi = checkIfAnimeHasHindi(anime);
        const availableAudios = [];
        if (hasSub)
            availableAudios.push('sub');
        if (hasDub)
            availableAudios.push('dub');
        if (hasHindi)
            availableAudios.push('hindi');
        return res.status(200).json({
            episode,
            animeName: anime.title,
            animePoster: anime.posterImage,
            hasPrev,
            hasNext,
            totalEpisodes: targetEpCount,
            hasDub,
            hasSub,
            hasHindi,
            isMultiAudio: availableAudios.length > 1,
            availableAudios
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
            a.genres.split(',').forEach((g) => {
                const trimmed = g.trim();
                if (trimmed)
                    genresSet.add(trimmed);
            });
        });
        genresSet.add('18+');
        return res.status(200).json({ genres: Array.from(genresSet).sort() });
    }
    catch (error) {
        console.error('Error fetching genres list:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
async function getEpisodeSources(req, res) {
    try {
        const { id, epNum } = req.params;
        const { server, lang } = req.query;
        const episodeNumber = parseInt(epNum, 10) || 1;
        const anime = await findOrCreateAnimeBySlugOrId(id);
        if (!anime) {
            return res.status(404).json({ error: 'Anime not found' });
        }
        const title = anime.title || '';
        const slug = anime.slug || '';
        const requestedServer = server?.toLowerCase();
        // Query DB for verified audio versions for this episode or anime
        const dbAudioVersions = await prisma.audioVersion.findMany({
            where: {
                OR: [
                    { animeId: anime.id },
                    { episode: { animeId: anime.id, episodeNumber } }
                ],
                isAvailable: true,
                verificationStatus: { in: ['AVAILABLE', 'MAPPING_VERIFIED'] }
            }
        });
        const hasDbHindi = dbAudioVersions.some(a => a.language.toLowerCase() === 'hindi');
        const hasDbDub = dbAudioVersions.some(a => a.language.toLowerCase() === 'english');
        const hasDbSub = dbAudioVersions.some(a => a.language.toLowerCase() === 'japanese');
        const hasDub = hasDbDub || (anime.hasDub !== false && checkIfAnimeHasDub(anime));
        const hasSub = hasDbSub || (anime.hasSub !== false);
        const hasHindi = hasDbHindi || (anime.hasHindi === true || checkIfAnimeHasHindi(anime));
        const availableAudios = [];
        if (hasSub)
            availableAudios.push('sub');
        if (hasDub)
            availableAudios.push('dub');
        if (hasHindi)
            availableAudios.push('hindi');
        let activeTranslation = lang?.toLowerCase() || 'sub';
        // Sanitize requested audio: if anime doesn't have the requested audio track, fallback to available audio
        if (activeTranslation === 'dub' && !hasDub) {
            activeTranslation = 'sub';
        }
        if (activeTranslation === 'hindi' && !hasHindi) {
            activeTranslation = 'sub';
        }
        if (!availableAudios.includes(activeTranslation)) {
            activeTranslation = availableAudios[0] || 'sub';
        }
        // Check if the episode in local DB has a custom direct embed/stream URL for the active translation
        const currentEp = anime.episodes?.find((e) => e.episodeNumber === episodeNumber);
        let customEmbedUrl = '';
        if (activeTranslation === 'dub') {
            customEmbedUrl = currentEp?.dubVideoUrl || '';
        }
        else if (activeTranslation === 'hindi') {
            customEmbedUrl = currentEp?.hindiVideoUrl || '';
        }
        else {
            customEmbedUrl = currentEp?.videoUrl || '';
        }
        if (customEmbedUrl &&
            customEmbedUrl.startsWith('http') &&
            !customEmbedUrl.includes('/new_player/') &&
            !customEmbedUrl.includes('/embed/') &&
            !customEmbedUrl.includes('/e/') &&
            !/\.(mp4|m3u8|webm)(\?|$)/i.test(customEmbedUrl)) {
            try {
                const extracted = await (0, videoExtractor_service_1.extractCleanEmbedFromWebPage)(customEmbedUrl);
                if (extracted.cleanUrl) {
                    customEmbedUrl = extracted.cleanUrl;
                }
            }
            catch (_) { }
        }
        const hasCustomVideoUrl = Boolean(customEmbedUrl &&
            customEmbedUrl.trim().length > 0 &&
            !customEmbedUrl.includes('sample/BigBuckBunny'));
        // Auto-heal MAL ID if not present
        let animeMalId = anime.malId;
        if (!animeMalId) {
            animeMalId = await autoHealMalId(anime.id, anime.title);
        }
        // Prioritize high-performance, verified working servers:
        // If a custom stream or embed URL exists, default to that!
        // For DUB & HINDI, default to VidSrc Anime which has dedicated multi-audio stream support!
        const defaultWorkingServer = hasCustomVideoUrl
            ? 'custom_source'
            : ((activeTranslation === 'dub' || activeTranslation === 'hindi') ? 'vidsrc' : (animeMalId ? 'vidsrc' : 'autoembed'));
        let activeServer = requestedServer;
        // Auto-heal dead servers or deprecated defaults to the primary working server
        const deadOrDeprecated = ['vidplay', 'dghg', 'raretoon', 'byfms', 'datsav', 'twoembed'];
        if (!activeServer || deadOrDeprecated.includes(activeServer)) {
            activeServer = defaultWorkingServer;
        }
        // ==========================================
        // 1. MOVIE TMDB MAPPINGS & DETECTION
        // ==========================================
        const MAL_TO_MOVIE_TMDB = {
            48561: 810693, // Jujutsu Kaisen 0
            40456: 635302, // Demon Slayer: Mugen Train (Movie)
            50410: 900667, // One Piece Film: Red
            38234: 568012, // One Piece: Stampede
            31490: 384792, // One Piece Film: Gold
            12859: 148386, // One Piece Film: Z
            4155: 24420, // One Piece: Strong World
            36946: 503314, // Dragon Ball Super: Broly
            48903: 610150, // Dragon Ball Super: Super Hero
            14837: 126963, // Dragon Ball Z: Battle of Gods
            25389: 303857, // Dragon Ball Z: Resurrection 'F'
            32281: 372058, // Your Name. (Kimi no Na wa.)
            50594: 916224, // Suzume
            38826: 568160, // Weathering with You (Tenki no Ko)
            28851: 378064, // A Silent Voice (Koe no Katachi)
            199: 129, // Spirited Away
            431: 4935, // Howl's Moving Castle
            164: 128, // Princess Mononoke
            523: 8392, // My Neighbor Totoro
            16870: 317442, // The Last: Naruto the Movie
            28755: 347201, // Boruto: Naruto the Movie
            13667: 149871, // Road to Ninja: Naruto the Movie
            48849: 812225, // Black Clover: Sword of the Wizard King
            31765: 417859, // Sword Art Online: Ordinal Scale
            42916: 762975, // SAO Progressive - Aria of a Starless Night
            50273: 956101, // SAO Progressive - Scherzo of Deep Night
            33674: 428078, // No Game No Life: Zero
            36098: 504253, // I Want to Eat Your Pancreas
            41429: 664574, // A Whisker Away
            49884: 508883, // The Boy and the Heron
            47: 149, // Akira
            43: 9323, // Ghost in the Shell
            102: 10494, // Perfect Blue
            25537: 399404, // Fate/stay night: Heaven's Feel I. presage flower
            33049: 514593, // Fate/stay night: Heaven's Feel II. lost butterfly
            33050: 514594, // Fate/stay night: Heaven's Feel III. spring song
            2759: 18491, // Evangelion: 1.0 You Are (Not) Alone
            3784: 18492, // Evangelion: 2.0 You Can (Not) Advance
            3785: 43764, // Evangelion: 3.0 You Can (Not) Redo
            3786: 283566, // Evangelion: 3.0+1.0 Thrice Upon a Time
            36896: 505262, // My Hero Academia: Two Heroes
            39565: 592350, // My Hero Academia: Heroes Rising
            44200: 768744, // My Hero Academia: World Heroes' Mission
            55798: 1159311, // My Hero Academia: You're Next
            52742: 1012201, // Haikyu!! The Dumpster Battle
            53887: 1062807, // Spy x Family Code: White
            57555: 1219685, // Chainsaw Man - The Movie: Reze Arc
            54865: 1134433, // Blue Lock: Episode Nagi
            38329: 572154, // Rascal Does Not Dream of a Dreaming Girl
            578: 12477, // Grave of the Fireflies
            1689: 38142, // 5 Centimeters per Second
            16782: 198370, // The Garden of Words
            1987: 4977, // Paprika
            5681: 26519, // Summer Wars
            12355: 110420, // Wolf Children
            2236: 14069, // The Girl Who Leapt Through Time
            58272: 1244857, // Look Back
            48897: 826909, // Overlord: The Sacred Kingdom
            49994: 1011985, // Mobile Suit Gundam SEED FREEDOM
            55357: 1131438, // Bocchi the Rock! Re:
            52410: 1160164, // Mononoke the Movie: Phantom in the Rain
            53820: 1058694, // The Colors Within
            37348: 581389, // DanMachi: Arrow of the Orion
            54938: 1184918, // Given: Hiiragi mix
            57321: 1214484, // Trapezium
            59193: 1311134 // Demon Slayer: Infinity Castle
        };
        const MOVIE_SLUG_TMDB_MAP = {
            'chainsaw-man-the-movie-reze-arc': 1219685,
            'overlord-the-sacred-kingdom': 826909,
            'mobile-suit-gundam-seed-freedom': 1011985,
            'bocchi-the-rock-re': 1131438,
            'mononoke-the-movie-phantom-in-the-rain': 1160164,
            'the-colors-within': 1058694,
            'danmachi-arrow-of-the-orion': 581389,
            'given-hiiragi-mix': 1184918,
            'trapezium': 1214484,
            'demon-slayer-infinity-castle-movie': 1311134,
            'jujutsu-kaisen-0': 810693,
            'demon-slayer-kimetsu-no-yaiba-the-movie-mugen-train': 635302,
            'demon-slayer-mugen-train-movie': 635302,
            'kimetsu-no-yaiba-movie-mugen-ressha-hen': 635302,
            'one-piece-film-red': 900667,
            'one-piece-stampede': 568012,
            'one-piece-film-gold': 384792,
            'one-piece-film-z': 148386,
            'one-piece-strong-world': 24420,
            'dragon-ball-super-broly': 503314,
            'dragon-ball-super-super-hero': 610150,
            'dragon-ball-z-battle-of-gods': 126963,
            'dragon-ball-z-resurrection-f': 303857,
            'your-name': 372058,
            'kimi-no-na-wa': 372058,
            'suzume': 916224,
            'suzume-no-tojimari': 916224,
            'weathering-with-you': 568160,
            'tenki-no-ko': 568160,
            'a-silent-voice': 378064,
            'koe-no-katachi': 378064,
            'spirited-away': 129,
            'sen-to-chihiro-no-kamikakushi': 129,
            'howls-moving-castle': 4935,
            'princess-mononoke': 128,
            'my-neighbor-totoro': 8392,
            'the-last-naruto-the-movie': 317442,
            'boruto-naruto-the-movie': 347201,
            'road-to-ninja-naruto-the-movie': 149871,
            'black-clover-sword-of-the-wizard-king': 812225,
            'sword-art-online-the-movie-ordinal-scale': 417859,
            'sword-art-online-progressive-aria-of-a-starless-night': 762975,
            'sword-art-online-progressive-scherzo-of-deep-night': 956101,
            'no-game-no-life-zero': 428078,
            'i-want-to-eat-your-pancreas': 504253,
            'a-whisker-away': 664574,
            'the-boy-and-the-heron': 508883,
            'akira': 149,
            'ghost-in-the-shell': 9323,
            'perfect-blue': 10494,
            'my-hero-academia-two-heroes': 505262,
            'my-hero-academia-heroes-rising': 592350,
            'my-hero-academia-world-heroes-mission': 768744,
            'my-hero-academia-youre-next': 1159311,
            'haikyu-the-dumpster-battle': 1012201,
            'spy-x-family-code-white': 1062807,
            'blue-lock-episode-nagi': 1134433,
            'rascal-does-not-dream-of-a-dreaming-girl': 572154,
            'grave-of-the-fireflies': 12477,
            '5-centimeters-per-second': 38142,
            'the-garden-of-words': 198370,
            'look-back': 1244857
        };
        const isExplicitMovieType = anime.type?.toUpperCase() === 'MOVIE' || anime.type?.toUpperCase() === 'SPECIAL';
        const isMovieByMal = Boolean(animeMalId && MAL_TO_MOVIE_TMDB[animeMalId]);
        const isMovieBySlug = Boolean(MOVIE_SLUG_TMDB_MAP[slug] || Object.keys(MOVIE_SLUG_TMDB_MAP).find(k => slug.includes(k)));
        const isMovieByTitle = /\b(movie|film|gekijouban)\b/i.test(title) || /\b(movie|film)\b/i.test(slug);
        const isMovie = Boolean(isExplicitMovieType || isMovieByMal || isMovieBySlug || isMovieByTitle);
        if (isMovie) {
            let movieTmdbId = anime.tmdbId || null;
            if (!movieTmdbId && animeMalId && MAL_TO_MOVIE_TMDB[animeMalId]) {
                movieTmdbId = MAL_TO_MOVIE_TMDB[animeMalId];
            }
            else if (!movieTmdbId && MOVIE_SLUG_TMDB_MAP[slug]) {
                movieTmdbId = MOVIE_SLUG_TMDB_MAP[slug];
            }
            else if (!movieTmdbId) {
                const found = Object.entries(MOVIE_SLUG_TMDB_MAP).find(([k]) => slug.includes(k));
                if (found) {
                    movieTmdbId = found[1];
                }
            }
            const movieAniwaveSlug = exports.ANIWAVE_SLUG_MAP[slug] || '';
            const subServers = [
                ...(hasCustomVideoUrl ? [{ id: 'custom_source', name: 'HD-0: AniVerse Direct (Sub)', embedUrl: customEmbedUrl }] : []),
                { id: 'vidsrc', name: 'HD-1: AniVerse Multi (Sub)', embedUrl: animeMalId ? `https://vidsrc.pm/embed/anime?mal=${animeMalId}&ep=1` : (movieTmdbId ? `https://vidsrc.pm/embed/movie/${movieTmdbId}` : (customEmbedUrl || '')) },
                { id: 'aniwave', name: 'HD-2: AniVerse Prime (Sub)', embedUrl: movieAniwaveSlug ? `https://aniwaves.ru/watch/${movieAniwaveSlug}/ep-1?lang=sub` : (animeMalId ? `https://vidsrc.net/embed/anime?mal=${animeMalId}&ep=1` : (movieTmdbId ? `https://vidsrc.pm/embed/movie/${movieTmdbId}` : (customEmbedUrl || ''))) },
                { id: 'vidsrc_me', name: 'HD-3: AniVerse Global (Sub)', embedUrl: animeMalId ? `https://vidsrc.net/embed/anime?mal=${animeMalId}&ep=1` : (movieTmdbId ? `https://vidsrc.me/embed/movie?tmdb=${movieTmdbId}` : (customEmbedUrl || '')) },
                { id: 'vidsrc_io', name: 'HD-4: AniVerse Cloud (Sub)', embedUrl: animeMalId ? `https://vidsrc.io/embed/anime?mal=${animeMalId}&ep=1` : (movieTmdbId ? `https://vidsrc.io/embed/movie/${movieTmdbId}` : (customEmbedUrl || '')) },
                { id: 'vidsrc_cc', name: 'HD-5: AniVerse Cinema (Sub)', embedUrl: animeMalId ? `https://vidsrc.cc/v2/embed/anime?mal=${animeMalId}&ep=1` : (movieTmdbId ? `https://vidsrc.cc/v2/embed/movie/${movieTmdbId}` : (customEmbedUrl || '')) },
                { id: 'autoembed', name: 'HD-6: AniVerse Auto (Sub)', embedUrl: animeMalId ? `https://player.autoembed.cc/embed/anime/${animeMalId}/1` : (movieTmdbId ? `https://autoembed.co/movie/tmdb/${movieTmdbId}` : (customEmbedUrl || '')) }
            ];
            const dubServers = hasDub ? [
                ...(hasCustomVideoUrl ? [{ id: 'custom_source', name: 'HD-0: AniVerse Direct (English Dub)', embedUrl: customEmbedUrl }] : []),
                { id: 'vidsrc', name: 'HD-1: AniVerse Ultra (English Dub)', embedUrl: animeMalId ? `https://vidsrc.pm/embed/anime?mal=${animeMalId}&ep=1&dub=1` : (movieTmdbId ? `https://vidsrc.pm/embed/movie/${movieTmdbId}?lang=en` : (customEmbedUrl || '')) },
                { id: 'vidsrc_me', name: 'HD-2: AniVerse Prime (English Dub)', embedUrl: animeMalId ? `https://vidsrc.net/embed/anime?mal=${animeMalId}&ep=1&dub=1` : (movieTmdbId ? `https://vidsrc.me/embed/movie?tmdb=${movieTmdbId}&dub=1` : (customEmbedUrl || '')) },
                { id: 'aniwave', name: 'HD-3: AniVerse Multi (English Dub)', embedUrl: movieAniwaveSlug ? `https://aniwaves.ru/watch/${movieAniwaveSlug}/ep-1?lang=dub` : (animeMalId ? `https://vidsrc.io/embed/anime?mal=${animeMalId}&ep=1&dub=1` : (movieTmdbId ? `https://vidsrc.io/embed/movie/${movieTmdbId}?dub=1` : (customEmbedUrl || ''))) },
                { id: 'vidsrc_io', name: 'HD-4: AniVerse Cloud (English Dub)', embedUrl: animeMalId ? `https://vidsrc.io/embed/anime?mal=${animeMalId}&ep=1&dub=1` : (movieTmdbId ? `https://vidsrc.io/embed/movie/${movieTmdbId}?dub=1` : (customEmbedUrl || '')) },
                { id: 'vidsrc_cc', name: 'HD-5: AniVerse Cinema (English Dub)', embedUrl: animeMalId ? `https://vidsrc.cc/v2/embed/anime?mal=${animeMalId}&ep=1&dub=1` : (movieTmdbId ? `https://vidsrc.cc/v2/embed/movie/${movieTmdbId}?dub=1` : (customEmbedUrl || '')) },
                { id: 'autoembed', name: 'HD-6: AniVerse Auto (English Dub)', embedUrl: animeMalId ? `https://player.autoembed.cc/embed/anime/${animeMalId}/1?dub=1` : (movieTmdbId ? `https://autoembed.co/movie/tmdb/${movieTmdbId}?dub=1` : (customEmbedUrl || '')) }
            ] : [];
            const hindiServers = hasHindi ? [
                ...(hasCustomVideoUrl ? [{ id: 'custom_source', name: 'HD-0: AniVerse Direct (Hindi)', embedUrl: customEmbedUrl }] : []),
                { id: 'vidsrc', name: 'HD-1: AniVerse Hindi (Ultra HD)', embedUrl: animeMalId ? `https://vidsrc.pm/embed/anime?mal=${animeMalId}&ep=1&lang=hi` : (movieTmdbId ? `https://vidsrc.pm/embed/movie/${movieTmdbId}?lang=hi` : (customEmbedUrl || '')) },
                { id: 'vidsrc_me', name: 'HD-2: AniVerse Hindi (Prime)', embedUrl: animeMalId ? `https://vidsrc.net/embed/anime?mal=${animeMalId}&ep=1&lang=hi` : (movieTmdbId ? `https://vidsrc.me/embed/movie?tmdb=${movieTmdbId}&ds_lang=hi` : (customEmbedUrl || '')) },
                { id: 'vidsrc_io', name: 'HD-3: AniVerse Hindi (Cloud)', embedUrl: animeMalId ? `https://vidsrc.io/embed/anime?mal=${animeMalId}&ep=1&lang=hi` : (movieTmdbId ? `https://vidsrc.io/embed/movie/${movieTmdbId}?lang=hi` : (customEmbedUrl || '')) },
                { id: 'vidsrc_cc', name: 'HD-4: AniVerse Hindi (Stream)', embedUrl: animeMalId ? `https://vidsrc.cc/v2/embed/anime?mal=${animeMalId}&ep=1&lang=hi` : (movieTmdbId ? `https://vidsrc.cc/v2/embed/movie/${movieTmdbId}?lang=hi` : (customEmbedUrl || '')) },
                { id: 'autoembed', name: 'HD-5: AniVerse Hindi (Auto)', embedUrl: animeMalId ? `https://player.autoembed.cc/embed/anime/${animeMalId}/1&lang=hi` : (movieTmdbId ? `https://autoembed.co/movie/tmdb/${movieTmdbId}?lang=hi` : (customEmbedUrl || '')) }
            ] : [];
            const serversByAudio = {
                sub: subServers,
                ...(hasDub && dubServers.length > 0 ? { dub: dubServers } : {}),
                ...(hasHindi && hindiServers.length > 0 ? { hindi: hindiServers } : {})
            };
            const serverSources = serversByAudio[activeTranslation] || subServers;
            const currentServerObj = (hasCustomVideoUrl && (!animeMalId && !movieTmdbId))
                ? (serverSources.find(s => s.id === 'custom_source') || serverSources[0])
                : (serverSources.find(s => s.id === activeServer) || serverSources[0]);
            return res.status(200).json({
                embedUrl: currentServerObj.embedUrl,
                server: currentServerObj.id,
                lang: activeTranslation,
                isMovie: true,
                hasSub,
                hasDub,
                hasHindi,
                isMultiAudio: availableAudios.length > 1,
                availableAudios,
                servers: serverSources,
                serversByAudio
            });
        }
        // ==========================================
        // 2. TV SERIES TMDB MAPPINGS & DETECTION
        // ==========================================
        let seasonNumber = 1;
        let epNumToUse = episodeNumber;
        const seasonMatch = title.match(/Season\s+(\d+)/i) || slug.match(/season-(\d+)/i);
        const ndSeasonMatch = title.match(/(\d+)(st|nd|rd|th)\s+Season/i) || slug.match(/(\d+)(st|nd|rd|th)-season/i);
        const partMatch = title.match(/Part\s+(\d+)/i) || slug.match(/part-(\d+)/i);
        const romanMatch = title.match(/\s+(II|III|IV|V|VI)\b/i) || slug.match(/-(ii|iii|iv|v|vi)$/i);
        if (seasonMatch) {
            seasonNumber = parseInt(seasonMatch[1], 10);
        }
        else if (ndSeasonMatch) {
            seasonNumber = parseInt(ndSeasonMatch[1], 10);
        }
        else if (partMatch) {
            seasonNumber = parseInt(partMatch[1], 10);
        }
        else if (/the\s*calamity/i.test(title) || /the-calamity/i.test(slug) || /kashin-tan/i.test(title)) {
            seasonNumber = 2; // Bleach TYBW Part 4 (The Calamity) is Season 2 on TMDB 30984
            epNumToUse = episodeNumber + 39;
        }
        else if (/the\s*conflict/i.test(title) || /the-conflict/i.test(slug) || /soukoku-tan/i.test(title)) {
            seasonNumber = 2; // Bleach TYBW Part 3 (The Conflict) is Season 2 on TMDB 30984
            epNumToUse = episodeNumber + 26;
        }
        else if (/the\s*separation/i.test(title) || /the-separation/i.test(slug) || /ketsubetsu-tan/i.test(title)) {
            seasonNumber = 2; // Bleach TYBW Part 2 (The Separation) is Season 2 on TMDB 30984
            epNumToUse = episodeNumber + 13;
        }
        else if (slug.includes('bleach-thousand-year-blood-war') || /thousand-year\s*blood\s*war/i.test(title)) {
            seasonNumber = 2; // Bleach TYBW Part 1 is Season 2 on TMDB 30984
            epNumToUse = episodeNumber;
        }
        else if (/final\s*season/i.test(title) || /final-season/i.test(slug)) {
            seasonNumber = 4; // Attack on Titan Final Season
        }
        else if (/entertainment\s*district/i.test(title) || /entertainment-district/i.test(slug)) {
            seasonNumber = 2; // Demon Slayer S2
        }
        else if (/swordsmith\s*village/i.test(title) || /swordsmith-village/i.test(slug)) {
            seasonNumber = 3; // Demon Slayer S3
        }
        else if (/hashira\s*training/i.test(title) || /hashira-training/i.test(slug)) {
            seasonNumber = 4; // Demon Slayer S4
        }
        else if (/mugen\s*train/i.test(title) || /mugen-train/i.test(slug)) {
            seasonNumber = 2;
        }
        else if (romanMatch) {
            const val = (romanMatch[1] || '').toUpperCase();
            if (val === 'II')
                seasonNumber = 2;
            else if (val === 'III')
                seasonNumber = 3;
            else if (val === 'IV')
                seasonNumber = 4;
            else if (val === 'V')
                seasonNumber = 5;
            else if (val === 'VI')
                seasonNumber = 6;
        }
        const FRANCHISE_TMDB_MAP = {
            'one-piece': 37854,
            'naruto': 46260,
            'naruto-shippuden': 31910,
            'boruto': 70881,
            'boruto-naruto-next-generations': 70881,
            'bleach-thousand-year-blood-war-the-calamity': 30984,
            'bleach-thousand-year-blood-war': 30984,
            'bleach': 30984,
            'shingeki-no-kyojin': 1429,
            'attack-on-titan': 1429,
            'jujutsu-kaisen': 95479,
            'kimetsu-no-yaiba': 85937,
            'demon-slayer': 85937,
            'demon-slayer-kimetsu-no-yaiba': 85937,
            'my-hero-academia': 65930,
            'boku-no-hero-academia': 65930,
            'solo-leveling': 127532,
            'death-note': 13916,
            'hunter-x-hunter': 46298,
            'hunter-x-hunter-2011': 46298,
            'fullmetal-alchemist-brotherhood': 31911,
            'fullmetal-alchemist': 31911,
            'black-clover': 73223,
            'dragon-ball-z': 12971,
            'dragon-ball-super': 62710,
            'dragon-ball-gt': 12697,
            'dragon-ball': 12609,
            'inuyasha': 35610,
            'detective-conan': 30983,
            'case-closed': 30983,
            'monster': 1919,
            'yu-yu-hakusho': 32626,
            'slam-dunk': 46263,
            'katekyo-hitman-reborn': 31057,
            'soul-eater': 32174,
            'dgray-man': 31393,
            'sailor-moon': 36173,
            'toriko': 40381,
            'rurouni-kenshin': 2490,
            'hajime-no-ippo': 46300,
            'jojos-bizarre-adventure': 45790,
            'chainsaw-man': 114410,
            'tokyo-ghoul': 61374,
            'spy-x-family': 120089,
            'vinland-saga': 89364,
            'code-geass': 34391,
            'code-geass-hangyaku-no-lelouch': 34391,
            'cowboy-bebop': 30991,
            'steinsgate': 39351,
            'sword-art-online': 45782,
            'classroom-of-the-elite': 72636,
            'youkoso-jitsuryoku-shijou-shugi-no-kyoushitsu-e': 72636,
            'frieren-beyond-journeys-end': 209867,
            'sousou-no-frieren': 209867,
            'mushoku-tensei-jobless-reincarnation': 99516,
            'mushoku-tensei': 99516,
            'the-100-girlfriends-who-really-really-really-really-really-love-you': 223594,
            'the-100-girlfriends': 223594,
            'kaiju-8': 207396,
            'kaiju-no-8': 207396,
            'mob-psycho-100': 67075,
            'one-punch-man': 63926,
            'dr-stone': 86031,
            'kaguya-sama-love-is-war': 83431,
            're-zero-starting-life-in-another-world': 65942,
            're-zero': 65942,
            'the-eminence-in-shadow': 125867,
            'haikyuu': 60863,
            'fairy-tail': 46261,
            'blue-lock': 135898,
            'blue-lock-season-2': 135898,
            'aoashi': 123490,
            'ao-ashi': 123490,
            'aoashi-season-2': 123490,
            'grand-blue': 80894,
            'grand-blue-dreaming': 80894,
            'blue-box': 207347,
            'blue-box-season-2': 207347,
            'ao-no-hako': 207347,
            'kamui-hes-behind-you': 285552,
            'kamui': 285552,
            'hells-paradise': 157059,
            'oshi-no-ko': 203737,
            'overlord': 64196,
            'that-time-i-got-reincarnated-as-a-slime': 81537,
            'dandadan': 240411,
            'tower-of-god': 98978,
            'wind-breaker': 222666,
            'shangri-la-frontier': 205424,
            'konosuba': 65947
        };
        let aniwaveSlug = exports.ANIWAVE_SLUG_MAP[slug] || '';
        if (!aniwaveSlug) {
            const matchedKey = Object.keys(exports.ANIWAVE_SLUG_MAP).find(k => slug.includes(k) || k.includes(slug));
            if (matchedKey)
                aniwaveSlug = exports.ANIWAVE_SLUG_MAP[matchedKey];
        }
        const LONG_SERIES_TMDB_MAP = {
            // 1. One Piece (MAL 21 / TMDB 37854) - 21+ Seasons
            21: {
                tmdbId: 37854,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 61 },
                    { seasonNumber: 2, startEp: 62, endEp: 77 },
                    { seasonNumber: 3, startEp: 78, endEp: 92 },
                    { seasonNumber: 4, startEp: 93, endEp: 130 },
                    { seasonNumber: 5, startEp: 131, endEp: 143 },
                    { seasonNumber: 6, startEp: 144, endEp: 195 },
                    { seasonNumber: 7, startEp: 196, endEp: 228 },
                    { seasonNumber: 8, startEp: 229, endEp: 263 },
                    { seasonNumber: 9, startEp: 264, endEp: 336 },
                    { seasonNumber: 10, startEp: 337, endEp: 381 },
                    { seasonNumber: 11, startEp: 382, endEp: 407 },
                    { seasonNumber: 12, startEp: 408, endEp: 421 },
                    { seasonNumber: 13, startEp: 422, endEp: 456 },
                    { seasonNumber: 14, startEp: 457, endEp: 516 },
                    { seasonNumber: 15, startEp: 517, endEp: 578 },
                    { seasonNumber: 16, startEp: 579, endEp: 628 },
                    { seasonNumber: 17, startEp: 629, endEp: 746 },
                    { seasonNumber: 18, startEp: 747, endEp: 782 },
                    { seasonNumber: 19, startEp: 783, endEp: 891 },
                    { seasonNumber: 20, startEp: 892, endEp: 1088 },
                    { seasonNumber: 21, startEp: 1089, endEp: 2000 },
                ]
            },
            // 2. Naruto (MAL 20 / TMDB 46260) - 4 Seasons (220 eps)
            20: {
                tmdbId: 46260,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 52 },
                    { seasonNumber: 2, startEp: 53, endEp: 104 },
                    { seasonNumber: 3, startEp: 105, endEp: 158 },
                    { seasonNumber: 4, startEp: 159, endEp: 220 },
                ]
            },
            // 3. Naruto Shippuden (MAL 1735 / TMDB 31910) - 20 Seasons (500 eps)
            1735: {
                tmdbId: 31910,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 32 },
                    { seasonNumber: 2, startEp: 33, endEp: 53 },
                    { seasonNumber: 3, startEp: 54, endEp: 71 },
                    { seasonNumber: 4, startEp: 72, endEp: 95 },
                    { seasonNumber: 5, startEp: 96, endEp: 126 },
                    { seasonNumber: 6, startEp: 127, endEp: 156 },
                    { seasonNumber: 7, startEp: 157, endEp: 163 },
                    { seasonNumber: 8, startEp: 164, endEp: 187 },
                    { seasonNumber: 9, startEp: 188, endEp: 208 },
                    { seasonNumber: 10, startEp: 209, endEp: 233 },
                    { seasonNumber: 11, startEp: 234, endEp: 254 },
                    { seasonNumber: 12, startEp: 255, endEp: 287 },
                    { seasonNumber: 13, startEp: 288, endEp: 301 },
                    { seasonNumber: 14, startEp: 302, endEp: 321 },
                    { seasonNumber: 15, startEp: 322, endEp: 350 },
                    { seasonNumber: 16, startEp: 351, endEp: 371 },
                    { seasonNumber: 17, startEp: 372, endEp: 384 },
                    { seasonNumber: 18, startEp: 385, endEp: 439 },
                    { seasonNumber: 19, startEp: 440, endEp: 460 },
                    { seasonNumber: 20, startEp: 461, endEp: 500 },
                ]
            },
            // 4. Hunter x Hunter 2011 (MAL 11061 / TMDB 46298) - 3 Seasons (148 eps)
            11061: {
                tmdbId: 46298,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 62 },
                    { seasonNumber: 2, startEp: 63, endEp: 136 },
                    { seasonNumber: 3, startEp: 137, endEp: 148 },
                ]
            },
            // 5. Hunter x Hunter 1999 (MAL 136 / TMDB 46297) - 62 eps
            136: {
                tmdbId: 46297,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 62 }
                ]
            },
            // 6. Fairy Tail (MAL 6702 / TMDB 46261) - 8 Seasons (328 eps)
            6702: {
                tmdbId: 46261,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 48 },
                    { seasonNumber: 2, startEp: 49, endEp: 96 },
                    { seasonNumber: 3, startEp: 97, endEp: 150 },
                    { seasonNumber: 4, startEp: 151, endEp: 175 },
                    { seasonNumber: 5, startEp: 176, endEp: 226 },
                    { seasonNumber: 6, startEp: 227, endEp: 265 },
                    { seasonNumber: 7, startEp: 266, endEp: 277 },
                    { seasonNumber: 8, startEp: 278, endEp: 328 },
                ]
            },
            // 7. Gintama (MAL 918 / TMDB 46299) - 11 Seasons (367 eps)
            918: {
                tmdbId: 46299,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 49 },
                    { seasonNumber: 2, startEp: 50, endEp: 99 },
                    { seasonNumber: 3, startEp: 100, endEp: 150 },
                    { seasonNumber: 4, startEp: 151, endEp: 201 },
                    { seasonNumber: 5, startEp: 202, endEp: 252 },
                    { seasonNumber: 6, startEp: 253, endEp: 265 },
                    { seasonNumber: 7, startEp: 266, endEp: 316 },
                    { seasonNumber: 8, startEp: 317, endEp: 328 },
                    { seasonNumber: 9, startEp: 329, endEp: 341 },
                    { seasonNumber: 10, startEp: 342, endEp: 353 },
                    { seasonNumber: 11, startEp: 354, endEp: 367 },
                ]
            },
            // 8. Bleach Original (MAL 269 / TMDB 30984) - Season 1 (366 eps)
            269: {
                tmdbId: 30984,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 366 }
                ]
            },
            // 9. Dragon Ball Z (MAL 813 / TMDB 12971) - Season 1 (291 eps)
            813: {
                tmdbId: 12971,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 291 }
                ]
            },
            // 10. Dragon Ball (MAL 223 / TMDB 12609) - Season 1 (153 eps)
            223: {
                tmdbId: 12609,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 153 }
                ]
            },
            // 11. Dragon Ball Super (MAL 30694 / TMDB 62710) - Season 1 (131 eps)
            30694: {
                tmdbId: 62710,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 131 }
                ]
            },
            // 12. Dragon Ball GT (MAL 225 / TMDB 12697) - Season 1 (64 eps)
            225: {
                tmdbId: 12697,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 64 }
                ]
            },
            // 13. Black Clover (MAL 34572 / TMDB 73223) - Season 1 (170 eps)
            34572: {
                tmdbId: 73223,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 170 }
                ]
            },
            // 14. InuYasha (MAL 249 / TMDB 35610) - Season 1 (167 eps)
            249: {
                tmdbId: 35610,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 167 }
                ]
            },
            // 15. Detective Conan / Case Closed (MAL 235 / TMDB 30983)
            235: {
                tmdbId: 30983,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 2000 }
                ]
            },
            // 16. Boruto: Naruto Next Generations (MAL 34566 / TMDB 70881) - 293 eps
            34566: {
                tmdbId: 70881,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 293 }
                ]
            },
            // 17. Monster (MAL 19 / TMDB 1919) - 74 eps
            19: {
                tmdbId: 1919,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 74 }
                ]
            },
            // 18. Yu Yu Hakusho (MAL 392 / TMDB 32626) - 112 eps
            392: {
                tmdbId: 32626,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 112 }
                ]
            },
            // 19. JoJo's Bizarre Adventure (MAL 14719 / TMDB 45790) - 5 Seasons (190 eps)
            14719: {
                tmdbId: 45790,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 26 },
                    { seasonNumber: 2, startEp: 27, endEp: 74 },
                    { seasonNumber: 3, startEp: 75, endEp: 113 },
                    { seasonNumber: 4, startEp: 114, endEp: 152 },
                    { seasonNumber: 5, startEp: 153, endEp: 190 },
                ]
            },
            // 20. Slam Dunk (MAL 170 / TMDB 46263) - 101 eps
            170: {
                tmdbId: 46263,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 101 }
                ]
            },
            // 21. Katekyo Hitman Reborn! (MAL 1604 / TMDB 31057) - 203 eps
            1604: {
                tmdbId: 31057,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 203 }
                ]
            },
            // 22. Soul Eater (MAL 3588 / TMDB 32174) - 51 eps
            3588: {
                tmdbId: 32174,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 51 }
                ]
            },
            // 23. D.Gray-man (MAL 1482 / TMDB 31393) - 103 eps
            1482: {
                tmdbId: 31393,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 103 }
                ]
            },
            // 24. Sailor Moon (MAL 530 / TMDB 36173) - 5 Seasons (200 eps)
            530: {
                tmdbId: 36173,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 46 },
                    { seasonNumber: 2, startEp: 47, endEp: 89 },
                    { seasonNumber: 3, startEp: 90, endEp: 127 },
                    { seasonNumber: 4, startEp: 128, endEp: 166 },
                    { seasonNumber: 5, startEp: 167, endEp: 200 },
                ]
            },
            // 25. Toriko (MAL 10033 / TMDB 40381) - 147 eps
            10033: {
                tmdbId: 40381,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 147 }
                ]
            },
            // 26. Rurouni Kenshin (MAL 45 / TMDB 2490) - 3 Seasons (95 eps)
            45: {
                tmdbId: 2490,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 27 },
                    { seasonNumber: 2, startEp: 28, endEp: 62 },
                    { seasonNumber: 3, startEp: 63, endEp: 95 },
                ]
            },
            // 27. Hajime no Ippo (MAL 263 / TMDB 46300) - 75 eps
            263: {
                tmdbId: 46300,
                seasons: [
                    { seasonNumber: 1, startEp: 1, endEp: 75 }
                ]
            }
        };
        const LONG_SERIES_SLUG_MAP = {
            'one-piece': 21,
            'naruto-shippuden': 1735,
            'naruto': 20,
            'hunter-x-hunter-2011': 11061,
            'hunter-x-hunter': 11061,
            'fairy-tail': 6702,
            'gintama': 918,
            'bleach': 269,
            'dragon-ball-z': 813,
            'dragon-ball-super': 30694,
            'dragon-ball-gt': 225,
            'dragon-ball': 223,
            'black-clover': 34572,
            'inuyasha': 249,
            'detective-conan': 235,
            'case-closed': 235,
            'boruto-naruto-next-generations': 34566,
            'boruto': 34566,
            'monster': 19,
            'yu-yu-hakusho': 392,
            'jojos-bizarre-adventure': 14719,
            'slam-dunk': 170,
            'katekyo-hitman-reborn': 1604,
            'soul-eater': 3588,
            'dgray-man': 1482,
            'sailor-moon': 530,
            'toriko': 10033,
            'rurouni-kenshin': 45,
            'hajime-no-ippo': 263
        };
        const MAL_TO_SEASON_INFO = {
            // Jujutsu Kaisen
            40748: { tmdbId: 95479, seasonNumber: 1 },
            51009: { tmdbId: 95479, seasonNumber: 2 },
            // Attack on Titan
            16498: { tmdbId: 1429, seasonNumber: 1 },
            25777: { tmdbId: 1429, seasonNumber: 2 },
            35760: { tmdbId: 1429, seasonNumber: 3 },
            38524: { tmdbId: 1429, seasonNumber: 3, epOffset: 12 },
            40028: { tmdbId: 1429, seasonNumber: 4 },
            48583: { tmdbId: 1429, seasonNumber: 4, epOffset: 16 },
            // Demon Slayer
            38000: { tmdbId: 85937, seasonNumber: 1 },
            47778: { tmdbId: 85937, seasonNumber: 2 },
            49776: { tmdbId: 85937, seasonNumber: 2 },
            51019: { tmdbId: 85937, seasonNumber: 3 },
            55701: { tmdbId: 85937, seasonNumber: 4 },
            // My Hero Academia
            31964: { tmdbId: 65930, seasonNumber: 1 },
            35247: { tmdbId: 65930, seasonNumber: 2 },
            36456: { tmdbId: 65930, seasonNumber: 3 },
            38408: { tmdbId: 65930, seasonNumber: 4 },
            41587: { tmdbId: 65930, seasonNumber: 5 },
            49918: { tmdbId: 65930, seasonNumber: 6 },
            55894: { tmdbId: 65930, seasonNumber: 7 },
            // Bleach TYBW (TMDB 30984, Season 2 with offsets)
            41467: { tmdbId: 30984, seasonNumber: 2, epOffset: 0 },
            45576: { tmdbId: 30984, seasonNumber: 2, epOffset: 0 }, // Part 1 - The Blood Warfare
            53998: { tmdbId: 30984, seasonNumber: 2, epOffset: 13 }, // Part 2 - The Separation
            56784: { tmdbId: 30984, seasonNumber: 2, epOffset: 26 }, // Part 3 - The Conflict
            56206: { tmdbId: 30984, seasonNumber: 2, epOffset: 26 }, // Part 3 - The Conflict
            60636: { tmdbId: 30984, seasonNumber: 2, epOffset: 39 }, // Part 4 - The Calamity
            // Chainsaw Man
            44511: { tmdbId: 114410, seasonNumber: 1 },
            // Cyberpunk Edgerunners
            42310: { tmdbId: 105248, seasonNumber: 1 },
            // Frieren
            52991: { tmdbId: 209867, seasonNumber: 1 },
            // Death Note
            1535: { tmdbId: 13916, seasonNumber: 1 },
            // Fullmetal Alchemist: Brotherhood
            5114: { tmdbId: 31911, seasonNumber: 1 },
            // One Punch Man
            30276: { tmdbId: 63926, seasonNumber: 1 },
            34134: { tmdbId: 63926, seasonNumber: 2 },
            // Classroom of the Elite
            35507: { tmdbId: 72636, seasonNumber: 1 },
            51096: { tmdbId: 72636, seasonNumber: 2 },
            51097: { tmdbId: 72636, seasonNumber: 3 },
            // Vinland Saga
            37521: { tmdbId: 89364, seasonNumber: 1 },
            49387: { tmdbId: 89364, seasonNumber: 2 },
            // Mob Psycho 100
            32182: { tmdbId: 67075, seasonNumber: 1 },
            37510: { tmdbId: 67075, seasonNumber: 2 },
            50172: { tmdbId: 67075, seasonNumber: 3 },
            // Dr. STONE
            38691: { tmdbId: 86031, seasonNumber: 1 },
            40852: { tmdbId: 86031, seasonNumber: 2 },
            48549: { tmdbId: 86031, seasonNumber: 3 },
            55358: { tmdbId: 86031, seasonNumber: 3 },
            // Kaguya-sama
            37999: { tmdbId: 83431, seasonNumber: 1 },
            40591: { tmdbId: 83431, seasonNumber: 2 },
            43608: { tmdbId: 83431, seasonNumber: 3 },
            // Re:ZERO
            31240: { tmdbId: 65942, seasonNumber: 1 },
            39587: { tmdbId: 65942, seasonNumber: 2 },
            42203: { tmdbId: 65942, seasonNumber: 2 },
            54857: { tmdbId: 65942, seasonNumber: 3 },
            // Mushoku Tensei
            39535: { tmdbId: 99516, seasonNumber: 1 },
            45570: { tmdbId: 99516, seasonNumber: 1 },
            51179: { tmdbId: 99516, seasonNumber: 2 },
            55888: { tmdbId: 99516, seasonNumber: 2 },
            59193: { tmdbId: 99516, seasonNumber: 3 },
            // Solo Leveling
            52299: { tmdbId: 127532, seasonNumber: 1 },
            58567: { tmdbId: 127532, seasonNumber: 2 },
            // Spy x Family
            50265: { tmdbId: 120089, seasonNumber: 1 },
            53887: { tmdbId: 120089, seasonNumber: 2 },
            // Oshi no Ko
            52034: { tmdbId: 203737, seasonNumber: 1 },
            55791: { tmdbId: 203737, seasonNumber: 2 },
            // Blue Lock
            49596: { tmdbId: 135898, seasonNumber: 1 },
            54865: { tmdbId: 135898, seasonNumber: 2 },
            // That Time I Got Reincarnated as a Slime
            37430: { tmdbId: 81537, seasonNumber: 1 },
            39551: { tmdbId: 81537, seasonNumber: 2 },
            53580: { tmdbId: 81537, seasonNumber: 3 },
            // KonoSuba
            30831: { tmdbId: 65947, seasonNumber: 1 },
            32937: { tmdbId: 65947, seasonNumber: 2 },
            49458: { tmdbId: 65947, seasonNumber: 3 },
            // Tower of God
            40221: { tmdbId: 98978, seasonNumber: 1 },
            52635: { tmdbId: 98978, seasonNumber: 2 },
            // Shangri-La Frontier
            52347: { tmdbId: 205424, seasonNumber: 1 },
            58594: { tmdbId: 205424, seasonNumber: 2 },
            // Dandadan
            57334: { tmdbId: 240411, seasonNumber: 1 },
            // Kaiju No. 8
            52588: { tmdbId: 207396, seasonNumber: 1 },
            59489: { tmdbId: 207396, seasonNumber: 1 },
            54492: { tmdbId: 207396, seasonNumber: 1 },
            // Haikyuu!!
            20583: { tmdbId: 60863, seasonNumber: 1 },
            28891: { tmdbId: 60863, seasonNumber: 2 },
            32935: { tmdbId: 60863, seasonNumber: 3 },
            38883: { tmdbId: 60863, seasonNumber: 4 },
            // Tokyo Ghoul
            22319: { tmdbId: 61374, seasonNumber: 1 },
            // Cowboy Bebop
            1: { tmdbId: 30991, seasonNumber: 1 },
            // Steins;Gate
            9253: { tmdbId: 39351, seasonNumber: 1 },
            // Code Geass
            1575: { tmdbId: 34391, seasonNumber: 1 },
            2904: { tmdbId: 34391, seasonNumber: 2 },
            // Sword Art Online
            11757: { tmdbId: 45782, seasonNumber: 1 },
            21881: { tmdbId: 45782, seasonNumber: 2 },
            36474: { tmdbId: 45782, seasonNumber: 3 },
            // Hell's Paradise
            46569: { tmdbId: 157059, seasonNumber: 1 },
            // Aoashi
            49052: { tmdbId: 123490, seasonNumber: 1 },
            61603: { tmdbId: 123490, seasonNumber: 1 },
            // Grand Blue Dreaming
            37105: { tmdbId: 80894, seasonNumber: 1 },
            // Wind Breaker
            54900: { tmdbId: 222666, seasonNumber: 1 },
            // Blue Box
            57181: { tmdbId: 207347, seasonNumber: 1 },
            61323: { tmdbId: 207347, seasonNumber: 2 },
            // Kamui
            63468: { tmdbId: 285552, seasonNumber: 1 }
        };
        let tmdbId = anime.tmdbId || null;
        // Check long continuous anime series first (One Piece, Naruto, Shippuden, Bleach, HxH, Fairy Tail, etc.)
        let longSeriesConfig;
        if (animeMalId && LONG_SERIES_TMDB_MAP[animeMalId]) {
            longSeriesConfig = LONG_SERIES_TMDB_MAP[animeMalId];
        }
        else {
            const cleanSlug = slug.toLowerCase();
            for (const [slugKey, malIdVal] of Object.entries(LONG_SERIES_SLUG_MAP)) {
                if (cleanSlug.includes(slugKey)) {
                    if (slugKey === 'naruto' && cleanSlug.includes('naruto-shippuden'))
                        continue;
                    longSeriesConfig = LONG_SERIES_TMDB_MAP[malIdVal];
                    if (!animeMalId)
                        animeMalId = malIdVal;
                    break;
                }
            }
        }
        if (longSeriesConfig) {
            tmdbId = longSeriesConfig.tmdbId;
            const matched = longSeriesConfig.seasons.find((s) => episodeNumber >= s.startEp && episodeNumber <= s.endEp);
            if (matched) {
                seasonNumber = matched.seasonNumber;
                epNumToUse = episodeNumber - matched.startEp + 1;
            }
            else {
                const last = longSeriesConfig.seasons[longSeriesConfig.seasons.length - 1];
                seasonNumber = last.seasonNumber;
                epNumToUse = Math.max(1, episodeNumber - last.startEp + 1);
            }
        }
        else if (animeMalId && MAL_TO_SEASON_INFO[animeMalId]) {
            const mapping = MAL_TO_SEASON_INFO[animeMalId];
            tmdbId = anime.tmdbId || mapping.tmdbId;
            seasonNumber = mapping.seasonNumber;
            if (mapping.epOffset) {
                epNumToUse = episodeNumber + mapping.epOffset;
            }
        }
        else if (!tmdbId) {
            let cleanSlug = slug
                .replace(/-(season-\d+|the-final-season|final-season|\d+(st|nd|rd|th)-season|part-\d+|ii|iii|iv|v|vi)$/i, '')
                .replace(/-(tv|entertainment-district-arc|swordsmith-village-arc|hashira-training-arc|mugen-train-arc)$/i, '')
                .trim();
            if (FRANCHISE_TMDB_MAP[slug]) {
                tmdbId = FRANCHISE_TMDB_MAP[slug];
            }
            else if (FRANCHISE_TMDB_MAP[cleanSlug]) {
                tmdbId = FRANCHISE_TMDB_MAP[cleanSlug];
            }
            else {
                const sortedKeys = Object.keys(FRANCHISE_TMDB_MAP).sort((a, b) => b.length - a.length);
                for (const key of sortedKeys) {
                    if (slug.includes(key) || cleanSlug.includes(key)) {
                        tmdbId = FRANCHISE_TMDB_MAP[key];
                        break;
                    }
                }
            }
        }
        // Explicit Bleach TYBW override safeguard
        if (slug.includes('bleach-thousand-year-blood-war') || slug.includes('sennen-kessen-hen')) {
            tmdbId = 30984;
            seasonNumber = 2;
            if (/the-calamity|part-4|kashin-tan/i.test(slug) || /the\s*calamity|part\s*4|kashin-tan/i.test(title)) {
                epNumToUse = episodeNumber + 39;
            }
            else if (/the-conflict|part-3|soukoku-tan/i.test(slug) || /the\s*conflict|part\s*3|soukoku-tan/i.test(title)) {
                epNumToUse = episodeNumber + 26;
            }
            else if (/the-separation|part-2|ketsubetsu-tan/i.test(slug) || /the\s*separation|part\s*2|ketsubetsu-tan/i.test(title)) {
                epNumToUse = episodeNumber + 13;
            }
            else {
                epNumToUse = episodeNumber;
            }
        }
        const subServers = [
            ...(hasCustomVideoUrl ? [{ id: 'custom_source', name: 'HD-0: AniVerse Direct (Sub)', embedUrl: customEmbedUrl }] : []),
            { id: 'vidsrc', name: 'HD-1: AniVerse Multi (Sub)', embedUrl: animeMalId ? `https://vidsrc.pm/embed/anime?mal=${animeMalId}&ep=${episodeNumber}` : (tmdbId ? `https://vidsrc.pm/embed/tv/${tmdbId}/${seasonNumber}/${epNumToUse}` : (customEmbedUrl || '')) },
            { id: 'aniwave', name: 'HD-2: AniVerse Prime (Sub)', embedUrl: aniwaveSlug ? `https://aniwaves.ru/watch/${aniwaveSlug}/ep-${episodeNumber}?lang=sub` : (animeMalId ? `https://vidsrc.net/embed/anime?mal=${animeMalId}&ep=${episodeNumber}` : (tmdbId ? `https://vidsrc.net/embed/tv/${tmdbId}/${seasonNumber}/${epNumToUse}` : (customEmbedUrl || ''))) },
            { id: 'vidsrc_me', name: 'HD-3: AniVerse Global (Sub)', embedUrl: animeMalId ? `https://vidsrc.net/embed/anime?mal=${animeMalId}&ep=${episodeNumber}` : (tmdbId ? `https://vidsrc.net/embed/tv/${tmdbId}/${seasonNumber}/${epNumToUse}` : (customEmbedUrl || '')) },
            { id: 'vidsrc_io', name: 'HD-4: AniVerse Cloud (Sub)', embedUrl: animeMalId ? `https://vidsrc.io/embed/anime?mal=${animeMalId}&ep=${episodeNumber}` : (tmdbId ? `https://vidsrc.io/embed/tv/${tmdbId}/${seasonNumber}/${epNumToUse}` : (customEmbedUrl || '')) },
            { id: 'vidsrc_cc', name: 'HD-5: AniVerse Cinema (Sub)', embedUrl: animeMalId ? `https://vidsrc.cc/v2/embed/anime?mal=${animeMalId}&ep=${episodeNumber}` : (tmdbId ? `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${seasonNumber}/${epNumToUse}` : (customEmbedUrl || '')) },
            { id: 'autoembed', name: 'HD-6: AniVerse Auto (Sub)', embedUrl: animeMalId ? `https://player.autoembed.cc/embed/anime/${animeMalId}/${episodeNumber}` : (tmdbId ? `https://autoembed.co/tv/tmdb/${tmdbId}-${seasonNumber}-${epNumToUse}` : (customEmbedUrl || '')) }
        ];
        const dubServers = hasDub ? [
            ...(hasCustomVideoUrl ? [{ id: 'custom_source', name: 'HD-0: AniVerse Direct (English Dub)', embedUrl: customEmbedUrl }] : []),
            { id: 'vidsrc', name: 'HD-1: AniVerse Ultra (English Dub)', embedUrl: animeMalId ? `https://vidsrc.pm/embed/anime?mal=${animeMalId}&ep=${episodeNumber}&dub=1` : (tmdbId ? `https://vidsrc.pm/embed/tv/${tmdbId}/${seasonNumber}/${epNumToUse}?dub=1` : (customEmbedUrl || '')) },
            { id: 'vidsrc_me', name: 'HD-2: AniVerse Prime (English Dub)', embedUrl: animeMalId ? `https://vidsrc.net/embed/anime?mal=${animeMalId}&ep=${episodeNumber}&dub=1` : (tmdbId ? `https://vidsrc.net/embed/tv/${tmdbId}/${seasonNumber}/${epNumToUse}&dub=1` : (customEmbedUrl || '')) },
            { id: 'aniwave', name: 'HD-3: AniVerse Multi (English Dub)', embedUrl: aniwaveSlug ? `https://aniwaves.ru/watch/${aniwaveSlug}/ep-${episodeNumber}?lang=dub` : (animeMalId ? `https://vidsrc.io/embed/anime?mal=${animeMalId}&ep=${episodeNumber}&dub=1` : (tmdbId ? `https://vidsrc.io/embed/tv/${tmdbId}/${seasonNumber}/${epNumToUse}?dub=1` : (customEmbedUrl || ''))) },
            { id: 'vidsrc_io', name: 'HD-4: AniVerse Cloud (English Dub)', embedUrl: animeMalId ? `https://vidsrc.io/embed/anime?mal=${animeMalId}&ep=${episodeNumber}&dub=1` : (tmdbId ? `https://vidsrc.io/embed/tv/${tmdbId}/${seasonNumber}/${epNumToUse}?dub=1` : (customEmbedUrl || '')) },
            { id: 'vidsrc_cc', name: 'HD-5: AniVerse Cinema (English Dub)', embedUrl: animeMalId ? `https://vidsrc.cc/v2/embed/anime?mal=${animeMalId}&ep=${episodeNumber}&dub=1` : (tmdbId ? `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${seasonNumber}/${epNumToUse}&dub=1` : (customEmbedUrl || '')) },
            { id: 'autoembed', name: 'HD-6: AniVerse Auto (English Dub)', embedUrl: animeMalId ? `https://player.autoembed.cc/embed/anime/${animeMalId}/${episodeNumber}?dub=1` : (tmdbId ? `https://autoembed.co/tv/tmdb/${tmdbId}-${seasonNumber}-${epNumToUse}?dub=1` : (customEmbedUrl || '')) }
        ] : [];
        const hindiServers = hasHindi ? [
            ...(hasCustomVideoUrl ? [{ id: 'custom_source', name: 'HD-0: AniVerse Direct (Hindi)', embedUrl: customEmbedUrl }] : []),
            { id: 'vidsrc', name: 'HD-1: AniVerse Hindi (Ultra HD)', embedUrl: animeMalId ? `https://vidsrc.pm/embed/anime?mal=${animeMalId}&ep=${episodeNumber}&lang=hi` : (tmdbId ? `https://vidsrc.pm/embed/tv/${tmdbId}/${seasonNumber}/${epNumToUse}?lang=hi` : (customEmbedUrl || '')) },
            { id: 'vidsrc_me', name: 'HD-2: AniVerse Hindi (Prime)', embedUrl: animeMalId ? `https://vidsrc.net/embed/anime?mal=${animeMalId}&ep=${episodeNumber}&lang=hi` : (tmdbId ? `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${seasonNumber}&episode=${epNumToUse}&ds_lang=hi` : (customEmbedUrl || '')) },
            { id: 'vidsrc_io', name: 'HD-3: AniVerse Hindi (Cloud)', embedUrl: animeMalId ? `https://vidsrc.io/embed/anime?mal=${animeMalId}&ep=${episodeNumber}&lang=hi` : (tmdbId ? `https://vidsrc.io/embed/tv/${tmdbId}/${seasonNumber}/${epNumToUse}?lang=hi` : (customEmbedUrl || '')) },
            { id: 'vidsrc_cc', name: 'HD-4: AniVerse Hindi (Stream)', embedUrl: animeMalId ? `https://vidsrc.cc/v2/embed/anime?mal=${animeMalId}&ep=${episodeNumber}&lang=hi` : (tmdbId ? `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${seasonNumber}/${epNumToUse}?lang=hi` : (customEmbedUrl || '')) },
            { id: 'autoembed', name: 'HD-5: AniVerse Hindi (Auto)', embedUrl: animeMalId ? `https://player.autoembed.cc/embed/anime/${animeMalId}/${episodeNumber}&lang=hi` : (tmdbId ? `https://autoembed.co/tv/tmdb/${tmdbId}-${seasonNumber}-${epNumToUse}?lang=hi` : (customEmbedUrl || '')) }
        ] : [];
        const serversByAudio = {
            sub: subServers,
            ...(hasDub && dubServers.length > 0 ? { dub: dubServers } : {}),
            ...(hasHindi && hindiServers.length > 0 ? { hindi: hindiServers } : {})
        };
        const serverSources = serversByAudio[activeTranslation] || subServers;
        const currentServerObj = (hasCustomVideoUrl && (!animeMalId && !tmdbId))
            ? (serverSources.find(s => s.id === 'custom_source') || serverSources[0])
            : (serverSources.find(s => s.id === activeServer) || serverSources[0]);
        return res.status(200).json({
            embedUrl: currentServerObj.embedUrl,
            server: currentServerObj.id,
            lang: activeTranslation,
            isMovie: false,
            hasSub,
            hasDub,
            hasHindi,
            isMultiAudio: availableAudios.length > 1,
            availableAudios,
            servers: serverSources,
            serversByAudio
        });
    }
    catch (error) {
        console.error('Error fetching episode sources:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
/**
 * Resolves direct downloadable stream link or clean mirror for the selected episode & audio track
 */
async function downloadEpisode(req, res) {
    try {
        const { id, epNum } = req.params;
        const { lang } = req.query;
        const episodeNumber = parseInt(epNum, 10) || 1;
        const anime = await findOrCreateAnimeBySlugOrId(id);
        if (!anime) {
            return res.status(404).json({ error: 'Anime not found' });
        }
        const title = anime.title || 'Anime';
        const hasDub = checkIfAnimeHasDub(anime);
        const hasHindi = checkIfAnimeHasHindi(anime);
        let audioTrack = 'SUB';
        if (lang?.toLowerCase() === 'dub' && hasDub) {
            audioTrack = 'DUB';
        }
        else if (lang?.toLowerCase() === 'hindi' && hasHindi) {
            audioTrack = 'HINDI';
        }
        const cleanTitle = title.replace(/[^\w\s-]/gi, '').trim().replace(/\s+/g, '_');
        const filename = `${cleanTitle}_Ep${episodeNumber}_[${audioTrack}].mp4`;
        // 1. Check if DB episode has custom direct video URL for requested audio
        const currentEp = anime.episodes?.find((e) => e.episodeNumber === episodeNumber);
        let directUrl = '';
        if (audioTrack === 'DUB') {
            directUrl = currentEp?.dubVideoUrl || currentEp?.videoUrl || '';
        }
        else if (audioTrack === 'HINDI') {
            directUrl = currentEp?.hindiVideoUrl || '';
        }
        else {
            directUrl = currentEp?.videoUrl || '';
        }
        // If custom URL is a direct media file (mp4, webm, m3u8), local upload, or sample video:
        if (directUrl && (/\.(mp4|webm|m3u8)(\?|$)/i.test(directUrl) || directUrl.includes('commondatastorage.googleapis.com') || directUrl.startsWith('/uploads/'))) {
            const proxyDownloadUrl = `/api/anime/download-file?url=${encodeURIComponent(directUrl)}&filename=${encodeURIComponent(filename)}`;
            return res.status(200).json({
                success: true,
                downloadUrl: proxyDownloadUrl,
                directMediaUrl: directUrl,
                filename,
                audioTrack,
                isDirect: true
            });
        }
        // 2. Build download source based on requested audio track & Aniwave mirror
        let aniwaveSlug = exports.ANIWAVE_SLUG_MAP[anime.slug] || '';
        if (!aniwaveSlug) {
            const matchKey = Object.keys(exports.ANIWAVE_SLUG_MAP).find(k => anime.slug.includes(k) || k.includes(anime.slug));
            if (matchKey)
                aniwaveSlug = exports.ANIWAVE_SLUG_MAP[matchKey];
        }
        let resolvedDownloadUrl = '';
        if (audioTrack === 'DUB') {
            resolvedDownloadUrl = aniwaveSlug
                ? `https://aniwaves.ru/watch/${aniwaveSlug}/ep-${episodeNumber}?lang=dub`
                : (anime.malId ? `https://vidsrc.pm/embed/anime?mal=${anime.malId}&ep=${episodeNumber}&dub=1` : directUrl);
        }
        else if (audioTrack === 'HINDI') {
            resolvedDownloadUrl = anime.malId
                ? `https://vidsrc.pm/embed/anime?mal=${anime.malId}&ep=${episodeNumber}&lang=hi`
                : directUrl;
        }
        else {
            resolvedDownloadUrl = aniwaveSlug
                ? `https://aniwaves.ru/watch/${aniwaveSlug}/ep-${episodeNumber}?lang=sub`
                : (anime.malId ? `https://vidsrc.pm/embed/anime?mal=${anime.malId}&ep=${episodeNumber}&sub=1` : directUrl);
        }
        if (!resolvedDownloadUrl) {
            resolvedDownloadUrl = `https://autoembed.co/anime/${anime.slug}/${episodeNumber}`;
        }
        return res.status(200).json({
            success: true,
            downloadUrl: resolvedDownloadUrl,
            filename,
            audioTrack,
            isDirect: false
        });
    }
    catch (error) {
        console.error('Error in downloadEpisode:', error);
        return res.status(500).json({ error: 'Failed to generate episode download' });
    }
}
/**
 * Proxy streaming download endpoint: Forces immediate browser file download with proper Content-Disposition
 */
async function downloadFileProxy(req, res) {
    try {
        const { url, filename } = req.query;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: 'URL parameter is required' });
        }
        const cleanFilename = typeof filename === 'string' && filename.trim()
            ? filename.trim().replace(/[^\w\s\.-]/gi, '_')
            : 'anime_episode.mp4';
        // Local uploads check
        if (url.startsWith('/uploads/')) {
            const filePath = path_1.default.join(__dirname, '..', '..', url.replace(/^\//, ''));
            if (fs_1.default.existsSync(filePath)) {
                return res.download(filePath, cleanFilename);
            }
        }
        // Stream remote video file with attachment headers
        const remoteStream = await (0, axios_1.default)({
            method: 'GET',
            url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 30000
        });
        res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
        const cType = remoteStream.headers['content-type'];
        if (cType) {
            res.setHeader('Content-Type', String(cType));
        }
        else {
            res.setHeader('Content-Type', 'video/mp4');
        }
        const cLen = remoteStream.headers['content-length'];
        if (cLen) {
            res.setHeader('Content-Length', String(cLen));
        }
        remoteStream.data.pipe(res);
    }
    catch (err) {
        console.error('Error in downloadFileProxy:', err.message);
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to download file stream' });
        }
    }
}
