import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function autoHealMalId(animeId: string, title: string): Promise<number | null> {
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

    if (!response.ok) return null;
    const resData = await response.json() as any;
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
  } catch (err) {
    console.error(`[Auto-Heal] Failed to resolve malId for "${title}":`, err);
    return null;
  }
}

async function fetchSeasonsFromAniList(searchKey: string): Promise<any[]> {
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

    if (!response.ok) return [];
    const data = await response.json() as any;
    const mediaList = data?.data?.Page?.media || [];
    return mediaList;
  } catch (err) {
    console.error('Error fetching seasons from AniList:', err);
    return [];
  }
}

async function findOrCreateAnimeBySlugOrId(idOrSlug: string): Promise<any | null> {
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
  if (isUuid) return null;

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
            Media(search: $search, type: ANIME) {
              idMal
              title {
                romaji
                english
                native
              }
              description
              bannerImage
              coverImage {
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
        `,
        variables: { search: searchQuery }
      })
    });

    if (!response.ok) {
      console.error(`AniList search for "${searchQuery}" failed:`, response.statusText);
      return null;
    }

    const resData = (await response.json()) as any;
    const media = resData?.data?.Media;
    if (!media) {
      console.log(`AniList returned no media for search: "${searchQuery}"`);
      return null;
    }

    const animeTitle = media.title.english || media.title.romaji || media.title.native;
    const resolvedSlug = slugify(animeTitle);

    // Double check if resolvedSlug exists in DB to prevent duplicates
    let existingAnime = await prisma.anime.findUnique({
      where: { slug: resolvedSlug },
      include: { episodes: { orderBy: { episodeNumber: 'asc' } } }
    });
    if (existingAnime) {
      return existingAnime;
    }

    const cleanedDescription = media.description ? media.description.replace(/<[^>]*>/g, '') : 'No description available.';
    let status = 'Finished Airing';
    if (media.status === 'RELEASING') {
      status = 'Currently Airing';
    } else if (media.status === 'NOT_YET_RELEASED') {
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
        bannerImage: media.bannerImage || media.coverImage?.large,
        posterImage: media.coverImage?.large,
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
    const targetEpCount = await getDynamicEpisodeCount(newAnime.title, newAnime.malId, 12);
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
  } catch (err: any) {
    console.error(`Failed to dynamically fetch/create anime with slug "${idOrSlug}":`, err);
    return null;
  }
}

async function searchAndImportFromAniList(searchQuery: string): Promise<any | null> {
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
            Media(search: $search, type: ANIME) {
              idMal
              title {
                romaji
                english
                native
              }
              description
              bannerImage
              coverImage {
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
        `,
        variables: { search: searchQuery }
      })
    });

    if (!response.ok) {
      console.error(`AniList search for "${searchQuery}" failed:`, response.statusText);
      return null;
    }

    const resData = (await response.json()) as any;
    const media = resData?.data?.Media;
    if (!media) {
      console.log(`AniList returned no media for search: "${searchQuery}"`);
      return null;
    }

    const animeTitle = media.title.english || media.title.romaji || media.title.native;
    const resolvedSlug = slugify(animeTitle);

    // Double check if resolvedSlug exists in DB to prevent duplicates
    let existingAnime = await prisma.anime.findUnique({
      where: { slug: resolvedSlug }
    });
    if (existingAnime) {
      return existingAnime;
    }

    const cleanedDescription = media.description ? media.description.replace(/<[^>]*>/g, '') : 'No description available.';
    let status = 'Finished Airing';
    if (media.status === 'RELEASING') {
      status = 'Currently Airing';
    } else if (media.status === 'NOT_YET_RELEASED') {
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
        bannerImage: media.bannerImage || media.coverImage?.large,
        posterImage: media.coverImage?.large,
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
    const targetEpCount = await getDynamicEpisodeCount(newAnime.title, newAnime.malId, 12);
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
  } catch (err: any) {
    console.error(`Failed to dynamically fetch/create anime with search query "${searchQuery}":`, err);
    return null;
  }
}

