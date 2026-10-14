import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimeCard } from './AnimeCard';
import type { AnimeData } from './AnimeCard';

interface AnimeSliderProps {
  title: string;
  animeList: AnimeData[];
  showCountdown?: boolean;
}

export const AnimeSlider: React.FC<AnimeSliderProps> = ({ title, animeList, showCountdown = true }) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -600, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 600, behavior: 'smooth' });
    }
  };

  if (animeList.length === 0) {
    return null;
  }

  return (
    <div style={{ position: 'relative', margin: '40px 0' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center' }}>
          <span className="section-indicator" />
          {title}
        </h2>
        {/* Buttons Nav - Neumorphic circular buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={scrollLeft} 
            className="nm-icon-btn"
            style={{ width: '36px', height: '36px' }}
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={scrollRight} 
            className="nm-icon-btn"
            style={{ width: '36px', height: '36px' }}
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* HORIZONTAL CAROUSEL */}
      <div
        ref={sliderRef}
        style={{ display: 'flex', gap: '20px', overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: '16px', paddingTop: '4px', scrollbarWidth: 'none' }}
        className="horizontal-slider"
      >
        {animeList.map((anime) => (
          <div key={anime.id} style={{ flex: '0 0 calc(20% - 16px)' }} className="slider-card-wrap">
            <AnimeCard anime={anime} showCountdown={showCountdown} />
          </div>
        ))}
      </div>

      <style>{`
        .horizontal-slider::-webkit-scrollbar { display: none; }
        @media (max-width: 1200px) {
          .slider-card-wrap { flex: 0 0 calc(25% - 15px) !important; }
        }
        @media (max-width: 768px) {
          .slider-card-wrap { flex: 0 0 calc(33.33% - 14px) !important; }
        }
        @media (max-width: 480px) {
          .slider-card-wrap { flex: 0 0 calc(50% - 10px) !important; }
        }
      `}</style>
    </div>
  );
};
