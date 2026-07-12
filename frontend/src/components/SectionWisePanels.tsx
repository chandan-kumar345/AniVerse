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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', margin: '24px 0' }} className="home-sections-grid">
      
      {/* Column 1: New Release */}
      <div style={{ background: '#110e16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '16px', borderLeft: '4px solid var(--color-primary)', paddingLeft: '10px' }}>
          New Release
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {newRelease.map((anime) => (
            <Link to={`/anime/${anime.slug}`} key={anime.id} style={{ display: 'flex', gap: '12px', textDecoration: 'none' }} className="section-list-item">
              <img src={anime.posterImage} alt={anime.title} referrerPolicy="no-referrer" style={{ width: '50px', height: '70px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }} className="section-item-thumb" />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fff', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }} className="section-item-title">
                  {anime.title}
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  ⭐ {anime.score.toFixed(1)} • {anime.type}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Column 2: New Added */}
      <div style={{ background: '#110e16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '16px', borderLeft: '4px solid var(--color-accent)', paddingLeft: '10px' }}>
          New Added
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {newAdded.map((anime) => (
            <Link to={`/anime/${anime.slug}`} key={anime.id} style={{ display: 'flex', gap: '12px', textDecoration: 'none' }} className="section-list-item">
              <img src={anime.posterImage} alt={anime.title} referrerPolicy="no-referrer" style={{ width: '50px', height: '70px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }} className="section-item-thumb" />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fff', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }} className="section-item-title">
                  {anime.title}
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  ⭐ {anime.score.toFixed(1)} • {anime.type}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Column 3: Just Completed */}
      <div style={{ background: '#110e16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '16px', borderLeft: '4px solid var(--color-teal)', paddingLeft: '10px' }}>
          Just Completed
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {justCompleted.map((anime) => (
            <Link to={`/anime/${anime.slug}`} key={anime.id} style={{ display: 'flex', gap: '12px', textDecoration: 'none' }} className="section-list-item">
              <img src={anime.posterImage} alt={anime.title} referrerPolicy="no-referrer" style={{ width: '50px', height: '70px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }} className="section-item-thumb" />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fff', lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }} className="section-item-title">
                  {anime.title}
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  ⭐ {anime.score.toFixed(1)} • {anime.type}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
