import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, User, LogOut, Bookmark, History, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { anilistService, type AniListMedia } from '../services/anilistService';
import axios from 'axios';

interface SuggestionItem {
  id: string | number;
  slug: string;
  title: string;
  posterImage: string;
  score?: number;
  releasedYear?: number;
  type?: string;
}

export const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced multi-source autocomplete suggestions (AniList GraphQL + local)
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // First try AniList GraphQL API for rich global results
        const aniResult = await anilistService.search({
          search: searchQuery.trim(),
          perPage: 6,
        });

        if (aniResult && aniResult.media.length > 0) {
          const mapped: SuggestionItem[] = aniResult.media.map((m: AniListMedia) => {
            const title = m.title.english || m.title.romaji || m.title.native || 'Unknown Title';
            const slug = m.slug || title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            return {
              id: m.id,
              slug,
              title,
              posterImage: m.coverImage?.large || m.coverImage?.medium || '',
              score: m.averageScore ? m.averageScore / 10 : undefined,
              releasedYear: m.startDate?.year || undefined,
              type: m.format || 'TV',
            };
          });
          setSuggestions(mapped);
          return;
        }

        // Fallback to local search endpoint if AniList returned empty
        const res = await axios.get(`/api/anime/search/suggest?q=${encodeURIComponent(searchQuery)}`);
        setSuggestions(res.data.suggestions || []);
      } catch (err) {
        console.warn('Autocomplete fetch fallback:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (slug: string) => {
    navigate(`/anime/${slug}`);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const currentPath = location.pathname;

  return (
    <header
      style={{
        height: '74px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(8, 7, 11, 0.94)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #292938',
      }}
    >
      <div
        className="app-container"
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        {/* BRAND LOGO */}
        <Link
          to="/"
          style={{
            display: 'flex',
            flexDirection: 'column',
            textDecoration: 'none',
            flexShrink: 0,
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '24px',
                letterSpacing: '0.04em',
                color: '#ffffff',
                lineHeight: 1,
              }}
            >
              ANI<span style={{ color: 'var(--color-primary)' }}>VERSES</span>
            </span>
            <Sparkles size={16} color="var(--color-primary)" style={{ filter: 'drop-shadow(0 0 6px var(--color-primary-glow))' }} />
          </div>
          <span
            style={{
              fontSize: '8.5px',
              fontWeight: 700,
              letterSpacing: '0.24em',
              color: 'var(--text-muted)',
              marginTop: '3px',
              textTransform: 'uppercase',
            }}
          >
            Anime Beyond Borders
          </span>
        </Link>

        {/* DESKTOP NAVIGATION LINKS */}
        <nav className="desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '24px' }}>
          <Link
            to="/"
            className={`nav-link-pill ${currentPath === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link
            to="/discover"
            className={`nav-link-pill ${currentPath === '/discover' || currentPath === '/search' ? 'active' : ''}`}
          >
            Explore
          </Link>
          <Link
            to="/genres"
            className={`nav-link-pill ${currentPath.startsWith('/genres') ? 'active' : ''}`}
          >
            Genres
          </Link>
          <Link
            to="/schedule"
            className={`nav-link-pill ${currentPath === '/schedule' ? 'active' : ''}`}
          >
            Schedule
          </Link>
          <Link
            to="/running"
            className={`nav-link-pill ${currentPath === '/running' ? 'active' : ''}`}
          >
            Running Anime
          </Link>
          <Link
            to="/watchlist"
            className={`nav-link-pill ${currentPath === '/watchlist' ? 'active' : ''}`}
          >
            My List
          </Link>
        </nav>

        {/* SEARCH BAR (Pill shaped with search icon & '/' keyboard hint) */}
        <div
          ref={autocompleteRef}
          style={{ flex: '0 1 420px', position: 'relative', margin: '0 20px', display: 'none' }}
          className="desktop-search"
        >
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#12121A',
              borderRadius: '9999px',
              border: '1px solid #292938',
              padding: '4px 12px 4px 16px',
              transition: 'var(--transition-smooth)',
            }}
            className="search-form-pill"
          >
            <Search size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginRight: '8px' }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search anime, movies..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '13px',
                height: '34px',
              }}
            />
            {/* Keyboard shortcut hint */}
            <div
              style={{
                background: '#1d1d29',
                color: 'var(--text-muted)',
                border: '1px solid #292938',
                borderRadius: '4px',
                padding: '2px 7px',
                fontSize: '11px',
                fontWeight: 700,
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              /
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '120%',
                left: 0,
                right: 0,
                background: '#12121A',
                border: '1px solid #292938',
                borderRadius: '14px',
                boxShadow: 'var(--nm-card-hover)',
                zIndex: 99,
                overflow: 'hidden',
                padding: '6px 0',
              }}
            >
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSuggestionClick(item.slug)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                  }}
                  className="suggestion-row"
                >
                  <img
                    src={item.posterImage || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=120'}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    style={{
                      width: '36px',
                      height: '48px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1px solid #292938',
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '13px',
                        color: '#fff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {item.type} {item.releasedYear ? `• ${item.releasedYear}` : ''} {item.score ? `• ⭐ ${item.score.toFixed(1)}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDE ACTIONS: NOTIFICATIONS & PROFILE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* NOTIFICATION BELL */}
          <div ref={notificationsRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#12121A',
                border: '1px solid #292938',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'var(--transition-fast)',
              }}
              title="Notifications"
            >
              <Bell size={18} />
              {/* Red notification dot */}
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '7px',
                  height: '7px',
                  background: 'var(--color-primary)',
                  borderRadius: '50%',
                  boxShadow: '0 0 6px var(--color-primary-glow)',
                }}
              />
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '125%',
                  right: 0,
                  width: '300px',
                  background: '#12121A',
                  border: '1px solid #292938',
                  borderRadius: '12px',
                  boxShadow: 'var(--nm-card-hover)',
                  overflow: 'hidden',
                  zIndex: 99,
                  padding: '12px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Notifications</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>Live Updates</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ padding: '8px', borderRadius: '8px', background: '#181824', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <div style={{ color: '#fff', fontWeight: 600, marginBottom: '2px' }}>Solo Leveling Episode 8</div>
                    <span>New episode now airing on authorized streams!</span>
                  </div>
                  <div style={{ padding: '8px', borderRadius: '8px', background: '#181824', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <div style={{ color: '#fff', fontWeight: 600, marginBottom: '2px' }}>Demon Slayer Season 4</div>
                    <span>Hashira Training Arc is scheduled for this Sunday.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* USER PROFILE / AUTH */}
          {isAuthenticated ? (
            <div ref={profileDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'transparent',
                  border: '2px solid var(--color-primary)',
                  boxShadow: '0 0 12px var(--color-primary-glow)',
                  padding: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={
                    user?.avatar
                      ? `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`
                      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                  }
                  alt={user?.username || 'Profile'}
                  referrerPolicy="no-referrer"
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              </button>

              {/* Profile Dropdown */}
              {isProfileDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '125%',
                    right: 0,
                    width: '210px',
                    background: '#12121A',
                    border: '1px solid #292938',
                    borderRadius: '12px',
                    boxShadow: 'var(--nm-card-hover)',
                    overflow: 'hidden',
                    zIndex: 99,
                    padding: '6px',
                  }}
                >
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #292938', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>{user?.username}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="dropdown-item-link"
                  >
                    <User size={15} /> Profile & Settings
                  </Link>
                  <Link
                    to="/watchlist"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="dropdown-item-link"
                  >
                    <Bookmark size={15} /> My Watchlist
                  </Link>
                  <Link
                    to="/history"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="dropdown-item-link"
                  >
                    <History size={15} /> Watch History
                  </Link>
                  <div style={{ borderTop: '1px solid #292938', margin: '4px 0' }} />
                  <button
                    onClick={() => {
                      logout();
                      setIsProfileDropdownOpen(false);
                      navigate('/');
                    }}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      color: 'var(--color-primary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      borderRadius: '8px',
                    }}
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              style={{
                background: 'var(--color-primary)',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '8px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: '0 4px 14px var(--color-primary-glow)',
                transition: 'var(--transition-fast)',
              }}
            >
              Sign In
            </Link>
          )}

          {/* MOBILE MENU TOGGLE */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-toggle"
            style={{
              display: 'none',
              background: '#12121A',
              border: '1px solid #292938',
              borderRadius: '8px',
              padding: '6px',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '74px',
            left: 0,
            right: 0,
            bottom: 0,
            background: '#08070B',
            padding: '24px',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            borderTop: '1px solid #292938',
          }}
        >
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', background: '#12121A', border: '1px solid #292938', borderRadius: '8px', padding: '6px 14px' }}>
            <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
            <input
              type="text"
              placeholder="Search anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '14px', height: '34px' }}
            />
          </form>

          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={{ color: currentPath === '/' ? 'var(--color-primary)' : 'var(--text-main)', textDecoration: 'none', fontSize: '17px', fontWeight: 600 }}>Home</Link>
          <Link to="/discover" onClick={() => setIsMobileMenuOpen(false)} style={{ color: currentPath === '/discover' ? 'var(--color-primary)' : 'var(--text-main)', textDecoration: 'none', fontSize: '17px', fontWeight: 600 }}>Explore</Link>
          <Link to="/genres" onClick={() => setIsMobileMenuOpen(false)} style={{ color: currentPath.startsWith('/genres') ? 'var(--color-primary)' : 'var(--text-main)', textDecoration: 'none', fontSize: '17px', fontWeight: 600 }}>Genres</Link>
          <Link to="/schedule" onClick={() => setIsMobileMenuOpen(false)} style={{ color: currentPath === '/schedule' ? 'var(--color-primary)' : 'var(--text-main)', textDecoration: 'none', fontSize: '17px', fontWeight: 600 }}>Schedule</Link>
          <Link to="/running" onClick={() => setIsMobileMenuOpen(false)} style={{ color: currentPath === '/running' ? 'var(--color-primary)' : 'var(--text-main)', textDecoration: 'none', fontSize: '17px', fontWeight: 600 }}>Running Anime</Link>
          <Link to="/watchlist" onClick={() => setIsMobileMenuOpen(false)} style={{ color: currentPath === '/watchlist' ? 'var(--color-primary)' : 'var(--text-main)', textDecoration: 'none', fontSize: '17px', fontWeight: 600 }}>My List</Link>
        </div>
      )}

      {/* Header Inline Styles for Responsive Transitions */}
      <style>{`
        @media (min-width: 900px) {
          .desktop-search { display: block !important; }
          .mobile-toggle { display: none !important; }
        }
        @media (max-width: 899px) {
          .desktop-links { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
        .nav-link-pill {
          color: var(--text-muted);
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          padding: 8px 14px;
          border-radius: 8px;
          transition: var(--transition-fast);
          position: relative;
        }
        .nav-link-pill:hover {
          color: #ffffff;
        }
        .nav-link-pill.active {
          color: #ffffff;
          font-weight: 700;
        }
        .nav-link-pill.active::after {
          content: '';
          position: absolute;
          bottom: 0px;
          left: 14px;
          right: 14px;
          height: 2px;
          background: var(--color-primary);
          border-radius: 2px;
          box-shadow: 0 0 8px var(--color-primary-glow);
        }
        .search-form-pill:focus-within {
          border-color: var(--color-primary) !important;
          box-shadow: 0 0 14px var(--color-primary-glow);
        }
        .suggestion-row:hover {
          background: #181824;
        }
        .dropdown-item-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          color: var(--text-main);
          text-decoration: none;
          font-size: 13px;
          border-radius: 8px;
          transition: var(--transition-fast);
        }
        .dropdown-item-link:hover {
          background: #181824;
          color: #ffffff;
        }
      `}</style>
    </header>
  );
};
