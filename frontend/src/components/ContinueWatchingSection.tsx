import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export interface WatchProgressItem {
  id?: string;
  animeId?: string;
  slug: string;
  title: string;
  episodeNumber: number;
  seasonNumber?: number;
  episodeTitle?: string;
  thumbnail: string;
  watchedTime: number; // in seconds
  duration: number; // in seconds
  updatedAt?: string;
}

export const ContinueWatchingSection: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [historyItems, setHistoryItems] = useState<WatchProgressItem[]>([]);

  // Load history from backend if authenticated, otherwise from local storage
  useEffect(() => {
    const fetchHistory = async () => {
      // 1. Try local storage cache first
      try {
        const local = localStorage.getItem('aniverse_continue_watching');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHistoryItems(parsed);
          }
        }
      } catch (_) {}

      // 2. If authenticated, fetch from backend
      if (isAuthenticated) {
        try {
          const res = await axios.get('/api/history');
          if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            const mapped: WatchProgressItem[] = res.data.map((h: any) => ({
              id: h.id,
              animeId: h.animeId,
              slug: h.anime?.slug || h.slug || 'anime',
              title: h.anime?.title || h.title || 'Anime',
              episodeNumber: h.episodeNumber || 1,
              seasonNumber: h.seasonNumber || 1,
              episodeTitle: h.episode?.title || `Episode ${h.episodeNumber || 1}`,
              thumbnail: h.episode?.thumbnail || h.anime?.bannerImage || h.anime?.posterImage || '',
              watchedTime: Math.floor(h.watchedTime || 0),
              duration: Math.floor(h.duration || 1440),
              updatedAt: h.updatedAt,
            }));
            setHistoryItems(mapped);
            localStorage.setItem('aniverse_continue_watching', JSON.stringify(mapped));
            return;
          }
        } catch (err) {
          console.warn('Could not fetch server watch history, keeping local cache:', err);
        }
      }

      // 3. Fallback mock entries if no history exists yet so UI matches the reference mockup preview
      const existing = localStorage.getItem('aniverse_continue_watching');
      if (!existing) {
        const demoHistory: WatchProgressItem[] = [
          {
            slug: 'solo-leveling',
            title: 'Solo Leveling',
            episodeNumber: 8,
            seasonNumber: 1,
            episodeTitle: 'Arise',
            thumbnail: 'https://image.tmdb.org/t/p/original/xMNH87maNLt9n2bMDYeI6db5VFm.jpg',
            watchedTime: 754, // 12:34
            duration: 1430, // 23:50
          },
          {
            slug: 'jujutsu-kaisen',
            title: 'Jujutsu Kaisen',
            episodeNumber: 5,
            seasonNumber: 2,
            episodeTitle: 'Hidden Inventory',
            thumbnail: 'https://image.tmdb.org/t/p/original/2otstbLfQ7MXuFt1X8MFOb4OIgd.jpg',
            watchedTime: 492, // 08:12
            duration: 1420, // 23:40
          },
          {
            slug: 'demon-slayer',
            title: 'Demon Slayer',
            episodeNumber: 3,
            seasonNumber: 3,
            episodeTitle: 'Swordsmith Village',
            thumbnail: 'https://image.tmdb.org/t/p/original/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg',
            watchedTime: 980, // 16:20
            duration: 1450, // 24:10
          },
          {
            slug: 'one-piece',
            title: 'One Piece',
            episodeNumber: 1015,
            seasonNumber: 1,
            episodeTitle: 'Wano Arc • Ep 1015',
            thumbnail: 'https://image.tmdb.org/t/p/original/v38qp4bySLTXYu3MF8r5GD51FN3.jpg',
            watchedTime: 605, // 10:05
            duration: 1380, // 23:00
          },
        ];
        setHistoryItems(demoHistory);
        try {
          localStorage.setItem('aniverse_continue_watching', JSON.stringify(demoHistory));
        } catch (_) {}
      }
    };

    fetchHistory();
  }, [isAuthenticated]);

  const handleRemove = (e: React.MouseEvent, slug: string, epNum: number) => {
    e.stopPropagation();
    const updated = historyItems.filter((item) => !(item.slug === slug && item.episodeNumber === epNum));
    setHistoryItems(updated);
    try {
      localStorage.setItem('aniverse_continue_watching', JSON.stringify(updated));
    } catch (_) {}
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -460 : 460;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (historyItems.length === 0) return null;

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '42px' }}>
      {/* SECTION HEADER ROW */}
      <div className="section-header-row">
        <div className="section-title-wrap">
          <div className="section-accent-bar" />
          <h2 className="section-title">Continue Watching</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/history" className="section-see-all">
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

      {/* CAROUSEL TRACK */}
      <div
        ref={scrollRef}
        className="horizontal-carousel"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {historyItems.map((item, idx) => {
          const progressPercent = Math.min(100, Math.max(5, (item.watchedTime / (item.duration || 1440)) * 100));

          return (
            <div
              key={`${item.slug}-${item.episodeNumber}-${idx}`}
              onClick={() => navigate(`/watch/${item.slug}/episode/${item.episodeNumber}?t=${item.watchedTime}`)}
              style={{
                flex: '0 0 310px',
                scrollSnapAlign: 'start',
                cursor: 'pointer',
                userSelect: 'none',
                position: 'relative',
              }}
              className="continue-card-group"
            >
              {/* 16:9 CARD WRAPPER */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#12121A',
                  border: '1px solid #292938',
                  boxShadow: 'var(--nm-card)',
                  transition: 'var(--transition-smooth)',
                }}
                className="continue-thumbnail-box"
              >
                <img
                  src={item.thumbnail || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600'}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600';
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease',
                  }}
                  className="continue-thumb-img"
                />

                {/* PLAY BUTTON INSET ICON */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(8, 7, 11, 0.4)',
                    backdropFilter: 'blur(1px)',
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'rgba(18, 18, 26, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                      transition: 'transform 0.2s ease, background 0.2s ease',
                    }}
                    className="continue-play-circle"
                  >
                    <Play size={18} fill="#ffffff" color="#ffffff" style={{ marginLeft: '3px' }} />
                  </div>
                </div>

                {/* REMOVE / DISMISS BUTTON */}
                <button
                  onClick={(e) => handleRemove(e, item.slug, item.episodeNumber)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'rgba(8, 7, 11, 0.75)',
                    border: '1px solid #292938',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 4,
                    transition: 'var(--transition-fast)',
                  }}
                  title="Remove from history"
                >
                  <X size={14} />
                </button>

                {/* PROGRESS BAR AT BOTTOM */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    zIndex: 3,
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPercent}%`,
                      background: 'var(--color-primary)',
                      boxShadow: '0 0 8px var(--color-primary-glow)',
                    }}
                  />
                </div>
              </div>

              {/* CARD DETAILS ROW */}
              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: '3px',
                    }}
                  >
                    {item.title}
                  </h3>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    S{item.seasonNumber || 1} E{item.episodeNumber} {item.episodeTitle ? `• ${item.episodeTitle}` : ''}
                  </div>
                </div>

                {/* TIMESTAMPS */}
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {formatSeconds(item.watchedTime)} / {formatSeconds(item.duration)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .continue-card-group:hover .continue-thumbnail-box {
          border-color: rgba(243, 46, 53, 0.5);
          transform: translateY(-3px);
        }
        .continue-card-group:hover .continue-thumb-img {
          transform: scale(1.04);
        }
        .continue-card-group:hover .continue-play-circle {
          background: var(--color-primary) !important;
          border-color: var(--color-primary) !important;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};
