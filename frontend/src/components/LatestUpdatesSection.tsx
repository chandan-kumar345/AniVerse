import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { AnimeCard } from './AnimeCard';
import { SidebarTopTen } from './SidebarTopTen';
import type { AnimeData } from './AnimeCard';

interface LatestUpdatesSectionProps {
  latestUpdates: AnimeData[];
  topTen: AnimeData[];
  genres: string[];
}

export const LatestUpdatesSection: React.FC<LatestUpdatesSectionProps> = ({
  latestUpdates,
  topTen,
  genres,
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '30px', margin: '24px 0' }} className="home-content-layout">
      
      {/* LEFT COLUMN: LATEST EPISODE UPDATES */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center' }}>
            <span className="section-indicator" />
            Latest Updates
          </h2>
          <Link to="/search" className="nm-pill" style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, padding: '6px 16px' }}>
            View Catalog <ChevronRight size={14} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
          {latestUpdates.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN: SIDEBAR */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <SidebarTopTen animeList={topTen} />

        {/* Genres wrapper card - Neumorphic panel */}
        <div className="nm-card" style={{ padding: '22px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
            <span className="section-indicator" style={{ height: '18px', width: '3px' }} />
            Genres
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {genres.slice(0, 16).map((genre) => (
              <Link
                key={genre}
                to={`/search?genre=${encodeURIComponent(genre)}`}
                className="nm-tag"
                style={{ 
                  textDecoration: 'none', 
                  justifyContent: 'center',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'var(--transition-fast)'
                }}
              >
                {genre}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
