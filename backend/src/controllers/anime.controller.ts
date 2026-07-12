import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      where.type = type as string;
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
      take: 10,
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
    let targetEpCount = anime.episodes.length;
    const titleLower = anime.title.toLowerCase();
    if (anime.malId === 21 || titleLower.includes('one piece')) {
      targetEpCount = 1168;
    } else if (anime.malId === 1735 || titleLower === 'naruto shippuden') {
      targetEpCount = 500;
    } else if (anime.malId === 20 || titleLower === 'naruto') {
      targetEpCount = 220;
    } else if (titleLower.includes('boruto')) {
      targetEpCount = 293;
    } else if (anime.malId === 269 || (titleLower === 'bleach' && !titleLower.includes('thousand'))) {
      targetEpCount = 366;
    } else if (anime.malId === 11061 || titleLower.includes('hunter x hunter')) {
      targetEpCount = 148;
    } else if (titleLower.includes('fullmetal alchemist')) {
      targetEpCount = 64;
    } else if (titleLower.includes('death note')) {
      targetEpCount = 37;
    } else if (titleLower.includes('code geass')) {
      targetEpCount = 25;
    } else if (titleLower.includes('my hero academia') && !titleLower.includes('season')) {
      targetEpCount = 25;
    } else if (titleLower.includes('demon slayer') && titleLower.includes('entertainment')) {
      targetEpCount = 11;
    } else if (titleLower.includes('demon slayer') && titleLower.includes('swordsmith')) {
      targetEpCount = 11;
    } else if (titleLower.includes('demon slayer') && !titleLower.includes('mugen') && !titleLower.includes('hashira')) {
      targetEpCount = 26;
    } else if (titleLower.includes('jujutsu kaisen') && !titleLower.includes('0')) {
      targetEpCount = 24;
    } else if (titleLower.includes('classroom of the elite') && !titleLower.includes('season')) {
      targetEpCount = 12;
    }

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
    let seasons: any[] = [];
    // Use franchiseKeyword for grouping instead of a simple prefix split
    let seasonSearchKey = franchiseKeyword;
    // For Boruto, search for Boruto specifically (not all Naruto entries)
    if (anime.title.includes('Boruto')) seasonSearchKey = 'Boruto';

    if (seasonSearchKey && seasonSearchKey.length > 2) {
      const siblings = await prisma.anime.findMany({
        where: {
          OR: [
            { title: { contains: seasonSearchKey } },
            { englishTitle: { contains: seasonSearchKey } }
          ],
          // Exclude movies from seasons list
          NOT: { type: 'MOVIE' }
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
            slug: sibling.slug
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
    let targetEpCount = 12; // default fallback limit
    const titleLower = anime.title.toLowerCase();
    if (anime.malId === 21 || titleLower.includes('one piece')) {
      targetEpCount = 1168;
    } else if (anime.malId === 1735 || titleLower === 'naruto shippuden') {
      targetEpCount = 500;
    } else if (anime.malId === 20 || titleLower === 'naruto') {
      targetEpCount = 220;
    } else if (titleLower.includes('boruto')) {
      targetEpCount = 293;
    } else if (anime.malId === 269 || (titleLower === 'bleach' && !titleLower.includes('thousand'))) {
      targetEpCount = 366;
    } else if (anime.malId === 11061 || titleLower.includes('hunter x hunter')) {
      targetEpCount = 148;
    } else if (titleLower.includes('fullmetal alchemist')) {
      targetEpCount = 64;
    } else if (titleLower.includes('death note')) {
      targetEpCount = 37;
    } else if (titleLower.includes('code geass')) {
      targetEpCount = 25;
    } else if (titleLower.includes('my hero academia') && !titleLower.includes('season')) {
      targetEpCount = 25;
    } else if (titleLower.includes('demon slayer') && titleLower.includes('entertainment')) {
      targetEpCount = 11;
    } else if (titleLower.includes('demon slayer') && titleLower.includes('swordsmith')) {
      targetEpCount = 11;
    } else if (titleLower.includes('demon slayer') && !titleLower.includes('mugen') && !titleLower.includes('hashira')) {
      targetEpCount = 26;
    } else if (titleLower.includes('jujutsu kaisen') && !titleLower.includes('0')) {
      targetEpCount = 24;
    } else if (titleLower.includes('classroom of the elite') && !titleLower.includes('season')) {
      targetEpCount = 12;
    }

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
