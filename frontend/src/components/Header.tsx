import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, User, LogOut, Heart, History, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface Suggestion {
  id: string;
  slug: string;
  title: string;
  englishTitle: string;
  posterImage: string;
  score: number;
  releasedYear: number;
  type: string;
}

export const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const autocompleteRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close suggestions and dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await axios.get(`/api/anime/search/suggest?q=${searchQuery}`);
        setSuggestions(res.data.suggestions || []);
      } catch (err) {
        console.error('Failed to load suggestions:', err);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (slug: string) => {
    navigate(`/anime/${slug}`);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const location = window.location.pathname;

  return (
    <header className="glass-header" style={{ height: '74px', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="app-container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        
        {/* LOGO */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#fff', flexShrink: 0 }}>
          <img src="/logo.png" alt="AniVerse" style={{ height: '42px', objectFit: 'contain' }} />
        </Link>
 
        {/* SEARCH BAR - Neumorphic Inset Capsule */}
        <div ref={autocompleteRef} style={{ flex: '0 1 480px', position: 'relative', margin: '0 24px', display: 'none' }} className="desktop-search">
          <form 
            onSubmit={handleSearchSubmit} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              background: 'var(--bg-surface-recessed)', 
              borderRadius: '9999px', 
              boxShadow: 'var(--nm-inset)', 
              border: '1px solid rgba(255,255,255,0.04)', 
              padding: '4px 6px 4px 18px', 
              transition: 'var(--transition-smooth)' 
            }} 
            className="search-form"
          >
            <input
              type="text"
              placeholder="Search anime, movies, series..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '14px', height: '36px', paddingRight: '10px' }}
            />
            <button 
              type="submit" 
              style={{ 
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', 
                border: 'none', 
                borderRadius: '50%', 
                width: '34px', 
                height: '34px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer', 
                color: '#fff', 
                boxShadow: '0 4px 14px rgba(243, 46, 53, 0.45)',
                transition: 'var(--transition-smooth)',
                flexShrink: 0
              }}
              className="search-btn"
            >
              <Search size={16} />
            </button>
          </form>
 
          {/* Autocomplete Dropdown - Neumorphic elevated menu */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '115%', left: 0, right: 0, background: 'var(--bg-surface-elevated)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', boxShadow: 'var(--nm-elevated)', zIndex: 99, overflow: 'hidden', padding: '8px 0' }}>
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSuggestionClick(item.slug)}
                  style={{ display: 'flex', gap: '12px', padding: '10px 18px', cursor: 'pointer', transition: 'var(--transition-fast)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  className="suggestion-item"
                >
                  <img
                    src={item.posterImage}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80';
                    }}
                    style={{ width: '42px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {item.type} • {item.releasedYear} • ⭐ {item.score.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NAVIGATION LINKS & AUTH */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link 
              to="/" 
              className={`nav-pill ${location === '/' ? 'active' : ''}`}
            >
              Home
            </Link>
            <Link 
              to="/series" 
              className={`nav-pill ${location.startsWith('/series') ? 'active' : ''}`}
            >
              Series
            </Link>
            <Link 
              to="/movies" 
              className={`nav-pill ${location.startsWith('/movies') ? 'active' : ''}`}
            >
              Movies
            </Link>
            <Link 
              to="/genres" 
              className={`nav-pill ${location.startsWith('/genres') ? 'active' : ''}`}
            >
              Genres
            </Link>
            <Link 
              to="/search" 
              className={`nav-pill ${location.startsWith('/search') ? 'active' : ''}`}
            >
              Catalog
            </Link>
            {isAuthenticated && (
              <Link 
                to="/profile?tab=watchlist" 
                className={`nav-pill ${location.includes('watchlist') ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Heart size={15} /> Watchlist
              </Link>
            )}
          </div>

          {/* Vertical Separator */}
          <div className="desktop-links" style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)' }} />

          {/* USER ACTION BUTTONS */}
          {isAuthenticated ? (
            <div ref={profileDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="nm-pill"
                style={{ 
                  background: 'var(--bg-surface-elevated)', 
                  border: '1px solid rgba(255,255,255,0.06)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  cursor: 'pointer', 
                  color: '#fff',
                  padding: '5px 14px 5px 6px'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(243, 46, 53, 0.4)' }}>
                  {user?.avatar ? (
                    <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`} alt="avatar" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user?.username.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="desktop-username" style={{ fontWeight: 600, fontSize: '13px' }}>{user?.username}</span>
                <ChevronDown size={14} style={{ opacity: 0.7 }} />
              </button>

              {/* Profile Dropdown */}
              {isProfileDropdownOpen && (
                <div style={{ position: 'absolute', top: '125%', right: 0, width: '210px', background: 'var(--bg-surface-elevated)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', boxShadow: 'var(--nm-elevated)', overflow: 'hidden', zIndex: 99, padding: '6px' }}>
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', color: 'var(--text-main)', textDecoration: 'none', transition: 'var(--transition-fast)', fontSize: '13px', borderRadius: '8px' }}
                    className="dropdown-item"
                  >
                    <User size={15} /> Profile
                  </Link>
                  <Link
                    to="/profile?tab=history"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', color: 'var(--text-main)', textDecoration: 'none', transition: 'var(--transition-fast)', fontSize: '13px', borderRadius: '8px' }}
                    className="dropdown-item"
                  >
                    <History size={15} /> Watch History
                  </Link>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0' }} />
                  <button
                    onClick={() => {
                      logout();
                      setIsProfileDropdownOpen(false);
                      navigate('/');
                    }}
                    style={{ width: '100%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', color: '#ef4444', textAlign: 'left', cursor: 'pointer', fontSize: '13px', transition: 'var(--transition-fast)', borderRadius: '8px' }}
                    className="dropdown-item logout"
                  >
                    <LogOut size={15} /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="nm-btn-primary" style={{ padding: '8px 22px', fontSize: '13px' }}>
              Sign In
            </Link>
          )}

          {/* MOBILE MENU TOGGLE */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-toggle nm-icon-btn"
            style={{ display: 'none' }}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </div>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer" style={{ position: 'fixed', top: '70px', left: 0, right: 0, bottom: 0, background: 'var(--bg-main)', padding: '24px', zIndex: 98, display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '25px', padding: '2px 6px 2px 16px' }}>
            <input
              type="text"
              placeholder="Search anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '14px', height: '36px' }}
            />
            <button type="submit" style={{ background: 'var(--color-primary)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
              <Search size={16} />
            </button>
          </form>

           <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '18px', fontWeight: 600 }}>Home</Link>
          <Link to="/series" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '18px', fontWeight: 600 }}>Anime Series</Link>
          <Link to="/movies" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '18px', fontWeight: 600 }}>Anime Movies</Link>
          <Link to="/genres" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '18px', fontWeight: 600 }}>Genres</Link>
          <Link to="/search" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '18px', fontWeight: 600 }}>Catalog</Link>
          {isAuthenticated && (
            <>
              <Link to="/profile?tab=watchlist" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '18px', fontWeight: 600 }}>My Watchlist</Link>
              <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '18px', fontWeight: 600 }}>My Account</Link>
            </>
          )}
        </div>
      )}

      {/* Header media query styles */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-search { display: block !important; }
          .mobile-toggle { display: none !important; }
        }
        @media (max-width: 767px) {
          .desktop-links, .desktop-username { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
        .nav-pill {
          color: var(--text-muted);
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          padding: 8px 20px;
          border-radius: 9999px;
          transition: var(--transition-fast);
          border: 1px solid transparent;
        }
        .nav-pill:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.04);
          box-shadow: 3px 3px 8px #020102, -2px -2px 6px #1a181e;
        }
        .nav-pill.active {
          background: linear-gradient(145deg, #1b191e 0%, #111013 100%);
          color: #fff;
          box-shadow: 4px 4px 10px #020102, -3px -3px 8px #1e1c22, inset 1px 1px 1.5px rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(243, 46, 53, 0.5);
        }
        .dropdown-item:hover { background: rgba(255,255,255,0.06); }
        .dropdown-item.logout:hover { background: rgba(243, 46, 53, 0.15); }
        .search-form:focus-within { 
          border-color: rgba(243, 46, 53, 0.6) !important; 
          box-shadow: inset 3px 3px 7px #020102, inset -3px -3px 7px #16151a, 0 0 18px rgba(243, 46, 53, 0.35) !important; 
        }
        .search-btn:hover { 
          transform: scale(1.05); 
          box-shadow: 0 6px 20px rgba(243, 46, 53, 0.7) !important; 
        }
        .suggestion-item:hover { background: rgba(255,255,255,0.05); }
      `}</style>
    </header>
  );
};
