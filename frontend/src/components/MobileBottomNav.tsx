import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Heart, User, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';
  const path = location.pathname;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {/* Home */}
      <Link
        to="/"
        className={`mobile-bottom-nav-item ${path === '/' ? 'active' : ''}`}
        aria-label="Home"
      >
        <Home size={20} />
        <span>Home</span>
      </Link>

      {/* Catalog */}
      <Link
        to="/search"
        className={`mobile-bottom-nav-item ${path.startsWith('/search') ? 'active' : ''}`}
        aria-label="Catalog"
      >
        <Compass size={20} />
        <span>Catalog</span>
      </Link>

      {/* Quick Theme Toggle */}
      <button
        onClick={toggleTheme}
        type="button"
        className="mobile-bottom-nav-item"
        aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
        title={`Toggle ${isDark ? 'Light' : 'Dark'} Mode`}
      >
        {isDark ? <Sun size={20} style={{ color: '#f59e0b' }} /> : <Moon size={20} style={{ color: '#8b5cf6' }} />}
        <span>{isDark ? 'Light' : 'Dark'}</span>
      </button>

      {/* Watchlist */}
      <Link
        to={isAuthenticated ? "/profile?tab=watchlist" : "/auth"}
        className={`mobile-bottom-nav-item ${path.includes('watchlist') ? 'active' : ''}`}
        aria-label="Watchlist"
      >
        <Heart size={20} />
        <span>Watchlist</span>
      </Link>

      {/* Profile / Sign In */}
      <Link
        to={isAuthenticated ? "/profile" : "/auth"}
        className={`mobile-bottom-nav-item ${path === '/profile' || path === '/auth' ? 'active' : ''}`}
        aria-label={isAuthenticated ? "Profile" : "Sign In"}
      >
        <User size={20} />
        <span>{isAuthenticated ? 'Profile' : 'Sign In'}</span>
      </Link>
    </nav>
  );
};
