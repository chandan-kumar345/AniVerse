import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { AnimeCard } from '../components/AnimeCard';
import type { AnimeData } from '../components/AnimeCard';
import { Heart, Trash2 } from 'lucide-react';

interface WatchlistItem {
  id: string;
  status: string;
  anime: AnimeData;
}

export const WatchlistPage: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'My Watchlist - AniVerse';
    if (!authLoading && !isAuthenticated) {
      navigate('/auth?redirect=/watchlist');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!isAuthenticated) return;
      try {
        setLoading(true);
        const res = await axios.get('/api/watchlist');
        setWatchlist(res.data.watchlist || []);
      } catch (err) {
        console.error('Error fetching watchlist:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWatchlist();
  }, [isAuthenticated]);

  const handleRemove = async (animeId: string) => {
    try {
      await axios.delete(`/api/watchlist/${animeId}`);
      setWatchlist(prev => prev.filter(item => item.anime.id !== animeId));
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
    }
  };

  const filtered = watchlist.filter(item => {
    if (filter === 'ALL') return true;
    return item.status.toUpperCase() === filter;
  });

  return (
    <div className="app-container" style={{ padding: '30px 24px', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
            <Heart size={22} style={{ color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, margin: 0 }}>
              My Watchlist
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' }}>
              Track your saved anime series and movies.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'WATCHING', 'COMPLETED', 'PLAN_TO_WATCH'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`nm-pill ${filter === s ? 'active' : ''}`}
              style={{ padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: '280px', borderRadius: '12px' }} className="shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
          <h3>Your watchlist is currently empty.</h3>
          <Link to="/search" style={{ color: '#8b5cf6', marginTop: '10px', display: 'inline-block' }}>
            Browse Catalog to add titles
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '22px' }}>
          {filtered.map(item => (
            <div key={item.id} style={{ position: 'relative' }}>
              <AnimeCard anime={item.anime} />
              <button
                onClick={() => handleRemove(item.anime.id)}
                className="nm-pill"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#ef4444',
                  padding: '6px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  zIndex: 20
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
  );
};
