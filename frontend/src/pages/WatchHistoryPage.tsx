import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { History, Play, Trash2, ArrowRight } from 'lucide-react';

export interface HistoryDisplayItem {
  id: string;
  animeId: string;
  slug: string;
  title: string;
  episodeNumber: number;
  seasonNumber?: number;
  episodeTitle?: string;
  thumbnail: string;
  watchedTime: number;
  duration: number;
}

export const WatchHistoryPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [history, setHistory] = useState<HistoryDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Watch History | ANIVERSES';
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);

      // 1. Try local storage continue watching items first
      try {
        const local = localStorage.getItem('aniverse_continue_watching');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHistory(parsed);
          }
        }
      } catch (_) {}

      // 2. If authenticated, fetch from backend
      if (isAuthenticated) {
        try {
          const res = await axios.get('/api/history');
          if (res.data?.history && res.data.history.length > 0) {
            const mapped: HistoryDisplayItem[] = res.data.history.map((h: any) => ({
              id: h.id,
              animeId: h.animeId,
              slug: h.anime?.slug || 'anime',
              title: h.anime?.title || 'Anime',
              episodeNumber: h.episodeNumber || 1,
              seasonNumber: h.seasonNumber || 1,
              episodeTitle: h.episode?.title || `Episode ${h.episodeNumber || 1}`,
              thumbnail: h.episode?.thumbnail || h.anime?.bannerImage || h.anime?.posterImage || '',
              watchedTime: Math.floor(h.watchedTime || 0),
              duration: Math.floor(h.duration || 1440),
            }));
            setHistory(mapped);
          }
        } catch (_) {}
      }

      setLoading(false);
    };

    fetchHistory();
  }, [isAuthenticated]);

  const handleClear = async (slug: string, epNum: number) => {
    const updated = history.filter((item) => !(item.slug === slug && item.episodeNumber === epNum));
    setHistory(updated);
    try {
      localStorage.setItem('aniverse_continue_watching', JSON.stringify(updated));
    } catch (_) {}
  };

  const handleClearAll = () => {
    setHistory([]);
    try {
      localStorage.removeItem('aniverse_continue_watching');
    } catch (_) {}
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', padding: '36px 24px 80px 24px', color: '#fff' }}>
      <div className="app-container">
        {/* HEADER BAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(243, 46, 53, 0.15)', border: '1px solid rgba(243, 46, 53, 0.4)', padding: '10px', borderRadius: '10px', display: 'flex' }}>
              <History size={22} color="var(--color-primary)" />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
                Watch History
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>
                Resume where you left off across all episodes and movies.
              </p>
            </div>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                background: '#12121A',
                border: '1px solid #292938',
                borderRadius: '8px',
                padding: '8px 16px',
                color: 'var(--color-primary)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Clear Entire History
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: '90px', borderRadius: '12px', background: '#12121A', border: '1px solid #292938' }} className="shimmer" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#12121A', border: '1px solid #292938', borderRadius: '16px' }}>
            <History size={36} color="var(--border-color)" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
              No Watch History
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Episodes you stream will automatically appear here with saved resume playback positions.
            </p>
            <Link
              to="/"
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                textDecoration: 'none',
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Discover Anime <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map((item) => {
              const percent = Math.min(100, Math.max(5, (item.watchedTime / (item.duration || 1440)) * 100));

              return (
                <div
                  key={`${item.slug}-${item.episodeNumber}`}
                  style={{
                    background: '#12121A',
                    border: '1px solid #292938',
                    borderRadius: '12px',
                    padding: '12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: 'var(--nm-card)',
                    transition: 'var(--transition-smooth)',
                  }}
                  className="history-row"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                    {/* THUMBNAIL */}
                    <div
                      style={{
                        width: '90px',
                        aspectRatio: '16/9',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        position: 'relative',
                        flexShrink: 0,
                        border: '1px solid #292938',
                      }}
                    >
                      <img
                        src={item.thumbnail || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300'}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          background: 'rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        <div style={{ width: `${percent}%`, height: '100%', background: 'var(--color-primary)' }} />
                      </div>
                    </div>

                    {/* TITLE & EPISODE INFO */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: '#fff',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginBottom: '3px',
                        }}
                      >
                        {item.title}
                      </h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Episode {item.episodeNumber} {item.episodeTitle ? `• ${item.episodeTitle}` : ''}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600, marginTop: '3px' }}>
                        Progress: {formatSeconds(item.watchedTime)} / {formatSeconds(item.duration)} ({Math.round(percent)}%)
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Link
                      to={`/watch/${item.slug}/episode/${item.episodeNumber}?t=${item.watchedTime}`}
                      style={{
                        background: 'var(--color-primary)',
                        color: '#fff',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Play size={13} fill="#fff" /> Resume
                    </Link>
                    <button
                      onClick={() => handleClear(item.slug, item.episodeNumber)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #292938',
                        color: 'var(--text-muted)',
                        borderRadius: '6px',
                        padding: '8px',
                        cursor: 'pointer',
                      }}
                      title="Remove from history"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .history-row:hover {
          border-color: rgba(243, 46, 53, 0.4) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};
