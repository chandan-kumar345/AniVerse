import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, Play, Trash2, CheckCircle2 } from 'lucide-react';
import { useContinueWatching } from '../utils/continueWatching';

export const WatchHistoryPage: React.FC = () => {
  const { items, loading, removeItem, clearAll } = useContinueWatching();

  useEffect(() => {
    document.title = 'Watch History - AniVerse';
  }, []);

  return (
    <div className="app-container" style={{ padding: '30px 24px', color: '#fff' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, var(--color-primary, #8b5cf6) 0%, #6366f1 100%)',
              padding: '12px',
              borderRadius: '14px',
              display: 'flex',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
            }}
          >
            <History size={24} style={{ color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, margin: 0 }}>
              Watch History
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' }}>
              Resume where you left off across all watched episodes and movies.
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your entire watch history?')) {
                clearAll();
              }
            }}
            className="nm-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            <Trash2 size={14} /> Clear All History
          </button>
        )}
      </div>

      {loading && items.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: '90px', borderRadius: '12px' }} className="shimmer" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: '#94a3b8',
            background: 'rgba(15, 17, 26, 0.5)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <History size={48} style={{ color: '#475569', marginBottom: '14px' }} />
          <h3 style={{ color: '#e2e8f0', margin: '0 0 8px 0' }}>No watch history found.</h3>
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '400px', margin: '0 auto 18px' }}>
            When you watch episodes on AniVerse, they will automatically appear here and on the Home page for quick resumption.
          </p>
          <Link
            to="/"
            className="nm-btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 24px',
              textDecoration: 'none',
              borderRadius: '10px',
            }}
          >
            <Play size={16} style={{ fill: '#fff' }} /> Browse Anime on Home
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {items.map((item) => {
            const isCompleted = item.progressPercentage >= 90;
            const hasNextEp =
              isCompleted &&
              item.totalEpisodes !== undefined &&
              item.episodeNumber < item.totalEpisodes;
            const targetEpisode = hasNextEp ? item.episodeNumber + 1 : item.episodeNumber;

            const remainingSeconds = Math.max(0, item.duration - item.watchedTime);
            const remainingMins = Math.ceil(remainingSeconds / 60);

            return (
              <div
                key={item.slug || item.animeId}
                className="nm-card history-item-card"
                style={{
                  padding: '16px 20px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  background: 'rgba(15, 17, 26, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 300px' }}>
                  <img
                    src={
                      item.posterImage ||
                      item.bannerImage ||
                      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=120&auto=format&fit=crop&q=80'
                    }
                    alt={item.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=120&auto=format&fit=crop&q=80';
                    }}
                    style={{ width: '60px', height: '84px', objectFit: 'cover', borderRadius: '10px' }}
                  />
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px', color: '#fff' }}>
                      {item.title}
                    </h4>
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          color: hasNextEp ? '#10b981' : 'var(--color-accent, #c4b5fd)',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {hasNextEp && <CheckCircle2 size={14} />}
                        {hasNextEp ? `Up Next: Episode ${targetEpisode}` : `Episode ${item.episodeNumber}`}
                      </span>
                      <span>•</span>
                      <span>
                        {isCompleted
                          ? 'Completed'
                          : remainingMins > 0
                          ? `${remainingMins}m left`
                          : `Progress: ${Math.round(item.progressPercentage)}%`}
                      </span>
                    </div>

                    {/* PROGRESS BAR */}
                    <div
                      style={{
                        width: '200px',
                        maxWidth: '100%',
                        height: '5px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '3px',
                        marginTop: '10px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(item.progressPercentage, 100)}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #8b5cf6 0%, #06b6d4 100%)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Link
                    to={`/watch/${item.slug}/episode/${targetEpisode}`}
                    className="nm-btn-primary"
                    style={{
                      padding: '9px 20px',
                      fontSize: '13px',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      borderRadius: '8px',
                      fontWeight: 700,
                    }}
                  >
                    <Play size={14} style={{ fill: '#fff' }} />
                    {hasNextEp ? `Play Ep ${targetEpisode}` : 'Resume'}
                  </Link>

                  <button
                    onClick={() => removeItem(item.slug || item.animeId)}
                    className="nm-pill"
                    style={{
                      padding: '8px 10px',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#ef4444',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                    title="Remove from history"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
