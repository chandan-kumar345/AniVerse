import React, { useState, useEffect } from 'react';
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
  hasSub?: boolean | null;
  hasDub?: boolean | null;
  hasHindi?: boolean | null;
  contentType?: string | null;
  availabilityStatus?: string | null;
  episodes?: { id?: string; episodeNumber: number; title?: string; videoUrl?: string }[];
  nextAiringEpisode?: {
    airingAt: number;
    episode: number;
  } | null;
}

interface AnimeCardProps {
  anime: AnimeData;
  showCountdown?: boolean;
}

export const getAiringDayOfWeek = (title: string): number => {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('one piece')) return 0; // Sunday
  if (titleLower.includes('demon slayer')) return 0; // Sunday
  if (titleLower.includes('bleach')) return 6; // Saturday
  if (titleLower.includes('my hero academia')) return 6; // Saturday
  if (titleLower.includes('jujutsu kaisen')) return 4; // Thursday
  if (titleLower.includes('frieren')) return 5; // Friday
  if (titleLower.includes('solo leveling')) return 6; // Saturday
  if (titleLower.includes('kaiju')) return 6; // Saturday
  if (titleLower.includes('wind breaker')) return 4; // Thursday
  
  // Deterministic fallback
  return Math.abs(title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 7;
};

export const getNextEpisodeAiring = (title: string): Date => {
  const dayOfWeekJST = getAiringDayOfWeek(title);
  const titleLower = title.toLowerCase();
  let hourJST = 18;
  let minuteJST = 0;

  if (titleLower.includes('one piece')) { hourJST = 9; minuteJST = 30; }
  else if (titleLower.includes('demon slayer')) { hourJST = 23; minuteJST = 15; }
  else if (titleLower.includes('bleach')) { hourJST = 23; minuteJST = 0; }
  else if (titleLower.includes('my hero academia')) { hourJST = 17; minuteJST = 30; }
  else if (titleLower.includes('jujutsu kaisen')) { hourJST = 23; minuteJST = 56; }
  else if (titleLower.includes('frieren')) { hourJST = 23; minuteJST = 0; }
  else if (titleLower.includes('solo leveling')) { hourJST = 23; minuteJST = 30; }
  else if (titleLower.includes('kaiju')) { hourJST = 23; minuteJST = 0; }
  else if (titleLower.includes('wind breaker')) { hourJST = 0; minuteJST = 0; } // Thursday midnight JST is Wednesday JST end or Thursday early morning
  else {
    hourJST = 12 + (Math.abs(title.length) % 12);
    minuteJST = (Math.abs(title.length * 13) % 60);
  }

  const now = new Date();
  
  // Japan is UTC+9.
  const jstOffset = 9 * 60; // minutes
  const localOffset = now.getTimezoneOffset(); // minutes (e.g. -330 for IST)
  const jstNowTime = now.getTime() + (localOffset + jstOffset) * 60 * 1000;
  const jstNow = new Date(jstNowTime);

  const jstTarget = new Date(jstNow);
  jstTarget.setHours(hourJST, minuteJST, 0, 0);

  let daysDiff = dayOfWeekJST - jstNow.getDay();
  if (daysDiff < 0 || (daysDiff === 0 && jstNow.getTime() > jstTarget.getTime())) {
    daysDiff += 7;
  }
  jstTarget.setDate(jstNow.getDate() + daysDiff);

  const localTargetTime = jstTarget.getTime() - (localOffset + jstOffset) * 60 * 1000;
  return new Date(localTargetTime);
};

