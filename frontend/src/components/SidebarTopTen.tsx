import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { AnimeData } from './AnimeCard';

interface SidebarTopTenProps {
  animeList: AnimeData[];
}

export const SidebarTopTen: React.FC<SidebarTopTenProps> = ({ animeList }) => {
  const [activeTab, setActiveTab] = useState<'day' | 'week' | 'month'>('day');

  if (animeList.length === 0) return null;

  // Let's slightly reshuffle list for different tabs to simulate active changes
  const getSortedList = () => {
    const list = [...animeList].slice(0, 10);
    if (activeTab === 'week') {
      return list.sort((a, b) => b.title.length - a.title.length);
    }
    if (activeTab === 'month') {
      return list.sort((a, b) => a.score - b.score);
    }
    return list; // day (sorted by score desc)
  };

  const currentList = getSortedList();

  return (
    <div style={{ background: '#12121c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', width: '100%' }}>
      
      {/* HEADER & TABS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: '#fff' }}>
          Top 10 Anime
        </h3>
        
        {/* Tab Buttons */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '3px' }}>
          {(['day', 'week', 'month'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ flex: 1, border: 'none', background: activeTab === tab ? 'var(--color-primary)' : 'none', color: activeTab === tab ? '#fff' : 'var(--text-muted)', padding: '6px 12px', fontSize: '12px', fontWeight: 700, borderRadius: '4px', cursor: 'pointer', textTransform: 'uppercase', transition: 'var(--transition-fast)' }}
            >
              {tab === 'day' ? 'Today' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* ITEMS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {currentList.map((anime, index) => {
          const rank = index + 1;
          const rankColors = ['#f59e0b', '#3b82f6', '#10b981']; // Gold, Blue, Green for Top 3
          const rankColor = rank <= 3 ? rankColors[rank - 1] : '#6b7280';

          return (
            <Link
              key={anime.id}
              to={`/anime/${anime.slug}`}
              style={{ display: 'flex', gap: '15px', alignItems: 'center', textDecoration: 'none', color: 'inherit', padding: '10px 0', borderBottom: index < currentList.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'var(--transition-fast)' }}
              className="top-ten-item"
            >
              
              {/* RANK NUMBER */}
              <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 900, color: rankColor, filter: rank <= 3 ? `drop-shadow(0 0 5px ${rankColor}40)` : 'none' }}>
                {String(rank).padStart(2, '0')}
              </div>

              {/* POSTER MINI */}
              <img
                src={anime.posterImage}
                alt={anime.title}
                referrerPolicy="no-referrer"
                style={{ width: '45px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}
              />

              {/* DETAILS */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', marginBottom: '4px', transition: 'var(--transition-fast)' }} className="item-title">
                  {anime.title}
                </h4>
                <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', alignItems: 'center' }}>
                  <span>⭐ {anime.score.toFixed(1)}</span>
                  <span>•</span>
                  <span>{anime.type}</span>
                  <span>•</span>
                  <span style={{ color: 'var(--text-dark)' }}>{anime.releasedYear}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <style>{`
        .top-ten-item:hover .item-title { color: var(--color-primary) !important; }
        .top-ten-item:hover { transform: translateX(4px); }
      `}</style>
    </div>
  );
};
