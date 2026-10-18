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
  // Pick different subsets for different tabs from the expanded pool
  const getSortedList = () => {
    let list = [...animeList];
    if (activeTab === 'week') {
      // Sort by title length as a mock variable change for week tab
      list.sort((a, b) => b.title.length - a.title.length);
    } else if (activeTab === 'month') {
      // Reshuffle using title localeCompare for month tab variation
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Default day sorting by score descending
      list.sort((a, b) => b.score - a.score);
    }
    return list.slice(0, 10);
  };

  const currentList = getSortedList();

  return (
    <div className="nm-card" style={{ padding: '22px', width: '100%' }}>
      
      {/* HEADER & TABS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
          <span className="section-indicator" style={{ height: '18px', width: '3px' }} />
          Top 10 Anime
        </h3>
        
        {/* Tab Buttons - Neumorphic inset well */}
        <div style={{ display: 'flex', background: 'var(--bg-surface-recessed)', boxShadow: 'var(--nm-inset)', borderRadius: '9999px', padding: '4px', border: 'var(--border-nm)' }}>
          {(['day', 'week', 'month'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                flex: 1, 
                border: 'none', 
                background: activeTab === tab ? 'var(--bg-surface-elevated)' : 'none', 
                color: activeTab === tab ? 'var(--color-primary)' : 'var(--text-muted)', 
                padding: '6px 12px', 
                fontSize: '11px', 
                fontWeight: 700, 
                borderRadius: '9999px', 
                cursor: 'pointer', 
                textTransform: 'uppercase', 
                transition: 'var(--transition-fast)',
                boxShadow: activeTab === tab ? 'var(--nm-convex-btn)' : 'none',
              }}
            >
              {tab === 'day' ? 'Today' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* ITEMS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {currentList.map((anime, index) => {
          const rank = index + 1;
          const rankColors = ['#f59e0b', '#3b82f6', '#10b981']; // Gold, Blue, Green for Top 3
          const rankColor = rank <= 3 ? rankColors[rank - 1] : '#6b7280';

          return (
            <Link
              key={anime.id}
              to={`/anime/${anime.slug}`}
              style={{ display: 'flex', gap: '14px', alignItems: 'center', textDecoration: 'none', color: 'inherit', padding: '8px 10px', borderRadius: '10px', transition: 'var(--transition-fast)' }}
              className="top-ten-item"
            >
              
              {/* RANK NUMBER */}
              <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 900, color: rankColor, filter: rank <= 3 ? `drop-shadow(0 0 6px ${rankColor}50)` : 'none', flexShrink: 0 }}>
                {String(rank).padStart(2, '0')}
              </div>

              {/* POSTER MINI */}
              <img
                src={anime.posterImage}
                alt={anime.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80';
                }}
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
