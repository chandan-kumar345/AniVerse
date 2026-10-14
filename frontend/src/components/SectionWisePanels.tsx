import React from 'react';
import { Link } from 'react-router-dom';
import type { AnimeData } from './AnimeCard';

interface SectionWisePanelsProps {
  newRelease: AnimeData[];
  newAdded: AnimeData[];
  justCompleted: AnimeData[];
}

export const SectionWisePanels: React.FC<SectionWisePanelsProps> = ({
  newRelease,
  newAdded,
  justCompleted,
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', margin: '24px 0' }} className="home-sections-grid">
      
      {/* Column 1: New Release */}
      <div className="nm-card" style={{ padding: '22px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '18px', display: 'flex', alignItems: 'center' }}>
          <span className="section-indicator" style={{ height: '18px', width: '3px' }} />
          New Release
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {newRelease.map((anime) => (
            <Link to={`/anime/${anime.slug}`} key={anime.id} style={{ display: 'flex', gap: '14px', textDecoration: 'none', padding: '8px', borderRadius: '10px', transition: 'var(--transition-fast)' }} className="section-list-item">
              <img
                src={anime.posterImage}
                alt={anime.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80';
                }}
                style={{ width: '52px', height: '72px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '3px 3px 8px #08090f' }}
                className="section-item-thumb"
              />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fff', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }} className="section-item-title">
                  {anime.title}
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ color: '#facc15' }}>★</span> {anime.score.toFixed(1)} • {anime.type}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Column 2: New Added */}
      <div className="nm-card" style={{ padding: '22px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '18px', display: 'flex', alignItems: 'center' }}>
          <span className="section-indicator" style={{ height: '18px', width: '3px', background: 'var(--color-accent)', boxShadow: '0 0 10px var(--color-accent)' }} />
          New Added
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {newAdded.map((anime) => (
            <Link to={`/anime/${anime.slug}`} key={anime.id} style={{ display: 'flex', gap: '14px', textDecoration: 'none', padding: '8px', borderRadius: '10px', transition: 'var(--transition-fast)' }} className="section-list-item">
              <img
                src={anime.posterImage}
                alt={anime.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80';
                }}
                style={{ width: '52px', height: '72px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '3px 3px 8px #08090f' }}
                className="section-item-thumb"
              />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fff', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }} className="section-item-title">
                  {anime.title}
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ color: '#facc15' }}>★</span> {anime.score.toFixed(1)} • {anime.type}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Column 3: Just Completed */}
      <div className="nm-card" style={{ padding: '22px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '18px', display: 'flex', alignItems: 'center' }}>
          <span className="section-indicator" style={{ height: '18px', width: '3px', background: 'var(--color-teal)', boxShadow: '0 0 10px var(--color-teal)' }} />
          Just Completed
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {justCompleted.map((anime) => (
            <Link to={`/anime/${anime.slug}`} key={anime.id} style={{ display: 'flex', gap: '14px', textDecoration: 'none', padding: '8px', borderRadius: '10px', transition: 'var(--transition-fast)' }} className="section-list-item">
              <img
                src={anime.posterImage}
                alt={anime.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80';
                }}
                style={{ width: '52px', height: '72px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '3px 3px 8px #08090f' }}
                className="section-item-thumb"
              />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fff', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }} className="section-item-title">
                  {anime.title}
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ color: '#facc15' }}>★</span> {anime.score.toFixed(1)} • {anime.type}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
