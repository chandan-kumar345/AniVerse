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
      <div
        className="nm-card profile-hero"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '30px',
          padding: '32px',
          borderRadius: '24px',
          alignItems: 'center',
          marginBottom: '36px'
        }}
      >
        {/* Large Avatar */}
        <div style={{ flexShrink: 0 }}>
          <img
            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
            alt="user avatar"
            referrerPolicy="no-referrer"
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              background: 'var(--bg-surface-elevated)',
              border: '3px solid rgba(243, 46, 53, 0.45)',
              boxShadow: '6px 6px 16px #020102, -4px -4px 12px #1c1a20',
              padding: '4px'
            }}
          />
        </div>

        {/* Username/Meta */}
        <div style={{ flex: 1, minWidth: '250px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '8px', color: '#fff' }}>
            {user.username}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> Role: <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{user.role}</span></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> Registered: <span style={{ color: '#fff', fontWeight: 600 }}>{new Date().toLocaleDateString()}</span></span>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div style={{ display: 'flex', gap: '16px' }} className="profile-stats">
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              boxShadow: '4px 4px 10px #090a10, -3px -3px 8px #20233c',
              border: '1px solid rgba(255,255,255,0.04)',
              padding: '14px 22px',
              borderRadius: '16px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-primary)' }}>{watchlist.length}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Watchlist Items</div>
          </div>
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              boxShadow: '4px 4px 10px #090a10, -3px -3px 8px #20233c',
              border: '1px solid rgba(255,255,255,0.04)',
              padding: '14px 22px',
              borderRadius: '16px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-teal)' }}>{history.length}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Anime Watched</div>
          </div>
        </div>
      </div>

      {/* TABS SELECTION - Neumorphic Well */}
      <div
        style={{
          display: 'inline-flex',
          background: 'var(--bg-surface-recessed)',
          boxShadow: 'var(--nm-inset)',
          border: '1px solid rgba(255,255,255,0.03)',
          borderRadius: '9999px',
          padding: '5px',
          marginBottom: '30px',
          gap: '6px'
        }}
      >
        <button
          onClick={() => handleTabChange('watchlist')}
          className={activeTab === 'watchlist' ? 'nm-btn-primary' : ''}
          style={{
            border: 'none',
            background: activeTab === 'watchlist' ? undefined : 'transparent',
            color: activeTab === 'watchlist' ? '#fff' : 'var(--text-muted)',
            padding: '10px 22px',
            fontSize: '14px',
            fontWeight: 700,
            borderRadius: '9999px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Heart size={16} /> My Watchlist
        </button>
        <button
          onClick={() => handleTabChange('history')}
          className={activeTab === 'history' ? 'nm-btn-primary' : ''}
          style={{
            border: 'none',
            background: activeTab === 'history' ? undefined : 'transparent',
            color: activeTab === 'history' ? '#fff' : 'var(--text-muted)',
            padding: '10px 22px',
            fontSize: '14px',
            fontWeight: 700,
            borderRadius: '9999px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <History size={16} /> Watch History
        </button>
      </div>

      {/* WATCHLIST TAB PANEL */}
      {activeTab === 'watchlist' && (
        <div>
          {/* Sub Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '26px' }}>
            {['ALL', 'WATCHING', 'PLAN_TO_WATCH', 'COMPLETED', 'DROPPED'].map((status) => {
              const isSelected = watchlistFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setWatchlistFilter(status)}
                  className={isSelected ? 'nm-btn-primary' : 'nm-pill'}
                  style={{
                    padding: '7px 18px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 800 : 600,
                    borderRadius: '9999px',
                    cursor: 'pointer'
                  }}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              );
            })}
          </div>

          {filteredWatchlist.length === 0 ? (
            <div
              className="nm-card"
              style={{
                borderRadius: '24px',
                padding: '60px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}
            >
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 800 }}>Your watchlist is empty under this category.</h3>
              <p style={{ marginTop: '8px', fontSize: '14px' }}>Add some titles to keep track of your progress.</p>
              <Link
                to="/search"
                className="nm-btn-primary"
                style={{ marginTop: '22px', padding: '10px 28px', fontSize: '13px', textDecoration: 'none', display: 'inline-block', borderRadius: '9999px' }}
              >
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
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(239, 68, 68, 0.95)',
                      border: 'none',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                      zIndex: 10
                    }}
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
            <div
              className="nm-card"
              style={{
                borderRadius: '24px',
                padding: '60px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}
            >
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 800 }}>You have not watched any episodes yet.</h3>
              <p style={{ marginTop: '8px', fontSize: '14px' }}>Stream anime episodes and your logs will appear here.</p>
              <Link
                to="/"
                className="nm-btn-primary"
                style={{ marginTop: '22px', padding: '10px 28px', fontSize: '13px', textDecoration: 'none', display: 'inline-block', borderRadius: '9999px' }}
              >
                Browse Spotlight
              </Link>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="nm-card history-row"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '20px',
                  borderRadius: '18px',
                  padding: '16px 20px',
                  alignItems: 'center'
                }}
              >
                {/* Poster image */}
                <div
                  style={{
                    width: '54px',
                    height: '76px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '3px 3px 8px #090a10, -2px -2px 6px #1e2136',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <img
                    src={item.anime.posterImage}
                    alt={item.anime.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80';
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <h4 style={{ fontSize: '16px', color: '#fff', fontWeight: 700, marginBottom: '6px' }}>
                    {item.anime.title}
                  </h4>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    Watched: <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Episode {item.episodeNumber}</span>
                  </div>

                  {/* Progress completion bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        flex: 1,
                        maxWidth: '280px',
                        height: '6px',
                        background: 'var(--bg-surface-recessed)',
                        boxShadow: 'inset 1px 1px 3px #020102',
                        borderRadius: '9999px',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ width: `${item.progressPercentage}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))', borderRadius: '9999px' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {Math.round(item.progressPercentage)}% completed
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }} className="history-actions">
                  <Link
                    to={`/watch/${item.anime.slug}/episode/${item.episodeNumber}`}
                    className="nm-btn-primary"
                    style={{ padding: '8px 18px', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '9999px' }}
                  >
                    <Play size={14} style={{ fill: '#fff' }} /> Resume
                  </Link>
                  <button
                    onClick={() => handleClearHistoryItem(item.animeId)}
                    className="nm-pill"
                    style={{ color: '#ef4444', padding: '8px 12px', borderRadius: '9999px', cursor: 'pointer' }}
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
