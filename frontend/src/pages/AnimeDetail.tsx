import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { AnimeData } from '../components/AnimeCard';
import { Play, Plus, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AnimeDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [anime, setAnime] = useState<(AnimeData & { episodes: any[] }) | null>(null);
  const [related, setRelated] = useState<AnimeData[]>([]);
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
      document.title = `Watch ${anime.title} English Sub/Dub Online Free in HD - Bankai TV`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', `Stream ${anime.title} (${anime.releasedYear}) full episodes in HD online. ${anime.description.slice(0, 150)}... Only on Bankai TV.`);
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
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ height: '350px', width: '100%', borderRadius: '12px' }} className="shimmer" />
        <div style={{ display: 'flex', gap: '30px' }}>
          <div style={{ width: '220px', height: '320px', borderRadius: '8px' }} className="shimmer" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ height: '30px', width: '40%', borderRadius: '4px' }} className="shimmer" />
            <div style={{ height: '80px', width: '100%', borderRadius: '4px' }} className="shimmer" />
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

  return (
    <div style={{ color: '#fff', position: 'relative' }}>
      
      {/* BANNER COVER */}
      <div style={{ position: 'relative', width: '100%', height: '380px', overflow: 'hidden' }}>
        <img
          src={anime.bannerImage || anime.posterImage}
          alt={anime.title}
          referrerPolicy="no-referrer"
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(3px) brightness(0.4)' }}
        />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '160px', background: 'linear-gradient(to top, #0a0a0f 0%, rgba(10, 10, 15, 0) 100%)' }} />
      </div>

      {/* OVERLAP CONTAINER */}
      <div style={{ maxWidth: '1200px', margin: '-180px auto 0', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        
        {/* UPPER ANIME HEADER INFO */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '30px', alignItems: 'end' }} className="detail-upper-block">
          
          {/* POSTER CARD */}
          <div style={{ width: '240px', aspectRatio: '2/3', borderRadius: '12px', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.08)', boxShadow: 'var(--glass-shadow)' }} className="detail-poster-wrap">
            <img src={anime.posterImage} alt={anime.title} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* MAIN INFO TEXTS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '10px' }}>
            <h1 style={{ fontSize: '38px', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: '1.2' }} className="detail-title">
              {anime.title}
            </h1>
            {anime.englishTitle && (
              <div style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {anime.englishTitle}
              </div>
            )}
            
            {/* Badges string */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', alignItems: 'center' }}>
              <span style={{ background: 'var(--color-accent)', color: '#000', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>⭐ {anime.score.toFixed(2)}</span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span style={{ fontWeight: 600 }}>{anime.type}</span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>{anime.status}</span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>{anime.rating}</span>
            </div>

            {/* Genres */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              {genresList.map((genre) => (
                <span key={genre} style={{ background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: 'var(--text-main)' }}>
                  {genre}
                </span>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', position: 'relative' }}>
              {anime.episodes.length > 0 ? (
                <Link to={`/watch/${anime.id}/episode/1`} className="btn-primary" style={{ padding: '12px 28px', textDecoration: 'none' }}>
                  <Play size={18} style={{ fill: '#fff' }} /> Watch Episode 1
                </Link>
              ) : (
                <button disabled style={{ opacity: 0.6 }} className="btn-primary">No Episodes Available</button>
              )}

              {/* Watchlist selector */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowWatchlistMenu(!showWatchlistMenu)}
                  className="btn-secondary"
                  style={{ padding: '12px 20px', gap: '6px' }}
                >
                  {inWatchlist ? (
                    <>
                      <Check size={18} style={{ color: 'var(--color-accent)' }} />
                      <span style={{ textTransform: 'capitalize' }}>{watchlistStatus?.toLowerCase().replace(/_/g, ' ')}</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} /> Add to Watchlist
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

        {/* LOWER DETAILED CONTENT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px', marginTop: '50px' }} className="detail-lower-block">
          
          {/* LEFT SECTION: DESCRIPTION & EPISODES */}
          <div>
            {/* Synopsis */}
            <div style={{ background: '#12121c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px', marginBottom: '30px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#fff', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                Synopsis
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                {anime.description}
              </p>
            </div>

            {/* Episode Grid */}
            <div style={{ background: '#12121c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#fff', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                Episodes
              </h3>
              
              {anime.episodes.length === 0 ? (
                <div style={{ color: 'var(--text-dark)', padding: '20px 0', fontSize: '14px' }}>No episodes have been released yet.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '12px' }}>
                  {anime.episodes.map((ep) => (
                    <Link
                      key={ep.id}
                      to={`/watch/${anime.id}/episode/${ep.episodeNumber}`}
                      style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '14px', borderRadius: '8px', transition: 'var(--transition-fast)' }}
                      className="episode-badge-link"
                    >
                      {ep.episodeNumber}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SECTION: DETAILS SIDEBAR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Metadata Box */}
            <div style={{ background: '#12121c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#fff', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                Anime Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Type</span><span>{anime.type}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Studio</span><span>{anime.studio || 'Unknown'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Status</span><span>{anime.status}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Released</span><span>{anime.releasedYear || 'Unknown'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Duration</span><span>{anime.duration || '24m per ep'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Score</span><span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{anime.score.toFixed(2)}</span></div>
              </div>
            </div>

            {/* Recommendations Grid */}
            {related.length > 0 && (
              <div style={{ background: '#12121c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#fff', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                  Recommended
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {related.slice(0, 4).map((item) => (
                    <Link
                      key={item.id}
                      to={`/anime/${item.id}`}
                      style={{ display: 'flex', gap: '12px', textDecoration: 'none', color: 'inherit', transition: 'var(--transition-fast)' }}
                      className="related-item"
                    >
                      <img src={item.posterImage} alt={item.title} referrerPolicy="no-referrer" style={{ width: '45px', height: '65px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h4 style={{ fontSize: '13px', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', marginBottom: '4px', transition: 'var(--transition-fast)' }} className="related-title">
                          {item.title}
                        </h4>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>⭐ {item.score.toFixed(1)} • {item.type}</div>
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
        .watchlist-option-btn:hover { background: rgba(255,255,255,0.04); }
        .watchlist-option-btn.delete:hover { background: rgba(239, 68, 68, 0.08); }
        .episode-badge-link:hover { background: var(--color-primary) !important; border-color: var(--color-primary) !important; box-shadow: var(--glow-shadow); }
        .related-item:hover .related-title { color: var(--color-primary) !important; }
        .related-item:hover { transform: translateX(2px); }
        
        @media (max-width: 768px) {
          .detail-upper-block { grid-template-columns: 1fr !important; justify-items: center; text-align: center; }
          .detail-poster-wrap { width: 180px !important; margin-top: -100px !important; }
          .detail-title { fontSize: 28px !important; }
          .detail-lower-block { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
