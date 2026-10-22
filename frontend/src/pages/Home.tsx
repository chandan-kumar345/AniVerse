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

export const Home: React.FC = () => {
  const [trending, setTrending] = useState<AnimeData[]>([]);
  const [popular, setPopular] = useState<AnimeData[]>([]);
  const [topTen, setTopTen] = useState<AnimeData[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<AnimeData[]>([]);
  const [movies, setMovies] = useState<AnimeData[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [newRelease, setNewRelease] = useState<AnimeData[]>([]);
  const [newAdded, setNewAdded] = useState<AnimeData[]>([]);
  const [justCompleted, setJustCompleted] = useState<AnimeData[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Instant Cache Hydration: Render immediately from sessionStorage if available (0ms)
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('aniverse_home_cache');
      if (cached) {
        const d = JSON.parse(cached);
        if (d && (d.trending?.length || d.topTen?.length)) {
          if (d.trending) setTrending(d.trending);
          if (d.popular) setPopular(d.popular);
          if (d.topTen) setTopTen(d.topTen);
          if (d.latestUpdates) setLatestUpdates(d.latestUpdates);
          if (d.movies) setMovies(d.movies);
          if (d.genres) setGenres(d.genres);
          if (d.newRelease) setNewRelease(d.newRelease);
          if (d.newAdded) setNewAdded(d.newAdded);
          if (d.justCompleted) setJustCompleted(d.justCompleted);
          setLoading(false);
        }
      }
    } catch (_) {}
  }, []);

  // 2. Fetch fresh home data through AniVerse API
  useEffect(() => {
    const fetchHomeData = async (showShimmer = false) => {
      try {
        if (showShimmer && loading) {
          setLoading(true);
        }

        // Fast Path: Call the unified and in-memory cached /api/anime/home endpoint
        try {
          const homeRes = await axios.get('/api/anime/home', { timeout: 10000 });
          if (homeRes.data && (homeRes.data.trending || homeRes.data.topTen)) {
            const d = homeRes.data;
            setTrending(d.trending || []);
            setPopular(d.popular || []);
            setTopTen(d.topTen || []);
            setLatestUpdates(d.latestUpdates || []);
            setMovies(d.movies || []);
            setGenres(d.genres || []);
            setNewRelease(d.newRelease || []);
            setNewAdded(d.newAdded || []);
            setJustCompleted(d.justCompleted || []);

            try {
              sessionStorage.setItem('aniverse_home_cache', JSON.stringify(d));
            } catch (_) {}

            setLoading(false);
            return;
          }
        } catch (unifiedErr) {
          console.warn('/api/anime/home error, falling back to parallel endpoints:', unifiedErr);
        }

        // Fallback Path: Parallel queries with Promise.allSettled so no single error blocks the page
        const [
          trendingRes,
          popularRes,
          topTenRes,
          moviesRes,
          genresRes,
          newReleaseRes,
          newAddedRes,
          justCompletedRes,
          latestUpdatesRes
        ] = await Promise.allSettled([
          axios.get('/api/anime/trending'),
          axios.get('/api/anime/popular'),
          axios.get('/api/anime/top-ten'),
          axios.get('/api/anime?contentType=movie&limit=16'),
          axios.get('/api/anime/genres'),
          axios.get('/api/anime?status=Currently Airing&limit=5'),
          axios.get('/api/anime?sort=latest&limit=5'),
          axios.get('/api/anime?status=Finished Airing&limit=5'),
          axios.get('/api/anime?sort=latest&limit=35')
        ]);

        const getVal = (res: PromiseSettledResult<any>, key: string, fallback: any = []) => {
          if (res.status === 'fulfilled' && res.value?.data) {
            return res.value.data[key] || fallback;
          }
          return fallback;
        };

        const trendingData = getVal(trendingRes, 'trending');
        const popularData = getVal(popularRes, 'popular');
        const topTenData = getVal(topTenRes, 'topTen');
        const moviesData = getVal(moviesRes, 'animeList');
        const genresData = getVal(genresRes, 'genres');
        const newReleaseData = getVal(newReleaseRes, 'animeList');
        const newAddedData = getVal(newAddedRes, 'animeList');
        const justCompletedData = getVal(justCompletedRes, 'animeList');
        const latestUpdatesData = getVal(latestUpdatesRes, 'animeList');

        setTrending(trendingData);
        setPopular(popularData);
        setTopTen(topTenData);
        setMovies(moviesData);
        setGenres(genresData);
        setNewRelease(newReleaseData);
        setNewAdded(newAddedData);
        setJustCompleted(justCompletedData);
        setLatestUpdates(latestUpdatesData.length > 0 ? latestUpdatesData : trendingData);

        try {
          sessionStorage.setItem('aniverse_home_cache', JSON.stringify({
            trending: trendingData,
            popular: popularData,
            topTen: topTenData,
            latestUpdates: latestUpdatesData,
            movies: moviesData,
            genres: genresData,
            newRelease: newReleaseData,
            newAdded: newAddedData,
            justCompleted: justCompletedData,
          }));
        } catch (_) {}
      } catch (err) {
        console.error('Error fetching home page data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData(true);

    // Auto-update home data every 60 seconds quietly in the background
    const interval = setInterval(() => fetchHomeData(false), 60000);
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
