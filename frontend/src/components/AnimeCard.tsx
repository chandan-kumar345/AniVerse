import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Play } from 'lucide-react';

export interface AnimeData {
  id: string;
  slug: string;
  title: string;
  englishTitle?: string | null;
  description: string;
  posterImage: string;
  bannerImage?: string | null;
  rating?: string | null;
  score: number;
  type: string;
  studio?: string | null;
  status: string;
  releasedYear?: number | null;
  duration?: string | null;
  genres: string;
  episodes?: { id?: string; episodeNumber: number; title?: string; videoUrl?: string }[];
}

interface AnimeCardProps {
  anime: AnimeData;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime }) => {
  const genresList = anime.genres.split(',').map((g) => g.trim());

  return (
    <div className="anime-card-container" style={{ position: 'relative', flex: '0 0 auto', width: '100%' }}>
      <Link to={`/anime/${anime.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        
        {/* CARD WRAPPER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', cursor: 'pointer', transition: 'var(--transition-smooth)' }} className="anime-card">
          
          {/* IMAGE */}
          <div style={{ width: '100%', aspectRatio: '2/3', position: 'relative', overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }} className="card-image-wrap">
            <img
              src={anime.posterImage}
              alt={anime.title}
              referrerPolicy="no-referrer"
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'var(--transition-smooth)' }}
              className="card-image"
            />
            {/* Play Button Overlay */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(139, 92, 246, 0.4)', opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition-smooth)', borderRadius: '8px' }} className="card-play-overlay">
              <div style={{ background: '#fff', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--glow-shadow)' }}>
                <Play size={20} style={{ color: 'var(--color-primary)', fill: 'var(--color-primary)', marginLeft: '3px' }} />
              </div>
            </div>
            {/* Score Badge */}
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.85)', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.15)', color: 'var(--color-accent)' }}>
              <Star size={10} style={{ fill: 'var(--color-accent)' }} />
              {anime.score.toFixed(1)}
            </div>
            {/* Episode Badge */}
            {anime.episodes && anime.episodes.length > 0 && (
              <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--color-primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,0.15)', boxShadow: 'var(--glow-shadow)' }}>
                EP {anime.episodes[0].episodeNumber}
              </div>
            )}
            {/* Type Badge */}
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'var(--color-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
              {anime.type}
            </div>
          </div>

          {/* TITLE & META */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h4
              style={{ fontSize: '14px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '34px', lineHeight: '1.3', transition: 'var(--transition-fast)' }}
              className="card-title"
            >
              {anime.title}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>{anime.releasedYear} • {anime.duration || '24 min'}</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '3px', padding: '1px 4px', fontSize: '10px', fontWeight: 700 }}>SUB</span>
                <span style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-teal)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '3px', padding: '1px 4px', fontSize: '10px', fontWeight: 700 }}>DUB</span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* HOVER TOOLTIP DETAIL CARD */}
      <div className="tooltip-card">
        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
          {anime.title}
        </h4>
        {anime.englishTitle && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            {anime.englishTitle}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', fontSize: '12px', marginBottom: '12px' }}>
          <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>⭐ {anime.score.toFixed(2)}</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: '#fff', fontWeight: 600 }}>{anime.type}</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: 'var(--text-muted)' }}>{anime.status}</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '12px' }}>
          {anime.description}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
          {genresList.slice(0, 3).map((genre) => (
            <span key={genre} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              {genre}
            </span>
          ))}
        </div>
        {anime.studio && (
          <div style={{ fontSize: '11px', color: 'var(--text-dark)', fontWeight: 500 }}>
            Studio: <span style={{ color: 'var(--text-muted)' }}>{anime.studio}</span>
          </div>
        )}
      </div>

      <style>{`
        .anime-card:hover .card-image { transform: scale(1.05); }
        .anime-card:hover .card-play-overlay { opacity: 1; }
        .anime-card:hover .card-title { color: var(--color-primary); }
      `}</style>
    </div>
  );
};
