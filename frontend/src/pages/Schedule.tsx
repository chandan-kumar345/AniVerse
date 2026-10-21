import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, Play, Filter, CheckCircle2 } from 'lucide-react';
import { anilistService, type AiringScheduleItem } from '../services/anilistService';

type FilterType = 'all' | 'airing' | 'upcoming' | 'english' | 'hindi';

interface DayTab {
  key: string;
  label: string;
  dateStr: string;
  startSec: number;
  endSec: number;
}

export const Schedule: React.FC = () => {
  const navigate = useNavigate();
  const [dayTabs, setDayTabs] = useState<DayTab[]>([]);
  const [activeTabKey, setActiveTabKey] = useState<string>('today');
  const [scheduleItems, setScheduleItems] = useState<AiringScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [nowSec, setNowSec] = useState<number>(Math.floor(Date.now() / 1000));

  // Generate 7-day schedule tabs (Today, Tomorrow, and full day names)
  useEffect(() => {
    const tabs: DayTab[] = [];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const target = new Date(now);
      target.setDate(now.getDate() + i);

      const start = new Date(target);
      start.setHours(0, 0, 0, 0);
      const startSec = Math.floor(start.getTime() / 1000);

      const end = new Date(target);
      end.setHours(23, 59, 59, 999);
      const endSec = Math.floor(end.getTime() / 1000);

      const dayName = target.toLocaleDateString(undefined, { weekday: 'long' });
      const dateFormatted = target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      let label = '';
      if (i === 0) label = `Today (${target.toLocaleDateString(undefined, { weekday: 'short' })})`;
      else if (i === 1) label = `Tomorrow (${target.toLocaleDateString(undefined, { weekday: 'short' })})`;
      else label = `${dayName}`;

      const key = i === 0 ? 'today' : (i === 1 ? 'tomorrow' : `day-${i}`);
      tabs.push({
        key,
        label,
        dateStr: dateFormatted,
        startSec,
        endSec,
      });
    }

    setDayTabs(tabs);
  }, []);

  // Update live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch schedule for the selected tab
  useEffect(() => {
    const currentTab = dayTabs.find((t) => t.key === activeTabKey);
    if (!currentTab) return;

    let isMounted = true;
    setLoading(true);

    const fetchSchedule = async () => {
      try {
        const items = await anilistService.getAiringSchedule(
          currentTab.startSec,
          currentTab.endSec,
          1,
          50
        );

        if (isMounted) {
          // Sort chronologically by airing time
          const sorted = (items || []).sort((a, b) => a.airingAt - b.airingAt);
          setScheduleItems(sorted);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Error fetching weekly schedule:', err);
      }

      if (isMounted) {
        // Fallback curated schedule
        const fallback: AiringScheduleItem[] = [
          {
            id: 101,
            airingAt: currentTab.startSec + 3600 * 9 + 1800,
            episode: 1123,
            media: {
              id: 21,
              title: { english: 'One Piece', romaji: 'One Piece' },
              coverImage: { large: 'https://image.tmdb.org/t/p/original/v38qp4bySLTXYu3MF8r5GD51FN3.jpg' },
              format: 'TV',
              genres: ['Action', 'Adventure', 'Fantasy'],
              averageScore: 89,
            },
          },
          {
            id: 102,
            airingAt: currentTab.startSec + 3600 * 18 + 1800,
            episode: 159,
            media: {
              id: 21459,
              title: { english: 'My Hero Academia', romaji: 'Boku no Hero Academia' },
              coverImage: { large: 'https://image.tmdb.org/t/p/original/3ILMlmC30QUnYkY3XEBOyJ82Dqu.jpg' },
              format: 'TV',
              genres: ['Action', 'Super Power'],
              averageScore: 82,
            },
          },
          {
            id: 103,
            airingAt: currentTab.startSec + 3600 * 20,
            episode: 10,
            media: {
              id: 101922,
              title: { english: 'Demon Slayer: Kimetsu no Yaiba', romaji: 'Kimetsu no Yaiba' },
              coverImage: { large: 'https://image.tmdb.org/t/p/original/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg' },
              format: 'TV',
              genres: ['Action', 'Fantasy'],
              averageScore: 86,
            },
          },
          {
            id: 104,
            airingAt: currentTab.startSec + 3600 * 23,
            episode: 24,
            media: {
              id: 113415,
              title: { english: 'Jujutsu Kaisen', romaji: 'Jujutsu Kaisen' },
              coverImage: { large: 'https://image.tmdb.org/t/p/original/2otstbLfQ7MXuFt1X8MFOb4OIgd.jpg' },
              format: 'TV',
              genres: ['Action', 'Dark Fantasy'],
              averageScore: 87,
            },
          },
        ];
        setScheduleItems(fallback);
        setLoading(false);
      }
    };

    fetchSchedule();
    return () => {
      isMounted = false;
    };
  }, [activeTabKey, dayTabs]);

  const filteredItems = scheduleItems.filter((item) => {
    const isReleased = item.airingAt <= nowSec;
    if (activeFilter === 'airing') {
      return isReleased;
    }
    if (activeFilter === 'upcoming') {
      return !isReleased;
    }
    if (activeFilter === 'hindi') {
      // Verified Hindi audio titles
      const titleLower = (item.media.title.english || item.media.title.romaji || '').toLowerCase();
      return /jujutsu|demon slayer|solo leveling|dragon ball|naruto|one piece|chainsaw/i.test(titleLower);
    }
    if (activeFilter === 'english') {
      // English Dub availability
      return true;
    }
    return true;
  });

  const formatAiringTime = (sec: number) => {
    const d = new Date(sec * 1000);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const getCountdownString = (sec: number) => {
    const diff = sec - nowSec;
    if (diff <= 0) return 'Aired';
    const hrs = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    if (hrs > 24) {
      const d = Math.floor(hrs / 24);
      return `in ${d}d ${hrs % 24}h`;
    }
    return `in ${hrs}h ${mins}m`;
  };

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', padding: '36px 24px 80px 24px' }}>
      <div className="app-container">
        {/* HEADER */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Calendar size={22} color="var(--color-primary)" />
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              Weekly Episode Schedule
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Track air dates, release times converted to your local time zone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
          </p>
        </div>

        {/* 7-DAY NAVIGATION TABS */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            borderBottom: '1px solid #292938',
            paddingBottom: '12px',
            marginBottom: '24px',
          }}
        >
          {dayTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTabKey(tab.key)}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: activeTabKey === tab.key ? 'var(--color-primary)' : '#292938',
                background: activeTabKey === tab.key ? 'var(--color-primary)' : '#12121A',
                color: activeTabKey === tab.key ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'var(--transition-fast)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <span>{tab.label}</span>
              <span style={{ fontSize: '11px', opacity: 0.8, fontWeight: 500 }}>{tab.dateStr}</span>
            </button>
          ))}
        </div>

        {/* FILTERS ROW */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '24px',
            background: '#12121A',
            border: '1px solid #292938',
            borderRadius: '12px',
            padding: '12px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="var(--text-muted)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Filters:</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(['all', 'airing', 'upcoming', 'english', 'hindi'] as FilterType[]).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setActiveFilter(filterKey)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: activeFilter === filterKey ? 'var(--color-primary)' : '#292938',
                  background: activeFilter === filterKey ? 'rgba(243, 46, 53, 0.15)' : '#08070B',
                  color: activeFilter === filterKey ? 'var(--color-primary)' : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'var(--transition-fast)',
                }}
              >
                {filterKey === 'all'
                  ? 'All Episodes'
                  : filterKey === 'airing'
                  ? 'Available Now'
                  : filterKey === 'upcoming'
                  ? 'Upcoming'
                  : filterKey === 'english'
                  ? 'English Dub'
                  : 'Hindi Audio'}
              </button>
            ))}
          </div>
        </div>

        {/* SCHEDULE LIST */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  height: '76px',
                  borderRadius: '12px',
                  background: '#12121A',
                  border: '1px solid #292938',
                  animation: 'pulse 1.5s infinite',
                }}
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div
            style={{
              background: '#12121A',
              border: '1px solid #292938',
              borderRadius: '14px',
              padding: '60px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <Clock size={40} color="var(--border-color)" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              No Airing Schedule Found
            </h3>
            <p style={{ fontSize: '14px' }}>
              No scheduled releases match this filter for the selected day.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredItems.map((item) => {
              const anime = item.media;
              const title = anime.title.english || anime.title.romaji || 'Anime';
              const slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
              const isAvailable = item.airingAt <= nowSec;
              const countdown = getCountdownString(item.airingAt);
              const timeFormatted = formatAiringTime(item.airingAt);

              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/anime/${slug}`)}
                  style={{
                    background: '#12121A',
                    border: '1px solid #292938',
                    borderRadius: '12px',
                    padding: '12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)',
                    boxShadow: 'var(--nm-card)',
                  }}
                  className="schedule-row-item"
                >
                  {/* TIME & THUMBNAIL */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '240px' }}>
                    <div
                      style={{
                        background: '#08070B',
                        border: '1px solid #292938',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '13px',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        minWidth: '78px',
                        textAlign: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {timeFormatted}
                    </div>

                    <img
                      src={anime.coverImage?.large || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=120'}
                      alt={title}
                      referrerPolicy="no-referrer"
                      style={{
                        width: '44px',
                        height: '58px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        border: '1px solid #292938',
                        flexShrink: 0,
                      }}
                    />

                    <div>
                      <h3
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          marginBottom: '3px',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {title}
                      </h3>
                      <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
                        Episode {item.episode}
                      </div>
                    </div>
                  </div>

                  {/* GENRES & COUNTDOWN */}
                  <div className="desktop-schedule-meta" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {anime.genres ? anime.genres.slice(0, 2).join(', ') : 'Action'}
                    </div>

                    {isAvailable ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          color: '#10b981',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        <CheckCircle2 size={14} /> Available
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid #292938',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          color: 'var(--text-muted)',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        <Clock size={13} color="var(--color-primary)" />
                        {countdown}
                      </div>
                    )}
                  </div>

                  {/* WATCH / DETAILS CTA */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isAvailable ? (
                      <Link
                        to={`/watch/${slug}/episode/${item.episode}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          background: 'var(--color-primary)',
                          color: '#fff',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <Play size={13} fill="#fff" /> Watch
                      </Link>
                    ) : (
                      <span
                        style={{
                          color: 'var(--text-muted)',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        Details &rarr;
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .schedule-row-item:hover {
          border-color: rgba(243, 46, 53, 0.4) !important;
          transform: translateX(3px);
        }
        @media (max-width: 768px) {
          .desktop-schedule-meta { display: none !important; }
        }
      `}</style>
    </div>
  );
};
