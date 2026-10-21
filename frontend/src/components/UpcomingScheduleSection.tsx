import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Calendar, ExternalLink } from 'lucide-react';
import { anilistService, type AiringScheduleItem } from '../services/anilistService';

interface DayOption {
  key: string;
  label: string;
  subLabel?: string;
  timestampStart: number;
  timestampEnd: number;
}

export const UpcomingScheduleSection: React.FC = () => {
  const navigate = useNavigate();
  const [dayOptions, setDayOptions] = useState<DayOption[]>([]);
  const [selectedDayKey, setSelectedDayKey] = useState<string>('today');
  const [scheduleItems, setScheduleItems] = useState<AiringScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate dynamic 7-day selector pills starting from Today
  useEffect(() => {
    const days: DayOption[] = [];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const target = new Date(now);
      target.setDate(now.getDate() + i);

      // Start of day
      const start = new Date(target);
      start.setHours(0, 0, 0, 0);
      const startSec = Math.floor(start.getTime() / 1000);

      // End of day
      const end = new Date(target);
      end.setHours(23, 59, 59, 999);
      const endSec = Math.floor(end.getTime() / 1000);

      const dayName = target.toLocaleDateString(undefined, { weekday: 'short' });
      const monthDay = target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      let label = '';
      if (i === 0) label = 'Today';
      else if (i === 1) label = 'Tomorrow';
      else label = `${dayName} ${monthDay}`;

      const key = i === 0 ? 'today' : (i === 1 ? 'tomorrow' : `day-${i}`);
      days.push({
        key,
        label,
        timestampStart: startSec,
        timestampEnd: endSec,
      });
    }

    setDayOptions(days);
  }, []);

  // Fetch airing schedule whenever selected day changes
  useEffect(() => {
    const activeOption = dayOptions.find((d) => d.key === selectedDayKey);
    if (!activeOption) return;

    let isMounted = true;
    setLoading(true);

    const fetchDaySchedule = async () => {
      try {
        const items = await anilistService.getAiringSchedule(
          activeOption.timestampStart,
          activeOption.timestampEnd,
          1,
          20
        );

        if (isMounted) {
          // Sort chronologically by airingAt
          const sorted = (items || []).sort((a, b) => a.airingAt - b.airingAt);
          setScheduleItems(sorted);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch AniList schedule for day, using fallback:', err);
      }

      if (isMounted) {
        // Fallback curated schedule items if network fails or offline
        const fallback: AiringScheduleItem[] = [
          {
            id: 1,
            airingAt: activeOption.timestampStart + 3600 * 9 + 1800, // 09:30 AM
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
            id: 2,
            airingAt: activeOption.timestampStart + 3600 * 18 + 1800, // 06:30 PM
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
            id: 3,
            airingAt: activeOption.timestampStart + 3600 * 20, // 08:00 PM
            episode: 10,
            media: {
              id: 101922,
              title: { english: 'Demon Slayer: Kimetsu no Yaiba', romaji: 'Kimetsu no Yaiba' },
              coverImage: { large: 'https://image.tmdb.org/t/p/original/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg' },
              format: 'TV',
              genres: ['Action', 'Fantasy', 'Supernatural'],
              averageScore: 86,
            },
          },
          {
            id: 4,
            airingAt: activeOption.timestampStart + 3600 * 23, // 11:00 PM
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

    fetchDaySchedule();
    return () => {
      isMounted = false;
    };
  }, [selectedDayKey, dayOptions]);

  const formatScheduleTime = (timestampSec: number) => {
    const d = new Date(timestampSec * 1000);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '48px' }}>
      {/* SECTION HEADER ROW */}
      <div className="section-header-row">
        <div className="section-title-wrap">
          <div className="section-accent-bar" />
          <h2 className="section-title">Upcoming Episode Schedule</h2>
          <span className="section-subtitle">Never miss your favorite anime</span>
        </div>
        <Link to="/schedule" className="section-see-all">
          See Full Schedule &rarr;
        </Link>
      </div>

      {/* DAY SELECTOR PILLS */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          paddingBottom: '16px',
        }}
      >
        {dayOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSelectedDayKey(opt.key)}
            className={`day-pill ${selectedDayKey === opt.key ? 'active' : ''}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* SCHEDULE CARDS GRID */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px', marginTop: '10px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: '84px',
                borderRadius: '12px',
                background: '#12121A',
                border: '1px solid #292938',
                animation: 'pulse 1.5s infinite',
              }}
            />
          ))}
        </div>
      ) : scheduleItems.length === 0 ? (
        <div
          style={{
            background: '#12121A',
            border: '1px solid #292938',
            borderRadius: '12px',
            padding: '36px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            marginTop: '10px',
          }}
        >
          <Calendar size={32} color="var(--border-color)" style={{ marginBottom: '8px' }} />
          <p style={{ fontSize: '14px' }}>No scheduled episodes available for this day.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '14px',
            marginTop: '8px',
          }}
        >
          {scheduleItems.slice(0, 8).map((item) => {
            const anime = item.media;
            const title = anime.title.english || anime.title.romaji || 'Anime';
            const slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            const timeStr = formatScheduleTime(item.airingAt);
            const isReleased = item.airingAt <= Math.floor(Date.now() / 1000);

            return (
              <div
                key={item.id}
                onClick={() => navigate(`/anime/${slug}`)}
                style={{
                  background: '#12121A',
                  border: '1px solid #292938',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                  boxShadow: 'var(--nm-card)',
                }}
                className="schedule-item-card"
              >
                {/* POSTER */}
                <div
                  style={{
                    width: '48px',
                    height: '64px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid #292938',
                  }}
                >
                  <img
                    src={anime.coverImage?.large || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=160'}
                    alt={title}
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* DETAILS */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: '3px',
                    }}
                    title={title}
                  >
                    {title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '4px' }}>
                    Episode {item.episode}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <Clock size={12} color="var(--text-muted)" />
                    <span>{timeStr}</span>
                    {isReleased ? (
                      <span style={{ color: '#10b981', fontWeight: 700, marginLeft: '4px' }}>• Available</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>• Scheduled</span>
                    )}
                  </div>
                </div>

                {/* ARROW */}
                <ExternalLink size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .schedule-item-card:hover {
          border-color: rgba(243, 46, 53, 0.4) !important;
          transform: translateY(-2px);
          box-shadow: var(--nm-card-hover) !important;
        }
      `}</style>
    </div>
  );
};
