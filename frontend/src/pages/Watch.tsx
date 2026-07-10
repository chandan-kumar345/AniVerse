import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CommentsSection } from '../components/CommentsSection';
import { ChevronLeft, ChevronRight, Server, List } from 'lucide-react';

interface EpisodeDetail {
  id: string;
  episodeNumber: number;
  title: string;
  videoUrl: string;
  thumbnail: string;
  duration?: string | null;
}

interface AnimeDetailData {
  id: string;
  malId?: number | null;
  slug: string;
  title: string;
  englishTitle?: string | null;
  description: string;
  posterImage: string;
  bannerImage?: string | null;
  score: number;
  type: string;
  studio?: string | null;
  status: string;
  releasedYear?: number | null;
  duration?: string | null;
  genres: string;
}

export const Watch: React.FC = () => {
  const { slug, epNum } = useParams<{ slug: string; epNum: string }>();
  const navigate = useNavigate();

  const [episode, setEpisode] = useState<EpisodeDetail | null>(null);
  const [animeName, setAnimeName] = useState('');
  const [animeDetail, setAnimeDetail] = useState<AnimeDetailData | null>(null);
  const [episodesList, setEpisodesList] = useState<EpisodeDetail[]>([]);
  const [relatedList, setRelatedList] = useState<any[]>([]);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  
  // Aniwave Server States
  const [activeServer, setActiveServer] = useState<'vidplay' | 'mycloud' | 'filemoon'>('vidplay');
  const [activeTranslation, setActiveTranslation] = useState<'sub' | 'dub'>('sub');
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWatchData = async () => {
      if (!slug || !epNum) return;
      try {
        setLoading(true);
        // Fetch episode streaming data
        const epRes = await axios.get(`/api/anime/${slug}/episodes/${epNum}`);
        setEpisode(epRes.data.episode);
        setAnimeName(epRes.data.animeName);
        setHasPrev(epRes.data.hasPrev);
        setHasNext(epRes.data.hasNext);

        // Fetch anime details and related list
        const detailRes = await axios.get(`/api/anime/${slug}`);
        setAnimeDetail(detailRes.data.anime);
        setEpisodesList(detailRes.data.anime.episodes || []);
        setRelatedList(detailRes.data.related || []);
      } catch (err) {
        console.error('Error fetching watch page data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchData();
  }, [slug, epNum]);

  useEffect(() => {
    if (animeDetail && epNum) {
      document.title = `Watch ${animeName} Episode ${epNum} English Sub/Dub Online in HD - Bankai TV`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', `Watch online free ${animeName} Episode ${epNum} with translation toggles, fast servers (Vidplay, MyCloud, Filemoon), ad-free controls, and comments on Bankai TV.`);
      }
    }
  }, [animeDetail, epNum, animeName]);

  // Protect parent window from external top-level redirects
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleNextEpisode = () => {
    if (hasNext && slug && epNum) {
      navigate(`/watch/${slug}/episode/${parseInt(epNum) + 1}`);
      setActiveServer('vidplay'); // Reset to default server on ep change
    }
  };

  const handlePrevEpisode = () => {
    if (hasPrev && slug && epNum) {
      navigate(`/watch/${slug}/episode/${parseInt(epNum) - 1}`);
      setActiveServer('vidplay'); // Reset to default server on ep change
    }
  };

  const getEmbedUrl = () => {
    if (!animeDetail || !epNum) return '';
    const idToUse = animeDetail.malId || 21; // Fallback to One Piece
    
    if (activeServer === 'vidplay') {
      return `https://animeplay.cfd/stream/mal/${idToUse}/${epNum}/${activeTranslation}`;
    }
    if (activeServer === 'mycloud') {
      return `https://embed.su/embed/anime/${idToUse}/${epNum}`;
    }
    if (activeServer === 'filemoon') {
      // Direct stream alternative or mirror
      return `https://animeplay.cfd/stream/mal/${idToUse}/${epNum}/${activeTranslation}`;
    }
    return '';
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ height: '550px', width: '100%', borderRadius: '12px' }} className="shimmer" />
        <div style={{ height: '100px', width: '100%', borderRadius: '12px' }} className="shimmer" />
      </div>
    );
  }

  if (!episode || !animeDetail) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        <h2>Episode or Anime details not found.</h2>
        <Link to="/" style={{ color: 'var(--color-primary)', marginTop: '10px', display: 'inline-block' }}>Back to Home</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px', color: '#fff' }}>
      
      {/* HEADER BREADCRUMBS */}
      <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
        <span>/</span>
        <Link to={`/anime/${animeDetail.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{animeName}</Link>
        <span>/</span>
        <span style={{ color: 'var(--color-primary)' }}>Episode {epNum}</span>
      </div>

      {/* THEATER PLAYER CONTAINER */}
      <div style={{ width: '100%', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--glass-shadow)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px', position: 'relative', aspectRatio: '16/9' }}>
        <iframe
          src={getEmbedUrl()}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allowFullScreen
          title={`${activeServer} Player`}
        />
        {/* Safe streaming connection notice */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(95, 50, 230, 0.9)', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.5)', zIndex: 10 }}>
          ⚡ Live Multi-Server Connection
        </div>
      </div>

      {/* PLAY CONTROL NAVIGATION & STREAM SERVERS (ANIWAVE STYLE) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', background: '#141318', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', marginBottom: '30px' }}>
        
        {/* Navigation title row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              Episode {epNum}: {episode.title.split(':').slice(1).join(':').trim() || 'Episode ' + epNum}
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>Playing on Server: <span style={{ color: 'var(--color-primary)', textTransform: 'uppercase', fontWeight: 700 }}>{activeServer}</span></span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePrevEpisode}
              disabled={!hasPrev}
              style={{ opacity: hasPrev ? 1 : 0.4, cursor: hasPrev ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px' }}
              className="btn-secondary"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              onClick={handleNextEpisode}
              disabled={!hasNext}
              style={{ opacity: hasNext ? 1 : 0.4, cursor: hasNext ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px' }}
              className="btn-secondary"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Server Grouping Panel */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
            <Server size={15} /> Choose Video Streaming Server:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* SUB LINE */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', background: 'rgba(250, 176, 5, 0.1)', border: '1px solid rgba(250, 176, 5, 0.2)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', width: '50px', textAlign: 'center' }}>
                Sub
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  onClick={() => { setActiveServer('vidplay'); setActiveTranslation('sub'); }}
                  style={{ background: activeServer === 'vidplay' && activeTranslation === 'sub' ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                  className="server-badge"
                >
                  Vidplay
                </button>
                <button
                  onClick={() => { setActiveServer('mycloud'); setActiveTranslation('sub'); }}
                  style={{ background: activeServer === 'mycloud' && activeTranslation === 'sub' ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                  className="server-badge"
                >
                  MyCloud
                </button>
                <button
                  onClick={() => { setActiveServer('filemoon'); setActiveTranslation('sub'); }}
                  style={{ background: activeServer === 'filemoon' && activeTranslation === 'sub' ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                  className="server-badge"
                >
                  Filemoon
                </button>
              </div>
            </div>

            {/* DUB LINE */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-teal)', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', width: '50px', textAlign: 'center' }}>
                Dub
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  onClick={() => { setActiveServer('vidplay'); setActiveTranslation('dub'); }}
                  style={{ background: activeServer === 'vidplay' && activeTranslation === 'dub' ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                  className="server-badge"
                >
                  Vidplay
                </button>
                <button
                  onClick={() => { setActiveServer('mycloud'); setActiveTranslation('dub'); }}
                  style={{ background: activeServer === 'mycloud' && activeTranslation === 'dub' ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                  className="server-badge"
                >
                  MyCloud
                </button>
                <button
                  onClick={() => { setActiveServer('filemoon'); setActiveTranslation('dub'); }}
                  style={{ background: activeServer === 'filemoon' && activeTranslation === 'dub' ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                  className="server-badge"
                >
                  Filemoon
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* LOWER SECTION: INFO, EPISODE GRID, AND COMMENTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px' }} className="watch-grid">
        
        {/* LEFT COLUMN: EPISODES GRID, INFO BLOCK, COMMENTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* EPISODE NUMBER GRID (ANIWAVE STYLE) */}
          <div style={{ background: '#141318', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
              <List size={18} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800 }}>
                Episodes Selection Grid
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))', gap: '8px' }}>
              {episodesList.map((ep) => {
                const isActive = ep.episodeNumber === parseInt(epNum || '1');
                return (
                  <Link
                    key={ep.id}
                    to={`/watch/${slug}/episode/${ep.episodeNumber}`}
                    style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)', border: isActive ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.06)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '13px', borderRadius: '4px', transition: 'var(--transition-fast)' }}
                    className="episode-grid-badge"
                  >
                    {ep.episodeNumber}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ANIME DETAILS MINI CARD */}
          <div style={{ background: '#141318', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', display: 'flex', gap: '20px', flexWrap: 'wrap' }} className="details-mini-card">
            <img src={animeDetail.posterImage} alt={animeName} referrerPolicy="no-referrer" style={{ width: '100px', height: '140px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }} />
            <div style={{ flex: 1, minWidth: '250px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
                <Link to={`/anime/${animeDetail.slug}`} style={{ textDecoration: 'none', color: 'inherit', transition: 'var(--transition-fast)' }} className="mini-card-title-link">
                  {animeName}
                </Link>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '14px' }}>
                {animeDetail.description}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {animeDetail.genres.split(',').map((genre) => (
                  <span key={genre} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {genre.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* COMMENTS FEED */}
          {animeDetail && epNum && (
            <CommentsSection
              animeId={animeDetail.id}
              episodeNumber={parseInt(epNum)}
            />
          )}
        </div>

        {/* RIGHT COLUMN: RECOMMENDATIONS & STATS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Quick Stats list */}
          <div style={{ background: '#141318', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
              Quick Info
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Type</span><span>{animeDetail.type}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Released</span><span>{animeDetail.releasedYear || 'Unknown'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Status</span><span>{animeDetail.status}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Studio</span><span>{animeDetail.studio || 'Unknown'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Duration</span><span>{animeDetail.duration || '24m'}</span></div>
            </div>
          </div>

          {/* Recommended list */}
          {relatedList.length > 0 && (
            <div style={{ background: '#141318', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                You Might Also Like
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {relatedList.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    to={`/anime/${item.slug}`}
                    style={{ display: 'flex', gap: '12px', textDecoration: 'none', color: 'inherit', transition: 'var(--transition-fast)' }}
                    className="related-item-row"
                  >
                    <img src={item.posterImage} alt={item.title} referrerPolicy="no-referrer" style={{ width: '45px', height: '65px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h4 style={{ fontSize: '13px', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', marginBottom: '4px', transition: 'var(--transition-fast)' }} className="related-title-text">
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

      <style>{`
        .episode-grid-badge:hover { background: var(--color-primary-hover) !important; border-color: var(--color-primary) !important; box-shadow: var(--glow-shadow); }
        .server-badge:hover { background: rgba(95, 50, 230, 0.15) !important; border-color: var(--color-primary) !important; }
        .related-item-row:hover .related-title-text { color: var(--color-primary) !important; }
        .related-item-row:hover { transform: translateX(2px); }
        .mini-card-title-link:hover { color: var(--color-primary) !important; }
        @media (max-width: 992px) {
          .watch-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
