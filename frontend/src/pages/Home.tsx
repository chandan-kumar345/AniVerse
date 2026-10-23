import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HeroSlider } from '../components/HeroSlider';
import { ContinueWatchingSection } from '../components/ContinueWatchingSection';
import { RunningAnimesSection } from '../components/RunningAnimesSection';
import { AnimeSlider } from '../components/AnimeSlider';
import { LatestUpdatesSection } from '../components/LatestUpdatesSection';
import { SectionWisePanels } from '../components/SectionWisePanels';
import { EstimatedSchedule } from '../components/EstimatedSchedule';
import { AZListSection } from '../components/AZListSection';
import type { AnimeData } from '../components/AnimeCard';
import { INITIAL_HOME_SEED_DATA } from '../utils/seedData';

const getInitialHomeState = () => {
  try {
    const cached = localStorage.getItem('aniverse_home_cache') || sessionStorage.getItem('aniverse_home_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && (parsed.trending?.length || parsed.topTen?.length)) {
        return parsed;
      }
    }
  } catch (_) {}
  return INITIAL_HOME_SEED_DATA;
};

const initialData = getInitialHomeState();

export const Home: React.FC = () => {
  const [trending, setTrending] = useState<AnimeData[]>(initialData.trending || []);
  const [popular, setPopular] = useState<AnimeData[]>(initialData.popular || []);
  const [topTen, setTopTen] = useState<AnimeData[]>(initialData.topTen || []);
  const [latestUpdates, setLatestUpdates] = useState<AnimeData[]>(initialData.latestUpdates || []);
  const [movies, setMovies] = useState<AnimeData[]>(initialData.movies || []);
  const [genres, setGenres] = useState<string[]>(initialData.genres || []);
  const [newRelease, setNewRelease] = useState<AnimeData[]>(initialData.newRelease || []);
  const [newAdded, setNewAdded] = useState<AnimeData[]>(initialData.newAdded || []);
  const [justCompleted, setJustCompleted] = useState<AnimeData[]>(initialData.justCompleted || []);
  const [loading, setLoading] = useState(!initialData.trending?.length && !initialData.topTen?.length);

  // 1. Fetch fresh home data asynchronously in the background through AniVerse API
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Fast Path: Call the unified and in-memory cached /api/anime/home endpoint
        try {
          const homeRes = await axios.get('/api/anime/home', { timeout: 6000 });
          if (homeRes.data && (homeRes.data.trending || homeRes.data.topTen)) {
            const d = homeRes.data;
            if (d.trending?.length) setTrending(d.trending);
            if (d.popular?.length) setPopular(d.popular);
            if (d.topTen?.length) setTopTen(d.topTen);
            if (d.latestUpdates?.length) setLatestUpdates(d.latestUpdates);
            if (d.movies?.length) setMovies(d.movies);
            if (d.genres?.length) setGenres(d.genres);
            if (d.newRelease?.length) setNewRelease(d.newRelease);
            if (d.newAdded?.length) setNewAdded(d.newAdded);
            if (d.justCompleted?.length) setJustCompleted(d.justCompleted);
            setLoading(false);

            try {
              localStorage.setItem('aniverse_home_cache', JSON.stringify(d));
              sessionStorage.setItem('aniverse_home_cache', JSON.stringify(d));
            } catch (_) {}
            return;
          }
        } catch (unifiedErr) {
          console.warn('/api/anime/home slow or sleeping, gently attempting lightweight fallback...');
        }

        // Lightweight fallback: Only query trending and popular if primary endpoint is delayed
        try {
          const [trendingRes, popularRes] = await Promise.allSettled([
            axios.get('/api/anime/trending', { timeout: 4000 }),
            axios.get('/api/anime/popular', { timeout: 4000 })
          ]);
          if (trendingRes.status === 'fulfilled' && trendingRes.value.data?.trending?.length) {
            setTrending(trendingRes.value.data.trending);
          }
          if (popularRes.status === 'fulfilled' && popularRes.value.data?.popular?.length) {
            setPopular(popularRes.value.data.popular);
          }
        } catch (_) {}
      } catch (err) {
        console.error('Error in background home refresh:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();

    // Auto-update home data every 120 seconds quietly in the background
    const interval = setInterval(fetchHomeData, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.title = "AniVerse - Watch Free Anime Online in HD (No Ads) - Aniwave Alternative";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Stream high-definition popular anime series like Bleach TYBW, Demon Slayer, Jujutsu Kaisen, and One Piece online for free on AniVerse with custom HTML5 player, ad-blocked iframe servers, and dynamic nested comments.');
    }
  }, []);

  if (loading) {
    return (
      <div className="app-container" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Banner Skeleton */}
        <div style={{ height: '600px', width: '100%', borderRadius: '16px' }} className="shimmer" />
        {/* Row Skeletons */}
        <div style={{ display: 'flex', gap: '20px', overflow: 'hidden' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ flex: '1 0 180px', height: '270px', borderRadius: '8px' }} className="shimmer" />
          ))}
        </div>
      </div>
    );
  }

  // To re-order sections, simply swap the indices or positions below.
  return (
    <div className="app-container" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. HERO SPOTLIGHT SLIDER */}
      <HeroSlider animeList={topTen} />

      {/* 1.5. CONTINUE WATCHING (Resume anime where left off) */}
      <ContinueWatchingSection />

      {/* 2. TRENDING NOW SLIDER */}
      <AnimeSlider title="Trending Now" animeList={trending} showCountdown={false} />

      {/* 2.5. RUNNING ANIMES (Currently Airing with Countdown) */}
      <RunningAnimesSection animeList={trending} />

      {/* 3. LATEST EPISODE UPDATES & SIDEBAR */}
      <LatestUpdatesSection 
        latestUpdates={latestUpdates} 
        topTen={topTen} 
        genres={genres} 
      />

      {/* 3.5. ANIME MOVIES SLIDER */}
      <AnimeSlider title="Anime Movies" animeList={movies} showCountdown={false} />

      {/* 4. MOST POPULAR SLIDER */}
      <AnimeSlider title="Most Popular" animeList={popular} showCountdown={false} />

      {/* 5. NEW RELEASE / NEW ADDED / JUST COMPLETED PANELS */}
      <SectionWisePanels 
        newRelease={newRelease} 
        newAdded={newAdded} 
        justCompleted={justCompleted} 
      />

      {/* 6. ESTIMATED AIRING SCHEDULE */}
      <EstimatedSchedule animeList={trending.concat(popular)} />

      {/* 7. A-Z ALPHABET LISTING PANEL */}
      <AZListSection />

      <style>{`
        .genre-item-link:hover { background: var(--color-primary) !important; color: #fff !important; box-shadow: var(--glow-shadow); }
        .view-all-link:hover { color: var(--color-primary-hover) !important; }
        
        .section-list-item:hover .section-item-title { color: var(--color-primary) !important; }
        .section-list-item:hover .section-item-thumb { transform: scale(1.05); border-color: var(--color-primary) !important; }
        .section-item-thumb { transition: var(--transition-fast); }
        
        .az-item:hover { background: var(--color-primary) !important; border-color: var(--color-primary) !important; color: #fff !important; box-shadow: var(--glow-shadow); }

        @media (max-width: 992px) {
          .home-content-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