async function getAiredEpisodeCountFromAniList(malId: number): Promise<number | null> {
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
    
    if (!response.ok) return null;
    const resJson = (await response.json()) as any;
    const media = resJson.data?.Media;
    if (!media) return null;

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
  } catch (err) {
    console.error('Error fetching aired episode count from AniList:', err);
    return null;
  }
}

async function getDynamicEpisodeCount(title: string, malId: number | null, dbCount: number): Promise<number> {
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
  if (malId === 1735 || titleLower === 'naruto shippuden') return 500;
  if (malId === 20 || titleLower === 'naruto') return 220;
  if (titleLower.includes('boruto')) return 293;
  if (malId === 269 || (titleLower === 'bleach' && !titleLower.includes('thousand'))) return 366;
  if (malId === 11061 || titleLower.includes('hunter x hunter')) return 148;
  if (titleLower.includes('fullmetal alchemist')) return 64;
  if (titleLower.includes('death note')) return 37;
  if (titleLower.includes('code geass')) return 25;
  if (titleLower.includes('my hero academia') && !titleLower.includes('season')) return 25;
  if (titleLower.includes('demon slayer') && titleLower.includes('entertainment')) return 11;
  if (titleLower.includes('demon slayer') && titleLower.includes('swordsmith')) return 11;
  if (titleLower.includes('demon slayer') && !titleLower.includes('mugen') && !titleLower.includes('hashira')) return 26;
  if (titleLower.includes('jujutsu kaisen') && !titleLower.includes('0')) return 24;
  if (titleLower.includes('classroom of the elite') && !titleLower.includes('season')) return 12;

  return Math.max(dbCount, 12);
}

