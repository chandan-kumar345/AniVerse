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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: '#fff', borderLeft: '4px solid var(--color-primary)', paddingLeft: '12px' }}>
            Latest Updates
          </h2>
          <Link to="/search" style={{ color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }} className="view-all-link">
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

        {/* Genres wrapper card */}
        <div style={{ background: '#110e16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>
            Genres
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {genres.slice(0, 16).map((genre) => (
              <Link
                key={genre}
                to={`/search?genre=${encodeURIComponent(genre)}`}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none', textAlign: 'center', fontWeight: 500, transition: 'var(--transition-fast)' }}
                className="genre-item-link"
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
