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

    const resData = (await response.json()) as any;
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

    const resData = (await response.json()) as any;
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

async function getDynamicEpisodeCount(title: string, malId: number | null, dbCount: number, type?: string): Promise<number> {
  if (type && (type.toUpperCase() === 'MOVIE' || type.toUpperCase() === 'SPECIAL')) {
    return 1;
  }
  const titleLower = title.toLowerCase();
  if (titleLower.includes('movie') || titleLower.includes('film') || titleLower.includes('gekijouban')) {
    return 1;
  }
  
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

    const title = anime.title || '';
    const slug = anime.slug || '';
    const activeServer = (server as string)?.toLowerCase() || 'vidplay';
    const activeTranslation = (lang as string)?.toLowerCase() || 'sub';
    const isHindi = activeTranslation === 'hindi' || activeServer === 'raretoon';
    const isDub = activeTranslation === 'dub';

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

    // ==========================================
    // 1. MOVIE TMDB MAPPINGS & DETECTION
    // ==========================================
    const MAL_TO_MOVIE_TMDB: Record<number, number> = {
      48561: 810693, // Jujutsu Kaisen 0
      40456: 635302, // Demon Slayer: Mugen Train (Movie)
      50410: 900667, // One Piece Film: Red
      38234: 568012, // One Piece: Stampede
      31490: 384792, // One Piece Film: Gold
      12859: 148386, // One Piece Film: Z
      4155: 24420,   // One Piece: Strong World
      36946: 503314, // Dragon Ball Super: Broly
      48903: 610150, // Dragon Ball Super: Super Hero
      14837: 126963, // Dragon Ball Z: Battle of Gods
      25389: 303857, // Dragon Ball Z: Resurrection 'F'
      32281: 372058, // Your Name. (Kimi no Na wa.)
      50594: 916224, // Suzume
      38826: 568160, // Weathering with You (Tenki no Ko)
      28851: 378064, // A Silent Voice (Koe no Katachi)
      199: 129,      // Spirited Away
      431: 4935,     // Howl's Moving Castle
      164: 128,      // Princess Mononoke
      523: 8392,     // My Neighbor Totoro
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
      47: 149,       // Akira
      43: 9323,      // Ghost in the Shell
      102: 10494,    // Perfect Blue
      25537: 399404, // Fate/stay night: Heaven's Feel I. presage flower
      33049: 514593, // Fate/stay night: Heaven's Feel II. lost butterfly
      33050: 514594, // Fate/stay night: Heaven's Feel III. spring song
      2759: 18491,   // Evangelion: 1.0 You Are (Not) Alone
      3784: 18492,   // Evangelion: 2.0 You Can (Not) Advance
      3785: 43764,   // Evangelion: 3.0 You Can (Not) Redo
      3786: 283566,  // Evangelion: 3.0+1.0 Thrice Upon a Time
      36896: 505262, // My Hero Academia: Two Heroes
      39565: 592350, // My Hero Academia: Heroes Rising
      44200: 768744, // My Hero Academia: World Heroes' Mission
      55798: 1159311,// My Hero Academia: You're Next
      52742: 1012201,// Haikyu!! The Dumpster Battle
      53887: 1062807,// Spy x Family Code: White
      57555: 1219685,// Chainsaw Man - The Movie: Reze Arc
      54865: 1134433,// Blue Lock: Episode Nagi
      38329: 572154, // Rascal Does Not Dream of a Dreaming Girl
      578: 12477,    // Grave of the Fireflies
      1689: 38142,   // 5 Centimeters per Second
      16782: 198370, // The Garden of Words
      1987: 4977,    // Paprika
      5681: 26519,   // Summer Wars
      12355: 110420, // Wolf Children
      2236: 14069,   // The Girl Who Leapt Through Time
      58272: 1244857 // Look Back
    };

    const MOVIE_SLUG_TMDB_MAP: Record<string, number> = {
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

    const isExplicitMovieType = anime.type?.toUpperCase() === 'MOVIE';
    const isMovieByMal = Boolean(anime.malId && MAL_TO_MOVIE_TMDB[anime.malId]);
    const isMovieBySlug = Boolean(MOVIE_SLUG_TMDB_MAP[slug] || Object.keys(MOVIE_SLUG_TMDB_MAP).find(k => slug.includes(k)));
    const isMovieByTitle = /\b(movie|film|gekijouban)\b/i.test(title) || /\b(movie|film)\b/i.test(slug);
    const isMovie = Boolean(isExplicitMovieType || isMovieByMal || isMovieBySlug || isMovieByTitle);

    let embedUrl = '';

    if (isMovie) {
      let movieTmdbId = 810693; // default JJK 0
      if (anime.malId && MAL_TO_MOVIE_TMDB[anime.malId]) {
        movieTmdbId = MAL_TO_MOVIE_TMDB[anime.malId];
      } else if (MOVIE_SLUG_TMDB_MAP[slug]) {
        movieTmdbId = MOVIE_SLUG_TMDB_MAP[slug];
      } else {
        const found = Object.entries(MOVIE_SLUG_TMDB_MAP).find(([k]) => slug.includes(k));
        if (found) {
          movieTmdbId = found[1];
        } else if (anime.malId) {
          movieTmdbId = anime.malId;
        }
      }

      if (activeServer === 'vidplay') {
        embedUrl = `https://vidsrc.me/embed/movie?tmdb=${movieTmdbId}${isHindi ? '&ds_lang=hi&audio=hi&dub=1' : isDub ? '&dub=1&audio=en&ds_lang=en' : ''}`;
      } else if (activeServer === 'datsav') {
        embedUrl = `https://vidsrc.pm/embed/movie/${movieTmdbId}${isHindi ? '?lang=hi&audio=hi&dub=1' : isDub ? '?dub=1&lang=en&audio=en' : ''}`;
      } else if (activeServer === 'byfms' || activeServer === 'mycloud') {
        embedUrl = `https://2embed.cc/embed/movie/${movieTmdbId}${isHindi ? '?lang=hi&audio=hi' : isDub ? '?dub=1&audio=en&lang=en' : ''}`;
      } else if (activeServer === 'raretoon') {
        embedUrl = `https://multiembed.mov/?video_id=${movieTmdbId}&tmdb=1&lang=hi`;
      } else {
        // dghg / autoembed / default
        embedUrl = `https://player.autoembed.cc/embed/movie/${movieTmdbId}${isHindi ? '?lang=hi&audio=hi&dub=1' : isDub ? '?dub=1&lang=en&audio=en' : ''}`;
      }

      return res.status(200).json({
        embedUrl,
        server: activeServer,
        lang: activeTranslation,
        isMovie: true
      });
    }

    // ==========================================
    // 2. TV SERIES TMDB MAPPINGS & DETECTION
    // ==========================================
    let seasonNumber = 1;
    const seasonMatch = title.match(/Season\s+(\d+)/i) || slug.match(/season-(\d+)/i);
    const ndSeasonMatch = title.match(/(\d+)(st|nd|rd|th)\s+Season/i) || slug.match(/(\d+)(st|nd|rd|th)-season/i);
    const partMatch = title.match(/Part\s+(\d+)/i) || slug.match(/part-(\d+)/i);
    const romanMatch = title.match(/\s+(II|III|IV|V|VI)\b/i) || slug.match(/-(ii|iii|iv|v|vi)$/i);

    if (seasonMatch) {
      seasonNumber = parseInt(seasonMatch[1], 10);
    } else if (ndSeasonMatch) {
      seasonNumber = parseInt(ndSeasonMatch[1], 10);
    } else if (partMatch) {
      seasonNumber = parseInt(partMatch[1], 10);
    } else if (/final\s*season/i.test(title) || /final-season/i.test(slug)) {
      seasonNumber = 4; // Attack on Titan Final Season
    } else if (/entertainment\s*district/i.test(title) || /entertainment-district/i.test(slug)) {
      seasonNumber = 2; // Demon Slayer S2
    } else if (/swordsmith\s*village/i.test(title) || /swordsmith-village/i.test(slug)) {
      seasonNumber = 3; // Demon Slayer S3
    } else if (/hashira\s*training/i.test(title) || /hashira-training/i.test(slug)) {
      seasonNumber = 4; // Demon Slayer S4
    } else if (/mugen\s*train/i.test(title) || /mugen-train/i.test(slug)) {
      seasonNumber = 2;
    } else if (romanMatch) {
      const val = (romanMatch[1] || '').toUpperCase();
      if (val === 'II') seasonNumber = 2;
      else if (val === 'III') seasonNumber = 3;
      else if (val === 'IV') seasonNumber = 4;
      else if (val === 'V') seasonNumber = 5;
      else if (val === 'VI') seasonNumber = 6;
    }

    const FRANCHISE_TMDB_MAP: Record<string, number> = {
      'one-piece': 37854,
      'naruto': 46260,
      'naruto-shippuden': 31910,
      'boruto': 70881,
      'boruto-naruto-next-generations': 70881,
      'bleach': 30984,
      'bleach-thousand-year-blood-war': 30984,
      'shingeki-no-kyojin': 1429,
      'attack-on-titan': 1429,
      'jujutsu-kaisen': 95479,
      'kimetsu-no-yaiba': 85937,
      'demon-slayer': 85937,
      'demon-slayer-kimetsu-no-yaiba': 85937,
      'my-hero-academia': 65930,
      'boku-no-hero-academia': 65930,
      'solo-leveling': 209867,
      'death-note': 13916,
      'hunter-x-hunter': 46298,
      'hunter-x-hunter-2011': 46298,
      'fullmetal-alchemist-brotherhood': 31911,
      'fullmetal-alchemist': 31911,
      'black-clover': 73223,
      'dragon-ball-z': 12971,
      'dragon-ball-super': 62710,
      'dragon-ball': 12696,
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

    const MAL_TO_SEASON_INFO: Record<number, { tmdbId: number; seasonNumber: number }> = {
      // Jujutsu Kaisen
      40748: { tmdbId: 95479, seasonNumber: 1 },
      51009: { tmdbId: 95479, seasonNumber: 2 },
      // Attack on Titan
      16498: { tmdbId: 1429, seasonNumber: 1 },
      25777: { tmdbId: 1429, seasonNumber: 2 },
      35760: { tmdbId: 1429, seasonNumber: 3 },
      38524: { tmdbId: 1429, seasonNumber: 3 },
      40028: { tmdbId: 1429, seasonNumber: 4 },
      48583: { tmdbId: 1429, seasonNumber: 4 },
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
      // One Punch Man
      30276: { tmdbId: 63926, seasonNumber: 1 },
      34134: { tmdbId: 63926, seasonNumber: 2 },
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
      52299: { tmdbId: 209867, seasonNumber: 1 },
      58567: { tmdbId: 209867, seasonNumber: 2 },
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
      57334: { tmdbId: 240411, seasonNumber: 1 }
    };

    let tmdbId = 37854; // Default One Piece

    if (anime.malId && MAL_TO_SEASON_INFO[anime.malId]) {
      tmdbId = MAL_TO_SEASON_INFO[anime.malId].tmdbId;
      seasonNumber = MAL_TO_SEASON_INFO[anime.malId].seasonNumber;
    } else {
      let cleanSlug = slug
        .replace(/-(season-\d+|the-final-season|final-season|\d+(st|nd|rd|th)-season|part-\d+|ii|iii|iv|v|vi)$/i, '')
        .replace(/-(tv|entertainment-district-arc|swordsmith-village-arc|hashira-training-arc|mugen-train-arc)$/i, '')
        .trim();

      if (FRANCHISE_TMDB_MAP[slug]) {
        tmdbId = FRANCHISE_TMDB_MAP[slug];
      } else if (FRANCHISE_TMDB_MAP[cleanSlug]) {
        tmdbId = FRANCHISE_TMDB_MAP[cleanSlug];
      } else {
        for (const [key, id] of Object.entries(FRANCHISE_TMDB_MAP)) {
          if (slug.includes(key) || cleanSlug.includes(key)) {
            tmdbId = id;
            break;
          }
        }
      }
    }

    if (activeServer === 'vidplay') {
      embedUrl = `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${seasonNumber}&episode=${epNumToUse}${isHindi ? '&ds_lang=hi&audio=hi&dub=1' : isDub ? '&dub=1&audio=en&ds_lang=en' : ''}`;
    } else if (activeServer === 'datsav') {
      embedUrl = `https://vidsrc.pm/embed/tv/${tmdbId}/${seasonNumber}/${epNumToUse}${isHindi ? '?lang=hi&audio=hi&dub=1' : isDub ? '?dub=1&lang=en&audio=en' : ''}`;
    } else if (activeServer === 'byfms' || activeServer === 'mycloud') {
      embedUrl = `https://2embed.cc/embed/tv/${tmdbId}/${seasonNumber}/${epNumToUse}${isHindi ? '?lang=hi&audio=hi' : isDub ? '?dub=1&audio=en&lang=en' : ''}`;
    } else if (activeServer === 'raretoon') {
      embedUrl = `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${seasonNumber}&e=${epNumToUse}&lang=hi`;
    } else {
      // dghg / autoembed / default
      embedUrl = `https://player.autoembed.cc/embed/tv/${tmdbId}/${seasonNumber}/${epNumToUse}${isHindi ? '?lang=hi&audio=hi&dub=1' : isDub ? '?dub=1&lang=en&audio=en' : ''}`;
    }

    return res.status(200).json({
      embedUrl,
      server: activeServer,
      lang: activeTranslation,
      isMovie: false
    });
  } catch (error: any) {
    console.error('Error fetching episode sources:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
