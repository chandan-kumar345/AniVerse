import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { AnimeData } from './AnimeCard';

interface EstimatedScheduleProps {
  animeList: AnimeData[];
}

interface ScheduleItem {
  time: string;
  anime: AnimeData;
  episodeNumber: number;
  airingAt: number;
}

export const EstimatedSchedule: React.FC<EstimatedScheduleProps> = ({ animeList }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDayOffset, setSelectedDayOffset] = useState(0); // Offset in days from today (-3 to +3)
  const [aniListSchedule, setAniListSchedule] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch AniList schedule for the current 7-day range
  useEffect(() => {
    const fetchAniListSchedule = async () => {
      try {
        setLoadingSchedule(true);
        // Get range for past 3 days and next 3 days
        const start = new Date();
        start.setDate(start.getDate() - 3);
        start.setHours(0, 0, 0, 0);
        const weekStart = Math.floor(start.getTime() / 1000);

        const end = new Date();
        end.setDate(end.getDate() + 3);
        end.setHours(23, 59, 59, 999);
        const weekEnd = Math.floor(end.getTime() / 1000);

        const response = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            query: `
              query ($weekStart: Int, $weekEnd: Int) {
                Page(page: 1, perPage: 150) {
                  airingSchedules(airingAt_greater: $weekStart, airingAt_less: $weekEnd, sort: TIME) {
                    id
                    airingAt
                    episode
                    media {
                      title {
                        romaji
                        english
                        native
                      }
                      coverImage {
                        large
                      }
                      type
                      format
                    }
                  }
                }
              }
            `,
            variables: { weekStart, weekEnd }
          })
        });

        const resJson = await response.json();
        const schedules = resJson.data?.Page?.airingSchedules || [];
        setAniListSchedule(schedules);
      } catch (err) {
        console.error('Error fetching airing schedules from AniList:', err);
      } finally {
        setLoadingSchedule(false);
      }
    };

    fetchAniListSchedule();
  }, []);

  // Format current live time
  const formatLiveTime = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  // Generate 7 days centered around today (-3 days to +3 days)
  const getDaysArray = () => {
    const days = [];
    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    for (let i = -3; i <= 3; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      days.push({
        offset: i,
        month: months[targetDate.getMonth()],
        dayNum: targetDate.getDate(),
        dayName: weekdays[targetDate.getDay()],
        fullDate: targetDate,
      });
    }
    return days;
  };

  const days = getDaysArray();

  // Get schedules grouped for the active day in IST/Local timezone
  const getScheduleForDay = (offset: number): ScheduleItem[] => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + offset);
    const targetDateStr = targetDate.toDateString(); // IST/local date representation

    // Filter schedules that fall on this local day
    const schedulesForDay = aniListSchedule.filter((item) => {
      const airingDate = new Date(item.airingAt * 1000);
      return airingDate.toDateString() === targetDateStr;
    });

    const scheduleItems: ScheduleItem[] = schedulesForDay.map((item) => {
      const airingDate = new Date(item.airingAt * 1000);
      const timeStr = airingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

      // Clean title helper
      const cleanTitle = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Try matching in local db
      const localMatch = animeList.find((local) => {
        const localT = cleanTitle(local.title);
        const romajiT = cleanTitle(item.media.title.romaji || '');
        const englishT = cleanTitle(item.media.title.english || '');
        return localT === romajiT || localT === englishT;
      });

      const anime: AnimeData = localMatch || {
        id: `anilist-${item.id}`,
        slug: `search?q=${encodeURIComponent(item.media.title.english || item.media.title.romaji)}`,
        title: item.media.title.english || item.media.title.romaji || item.media.title.native,
        englishTitle: item.media.title.english,
        description: 'Airing show synced live from AniList.',
        posterImage: item.media.coverImage.large,
        score: 7.8,
        type: item.media.format || item.media.type || 'TV',
        status: 'Currently Airing',
        releasedYear: airingDate.getFullYear(),
        genres: 'Currently Airing',
      };

      return {
        time: timeStr,
        anime,
        episodeNumber: item.episode,
        airingAt: item.airingAt,
      };
    });

    // Sort chronologically by airing timestamp
    scheduleItems.sort((a, b) => a.airingAt - b.airingAt);

    return scheduleItems;
  };

  const currentSchedule = getScheduleForDay(selectedDayOffset);

  const getCountdownString = (airingAt: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = airingAt - now;
    if (diff <= 0) return 'Released';

    const days = Math.floor(diff / (24 * 3600));
    const hours = Math.floor((diff / 3600) % 24);
    const minutes = Math.floor((diff / 60) % 60);
    const seconds = diff % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
  };

  const handlePrevDay = () => {
    if (selectedDayOffset > -3) {
      setSelectedDayOffset(prev => prev - 1);
    }
  };

  const handleNextDay = () => {
    if (selectedDayOffset < 3) {
      setSelectedDayOffset(prev => prev + 1);
    }
  };

  return (
    <div style={{ background: '#110e16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', margin: '10px 0 24px' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: '#fff' }}>
          Estimated Schedule <span style={{ color: 'var(--text-dark)', fontWeight: 500, fontSize: '14px', marginLeft: '6px' }}>- Now: {formatLiveTime(currentTime)}</span>
        </h2>
      </div>

      {/* DAYS SLIDER */}
      <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px', marginBottom: '24px' }}>
        
        {/* Prev Arrow */}
        <button 
          onClick={handlePrevDay} 
          disabled={selectedDayOffset === -3}
          style={{ background: 'none', border: 'none', color: selectedDayOffset === -3 ? 'var(--text-dark)' : '#fff', cursor: selectedDayOffset === -3 ? 'not-allowed' : 'pointer', padding: '10px', display: 'flex', alignItems: 'center', transition: 'var(--transition-fast)' }}
          className="sched-arrow-btn"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Days List */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', overflowX: 'auto', gap: '10px' }} className="no-scrollbar">
          {days.map((day) => {
            const isActive = day.offset === selectedDayOffset;
            const isToday = day.offset === 0;
            return (
              <button
                key={day.offset}
                onClick={() => setSelectedDayOffset(day.offset)}
                style={{
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 16px',
                  borderBottom: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                  color: isActive ? '#fff' : 'var(--text-dark)',
                  transition: 'var(--transition-fast)',
                  minWidth: '70px'
                }}
                className={`sched-day-tab ${isActive ? 'active' : ''}`}
              >
                <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px' }}>{day.month} {day.dayNum}</span>
                <span style={{ fontSize: '18px', fontWeight: isActive ? 800 : 600, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {day.dayName}
                  {isToday && <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--color-primary)', background: 'rgba(139, 92, 246, 0.15)', padding: '2px 4px', borderRadius: '3px', marginLeft: '2px' }}>TODAY</span>}
                </span>
              </button>
            );
          })}
        </div>

        {/* Next Arrow */}
        <button 
          onClick={handleNextDay} 
          disabled={selectedDayOffset === 3}
          style={{ background: 'none', border: 'none', color: selectedDayOffset === 3 ? 'var(--text-dark)' : '#fff', cursor: selectedDayOffset === 3 ? 'not-allowed' : 'pointer', padding: '10px', display: 'flex', alignItems: 'center', transition: 'var(--transition-fast)' }}
          className="sched-arrow-btn"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* SCHEDULE LIST ROWS */}
      {loadingSchedule ? (
        <div style={{ padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ border: '3px solid rgba(255,255,255,0.05)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', width: '24px', height: '24px', animation: 'spin 1s linear infinite' }} />
          <span>Synchronizing live schedule from AniList...</span>
        </div>
      ) : currentSchedule.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dark)' }}>
          No airing episodes scheduled for this day.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {currentSchedule.map((item, index) => {
            const isMockSearch = item.anime.slug.startsWith('search?q=');
            const detailUrl = isMockSearch ? `/${item.anime.slug}` : `/anime/${item.anime.slug}`;
            const watchUrl = isMockSearch ? `/${item.anime.slug}` : `/watch/${item.anime.slug}/episode/${item.episodeNumber}`;
            
            const isAired = item.airingAt <= Math.floor(Date.now() / 1000);
            const countdownText = getCountdownString(item.airingAt);
            
            return (
              <div 
                key={index} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '14px 16px', 
                  borderRadius: '8px', 
                  background: 'transparent', 
                  transition: 'var(--transition-fast)' 
                }} 
                className="schedule-row"
              >
                {/* Time Slot */}
                <div style={{ width: '100px', fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }} className="schedule-time">
                  {item.time}
                </div>

                {/* Anime Title Link */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', paddingRight: '20px' }}>
                  <Link 
                    to={detailUrl} 
                    style={{ textDecoration: 'none', color: '#fff', fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', textAlign: 'left', transition: 'var(--transition-fast)' }}
                    className="schedule-title-link"
                  >
                    {item.anime.title}
                  </Link>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    {item.anime.hasSub !== false && (
                      <span style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--color-primary)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '3px', padding: '1px 4px', fontSize: '9px', fontWeight: 700 }}>SUB</span>
                    )}
                    {item.anime.hasDub !== false && (
                      <span style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-teal)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '3px', padding: '1px 4px', fontSize: '9px', fontWeight: 700 }}>DUB</span>
                    )}
                  </div>
                  {!localMatchExists(item.anime) && (
                    <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '3px', padding: '1px 4px', color: 'var(--text-dark)', fontWeight: 500, flexShrink: 0 }}>Live Chart</span>
                  )}
                </div>

                {/* Episode Badge & Countdown Container */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '12px', color: isAired ? '#10b981' : '#a78bfa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="live-ping-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: isAired ? '#10b981' : '#a78bfa', display: 'inline-block' }} />
                    <span>{isAired ? 'Released' : `Airing in ${countdownText}`}</span>
                  </span>
                  <Link
                    to={watchUrl}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid rgba(255,255,255,0.05)', 
                      borderRadius: '20px', 
                      padding: '6px 14px', 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      color: 'var(--text-muted)', 
                      textDecoration: 'none',
                      transition: 'var(--transition-fast)'
                    }}
                    className="schedule-episode-badge"
                  >
                    <Play size={10} style={{ fill: 'currentColor' }} />
                    Episode {item.episodeNumber}
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .sched-arrow-btn:hover { color: var(--color-primary) !important; transform: scale(1.15); }
        .sched-day-tab:hover { color: #fff !important; }
        
        .schedule-row:hover { background: rgba(255, 255, 255, 0.02) !important; }
        .schedule-row:hover .schedule-time { color: var(--color-primary) !important; }
        .schedule-row:hover .schedule-title-link { color: var(--color-primary) !important; }
        .schedule-row:hover .schedule-episode-badge { background: var(--color-primary) !important; color: #fff !important; border-color: var(--color-primary) !important; box-shadow: var(--glow-shadow); }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

    </div>
  );
};

// Helper function to check if anime is a local DB match
function localMatchExists(anime: AnimeData): boolean {
  return !anime.id.startsWith('anilist-');
}
