import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getAllAnime(req: Request, res: Response) {
  try {
    const { search, genre, type, status, year, limit, page } = req.query;

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
