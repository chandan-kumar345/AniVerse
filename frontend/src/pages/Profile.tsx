import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { AnimeCard } from '../components/AnimeCard';
import type { AnimeData } from '../components/AnimeCard';
import { Heart, History, Trash2, Play, Calendar, User } from 'lucide-react';

interface WatchlistItem {
  id: string;
  status: string;
  anime: AnimeData;
}

interface HistoryItem {
  id: string;
  animeId: string;
  episodeNumber: number;
  watchedTime: number;
  duration: number;
  progressPercentage: number;
  updatedAt: string;
  anime: AnimeData;
  episode: {
    title: string;
  };
}

export const Profile: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get('tab') || 'watchlist';
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [watchlistFilter, setWatchlistFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Sync tab with URL query string
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth?redirect=/profile');
    }
  }, [isAuthenticated, authLoading]);

  // Fetch watchlist & history
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated) return;
      try {
        setLoading(true);
        const [watchRes, histRes] = await Promise.all([
          axios.get('/api/watchlist'),
          axios.get('/api/history'),
        ]);

        setWatchlist(watchRes.data.watchlist || []);
        setHistory(histRes.data.history || []);
      } catch (err) {
        console.error('Error fetching user profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated]);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleRemoveWatchlist = async (animeId: string) => {
    try {
      await axios.delete(`/api/watchlist/${animeId}`);
      setWatchlist((prev) => prev.filter((item) => item.anime.id !== animeId));
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
    }
  };

  const handleClearHistoryItem = async (animeId: string) => {
    try {
      await axios.delete(`/api/history/${animeId}`);
      setHistory((prev) => prev.filter((item) => item.animeId !== animeId));
    } catch (err) {
      console.error('Failed to clear watch history item:', err);
    }
  };

  // Filter watchlist list
  const filteredWatchlist = watchlist.filter((item) => {
    if (watchlistFilter === 'ALL') return true;
    return item.status === watchlistFilter;
  });

  if (authLoading || loading) {
    return (
      <div className="app-container" style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ height: '220px', width: '100%', borderRadius: '12px' }} className="shimmer" />
        <div style={{ height: '400px', width: '100%', borderRadius: '12px' }} className="shimmer" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="app-container" style={{ padding: '30px 20px', color: '#fff' }}>
      
      {/* USER HERO PROFILE CARD */}
      <div className="glass-panel profile-hero" style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', padding: '30px', alignItems: 'center', marginBottom: '40px' }}>
        {/* Large Avatar */}
        <div style={{ flexShrink: 0 }}>
          <img
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
            alt="user avatar"
            referrerPolicy="no-referrer"
            style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '4px solid var(--color-primary)', padding: '4px' }}
          />
        </div>

        {/* Username/Meta */}
        <div style={{ flex: 1, minWidth: '250px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
            {user.username}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> Role: <span style={{ color: '#fff', fontWeight: 600 }}>{user.role}</span></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> Registered: <span style={{ color: '#fff', fontWeight: 600 }}>{new Date().toLocaleDateString()}</span></span>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div style={{ display: 'flex', gap: '20px' }} className="profile-stats">
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 20px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)' }}>{watchlist.length}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Watchlist Items</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 20px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-teal)' }}>{history.length}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Anime Watched</div>
          </div>
        </div>
      </div>

      {/* TABS SELECTION */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '30px', gap: '8px' }}>
        <button
          onClick={() => handleTabChange('watchlist')}
          style={{ background: 'none', border: 'none', color: activeTab === 'watchlist' ? 'var(--color-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'watchlist' ? '3px solid var(--color-primary)' : '3px solid transparent', padding: '12px 20px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'var(--transition-fast)' }}
          className="profile-tab-btn"
        >
          <Heart size={16} /> My Watchlist
        </button>
        <button
          onClick={() => handleTabChange('history')}
          style={{ background: 'none', border: 'none', color: activeTab === 'history' ? 'var(--color-primary)' : 'var(--text-muted)', borderBottom: activeTab === 'history' ? '3px solid var(--color-primary)' : '3px solid transparent', padding: '12px 20px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'var(--transition-fast)' }}
          className="profile-tab-btn"
        >
          <History size={16} /> Watch History
        </button>
      </div>

      {/* WATCHLIST TAB PANEL */}
      {activeTab === 'watchlist' && (
        <div>
          {/* Sub Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
            {['ALL', 'WATCHING', 'PLAN_TO_WATCH', 'COMPLETED', 'DROPPED'].map((status) => (
              <button
                key={status}
                onClick={() => setWatchlistFilter(status)}
                style={{ background: watchlistFilter === status ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)', color: watchlistFilter === status ? 'var(--color-primary)' : 'var(--text-muted)', border: watchlistFilter === status ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.05)', padding: '6px 16px', fontSize: '12px', fontWeight: 600, borderRadius: '20px', cursor: 'pointer', transition: 'var(--transition-fast)' }}
                className="watchlist-filter-btn"
              >
                {status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {filteredWatchlist.length === 0 ? (
            <div style={{ background: '#12121c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <h3>Your watchlist is empty under this category.</h3>
              <p style={{ marginTop: '6px', fontSize: '14px' }}>Add some titles to keep track of your progress.</p>
              <Link to="/search" className="btn-primary" style={{ marginTop: '20px', padding: '8px 24px', fontSize: '13px', textDecoration: 'none' }}>
                Browse Catalog
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '30px 20px' }}>
              {filteredWatchlist.map((item) => (
                <div key={item.id} style={{ position: 'relative' }} className="watchlist-card-container">
                  <AnimeCard anime={item.anime} />
                  {/* Remove Button Overlay */}
                  <button
                    onClick={() => handleRemoveWatchlist(item.anime.id)}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.95)', border: 'none', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.5)', zIndex: 10 }}
                    title="Remove from list"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* WATCH HISTORY TAB PANEL */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {history.length === 0 ? (
            <div style={{ background: '#12121c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <h3>You have not watched any episodes yet.</h3>
              <p style={{ marginTop: '6px', fontSize: '14px' }}>Stream anime episodes and your logs will appear here.</p>
              <Link to="/" className="btn-primary" style={{ marginTop: '20px', padding: '8px 24px', fontSize: '13px', textDecoration: 'none' }}>
                Browse Spotlight
              </Link>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', background: '#12121c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px', alignItems: 'center' }}
                className="history-row"
              >
                {/* Poster image */}
                <img
                  src={item.anime.posterImage}
                  alt={item.anime.title}
                  referrerPolicy="no-referrer"
                  style={{ width: '50px', height: '70px', objectFit: 'cover', borderRadius: '6px' }}
                />

                {/* Details */}
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <h4 style={{ fontSize: '16px', color: '#fff', fontWeight: 600, marginBottom: '4px' }}>
                    {item.anime.title}
                  </h4>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Watched: <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Episode {item.episodeNumber}</span>
                  </div>

                  {/* Progress completion bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, maxWidth: '280px', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.progressPercentage}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '3px' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-dark)' }}>
                      {Math.round(item.progressPercentage)}% completed
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px' }} className="history-actions">
                  <Link
                    to={`/watch/${item.anime.slug}/episode/${item.episodeNumber}`}
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none', gap: '6px' }}
                  >
                    <Play size={14} style={{ fill: '#fff' }} /> Resume
                  </Link>
                  <button
                    onClick={() => handleClearHistoryItem(item.animeId)}
                    style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', transition: 'var(--transition-fast)' }}
                    className="history-delete-btn"
                    title="Remove from history"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        .profile-tab-btn:hover { color: var(--color-primary) !important; }
        .watchlist-filter-btn:hover { background: rgba(255,255,255,0.06) !important; }
        .history-delete-btn:hover { background: rgba(239, 68, 68, 0.15) !important; }
        @media (max-width: 600px) {
          .profile-hero { justify-content: center; text-align: center; }
          .profile-stats { margin-top: 10px; width: 100%; justify-content: center; }
          .history-row { text-align: center; justify-content: center; }
          .history-actions { width: 100%; justify-content: center; margin-top: 10px; }
        }
      `}</style>
    </div>
  );
};
