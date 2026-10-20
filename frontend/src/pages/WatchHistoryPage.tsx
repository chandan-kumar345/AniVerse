import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import type { AnimeData } from '../components/AnimeCard';
import { History, Play, Trash2 } from 'lucide-react';

interface HistoryItem {
  id: string;
  animeId: string;
  episodeNumber: number;
  watchedTime: number;
  duration: number;
  progressPercentage: number;
  updatedAt: string;
  anime: AnimeData;
}

export const WatchHistoryPage: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Watch History - AniVerse';
    if (!authLoading && !isAuthenticated) {
      navigate('/auth?redirect=/history');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isAuthenticated) return;
      try {
        setLoading(true);
        const res = await axios.get('/api/history');
        setHistory(res.data.history || []);
      } catch (err) {
        console.error('Error fetching watch history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [isAuthenticated]);

  const handleClear = async (animeId: string) => {
    try {
      await axios.delete(`/api/history/${animeId}`);
      setHistory(prev => prev.filter(item => item.animeId !== animeId));
    } catch (err) {
      console.error('Failed to remove history item:', err);
    }
  };

  return (
    <div className="app-container" style={{ padding: '30px 24px', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
          <History size={22} style={{ color: '#fff' }} />
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, margin: 0 }}>
            Watch History
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' }}>
            Resume where you left off across all episodes and movies.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: '90px', borderRadius: '12px' }} className="shimmer" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
          <h3>No watch history found.</h3>
          <Link to="/" style={{ color: '#8b5cf6', marginTop: '10px', display: 'inline-block' }}>
            Start watching anime on Home
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {history.map(item => (
            <div
              key={item.id}
              className="nm-card"
              style={{
                padding: '16px 20px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img
                  src={item.anime.posterImage || ''}
                  alt={item.anime.title}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=120&auto=format&fit=crop&q=80';
                  }}
                  style={{ width: '50px', height: '70px', objectFit: 'cover', borderRadius: '8px' }}
                />
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px', color: '#fff' }}>
                    {item.anime.title}
                  </h4>
                  <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#c084fc', fontWeight: 700 }}>Episode {item.episodeNumber}</span>
                    <span>•</span>
                    <span>Progress: {Math.round(item.progressPercentage)}%</span>
                  </div>
                  {/* PROGRESS BAR */}
                  <div style={{ width: '160px', height: '4px', background: '#10121d', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(item.progressPercentage, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #c084fc)' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link
                  to={`/watch/${item.anime.slug}/episode/${item.episodeNumber}`}
                  className="nm-btn-primary"
                  style={{ padding: '8px 18px', fontSize: '13px', textDecoration: 'none' }}
                >
                  <Play size={14} style={{ fill: '#fff' }} /> Resume
                </Link>

                <button
                  onClick={() => handleClear(item.animeId)}
                  className="nm-pill"
                  style={{ padding: '8px', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                  title="Remove from history"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
