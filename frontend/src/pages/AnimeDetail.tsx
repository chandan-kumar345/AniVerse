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
    <div style={{ color: '#fff', position: 'relative' }}>
      
      {/* HD BANNER COVER - Full width, no blur, cinematic gradient */}
      <div style={{ position: 'relative', width: '100%', height: '450px', overflow: 'hidden' }}>
        <img
          src={anime.bannerImage || anime.posterImage}
          alt={anime.title}
          referrerPolicy="no-referrer"
          loading="eager"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
        />
        {/* Cinematic gradient overlays */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '250px', background: 'linear-gradient(to top, var(--bg-main) 0%, rgba(8, 6, 11, 0.8) 40%, transparent 100%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, rgba(8, 6, 11, 0.6) 0%, transparent 50%, rgba(8, 6, 11, 0.3) 100%)' }} />
      </div>

      {/* OVERLAP CONTAINER */}
      <div className="app-container" style={{ margin: '-200px auto 0', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        
        {/* UPPER ANIME HEADER INFO */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '32px', alignItems: 'end' }} className="detail-upper-block">
          
          {/* POSTER CARD - HD quality */}
          <div style={{ width: '240px', aspectRatio: '2/3', borderRadius: '12px', overflow: 'hidden', border: '3px solid rgba(139, 92, 246, 0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(139, 92, 246, 0.15)' }} className="detail-poster-wrap">
            <img
              src={anime.posterImage}
              alt={anime.title}
              referrerPolicy="no-referrer"
              loading="eager"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* MAIN INFO TEXTS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '10px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: '1.15', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }} className="detail-title">
              {anime.title}
            </h1>
            {anime.englishTitle && anime.englishTitle !== anime.title && (
              <div style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {anime.englishTitle}
              </div>
            )}
            
            {/* Metadata badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '13px', alignItems: 'center' }}>
              <span style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={12} style={{ fill: '#000' }} /> {anime.score.toFixed(2)}
              </span>
              <span style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                {anime.type === 'TV' ? <Tv size={12} /> : <Film size={12} />} {anime.type}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> {anime.releasedYear || 'Unknown'}
              </span>
              <span style={{ background: anime.status === 'Currently Airing' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${anime.status === 'Currently Airing' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.1)'}`, padding: '4px 10px', borderRadius: '6px', color: anime.status === 'Currently Airing' ? '#22c55e' : '#fff', fontWeight: 600 }}>
                {anime.status}
              </span>
              {anime.rating && (
                <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                  {anime.rating}
                </span>
              )}
              {episodeCount > 0 && (
                <span style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={12} /> {episodeCount} EP{episodeCount > 1 ? 'S' : ''}
                </span>
              )}
            </div>

            {/* Genres */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
              {genresList.map((genre) => (
                <Link
                  key={genre}
                  to={`/search?genre=${genre}`}
                  style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '20px', padding: '5px 14px', fontSize: '12px', color: '#c084fc', textDecoration: 'none', transition: 'var(--transition-fast)', fontWeight: 500 }}
                  className="genre-pill"
                >
                  {genre}
                </Link>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', position: 'relative', flexWrap: 'wrap' }}>
              {episodeCount > 0 ? (
                <Link to={`/watch/${anime.slug}/episode/1`} className="btn-primary" style={{ padding: '14px 32px', textDecoration: 'none', fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Play size={18} style={{ fill: '#fff' }} /> Watch Now
                </Link>
              ) : (
                <button disabled style={{ opacity: 0.6 }} className="btn-primary">No Episodes Available</button>
              )}

              {/* Watchlist selector */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowWatchlistMenu(!showWatchlistMenu)}
                  className="btn-secondary"
                  style={{ padding: '14px 22px', gap: '6px', fontSize: '14px' }}
                >
                  {inWatchlist ? (
                    <>
                      <Check size={18} style={{ color: 'var(--color-accent)' }} />
                      <span style={{ textTransform: 'capitalize' }}>{watchlistStatus?.toLowerCase().replace(/_/g, ' ')}</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} /> Add to List
                    </>
                  )}
                </button>

                {showWatchlistMenu && (
                  <div style={{ position: 'absolute', top: '105%', left: 0, width: '180px', background: '#12121c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 99 }}>
                    {['WATCHING', 'PLAN_TO_WATCH', 'COMPLETED', 'DROPPED'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateWatchlist(status)}
                        style={{ width: '100%', border: 'none', background: watchlistStatus === status ? 'var(--color-primary)' : 'none', color: '#fff', padding: '10px 16px', textAlign: 'left', fontSize: '13px', cursor: 'pointer', transition: 'var(--transition-fast)' }}
                        className="watchlist-option-btn"
                      >
                        {status.replace(/_/g, ' ')}
                      </button>
                    ))}
                    {inWatchlist && (
                      <button
                        onClick={handleRemoveWatchlist}
                        style={{ width: '100%', border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'none', color: '#ef4444', padding: '10px 16px', textAlign: 'left', fontSize: '13px', cursor: 'pointer', transition: 'var(--transition-fast)' }}
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
          <div style={{ marginTop: '28px', background: 'rgba(17, 14, 22, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Seasons & Movies</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {seasons.map((s: any) => (
                <Link
                  key={s.slug}
                  to={`/anime/${s.slug}`}
                  style={{
                    background: s.slug === slug ? 'var(--color-primary)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${s.slug === slug ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: s.slug === slug ? '#fff' : 'var(--text-muted)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: s.slug === slug ? 700 : 500,
                    textDecoration: 'none',
                    transition: 'var(--transition-fast)',
                    boxShadow: s.slug === slug ? 'var(--glow-shadow)' : 'none',
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
            <div style={{ background: 'rgba(17, 14, 22, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#fff', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
                Synopsis
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                {anime.description}
              </p>
            </div>

            {/* Quick Info Grid */}
            <div style={{ background: 'rgba(17, 14, 22, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#fff', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
                Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Type</span><span style={{ fontWeight: 600 }}>{anime.type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Studio</span><span style={{ fontWeight: 600 }}>{anime.studio || 'Unknown'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status</span><span style={{ fontWeight: 600, color: anime.status === 'Currently Airing' ? '#22c55e' : '#fff' }}>{anime.status}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Released</span><span style={{ fontWeight: 600 }}>{anime.releasedYear || 'Unknown'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Duration</span><span style={{ fontWeight: 600 }}>{anime.duration || '24m per ep'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Score</span><span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>⭐ {anime.score.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Episodes</span><span style={{ fontWeight: 600 }}>{episodeCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Rating</span><span style={{ fontWeight: 600 }}>{anime.rating || 'Not Rated'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION: RECOMMENDATIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Recommendations */}
            {related.length > 0 && (
              <div style={{ background: 'rgba(17, 14, 22, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#fff', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                  Related & Recommended
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {related.slice(0, 8).map((item) => (
                    <Link
                      key={item.id}
                      to={`/anime/${item.slug}`}
                      style={{ display: 'flex', gap: '12px', textDecoration: 'none', color: 'inherit', transition: 'var(--transition-fast)', padding: '8px', borderRadius: '8px', border: '1px solid transparent' }}
                      className="related-item"
                    >
                      <img
                        src={item.posterImage}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        style={{ width: '50px', height: '70px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: '13px', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: '5px', transition: 'var(--transition-fast)', lineHeight: '1.4' }} className="related-title">
                          {item.title}
                        </h4>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ color: '#f59e0b', fontWeight: 600 }}>⭐ {item.score.toFixed(1)}</span>
                          <span>•</span>
                          <span>{item.type}</span>
                          {item.releasedYear && <><span>•</span><span>{item.releasedYear}</span></>}
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
        .watchlist-option-btn:hover { background: rgba(255,255,255,0.04) !important; }
        .watchlist-option-btn.delete:hover { background: rgba(239, 68, 68, 0.08) !important; }
        .related-item:hover { background: rgba(255,255,255,0.03) !important; border-color: rgba(139, 92, 246, 0.15) !important; }
        .related-item:hover .related-title { color: var(--color-primary) !important; }
        .genre-pill:hover { background: rgba(139, 92, 246, 0.2) !important; border-color: rgba(139, 92, 246, 0.4) !important; color: #fff !important; }
        .season-btn:hover { background: rgba(139, 92, 246, 0.15) !important; border-color: rgba(139, 92, 246, 0.3) !important; color: #fff !important; }
        
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
