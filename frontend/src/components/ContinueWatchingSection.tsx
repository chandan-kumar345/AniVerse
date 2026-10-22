import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, X, Clock, ArrowRight } from 'lucide-react';
import { useContinueWatching } from '../utils/continueWatching';

export const ContinueWatchingSection: React.FC = () => {
  const { items, removeItem } = useContinueWatching();
  const sliderRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -500, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 500, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="continue-watching-section" style={{ position: 'relative', margin: '10px 0 20px 0' }}>
      {/* SECTION HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 800,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              margin: 0,
            }}
          >
            <span
              className="section-indicator"
              style={{
                display: 'inline-block',
                width: '4px',
                height: '20px',
                background: 'linear-gradient(180deg, #8b5cf6 0%, #06b6d4 100%)',
                borderRadius: '4px',
                marginRight: '10px',
                boxShadow: '0 0 10px rgba(139, 92, 246, 0.6)',
              }}
            />
            Continue Watching
          </h2>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              background: 'rgba(139, 92, 246, 0.15)',
              color: '#c4b5fd',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              padding: '2px 8px',
              borderRadius: '12px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            {items.length} {items.length === 1 ? 'In Progress' : 'In Progress'}
          </span>
        </div>

        {/* CONTROLS & LINK */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/history"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#94a3b8',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
            className="continue-watching-view-all"
          >
            View History <ArrowRight size={14} />
          </Link>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={scrollLeft}
              className="nm-icon-btn"
              style={{
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={scrollRight}
              className="nm-icon-btn"
              style={{
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* HORIZONTAL CAROUSEL CONTAINER */}
      <div
        ref={sliderRef}
        className="continue-watching-slider"
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          paddingBottom: '14px',
          paddingTop: '4px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {items.map((item) => {
          // Smart episode resumption algorithm
          const isCompleted = item.progressPercentage >= 90;
          const hasNextEp =
            isCompleted &&
            item.totalEpisodes !== undefined &&
            item.episodeNumber < item.totalEpisodes;
          const targetEpisode = hasNextEp ? item.episodeNumber + 1 : item.episodeNumber;

          // Time remaining estimation
          const remainingSeconds = Math.max(0, item.duration - item.watchedTime);
          const remainingMins = Math.ceil(remainingSeconds / 60);

          return (
            <div
              key={item.slug || item.animeId}
              className="continue-card-wrapper"
              style={{
                flex: '0 0 290px',
                position: 'relative',
              }}
            >
              <div
                className="continue-card"
                onClick={() => navigate(`/watch/${item.slug}/episode/${targetEpisode}`)}
                style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: 'rgba(15, 17, 26, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(8px)',
                  cursor: 'pointer',
                  transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                }}
              >
                {/* THUMBNAIL / BANNER CONTAINER (16:9 Aspect Ratio) */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '56.25%', // 16:9
                    background: '#090a10',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={
                      item.bannerImage ||
                      item.posterImage ||
                      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80'
                    }
                    alt={item.title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        item.posterImage ||
                        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease',
                    }}
                    className="continue-card-img"
                  />

                  {/* GRADIENT SCRIM OVERLAYS */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(180deg, rgba(10, 12, 20, 0.3) 0%, rgba(10, 12, 20, 0.85) 100%)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* TOP BADGE: CURRENT OR NEXT EPISODE */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      display: 'flex',
                      gap: '6px',
                      zIndex: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: hasNextEp
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                        color: '#fff',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {hasNextEp ? `Up Next: Ep ${targetEpisode}` : `Ep ${item.episodeNumber}`}
                    </span>

                    {item.type && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '3px 6px',
                          borderRadius: '6px',
                          background: 'rgba(0, 0, 0, 0.65)',
                          color: '#e2e8f0',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {item.type}
                      </span>
                    )}
                  </div>

                  {/* DISMISS / REMOVE BUTTON */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeItem(item.slug || item.animeId);
                    }}
                    title="Remove from Continue Watching"
                    className="continue-card-remove-btn"
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      zIndex: 3,
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <X size={14} />
                  </button>

                  {/* CENTER PLAY BUTTON OVERLAY */}
                  <div
                    className="continue-card-play-overlay"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                    }}
                  >
                    <div
                      className="continue-card-play-btn"
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)',
                        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                      }}
                    >
                      <Play size={18} style={{ color: '#fff', marginLeft: '3px', fill: '#fff' }} />
                    </div>
                  </div>

                  {/* PROGRESS BAR STRIP ON BOTTOM OF THUMBNAIL */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      height: '4px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      zIndex: 3,
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(item.progressPercentage, 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #8b5cf6 0%, #06b6d4 100%)',
                        boxShadow: '0 0 8px rgba(6, 182, 212, 0.7)',
                      }}
                    />
                  </div>
                </div>

                {/* CARD BODY / TITLE & INFO */}
                <div style={{ padding: '12px 14px' }}>
                  <h4
                    className="continue-card-title"
                    title={item.title}
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#fff',
                      margin: '0 0 6px 0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {item.title}
                  </h4>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      color: '#94a3b8',
                    }}
                  >
                    <span style={{ color: '#c4b5fd', fontWeight: 600 }}>
                      {hasNextEp
                        ? `Next: Episode ${targetEpisode}`
                        : `Episode ${item.episodeNumber}`}
                    </span>

                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                      <Clock size={12} style={{ color: '#64748b' }} />
                      {isCompleted
                        ? 'Completed'
                        : remainingMins > 0
                        ? `${remainingMins}m left`
                        : `${Math.round(item.progressPercentage)}%`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .continue-watching-slider::-webkit-scrollbar {
          display: none;
        }
        .continue-watching-view-all:hover {
          color: var(--color-primary, #8b5cf6) !important;
        }
        .continue-card:hover {
          transform: translateY(-4px);
          border-color: rgba(139, 92, 246, 0.45) !important;
          box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.7), 0 0 16px rgba(139, 92, 246, 0.25);
        }
        .continue-card:hover .continue-card-img {
          transform: scale(1.05);
        }
        .continue-card:hover .continue-card-title {
          color: #a78bfa !important;
        }
        .continue-card:hover .continue-card-play-btn {
          transform: scale(1.12);
          box-shadow: 0 0 25px rgba(6, 182, 212, 0.8) !important;
        }
        .continue-card-remove-btn:hover {
          background: rgba(239, 68, 68, 0.8) !important;
          color: #fff !important;
          border-color: rgba(239, 68, 68, 0.5) !important;
          transform: scale(1.1);
        }
        @media (max-width: 640px) {
          .continue-card-wrapper {
            flex: 0 0 240px !important;
          }
        }
      `}</style>
    </section>
  );
};
