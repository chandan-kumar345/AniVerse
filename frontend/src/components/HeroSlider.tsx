import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Check, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import type { AnimeData } from './AnimeCard';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface HeroSliderProps {
  animeList: AnimeData[];
}

// ============================================================================
// MANUAL SLIDER OVERRIDES
// ============================================================================
// You can manually set custom high-quality images and crop/position alignments 
// for specific anime here.
// Key: Use the anime's slug (e.g. "solo-leveling", "one-piece", etc.)
// ============================================================================

const MANUAL_BANNER_OVERRIDES: Record<string, string> = {
  // One Piece (Gear 5 & Wano / Egghead Ultra HD 4K)
  "one-piece": "https://image.tmdb.org/t/p/original/v38qp4bySLTXYu3MF8r5GD51FN3.jpg",
  "one piece": "https://image.tmdb.org/t/p/original/v38qp4bySLTXYu3MF8r5GD51FN3.jpg",

  // Solo Leveling (Sung Jin-woo & Shadow Monarch army)
  "solo-leveling": "https://image.tmdb.org/t/p/original/xMNH87maNLt9n2bMDYeI6db5VFm.jpg",
  "solo leveling": "https://image.tmdb.org/t/p/original/xMNH87maNLt9n2bMDYeI6db5VFm.jpg",
  "solo-leveling-season-2-arise-from-the-shadow": "https://image.tmdb.org/t/p/original/xMNH87maNLt9n2bMDYeI6db5VFm.jpg",

  // Jujutsu Kaisen / JJK Season 2 / JJK 0 (Gojo Satoru Hollow Purple & Sukuna)
  "jujutsu-kaisen": "https://image.tmdb.org/t/p/original/2otstbLfQ7MXuFt1X8MFOb4OIgd.jpg",
  "jujutsu kaisen": "https://image.tmdb.org/t/p/original/2otstbLfQ7MXuFt1X8MFOb4OIgd.jpg",
  "jujutsu-kaisen-season-2": "https://image.tmdb.org/t/p/original/qpin8cASXEVtwhzNsprHYFiOAGk.jpg",
  "jujutsu-kaisen-0": "https://image.tmdb.org/t/p/original/qpin8cASXEVtwhzNsprHYFiOAGk.jpg",

  // Demon Slayer (Tanjiro Hinokami Kagura Sun Breathing & Hashira Training)
  "demon-slayer": "https://image.tmdb.org/t/p/original/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg",
  "demon slayer": "https://image.tmdb.org/t/p/original/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg",
  "demon-slayer-kimetsu-no-yaiba": "https://image.tmdb.org/t/p/original/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg",
  "demon-slayer-kimetsu-no-yaiba-hashira-training-arc": "https://image.tmdb.org/t/p/original/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg",
  "demon-slayer-kimetsu-no-yaiba-the-movie-mugen-train": "https://image.tmdb.org/t/p/original/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg",

  // Bleach: Thousand-Year Blood War (Ichigo Dual Zangetsu)
  "bleach": "https://image.tmdb.org/t/p/original/o0NsbcIvsllg6CJX0FBFY8wWbsn.jpg",
  "bleach-thousand-year-blood-war": "https://image.tmdb.org/t/p/original/o0NsbcIvsllg6CJX0FBFY8wWbsn.jpg",
  "bleach: thousand-year blood war": "https://image.tmdb.org/t/p/original/o0NsbcIvsllg6CJX0FBFY8wWbsn.jpg",

  // Attack on Titan (Eren Yeager Founder & Colossal Titan)
  "attack-on-titan": "https://image.tmdb.org/t/p/original/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg",
  "attack on titan": "https://image.tmdb.org/t/p/original/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg",
  "attack-on-titan-the-final-season": "https://image.tmdb.org/t/p/original/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg",

  // Chainsaw Man (Denji with revving blades)
  "chainsaw-man": "https://image.tmdb.org/t/p/original/5DUMPBSnHOZsbBv81GFXZXvDpo6.jpg",
  "chainsaw man": "https://image.tmdb.org/t/p/original/5DUMPBSnHOZsbBv81GFXZXvDpo6.jpg",

  // DAN DA DAN (Momo & Okarun paranormal aura)
  "dan-da-dan": "https://image.tmdb.org/t/p/original/uNTrRKIOyKYISthoeizghtXPEOK.jpg",
  "dan da dan": "https://image.tmdb.org/t/p/original/uNTrRKIOyKYISthoeizghtXPEOK.jpg",
  "dandadan": "https://image.tmdb.org/t/p/original/uNTrRKIOyKYISthoeizghtXPEOK.jpg",

  // Naruto & Naruto Shippuden (Six Paths Sage Mode)
  "naruto": "https://image.tmdb.org/t/p/original/z0YhJvomqedHF85bplUJEotkN5l.jpg",
  "naruto-shippuden": "https://image.tmdb.org/t/p/original/z0YhJvomqedHF85bplUJEotkN5l.jpg",
  "naruto shippuden": "https://image.tmdb.org/t/p/original/z0YhJvomqedHF85bplUJEotkN5l.jpg",

  // Dragon Ball Super & Dragon Ball Z (Goku Ultra Instinct & SSJ)
  "dragon-ball-super": "https://image.tmdb.org/t/p/original/qA2UwUQbj05aeBMCuC0mHSQ4loE.jpg",
  "dragon ball super": "https://image.tmdb.org/t/p/original/qA2UwUQbj05aeBMCuC0mHSQ4loE.jpg",
  "dragon-ball-z": "https://image.tmdb.org/t/p/original/ydf1CeiBLfdxiyNTpskM0802TKl.jpg",
  "dragon ball z": "https://image.tmdb.org/t/p/original/ydf1CeiBLfdxiyNTpskM0802TKl.jpg",

  // Hunter x Hunter (Killua Godspeed & Gon)
  "hunter-x-hunter": "https://image.tmdb.org/t/p/original/bFKKyCI89Xq98Gul8cGox8K3sZa.jpg",
  "hunter-x-hunter-2011": "https://image.tmdb.org/t/p/original/bFKKyCI89Xq98Gul8cGox8K3sZa.jpg",
  "hunter x hunter": "https://image.tmdb.org/t/p/original/bFKKyCI89Xq98Gul8cGox8K3sZa.jpg",

  // Blue Lock (Egoist Striker Isagi Yoichi)
  "blue-lock": "https://image.tmdb.org/t/p/original/seMRyWVwIVBWbC9xaMzDMZJ8fUH.jpg",
  "blue lock": "https://image.tmdb.org/t/p/original/seMRyWVwIVBWbC9xaMzDMZJ8fUH.jpg",

  // Black Clover (Asta Demon Anti-Magic Form)
  "black-clover": "https://image.tmdb.org/t/p/original/qu9epTZh29fGUkY7ZYc9PVsv0Ig.jpg",
  "black-clover-season-2": "https://image.tmdb.org/t/p/original/qu9epTZh29fGUkY7ZYc9PVsv0Ig.jpg",
  "black clover": "https://image.tmdb.org/t/p/original/qu9epTZh29fGUkY7ZYc9PVsv0Ig.jpg",

  // One Punch Man (Saitama Serious Punch)
  "one-punch-man": "https://image.tmdb.org/t/p/original/s0w8JbuNNxL1YgaHeDWih12C3jG.jpg",
  "one punch man": "https://image.tmdb.org/t/p/original/s0w8JbuNNxL1YgaHeDWih12C3jG.jpg",

  // Kaiju No. 8 (Kafka Hibino)
  "kaiju-no-8": "https://image.tmdb.org/t/p/original/htGeuCcNhlBe8GTx3izKOsd8frw.jpg",
  "kaiju no. 8": "https://image.tmdb.org/t/p/original/htGeuCcNhlBe8GTx3izKOsd8frw.jpg",

  // My Hero Academia (Deku One For All)
  "my-hero-academia": "https://image.tmdb.org/t/p/original/3ILMlmC30QUnYkY3XEBOyJ82Dqu.jpg",
  "my-hero-academia-season-7": "https://image.tmdb.org/t/p/original/3ILMlmC30QUnYkY3XEBOyJ82Dqu.jpg",
  "my hero academia": "https://image.tmdb.org/t/p/original/3ILMlmC30QUnYkY3XEBOyJ82Dqu.jpg",

  // Spy x Family (Loid, Yor, Anya)
  "spy-x-family": "https://image.tmdb.org/t/p/original/lysUnU6V0VfcthDbviuVlIqgHOR.jpg",
  "spy x family": "https://image.tmdb.org/t/p/original/lysUnU6V0VfcthDbviuVlIqgHOR.jpg",

  // Death Note (Light Yagami & Ryuk)
  "death-note": "https://image.tmdb.org/t/p/original/z8IPicmEKXUO4I2UDdMEqw7RqOE.jpg",
  "death note": "https://image.tmdb.org/t/p/original/z8IPicmEKXUO4I2UDdMEqw7RqOE.jpg",

  // Fullmetal Alchemist: Brotherhood (Edward & Alphonse Elric)
  "fullmetal-alchemist-brotherhood": "https://image.tmdb.org/t/p/original/2UG177tWHy7xRmMKWJHB7nAUmKd.jpg",
  "fullmetal alchemist": "https://image.tmdb.org/t/p/original/2UG177tWHy7xRmMKWJHB7nAUmKd.jpg",

  // Your Name (Taki & Mitsuha Split Sky 4K UHD)
  "your-name": "https://image.tmdb.org/t/p/original/mMtUybQ6hL24FXo0F3Z4j2KG7kZ.jpg",
  "your name": "https://image.tmdb.org/t/p/original/mMtUybQ6hL24FXo0F3Z4j2KG7kZ.jpg",
  "your name.": "https://image.tmdb.org/t/p/original/mMtUybQ6hL24FXo0F3Z4j2KG7kZ.jpg",
  "kimi-no-na-wa": "https://image.tmdb.org/t/p/original/mMtUybQ6hL24FXo0F3Z4j2KG7kZ.jpg"
};

