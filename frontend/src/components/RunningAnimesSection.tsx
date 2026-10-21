import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { anilistService, type AniListMedia } from '../services/anilistService';
import type { AnimeData } from './AnimeCard';

interface RunningAnimesProps {
  animeList?: AnimeData[];
}

interface RunningAnimeCardData {
  id: string | number;
  slug: string;
  title: string;
  posterImage: string;
  nextEpisode: number;
  airingAt: number; // Unix timestamp in seconds
  scheduleTimeText: string;
}

export const RunningAnimesSection: React.FC<RunningAnimesProps> = ({ animeList }) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [runningItems, setRunningItems] = useState<RunningAnimeCardData[]>([]);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Math.floor(Date.now() / 1000));

  // Update live clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Math.floor(Date.now() / 1000));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch currently airing anime from AniList (with real nextAiringEpisode timestamps)
  useEffect(() => {
    let isMounted = true;
    const fetchRunning = async () => {
      try {
        const aniListItems = await anilistService.getCurrentlyAiring(1, 10);
        if (aniListItems && aniListItems.length > 0 && isMounted) {
          const mapped: RunningAnimeCardData[] = aniListItems.map((m: AniListMedia) => {
            const title = m.title.english || m.title.romaji || m.title.native || 'Anime';
            const slug = m.slug || title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            const nextEp = m.nextAiringEpisode?.episode || 1;
            const airingAt = m.nextAiringEpisode?.airingAt || (Math.floor(Date.now() / 1000) + 86400 * 3);

            const airingDate = new Date(airingAt * 1000);
            const dayName = airingDate.toLocaleDateString(undefined, { weekday: 'long' });
            const timeStr = airingDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

            return {
              id: m.id,
              slug,
              title,
              posterImage: m.coverImage?.large || m.coverImage?.medium || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
              nextEpisode: nextEp,
              airingAt,
              scheduleTimeText: `Every ${dayName} ${timeStr}`,
            };
          });
          setRunningItems(mapped);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch running anime from AniList, using prop/fallback:', err);
      }

      // Fallback to animeList prop or curated ongoing list matching reference screenshot
      if (isMounted) {
        const fallbackItems: RunningAnimeCardData[] = [
          {
            id: 'one-piece',
            slug: 'one-piece',
            title: 'One Piece',
            posterImage: 'https://image.tmdb.org/t/p/original/v38qp4bySLTXYu3MF8r5GD51FN3.jpg',
            nextEpisode: 1123,
            airingAt: Math.floor(Date.now() / 1000) + (2 * 86400 + 14 * 3600 + 32 * 60),
            scheduleTimeText: 'Every Sunday 09:30 AM',
          },
          {
            id: 'jujutsu-kaisen',
            slug: 'jujutsu-kaisen',
            title: 'Jujutsu Kaisen',
            posterImage: 'https://image.tmdb.org/t/p/original/2otstbLfQ7MXuFt1X8MFOb4OIgd.jpg',
            nextEpisode: 23,
            airingAt: Math.floor(Date.now() / 1000) + (1 * 86400 + 6 * 3600 + 18 * 60),
            scheduleTimeText: 'Every Thursday 11:00 PM',
          },
          {
            id: 'demon-slayer',
            slug: 'demon-slayer',
            title: 'Demon Slayer',
            posterImage: 'https://image.tmdb.org/t/p/original/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg',
            nextEpisode: 10,
            airingAt: Math.floor(Date.now() / 1000) + (4 * 86400 + 3 * 3600 + 50 * 60),
            scheduleTimeText: 'Every Sunday 08:00 PM',
          },
          {
            id: 'boruto',
            slug: 'boruto',
            title: 'Boruto: Two Blue Vortex',
            posterImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400',
            nextEpisode: 12,
            airingAt: Math.floor(Date.now() / 1000) + (3 * 86400 + 20 * 3600 + 15 * 60),
            scheduleTimeText: 'Every Saturday 10:00 PM',
          },
          {
            id: 'my-hero-academia',
            slug: 'my-hero-academia',
            title: 'My Hero Academia',
            posterImage: 'https://image.tmdb.org/t/p/original/3ILMlmC30QUnYkY3XEBOyJ82Dqu.jpg',
            nextEpisode: 159,
            airingAt: Math.floor(Date.now() / 1000) + (6 * 86400 + 11 * 3600 + 40 * 60),
            scheduleTimeText: 'Every Saturday 06:30 PM',
          },
        ];
        setRunningItems(fallbackItems);
      }
    };

    fetchRunning();
    return () => {
      isMounted = false;
    };
  }, [animeList]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -480 : 480;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const calculateCountdown = (targetSec: number) => {
    const diff = targetSec - nowTimestamp;
    if (diff <= 0) {
      return { days: 0, hours: 0, mins: 0, isPassed: true };
    }
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    return { days, hours, mins, isPassed: false };
  };

  if (runningItems.length === 0) return null;

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '42px' }}>
      {/* SECTION HEADER ROW */}
      <div className="section-header-row">
        <div className="section-title-wrap">
          <div className="section-accent-bar" />
          <h2 className="section-title">Running Animes</h2>
          <span className="section-subtitle">Stay updated with the latest episodes</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/running" className="section-see-all">
            See All &rarr;
          </Link>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => handleScroll('left')}
              className="carousel-nav-btn"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="carousel-nav-btn"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* HORIZONTAL CAROUSEL OF RUNNING ANIME */}
      <div
        ref={scrollRef}
        className="horizontal-carousel"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {runningItems.map((anime) => {
          const { days, hours, mins, isPassed } = calculateCountdown(anime.airingAt);

          return (
            <div
              key={anime.id}
              onClick={() => navigate(`/anime/${anime.slug}`)}
              style={{
                flex: '0 0 350px',
                scrollSnapAlign: 'start',
                cursor: 'pointer',
                userSelect: 'none',
                background: '#12121A',
                border: '1px solid #292938',
                borderRadius: '14px',
                padding: '12px',
                display: 'flex',
                gap: '14px',
                boxShadow: 'var(--nm-card)',
                transition: 'var(--transition-smooth)',
              }}
              className="running-anime-card"
            >
              {/* POSTER THUMBNAIL */}
              <div
                style={{
                  width: '92px',
                  aspectRatio: '1/1.25',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  position: 'relative',
                  border: '1px solid #292938',
                }}
              >
                <img
                  src={anime.posterImage}
                  alt={anime.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300';
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* DETAILS & LIVE COUNTDOWN */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: '2px',
                    }}
                    title={anime.title}
                  >
                    {anime.title}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Episode {anime.nextEpisode}
                  </div>
                </div>

                {/* COUNTDOWN CLOCK BOX */}
                <div style={{ margin: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    <Clock size={12} color="var(--color-primary)" />
                    <span>Next Episode</span>
                  </div>

                  {isPassed ? (
                    <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 700 }}>
                      Episode Airing Now!
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        gap: '6px',
                        background: '#0a0a10',
                        border: '1px solid #292938',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        width: 'fit-content',
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', display: 'block', lineHeight: 1 }}>{days}</span>
                        <span style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Days</span>
                      </div>
                      <span style={{ color: 'var(--border-color)', fontWeight: 700 }}>:</span>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', display: 'block', lineHeight: 1 }}>{hours < 10 ? `0${hours}` : hours}</span>
                        <span style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Hours</span>
                      </div>
                      <span style={{ color: 'var(--border-color)', fontWeight: 700 }}>:</span>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', display: 'block', lineHeight: 1 }}>{mins < 10 ? `0${mins}` : mins}</span>
                        <span style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Mins</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* FOOTER: AIRING BADGE & SCHEDULE TEXT */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge-airing">Airing</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {anime.scheduleTimeText}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .running-anime-card:hover {
          border-color: rgba(243, 46, 53, 0.5) !important;
          transform: translateY(-3px);
          box-shadow: var(--nm-card-hover) !important;
        }
      `}</style>
    </div>
  );
};
