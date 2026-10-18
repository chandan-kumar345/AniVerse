import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { AnimeData } from '../components/AnimeCard';
import { Play, Plus, Check, Star, Calendar, Film, Tv, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AnimeDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [anime, setAnime] = useState<(AnimeData & { episodes: any[] }) | null>(null);
  const [related, setRelated] = useState<AnimeData[]>([]);
  const [seasons, setSeasons] = useState<{ seasonNumber: number; title: string; slug: string }[]>([]);
  const [watchlistStatus, setWatchlistStatus] = useState<string | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWatchlistMenu, setShowWatchlistMenu] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        const res = await axios.get(`/api/anime/${slug}`);
        setAnime(res.data.anime);
        setRelated(res.data.related || []);
        setSeasons(res.data.seasons || []);

        if (isAuthenticated) {
          const watchRes = await axios.get(`/api/watchlist/status/${res.data.anime.id}`);
          setInWatchlist(watchRes.data.inWatchlist);
          setWatchlistStatus(watchRes.data.status);
        }
      } catch (err) {
        console.error('Error fetching detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [slug, isAuthenticated]);

  useEffect(() => {
    if (anime) {
      document.title = `${anime.title} - Watch Online in HD | AniVerse`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', `Stream ${anime.title} (${anime.releasedYear}) full episodes in HD online. ${anime.description.slice(0, 150)}... Only on AniVerse.`);
      }
    }
  }, [anime]);

  const handleUpdateWatchlist = async (status: string) => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (!anime) return;
    try {
      await axios.post('/api/watchlist', { animeId: anime.id, status });
      setWatchlistStatus(status);
      setInWatchlist(true);
      setShowWatchlistMenu(false);
    } catch (err) {
      console.error('Failed to update watchlist status:', err);
    }
  };

  const handleRemoveWatchlist = async () => {
    if (!anime) return;
    try {
      await axios.delete(`/api/watchlist/${anime.id}`);
      setInWatchlist(false);
      setWatchlistStatus(null);
      setShowWatchlistMenu(false);
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ height: '420px', width: '100%', borderRadius: '12px' }} className="shimmer" />
        <div style={{ display: 'flex', gap: '30px' }}>
          <div style={{ width: '240px', height: '360px', borderRadius: '12px' }} className="shimmer" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ height: '36px', width: '50%', borderRadius: '6px' }} className="shimmer" />
            <div style={{ height: '100px', width: '100%', borderRadius: '6px' }} className="shimmer" />
            <div style={{ height: '48px', width: '200px', borderRadius: '8px' }} className="shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        <h2>Anime not found.</h2>
        <Link to="/" style={{ color: 'var(--color-primary)', marginTop: '10px', display: 'inline-block' }}>Back to Home</Link>
      </div>
    );
  }

  const genresList = anime.genres.split(',').map((g) => g.trim());
  const episodeCount = anime.episodes?.length || 0;

  return (
    <div style={{ color: 'var(--text-main)', position: 'relative' }}>
      
      {/* HD BANNER COVER - Full width, no blur, cinematic gradient */}
      <div style={{ position: 'relative', width: '100%', height: '450px', overflow: 'hidden' }}>
        <img
          src={anime.bannerImage || anime.posterImage}
          alt={anime.title}
          referrerPolicy="no-referrer"
          loading="eager"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80';
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
        />
        {/* Cinematic gradient overlays */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '250px', background: 'linear-gradient(to top, var(--bg-main) 0%, rgba(8, 6, 11, 0.6) 40%, transparent 100%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, rgba(8, 6, 11, 0.4) 0%, transparent 50%, rgba(8, 6, 11, 0.2) 100%)' }} />
      </div>

      {/* OVERLAP CONTAINER */}
      <div className="app-container" style={{ margin: '-200px auto 0', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        
        {/* UPPER ANIME HEADER INFO */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '36px', alignItems: 'end' }} className="detail-upper-block">
          
          {/* POSTER CARD - HD quality with glowing neumorphic frame */}
          <div style={{ width: '240px', aspectRatio: '2/3', borderRadius: '20px', overflow: 'hidden', border: '3px solid rgba(139, 92, 246, 0.4)', boxShadow: 'var(--nm-hero-frame)' }} className="detail-poster-wrap">
            <img
              src={anime.posterImage}
              alt={anime.title}
              referrerPolicy="no-referrer"
              loading="eager"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* MAIN INFO TEXTS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '10px' }}>
            <h1 style={{ fontSize: '38px', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: '1.15', textShadow: '0 4px 16px rgba(0,0,0,0.4)', color: 'var(--text-main)' }} className="detail-title">
              {anime.title}
            </h1>
            {anime.englishTitle && anime.englishTitle !== anime.title && (
              <div style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {anime.englishTitle}
              </div>
            )}
            
            {/* Metadata badges - Neumorphic pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '13px', alignItems: 'center' }}>
              <span className="nm-pill" style={{ padding: '5px 14px', color: '#facc15', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Star size={13} style={{ fill: '#facc15' }} /> {anime.score.toFixed(2)}
              </span>
              <span className="nm-pill" style={{ padding: '5px 14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)' }}>
                {anime.type === 'TV' ? <Tv size={13} /> : <Film size={13} />} {anime.type}
              </span>
              <span className="nm-pill" style={{ padding: '5px 14px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                <Calendar size={13} /> {anime.releasedYear || 'Unknown'}
              </span>
              <span className="nm-pill" style={{ padding: '5px 14px', color: anime.status === 'Currently Airing' ? '#22c55e' : 'var(--text-main)', fontWeight: 600 }}>
                {anime.status}
              </span>
              {anime.rating && (
                <span className="nm-pill" style={{ padding: '5px 14px', color: 'var(--text-muted)' }}>
                  {anime.rating}
                </span>
              )}
              {episodeCount > 0 && (
                <span className="nm-pill" style={{ padding: '5px 14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)' }}>
                  <Users size={13} /> {episodeCount} EP{episodeCount > 1 ? 'S' : ''}
                </span>
              )}
              {anime.hasSub !== false && (
                <span className="nm-tag" style={{ color: 'var(--color-primary)', fontWeight: 800, padding: '3px 10px', fontSize: '11px' }}>
                  SUB
                </span>
              )}
              {anime.hasDub !== false && (
                <span className="nm-tag" style={{ color: 'var(--color-teal)', fontWeight: 800, padding: '3px 10px', fontSize: '11px' }}>
                  DUB
                </span>
              )}
            </div>

            {/* Genres */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
              {genresList.map((genre) => (
                <Link
                  key={genre}
                  to={`/search?genre=${genre}`}
                  className="nm-tag"
                  style={{ textDecoration: 'none', color: 'var(--color-primary)', padding: '6px 16px', fontSize: '12px', fontWeight: 600 }}
                >
                  {genre}
                </Link>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', position: 'relative', flexWrap: 'wrap', alignItems: 'center' }}>
              {episodeCount > 0 ? (
                <Link to={`/watch/${anime.slug}/episode/1`} className="nm-btn-primary" style={{ padding: '14px 34px', textDecoration: 'none', fontSize: '15px' }}>
                  <Play size={18} style={{ fill: '#fff' }} /> Watch Now
                </Link>
              ) : (
                <button disabled style={{ opacity: 0.6 }} className="nm-btn-primary">No Episodes Available</button>
              )}

              {/* Watchlist selector */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowWatchlistMenu(!showWatchlistMenu)}
                  className="nm-btn-secondary"
                  style={{ padding: '14px 26px', fontSize: '14px' }}
                >
                  {inWatchlist ? (
                    <>
                      <Check size={18} style={{ color: 'var(--color-primary)' }} />
                      <span style={{ textTransform: 'capitalize' }}>{watchlistStatus?.toLowerCase().replace(/_/g, ' ')}</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} /> Add to List
                    </>
                  )}
                </button>

                {showWatchlistMenu && (
                  <div style={{ position: 'absolute', top: '115%', left: 0, width: '190px', background: 'var(--bg-surface-elevated)', border: 'var(--border-nm)', borderRadius: '14px', overflow: 'hidden', boxShadow: 'var(--nm-card-hover)', zIndex: 99, padding: '6px' }}>
                    {['WATCHING', 'PLAN_TO_WATCH', 'COMPLETED', 'DROPPED'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateWatchlist(status)}
                        style={{ width: '100%', border: 'none', background: watchlistStatus === status ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' : 'none', color: watchlistStatus === status ? '#fff' : 'var(--text-main)', padding: '10px 14px', textAlign: 'left', fontSize: '13px', cursor: 'pointer', transition: 'var(--transition-fast)', borderRadius: '8px', fontWeight: watchlistStatus === status ? 700 : 500 }}
                        className="watchlist-option-btn"
                      >
                        {status.replace(/_/g, ' ')}
                      </button>
                    ))}
                    {inWatchlist && (
                      <button
                        onClick={handleRemoveWatchlist}
                        style={{ width: '100%', border: 'none', borderTop: '1px solid var(--border-color-soft)', background: 'none', color: '#ef4444', padding: '10px 14px', textAlign: 'left', fontSize: '13px', cursor: 'pointer', transition: 'var(--transition-fast)', marginTop: '4px', borderRadius: '8px' }}
                        className="watchlist-option-btn delete"
                      >
                        Remove from List
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SEASONS SWITCHER (if multiple seasons exist) */}
        {seasons.length > 1 && (
          <div className="nm-card" style={{ marginTop: '32px', padding: '20px 24px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center' }}>
              <span className="section-indicator" style={{ height: '16px', width: '3px' }} />
              Seasons & Movies
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {seasons.map((s: any) => (
                <Link
                  key={s.slug}
                  to={`/anime/${s.slug}`}
                  style={{
                    background: s.slug === slug ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' : 'var(--bg-surface-elevated)',
                    border: s.slug === slug ? '1px solid rgba(255,255,255,0.3)' : 'var(--border-nm)',
                    color: s.slug === slug ? '#fff' : 'var(--text-main)',
                    padding: '8px 18px',
                    borderRadius: '9999px',
                    fontSize: '13px',
                    fontWeight: s.slug === slug ? 700 : 500,
                    textDecoration: 'none',
                    transition: 'var(--transition-fast)',
                    boxShadow: s.slug === slug ? 'var(--nm-primary-btn)' : 'var(--nm-convex-btn)',
                    whiteSpace: 'nowrap'
                  }}
                  className="season-btn"
                >
                  {s.type === 'MOVIE' ? '🎬 Movie: ' : `S${s.seasonNumber}: `}{s.title.length > 30 ? s.title.substring(0, 30) + '...' : s.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* LOWER DETAILED CONTENT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px', marginTop: '32px' }} className="detail-lower-block">
          
          {/* LEFT SECTION: SYNOPSIS + DETAILS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Synopsis */}
            <div className="nm-card" style={{ padding: '26px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                <span className="section-indicator" style={{ height: '18px', width: '3px' }} />
                Synopsis
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                {anime.description}
              </p>
            </div>

            {/* Quick Info Grid */}
            <div className="nm-card" style={{ padding: '26px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text-main)', marginBottom: '18px', display: 'flex', alignItems: 'center' }}>
                <span className="section-indicator" style={{ height: '18px', width: '3px' }} />
                Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-surface-recessed)', borderRadius: '10px', boxShadow: 'var(--nm-inset)', border: 'var(--border-nm)' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Type</span><span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{anime.type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-surface-recessed)', borderRadius: '10px', boxShadow: 'var(--nm-inset)', border: 'var(--border-nm)' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Studio</span><span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{anime.studio || 'Unknown'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-surface-recessed)', borderRadius: '10px', boxShadow: 'var(--nm-inset)', border: 'var(--border-nm)' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Status</span><span style={{ fontWeight: 700, color: anime.status === 'Currently Airing' ? '#22c55e' : 'var(--color-teal)' }}>{anime.status}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-surface-recessed)', borderRadius: '10px', boxShadow: 'var(--nm-inset)', border: 'var(--border-nm)' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Released</span><span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{anime.releasedYear || 'Unknown'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-surface-recessed)', borderRadius: '10px', boxShadow: 'var(--nm-inset)', border: 'var(--border-nm)' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Duration</span><span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{anime.duration || '24m per ep'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-surface-recessed)', borderRadius: '10px', boxShadow: 'var(--nm-inset)', border: 'var(--border-nm)' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Score</span><span style={{ color: '#facc15', fontWeight: 800 }}>★ {anime.score.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-surface-recessed)', borderRadius: '10px', boxShadow: 'var(--nm-inset)', border: 'var(--border-nm)' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Episodes</span><span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{episodeCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-surface-recessed)', borderRadius: '10px', boxShadow: 'var(--nm-inset)', border: 'var(--border-nm)' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Rating</span><span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{anime.rating || 'Not Rated'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION: RECOMMENDATIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Recommendations */}
            {related.length > 0 && (
              <div className="nm-card" style={{ padding: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                  <span className="section-indicator" style={{ height: '18px', width: '3px' }} />
                  Related & Recommended
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {related.slice(0, 8).map((item) => (
                    <Link
                      key={item.id}
                      to={`/anime/${item.slug}`}
                      style={{ display: 'flex', gap: '14px', textDecoration: 'none', color: 'inherit', transition: 'var(--transition-fast)', padding: '8px 10px', borderRadius: '10px' }}
                      className="related-item"
                    >
                      <img
                        src={item.posterImage}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80';
                        }}
                        style={{ width: '48px', height: '68px', objectFit: 'cover', borderRadius: '8px', border: 'var(--border-nm)', boxShadow: 'var(--nm-flat)' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.3' }}>
                          {item.title}
                        </h4>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          <span style={{ color: '#facc15' }}>★</span> {item.score.toFixed(1)} • {item.type}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .watchlist-option-btn:hover { background: var(--bg-surface-recessed) !important; }
        .watchlist-option-btn.delete:hover { background: rgba(239, 68, 68, 0.12) !important; }
        .related-item:hover { background: var(--bg-surface-recessed) !important; border-color: var(--border-color-active) !important; }
        .related-item:hover .related-title { color: var(--color-primary) !important; }
        .genre-pill:hover { background: var(--color-primary) !important; color: #fff !important; }
        .season-btn:hover { border-color: var(--color-primary) !important; }
        
        @media (max-width: 768px) {
          .detail-upper-block { grid-template-columns: 1fr !important; justify-items: center; text-align: center; }
          .detail-poster-wrap { width: 180px !important; margin-top: -100px !important; }
          .detail-title { font-size: 26px !important; }
          .detail-lower-block { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
