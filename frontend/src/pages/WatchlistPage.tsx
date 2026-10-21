import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { AnimeCard, type AnimeData } from '../components/AnimeCard';
import { Bookmark, Trash2, Search } from 'lucide-react';

interface WatchlistItem {
  id: string;
  status: string;
  anime: AnimeData;
}

export const WatchlistPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'My Watchlist | ANIVERSES';
  }, []);

  useEffect(() => {
    const fetchWatchlist = async () => {
      setLoading(true);

      // 1. If authenticated, try fetching from backend
      if (isAuthenticated) {
        try {
          const res = await axios.get('/api/watchlist');
          if (res.data?.watchlist && res.data.watchlist.length > 0) {
            setWatchlist(res.data.watchlist);
            setLoading(false);
            return;
          }
        } catch (_) {}
      }

      // 2. Local storage fallback
      try {
        const local = localStorage.getItem('aniverse_local_watchlist');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
            setWatchlist(parsed);
          }
        }
      } catch (_) {}

      setLoading(false);
    };

    fetchWatchlist();
  }, [isAuthenticated]);

  const handleRemove = async (animeId: string) => {
    if (isAuthenticated) {
      try {
        await axios.delete(`/api/watchlist/${animeId}`);
      } catch (_) {}
    }

    const updated = watchlist.filter((item) => item.anime.id !== animeId);
    setWatchlist(updated);
    try {
      localStorage.setItem('aniverse_local_watchlist', JSON.stringify(updated));
    } catch (_) {}
  };

  const filtered = watchlist.filter((item) => {
    if (filter === 'ALL') return true;
    return item.status.toUpperCase() === filter;
  });

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', padding: '36px 24px 80px 24px', color: '#fff' }}>
      <div className="app-container">
        {/* HEADER BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(243, 46, 53, 0.15)', border: '1px solid rgba(243, 46, 53, 0.4)', padding: '10px', borderRadius: '10px', display: 'flex' }}>
              <Bookmark size={22} color="var(--color-primary)" />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
                My Watchlist
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>
                Track saved anime series, movies, and planned watches.
              </p>
            </div>
          </div>

          {/* FILTER TABS */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['ALL', 'WATCHING', 'PLAN_TO_WATCH', 'COMPLETED'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: filter === s ? 'var(--color-primary)' : '#292938',
                  background: filter === s ? 'var(--color-primary)' : '#12121A',
                  color: filter === s ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                  transition: 'var(--transition-fast)',
                }}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '18px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: '2/3', borderRadius: '12px', background: '#12121A', border: '1px solid #292938' }} className="shimmer" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#12121A', border: '1px solid #292938', borderRadius: '16px' }}>
            <Bookmark size={36} color="var(--border-color)" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
              Your watchlist is currently empty
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Browse the discovery catalogue and add titles to your personal list.
            </p>
            <Link
              to="/discover"
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
              <Search size={14} /> Explore Catalogue
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '18px' }}>
            {filtered.map((item) => (
              <div key={item.anime.id} style={{ position: 'relative' }}>
                <AnimeCard anime={item.anime} />
                <button
                  onClick={() => handleRemove(item.anime.id)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(8, 7, 11, 0.85)',
                    border: '1px solid #292938',
                    color: 'var(--color-primary)',
                    borderRadius: '6px',
                    padding: '5px',
                    cursor: 'pointer',
                    zIndex: 10,
                  }}
                  title="Remove from watchlist"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