export const getCountdownString = (targetDate: Date) => {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return 'Released';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(' ');
};

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime, showCountdown = true }) => {
  const genresList = anime.genres.split(',').map((g) => g.trim());
  const [countdown, setCountdown] = useState<string>('');
  const [nextEpNum, setNextEpNum] = useState<number>(1);

  useEffect(() => {
    // If we have real nextAiringEpisode from AniList, use it!
    if (anime.nextAiringEpisode) {
      const { airingAt, episode } = anime.nextAiringEpisode;
      setNextEpNum(episode);

      const updateTimer = () => {
        setCountdown(getCountdownString(new Date(airingAt * 1000)));
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }

    // Otherwise fallback countdown logic for other airing shows in local DB
    if (anime.status === 'Currently Airing') {
      const maxEp = anime.episodes && anime.episodes.length > 0 ? anime.episodes[0].episodeNumber : 12;
      setNextEpNum(maxEp + 1);

      const updateTimer = () => {
        setCountdown(getCountdownString(getNextEpisodeAiring(anime.title)));
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }

    setCountdown('');
  }, [anime.nextAiringEpisode, anime.status, anime.title, anime.episodes]);

  const isMockSearch = anime.slug.startsWith('search?q=');
  const watchUrl = isMockSearch ? `/${anime.slug}` : `/watch/${anime.slug}/episode/1`;
  const detailUrl = isMockSearch ? `/${anime.slug}` : `/anime/${anime.slug}`;

  // 18+ badge is ONLY shown on true uncensored / mature titles
  const isUncensored18Plus = Boolean(
    anime.genres?.includes('18+') ||
    anime.rating === '18+' ||
    (anime.genres?.includes('Ecchi') && !['My Hero Academia', 'Dragon Ball', 'Naruto', 'One Piece'].some(t => anime.title.includes(t)))
  );

  return (
    <div className="anime-card-container" style={{ position: 'relative', flex: '0 0 auto', width: '100%' }}>
      {/* CARD WRAPPER */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', transition: 'var(--transition-smooth)' }} className="anime-card">
        
        {/* IMAGE - click to watch */}
        <Link to={watchUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: '100%', aspectRatio: '2/3', position: 'relative', overflow: 'hidden', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '4px 4px 12px #07080e, -3px -3px 8px #1c1e30' }} className="card-image-wrap">
            <img
              src={anime.posterImage || ''}
              alt={anime.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'var(--transition-smooth)' }}
              className="card-image"
            />
            {/* Play Button Overlay */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(13, 15, 24, 0.45)', backdropFilter: 'blur(2px)', opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition-smooth)', borderRadius: '12px' }} className="card-play-overlay">
              <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(139, 92, 246, 0.6)' }}>
                <Play size={20} style={{ color: '#fff', fill: '#fff', marginLeft: '3px' }} />
              </div>
            </div>
            {/* Score Badge - Neumorphic convex capsule */}
            <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#141624', padding: '3px 8px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.08)', color: '#facc15', boxShadow: '2px 2px 6px #08090f, -2px -2px 6px #1c1e30' }}>
              <Star size={10} style={{ fill: '#facc15' }} />
              {anime.score.toFixed(1)}
            </div>
            {/* Episode Badge */}
            {anime.episodes && anime.episodes.length > 0 && (
              <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, color: '#fff', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.5)' }}>
                EP {anime.episodes[0].episodeNumber}
              </div>
            )}
            {/* Type Badge */}
            <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: '#161828', padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'inset 1px 1px 3px #08090f' }}>
              {anime.type}
            </div>

            {/* 18+ Uncensored Badge - ONLY on uncensored / mature titles */}
            {isUncensored18Plus && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '8px',
                  background: 'linear-gradient(135deg, #e11d48, #be123c)',
                  padding: '2px 7px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.25)',
                  boxShadow: '0 2px 8px rgba(225, 29, 72, 0.6)'
                }}
              >
                18+
              </div>
            )}
          </div>
        </Link>

        {/* TITLE & META - click for details */}
        <Link to={detailUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h4
              style={{ fontSize: '14px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '34px', lineHeight: '1.3', transition: 'var(--transition-fast)' }}
              className="card-title"
            >
              {anime.title}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>{anime.releasedYear} • {anime.duration || (anime.contentType === 'movie' ? '110 min' : '24 min')}</span>
              {anime.availabilityStatus && (
                <span style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  letterSpacing: '0.4px',
                  color: anime.availabilityStatus === 'AVAILABLE' ? '#10b981' : '#38bdf8',
                  background: anime.availabilityStatus === 'AVAILABLE' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                  border: `1px solid ${anime.availabilityStatus === 'AVAILABLE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                  borderRadius: '4px',
                  padding: '1px 5px'
                }}>
                  {anime.availabilityStatus === 'AVAILABLE' ? 'AVAILABLE' : 'VERIFIED'}
                </span>
              )}
            </div>

            {/* VERIFIED AUDIO BADGES */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
              {anime.hasSub !== false && (
                <span style={{ background: 'rgba(139, 92, 246, 0.12)', color: 'var(--color-primary)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '4px', padding: '1px 5px', fontSize: '9px', fontWeight: 800 }}>
                  JAPANESE
                </span>
              )}
              {Boolean(anime.hasDub) && (
                <span style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--color-teal)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '4px', padding: '1px 5px', fontSize: '9px', fontWeight: 800 }}>
                  ENGLISH DUB
                </span>
              )}
              {anime.hasHindi && (
                <span style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '4px', padding: '1px 5px', fontSize: '9px', fontWeight: 800 }}>
                  HINDI DUB
                </span>
              )}
            </div>

            {showCountdown && countdown && (
              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="live-ping-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                <span>Ep {nextEpNum}: {countdown}</span>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* HOVER TOOLTIP DETAIL CARD */}
      <div className="tooltip-card nm-card" style={{ background: '#141624', padding: '16px', borderRadius: '16px', boxShadow: 'var(--nm-elevated)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
          {anime.title}
        </h4>
        {anime.englishTitle && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            {anime.englishTitle}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', fontSize: '12px', marginBottom: '12px', alignItems: 'center' }}>
          <span style={{ color: '#facc15', fontWeight: 700 }}>★ {anime.score.toFixed(2)}</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: '#fff', fontWeight: 600 }}>{anime.type}</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: 'var(--text-muted)' }}>{anime.status}</span>
          {isUncensored18Plus && (
            <>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span style={{ color: '#f43f5e', fontWeight: 800, fontSize: '10px', background: 'rgba(225, 29, 72, 0.15)', padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(225, 29, 72, 0.3)' }}>18+</span>
            </>
          )}
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '12px' }}>
          {anime.description}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
          {genresList.slice(0, 3).map((genre) => (
            <span key={genre} className="nm-tag" style={{ padding: '2px 8px', fontSize: '10px' }}>
              {genre}
            </span>
          ))}
        </div>
        {anime.studio && (
          <div style={{ fontSize: '11px', color: 'var(--text-dark)', fontWeight: 500, marginBottom: '12px' }}>
            Studio: <span style={{ color: 'var(--text-muted)' }}>{anime.studio}</span>
          </div>
        )}
        <Link 
          to={watchUrl}
          className="nm-btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '9px 16px',
            fontSize: '13px',
            textDecoration: 'none',
          }}
        >
          <Play size={14} style={{ fill: '#fff' }} /> Watch Now
        </Link>
      </div>

      <style>{`
        .anime-card:hover .card-image { transform: scale(1.05); }
        .anime-card:hover .card-play-overlay { opacity: 1; }
        .anime-card:hover .card-title { color: var(--color-primary); }
      `}</style>
    </div>
  );
};
