import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HeroSlider } from '../components/HeroSlider';
import { TrendingCarousel } from '../components/TrendingCarousel';
import { ContinueWatchingSection } from '../components/ContinueWatchingSection';
import { RunningAnimesSection } from '../components/RunningAnimesSection';
import { UpcomingScheduleSection } from '../components/UpcomingScheduleSection';
import { ExploreGenreSection } from '../components/ExploreGenreSection';
import { SeasonalAnimeSection } from '../components/SeasonalAnimeSection';
import { AZListSection } from '../components/AZListSection';
import { anilistService, type AniListMedia } from '../services/anilistService';
import type { AnimeData } from '../components/AnimeCard';

export const Home: React.FC = () => {
  const [trending, setTrending] = useState<AnimeData[]>([]);
      const [runningList, setRunningList] = useState<AnimeData[]>([]);
  
  // 1. Instant Cache Hydration: Render immediately from sessionStorage if available (0ms)
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('aniverse_home_cache');
      if (cached) {
        const d = JSON.parse(cached);
        if (d && (d.trending?.length || d.topTen?.length)) {
          if (d.trending) setTrending(d.trending);
                              if (d.newRelease) setRunningList(d.newRelease);
                  }
      }
    } catch (_) {}
  }, []);

  // 2. Fetch fresh home data through AniList metadata service + AniVerse API fallback
  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async () => {
      try {
        // Fast Path A: Fetch trending from AniList directly for immediate high-fidelity metadata
        const aniTrendingPromise = anilistService.getTrending(1, 15);
        const aniAiringPromise = anilistService.getCurrentlyAiring(1, 8);

        // Fast Path B: Call local /api/anime/home endpoint in parallel
        const localApiPromise = axios.get('/api/anime/home', { timeout: 6000 }).catch(() => null);

        const [aniTrending, aniAiring, localHomeRes] = await Promise.allSettled([
          aniTrendingPromise,
          aniAiringPromise,
          localApiPromise,
        ]);

        if (!isMounted) return;

        let loadedTrending: AnimeData[] = [];
        let loadedRunning: AnimeData[] = [];

        // If local API succeeded with database entries, use them
        if (localHomeRes.status === 'fulfilled' && localHomeRes.value && localHomeRes.value.data?.trending?.length > 0) {
          const d = localHomeRes.value.data;
          loadedTrending = d.trending || [];
                              if (d.newRelease?.length > 0) {
            loadedRunning = d.newRelease;
          }
        }

        // If AniList succeeded and local API didn't have enough trending, merge/hydrate AniList media
        if (aniTrending.status === 'fulfilled' && aniTrending.value.length > 0) {
          const aniListMapped: AnimeData[] = aniTrending.value.map((m: AniListMedia) => {
            const title = m.title.english || m.title.romaji || m.title.native || 'Anime';
            const slug = m.slug || title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            return {
              id: String(m.id),
              slug,
              title,
              englishTitle: m.title.english || null,
              description: m.description ? m.description.replace(/<[^>]*>/g, '') : '',
              posterImage: m.coverImage?.extraLarge || m.coverImage?.large || '',
              bannerImage: m.bannerImage || m.coverImage?.extraLarge || m.coverImage?.large || '',
              score: m.averageScore ? m.averageScore / 10 : 8.0,
              type: m.format || 'TV',
              studio: m.studios?.nodes?.[0]?.name || 'Studio',
              status: m.status === 'RELEASING' ? 'Currently Airing' : 'Finished Airing',
              releasedYear: m.startDate?.year || 2024,
              duration: m.duration ? `${m.duration} min` : '24 min',
              genres: m.genres ? m.genres.join(', ') : 'Action, Fantasy',
              hasSub: true,
              hasDub: true,
              nextAiringEpisode: m.nextAiringEpisode ? {
                episode: m.nextAiringEpisode.episode,
                airingAt: m.nextAiringEpisode.airingAt,
              } : null,
            };
          });

          // Prioritize high-definition catalog items
          if (loadedTrending.length < 5) {
            loadedTrending = aniListMapped;
          }
        }

        if (aniAiring.status === 'fulfilled' && aniAiring.value.length > 0 && loadedRunning.length === 0) {
          loadedRunning = aniAiring.value.map((m: AniListMedia) => {
            const title = m.title.english || m.title.romaji || 'Anime';
            const slug = m.slug || title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            return {
              id: String(m.id),
              slug,
              title,
              description: m.description ? m.description.replace(/<[^>]*>/g, '') : '',
              posterImage: m.coverImage?.large || '',
              score: m.averageScore ? m.averageScore / 10 : 8.0,
              type: m.format || 'TV',
              status: 'Currently Airing',
              genres: m.genres ? m.genres.join(', ') : 'Action',
              nextAiringEpisode: m.nextAiringEpisode ? {
                episode: m.nextAiringEpisode.episode,
                airingAt: m.nextAiringEpisode.airingAt,
              } : null,
            };
          });
        }

        setTrending(loadedTrending);
        setRunningList(loadedRunning);

        try {
          sessionStorage.setItem('aniverse_home_cache', JSON.stringify({
            trending: loadedTrending,
            newRelease: loadedRunning,
          }));
        } catch (_) {}
      } catch (err) {
        console.warn('Error loading home data:', err);
      } finally {
              }
    };

    loadHomeData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', paddingBottom: '60px' }}>
      {/* 1. CINEMATIC FEATURED HERO BANNER */}
      <section style={{ padding: '0 24px 36px 24px' }}>
        <div className="app-container">
          <HeroSlider animeList={trending.length > 0 ? trending : []} />
        </div>
      </section>

      {/* 2. MAIN HOMEPAGE SECTIONS CONTAINER */}
      <section style={{ padding: '0 24px' }}>
        <div className="app-container">
          {/* SECTION B: TRENDING NOW (Ranked 1, 2, 3... cards) */}
          <TrendingCarousel animeList={trending} />

          {/* SECTION C: CONTINUE WATCHING (Playback progress & resume) */}
          <ContinueWatchingSection />

          {/* SECTION D: RUNNING ANIMES (Currently airing with countdown) */}
          <RunningAnimesSection animeList={runningList} />

          {/* SECTION E: UPCOMING EPISODE SCHEDULE (Day selector pills) */}
          <UpcomingScheduleSection />

          {/* SECTION F: EXPLORE BY GENRE */}
          <ExploreGenreSection />

          {/* SECTION H: SEASONAL ANIME */}
          <SeasonalAnimeSection />

          {/* SECTION: A-Z CATALOGUE DIRECTORY */}
          <div style={{ marginTop: '20px' }}>
            <AZListSection />
          </div>
        </div>
      </section>
    </div>
  );
};
