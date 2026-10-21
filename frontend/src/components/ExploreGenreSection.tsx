import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Compass, Smile, Theater, Sparkles, Ghost, Search, Heart, Rocket, Trophy, Wand2, ShieldAlert, Globe } from 'lucide-react';

interface GenreItem {
  name: string;
  count?: string;
  icon: React.ReactNode;
  bgGradient: string;
}

const GENRE_LIST: GenreItem[] = [
  { name: 'Action', count: '1200+ Anime', icon: <Flame size={20} color="#F32E35" />, bgGradient: 'linear-gradient(145deg, #181216 0%, #12121A 100%)' },
  { name: 'Adventure', count: '850+ Anime', icon: <Compass size={20} color="#06b6d4" />, bgGradient: 'linear-gradient(145deg, #10181d 0%, #12121A 100%)' },
  { name: 'Comedy', count: '940+ Anime', icon: <Smile size={20} color="#f59e0b" />, bgGradient: 'linear-gradient(145deg, #1c1810 0%, #12121A 100%)' },
  { name: 'Drama', count: '760+ Anime', icon: <Theater size={20} color="#c084fc" />, bgGradient: 'linear-gradient(145deg, #181220 0%, #12121A 100%)' },
  { name: 'Fantasy', count: '1100+ Anime', icon: <Sparkles size={20} color="#4E50DE" />, bgGradient: 'linear-gradient(145deg, #121422 0%, #12121A 100%)' },
  { name: 'Horror', count: '320+ Anime', icon: <Ghost size={20} color="#ef4444" />, bgGradient: 'linear-gradient(145deg, #1a1012 0%, #12121A 100%)' },
  { name: 'Mystery', count: '480+ Anime', icon: <Search size={20} color="#a855f7" />, bgGradient: 'linear-gradient(145deg, #16121e 0%, #12121A 100%)' },
  { name: 'Romance', count: '820+ Anime', icon: <Heart size={20} color="#ec4899" />, bgGradient: 'linear-gradient(145deg, #1c1118 0%, #12121A 100%)' },
  { name: 'Sci-Fi', count: '540+ Anime', icon: <Rocket size={20} color="#3b82f6" />, bgGradient: 'linear-gradient(145deg, #111622 0%, #12121A 100%)' },
  { name: 'Sports', count: '310+ Anime', icon: <Trophy size={20} color="#10b981" />, bgGradient: 'linear-gradient(145deg, #101a16 0%, #12121A 100%)' },
  { name: 'Supernatural', count: '690+ Anime', icon: <Wand2 size={20} color="#8b5cf6" />, bgGradient: 'linear-gradient(145deg, #151220 0%, #12121A 100%)' },
  { name: 'Thriller', count: '390+ Anime', icon: <ShieldAlert size={20} color="#f97316" />, bgGradient: 'linear-gradient(145deg, #1b140f 0%, #12121A 100%)' },
  { name: 'Isekai', count: '560+ Anime', icon: <Globe size={20} color="#14b8a6" />, bgGradient: 'linear-gradient(145deg, #101918 0%, #12121A 100%)' },
];

export const ExploreGenreSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '48px' }}>
      {/* SECTION HEADER ROW */}
      <div className="section-header-row">
        <div className="section-title-wrap">
          <div className="section-accent-bar" />
          <h2 className="section-title">Explore by Genre</h2>
        </div>
        <Link to="/genres" className="section-see-all">
          All Genres &rarr;
        </Link>
      </div>

      {/* GENRES GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '12px',
        }}
      >
        {GENRE_LIST.map((genre) => (
          <div
            key={genre.name}
            onClick={() => navigate(`/discover?genre=${encodeURIComponent(genre.name)}`)}
            style={{
              background: genre.bgGradient,
              border: '1px solid #292938',
              borderRadius: '12px',
              padding: '14px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'var(--transition-smooth)',
              boxShadow: 'var(--nm-card)',
              userSelect: 'none',
            }}
            className="genre-card-hover"
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#12121A',
                border: '1px solid #292938',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {genre.icon}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                {genre.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {genre.count}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .genre-card-hover:hover {
          border-color: rgba(243, 46, 53, 0.4) !important;
          transform: translateY(-2px);
          box-shadow: var(--nm-card-hover) !important;
        }
      `}</style>
    </div>
  );
};
