import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { AnimeData } from './AnimeCard';

interface TrendingCarouselProps {
  animeList: AnimeData[];
}

export const TrendingCarousel: React.FC<TrendingCarouselProps> = ({ animeList }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -420 : 420;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!animeList || animeList.length === 0) return null;

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '42px' }}>
      {/* SECTION HEADER ROW */}
      <div className="section-header-row">
        <div className="section-title-wrap">
          <div className="section-accent-bar" />
          <h2 className="section-title">Trending Now</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/discover?sort=TRENDING_DESC" className="section-see-all">
            See All &rarr;
          </Link>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => handleScroll('left')}
              className="carousel-nav-btn"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="carousel-nav-btn"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* HORIZONTAL CAROUSEL */}
      <div
        ref={scrollRef}
        className="horizontal-carousel"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {animeList.slice(0, 15).map((anime, index) => {
          const rank = index + 1;
          const genresList = anime.genres ? anime.genres.split(',').map((g) => g.trim()) : [];
          const primaryGenre = genresList[0] || 'Anime';
          const epCount = anime.episodes && anime.episodes.length > 0
            ? `${anime.episodes.length} eps`
            : (anime.status === 'Currently Airing' ? 'Airing' : '24 eps');

          return (
            <div
              key={anime.id || index}
              onClick={() => navigate(`/anime/${anime.slug}`)}
              style={{
                flex: '0 0 205px',
                scrollSnapAlign: 'start',
                cursor: 'pointer',
                userSelect: 'none',
                position: 'relative',
              }}
              className="trending-card-group"
            >
              {/* CARD POSTER WRAPPER */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16/23',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#12121A',
                  border: '1px solid #292938',
                  boxShadow: 'var(--nm-card)',
                  transition: 'var(--transition-smooth)',
                }}
                className="trending-poster-box"
              >
                <img
                  src={anime.posterImage || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400'}
                  alt={anime.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400';
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease',
                  }}
                  className="trending-poster-img"
                />

                {/* RANKING NUMBER OVERLAY */}
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '12px',
                    zIndex: 2,
                  }}
                >
                  <span className="trending-rank-num">{rank}</span>
                </div>

                {/* HD BADGE OVERLAY */}
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 2,
                  }}
                >
                  <span className="badge-hd">HD</span>
                </div>

                {/* PLAY HOVER OVERLAY */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(8, 7, 11, 0.55)',
                    backdropFilter: 'blur(2px)',
                    opacity: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'opacity 0.25s ease',
                    zIndex: 3,
                  }}
                  className="trending-play-overlay"
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 16px var(--color-primary-glow)',
                    }}
                  >
                    <Play size={20} fill="#fff" color="#fff" style={{ marginLeft: '3px' }} />
                  </div>
                </div>

                {/* BOTTOM GRADIENT VIGNETTE */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    background: 'linear-gradient(to top, rgba(8, 7, 11, 0.95) 0%, transparent 100%)',
                    zIndex: 1,
                  }}
                />
              </div>

              {/* TITLE & META INFORMATION */}
              <div style={{ marginTop: '10px' }}>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: '4px',
                  }}
                  title={anime.englishTitle || anime.title}
                >
                  {anime.title}
                </h3>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{anime.releasedYear || 2024}</span>
                  <span>&bull;</span>
                  <span>{primaryGenre}</span>
                  <span>&bull;</span>
                  <span>{epCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .trending-card-group:hover .trending-poster-box {
          transform: translateY(-4px);
          border-color: rgba(243, 46, 53, 0.5);
          box-shadow: var(--nm-card-hover);
        }
        .trending-card-group:hover .trending-poster-img {
          transform: scale(1.05);
        }
        .trending-card-group:hover .trending-play-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};
