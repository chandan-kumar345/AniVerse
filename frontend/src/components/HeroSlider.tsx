import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Check, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import type { AnimeData } from './AnimeCard';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface HeroSliderProps {
  animeList: AnimeData[];
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ animeList }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [watchlistStatus, setWatchlistStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (animeList.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % animeList.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [animeList]);

  // Fetch watchlist status for hero items if logged in
  useEffect(() => {
    const fetchWatchlistStatuses = async () => {
      if (!isAuthenticated || animeList.length === 0) return;
      try {
        const statuses: Record<string, boolean> = {};
        await Promise.all(
          animeList.slice(0, 5).map(async (anime) => {
            const res = await axios.get(`/api/watchlist/status/${anime.id}`);
            statuses[anime.id] = res.data.inWatchlist;
          })
        );
        setWatchlistStatus(statuses);
      } catch (err) {
        console.error('Error fetching watchlist statuses:', err);
      }
    };
    fetchWatchlistStatuses();
  }, [animeList, isAuthenticated]);

  if (animeList.length === 0) {
    return (
      <div style={{ height: '500px', width: '100%', borderRadius: '16px' }} className="shimmer" />
    );
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? animeList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === animeList.length - 1 ? 0 : prev + 1));
  };

  const handleWatchNow = (slug: string) => {
    navigate(`/anime/${slug}`); // Directs to detail page which lists episodes
  };

  const handleToggleWatchlist = async (animeId: string) => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    try {
      const isAlreadyIn = watchlistStatus[animeId];
      if (isAlreadyIn) {
        await axios.delete(`/api/watchlist/${animeId}`);
        setWatchlistStatus((prev) => ({ ...prev, [animeId]: false }));
      } else {
        await axios.post('/api/watchlist', { animeId, status: 'PLAN_TO_WATCH' });
        setWatchlistStatus((prev) => ({ ...prev, [animeId]: true }));
      }
    } catch (err) {
      console.error('Watchlist update error:', err);
    }
  };

  const currentAnime = animeList[activeIndex];
  const genresList = currentAnime.genres.split(',').map((g) => g.trim());

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px', overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
      
      {/* BACKGROUND IMAGE W/ OVERLAYS */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
        <img
          src={currentAnime.bannerImage || currentAnime.posterImage}
          alt={currentAnime.title}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src = currentAnime.posterImage;
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Dark Left Side overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, #0a0a0f 0%, rgba(10, 10, 15, 0.9) 35%, rgba(10, 10, 15, 0.4) 65%, rgba(10, 10, 15, 0.1) 100%)' }} />
        {/* Bottom fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(0deg, #0a0a0f 0%, rgba(10, 10, 15, 0) 100%)' }} />
      </div>

      {/* TEXT CONTENT CONTAINER */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '100%', maxWidth: '650px', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 50px', color: '#fff' }} className="hero-text-container">
        
        {/* Trending Tag */}
        <div style={{ color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', fontSize: '14px', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Star size={16} style={{ fill: 'var(--color-primary)' }} />
          #1 Spotlight
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '42px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '16px', lineHeight: '1.1' }} className="hero-title">
          {currentAnime.title}
        </h1>

        {/* Info string */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px', alignItems: 'center' }}>
          <span style={{ background: 'var(--color-accent)', color: '#000', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>⭐ {currentAnime.score.toFixed(2)}</span>
          <span>{currentAnime.type}</span>
          <span>•</span>
          <span>{currentAnime.releasedYear}</span>
          <span>•</span>
          <span>{currentAnime.status}</span>
        </div>

        {/* Description Synopsis */}
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} className="hero-desc">
          {currentAnime.description}
        </p>

        {/* Genres */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '30px' }}>
          {genresList.map((genre) => (
            <span key={genre} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: 'var(--text-main)' }}>
              {genre}
            </span>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={() => handleWatchNow(currentAnime.slug)} className="btn-primary" style={{ padding: '12px 28px', fontSize: '15px' }}>
            <Play size={18} style={{ fill: '#fff' }} /> Watch Now
          </button>
          <button onClick={() => handleToggleWatchlist(currentAnime.id)} className="btn-secondary" style={{ padding: '12px 24px', fontSize: '15px' }}>
            {watchlistStatus[currentAnime.id] ? (
              <>
                <Check size={18} style={{ color: 'var(--color-accent)' }} /> In Watchlist
              </>
            ) : (
              <>
                <Plus size={18} /> Add Watchlist
              </>
            )}
          </button>
        </div>
      </div>

      {/* ARROWS CONTROLS */}
      <div style={{ position: 'absolute', bottom: '30px', right: '50px', zIndex: 3, display: 'flex', gap: '10px' }} className="hero-arrows">
        <button onClick={handlePrev} style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', transition: 'var(--transition-fast)' }} className="slider-arrow">
          <ChevronLeft size={20} />
        </button>
        <button onClick={handleNext} style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', transition: 'var(--transition-fast)' }} className="slider-arrow">
          <ChevronRight size={20} />
        </button>
      </div>

      <style>{`
        .slider-arrow:hover { background: var(--color-primary) !important; border-color: var(--color-primary) !important; box-shadow: var(--glow-shadow); }
        @media (max-width: 768px) {
          .hero-text-container { padding: 0 24px !important; maxWidth: 100% !important; }
          .hero-title { fontSize: 32px !important; }
          .hero-arrows { right: 24px !important; bottom: 20px !important; }
          .hero-desc { display: none !important; }
        }
      `}</style>
    </div>
  );
};
