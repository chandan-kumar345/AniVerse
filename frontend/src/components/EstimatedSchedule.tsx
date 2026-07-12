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
}

export const EstimatedSchedule: React.FC<EstimatedScheduleProps> = ({ animeList }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDayOffset, setSelectedDayOffset] = useState(0); // Offset in days from today (-3 to +3)

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
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

  // Generate schedule items for the active day based on animeList
  const getScheduleForDay = (offset: number): ScheduleItem[] => {
    if (animeList.length === 0) return [];

    // Seeded times list
    const releaseTimes = ['09:30 AM', '11:00 AM', '01:00 PM', '02:30 PM', '06:00 PM', '07:30 PM', '09:00 PM', '10:30 PM'];

    // Map each offset to a stable selection of anime using standard modulo indexes
    // This makes sure the schedule is different for MON vs SUN, but remains stable when clicking
    const scheduleItems: ScheduleItem[] = [];
    const countPerDay = 5;

    for (let i = 0; i < countPerDay; i++) {
      // Pick anime based on day offset and item index
      const itemIndex = Math.abs((offset + 10) * 3 + i) % animeList.length;
      const anime = animeList[itemIndex];

      // Determine mock episode number (either latest episode or a stable mock)
      const maxEp = anime.episodes && anime.episodes.length > 0 ? anime.episodes[0].episodeNumber : 12;
      const epNum = anime.status === 'Currently Airing' ? maxEp + 1 : Math.floor(Math.random() * maxEp) + 1;

      scheduleItems.push({
        time: releaseTimes[i % releaseTimes.length],
        anime,
        episodeNumber: epNum,
      });
    }

    return scheduleItems;
  };

  const currentSchedule = getScheduleForDay(selectedDayOffset);

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
                <span style={{ fontSize: '18px', fontWeight: isActive ? 800 : 600, letterSpacing: '0.5px' }}>{day.dayName}</span>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {currentSchedule.map((item, index) => (
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
            <Link 
              to={`/anime/${item.anime.slug}`} 
              style={{ flex: 1, textDecoration: 'none', color: '#fff', fontSize: '14px', fontWeight: 600, paddingRight: '20px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', textAlign: 'left', transition: 'var(--transition-fast)' }}
              className="schedule-title-link"
            >
              {item.anime.title}
            </Link>

            {/* Episode Badge Button */}
            <Link
              to={`/watch/${item.anime.id}/episode/${item.episodeNumber}`}
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
        ))}
      </div>

      <style>{`
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
