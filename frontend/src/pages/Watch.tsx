import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Play, Lightbulb, AlertTriangle, Plus, Check, Info, Tv } from 'lucide-react';
import { CommentsSection } from '../components/CommentsSection';
import axios from 'axios';

const axiosInstance = axios;

interface EpisodeDetail {
  id: string;
  episodeNumber: number;
  title: string;
  videoUrl: string;
  thumbnail: string;
  duration?: string | null;
  hasDub?: boolean;
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
  hasSub?: boolean | null;
  hasDub?: boolean | null;
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
  const [inWatchlist, setInWatchlist] = useState(false);

  // Filters for left column episodes sidebar
  const [activeTranslationFilter, setActiveTranslationFilter] = useState<'sub_dub' | 'sub' | 'dub'>('sub_dub');
  const [episodeSearch, setEpisodeSearch] = useState('');

  // Range selection for episode chunks of 100
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);

  // Track watched episodes numbers for highlighting
  const [watchedEpisodes, setWatchedEpisodes] = useState<number[]>([]);

  // Controls bar toggles stored in localStorage
  const [autoPlay, setAutoPlay] = useState<boolean>(() => localStorage.getItem('autoPlay') === 'true');
  const [autoNext, setAutoNext] = useState<boolean>(() => localStorage.getItem('autoNext') !== 'false');
  const [autoSkip, setAutoSkip] = useState<boolean>(() => localStorage.getItem('autoSkip') !== 'false');
  const [lightsOff, setLightsOff] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Aniwave Server States
  const [activeServer, setActiveServer] = useState<'vidplay' | 'mycloud' | 'filemoon'>('vidplay');
  const [activeTranslation, setActiveTranslation] = useState<'sub' | 'dub'>('sub');

  // Translation availability state
  const [hasDub, setHasDub] = useState(true);
  const [seasons, setSeasons] = useState<{ seasonNumber: number; title: string; slug: string }[]>([]);

  const [loading, setLoading] = useState(true);

  // Calculate 100-chunk pagination ranges
  const ranges = React.useMemo(() => {
    const list = [];
    const totalEps = episodesList.length;
    const chunkSize = 100;
    for (let i = 0; i < totalEps; i += chunkSize) {
      const start = i + 1;
      const end = Math.min(i + chunkSize, totalEps);
      list.push({
        start,
        end,
        label: `${String(start).padStart(3, '0')}-${String(end).padStart(3, '0')}`
      });
    }
    return list;
  }, [episodesList.length]);

  // Sync range automatically when active episode changes
  useEffect(() => {
    if (episodesList.length > 0 && epNum) {
      const activeEp = parseInt(epNum);
      const matchedRange = ranges.find(r => activeEp >= r.start && activeEp <= r.end);
      if (matchedRange) {
        setSelectedRange({ start: matchedRange.start, end: matchedRange.end });
      } else if (ranges.length > 0) {
        setSelectedRange({ start: ranges[0].start, end: ranges[0].end });
      }
    }
  }, [epNum, episodesList.length, ranges]);
  // Synchronize toggle options to localStorage
  useEffect(() => {
    localStorage.setItem('autoPlay', String(autoPlay));
  }, [autoPlay]);

  useEffect(() => {
    localStorage.setItem('autoNext', String(autoNext));
  }, [autoNext]);

  useEffect(() => {
    localStorage.setItem('autoSkip', String(autoSkip));
  }, [autoSkip]);

  // Load list of watched episodes for current anime from localStorage
  useEffect(() => {
    if (animeDetail?.id) {
      const key = `watched:${animeDetail.id}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          setWatchedEpisodes(JSON.parse(stored));
        } catch (e) {
          console.error('Error parsing watched episodes:', e);
        }
      }
    }
  }, [animeDetail?.id]);

  // Mark current episode as watched and save to localStorage + api history
  useEffect(() => {
    if (animeDetail?.id && epNum) {
      const ep = parseInt(epNum);
      if (!isNaN(ep)) {
        const key = `watched:${animeDetail.id}`;
        const currentListStr = localStorage.getItem(key);
        let list: number[] = [];
        if (currentListStr) {
          try {
            list = JSON.parse(currentListStr);
          } catch (e) {
            // ignore
          }
        }
        if (!list.includes(ep)) {
          const newList = [...list, ep];
          localStorage.setItem(key, JSON.stringify(newList));
          setWatchedEpisodes(newList);

          // Save to server history in background
          axiosInstance.post('/api/history', {
            animeId: animeDetail.id,
            episodeNumber: ep
          }).catch(() => {
            // Safe ignore if unauthorized/anonymous
          });
        }
      }
    }
  }, [animeDetail?.id, epNum]);

  useEffect(() => {
    const fetchWatchData = async () => {
      if (!slug || !epNum) return;
      try {
        setLoading(true);
        // Fetch episode streaming data
        const epRes = await axiosInstance.get(`/api/anime/${slug}/episodes/${epNum}`);
        setEpisode(epRes.data.episode);
        setAnimeName(epRes.data.animeName);
        setHasPrev(epRes.data.hasPrev);
        setHasNext(epRes.data.hasNext);
        const epHasDub = epRes.data.hasDub ?? true;
        setHasDub(epHasDub);

        // Fetch anime details and related list (franchise content)
        const detailRes = await axiosInstance.get(`/api/anime/${slug}`);
        const animeData = detailRes.data.anime;
        setAnimeDetail(animeData);

        let defaultTranslation: 'sub' | 'dub' = 'sub';
        if (animeData.hasSub === false && animeData.hasDub !== false && epHasDub) {
          defaultTranslation = 'dub';
        }
        setActiveTranslation(defaultTranslation);
        setEpisodesList(detailRes.data.anime.episodes || []);
        setRelatedList(detailRes.data.related || []);
        setSeasons(detailRes.data.seasons || []);

        // Fetch watchlist status
        try {
          const watchRes = await axiosInstance.get(`/api/watchlist/status/${detailRes.data.anime.id}`);
          setInWatchlist(watchRes.data.inWatchlist);
        } catch (e) {
          // Ignore if unauthenticated
        }
      } catch (err) {
        console.error('Error fetching watch page data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchData();
  }, [slug, epNum]);

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

  const toggleWatchlist = async () => {
    if (!animeDetail) return;
    try {
      if (inWatchlist) {
        await axiosInstance.delete(`/api/watchlist/${animeDetail.id}`);
        setInWatchlist(false);
      } else {
        await axiosInstance.post('/api/watchlist', { animeId: animeDetail.id, status: 'Watching' });
        setInWatchlist(true);
      }
    } catch (err) {
      navigate('/auth'); // Redirect to login if unauthorized
    }
  };

  const getEmbedUrl = () => {
    if (!animeDetail || !epNum) return '';
    let idToUse = animeDetail.malId || 21; // Fallback to One Piece
    let epNumToUse = parseInt(epNum);

    // Bleach: Thousand-Year Blood War MAL ID mapping fix
    // Scrapers index Bleach TYBW under original Bleach (MAL 269) as continuing episodes (367+).
    if (idToUse === 45576) {
      idToUse = 269;
      epNumToUse = epNumToUse + 366;
    } else if (idToUse === 53998) {
      idToUse = 269;
      epNumToUse = epNumToUse + 379;
    } else if (idToUse === 56206) {
      idToUse = 269;
      epNumToUse = epNumToUse + 392;
    }

    let url = '';
    if (activeServer === 'vidplay') {
      url = `https://animeplay.cfd/stream/mal/${idToUse}/${epNumToUse}/${activeTranslation}`;
    } else if (activeServer === 'mycloud') {
      url = `https://embed.su/embed/anime/${idToUse}/${epNumToUse}`;
    } else if (activeServer === 'filemoon') {
      url = `https://animeplay.cfd/stream/mal/${idToUse}/${epNumToUse}/${activeTranslation}`;
    }

    if (url) {
      const params: string[] = [];
      if (autoPlay) {
        params.push('autoplay=1');
      }
      if (autoSkip) {
        params.push('autoskip=1');
      }
      if (params.length > 0) {
        url += (url.includes('?') ? '&' : '?') + params.join('&');
      }
    }
    return url;
  };

  // Filter episodes based on user search query & selected range (only if total count > 100)
  const filteredEpisodes = episodesList.filter(ep => {
    // If user has selected DUB filter, hide episodes that do not have dubbing available yet
    if (activeTranslationFilter === 'dub' && ep.hasDub === false) {
      return false;
    }

    // Filter by range chunk (e.g. 101-200) only if total episodes exceeds 100
    if (episodesList.length > 100 && selectedRange) {
      if (ep.episodeNumber < selectedRange.start || ep.episodeNumber > selectedRange.end) {
        return false;
      }
    }
    // Filter by search text
    if (episodeSearch) {
      return ep.episodeNumber.toString().includes(episodeSearch);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="app-container" style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
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
    <div className="app-container" style={{ padding: '16px 20px', color: '#fff', position: 'relative' }}>

      {/* THEATER LIGHTS OFF DARK BLANKET */}
      {lightsOff && (
        <div
          onClick={() => setLightsOff(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.92)', zIndex: 999, cursor: 'pointer', transition: 'all 0.3s ease' }}
        />
      )}

      {/* BREADCRUMB NAVIGATION */}
      <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
        <span>/</span>
        <Link to={`/anime/${animeDetail.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{animeName}</Link>
        <span>/</span>
        <span style={{ color: 'var(--color-primary)' }}>Episode {epNum}</span>
      </div>

      {/* THEATER MAIN SCREEN BOX (2-COLUMN LAYOUT) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isExpanded ? '1fr' : '320px 1fr',
          gap: '24px',
          alignItems: 'stretch',
          marginBottom: '24px',
          position: 'relative',
          zIndex: lightsOff ? 1000 : 1
        }}
        className="watch-theater-split"
      >

        {/* COLUMN 1: SIDEBAR (LEFT) - EPISODES (STRETCHED TO MATCH ROW HEIGHT) */}
        {!isExpanded && (
          <div style={{ background: '#110e16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px 14px', display: 'flex', flexDirection: 'column', height: '70%', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 800 }}>Episodes</h3>

              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <select
                  value={activeTranslationFilter}
                  onChange={(e) => setActiveTranslationFilter(e.target.value as any)}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', borderRadius: '4px', padding: '5px', fontSize: '10px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="sub_dub" style={{ background: '#110e16', color: '#fff' }}>Sub/Dub</option>
                  <option value="sub" style={{ background: '#110e16', color: '#fff' }}>Sub</option>
                  <option value="dub" style={{ background: '#110e16', color: '#fff' }}>Dub</option>
                </select>

                {episodesList.length > 100 && (
                  <select
                    value={selectedRange ? `${selectedRange.start}-${selectedRange.end}` : ''}
                    onChange={(e) => {
                      const [start, end] = e.target.value.split('-').map(Number);
                      setSelectedRange({ start, end });
                    }}
                    style={{ width: '70px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', borderRadius: '4px', padding: '5px', fontSize: '10px', outline: 'none', cursor: 'pointer' }}
                  >
                    {ranges.map((r, idx) => (
                      <option key={idx} value={`${r.start}-${r.end}`} style={{ background: '#110e16', color: '#fff' }}>{r.label}</option>
                    ))}
                  </select>
                )}

                <input
                  type="text"
                  placeholder="Find"
                  value={episodeSearch}
                  onChange={(e) => setEpisodeSearch(e.target.value)}
                  style={{ width: '50px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', padding: '5px', fontSize: '10px', color: '#fff', outline: 'none' }}
                />
              </div>
            </div>

            {/* Episode buttons in a 6-column grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '6px',
                overflowY: 'auto',
                paddingRight: '2px',
                flex: 1
              }}
              className="no-scrollbar"
            >
              {filteredEpisodes.map((ep) => {
                const isActive = ep.episodeNumber === parseInt(epNum || '1');
                const isWatched = watchedEpisodes.includes(ep.episodeNumber);

                let bg = 'rgba(255,255,255,0.03)';
                let border = '1px solid rgba(255,255,255,0.05)';
                let textColor = '#fff';

                if (isActive) {
                  bg = '#fff';
                  border = '1px solid #fff';
                  textColor = '#000';
                } else if (isWatched) {
                  bg = 'rgba(139, 92, 246, 0.15)';
                  border = '1px solid rgba(139, 92, 246, 0.35)';
                  textColor = '#c084fc';
                }

                return (
                  <Link
                    key={ep.id}
                    to={`/watch/${slug}/episode/${ep.episodeNumber}`}
                    style={{
                      height: '34px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: bg,
                      border: border,
                      color: textColor,
                      textDecoration: 'none',
                      fontWeight: 700,
                      fontSize: '12px',
                      borderRadius: '4px',
                      transition: 'var(--transition-fast)'
                    }}
                    title={`Episode ${ep.episodeNumber}`}
                    className="episode-sidebar-btn"
                  >
                    {ep.episodeNumber}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* COLUMN 2: VIDEO PLAYER + SETTINGS CONTROL PANEL (RIGHT) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>

          {/* Top banner notice */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <Info size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span>Registered users can now comment, track their Request/Report in account.</span>
          </div>

          {/* Video Player / Iframe Container */}
          <div style={{ width: '100%', background: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', position: 'relative', aspectRatio: '16/9', boxShadow: 'var(--glass-shadow)' }}>
            <iframe
              src={getEmbedUrl()}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
              title={`${activeServer} Player`}
            />
          </div>

          {/* Sub-player Control Settings Bar */}
          <div style={{ background: '#110e16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 16px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>

            {/* Playback helpers */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '18px', fontSize: '13px', fontWeight: 600, color: '#bcc5cf' }}>

              <button
                onClick={() => setIsExpanded(prev => !prev)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}
              >
                <Tv size={14} style={{ color: '#8b5cf6' }} /> {isExpanded ? 'Shrink' : 'Expand'}
              </button>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#bcc5cf' }}>
                <input type="checkbox" checked={autoPlay} onChange={(e) => setAutoPlay(e.target.checked)} style={{ accentColor: '#8b5cf6', cursor: 'pointer' }} />
                <span>Auto Play</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#bcc5cf' }}>
                <input type="checkbox" checked={autoNext} onChange={(e) => setAutoNext(e.target.checked)} style={{ accentColor: '#8b5cf6', cursor: 'pointer' }} />
                <span>Auto Next</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  background: '#ffcc00',
                  color: '#000',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontWeight: 700
                }}
              >
                <input type="checkbox" checked={autoSkip} onChange={(e) => setAutoSkip(e.target.checked)} style={{ accentColor: '#000', cursor: 'pointer' }} />
                <span>Auto Skip</span>
              </label>

              <button
                onClick={() => setLightsOff(prev => !prev)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}
              >
                <Lightbulb size={14} style={{ fill: lightsOff ? '#fff' : 'none' }} /> Light
              </button>
            </div>

            {/* Skip arrows and report triggers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', color: '#bcc5cf', fontWeight: 600 }}>

              {/* Prev / Next */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handlePrevEpisode}
                  disabled={!hasPrev}
                  style={{ background: 'none', border: 'none', color: hasPrev ? '#fff' : 'rgba(255,255,255,0.25)', cursor: hasPrev ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 700, padding: 0 }}
                >
                  ◀ Prev
                </button>
                <button
                  onClick={handleNextEpisode}
                  disabled={!hasNext}
                  style={{ background: 'none', border: 'none', color: hasNext ? '#fff' : 'rgba(255,255,255,0.25)', cursor: hasNext ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 700, padding: 0 }}
                >
                  Next ▶
                </button>
              </div>

              <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>

              <button style={{ background: 'none', border: 'none', color: '#bcc5cf', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, padding: 0 }}>
                <AlertTriangle size={14} /> Report
              </button>

              <button
                onClick={toggleWatchlist}
                style={{ background: 'none', border: 'none', color: '#bcc5cf', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, padding: 0 }}
              >
                {inWatchlist ? <Check size={14} style={{ color: 'var(--color-primary)' }} /> : <Plus size={14} />} Add to list
              </button>
            </div>
          </div>

          {/* Translation Toggles & Servers bar */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'stretch' }}>

            {/* SUB servers group */}
            {animeDetail.hasSub !== false && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, minWidth: '40px', letterSpacing: '0.5px' }}>SUB:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    onClick={() => { setActiveTranslation('sub'); setActiveServer('vidplay'); }}
                    style={{
                      background: (activeTranslation === 'sub' && activeServer === 'vidplay') ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)',
                      border: '1px solid ' + ((activeTranslation === 'sub' && activeServer === 'vidplay') ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)'),
                      color: '#fff',
                      padding: '6px 14px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: (activeTranslation === 'sub' && activeServer === 'vidplay') ? 'var(--glow-shadow)' : 'none',
                      transition: 'var(--transition-fast)'
                    }}
                    className="server-badge"
                  >
                    <Play size={10} style={{ fill: 'currentColor' }} /> Vidplay
                  </button>

                  <button
                    onClick={() => { setActiveTranslation('sub'); setActiveServer('mycloud'); }}
                    style={{
                      background: (activeTranslation === 'sub' && activeServer === 'mycloud') ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)',
                      border: '1px solid ' + ((activeTranslation === 'sub' && activeServer === 'mycloud') ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)'),
                      color: '#fff',
                      padding: '6px 14px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: (activeTranslation === 'sub' && activeServer === 'mycloud') ? 'var(--glow-shadow)' : 'none',
                      transition: 'var(--transition-fast)'
                    }}
                    className="server-badge"
                  >
                    <Play size={10} style={{ fill: 'currentColor' }} /> BYFMS
                  </button>

                  <button
                    onClick={() => { setActiveTranslation('sub'); setActiveServer('filemoon'); }}
                    style={{
                      background: (activeTranslation === 'sub' && activeServer === 'filemoon') ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)',
                      border: '1px solid ' + ((activeTranslation === 'sub' && activeServer === 'filemoon') ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)'),
                      color: '#fff',
                      padding: '6px 14px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: (activeTranslation === 'sub' && activeServer === 'filemoon') ? 'var(--glow-shadow)' : 'none',
                      transition: 'var(--transition-fast)'
                    }}
                    className="server-badge"
                  >
                    <Play size={10} style={{ fill: 'currentColor' }} /> DGHG
                  </button>
                </div>
              </div>
            )}

            {/* DUB servers group */}
            {animeDetail.hasDub !== false && hasDub && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800, minWidth: '40px', letterSpacing: '0.5px' }}>DUB:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    onClick={() => { setActiveTranslation('dub'); setActiveServer('vidplay'); }}
                    style={{
                      background: (activeTranslation === 'dub' && activeServer === 'vidplay') ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)',
                      border: '1px solid ' + ((activeTranslation === 'dub' && activeServer === 'vidplay') ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)'),
                      color: '#fff',
                      padding: '6px 14px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: (activeTranslation === 'dub' && activeServer === 'vidplay') ? 'var(--glow-shadow)' : 'none',
                      transition: 'var(--transition-fast)'
                    }}
                    className="server-badge"
                  >
                    <Play size={10} style={{ fill: 'currentColor' }} /> Vidplay
                  </button>

                  <button
                    onClick={() => { setActiveTranslation('dub'); setActiveServer('filemoon'); }}
                    style={{
                      background: (activeTranslation === 'dub' && activeServer === 'filemoon') ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)',
                      border: '1px solid ' + ((activeTranslation === 'dub' && activeServer === 'filemoon') ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)'),
                      color: '#fff',
                      padding: '6px 14px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: (activeTranslation === 'dub' && activeServer === 'filemoon') ? 'var(--glow-shadow)' : 'none',
                      transition: 'var(--transition-fast)'
                    }}
                    className="server-badge"
                  >
                    <Play size={10} style={{ fill: 'currentColor' }} /> DGHG
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RELATED RECOMMENDATIONS (HORIZONTAL BELOW PLAYER ON RIGHT COLUMN) */}
          {!isExpanded && (
            <div style={{ background: '#110e16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 800 }}>Related Anime</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-dark)', cursor: 'pointer' }}>More ▾</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '14px',
                  overflowX: 'auto',
                  paddingBottom: '6px'
                }}
                className="no-scrollbar"
              >
                {relatedList.slice(0, 10).map((item) => (
                  <Link
                    key={item.id}
                    to={`/anime/${item.slug}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      textDecoration: 'none',
                      color: 'inherit',
                      width: '110px',
                      flexShrink: 0
                    }}
                    className="related-item-card"
                  >
                    <div style={{ width: '110px', height: '155px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
                      <img src={item.posterImage} alt={item.title} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'var(--transition-fast)' }} />
                      <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(0,0,0,0.85)', padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 700, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        ⭐ {item.score.toFixed(1)}
                      </div>
                    </div>
                    <h4 style={{ fontSize: '12px', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.3', minHeight: '32px', transition: 'var(--transition-fast)' }} className="related-title-text">
                      {item.title}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LOWER SECTION: FULL-WIDTH ANIME DETAILS & COMMENTS FEED (ELIMINATES EMPTY SPACES) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* FULL-WIDTH DETAILS BLOCK CARD WITH 4K HD WIDESCREEN BANNER */}
        <div
          style={{
            background: '#110e16',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap'
          }}
          className="details-mini-card"
        >
          {/* Left Sub-Panel: Poster and Quick Info list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '200px' }}>
            <img
              src={animeDetail.posterImage}
              alt={animeName}
              referrerPolicy="no-referrer"
              style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
            />

            {/* Quick Stats layout inside sidebar */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 800, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Quick Stats
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Type:</span><span>{animeDetail.type}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Status:</span><span>{animeDetail.status}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Studio:</span><span>{animeDetail.studio || 'Unknown'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Duration:</span><span>{animeDetail.duration || '24 min'}</span></div>
              </div>
            </div>
          </div>

          {/* Right Sub-Panel: widescreen banner and synopsis details */}
          <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* 4K HD widescreen banner */}
            {animeDetail.bannerImage && (
              <div style={{ width: '100%', height: '150px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
                <img src={animeDetail.bannerImage} alt={animeName} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(17,14,22,0.95))' }} />
              </div>
            )}

            <div>
              <h2 style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '8px', lineHeight: '1.2' }}>
                <Link to={`/anime/${animeDetail.slug}`} style={{ textDecoration: 'none', color: 'inherit', transition: 'var(--transition-fast)' }} className="mini-card-title-link">
                  {animeName}
                </Link>
              </h2>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '12px' }}>
                {animeDetail.hasSub !== false && (
                  <span style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '3px', padding: '2px 6px', fontSize: '10px', fontWeight: 700 }}>SUB</span>
                )}
                {animeDetail.hasDub !== false && (
                  <span style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-teal)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '3px', padding: '2px 6px', fontSize: '10px', fontWeight: 700 }}>DUB</span>
                )}
                <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: '6px' }}>• Released: {animeDetail.releasedYear || 'Unknown'} • Rating: {animeDetail.score ? `⭐ ${animeDetail.score.toFixed(1)}` : 'N/A'}</span>
              </div>

              {/* Seasons Switcher Section */}
              {seasons.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Seasons & Movies:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '2px' }}>
                    {seasons.map((s: any) => {
                      const isActive = s.slug === animeDetail.slug;
                      return (
                        <button
                          key={s.slug}
                          onClick={() => !isActive && navigate(`/watch/${s.slug}/episode/1`)}
                          style={{
                            background: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)',
                            border: isActive ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.06)',
                            color: '#fff',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: isActive ? 700 : 500,
                            cursor: isActive ? 'default' : 'pointer',
                            transition: 'var(--transition-fast)',
                            boxShadow: isActive ? 'var(--glow-shadow)' : 'none'
                          }}
                          className={isActive ? '' : 'season-switch-btn'}
                        >
                          {s.type === 'MOVIE' ? `🎬 Movie: ${s.title}` : `Season ${s.seasonNumber}: ${s.title}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700 }}>Synopsis</h4>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13.5px', lineHeight: '1.7' }}>
                {animeDetail.description}
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'auto', paddingTop: '10px' }}>
              {animeDetail.genres.split(',').map((genre) => (
                <span key={genre} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', padding: '3px 10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {genre.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* FULL-WIDTH COMMENTS FEED FOR HIGH ENGAGEMENT */}
        <div style={{ width: '100%' }}>
          {animeDetail && epNum && (
            <CommentsSection
              animeId={animeDetail.id}
              episodeNumber={parseInt(epNum)}
            />
          )}
        </div>

      </div>

      <style>{`
        .episode-sidebar-btn:hover { background: #fff !important; color: #000 !important; border-color: #fff !important; box-shadow: var(--glow-shadow); }
        .server-badge:hover { background: var(--color-primary-hover) !important; border-color: var(--color-primary) !important; box-shadow: var(--glow-shadow); }
        .related-item-row:hover { background: rgba(255,255,255,0.04) !important; border-color: var(--color-primary) !important; }
        .related-item-row:hover .related-title-text { color: var(--color-primary) !important; }
        .mini-card-title-link:hover { color: var(--color-primary) !important; }
        .season-switch-btn:hover { background: rgba(255,255,255,0.08) !important; border-color: var(--color-primary) !important; color: #fff !important; }
        
        .related-item-card:hover .related-title-text { color: var(--color-primary) !important; }
        .related-item-card:hover img { transform: scale(1.05); }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @media (max-width: 992px) {
          .watch-theater-split { grid-template-columns: 1fr !important; }
          .details-mini-card { flex-direction: column !important; }
          .details-mini-card > div { width: 100% !important; }
        }
      `}</style>
    </div>
  );
};
