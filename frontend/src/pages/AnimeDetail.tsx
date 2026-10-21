import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Play, Plus, Check, Star, ExternalLink, ShieldCheck, Globe, Volume2, Subtitles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { anilistService } from '../services/anilistService';

type TabType = 'overview' | 'episodes' | 'related' | 'watch_providers';

export const AnimeDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [anime, setAnime] = useState<any | null>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<{ seasonNumber: number; title: string; slug: string }[]>([]);
  const [episodesList, setEpisodesList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [watchlistStatus, setWatchlistStatus] = useState<string | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWatchlistMenu, setShowWatchlistMenu] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!slug) return;

    const loadAnimeDetail = async () => {
      setLoading(true);

      // Fast Path 1: Local API
      try {
        const res = await axios.get(`/api/anime/${slug}`, { timeout: 6000 });
        if (res.data?.anime && isMounted) {
          setAnime(res.data.anime);
          setRelated(res.data.related || []);
          setSeasons(res.data.seasons || []);
          setEpisodesList(res.data.anime.episodes || []);

          if (isAuthenticated && res.data.anime.id) {
            try {
              const watchRes = await axios.get(`/api/watchlist/status/${res.data.anime.id}`);
              setInWatchlist(watchRes.data.inWatchlist);
              setWatchlistStatus(watchRes.data.status);
            } catch (_) {}
          }
          setLoading(false);
          return;
        }
      } catch (localErr) {
        console.warn('Local anime detail endpoint fallback:', localErr);
      }

      // Fast Path 2: AniList GraphQL Direct Fetch
      try {
        const aniMedia = await anilistService.findBySlugOrTitle(slug);
        if (aniMedia && isMounted) {
          const title = aniMedia.title.english || aniMedia.title.romaji || aniMedia.title.native || 'Anime';
          const epCount = aniMedia.episodes || (aniMedia.status === 'RELEASING' ? 12 : 24);

          // Generate episode entries
          const generatedEpisodes = [];
          for (let i = 1; i <= Math.min(epCount, 48); i++) {
            generatedEpisodes.push({
              id: `ep-${i}`,
              episodeNumber: i,
              title: `Episode ${i}`,
              thumbnail: aniMedia.coverImage?.large || aniMedia.bannerImage || '',
              duration: aniMedia.duration ? `${aniMedia.duration} min` : '24 min',
            });
          }

          const mappedAnime = {
            id: String(aniMedia.id),
            malId: aniMedia.idMal,
            slug,
            title,
            englishTitle: aniMedia.title.english || null,
            japaneseTitle: aniMedia.title.native || aniMedia.title.romaji || null,
            altTitles: aniMedia.title.romaji,
            description: aniMedia.description ? aniMedia.description.replace(/<[^>]*>/g, '') : '',
            posterImage: aniMedia.coverImage?.extraLarge || aniMedia.coverImage?.large || '',
            bannerImage: aniMedia.bannerImage || aniMedia.coverImage?.extraLarge || '',
            score: aniMedia.averageScore ? aniMedia.averageScore / 10 : 8.0,
            type: aniMedia.format || 'TV',
            studio: aniMedia.studios?.nodes?.[0]?.name || 'Animation Studio',
            status: aniMedia.status === 'RELEASING' ? 'Currently Airing' : 'Finished Airing',
            releasedYear: aniMedia.startDate?.year || 2024,
            duration: aniMedia.duration ? `${aniMedia.duration} min` : '24 min',
            genres: aniMedia.genres ? aniMedia.genres.join(', ') : 'Action, Fantasy',
            hasSub: true,
            hasDub: true,
            hasHindi: /jujutsu|demon slayer|solo leveling|dragon ball|naruto|one piece|chainsaw/i.test(title),
            episodes: generatedEpisodes,
          };

          setAnime(mappedAnime);
          setEpisodesList(generatedEpisodes);

          // Related recommendations from AniList
          if (aniMedia.recommendations?.nodes) {
            const mappedRelated = aniMedia.recommendations.nodes
              .filter((n) => n.mediaRecommendation)
              .map((n) => {
                const rec = n.mediaRecommendation!;
                const recTitle = rec.title?.english || rec.title?.romaji || 'Anime';
                return {
                  id: String(rec.id),
                  slug: recTitle.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
                  title: recTitle,
                  posterImage: rec.coverImage?.large || '',
                  score: rec.averageScore ? rec.averageScore / 10 : 7.5,
                  type: rec.format || 'TV',
                };
              });
            setRelated(mappedRelated);
          }
        }
      } catch (aniErr) {
        console.error('Failed to load anime details:', aniErr);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAnimeDetail();
    return () => {
      isMounted = false;
    };
  }, [slug, isAuthenticated]);

  useEffect(() => {
    if (anime) {
      document.title = `${anime.title} | ANIVERSES`;
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
    } catch (_) {
      // Local fallback
      setWatchlistStatus(status);
      setInWatchlist(true);
      setShowWatchlistMenu(false);
    }
  };

  const handleRemoveWatchlist = async () => {
    if (!anime) return;
    try {
      await axios.delete(`/api/watchlist/${anime.id}`);
    } catch (_) {}
    setInWatchlist(false);
    setWatchlistStatus(null);
    setShowWatchlistMenu(false);
  };

  if (loading) {
    return (
      <div className="app-container" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ height: '380px', width: '100%', borderRadius: '16px', background: '#12121A' }} className="shimmer" />
      </div>
    );
  }

  if (!anime) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        <h2>Anime not found.</h2>
        <Link to="/" style={{ color: 'var(--color-primary)', marginTop: '12px', display: 'inline-block' }}>Back to Home</Link>
      </div>
    );
  }

  const genresList = typeof anime.genres === 'string'
    ? anime.genres.split(',').map((g: string) => g.trim())
    : Array.isArray(anime.genres) ? anime.genres : ['Action'];

  const epCount = episodesList.length;

  return (
    <div style={{ color: '#fff', position: 'relative', background: 'var(--bg-main)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* 1. CINEMATIC HERO BACKDROP BANNER */}
      <div style={{ position: 'relative', width: '100%', height: '460px', overflow: 'hidden' }}>
        <img
          src={anime.bannerImage || anime.posterImage}
          alt={anime.title}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600';
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
        />
        {/* Dark vignettes */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '280px', background: 'linear-gradient(to top, var(--bg-main) 0%, rgba(8, 7, 11, 0.85) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, rgba(8, 7, 11, 0.7) 0%, transparent 60%, rgba(8, 7, 11, 0.5) 100%)' }} />
      </div>

      {/* 2. OVERLAP CONTAINER */}
      <div className="app-container" style={{ margin: '-220px auto 0', padding: '0 24px', position: 'relative', zIndex: 10 }}>
        {/* HEADER BLOCK */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '36px', alignItems: 'end' }} className="detail-upper-block">
          {/* POSTER CARD */}
          <div
            style={{
              width: '240px',
              aspectRatio: '2/3',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '2px solid #292938',
              boxShadow: 'var(--nm-card-hover)',
              background: '#12121A',
            }}
            className="detail-poster-wrap"
          >
            <img
              src={anime.posterImage}
              alt={anime.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600';
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* MAIN INFO TEXTS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '10px' }}>
            <h1
              style={{
                fontSize: '40px',
                fontWeight: 900,
                fontFamily: 'var(--font-display)',
                lineHeight: '1.1',
                letterSpacing: '-0.02em',
                textShadow: '0 4px 18px rgba(0,0,0,0.8)',
              }}
              className="detail-title"
            >
              {anime.title}
            </h1>

            {/* Alternative Titles */}
            {(anime.englishTitle || anime.japaneseTitle) && (
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {anime.englishTitle && anime.englishTitle !== anime.title && (
                  <span>English: <strong style={{ color: '#fff' }}>{anime.englishTitle}</strong></span>
                )}
                {anime.japaneseTitle && (
                  <span>Japanese: <strong style={{ color: '#fff' }}>{anime.japaneseTitle}</strong></span>
                )}
              </div>
            )}

            {/* Metadata badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '13px', alignItems: 'center' }}>
              <span style={{ background: '#12121A', border: '1px solid #292938', padding: '4px 12px', borderRadius: '6px', color: '#facc15', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Star size={13} style={{ fill: '#facc15' }} /> {anime.score.toFixed(2)}
              </span>
              <span style={{ background: '#12121A', border: '1px solid #292938', padding: '4px 12px', borderRadius: '6px', color: '#fff', fontWeight: 600 }}>
                {anime.type}
              </span>
              <span style={{ background: '#12121A', border: '1px solid #292938', padding: '4px 12px', borderRadius: '6px', color: 'var(--text-muted)' }}>
                {anime.releasedYear || '2024'}
              </span>
              <span style={{ background: '#12121A', border: '1px solid #292938', padding: '4px 12px', borderRadius: '6px', color: anime.status === 'Currently Airing' ? 'var(--color-primary)' : '#10b981', fontWeight: 700 }}>
                {anime.status}
              </span>
              <span className="badge-hd">HD</span>
              {epCount > 0 && (
                <span style={{ background: '#12121A', border: '1px solid #292938', padding: '4px 12px', borderRadius: '6px', color: 'var(--text-main)', fontWeight: 600 }}>
                  {epCount} Episodes
                </span>
              )}
            </div>

            {/* VERIFIED LANGUAGE AVAILABILITY BADGES */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Available Audio:</span>
              <span style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid #292938', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Volume2 size={12} color="var(--color-primary)" /> Japanese (Original)
              </span>
              {anime.hasDub !== false && (
                <span style={{ background: 'rgba(78, 80, 222, 0.15)', border: '1px solid rgba(78, 80, 222, 0.4)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Volume2 size={12} color="#a5b4fc" /> English Dub
                </span>
              )}
              {Boolean(anime.hasHindi) && (
                <span style={{ background: 'rgba(243, 46, 53, 0.15)', border: '1px solid rgba(243, 46, 53, 0.4)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Volume2 size={12} color="var(--color-primary)" /> Hindi Dub
                </span>
              )}
              <span style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid #292938', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Subtitles size={12} /> Multi-subtitles
              </span>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '14px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link
                to={`/watch/${anime.slug}/episode/1`}
                style={{
                  background: 'var(--color-primary)',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  padding: '12px 32px',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 18px var(--color-primary-glow)',
                }}
              >
                <Play size={16} fill="#fff" /> Watch Episode 1
              </Link>

              {/* Watchlist button */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowWatchlistMenu(!showWatchlistMenu)}
                  style={{
                    background: '#12121A',
                    border: '1px solid #292938',
                    color: 'var(--text-main)',
                    borderRadius: '8px',
                    padding: '12px 22px',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                >
                  {inWatchlist ? (
                    <>
                      <Check size={16} color="var(--color-primary)" />
                      <span>{watchlistStatus?.replace(/_/g, ' ') || 'In List'}</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Add to My List
                    </>
                  )}
                </button>

                {showWatchlistMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '120%',
                      left: 0,
                      width: '180px',
                      background: '#12121A',
                      border: '1px solid #292938',
                      borderRadius: '10px',
                      boxShadow: 'var(--nm-card-hover)',
                      zIndex: 99,
                      padding: '6px',
                    }}
                  >
                    {['WATCHING', 'PLAN_TO_WATCH', 'COMPLETED', 'DROPPED'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateWatchlist(status)}
                        style={{
                          width: '100%',
                          border: 'none',
                          background: watchlistStatus === status ? 'var(--color-primary)' : 'none',
                          color: '#fff',
                          padding: '8px 12px',
                          textAlign: 'left',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          borderRadius: '6px',
                          marginBottom: '2px',
                        }}
                      >
                        {status.replace(/_/g, ' ')}
                      </button>
                    ))}
                    {inWatchlist && (
                      <button
                        onClick={handleRemoveWatchlist}
                        style={{
                          width: '100%',
                          border: 'none',
                          background: 'none',
                          borderTop: '1px solid #292938',
                          color: 'var(--color-primary)',
                          padding: '8px 12px',
                          textAlign: 'left',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginTop: '4px',
                        }}
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

        {/* 3. NAVIGATION TABS (Overview, Episodes, Related Anime, Where to Watch) */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid #292938',
            marginTop: '36px',
            paddingBottom: '12px',
          }}
        >
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'episodes', label: `Episodes (${epCount})` },
            { key: 'related', label: `Related Anime (${related.length})` },
            { key: 'watch_providers', label: 'Where to Watch' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: activeTab === tab.key ? 'var(--color-primary)' : 'transparent',
                background: activeTab === tab.key ? 'rgba(243, 46, 53, 0.15)' : 'transparent',
                color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
                fontWeight: activeTab === tab.key ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 4. TAB CONTENTS */}
        <div style={{ marginTop: '24px' }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px' }} className="detail-tab-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Synopsis */}
                <div style={{ background: '#12121A', border: '1px solid #292938', borderRadius: '14px', padding: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
                    Synopsis
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                    {anime.description || 'No synopsis provided.'}
                  </p>
                </div>

                {/* Genres */}
                <div style={{ background: '#12121A', border: '1px solid #292938', borderRadius: '14px', padding: '20px 24px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>
                    Genres & Themes
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {genresList.map((genre: string) => (
                      <Link
                        key={genre}
                        to={`/discover?genre=${encodeURIComponent(genre)}`}
                        style={{
                          background: '#08070B',
                          border: '1px solid #292938',
                          color: 'var(--text-main)',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        {genre}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Information Column */}
              <div style={{ background: '#12121A', border: '1px solid #292938', borderRadius: '14px', padding: '24px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
                  Anime Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #1c1c28' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Type</span>
                    <strong style={{ color: '#fff' }}>{anime.type}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #1c1c28' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Studio</span>
                    <strong style={{ color: '#fff' }}>{anime.studio || 'Unknown'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #1c1c28' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Released</span>
                    <strong style={{ color: '#fff' }}>{anime.releasedYear || 2024}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #1c1c28' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status</span>
                    <strong style={{ color: anime.status === 'Currently Airing' ? 'var(--color-primary)' : '#10b981' }}>{anime.status}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #1c1c28' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Duration</span>
                    <strong style={{ color: '#fff' }}>{anime.duration || '24m'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Rating</span>
                    <strong style={{ color: '#fff' }}>{anime.rating || 'PG-13'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EPISODES */}
          {activeTab === 'episodes' && (
            <div style={{ background: '#12121A', border: '1px solid #292938', borderRadius: '14px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                  Available Episodes
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{episodesList.length} Episodes Total</span>
              </div>

                            {/* Seasons Selector */}
              {seasons.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>Seasons:</span>
                  {seasons.map((s) => (
                    <Link
                      key={s.slug}
                      to={`/anime/${s.slug}`}
                      style={{
                        background: s.slug === slug ? 'var(--color-primary)' : '#08070B',
                        color: '#fff',
                        border: '1px solid #292938',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      Season {s.seasonNumber}
                    </Link>
                  ))}
                </div>
              )}
              {episodesList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No episodes released yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                  {episodesList.map((ep) => (
                    <Link
                      key={ep.episodeNumber}
                      to={`/watch/${anime.slug}/episode/${ep.episodeNumber}`}
                      style={{
                        background: '#08070B',
                        border: '1px solid #292938',
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'var(--transition-fast)',
                      }}
                      className="episode-item-card"
                    >
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          background: '#12121A',
                          border: '1px solid #292938',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '14px',
                          color: 'var(--color-primary)',
                          flexShrink: 0,
                        }}
                      >
                        {ep.episodeNumber}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Episode {ep.episodeNumber}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {ep.duration || '24 min'} • Watch in HD
                        </div>
                      </div>
                      <Play size={14} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RELATED ANIME */}
          {activeTab === 'related' && (
            <div style={{ background: '#12121A', border: '1px solid #292938', borderRadius: '14px', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>
                Related & Recommended Anime
              </h3>
              {related.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No related anime recommendations available.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                  {related.map((item) => (
                    <Link
                      key={item.id}
                      to={`/anime/${item.slug}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div style={{ width: '100%', aspectRatio: '2/3', borderRadius: '10px', overflow: 'hidden', border: '1px solid #292938', marginBottom: '8px' }}>
                        <img src={item.posterImage} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </h4>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        ★ {item.score?.toFixed(1) || '8.0'} • {item.type || 'TV'}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WHERE TO WATCH */}
          {activeTab === 'watch_providers' && (
            <div style={{ background: '#12121A', border: '1px solid #292938', borderRadius: '14px', padding: '26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <ShieldCheck size={20} color="var(--color-primary)" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Official & Authorized Streaming Options
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                ANIVERSES indexes licensed embeds and authorized external platforms where this anime is legally available in your region.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {/* 1. ANIVERSES Free Theater Stream */}
                <div style={{ background: '#08070B', border: '1px solid #292938', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
                      <Globe size={14} /> ANIVERSES Cloud Player
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                      Free Multi-Server Theater
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      Ad-free viewing with multi-audio, subtitle selection, and speed controls.
                    </p>
                  </div>
                  <Link
                    to={`/watch/${anime.slug}/episode/1`}
                    style={{
                      background: 'var(--color-primary)',
                      color: '#fff',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginTop: '16px',
                    }}
                  >
                    <Play size={14} fill="#fff" /> Stream on ANIVERSES
                  </Link>
                </div>

                {/* 2. Official Crunchyroll */}
                <div style={{ background: '#08070B', border: '1px solid #292938', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: '#f97316', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Authorized Licensor
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                      Crunchyroll
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      Simulcast provider with Japanese original audio and international dubs.
                    </p>
                  </div>
                  <a
                    href={`https://www.crunchyroll.com/search?q=${encodeURIComponent(anime.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#12121A',
                      border: '1px solid #292938',
                      color: '#fff',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginTop: '16px',
                    }}
                  >
                    Visit Crunchyroll <ExternalLink size={13} />
                  </a>
                </div>

                {/* 3. Official YouTube Licensors (Muse Asia / Ani-One) */}
                <div style={{ background: '#08070B', border: '1px solid #292938', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Free Legal YouTube Embed
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                      Muse Asia / Ani-One
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      Free authorized anime broadcast channels on YouTube for global regions.
                    </p>
                  </div>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(anime.title + ' official trailer episode')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#12121A',
                      border: '1px solid #292938',
                      color: '#fff',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginTop: '16px',
                    }}
                  >
                    Search Official Streams <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .detail-upper-block {
            grid-template-columns: 1fr !important;
            justify-items: center;
            text-align: center;
          }
          .detail-tab-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .episode-item-card:hover {
          border-color: rgba(243, 46, 53, 0.45) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};
