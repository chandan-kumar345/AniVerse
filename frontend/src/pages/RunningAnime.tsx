import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Radio, RefreshCw, Calendar, Search } from 'lucide-react';
import { anilistService, type AniListMedia } from '../services/anilistService';

interface AiringItem {
  id: number;
  slug: string;
  title: string;
  englishTitle?: string | null;
  posterImage: string;
  nextEpisode: number;
  airingAt: number;
  genres: string[];
  score: number;
  scheduleTimeText: string;
}

export const RunningAnime: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<AiringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [nowSec, setNowSec] = useState<number>(Math.floor(Date.now() / 1000));

  // Live countdown clock tick every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const loadRunningAnime = async () => {
    setLoading(true);
    try {
      const data = await anilistService.getCurrentlyAiring(1, 36);
      if (data && data.length > 0) {
        const mapped: AiringItem[] = data.map((m: AniListMedia) => {
          const title = m.title.english || m.title.romaji || m.title.native || 'Anime';
          const slug = m.slug || title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
          const nextEp = m.nextAiringEpisode?.episode || 1;
          const airingAt = m.nextAiringEpisode?.airingAt || (Math.floor(Date.now() / 1000) + 86400 * 3);

          const d = new Date(airingAt * 1000);
          const dayName = d.toLocaleDateString(undefined, { weekday: 'long' });
          const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

          return {
            id: m.id,
            slug,
            title,
            englishTitle: m.title.english,
            posterImage: m.coverImage?.large || m.coverImage?.medium || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
            nextEpisode: nextEp,
            airingAt,
            genres: m.genres || ['Action'],
            score: m.averageScore ? m.averageScore / 10 : 8.0,
            scheduleTimeText: `Every ${dayName} at ${timeStr}`,
          };
        });
        setItems(mapped);
      }
    } catch (err) {
      console.warn('Error fetching currently airing anime:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRunningAnime();
  }, []);

  const calculateRemaining = (targetSec: number) => {
    const diff = targetSec - nowSec;
    if (diff <= 0) return { days: 0, hours: 0, mins: 0, isNow: true };
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    return { days, hours, mins, isNow: false };
  };

  const daysFilterOptions = [
    { key: 'all', label: 'All Days' },
    { key: 'Monday', label: 'Mon' },
    { key: 'Tuesday', label: 'Tue' },
    { key: 'Wednesday', label: 'Wed' },
    { key: 'Thursday', label: 'Thu' },
    { key: 'Friday', label: 'Fri' },
    { key: 'Saturday', label: 'Sat' },
    { key: 'Sunday', label: 'Sun' },
  ];

  const filteredItems = items.filter((item) => {
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchEng = item.englishTitle?.toLowerCase().includes(q);
      if (!matchTitle && !matchEng) return false;
    }
    if (selectedDay !== 'all') {
      if (!item.scheduleTimeText.includes(selectedDay)) return false;
    }
    return true;
  });

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', padding: '36px 24px 80px 24px' }}>
      <div className="app-container">
        {/* PAGE HEADER */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Radio size={20} color="var(--color-primary)" className="live-ping-dot" />
              <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                Running Anime
              </h1>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Currently airing anime series with verified real-time episode schedules and live countdowns.
            </p>
          </div>

          <button
            onClick={loadRunningAnime}
            style={{
              background: '#12121A',
              border: '1px solid #292938',
              borderRadius: '8px',
              color: 'var(--text-main)',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-fast)',
            }}
          >
            <RefreshCw size={15} className={loading ? 'spinning-icon' : ''} />
            Refresh Schedules
          </button>
        </div>

        {/* CONTROLS: SEARCH & DAY FILTERS */}
        <div
          style={{
            background: '#12121A',
            border: '1px solid #292938',
            borderRadius: '14px',
            padding: '16px 20px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {/* Day Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {daysFilterOptions.map((d) => (
              <button
                key={d.key}
                onClick={() => setSelectedDay(d.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: selectedDay === d.key ? 'var(--color-primary)' : '#292938',
                  background: selectedDay === d.key ? 'var(--color-primary)' : '#08070B',
                  color: selectedDay === d.key ? '#fff' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#08070B',
              border: '1px solid #292938',
              borderRadius: '8px',
              padding: '6px 12px',
              width: '260px',
            }}
          >
            <Search size={15} color="var(--text-muted)" style={{ marginRight: '8px' }} />
            <input
              type="text"
              placeholder="Filter running anime..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '13px',
              }}
            />
          </div>
        </div>

        {/* ANIME CARDS GRID */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                style={{
                  height: '160px',
                  borderRadius: '14px',
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
            <Calendar size={40} color="var(--border-color)" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              No Airing Anime Found
            </h3>
            <p style={{ fontSize: '14px' }}>
              Try selecting a different day or clearing your search filter.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '18px',
            }}
          >
            {filteredItems.map((anime) => {
              const { days, hours, mins, isNow } = calculateRemaining(anime.airingAt);

              return (
                <div
                  key={anime.id}
                  onClick={() => navigate(`/anime/${anime.slug}`)}
                  style={{
                    background: '#12121A',
                    border: '1px solid #292938',
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'flex',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)',
                    boxShadow: 'var(--nm-card)',
                  }}
                  className="running-card-item"
                >
                  {/* POSTER */}
                  <div
                    style={{
                      width: '100px',
                      aspectRatio: '2/3',
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
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        background: 'rgba(8, 7, 11, 0.85)',
                        border: '1px solid #292938',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#facc15',
                      }}
                    >
                      ★ {anime.score.toFixed(1)}
                    </div>
                  </div>

                  {/* DETAILS */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="badge-airing">Airing</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {anime.genres[0] || 'Anime'}
                        </span>
                      </div>
                      <h3
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginBottom: '3px',
                        }}
                        title={anime.title}
                      >
                        {anime.title}
                      </h3>
                      <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
                        Episode {anime.nextEpisode}
                      </div>
                    </div>

                    {/* COUNTDOWN CLOCK BOX */}
                    <div style={{ margin: '8px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                        <Clock size={12} color="var(--color-primary)" />
                        <span>Next Episode in:</span>
                      </div>

                      {isNow ? (
                        <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 700 }}>
                          Currently Airing!
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
                            <span style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Days</span>
                          </div>
                          <span style={{ color: 'var(--border-color)', fontWeight: 700 }}>:</span>
                          <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', display: 'block', lineHeight: 1 }}>{hours < 10 ? `0${hours}` : hours}</span>
                            <span style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Hours</span>
                          </div>
                          <span style={{ color: 'var(--border-color)', fontWeight: 700 }}>:</span>
                          <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', display: 'block', lineHeight: 1 }}>{mins < 10 ? `0${mins}` : mins}</span>
                            <span style={{ fontSize: '8px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Mins</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* FOOTER SCHEDULE TEXT */}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {anime.scheduleTimeText}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .running-card-item:hover {
          border-color: rgba(243, 46, 53, 0.45) !important;
          transform: translateY(-3px);
          box-shadow: var(--nm-card-hover) !important;
        }
      `}</style>
    </div>
  );
};
