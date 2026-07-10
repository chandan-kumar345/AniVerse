import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HeroSlider } from '../components/HeroSlider';
import { AnimeSlider } from '../components/AnimeSlider';
import { SidebarTopTen } from '../components/SidebarTopTen';
import { AnimeCard } from '../components/AnimeCard';
import type { AnimeData } from '../components/AnimeCard';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export const Home: React.FC = () => {
  const [trending, setTrending] = useState<AnimeData[]>([]);
  const [popular, setPopular] = useState<AnimeData[]>([]);
  const [topTen, setTopTen] = useState<AnimeData[]>([]);
  const [recent, setRecent] = useState<AnimeData[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [trendingRes, popularRes, topTenRes, recentRes, genresRes] = await Promise.all([
          axios.get('/api/anime/trending'),
          axios.get('/api/anime/popular'),
          axios.get('/api/anime/top-ten'),
          axios.get('/api/anime?limit=12'), // Recent releases or general grid
          axios.get('/api/anime/genres'),
        ]);

        setTrending(trendingRes.data.trending || []);
        setPopular(popularRes.data.popular || []);
        setTopTen(topTenRes.data.topTen || []);
        setRecent(recentRes.data.animeList || []);
        setGenres(genresRes.data.genres || []);
      } catch (err) {
        console.error('Error fetching home page data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  useEffect(() => {
    document.title = "Bankai TV - Watch Free Anime Online in HD (No Ads) - Aniwave Alternative";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Stream high-definition popular anime series like Bleach TYBW, Demon Slayer, Jujutsu Kaisen, and One Piece online for free on Bankai TV with custom HTML5 player, ad-blocked iframe servers, and dynamic nested comments.');
    }
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* Banner Skeleton */}
        <div style={{ height: '480px', width: '100%', borderRadius: '16px' }} className="shimmer" />
        {/* Row Skeletons */}
        <div style={{ display: 'flex', gap: '20px', overflow: 'hidden' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ flex: '1 0 180px', height: '270px', borderRadius: '8px' }} className="shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 20px' }}>
      
      {/* HERO spotlight slider */}
      <HeroSlider animeList={trending.slice(0, 5)} />

      {/* TRENDING NOW SLIDER */}
      <AnimeSlider title="Trending Now" animeList={trending} />

      {/* TWO COLUMN GRID MAIN / SIDEBAR */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '40px', margin: '40px 0' }} className="home-content-layout">
        
        {/* MAIN COLUMN: RECENT RELEASES */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: '#fff', borderLeft: '4px solid var(--color-primary)', paddingLeft: '12px' }}>
              Recently Completed
            </h2>
            <Link to="/search" style={{ color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 600 }} className="view-all-link">
              View Catalog <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px 20px' }}>
            {recent.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        </div>

        {/* SIDEBAR COLUMN: TOP 10 & GENRES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Top 10 lists panel */}
          <SidebarTopTen animeList={topTen} />

          {/* Genres wrapper card */}
          <div style={{ background: '#12121c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
              Genres
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {genres.slice(0, 16).map((genre) => (
                <Link
                  key={genre}
                  to={`/search?genre=${encodeURIComponent(genre)}`}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none', textAlign: 'center', fontWeight: 500, transition: 'var(--transition-fast)' }}
                  className="genre-item-link"
                >
                  {genre}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* POPULAR SLIDER */}
      <AnimeSlider title="Most Popular" animeList={popular} />

      <style>{`
        .genre-item-link:hover { background: var(--color-primary) !important; color: #fff !important; box-shadow: var(--glow-shadow); }
        .view-all-link:hover { color: var(--color-primary-hover) !important; }
        @media (max-width: 992px) {
          .home-content-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
