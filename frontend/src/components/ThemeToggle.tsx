import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Neumorphic View`}
      className={`nm-theme-toggle-btn ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Neumorphic View`}
    >
      <div className="nm-toggle-track">
        <div className={`nm-toggle-slider ${isDark ? 'dark' : 'light'}`}>
          {isDark ? (
            <Moon size={13} style={{ color: '#c084fc' }} />
          ) : (
            <Sun size={13} style={{ color: '#f59e0b' }} />
          )}
        </div>
      </div>
      {showLabel && (
        <span className="toggle-label-text">
          {isDark ? 'Dark View' : 'Light View'}
        </span>
      )}
    </button>
  );
};
