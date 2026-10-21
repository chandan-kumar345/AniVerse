import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { anilistService, type AniListMedia } from '../services/anilistService';

export const SeasonalAnimeSection: React.FC = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [seasonalAnime, setSeasonalAnime] = useState<AniListMedia[]>([]);
  const [activeSeason, setActiveSeason] = useState<'FALL' | 'SUMMER' | 'SPRING' | 'WINTER'>('FALL');
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    let isMounted = true;
    const fetchSeasonal = async () => {
      try {
        const items = await anilistService.getSeasonal(activeSeason, currentYear, 1, 12);
        if (items && items.length > 0 && isMounted) {
          setSeasonalAnime(items);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch seasonal anime:', err);
      }
    };

    fetchSeasonal();
    return () => {
      isMounted = false;
    };
  }, [activeSeason, currentYear]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -420 : 420;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const seasons: { key: 'FALL' | 'SUMMER' | 'SPRING' | 'WINTER'; label: string }[] = [
    { key: 'FALL', label: 'Fall' },
    { key: 'SUMMER', label: 'Summer' },
    { key: 'SPRING', label: 'Spring' },
    { key: 'WINTER', label: 'Winter' },
  ];

  if (seasonalAnime.length === 0) return null;

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '48px' }}>
      {/* SECTION HEADER ROW */}
      <div className="section-header-row">
        <div className="section-title-wrap">
          <div className="section-accent-bar" />
          <h2 className="section-title">Seasonal Anime</h2>
          <span className="section-subtitle">{activeSeason} {currentYear}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* SEASON SWITCHER PILLS */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {seasons.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSeason(s.key)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: activeSeason === s.key ? 'var(--color-primary)' : '#292938',
                  background: activeSeason === s.key ? 'var(--color-primary)' : '#12121A',
                  color: activeSeason === s.key ? '#fff' : 'var(--text-muted)',
                  transition: 'var(--transition-fast)',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <Link to={`/discover?season=${activeSeason}&year=${currentYear}`} className="section-see-all">
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
        {seasonalAnime.map((anime) => {
          const title = anime.title.english || anime.title.romaji || 'Anime';
          const slug = anime.slug || title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
          const primaryGenre = anime.genres?.[0] || 'Anime';
          const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : '7.5';

          return (
            <div
              key={anime.id}
              onClick={() => navigate(`/anime/${slug}`)}
              style={{
                flex: '0 0 190px',
                scrollSnapAlign: 'start',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              className="seasonal-card-wrap"
            >
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
                className="seasonal-card-box"
              >
                <img
                  src={anime.coverImage?.large || anime.coverImage?.medium || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400'}
                  alt={title}
                  referrerPolicy="no-referrer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(8, 7, 11, 0.85)',
                    border: '1px solid #292938',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#facc15',
                  }}
                >
                  <Star size={10} style={{ fill: '#facc15' }} />
                  {score}
                </div>
              </div>
              <div style={{ marginTop: '8px' }}>
                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: '2px',
                  }}
                  title={title}
                >
                  {title}
                </h4>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {primaryGenre} {anime.episodes ? `• ${anime.episodes} eps` : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .seasonal-card-wrap:hover .seasonal-card-box {
          border-color: rgba(243, 46, 53, 0.5);
          transform: translateY(-3px);
          box-shadow: var(--nm-card-hover);
        }
      `}</style>
    </div>
  );
};
