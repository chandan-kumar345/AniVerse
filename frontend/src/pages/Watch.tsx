import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Play, Lightbulb, AlertTriangle, Plus, Check, Info, Tv, RefreshCw } from 'lucide-react';
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

export interface ServerSource {
  id: string;
  name: string;
  embedUrl?: string;
}

const DEFAULT_FALLBACK_SERVERS: ServerSource[] = [
  { id: 'vidsrc', name: 'HD-1: Ultra HD' },
  { id: 'vidsrc_me', name: 'HD-2: VidSrc Pro' },
  { id: 'vidsrc_io', name: 'HD-3: StreamCloud' },
  { id: 'twoembed', name: 'HD-4: 2Embed Global' },
  { id: 'autoembed', name: 'HD-5: AutoEmbed Multi' },
  { id: 'videasy', name: 'HD-6: VidEasy Backup' }
];

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
  hasHindi?: boolean | null;
  isMultiAudio?: boolean;
  availableAudios?: string[];
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
  const [activeTranslationFilter, setActiveTranslationFilter] = useState<'sub_dub' | 'sub' | 'dub' | 'hindi'>('sub_dub');
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

  // High-performance streaming server states (Default to vidsrc / HD-1 Ultra HD)
  const [activeServer, setActiveServer] = useState<string>('vidsrc');
  const [availableServers, setAvailableServers] = useState<ServerSource[]>([]);
  const [serversByAudio, setServersByAudio] = useState<{
    sub?: ServerSource[];
    dub?: ServerSource[];
    hindi?: ServerSource[];
  }>({});
  const [activeTranslation, setActiveTranslation] = useState<'sub' | 'dub' | 'hindi'>('sub');

  // Translation availability state
  const [hasSub, setHasSub] = useState(true);
  const [hasDub, setHasDub] = useState(true);
  const [hasHindi, setHasHindi] = useState(false);
  const [isMultiAudio, setIsMultiAudio] = useState(false);
  const [availableAudios, setAvailableAudios] = useState<string[]>(['sub']);
  const [seasons, setSeasons] = useState<{ seasonNumber: number; title: string; slug: string }[]>([]);

  const [loading, setLoading] = useState(true);
  const [embedUrl, setEmbedUrl] = useState('');

  // Seamless server switcher that cycles through active working servers of the active audio
  const switchToNextServer = () => {
    const currentList = serversByAudio[activeTranslation] || availableServers;
    if (currentList.length > 0) {
      const currentIndex = currentList.findIndex(s => s.id === activeServer);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % currentList.length : 0;
      const nextServer = currentList[nextIndex];
      setActiveServer(nextServer.id);
      if (nextServer.embedUrl) {
        setEmbedUrl(nextServer.embedUrl);
      }
    } else {
      const fallbackList = ['vidsrc', 'vidsrc_me', 'vidsrc_io', 'twoembed', 'autoembed', 'videasy'];
      const currentIndex = fallbackList.indexOf(activeServer);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % fallbackList.length : 0;
      setActiveServer(fallbackList[nextIndex]);
    }
  };

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

          // Save to server history in background ONLY if token exists
          const token = localStorage.getItem('bankai_token');
          if (token) {
            axiosInstance.post('/api/history', {
              animeId: animeDetail.id,
              episodeNumber: ep
            }).catch(() => {
              // Safe ignore if unauthorized/anonymous
            });
          }
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
        const epHasSub = epRes.data.hasSub ?? true;
        setHasSub(epHasSub);
        const epHasHindi = epRes.data.hasHindi ?? false;
        setHasHindi(epHasHindi);
        if (epRes.data.isMultiAudio !== undefined) {
          setIsMultiAudio(Boolean(epRes.data.isMultiAudio));
        }
        if (epRes.data.availableAudios) {
          setAvailableAudios(epRes.data.availableAudios);
        }

        // Fetch anime details and related list (franchise content)
        const detailRes = await axiosInstance.get(`/api/anime/${slug}`);
        const animeData = detailRes.data.anime;
        setAnimeDetail(animeData);

        if (animeData.hasHindi !== undefined) {
          setHasHindi(Boolean(animeData.hasHindi));
        }
        if (animeData.hasDub !== undefined) {
          setHasDub(Boolean(animeData.hasDub));
        }
        if (animeData.hasSub !== undefined) {
          setHasSub(Boolean(animeData.hasSub));
        }
        if (animeData.isMultiAudio !== undefined) {
          setIsMultiAudio(Boolean(animeData.isMultiAudio));
        }
        if (animeData.availableAudios) {
          setAvailableAudios(animeData.availableAudios);
        }

        let defaultTranslation: 'sub' | 'dub' | 'hindi' = 'sub';
        if (animeData.hasSub === false && animeData.hasDub) {
          defaultTranslation = 'dub';
        }
        setActiveTranslation((prev) => {
          if (prev === 'hindi' && (epHasHindi || animeData.hasHindi)) return 'hindi';
          if (prev === 'dub' && (epHasDub && animeData.hasDub !== false)) return 'dub';
          if (prev === 'sub' && (epHasSub && animeData.hasSub !== false)) return 'sub';
          return defaultTranslation;
        });
        setEpisodesList(detailRes.data.anime.episodes || []);
        setRelatedList(detailRes.data.related || []);
        setSeasons(detailRes.data.seasons || []);

        // Fetch watchlist status only if logged in
        const savedToken = localStorage.getItem('bankai_token');
        if (savedToken) {
          try {
            const watchRes = await axiosInstance.get(`/api/watchlist/status/${detailRes.data.anime.id}`);
            setInWatchlist(watchRes.data.inWatchlist);
          } catch (e) {
            // Ignore if unauthenticated
          }
        }
      } catch (err) {
        console.error('Error fetching watch page data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchData();
  }, [slug, epNum]);

  // Load streaming iframe source link dynamically from the backend scraping API
  useEffect(() => {
    const fetchEpisodeSource = async () => {
      if (!slug || !epNum) return;
      try {
        const response = await axiosInstance.get(`/api/anime/${slug}/episodes/${epNum}/sources`, {
          params: {
            server: activeServer,
            lang: activeTranslation
          }
        });
        
        let url = response.data.embedUrl || '';
        if (response.data.servers && response.data.servers.length > 0) {
          setAvailableServers(response.data.servers);
        }
        if (response.data.serversByAudio) {
          setServersByAudio(response.data.serversByAudio);
        }
        if (response.data.availableAudios) {
          setAvailableAudios(response.data.availableAudios);
        }
        if (response.data.isMultiAudio !== undefined) {
          setIsMultiAudio(response.data.isMultiAudio);
        }
        if (response.data.hasDub !== undefined) {
          setHasDub(response.data.hasDub);
        }
        if (response.data.hasHindi !== undefined) {
          setHasHindi(response.data.hasHindi);
        }
        if (response.data.hasSub !== undefined) {
          setHasSub(response.data.hasSub);
        }
        
        // Append playback settings locally for the resolved url
        if (url) {
          const params: string[] = [];
          if (autoPlay) params.push('autoplay=1');
          if (autoSkip) params.push('autoskip=1');
          if (params.length > 0) {
            url += (url.includes('?') ? '&' : '?') + params.join('&');
          }
        }
        setEmbedUrl(url);

        // Seamlessly sync activeServer if backend selected the primary working server for this audio
        if (response.data.server && response.data.server !== activeServer) {
          setActiveServer(response.data.server);
        }
        if (response.data.lang && response.data.lang !== activeTranslation) {
          setActiveTranslation(response.data.lang);
        }
      } catch (err) {
        console.error('Error fetching episode dynamic source:', err);
      }
    };

    fetchEpisodeSource();
  }, [slug, epNum, activeServer, activeTranslation, autoPlay, autoSkip]);

  const handleNextEpisode = () => {
    if (hasNext && slug && epNum) {
      navigate(`/watch/${slug}/episode/${parseInt(epNum) + 1}`);
    }
  };

  const handlePrevEpisode = () => {
    if (hasPrev && slug && epNum) {
      navigate(`/watch/${slug}/episode/${parseInt(epNum) - 1}`);
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
    <div className="app-container" style={{ padding: '16px 20px', color: 'var(--text-main)', position: 'relative' }}>

      {/* THEATER LIGHTS OFF DARK BLANKET */}
      {lightsOff && (
        <div
          onClick={() => setLightsOff(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.92)', zIndex: 999, cursor: 'pointer', transition: 'all 0.3s ease' }}
        />
      )}

      {/* BREADCRUMB NAVIGATION */}
      <div className="nm-breadcrumb" style={{ marginBottom: '18px' }}>
        <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s', fontWeight: 600 }}>Home</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <Link to={`/anime/${animeDetail.slug}`} style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s', fontWeight: 600 }}>{animeName}</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span style={{ color: 'var(--color-primary)', fontWeight: 800, background: 'var(--bg-surface-recessed)', padding: '2px 10px', borderRadius: '6px', border: 'var(--border-nm)' }}>Episode {epNum}</span>
      </div>

      {/* THEATER MAIN SCREEN BOX (2-COLUMN LAYOUT) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isExpanded ? '1fr' : '330px 1fr',
          gap: '24px',
          alignItems: 'stretch',
          marginBottom: '26px',
          position: 'relative',
          zIndex: lightsOff ? 1000 : 1
        }}
        className="watch-theater-split"
      >

        {/* COLUMN 1: SIDEBAR (LEFT) - EPISODES (STRETCHED TO MATCH ROW HEIGHT) */}
        {!isExpanded && (
          <div className="nm-card watch-episodes-column" style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '540px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="section-indicator" style={{ height: '18px', width: '4px', margin: 0 }} />
                Episodes
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-surface-recessed)', padding: '2px 8px', borderRadius: '6px' }}>
                  {filteredEpisodes.length}
                </span>
              </h3>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <select
                  value={activeTranslationFilter}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setActiveTranslationFilter(val);
                    if (val === 'hindi') {
                      setActiveTranslation('hindi');
                      setActiveServer('vidsrc');
                    } else if (val === 'dub') {
                      setActiveTranslation('dub');
                      setActiveServer('vidsrc');
                    } else if (val === 'sub') {
                      setActiveTranslation('sub');
                      setActiveServer('vidsrc');
                    }
                  }}
                  style={{ background: 'var(--bg-surface-recessed)', boxShadow: 'var(--nm-inset)', border: 'var(--border-nm)', color: 'var(--text-main)', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', outline: 'none', cursor: 'pointer', fontWeight: 700 }}
                >
                  {isMultiAudio ? (
                    <>
                      <option value="sub_dub" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>All Audio</option>
                      {hasSub && <option value="sub" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>Sub (JP)</option>}
                      {hasDub && <option value="dub" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>Dub (EN)</option>}
                      {hasHindi && <option value="hindi" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>Hindi (HI)</option>}
                    </>
                  ) : (
                    <option value="sub" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                      {hasDub && !hasSub ? 'Dub (EN)' : 'Sub (JP)'}
                    </option>
                  )}
                </select>

                {episodesList.length > 100 && (
                  <select
                    value={selectedRange ? `${selectedRange.start}-${selectedRange.end}` : ''}
                    onChange={(e) => {
                      const [start, end] = e.target.value.split('-').map(Number);
                      setSelectedRange({ start, end });
                    }}
                    style={{ width: '80px', background: 'var(--bg-surface-recessed)', boxShadow: 'var(--nm-inset)', border: 'var(--border-nm)', color: 'var(--text-main)', borderRadius: '8px', padding: '6px 8px', fontSize: '11px', outline: 'none', cursor: 'pointer', fontWeight: 700 }}
                  >
                    {ranges.map((r, idx) => (
                      <option key={idx} value={`${r.start}-${r.end}`} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>{r.label}</option>
                    ))}
                  </select>
                )}

                <input
                  type="text"
                  placeholder="Find"
                  value={episodeSearch}
                  onChange={(e) => setEpisodeSearch(e.target.value)}
                  style={{ width: '56px', background: 'var(--bg-surface-recessed)', boxShadow: 'var(--nm-inset)', border: 'var(--border-nm)', borderRadius: '8px', padding: '6px 8px', fontSize: '11px', color: 'var(--text-main)', outline: 'none', fontWeight: 600 }}
                />
              </div>
            </div>

            {/* Episode buttons in a 6-column grid with tactile neumorphic buttons */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gridAutoRows: '36px',
                gap: '8px',
                overflowY: 'auto',
                paddingRight: '4px',
                flex: 1,
                alignContent: 'start',
                maxHeight: '480px'
              }}
              className="no-scrollbar"
            >
              {filteredEpisodes.map((ep) => {
                const isActive = ep.episodeNumber === parseInt(epNum || '1');
                const isWatched = watchedEpisodes.includes(ep.episodeNumber);

                return (
                  <Link
                    key={ep.id}
                    to={`/watch/${slug}/episode/${ep.episodeNumber}`}
                    className={`nm-episode-btn ${isActive ? 'active' : ''} ${isWatched && !isActive ? 'watched' : ''}`}
                    title={`Episode ${ep.episodeNumber}`}
                  >
                    {ep.episodeNumber}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* COLUMN 2: VIDEO PLAYER + SETTINGS CONTROL PANEL (RIGHT) */}
        <div className="watch-player-column" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>

          {/* Top banner notice - Inset Neumorphic pill */}
          <div style={{ background: 'var(--bg-surface-recessed)', boxShadow: 'var(--nm-inset)', border: 'var(--border-nm)', borderRadius: '12px', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Info size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span>Free anime streaming in full HD. If a stream loads slowly, switch mirrors below.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="live-ping-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Server Active</span>
            </div>
          </div>

          {/* Video Player Container - Neumorphic Cinema Bezel with Header Bar */}
          <div className="nm-player-bezel">
            {/* Player Mini Top Control Bar */}
            <div style={{ background: 'var(--bg-surface-elevated)', borderBottom: 'var(--border-nm)', padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{animeName}</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>• Episode {epNum}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  Active Mirror: <strong style={{ color: 'var(--text-main)' }}>{availableServers.find(s => s.id === activeServer)?.name || 'AnimeStream Ultra HD'}</strong>
                </span>
                <button
                  onClick={switchToNextServer}
                  className="nm-pill"
                  style={{ border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '5px 12px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  title="Switch to next server mirror"
                >
                  <RefreshCw size={11} style={{ color: 'var(--color-primary)' }} /> Next Mirror
                </button>
              </div>
            </div>

            <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', background: '#000' }}>
              {embedUrl ? (
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allowFullScreen
                  title={`${activeServer} Player`}
                  referrerPolicy="no-referrer"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  onError={() => {
                    switchToNextServer();
                  }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '14px', background: '#09080d' }}>
                  Loading stream sources...
                </div>
              )}
            </div>
          </div>

          {/* Sub-player Control Settings Bar - Neumorphic Card */}
          <div className="nm-card" style={{ padding: '14px 22px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', borderRadius: '16px' }}>

            {/* Playback helpers */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '18px', fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>

              <button
                onClick={() => setIsExpanded(prev => !prev)}
                className="nm-pill"
                style={{ border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, padding: '7px 16px' }}
              >
                <Tv size={14} style={{ color: 'var(--color-primary)' }} /> {isExpanded ? 'Shrink' : 'Expand'}
              </button>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)' }}>
                <input type="checkbox" checked={autoPlay} onChange={(e) => setAutoPlay(e.target.checked)} style={{ accentColor: 'var(--color-primary)', cursor: 'pointer' }} />
                <span>Auto Play</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)' }}>
                <input type="checkbox" checked={autoNext} onChange={(e) => setAutoNext(e.target.checked)} style={{ accentColor: 'var(--color-primary)', cursor: 'pointer' }} />
                <span>Auto Next</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  background: '#f59e0b',
                  color: '#000000',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontWeight: 800,
                  fontSize: '12px',
                  boxShadow: '0 2px 10px rgba(245, 158, 11, 0.45)'
                }}
              >
                <input type="checkbox" checked={autoSkip} onChange={(e) => setAutoSkip(e.target.checked)} style={{ accentColor: '#000', cursor: 'pointer' }} />
                <span>Auto Skip</span>
              </label>

              <button
                onClick={() => setLightsOff(prev => !prev)}
                className="nm-pill"
                style={{ border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, padding: '7px 16px' }}
              >
                <Lightbulb size={14} style={{ fill: lightsOff ? '#fff' : 'none' }} /> Light
              </button>
            </div>

            {/* Skip arrows and report triggers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', color: 'var(--text-main)', fontWeight: 700 }}>

              {/* Prev / Next */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handlePrevEpisode}
                  disabled={!hasPrev}
                  className="nm-pill"
                  style={{ color: hasPrev ? 'var(--text-main)' : 'var(--text-muted)', cursor: hasPrev ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 700, padding: '7px 16px' }}
                >
                  ◀ Prev
                </button>
                <button
                  onClick={handleNextEpisode}
                  disabled={!hasNext}
                  className="nm-pill"
                  style={{ color: hasNext ? 'var(--text-main)' : 'var(--text-muted)', cursor: hasNext ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 700, padding: '7px 16px' }}
                >
                  Next ▶
                </button>
              </div>

              <span style={{ color: 'var(--border-color-soft)' }}>|</span>

              <button 
                className="nm-pill"
                style={{ color: 'var(--text-main)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, padding: '7px 14px' }}
              >
                <AlertTriangle size={14} style={{ color: '#f59e0b' }} /> Report
              </button>

              <button
                onClick={toggleWatchlist}
                className="nm-pill"
                style={{ color: inWatchlist ? 'var(--color-primary)' : 'var(--text-main)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, padding: '7px 16px' }}
              >
                {inWatchlist ? <Check size={14} style={{ color: 'var(--color-primary)' }} /> : <Plus size={14} />} Add to list
              </button>
            </div>
          </div>

          {/* Translation Toggles & High-Performance Streaming Servers Bar */}
          <div className="nm-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px', alignItems: 'stretch' }}>

            {/* Active Audio Mode Indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--border-color-soft)', paddingBottom: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>Active Audio Track:</span>
                <span className="nm-pill" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 800,
                  fontSize: '12px',
                  padding: '5px 14px',
                  color: activeTranslation === 'hindi' ? '#fbbf24' : activeTranslation === 'dub' ? '#22d3ee' : 'var(--color-primary)',
                  border: `1px solid ${activeTranslation === 'hindi' ? 'rgba(251, 191, 36, 0.4)' : activeTranslation === 'dub' ? 'rgba(34, 211, 238, 0.4)' : 'rgba(139, 92, 246, 0.4)'}`
                }}>
                  {activeTranslation === 'hindi' ? '🇮🇳 Hindi Dubbed' : activeTranslation === 'dub' ? '🎙️ English Dubbed' : '🇯🇵 Japanese (CC SUB)'}
                </span>
                {isMultiAudio ? (
                  <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    Multi-Audio ({availableAudios.map(a => a.toUpperCase()).join(' / ')})
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--color-primary)', background: 'var(--bg-surface-recessed)', border: 'var(--border-nm)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    Single Audio ({availableAudios[0]?.toUpperCase() || 'SUB'})
                  </span>
                )}
              </div>
              <span style={{ color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600 }}>
                ⚡ Click any server below for immediate smooth playback
              </span>
            </div>

            {/* If Single Audio Anime: Show clean single audio server list only */}
            {!isMultiAudio ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
                    This anime is available in single audio ({hasDub && !hasSub ? 'English Dubbed' : 'Japanese with English Subtitles'}). Select a streaming server:
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                  <div
                    className="nm-pill"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      padding: '8px 18px',
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#fff',
                      minWidth: '84px',
                      justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(139, 92, 246, 0.65)'
                    }}
                  >
                    <span style={{ fontSize: '10px', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '3px', padding: '0 3px', lineHeight: '1.2' }}>CC</span>
                    {hasDub && !hasSub ? 'DUB' : 'SUB'}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {(serversByAudio[activeTranslation] || (availableServers.length > 0 ? availableServers : DEFAULT_FALLBACK_SERVERS)).map((s: ServerSource) => {
                      const isSelected = activeServer === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            setActiveServer(s.id);
                            if (s.embedUrl) setEmbedUrl(s.embedUrl);
                          }}
                          className={`nm-server-pill ${isSelected ? 'active' : ''}`}
                        >
                          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: isSelected ? '#fff' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Play size={8} style={{ fill: isSelected ? '#7c3aed' : '#fff', color: isSelected ? '#7c3aed' : '#fff', marginLeft: '1px' }} />
                          </div>
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* If Multi Audio Anime: Show distinct audio-wise server panels (SUB, DUB, HINDI) */
              <>
                {/* SUB servers group */}
                {hasSub && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        setActiveTranslation('sub');
                        const subList: ServerSource[] = serversByAudio.sub || availableServers;
                        if (subList.length > 0) {
                          const targetServer = subList.find(s => s.id === activeServer) || subList[0];
                          setActiveServer(targetServer.id);
                          if (targetServer.embedUrl) setEmbedUrl(targetServer.embedUrl);
                        }
                      }}
                      className="nm-pill"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: activeTranslation === 'sub' ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' : 'var(--bg-surface-elevated)',
                        border: activeTranslation === 'sub' ? '1px solid rgba(255,255,255,0.3)' : 'var(--border-nm)',
                        padding: '8px 18px',
                        fontSize: '12px',
                        fontWeight: 800,
                        color: activeTranslation === 'sub' ? '#fff' : 'var(--text-main)',
                        minWidth: '84px',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: activeTranslation === 'sub' ? 'var(--nm-primary-btn)' : 'var(--nm-convex-btn)'
                      }}
                      title="Switch to Japanese Audio with Subtitles"
                    >
                      <span style={{ fontSize: '10px', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '3px', padding: '0 3px', lineHeight: '1.2' }}>CC</span>
                      SUB
                    </button>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {(serversByAudio.sub || (activeTranslation === 'sub' && availableServers.length > 0 ? availableServers : DEFAULT_FALLBACK_SERVERS)).map((s: ServerSource) => {
                        const isSelected = activeTranslation === 'sub' && activeServer === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => {
                              setActiveTranslation('sub');
                              setActiveServer(s.id);
                              if (s.embedUrl) setEmbedUrl(s.embedUrl);
                            }}
                            className={`nm-server-pill ${isSelected ? 'active' : ''}`}
                          >
                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: isSelected ? '#fff' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Play size={8} style={{ fill: isSelected ? 'var(--color-primary-dark)' : 'var(--text-main)', color: isSelected ? 'var(--color-primary-dark)' : 'var(--text-main)', marginLeft: '1px' }} />
                            </div>
                            {s.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* DUB servers group - ONLY rendered if anime has English dub */}
                {hasDub && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        setActiveTranslation('dub');
                        const dubList: ServerSource[] = serversByAudio.dub || availableServers;
                        if (dubList.length > 0) {
                          const targetServer = dubList.find(s => s.id === activeServer) || dubList[0];
                          setActiveServer(targetServer.id);
                          if (targetServer.embedUrl) setEmbedUrl(targetServer.embedUrl);
                        }
                      }}
                      className="nm-pill"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: activeTranslation === 'dub' ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' : 'var(--bg-surface-elevated)',
                        border: activeTranslation === 'dub' ? '1px solid rgba(255,255,255,0.3)' : 'var(--border-nm)',
                        padding: '8px 18px',
                        fontSize: '12px',
                        fontWeight: 800,
                        color: activeTranslation === 'dub' ? '#fff' : 'var(--text-main)',
                        minWidth: '84px',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: activeTranslation === 'dub' ? '0 4px 16px rgba(6, 182, 212, 0.65)' : 'var(--nm-convex-btn)'
                      }}
                      title="Switch to English Dubbed Audio"
                    >
                      <span style={{ fontSize: '12px' }}>🎙️</span>
                      DUB
                    </button>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {(serversByAudio.dub || (activeTranslation === 'dub' && availableServers.length > 0 ? availableServers : DEFAULT_FALLBACK_SERVERS)).map((s: ServerSource) => {
                        const isSelected = activeTranslation === 'dub' && activeServer === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => {
                              setActiveTranslation('dub');
                              setActiveServer(s.id);
                              if (s.embedUrl) setEmbedUrl(s.embedUrl);
                            }}
                            className={`nm-server-pill ${isSelected ? 'active' : ''}`}
                            style={isSelected ? { background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', boxShadow: '0 4px 16px rgba(6, 182, 212, 0.65)' } : {}}
                          >
                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: isSelected ? '#fff' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Play size={8} style={{ fill: isSelected ? '#0891b2' : 'var(--text-main)', color: isSelected ? '#0891b2' : 'var(--text-main)', marginLeft: '1px' }} />
                            </div>
                            {s.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* HINDI Dubbed servers group - ONLY rendered if anime has Hindi audio */}
                {hasHindi && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
                    <button
                      onClick={() => {
                        setActiveTranslation('hindi');
                        const hindiList: ServerSource[] = serversByAudio.hindi || availableServers;
                        if (hindiList.length > 0) {
                          const targetServer = hindiList.find(s => s.id === activeServer) || hindiList[0];
                          setActiveServer(targetServer.id);
                          if (targetServer.embedUrl) setEmbedUrl(targetServer.embedUrl);
                        }
                      }}
                      className="nm-pill"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: activeTranslation === 'hindi' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'var(--bg-surface-elevated)',
                        border: activeTranslation === 'hindi' ? '1px solid rgba(255,255,255,0.3)' : 'var(--border-nm)',
                        padding: '8px 18px',
                        fontSize: '12px',
                        fontWeight: 800,
                        color: activeTranslation === 'hindi' ? '#fff' : 'var(--text-main)',
                        minWidth: '84px',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: activeTranslation === 'hindi' ? '0 4px 16px rgba(245, 158, 11, 0.65)' : 'var(--nm-convex-btn)'
                      }}
                      title="Switch to Hindi Dubbed Audio"
                    >
                      <span style={{ fontSize: '12px' }}>🇮🇳</span>
                      HINDI
                    </button>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {(serversByAudio.hindi || (activeTranslation === 'hindi' && availableServers.length > 0 ? availableServers : DEFAULT_FALLBACK_SERVERS)).map((s: ServerSource) => {
                        const isSelected = activeTranslation === 'hindi' && activeServer === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => {
                              setActiveTranslation('hindi');
                              setActiveServer(s.id);
                              if (s.embedUrl) setEmbedUrl(s.embedUrl);
                            }}
                            className={`nm-server-pill ${isSelected ? 'active' : ''}`}
                            style={isSelected ? { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 4px 16px rgba(245, 158, 11, 0.65)' } : {}}
                          >
                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: isSelected ? '#fff' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Play size={8} style={{ fill: isSelected ? '#d97706' : '#fff', color: isSelected ? '#d97706' : '#fff', marginLeft: '1px' }} />
                            </div>
                            {s.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* RELATED RECOMMENDATIONS (HORIZONTAL BELOW PLAYER ON RIGHT COLUMN) */}
          {!isExpanded && (
            <div
              className="nm-card"
              style={{
                borderRadius: '20px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                marginTop: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color-soft)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="section-indicator" />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
                    Related Anime
                  </h3>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>More ▾</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '14px',
                  overflowX: 'auto',
                  paddingBottom: '8px'
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
                    <div
                      style={{
                        width: '110px',
                        height: '155px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: 'var(--border-nm)',
                        boxShadow: 'var(--nm-flat)',
                        position: 'relative'
                      }}
                    >
                      <img
                        src={item.posterImage}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80';
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          background: 'rgba(13, 15, 24, 0.85)',
                          backdropFilter: 'blur(8px)',
                          boxShadow: 'var(--nm-pill)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          padding: '2px 6px',
                          borderRadius: '9999px',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#fbbf24',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        ⭐ {item.score.toFixed(1)}
                      </div>
                    </div>
                    <h4
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-main)',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.3',
                        minHeight: '32px',
                        transition: 'color 0.2s ease'
                      }}
                      className="related-title-text"
                    >
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
          className="nm-card details-mini-card"
          style={{
            borderRadius: '24px',
            padding: '28px',
            display: 'flex',
            gap: '28px',
            flexWrap: 'wrap'
          }}
        >
          {/* Left Sub-Panel: Poster and Quick Info list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '210px' }}>
            <div
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: 'var(--nm-hero-frame)',
                border: '1px solid rgba(139, 92, 246, 0.25)'
              }}
            >
              <img
                src={animeDetail.posterImage}
                alt={animeName}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';
                }}
                style={{ width: '100%', height: '290px', objectFit: 'cover', display: 'block' }}
              />
            </div>

            {/* Quick Stats in Neumorphic Inset Well */}
            <div
              style={{
                background: 'var(--bg-surface-recessed)',
                boxShadow: 'var(--nm-inset)',
                borderRadius: '16px',
                padding: '16px',
                border: 'var(--border-nm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <span className="section-indicator" />
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-main)' }}>
                  Quick Stats
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Type:</span><span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{animeDetail.type}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Status:</span><span style={{ fontWeight: 700, color: '#22d3ee' }}>{animeDetail.status}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Studio:</span><span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{animeDetail.studio || 'Unknown'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Duration:</span><span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{animeDetail.duration || '24 min'}</span></div>
              </div>
            </div>
          </div>

          {/* Right Sub-Panel: widescreen banner and synopsis details */}
          <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* 4K HD widescreen banner with Neumorphic Bezel */}
            {animeDetail.bannerImage && (
              <div
                style={{
                  width: '100%',
                  height: '160px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  boxShadow: 'var(--nm-hero-frame)',
                  position: 'relative'
                }}
              >
                <img
                  src={animeDetail.bannerImage}
                  alt={animeName}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80';
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(13, 15, 24, 0.8))' }} />
              </div>
            )}

            <div>
              <h2 style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '10px', lineHeight: '1.2', color: 'var(--text-main)' }}>
                <Link to={`/anime/${animeDetail.slug}`} style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.2s ease' }} className="mini-card-title-link">
                  {animeName}
                </Link>
              </h2>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
                {animeDetail.hasSub !== false && (
                  <span className="nm-tag" style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--color-primary)', borderColor: 'rgba(139, 92, 246, 0.4)', fontWeight: 800 }}>SUB</span>
                )}
                {animeDetail.hasDub !== false && (
                  <span className="nm-tag" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee', borderColor: 'rgba(6, 182, 212, 0.4)', fontWeight: 800 }}>DUB</span>
                )}
                {hasHindi && (
                  <span className="nm-tag" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)', fontWeight: 800 }}>🇮🇳 HINDI</span>
                )}
                <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginLeft: '6px', fontWeight: 600 }}>
                  • Released: <strong style={{ color: 'var(--text-main)' }}>{animeDetail.releasedYear || 'Unknown'}</strong> • Rating: <strong style={{ color: '#fbbf24' }}>{animeDetail.score ? `⭐ ${animeDetail.score.toFixed(1)}` : 'N/A'}</strong>
                </span>
              </div>

              {/* Seasons Switcher Section */}
              {seasons.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', borderTop: '1px solid var(--border-color-soft)', paddingTop: '14px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Seasons & Movies:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {seasons.map((s: any) => {
                      const isActive = s.slug === animeDetail.slug;
                      return (
                        <button
                          key={s.slug}
                          onClick={() => !isActive && navigate(`/watch/${s.slug}/episode/1`)}
                          className={isActive ? 'nm-btn-primary' : 'nm-pill season-switch-btn'}
                          style={{
                            padding: '8px 18px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: isActive ? 800 : 700,
                            cursor: isActive ? 'default' : 'pointer'
                          }}
                        >
                          {s.type === 'MOVIE' ? `🎬 Movie: ${s.title}` : `Season ${s.seasonNumber}: ${s.title}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color-soft)', paddingTop: '14px' }}>
              <h4 style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '8px', fontWeight: 800 }}>Synopsis</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.8' }}>
                {animeDetail.description}
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto', paddingTop: '12px' }}>
              {animeDetail.genres.split(',').map((genre) => (
                <span key={genre} className="nm-tag">
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
          .watch-theater-split {
            display: flex !important;
            flex-direction: column !important;
          }
          .watch-player-column {
            order: 1 !important;
            width: 100% !important;
          }
          .watch-episodes-column {
            order: 2 !important;
            width: 100% !important;
            min-height: auto !important;
            max-height: 480px !important;
          }
          .details-mini-card { flex-direction: column !important; }
          .details-mini-card > div { width: 100% !important; }
        }
      `}</style>
    </div>
  );
};