export async function getAllAnime(req: Request, res: Response) {
  try {
    const { search, genre, type, status, year, limit, page, letter, sort } = req.query;

    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 20;
    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { englishTitle: { contains: search as string } },
      ];
    }

    if (genre) {
      where.genres = { contains: genre as string };
    }

    if (type) {
      where.type = (type as string).toUpperCase();
    }

    if (status) {
      where.status = status as string;
    }

    if (year) {
      where.releasedYear = parseInt(year as string);
    }

    if (letter) {
      const char = letter as string;
      if (char === '#') {
        where.OR = [
          { title: { lte: '9', gte: '0' } }
        ];
      } else {
        where.OR = [
          { title: { startsWith: char } },
          { englishTitle: { startsWith: char } },
        ];
      }
    }

    let orderBy: any = { score: 'desc' };
    if (sort === 'latest') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'updated') {
      orderBy = { updatedAt: 'desc' };
    } else if (sort === 'year') {
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
  } catch (error: any) {
    console.error('Error fetching anime list:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getTrendingAnime(_req: Request, res: Response) {
  try {
    const trending = await prisma.anime.findMany({
      where: { isTrending: true },
      take: 10,
      orderBy: { score: 'desc' },
    });
    return res.status(200).json({ trending });
  } catch (error: any) {
    console.error('Error fetching trending anime:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getPopularAnime(_req: Request, res: Response) {
  try {
    const popular = await prisma.anime.findMany({
      where: { isPopular: true },
      take: 10,
      orderBy: { score: 'desc' },
    });
    return res.status(200).json({ popular });
  } catch (error: any) {
    console.error('Error fetching popular anime:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getTopTenAnime(_req: Request, res: Response) {
  try {
    const topTen = await prisma.anime.findMany({
      take: 30,
      orderBy: { score: 'desc' },
    });
    return res.status(200).json({ topTen });
  } catch (error: any) {
    console.error('Error fetching top ten anime:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getAnimeDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const anime = await findOrCreateAnimeBySlugOrId(id);

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
      
      const existingEpNums = new Set(anime.episodes.map((e: any) => e.episodeNumber));
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
      (anime as any).episodes = episodesWithDub;
    } else {
      const isAiring = anime.status === 'Currently Airing';
      const episodesWithDub = anime.episodes.map((ep: any) => {
        let epHasDub = true;
        if (isAiring && ep.episodeNumber >= targetEpCount - 1) {
          epHasDub = false;
        }
        return {
          ...ep,
          hasDub: epHasDub
        };
      });
      (anime as any).episodes = episodesWithDub;
    }

    // Get related anime (franchise movies/specials first, then genre fallback)
    let franchiseKeyword = anime.title.split(':')[0].split(' ')[0].trim();
    if (anime.title.includes('One Piece')) franchiseKeyword = 'One Piece';
    else if (anime.title.includes('Naruto') || anime.title.includes('Boruto')) franchiseKeyword = 'Naruto';
    else if (anime.title.toLowerCase().includes('bleach')) franchiseKeyword = 'Bleach';
    else if (anime.title.includes('Demon Slayer') || anime.title.includes('Kimetsu')) franchiseKeyword = 'Demon Slayer';
    else if (anime.title.includes('My Hero Academia')) franchiseKeyword = 'My Hero Academia';
    else if (anime.title.toLowerCase().includes('jujutsu kaisen')) franchiseKeyword = 'JUJUTSU KAISEN';
    else if (anime.title.includes('Classroom of the Elite')) franchiseKeyword = 'Classroom of the Elite';

    let related = await prisma.anime.findMany({
      where: {
        id: { not: anime.id },
        title: { contains: franchiseKeyword },
      },
      take: 8,
    });

    if (related.length < 8) {
      const genresList = anime.genres.split(',').map((g: string) => g.trim());
      const genreConditions = genresList.map((genre: string) => ({
        genres: { contains: genre },
      }));
      const existingIds = new Set(related.map((r: any) => r.id));

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
    let seasons: any[] = [];
    // Use franchiseKeyword for grouping instead of a simple prefix split
    let seasonSearchKey = franchiseKeyword;
    // For Boruto, search for Boruto specifically (not all Naruto entries)
    if (anime.title.includes('Boruto')) seasonSearchKey = 'Boruto';

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
      const seasonsMap = new Map<string, any>();

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
          const alreadyExists = Array.from(seasonsMap.values()).some((s: any) => 
            s.slug === generatedSlug || (s.malId && ext.idMal && s.malId === ext.idMal)
          );

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

    return res.status(200).json({ anime, related, seasons });
  } catch (error: any) {
    console.error('Error fetching anime detail:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getEpisodeDetail(req: Request, res: Response) {
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
  } catch (error: any) {
    console.error('Error fetching episode detail:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getAutocompleteSuggestions(req: Request, res: Response) {
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
  } catch (error: any) {
    console.error('Error autocomplete query:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getAllGenres(_req: Request, res: Response) {
  try {
    const anime = await prisma.anime.findMany({ select: { genres: true } });
    const genresSet = new Set<string>();
    anime.forEach((a) => {
      a.genres.split(',').forEach((g) => genresSet.add(g.trim()));
    });
    return res.status(200).json({ genres: Array.from(genresSet).sort() });
  } catch (error: any) {
    console.error('Error fetching genres list:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function getEpisodeSources(req: Request, res: Response) {
  try {
    const { id, epNum } = req.params;
    const { server, lang } = req.query;

    const episodeNumber = parseInt(epNum);
    const anime = await findOrCreateAnimeBySlugOrId(id);
    if (!anime) {
      return res.status(404).json({ error: 'Anime not found' });
    }

    let malId = anime.malId || 21; // Fallback to One Piece
    let epNumToUse = episodeNumber;

    // Bleach TYBW offsets
    if (malId === 45576) {
      malId = 269;
      epNumToUse = episodeNumber + 366;
    } else if (malId === 53998) {
      malId = 269;
      epNumToUse = episodeNumber + 379;
    } else if (malId === 56206) {
      malId = 269;
      epNumToUse = episodeNumber + 392;
    }

    let embedUrl = '';
    const activeServer = server || 'vidplay';
    const activeTranslation = lang || 'sub';

    if (activeServer === 'vidplay') {
      embedUrl = `https://vidsrc.to/embed/anime/${malId}/${epNumToUse}`;
    } else if (activeServer === 'mycloud') {
      embedUrl = `https://embed.su/embed/anime/${malId}/${epNumToUse}`;
    } else if (activeServer === 'filemoon') {
      embedUrl = `https://vidlink.pro/embed/anime/${malId}/${epNumToUse}`;
    }

    return res.status(200).json({
      embedUrl,
      server: activeServer,
      lang: activeTranslation
    });
  } catch (error: any) {
    console.error('Error fetching episode sources:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
