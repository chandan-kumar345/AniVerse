/**
 * Dedicated AniList GraphQL Metadata Service
 * Endpoint: https://graphql.anilist.co
 *
 * Implements:
 * - Request deduplication
 * - In-memory and sessionStorage TTL caching
 * - Rate-limit backoff and safety (AniList 90 req/min)
 * - Safe sanitization and fallback artwork
 * - Typed models for anime, schedules, and search
 */

export interface AniListMedia {
  id: number;
  idMal?: number | null;
  slug?: string;
  title: {
    romaji?: string | null;
    english?: string | null;
    native?: string | null;
  };
  description?: string | null;
  bannerImage?: string | null;
  coverImage?: {
    extraLarge?: string | null;
    large?: string | null;
    medium?: string | null;
    color?: string | null;
  } | null;
  averageScore?: number | null;
  format?: string | null;
  status?: string | null;
  startDate?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  } | null;
  genres?: string[] | null;
  duration?: number | null;
  episodes?: number | null;
  nextAiringEpisode?: {
    episode: number;
    airingAt: number;
    timeUntilAiring: number;
  } | null;
  studios?: {
    nodes?: { name: string }[];
  } | null;
  trailer?: {
    id?: string | null;
    site?: string | null;
  } | null;
  characters?: {
    nodes?: {
      name?: { full?: string | null } | null;
      image?: { medium?: string | null } | null;
    }[];
  } | null;
  relations?: {
    edges?: {
      relationType: string;
      node: AniListMedia;
    }[];
  } | null;
  recommendations?: {
    nodes?: {
      mediaRecommendation?: AniListMedia | null;
    }[];
  } | null;
}

export interface AiringScheduleItem {
  id: number;
  airingAt: number;
  episode: number;
  media: AniListMedia;
}

export interface SearchFilters {
  search?: string;
  genre?: string;
  year?: number;
  season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
  format?: string;
  status?: string;
  sort?: 'TRENDING_DESC' | 'POPULARITY_DESC' | 'SCORE_DESC' | 'START_DATE_DESC' | 'FAVOURITES_DESC';
  page?: number;
  perPage?: number;
}

// In-memory cache
interface CacheItem<T> {
  data: T;
  expiresAt: number;
}
const memoryCache = new Map<string, CacheItem<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

// Rate limiting state
let rateLimitRemaining = 90;
let rateLimitResetTime = 0;

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

export function cleanDescription(raw?: string | null): string {
  if (!raw) return 'No synopsis available.';
  return raw
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .trim();
}

export const FALLBACK_POSTER =
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';
export const FALLBACK_BANNER =
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&auto=format&fit=crop&q=80';

const GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

