import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface ContinueWatchingItem {
  animeId: string;
  slug: string;
  title: string;
  englishTitle?: string;
  posterImage: string;
  bannerImage?: string;
  episodeNumber: number;
  totalEpisodes?: number;
  episodeTitle?: string;
  watchedTime: number; // in seconds
  duration: number; // in seconds
  progressPercentage: number; // 0 to 100
  updatedAt: number; // timestamp in ms
  rating?: string;
  type?: string;
}

const STORAGE_KEY = 'aniverse_continue_watching';
const CHANGE_EVENT = 'aniverse_continue_watching_changed';

/**
 * Safe local storage reader for Continue Watching entries.
 */
export function getLocalContinueWatching(): ContinueWatchingItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item: any) => item && (item.slug || item.animeId) && typeof item.episodeNumber === 'number')
      .map((item: any) => ({
        animeId: String(item.animeId || item.slug),
        slug: String(item.slug || item.animeId),
        title: item.title || item.englishTitle || 'Anime',
        englishTitle: item.englishTitle,
        posterImage: item.posterImage || '',
        bannerImage: item.bannerImage || item.posterImage || '',
        episodeNumber: Number(item.episodeNumber) || 1,
        totalEpisodes: item.totalEpisodes ? Number(item.totalEpisodes) : undefined,
        episodeTitle: item.episodeTitle,
        watchedTime: Number(item.watchedTime) || 0,
        duration: Number(item.duration) || 1440,
        progressPercentage: Math.min(Math.max(Number(item.progressPercentage) || 0, 0), 100),
        updatedAt: Number(item.updatedAt) || Date.now(),
        rating: item.rating,
        type: item.type,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (err) {
    console.error('Error reading local continue watching:', err);
    return [];
  }
}

/**
 * Saves or updates a Continue Watching entry in localStorage and dispatches change event.
 * Also synchronizes in the background with backend `/api/history` if authenticated.
 */
export function saveContinueWatching(
  data: Partial<ContinueWatchingItem> & { slug: string; episodeNumber: number }
): ContinueWatchingItem[] {
  try {
    const current = getLocalContinueWatching();
    const now = Date.now();

    const effectiveSlug = data.slug.toLowerCase().trim();
    const effectiveAnimeId = data.animeId || effectiveSlug;
    const effectiveEp = Math.max(1, Number(data.episodeNumber) || 1);

    // Find if this anime is already in the list
    const existingIndex = current.findIndex(
      (item) => item.slug === effectiveSlug || (data.animeId && item.animeId === data.animeId)
    );

    const existingItem = existingIndex >= 0 ? current[existingIndex] : null;

    const duration = data.duration && Number(data.duration) > 0
      ? Number(data.duration)
      : (existingItem?.duration || 1440);

    let progressPercentage = 15;
    if (data.progressPercentage !== undefined && data.progressPercentage !== null) {
      progressPercentage = Math.min(Math.max(Number(data.progressPercentage), 0), 100);
    } else if (data.watchedTime !== undefined && duration > 0) {
      progressPercentage = Math.min((Number(data.watchedTime) / duration) * 100, 100);
    } else if (existingItem && existingItem.episodeNumber === effectiveEp) {
      progressPercentage = existingItem.progressPercentage;
    }

    const watchedTime = data.watchedTime !== undefined
      ? Number(data.watchedTime)
      : (progressPercentage / 100) * duration;

    const newItem: ContinueWatchingItem = {
      animeId: effectiveAnimeId,
      slug: effectiveSlug,
      title: data.title || existingItem?.title || 'Anime',
      englishTitle: data.englishTitle || existingItem?.englishTitle,
      posterImage: data.posterImage || existingItem?.posterImage || '',
      bannerImage: data.bannerImage || existingItem?.bannerImage || data.posterImage || existingItem?.posterImage || '',
      episodeNumber: effectiveEp,
      totalEpisodes: data.totalEpisodes || existingItem?.totalEpisodes,
      episodeTitle: data.episodeTitle || existingItem?.episodeTitle || `Episode ${effectiveEp}`,
      watchedTime,
      duration,
      progressPercentage,
      updatedAt: now,
      rating: data.rating || existingItem?.rating,
      type: data.type || existingItem?.type,
    };

    // Remove existing entry (deduplicate) and prepend new item to top
    const filtered = current.filter(
      (item) => item.slug !== effectiveSlug && (!data.animeId || item.animeId !== data.animeId)
    );

    const updated = [newItem, ...filtered].slice(0, 30); // keep max 30 items

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: updated }));

    // Sync to backend history if token exists
    const token = localStorage.getItem('bankai_token');
    if (token) {
      axios
        .post(
          '/api/history',
          {
            animeId: effectiveAnimeId,
            episodeNumber: effectiveEp,
            watchedTime,
            duration,
            progressPercentage,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .catch(() => {
          // ignore background sync errors
        });
    }

    return updated;
  } catch (err) {
    console.error('Error saving continue watching item:', err);
    return getLocalContinueWatching();
  }
}

/**
 * Remove a specific anime from Continue Watching.
 */
export function removeContinueWatching(slugOrId: string): ContinueWatchingItem[] {
  try {
    const current = getLocalContinueWatching();
    const target = slugOrId.toLowerCase().trim();

    const updated = current.filter(
      (item) => item.slug.toLowerCase() !== target && item.animeId !== slugOrId
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: updated }));

    // Also remove from server history if authenticated
    const token = localStorage.getItem('bankai_token');
    if (token) {
      axios
        .delete(`/api/history/${encodeURIComponent(slugOrId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(() => {});
    }

    return updated;
  } catch (err) {
    console.error('Error removing continue watching item:', err);
    return getLocalContinueWatching();
  }
}

/**
 * Clear all Continue Watching records.
 */
export function clearAllContinueWatching(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: [] }));

    const token = localStorage.getItem('bankai_token');
    if (token) {
      axios
        .delete('/api/history', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(() => {});
    }
  } catch (err) {
    console.error('Error clearing continue watching:', err);
  }
}

/**
 * Merges server history items into local state.
 */
export function mergeServerHistory(serverHistory: any[]): ContinueWatchingItem[] {
  if (!Array.isArray(serverHistory) || serverHistory.length === 0) {
    return getLocalContinueWatching();
  }

  const localItems = getLocalContinueWatching();
  const mergedMap = new Map<string, ContinueWatchingItem>();

  // Add local items to map
  for (const item of localItems) {
    mergedMap.set(item.slug, item);
  }

  // Merge server items
  for (const raw of serverHistory) {
    const anime = raw.anime;
    if (!anime) continue;

    const slug = (anime.slug || anime.id || '').toLowerCase();
    if (!slug) continue;

    const serverUpdatedAt = raw.updatedAt ? new Date(raw.updatedAt).getTime() : 0;
    const existing = mergedMap.get(slug);

    // If existing local item is newer, keep it
    if (existing && existing.updatedAt > serverUpdatedAt) {
      continue;
    }

    const duration = raw.duration || 1440;
    const progress = raw.progressPercentage !== undefined ? raw.progressPercentage : 15;

    mergedMap.set(slug, {
      animeId: anime.id,
      slug,
      title: anime.title || anime.englishTitle || 'Anime',
      englishTitle: anime.englishTitle,
      posterImage: anime.posterImage || '',
      bannerImage: anime.bannerImage || anime.posterImage || '',
      episodeNumber: Number(raw.episodeNumber) || 1,
      totalEpisodes: anime.totalEpisodes ? Number(anime.totalEpisodes) : undefined,
      episodeTitle: raw.episode?.title || `Episode ${raw.episodeNumber}`,
      watchedTime: Number(raw.watchedTime) || 0,
      duration,
      progressPercentage: Math.min(Math.max(Number(progress), 0), 100),
      updatedAt: serverUpdatedAt || Date.now(),
      rating: anime.rating,
      type: anime.type,
    });
  }

  const result = Array.from(mergedMap.values())
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 30);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch (_) {}

  return result;
}

/**
 * Custom React Hook that returns the live list of Continue Watching items,
 * reacting instantly to watch changes, deletions, and server synchronization.
 */
export function useContinueWatching() {
  const [items, setItems] = useState<ContinueWatchingItem[]>(() => getLocalContinueWatching());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshFromLocal = useCallback(() => {
    setItems(getLocalContinueWatching());
    setLoading(false);
  }, []);

  useEffect(() => {
    // 1. Initial hydration from localStorage
    refreshFromLocal();

    // 2. Fetch from backend history if logged in and merge
    const syncBackend = async () => {
      const token = localStorage.getItem('bankai_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/api/history', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        });
        if (res.data?.history) {
          const merged = mergeServerHistory(res.data.history);
          setItems(merged);
        }
      } catch (err) {
        // Fall back gracefully to local storage
      } finally {
        setLoading(false);
      }
    };

    syncBackend();

    // 3. Listen to internal change events and window storage events
    const handleChange = () => {
      refreshFromLocal();
    };

    window.addEventListener(CHANGE_EVENT, handleChange);
    window.addEventListener('storage', handleChange);

    return () => {
      window.removeEventListener(CHANGE_EVENT, handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, [refreshFromLocal]);

  const removeItem = useCallback((slugOrId: string) => {
    const updated = removeContinueWatching(slugOrId);
    setItems(updated);
  }, []);

  const clearAll = useCallback(() => {
    clearAllContinueWatching();
    setItems([]);
  }, []);

  return { items, loading, removeItem, clearAll, refresh: refreshFromLocal };
}
