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
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Active items limit to top 10
  const activeItems = animeList.slice(0, 10);

  useEffect(() => {
    if (activeItems.length === 0) return;

    const stepTime = 50; // ms
    const totalTime = 6000; // ms

    const timer = setInterval(() => {
      if (isHovered) return;

      setProgress((prev) => {
        if (prev >= 100) {
          setActiveIndex((idx) => (idx + 1) % activeItems.length);
          return 0;
        }
        return prev + (stepTime / totalTime) * 100;
      });
    }, stepTime);

    return () => clearInterval(timer);
  }, [activeItems.length, isHovered]);

  // Fetch watchlist status for hero items if logged in
  useEffect(() => {
    const fetchWatchlistStatuses = async () => {
      if (!isAuthenticated || activeItems.length === 0) return;
      try {
        const statuses: Record<string, boolean> = {};
        await Promise.all(
          activeItems.map(async (anime) => {
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
  }, [activeItems, isAuthenticated]);

  if (animeList.length === 0) {
    return (
      <div style={{ height: '600px', width: '100%', borderRadius: '16px' }} className="shimmer" />
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? activeItems.length - 1 : prev - 1));
    setProgress(0);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === activeItems.length - 1 ? 0 : prev + 1));
    setProgress(0);
  };

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
    setProgress(0);
  };

  const handleWatchNow = (slug: string) => {
    navigate(`/watch/${slug}/episode/1`);
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

  const getHDImageUrl = (url: string | null | undefined) => {
    if (!url) return '';
    if (url.includes('image.tmdb.org')) {
      return url.replace(/\/w\d+/, '/original');
    }
    return url;
  };

  return (
    <div
      className="hero-slider-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {activeItems.map((anime, index) => {
        const isActive = index === activeIndex;
        const genresList = anime.genres.split(',').map((g) => g.trim());
        const hasBanner = !!anime.bannerImage;
        const hdImage = getHDImageUrl(anime.bannerImage || anime.posterImage);

        return (
          <div
            key={anime.id}
            className={`hero-slide ${isActive ? 'active' : 'inactive'}`}
          >
            {/* BACKGROUND BACKDROP */}
            {hasBanner ? (
              <>
                <div className="hero-backdrop-banner">
                  <img
                    src={hdImage}
                    alt={anime.title}
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
                  />
                </div>
                <div className="hero-overlay-main" />
                <div className="hero-overlay-bottom" />
              </>
            ) : (
              <>
                {/* Fallback for portrait poster image */}
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 1,
                    filter: 'blur(20px) brightness(0.25)',
                    transform: 'scale(1.15)',
                  }}
                >
                  <img
                    src={anime.posterImage}
                    alt=""
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div className="hero-poster-wrapper">
                  <div className="hero-poster-card">
                    <img
                      src={anime.posterImage}
                      alt={anime.title}
                      referrerPolicy="no-referrer"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, #0a090c 0%, rgba(10, 9, 12, 0.8) 50%, rgba(10, 9, 12, 0.4) 100%)',
                    zIndex: 2,
                  }}
                />
                <div className="hero-overlay-bottom" />
              </>
            )}

            {/* TEXT CONTENT CONTAINER */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: '100%',
                maxWidth: '650px',
                zIndex: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '0 50px',
                color: '#fff',
              }}
              className="hero-text-container"
            >
              {/* Spotlight Tag */}
              <div
                className="hero-tag"
                style={{
                  color: 'var(--color-primary)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  fontSize: '14px',
                  letterSpacing: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <Star size={16} style={{ fill: 'var(--color-primary)' }} />
                #1 Spotlight
              </div>

              {/* Title */}
              <h1
                className="hero-title"
                style={{
                  fontSize: '42px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  marginBottom: '16px',
                  lineHeight: '1.1',
                }}
              >
                {anime.title}
              </h1>

              {/* Info string */}
              <div
                className="hero-info"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '14px',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  marginBottom: '18px',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    background: 'var(--color-accent)',
                    color: '#000',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  ⭐ {anime.score.toFixed(2)}
                </span>
                <span>{anime.type}</span>
                <span>•</span>
                <span>{anime.releasedYear}</span>
                <span>•</span>
                <span>{anime.status}</span>
              </div>

              {/* Description Synopsis */}
              <p
                className="hero-desc"
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  marginBottom: '24px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {anime.description}
              </p>

              {/* Genres */}
              <div
                className="hero-genres"
                style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '30px' }}
              >
                {genresList.map((genre) => (
                  <span
                    key={genre}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      color: 'var(--text-main)',
                    }}
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Buttons */}
              <div className="hero-btns" style={{ display: 'flex', gap: '16px' }}>
                <button
                  onClick={() => handleWatchNow(anime.slug)}
                  className="btn-primary"
                  style={{ padding: '12px 28px', fontSize: '15px' }}
                >
                  <Play size={18} style={{ fill: '#fff' }} /> Watch Now
                </button>
                <button
                  onClick={() => handleToggleWatchlist(anime.id)}
                  className="btn-secondary"
                  style={{ padding: '12px 24px', fontSize: '15px' }}
                >
                  {watchlistStatus[anime.id] ? (
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
          </div>
        );
      })}

      {/* ARROWS CONTROLS */}
      <div
        style={{
          position: 'absolute',
          bottom: '30px',
          right: '50px',
          zIndex: 10,
          display: 'flex',
          gap: '10px',
        }}
        className="hero-arrows"
      >
        <button
          onClick={handlePrev}
          style={{
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.5)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
          className="slider-arrow"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={handleNext}
          style={{
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.5)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
          className="slider-arrow"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* DOT INDICATORS */}
      <div className="hero-indicators">
        {activeItems.map((_, idx) => (
          <button
            key={idx}
            onClick={() => handleDotClick(idx)}
            className={`hero-dot ${idx === activeIndex ? 'active' : ''}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* AUTOPLAY PROGRESS BAR */}
      <div className="hero-progress-bar-container">
        <div
          className="hero-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      <style>{`
        .hero-slider-container {
          position: relative;
          width: 100%;
          height: 600px;
          overflow: hidden;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          background-color: #0a090c;
          box-shadow: var(--glass-shadow);
        }

        .hero-slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          pointer-events: none;
          transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1), transform 1s cubic-bezier(0.4, 0, 0.2, 1);
          transform: scale(1.03);
        }

        .hero-slide.active {
          opacity: 1;
          pointer-events: auto;
          transform: scale(1);
          z-index: 2;
        }

        .hero-slide.inactive {
          z-index: 1;
        }

        .hero-backdrop-banner {
          width: 65%;
          height: 100%;
          position: absolute;
          top: 0;
          right: 0;
          z-index: 1;
          transition: transform 1.2s ease-out;
        }

        .hero-slide.active .hero-backdrop-banner {
          transform: scale(1.02);
        }

        .hero-overlay-main {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, #0a090c 0%, #0a090c 35%, rgba(10, 9, 12, 0.95) 45%, rgba(10, 9, 12, 0.6) 65%, rgba(10, 9, 12, 0) 90%);
          z-index: 2;
        }

        .hero-overlay-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 150px;
          background: linear-gradient(0deg, #0a090c 0%, rgba(10, 9, 12, 0) 100%);
          z-index: 2;
        }

        /* Staggered entrance animations for text elements */
        .hero-slide .hero-text-container > * {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .hero-slide.active .hero-text-container > * {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-slide.active .hero-tag { transition-delay: 0.1s; }
        .hero-slide.active .hero-title { transition-delay: 0.2s; }
        .hero-slide.active .hero-info { transition-delay: 0.3s; }
        .hero-slide.active .hero-desc { transition-delay: 0.4s; }
        .hero-slide.active .hero-genres { transition-delay: 0.5s; }
        .hero-slide.active .hero-btns { transition-delay: 0.6s; }

        /* Poster Card Fallback floating effect */
        .hero-poster-wrapper {
          position: absolute;
          top: 0;
          right: 12%;
          height: 100%;
          width: 30%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .hero-poster-card {
          width: 200px;
          aspect-ratio: 2/3;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.6);
          transform: rotate(2deg) translateY(-10px);
          animation: floatCard 6s ease-in-out infinite alternate;
        }

        @keyframes floatCard {
          0% { transform: translateY(-5px) rotate(1deg); }
          100% { transform: translateY(10px) rotate(3deg); }
        }

        /* Indicators styling */
        .hero-indicators {
          position: absolute;
          bottom: 30px;
          left: 50px;
          z-index: 10;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .hero-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.3s ease;
        }

        .hero-dot.active {
          background: var(--color-primary);
          width: 28px;
          border-radius: 5px;
          box-shadow: var(--glow-shadow);
        }

        /* Autoplay Progress Bar */
        .hero-progress-bar-container {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.05);
          z-index: 10;
        }

        .hero-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-accent) 100%);
          width: 0%;
          transition: width 0.05s linear;
        }

        .slider-arrow:hover { 
          background: var(--color-primary) !important; 
          border-color: var(--color-primary) !important; 
          box-shadow: var(--glow-shadow); 
        }

        @media (max-width: 992px) {
          .hero-backdrop-banner {
            width: 80%;
          }
          .hero-overlay-main {
            background: linear-gradient(90deg, #0a090c 0%, #0a090c 20%, rgba(10, 9, 12, 0.9) 50%, rgba(10, 9, 12, 0.4) 100%);
          }
          .hero-poster-wrapper {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .hero-slider-container {
            height: 480px;
          }
          .hero-backdrop-banner {
            width: 100%;
          }
          .hero-overlay-main {
            background: linear-gradient(90deg, #0a090c 0%, rgba(10, 9, 12, 0.95) 40%, rgba(10, 9, 12, 0.8) 100%);
          }
          .hero-text-container {
            padding: 0 24px !important;
            max-width: 100% !important;
          }
          .hero-title {
            font-size: 30px !important;
          }
          .hero-arrows {
            display: none !important;
          }
          .hero-indicators {
            left: 24px !important;
            bottom: 20px !important;
          }
          .hero-desc {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