async function executeGraphQL<T>(query: string, variables: Record<string, any> = {}, ttlMs = 300_000): Promise<T> {
  const cacheKey = `anilist:${JSON.stringify({ query, variables })}`;

  // 1. Check memory cache
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  // 2. Check sessionStorage if in browser
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = sessionStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored) as CacheItem<T>;
        if (Date.now() < parsed.expiresAt) {
          memoryCache.set(cacheKey, parsed);
          return parsed.data;
        }
      }
    } catch (_) {}
  }

  // 3. Request deduplication
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  // 4. Rate-limit pause if near threshold
  if (rateLimitRemaining < 3 && Date.now() < rateLimitResetTime) {
    const sleepMs = Math.max(500, rateLimitResetTime - Date.now());
    await new Promise((resolve) => setTimeout(resolve, Math.min(sleepMs, 2000)));
  }

  const fetchPromise = (async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const response = await fetch(GRAPHQL_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ query, variables }),
        });

        const remHeader = response.headers.get('X-RateLimit-Remaining');
        if (remHeader) rateLimitRemaining = parseInt(remHeader, 10);

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 3000;
          rateLimitResetTime = Date.now() + delay;
          if (retries > 0) {
            retries--;
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
          throw new Error('AniList rate limit reached. Please wait a moment.');
        }

        if (!response.ok) {
          throw new Error(`AniList GraphQL error: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();
        if (json.errors && json.errors.length > 0) {
          throw new Error(json.errors[0]?.message || 'GraphQL Query Error');
        }

        const data = json.data as T;

        // Cache the result
        const item: CacheItem<T> = { data, expiresAt: Date.now() + ttlMs };
        memoryCache.set(cacheKey, item);
        if (typeof window !== 'undefined' && window.sessionStorage) {
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(item));
          } catch (_) {}
        }

        return data;
      } catch (err: any) {
        if (retries > 0 && !err?.message?.includes('429')) {
          retries--;
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        throw err;
      }
    }
    throw new Error('Failed to fetch from AniList after retries.');
  })().finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

const MEDIA_FIELDS = `
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
    color
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
  nextAiringEpisode {
    episode
    airingAt
    timeUntilAiring
  }
  studios(isMain: true) {
    nodes {
      name
    }
  }
  trailer {
    id
    site
  }
`;

export const anilistService = {
  /**
   * Fetch Trending Anime for home banner & carousel
   */
  async getTrending(page = 1, perPage = 10): Promise<AniListMedia[]> {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC]) {
            ${MEDIA_FIELDS}
          }
        }
      }
    `;
    const res = await executeGraphQL<{ Page: { media: AniListMedia[] } }>(query, { page, perPage }, 600_000);
    return res.Page.media || [];
  },

  /**
   * Fetch All-Time Popular Anime
   */
  async getPopular(page = 1, perPage = 10): Promise<AniListMedia[]> {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, sort: [POPULARITY_DESC]) {
            ${MEDIA_FIELDS}
          }
        }
      }
    `;
    const res = await executeGraphQL<{ Page: { media: AniListMedia[] } }>(query, { page, perPage }, 1_800_000);
    return res.Page.media || [];
  },

  /**
   * Fetch Currently Airing Anime (Running Anime) with countdown info
   */
  async getCurrentlyAiring(page = 1, perPage = 12): Promise<AniListMedia[]> {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, status: RELEASING, sort: [POPULARITY_DESC]) {
            ${MEDIA_FIELDS}
          }
        }
      }
    `;
    const res = await executeGraphQL<{ Page: { media: AniListMedia[] } }>(query, { page, perPage }, 120_000);
    return res.Page.media || [];
  },

  /**
   * Fetch Airing Schedule for specific timestamp range (Weekly Episode Schedule)
   */
  async getAiringSchedule(startAt: number, endAt: number, page = 1, perPage = 50): Promise<AiringScheduleItem[]> {
    const query = `
      query ($start: Int, $end: Int, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
            id
            airingAt
            episode
            media {
              ${MEDIA_FIELDS}
            }
          }
        }
      }
    `;
    const res = await executeGraphQL<{ Page: { airingSchedules: AiringScheduleItem[] } }>(
      query,
      { start: startAt, end: endAt, page, perPage },
      180_000 // 3 min cache
    );
    return res.Page.airingSchedules || [];
  },

  /**
   * Fetch Seasonal Anime (e.g., Summer 2026, Fall 2026)
   */
  async getSeasonal(season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL', year?: number, page = 1, perPage = 12): Promise<AniListMedia[]> {
    const query = `
      query ($season: MediaSeason, $year: Int, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, season: $season, seasonYear: $year, sort: [POPULARITY_DESC]) {
            ${MEDIA_FIELDS}
          }
        }
      }
    `;
    const res = await executeGraphQL<{ Page: { media: AniListMedia[] } }>(
      query,
      { season: season || 'FALL', year: year || new Date().getFullYear(), page, perPage },
      600_000
    );
    return res.Page.media || [];
  },

  /**
   * Comprehensive Search & Discovery with filters & pagination
   */
  async search(filters: SearchFilters): Promise<{ media: AniListMedia[]; pageInfo: { hasNextPage: boolean; total: number } }> {
    const query = `
      query (
        $search: String,
        $genre: String,
        $year: Int,
        $season: MediaSeason,
        $format: MediaFormat,
        $status: MediaStatus,
        $sort: [MediaSort],
        $page: Int,
        $perPage: Int
      ) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          media(
            type: ANIME,
            search: $search,
            genre: $genre,
            seasonYear: $year,
            season: $season,
            format: $format,
            status: $status,
            sort: $sort
          ) {
            ${MEDIA_FIELDS}
          }
        }
      }
    `;

    const variables: Record<string, any> = {
      page: filters.page || 1,
      perPage: filters.perPage || 20,
      sort: filters.sort ? [filters.sort] : ['POPULARITY_DESC'],
    };

    if (filters.search && filters.search.trim()) variables.search = filters.search.trim();
    if (filters.genre && filters.genre !== 'All') variables.genre = filters.genre;
    if (filters.year) variables.year = filters.year;
    if (filters.season) variables.season = filters.season;
    if (filters.format && filters.format !== 'All') variables.format = filters.format;
    if (filters.status && filters.status !== 'All') variables.status = filters.status;

    const res = await executeGraphQL<{
      Page: {
        media: AniListMedia[];
        pageInfo: { hasNextPage: boolean; total: number };
      };
    }>(query, variables, 300_000);

    return {
      media: res.Page.media || [],
      pageInfo: res.Page.pageInfo || { hasNextPage: false, total: 0 },
    };
  },

  /**
   * Fetch Single Anime Details by ID (or MAL ID)
   */
  async getAnimeDetails(id: number): Promise<AniListMedia | null> {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          ${MEDIA_FIELDS}
          characters(perPage: 8, sort: ROLE) {
            nodes {
              name {
                full
              }
              image {
                medium
              }
            }
          }
          relations {
            edges {
              relationType
              node {
                id
                idMal
                title {
                  romaji
                  english
                }
                format
                status
                coverImage {
                  large
                }
                averageScore
              }
            }
          }
          recommendations(perPage: 8, sort: RATING_DESC) {
            nodes {
              mediaRecommendation {
                id
                idMal
                title {
                  romaji
                  english
                }
                format
                coverImage {
                  large
                }
                averageScore
              }
            }
          }
        }
      }
    `;
    const res = await executeGraphQL<{ Media: AniListMedia }>(query, { id }, 900_000);
    return res.Media || null;
  },

  /**
   * Search Anime by Slug or Title string
   */
  async findBySlugOrTitle(slugOrTitle: string): Promise<AniListMedia | null> {
    const cleaned = slugOrTitle.replace(/-/g, ' ').trim();
    const query = `
      query ($search: String) {
        Page(page: 1, perPage: 1) {
          media(search: $search, type: ANIME, sort: [POPULARITY_DESC]) {
            ${MEDIA_FIELDS}
            characters(perPage: 8, sort: ROLE) {
              nodes {
                name {
                  full
                }
                image {
                  medium
                }
              }
            }
            relations {
              edges {
                relationType
                node {
                  id
                  idMal
                  title {
                    romaji
                    english
                  }
                  format
                  coverImage {
                    large
                  }
                }
              }
            }
            recommendations(perPage: 8, sort: RATING_DESC) {
              nodes {
                mediaRecommendation {
                  id
                  idMal
                  title {
                    romaji
                    english
                  }
                  coverImage {
                    large
                  }
                }
              }
            }
          }
        }
      }
    `;
    const res = await executeGraphQL<{ Page: { media: AniListMedia[] } }>(query, { search: cleaned }, 900_000);
    return res.Page.media?.[0] || null;
  },

  /**
   * Standard Genre List
   */
  getStandardGenres(): string[] {
    return [
      'Action',
      'Adventure',
      'Comedy',
      'Drama',
      'Fantasy',
      'Horror',
      'Mystery',
      'Romance',
      'Sci-Fi',
      'Sports',
      'Supernatural',
      'Thriller',
      'Isekai',
      'Slice of Life',
      'Psychological',
      'Mecha',
    ];
  },
};