const MANUAL_POSITION_OVERRIDES: Record<string, string> = {
  "one-piece": "center 22%",
  "one piece": "center 22%",
  "solo-leveling": "center 24%",
  "solo leveling": "center 24%",
  "jujutsu-kaisen": "center 20%",
  "jujutsu kaisen": "center 20%",
  "demon-slayer": "center 20%",
  "demon slayer": "center 20%",
  "bleach": "center 20%",
  "attack-on-titan": "center 28%",
  "chainsaw-man": "center 20%",
  "dan-da-dan": "center 25%",
  "naruto": "center 22%",
  "dragon-ball-super": "center 20%",
  "dragon-ball-z": "center 25%",
  "hunter-x-hunter": "center 22%",
  "blue-lock": "center 20%",
  "black-clover": "center 20%",
  "one-punch-man": "center 20%",
  "kaiju-no-8": "center 24%",
  "my-hero-academia": "center 22%",
  "spy-x-family": "center 20%",
  "death-note": "center 22%",
  "your-name": "center 25%",
  "your name": "center 25%",
  "your name.": "center 25%",
  "kimi-no-na-wa": "center 25%"
};

const MANUAL_STYLE_OVERRIDES: Record<string, React.CSSProperties> = {};

export const HeroSlider: React.FC<HeroSliderProps> = ({ animeList }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [watchlistStatus, setWatchlistStatus] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Memoize activeItems so reference is stable and limited to top 10 anime
  // Reorder list to ensure One Piece is the 1st anime shown if it exists in the list
  const activeItems = useMemo(() => {
    if (!animeList || animeList.length === 0) return [];

    const onePieceIndex = animeList.findIndex(
      (anime) =>
        anime.slug.toLowerCase().includes('one-piece') ||
        anime.title.toLowerCase().includes('one piece')
    );

    let ordered = [...animeList];
    if (onePieceIndex > -1) {
      const [onePiece] = ordered.splice(onePieceIndex, 1);
      ordered.unshift(onePiece);
    }

    return ordered.slice(0, 10);
  }, [animeList]);

  const totalSlides = activeItems.length;

  // Sequential Next and Prev navigation (strictly 1 slide at a time)
  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (totalSlides > 0 ? (prev + 1) % totalSlides : 0));
    setProgress(0);
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (totalSlides > 0 ? (prev === 0 ? totalSlides - 1 : prev - 1) : 0));
    setProgress(0);
  }, [totalSlides]);

  // Robust autoplay timer: strictly runs 1 slide at a time in sequence (0 -> 1 -> 2 -> ... -> 9)
  // Keeps side-effects out of setState callbacks to eliminate StrictMode skipping
  useEffect(() => {
    if (totalSlides <= 1) return;

    setProgress(0);
    const duration = 6000; // 6 seconds per slide
    const intervalTime = 50; // update progress every 50ms
    const step = (intervalTime / duration) * 100;
    let currentProgress = 0;

    const timer = setInterval(() => {
      if (isHovered) return;

      currentProgress += step;
      if (currentProgress >= 100) {
        clearInterval(timer);
        goToNext();
      } else {
        setProgress(currentProgress);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeIndex, isHovered, totalSlides, goToNext]);

  // Fetch watchlist status for hero items if logged in (stable dependency)
  useEffect(() => {
    const fetchWatchlistStatuses = async () => {
      if (!isAuthenticated || activeItems.length === 0) return;
      try {
        const statuses: Record<string, boolean> = {};
        await Promise.all(
          activeItems.map(async (anime) => {
            const res = await axios.get(`/api/watchlist/status/${anime.id}`);
            statuses[anime.id] = res.data.inWatchlist;
          })
        );
        setWatchlistStatus(statuses);
      } catch (err) {
        console.error('Error fetching watchlist statuses:', err);
      }
    };
    fetchWatchlistStatuses();
  }, [activeItems, isAuthenticated]);

  if (animeList.length === 0) {
    return (
      <div style={{ height: '600px', width: '100%', borderRadius: '16px' }} className="shimmer" />
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    goToPrev();
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    goToNext();
  };

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
    setProgress(0);
  };

  const handleWatchNow = (slug: string) => {
    navigate(`/watch/${slug}/episode/1`);
  };

  const handleToggleWatchlist = async (animeId: string) => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    try {
      const isAlreadyIn = watchlistStatus[animeId];
      if (isAlreadyIn) {
        await axios.delete(`/api/watchlist/${animeId}`);
        setWatchlistStatus((prev) => ({ ...prev, [animeId]: false }));
      } else {
        await axios.post('/api/watchlist', { animeId, status: 'PLAN_TO_WATCH' });
        setWatchlistStatus((prev) => ({ ...prev, [animeId]: true }));
      }
    } catch (err) {
      console.error('Watchlist update error:', err);
    }
  };

  const getHDImageUrl = (url: string | null | undefined) => {
    if (!url) return '';
    if (url.includes('image.tmdb.org')) {
      return url.replace(/\/w\d+/, '/original');
    }
    return url;
  };

  return (
    <div
      className="hero-slider-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {activeItems.map((anime, index) => {
        const isActive = index === activeIndex;
        const genresList = anime.genres.split(',').map((g) => g.trim());

        // Smart fuzzy matching for custom ultra-HD 4K anime wallpaper
        const findBannerOverride = (): string | undefined => {
          const s = anime.slug.toLowerCase();
          const t = anime.title.toLowerCase();
          if (MANUAL_BANNER_OVERRIDES[anime.slug]) return MANUAL_BANNER_OVERRIDES[anime.slug];
          if (MANUAL_BANNER_OVERRIDES[anime.title]) return MANUAL_BANNER_OVERRIDES[anime.title];
          for (const [k, v] of Object.entries(MANUAL_BANNER_OVERRIDES)) {
            const keyLower = k.toLowerCase();
            if (s === keyLower || t === keyLower || s.includes(keyLower) || t.includes(keyLower)) {
              return v;
            }
          }
          return undefined;
        };

        const findPositionOverride = (): string => {
          const s = anime.slug.toLowerCase();
          const t = anime.title.toLowerCase();
          if (MANUAL_POSITION_OVERRIDES[anime.slug]) return MANUAL_POSITION_OVERRIDES[anime.slug];
          if (MANUAL_POSITION_OVERRIDES[anime.title]) return MANUAL_POSITION_OVERRIDES[anime.title];
          for (const [k, v] of Object.entries(MANUAL_POSITION_OVERRIDES)) {
            const keyLower = k.toLowerCase();
            if (s === keyLower || t === keyLower || s.includes(keyLower) || t.includes(keyLower)) {
              return v;
            }
          }
          return "center 22%";
        };

        const customBanner = findBannerOverride();
        const hasBanner = !!customBanner || !!anime.bannerImage;
        const hdImage = customBanner || getHDImageUrl(anime.bannerImage || anime.posterImage);
        const customPosition = findPositionOverride();
        const customStyle = MANUAL_STYLE_OVERRIDES[anime.slug] || MANUAL_STYLE_OVERRIDES[anime.title] || {};

        return (
          <div
            key={anime.id}
            className={`hero-slide ${isActive ? 'active' : 'inactive'}`}
          >
            {/* BACKGROUND BACKDROP */}
            {hasBanner ? (
              <>
                <div className="hero-backdrop-banner" style={{ overflow: 'hidden' }}>
                  {/* Blurred background copy for side blur effect (visible when objectFit is 'contain') */}
                  {customStyle.objectFit === 'contain' && (
                    <img
                      src={hdImage}
                      alt=""
                      referrerPolicy="no-referrer"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: customPosition,
                        filter: 'blur(20px) brightness(0.4)',
                        transform: 'scale(1.1)',
                        zIndex: 1
                      }}
                    />
                  )}
                  <img
                    src={hdImage}
                    alt={anime.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80';
                    }}
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: customPosition,
                      zIndex: 2,
                      ...customStyle
                    }}
                  />
                </div>
                <div className="hero-overlay-main" />
                <div className="hero-overlay-bottom" />
              </>
            ) : (
              <>
                {/* Fallback for portrait poster image */}
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 1,
                    filter: 'blur(20px) brightness(0.25)',
                    transform: 'scale(1.15)',
                  }}
                >
                  <img
                    src={anime.posterImage}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div className="hero-poster-wrapper">
                  <div className="hero-poster-card">
                    <img
                      src={anime.posterImage}
                      alt={anime.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, #0a090c 0%, rgba(10, 9, 12, 0.8) 50%, rgba(10, 9, 12, 0.4) 100%)',
                    zIndex: 2,
                  }}
                />
                <div className="hero-overlay-bottom" />
              </>
            )}

            {/* TEXT CONTENT CONTAINER */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: '100%',
                maxWidth: '650px',
                zIndex: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '0 50px',
                color: '#fff',
              }}
              className="hero-text-container"
            >
              {/* Spotlight Tag - Neumorphic convex pill */}
              <div
                className="hero-tag"
                style={{
                  background: 'rgba(243, 46, 53, 0.14)',
                  border: '1px solid rgba(243, 46, 53, 0.4)',
                  borderRadius: '9999px',
                  padding: '6px 16px',
                  boxShadow: '3px 3px 8px #080910, -2px -2px 6px #20233a',
                  width: 'fit-content',
                  color: 'var(--color-primary)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  fontSize: '12px',
                  letterSpacing: '1.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <Star size={14} style={{ fill: 'var(--color-primary)', color: 'var(--color-primary)' }} />
                #{index + 1} TRENDING
              </div>

              {/* Title */}
              <h1
                className="hero-title"
                style={{
                  fontSize: '44px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  marginBottom: '16px',
                  lineHeight: '1.1',
                  textShadow: '0 4px 16px rgba(0,0,0,0.6)',
                }}
              >
                {anime.title}
              </h1>

              {/* Info string */}
              <div
                className="hero-info"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  marginBottom: '18px',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    background: '#12121A',
                    border: '1px solid #292938',
                    boxShadow: 'inset 2px 2px 4px #08090f, inset -2px -2px 4px #1c1e30',
                    color: '#facc15',
                    fontWeight: 700,
                    padding: '3px 12px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ★ {anime.score.toFixed(2)}
                </span>
                <span className="nm-pill" style={{ padding: '3px 10px', fontSize: '11px', fontWeight: 600 }}>{anime.type}</span>
                <span>•</span>
                <span>{anime.releasedYear}</span>
                <span>•</span>
                <span>{anime.status}</span>
              </div>

              {/* Description Synopsis */}
              <p
                className="hero-desc"
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  marginBottom: '24px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {anime.description}
              </p>

              {/* Genres - Neumorphic tags */}
              <div
                className="hero-genres"
                style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}
              >
                {genresList.map((genre) => (
                  <span
                    key={genre}
                    className="nm-tag"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Buttons - Neumorphic 3D primary and secondary */}
              <div className="hero-btns" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button
                  onClick={() => handleWatchNow(anime.slug)}
                  className="nm-btn-primary"
                  style={{ padding: '13px 30px', fontSize: '15px' }}
                >
                  <Play size={18} style={{ fill: '#fff' }} /> Watch Now
                </button>
                <button
                  onClick={() => handleToggleWatchlist(anime.id)}
                  className="nm-btn-secondary"
                  style={{ padding: '13px 26px', fontSize: '15px' }}
                >
                  {watchlistStatus[anime.id] ? (
                    <>
                      <Check size={18} style={{ color: 'var(--color-primary)' }} /> In Watchlist
                    </>
                  ) : (
                    <>
                      <Plus size={18} /> Add Watchlist
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* ARROWS CONTROLS - Circular Neumorphic Buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: '30px',
          right: '50px',
          zIndex: 10,
          display: 'flex',
          gap: '12px',
        }}
        className="hero-arrows"
      >
        <button
          onClick={handlePrev}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#12121A',
            boxShadow: '5px 5px 12px #07080d, -4px -4px 10px #22253c',
            border: '1px solid #292938',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
          className="slider-arrow"
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={handleNext}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#12121A',
            boxShadow: '5px 5px 12px #07080d, -4px -4px 10px #22253c',
            border: '1px solid #292938',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
          }}
          className="slider-arrow"
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* DOT INDICATORS */}
      <div className="hero-indicators">
        {activeItems.map((_, idx) => (
          <button
            key={idx}
            onClick={() => handleDotClick(idx)}
            className={`hero-dot ${idx === activeIndex ? 'active' : ''}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* AUTOPLAY PROGRESS BAR */}
      <div className="hero-progress-bar-container">
        <div
          className="hero-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      <style>{`
        .hero-slider-container {
          position: relative;
          width: 100%;
          height: 600px;
          overflow: hidden;
          border-radius: 28px;
          border: 2px solid rgba(139, 92, 246, 0.35);
          background-color: #0d0f18;
          box-shadow: var(--nm-hero-frame);
        }

        .hero-slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          pointer-events: none;
          transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1), transform 1s cubic-bezier(0.4, 0, 0.2, 1);
          transform: scale(1.03);
        }

        .hero-slide.active {
          opacity: 1;
          pointer-events: auto;
          transform: scale(1);
          z-index: 2;
        }

        .hero-slide.inactive {
          z-index: 1;
        }

        .hero-backdrop-banner {
          width: 72%;
          height: 100%;
          position: absolute;
          top: 0;
          right: 0;
          z-index: 1;
          transition: transform 1.2s ease-out;
        }

        .hero-slide.active .hero-backdrop-banner {
          transform: scale(1.02);
        }

        .hero-overlay-main {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, #0d0f18 0%, #0d0f18 32%, rgba(13, 15, 24, 0.94) 46%, rgba(13, 15, 24, 0.45) 68%, rgba(13, 15, 24, 0) 95%);
          z-index: 2;
        }

        .hero-overlay-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 160px;
          background: linear-gradient(0deg, #0d0f18 0%, rgba(13, 15, 24, 0) 100%);
          z-index: 2;
        }

        /* Staggered entrance animations for text elements */
        .hero-slide .hero-text-container > * {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .hero-slide.active .hero-text-container > * {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-slide.active .hero-tag { transition-delay: 0.1s; }
        .hero-slide.active .hero-title { transition-delay: 0.2s; }
        .hero-slide.active .hero-info { transition-delay: 0.3s; }
        .hero-slide.active .hero-desc { transition-delay: 0.4s; }
        .hero-slide.active .hero-genres { transition-delay: 0.5s; }
        .hero-slide.active .hero-btns { transition-delay: 0.6s; }

        /* Poster Card Fallback floating effect */
        .hero-poster-wrapper {
          position: absolute;
          top: 0;
          right: 12%;
          height: 100%;
          width: 30%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .hero-poster-card {
          width: 210px;
          aspect-ratio: 2/3;
          border-radius: 16px;
          overflow: hidden;
          border: 2px solid rgba(139, 92, 246, 0.4);
          box-shadow: 6px 6px 20px #08090f, -4px -4px 14px #20233b, 0 0 24px rgba(139, 92, 246, 0.35);
          transform: rotate(2deg) translateY(-10px);
          animation: floatCard 6s ease-in-out infinite alternate;
        }

        @keyframes floatCard {
          0% { transform: translateY(-5px) rotate(1deg); }
          100% { transform: translateY(10px) rotate(3deg); }
        }

        /* Indicators styling */
        .hero-indicators {
          position: absolute;
          bottom: 30px;
          left: 50px;
          z-index: 10;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .hero-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #181a2b;
          box-shadow: inset 1px 1px 2px #07080e, inset -1px -1px 2px #22253c;
          border: 1px solid rgba(255, 255, 255, 0.04);
          cursor: pointer;
          padding: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hero-dot.active {
          background: var(--color-primary);
          width: 32px;
          height: 9px;
          border-radius: 9999px;
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 14px var(--color-primary-glow);
        }

        /* Autoplay Progress Bar */
        .hero-progress-bar-container {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.04);
          z-index: 10;
        }

        .hero-progress-bar {
          height: 100%;
          background: var(--color-primary);
          width: 0%;
          transition: width 0.05s linear;
        }

        .slider-arrow:hover { 
          background: #1e2034 !important; 
          border-color: rgba(139, 92, 246, 0.6) !important; 
          box-shadow: 0 0 16px var(--color-primary-glow) !important; 
          transform: scale(1.06);
        }

        @media (max-width: 992px) {
          .hero-backdrop-banner {
            width: 80%;
          }
          .hero-overlay-main {
            background: linear-gradient(90deg, #0a090c 0%, #0a090c 20%, rgba(10, 9, 12, 0.9) 50%, rgba(10, 9, 12, 0.4) 100%);
          }
          .hero-poster-wrapper {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .hero-slider-container {
            height: 480px;
          }
          .hero-backdrop-banner {
            width: 100%;
          }
          .hero-overlay-main {
            background: linear-gradient(90deg, #0a090c 0%, rgba(10, 9, 12, 0.95) 40%, rgba(10, 9, 12, 0.8) 100%);
          }
          .hero-text-container {
            padding: 0 24px !important;
            max-width: 100% !important;
          }
          .hero-title {
            font-size: 30px !important;
          }
          .hero-arrows {
            display: none !important;
          }
          .hero-indicators {
            left: 24px !important;
            bottom: 20px !important;
          }
          .hero-desc {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
