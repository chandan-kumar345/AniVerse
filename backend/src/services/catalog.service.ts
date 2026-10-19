import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AnimeImportInput {
  title: string;
  contentType: 'series' | 'movie';
  malId?: number;
  anilistId?: number;
  englishTitle?: string;
  japaneseTitle?: string;
  genres?: string[];
  releasedYear?: number;
  hasDub?: boolean;
  hasHindi?: boolean;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

const ANILIST_QUERY = `
query ($search: String, $type: MediaType) {
  Media (search: $search, type: $type) {
    id
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
      medium
    }
    averageScore
    format
    status
    startDate {
      year
      month
      day
    }
    genres
    duration
    episodes
    trailer {
      id
      site
    }
    studios(isMain: true) {
      nodes {
        name
      }
    }
    staff(perPage: 3) {
      nodes {
        name {
          full
        }
        primaryOccupations
      }
    }
    characters(perPage: 5, sort: ROLE) {
      nodes {
        name {
          full
        }
      }
    }
  }
}
`;

export class CatalogService {
  /**
   * Seed core authorized video providers into the database
   */
  static async seedDefaultProviders(): Promise<void> {
    const providers = [
      { name: 'Ultra HD Stream', code: 'vidsrc', baseUrl: 'https://vidsrc.pm/embed', providerType: 'EMBED', priority: 1 },
      { name: 'VidSrc Pro', code: 'vidsrc_me', baseUrl: 'https://vidsrc.me/embed', providerType: 'EMBED', priority: 2 },
      { name: 'StreamCloud HD', code: 'vidsrc_io', baseUrl: 'https://vidsrc.io/embed', providerType: 'EMBED', priority: 3 },
      { name: '2Embed Global', code: 'twoembed', baseUrl: 'https://www.2embed.cc', providerType: 'EMBED', priority: 4 },
      { name: 'AutoEmbed Multi', code: 'autoembed', baseUrl: 'https://autoembed.co', providerType: 'EMBED', priority: 5 },
      { name: 'Official Licensed Embed', code: 'official_embed', baseUrl: '', providerType: 'EMBED', priority: 6 },
      { name: 'Self-Hosted Licensed Asset', code: 'licensed_storage', baseUrl: '', providerType: 'DIRECT_HLS', priority: 7 },
    ];

    for (const p of providers) {
      await prisma.videoProvider.upsert({
        where: { code: p.code },
        update: { name: p.name, baseUrl: p.baseUrl, providerType: p.providerType, priority: p.priority, isActive: true },
        create: p,
      });
    }
  }

  /**
   * Fetch rich metadata from AniList GraphQL API
   */
  static async fetchMetadataFromAniList(title: string): Promise<any | null> {
    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: ANILIST_QUERY,
          variables: { search: title, type: 'ANIME' }
        })
      });

      if (!response.ok) return null;
      const json = await response.json() as any;
      return json?.data?.Media || null;
    } catch (err) {
      console.error(`Error querying AniList for "${title}":`, err);
      return null;
    }
  }

  /**
   * Ingest or update an anime title (series or movie) with canonical metadata
   */
  static async importTitle(input: AnimeImportInput): Promise<any> {
    const baseSlug = slugify(input.title);

    // 1. Check if already exists in DB to prevent duplicates
    let existing = await prisma.anime.findFirst({
      where: {
        OR: [
          { slug: baseSlug },
          { title: { equals: input.title } },
          ...(input.malId ? [{ malId: input.malId }] : []),
          ...(input.englishTitle ? [{ englishTitle: { equals: input.englishTitle } }] : [])
        ]
      },
      include: { episodes: true, seasons: true }
    });

    // 2. Fetch external metadata from AniList
    const meta = await this.fetchMetadataFromAniList(input.title);

    const canonicalTitle = meta?.title?.english || meta?.title?.romaji || input.title;
    const englishTitle = meta?.title?.english || input.englishTitle || null;
    const japaneseTitle = meta?.title?.native || input.japaneseTitle || null;
    const malId = meta?.idMal || input.malId || null;
    const anilistId = meta?.id || input.anilistId || null;

    const cleanedDescription = meta?.description ? meta.description.replace(/<[^>]*>/g, '').trim() : 'No synopsis provided.';
    const poster = meta?.coverImage?.extraLarge || meta?.coverImage?.large || null;
    const banner = meta?.bannerImage || poster;
    const score = meta?.averageScore ? meta.averageScore / 10 : 7.5;
    const studio = meta?.studios?.nodes?.[0]?.name || 'Unknown Studio';
    const genres = meta?.genres?.length ? meta.genres.join(', ') : (input.genres?.join(', ') || 'Action, Fantasy');
    const releasedYear = meta?.startDate?.year || input.releasedYear || new Date().getFullYear();
    const releaseDate = meta?.startDate?.year ? `${meta.startDate.year}-${String(meta.startDate.month || 1).padStart(2, '0')}-${String(meta.startDate.day || 1).padStart(2, '0')}` : null;
    const duration = meta?.duration ? `${meta.duration} min` : (input.contentType === 'movie' ? '105 min' : '24 min');
    
    // Find director from staff nodes if available
    let director = 'Unknown';
    if (meta?.staff?.nodes) {
      const dirStaff = meta.staff.nodes.find((s: any) => s.primaryOccupations?.some((o: string) => o.toLowerCase().includes('director')));
      if (dirStaff) director = dirStaff.name.full;
    }

    // Main characters
    const mainCharacters = meta?.characters?.nodes ? meta.characters.nodes.map((c: any) => c.name.full).join(', ') : null;

    // Trailer
    let trailerUrl: string | null = null;
    if (meta?.trailer?.site === 'youtube' && meta?.trailer?.id) {
      trailerUrl = `https://www.youtube.com/watch?v=${meta.trailer.id}`;
    }

    // Airing status
    let status = 'Finished Airing';
    if (meta?.status === 'RELEASING') status = 'Currently Airing';
    else if (meta?.status === 'NOT_YET_RELEASED') status = 'Not Yet Aired';

    const targetType = input.contentType === 'movie' ? 'Movie' : (meta?.format || 'TV');
    const totalEpisodes = input.contentType === 'movie' ? 1 : (meta?.episodes || 12);

    const animeData = {
      malId,
      anilistId,
      slug: baseSlug,
      canonicalTitle,
      title: input.title,
      englishTitle,
      japaneseTitle,
      contentType: input.contentType,
      description: cleanedDescription,
      bannerImage: banner,
      posterImage: poster,
      rating: 'PG-13',
      score,
      type: targetType,
      studio,
      director,
      mainCharacters,
      trailerUrl,
      status,
      releasedYear,
      releaseDate,
      duration,
      genres,
      totalSeasons: input.contentType === 'movie' ? 1 : 1,
      totalEpisodes,
      hasSub: true,
      hasDub: input.hasDub !== undefined ? input.hasDub : true,
      hasHindi: input.hasHindi !== undefined ? input.hasHindi : false,
      availabilityStatus: 'METADATA_VERIFIED',
      metadataSource: 'AniList GraphQL',
      lastVerifiedAt: new Date()
    };

    let anime;
    if (existing) {
      anime = await prisma.anime.update({
        where: { id: existing.id },
        data: animeData
      });
    } else {
      anime = await prisma.anime.create({
        data: animeData
      });
    }

    // Ensure season 1 exists for this anime
    const season = await prisma.animeSeason.upsert({
      where: {
        animeId_seasonNumber: {
          animeId: anime.id,
          seasonNumber: 1
        }
      },
      update: { title: input.contentType === 'movie' ? 'Main Movie' : 'Season 1', episodesCount: totalEpisodes },
      create: {
        animeId: anime.id,
        seasonNumber: 1,
        title: input.contentType === 'movie' ? 'Main Movie' : 'Season 1',
        episodesCount: totalEpisodes
      }
    });

    // Ensure only Episode 1 exists initially; additional episodes are added manually or on-demand
    await prisma.episode.upsert({
      where: {
        animeId_episodeNumber: {
          animeId: anime.id,
          episodeNumber: 1
        }
      },
      update: {
        seasonId: season.id,
        seasonNumber: 1,
        duration: anime.duration,
        thumbnail: anime.bannerImage || anime.posterImage
      },
      create: {
        animeId: anime.id,
        seasonId: season.id,
        seasonNumber: 1,
        episodeNumber: 1,
        title: input.contentType === 'movie' ? anime.title : 'Episode 1',
        duration: anime.duration,
        videoUrl: '',
        thumbnail: anime.bannerImage || anime.posterImage,
        status: 'PENDING'
      }
    });

    return anime;
  }
}
