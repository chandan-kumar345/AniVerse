import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, User, LogOut, Heart, History, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
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
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const autocompleteRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

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

  // Auto-focus mobile search when opened
  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchInputRef.current) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
    }
  }, [isMobileSearchOpen]);

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
      setIsMobileSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const handleSuggestionClick = (slug: string) => {
    navigate(`/anime/${slug}`);
    setSearchQuery('');
    setShowSuggestions(false);
    setIsMobileSearchOpen(false);
    setIsMobileMenuOpen(false);
  };

  const currentPath = location.pathname;

  return (
    <header className="glass-header" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="app-container" style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        
        {/* LOGO */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-main)', flexShrink: 0 }}>
          <img src="/logo.png" alt="AniVerse" style={{ height: '38px', objectFit: 'contain' }} />
        </Link>
 
        {/* SEARCH BAR - Desktop Neumorphic Inset Capsule */}
        <div ref={autocompleteRef} style={{ flex: '0 1 460px', position: 'relative', margin: '0 20px', display: 'none' }} className="desktop-search">
          <form 
            onSubmit={handleSearchSubmit} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              background: 'var(--bg-surface-recessed)', 
              borderRadius: '9999px', 
              boxShadow: 'var(--nm-inset)', 
              border: 'var(--border-nm)', 
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
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '14px', height: '36px', paddingRight: '10px' }}
            />
            <button 
              type="submit" 
              aria-label="Submit search"
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
                boxShadow: 'var(--nm-primary-btn)',
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
            <div style={{ position: 'absolute', top: '115%', left: 0, right: 0, background: 'var(--bg-surface-elevated)', border: 'var(--border-nm)', borderRadius: '16px', boxShadow: 'var(--nm-elevated)', zIndex: 99, overflow: 'hidden', padding: '8px 0' }}>
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSuggestionClick(item.slug)}
                  style={{ display: 'flex', gap: '12px', padding: '10px 18px', cursor: 'pointer', transition: 'var(--transition-fast)', borderBottom: 'var(--border-nm)' }}
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
                    style={{ width: '42px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: 'var(--border-nm)' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
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

        {/* NAVIGATION LINKS, THEME TOGGLE & AUTH */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Desktop Navigation Links */}
          <div className="desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link 
              to="/" 
              className={`nav-pill ${currentPath === '/' ? 'active' : ''}`}
            >
              Home
            </Link>
            <Link 
              to="/search" 
              className={`nav-pill ${currentPath.startsWith('/search') ? 'active' : ''}`}
            >
              Catalog
            </Link>
            {isAuthenticated && (
              <Link 
                to="/profile?tab=watchlist" 
                className={`nav-pill ${currentPath.includes('watchlist') ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Heart size={15} /> Watchlist
              </Link>
            )}
          </div>

          {/* Desktop Theme Toggle Switch (Dark View <-> Light View) */}
          <div className="desktop-theme-toggle">
            <ThemeToggle />
          </div>

          {/* Vertical Separator */}
          <div className="desktop-links" style={{ width: '1px', height: '22px', background: 'var(--border-color)' }} />

          {/* USER ACTION BUTTONS */}
          {isAuthenticated ? (
            <div ref={profileDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="nm-pill"
                style={{ 
                  background: 'var(--bg-surface-elevated)', 
                  border: 'var(--border-nm)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  cursor: 'pointer', 
                  color: 'var(--text-main)',
                  padding: '5px 14px 5px 6px'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: '#fff', overflow: 'hidden', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)' }}>
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
                <div style={{ position: 'absolute', top: '125%', right: 0, width: '210px', background: 'var(--bg-surface-elevated)', border: 'var(--border-nm)', borderRadius: '14px', boxShadow: 'var(--nm-elevated)', overflow: 'hidden', zIndex: 99, padding: '6px' }}>
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
                  <div style={{ borderTop: 'var(--border-nm)', margin: '4px 0' }} />
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
            <Link to="/auth" className="nm-btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
              Sign In
            </Link>
          )}

          {/* MOBILE QUICK SEARCH BUTTON (Mobile Chrome) */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="mobile-only nm-icon-btn"
            aria-label="Open mobile search"
            style={{ display: 'none' }}
          >
            <Search size={18} />
          </button>

          {/* MOBILE THEME TOGGLE (Mobile Chrome top bar) */}
          <div className="mobile-only mobile-top-theme" style={{ display: 'none' }}>
            <ThemeToggle />
          </div>

          {/* MOBILE MENU TOGGLE */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-only nm-icon-btn"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            style={{ display: 'none' }}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </div>

      {/* MOBILE POPUP SEARCH BAR (Smooth overlay on Mobile Chrome) */}
      {isMobileSearchOpen && (
        <div style={{ position: 'fixed', top: '70px', left: 0, right: 0, background: 'var(--bg-surface-glass)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '14px 20px', zIndex: 99, borderBottom: 'var(--border-nm)', boxShadow: 'var(--nm-card)' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface-recessed)', border: 'var(--border-nm)', borderRadius: '9999px', boxShadow: 'var(--nm-inset)', padding: '4px 6px 4px 16px' }}>
            <input
              ref={mobileSearchInputRef}
              type="text"
              placeholder="Search anime titles, genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '14px', height: '38px' }}
            />
            <button type="submit" style={{ background: 'var(--color-primary)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', boxShadow: 'var(--nm-primary-btn)' }}>
              <Search size={16} />
            </button>
            <button type="button" onClick={() => setIsMobileSearchOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '0 8px', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </form>

          {/* Mobile suggestions results */}
          {suggestions.length > 0 && (
            <div style={{ marginTop: '10px', maxHeight: '60vh', overflowY: 'auto', background: 'var(--bg-surface-elevated)', borderRadius: '14px', border: 'var(--border-nm)', boxShadow: 'var(--nm-elevated)' }}>
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSuggestionClick(item.slug)}
                  style={{ display: 'flex', gap: '12px', padding: '10px 14px', borderBottom: 'var(--border-nm)', cursor: 'pointer' }}
                >
                  <img
                    src={item.posterImage}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    style={{ width: '38px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.type} • {item.releasedYear}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer" style={{ position: 'fixed', top: '70px', left: 0, right: 0, bottom: 0, background: 'var(--bg-main)', padding: '24px', zIndex: 98, display: 'flex', flexDirection: 'column', gap: '18px', borderTop: 'var(--border-nm)', overflowY: 'auto' }}>
          
          {/* Quick Theme Switcher in Mobile Drawer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--bg-surface-elevated)', borderRadius: '16px', border: 'var(--border-nm)', boxShadow: 'var(--nm-convex-btn)' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>Theme Appearance</span>
            <ThemeToggle showLabel={true} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="nm-pill" style={{ padding: '12px 20px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              Home
            </Link>
            <Link to="/search" onClick={() => setIsMobileMenuOpen(false)} className="nm-pill" style={{ padding: '12px 20px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              Catalog
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/profile?tab=watchlist" onClick={() => setIsMobileMenuOpen(false)} className="nm-pill" style={{ padding: '12px 20px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Heart size={18} style={{ color: 'var(--color-primary)' }} /> My Watchlist
                </Link>
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="nm-pill" style={{ padding: '12px 20px', color: 'var(--text-main)', textDecoration: 'none', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <User size={18} /> My Account
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="nm-pill"
                  style={{ padding: '12px 20px', color: '#ef4444', textDecoration: 'none', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', textAlign: 'left', border: 'none' }}
                >
                  <LogOut size={18} /> Log Out
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header responsive styling */}
      <style>{`
        @media (min-width: 769px) {
          .desktop-search { display: block !important; }
          .desktop-theme-toggle { display: block !important; }
          .desktop-links { display: flex !important; }
          .mobile-only { display: none !important; }
        }
        @media (max-width: 768px) {
          .desktop-links, .desktop-username, .desktop-search, .desktop-theme-toggle { display: none !important; }
          .mobile-only { display: flex !important; }
        }
        .nav-pill {
          color: var(--text-muted);
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          padding: 8px 18px;
          border-radius: 9999px;
          transition: var(--transition-fast);
          border: 1px solid transparent;
        }
        .nav-pill:hover {
          color: var(--text-main);
          background: var(--bg-surface-elevated);
        }
        .nav-pill.active {
          background: var(--bg-surface-elevated);
          color: var(--color-primary);
          box-shadow: var(--nm-convex-btn);
          border: var(--border-nm);
        }
        .dropdown-item:hover { background: var(--border-color); }
        .dropdown-item.logout:hover { background: rgba(239, 68, 68, 0.1); }
        .search-form:focus-within { border-color: var(--border-color-active) !important; box-shadow: var(--nm-inset) !important; }
        .search-btn:hover { transform: scale(1.05); }
        .suggestion-item:hover { background: var(--border-color); }
      `}</style>
    </header>
  );
};
