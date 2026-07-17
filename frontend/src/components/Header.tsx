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

  return (
    <header className="glass-header" style={{ height: '70px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="app-container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
        
        {/* LOGO */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#fff' }}>
          <img src="/logo.png" alt="AniVerse" style={{ height: '42px', objectFit: 'contain' }} />
        </Link>
 
        {/* SEARCH BAR */}
        <div ref={autocompleteRef} style={{ flex: '0 1 450px', position: 'relative', margin: '0 20px', display: 'none' /* Will show if screen > 768px */ }} className="desktop-search">
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '25px', padding: '2px 6px 2px 16px', transition: 'var(--transition-smooth)' }} className="search-form">
            <input
              type="text"
              placeholder="Search anime..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '14px', height: '36px' }}
            />
            <button type="submit" style={{ background: 'var(--color-primary)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', transition: 'var(--transition-smooth)' }}>
              <Search size={16} />
            </button>
          </form>
 
          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '105%', left: 0, right: 0, background: '#111119', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.8)', zIndex: 99, overflow: 'hidden', padding: '6px 0' }}>
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSuggestionClick(item.slug)}
                  style={{ display: 'flex', gap: '12px', padding: '10px 16px', cursor: 'pointer', transition: 'var(--transition-fast)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  className="suggestion-item"
                >
                  <img src={item.posterImage} alt={item.title} referrerPolicy="no-referrer" style={{ width: '40px', height: '55px', objectFit: 'cover', borderRadius: '4px' }} />
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
        <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div className="desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link to="/" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500, transition: 'var(--transition-fast)' }} className="nav-link">Home</Link>
            <Link to="/search" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500, transition: 'var(--transition-fast)' }} className="nav-link">Catalog</Link>
            {isAuthenticated && (
              <>
                <Link to="/profile?tab=watchlist" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px', transition: 'var(--transition-fast)' }} className="nav-link">
                  <Heart size={16} /> Watchlist
                </Link>
              </>
            )}
          </div>

          {/* USER ACTION BUTTONS */}
          {isAuthenticated ? (
            <div ref={profileDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff' }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', overflow: 'hidden', border: '2px solid var(--color-primary)' }}>
                  {user?.avatar ? (
                    <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`} alt="avatar" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user?.username.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="desktop-username" style={{ fontWeight: 600, fontSize: '14px' }}>{user?.username}</span>
                <ChevronDown size={14} style={{ opacity: 0.7 }} />
              </button>

              {/* Profile Dropdown */}
              {isProfileDropdownOpen && (
                <div style={{ position: 'absolute', top: '120%', right: 0, width: '200px', background: '#111119', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.6)', overflow: 'hidden', zIndex: 99 }}>
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', color: 'var(--text-main)', textDecoration: 'none', transition: 'var(--transition-fast)', fontSize: '14px' }}
                    className="dropdown-item"
                  >
                    <User size={16} /> Profile
                  </Link>
                  <Link
                    to="/profile?tab=history"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', color: 'var(--text-main)', textDecoration: 'none', transition: 'var(--transition-fast)', fontSize: '14px' }}
                    className="dropdown-item"
                  >
                    <History size={16} /> Watch History
                  </Link>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
                  <button
                    onClick={() => {
                      logout();
                      setIsProfileDropdownOpen(false);
                      navigate('/');
                    }}
                    style={{ width: '100%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', color: '#ef4444', textAlign: 'left', cursor: 'pointer', fontSize: '14px', transition: 'var(--transition-fast)' }}
                    className="dropdown-item logout"
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="btn-primary" style={{ padding: '8px 18px', fontSize: '14px', borderRadius: '20px' }}>
              Sign In
            </Link>
          )}

          {/* MOBILE MENU TOGGLE */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-toggle"
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'none' }}
          >
            {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </nav>
      </div>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer" style={{ position: 'fixed', top: '70px', left: 0, right: 0, bottom: 0, background: '#0a0a0f', padding: '24px', zIndex: 98, display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
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
        .nav-link {
          position: relative;
          padding: 6px 0;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background-color: var(--color-primary);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateX(-50%);
        }
        .nav-link:hover::after {
          width: 100%;
        }
        .nav-link:hover { color: var(--color-primary) !important; }
        .dropdown-item:hover { background: rgba(255,255,255,0.05); }
        .dropdown-item.logout:hover { background: rgba(239, 68, 68, 0.08); }
        .search-form:focus-within { border-color: var(--color-primary) !important; box-shadow: var(--glow-shadow); }
        .suggestion-item:hover { background: rgba(255,255,255,0.04); }
      `}</style>
    </header>
  );
};
