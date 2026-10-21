import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{ background: '#08070B', borderTop: '1px solid #292938', padding: '60px 24px 30px', marginTop: '60px', position: 'relative' }}>
      <div className="app-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '40px' }}>
        
        {/* Brand Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#fff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '24px', letterSpacing: '0.04em', color: '#ffffff', lineHeight: 1 }}>
                ANI<span style={{ color: 'var(--color-primary)' }}>VERSES</span>
              </span>
              <Sparkles size={16} color="var(--color-primary)" />
            </div>
            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.24em', color: 'var(--text-muted)', marginTop: '3px', textTransform: 'uppercase' }}>
              Anime Beyond Borders
            </span>
          </Link>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.7' }}>
            ANIVERSES is a premium anime discovery and streaming platform featuring verified schedules, live countdowns, multi-audio translations, and a cinematic viewing experience.
          </p>
        </div>

        {/* Navigation Links */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: '#fff', marginBottom: '18px', fontWeight: 700 }}>Discovery</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <li><Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="footer-link">Home</Link></li>
            <li><Link to="/discover" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="footer-link">Explore Catalogue</Link></li>
            <li><Link to="/schedule" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="footer-link">Weekly Episode Schedule</Link></li>
            <li><Link to="/running" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="footer-link">Running Anime</Link></li>
            <li><Link to="/genres" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="footer-link">Genres & Categories</Link></li>
          </ul>
        </div>

        {/* User Account */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: '#fff', marginBottom: '18px', fontWeight: 700 }}>My Account</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <li><Link to="/watchlist" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="footer-link">My Watchlist</Link></li>
            <li><Link to="/history" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="footer-link">Watch History</Link></li>
            <li><Link to="/profile" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="footer-link">Profile & Preferences</Link></li>
            <li><Link to="/auth" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="footer-link">Sign In / Register</Link></li>
          </ul>
        </div>

        {/* Legal & Notice */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: '#fff', marginBottom: '18px', fontWeight: 700 }}>Compliance & Legal</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.6', marginBottom: '12px' }}>
            ANIVERSES does not store copyrighted video files on its servers. All metadata is indexed via public APIs and authorized official embed links.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', fontWeight: 600 }}>
            <Shield size={14} /> Verified Legal Indexing
          </div>
        </div>
      </div>

      {/* Giant ANIVERSES Background Text */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', width: '100%', overflow: 'hidden' }}>
        <div className="giant-logo-container">
          {['A', 'N', 'I', 'V', 'E', 'R', 'S', 'E', 'S'].map((char, index) => (
            <span key={index} className="giant-logo-letter">
              {char}
            </span>
          ))}
        </div>
      </div>

      <div className="app-container" style={{ borderTop: '1px solid #1c1c28', marginTop: '20px', paddingTop: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px', paddingRight: '20px', paddingLeft: '20px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          &copy; {new Date().getFullYear()} ANIVERSES. Anime Beyond Borders. All rights reserved.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Crafted with <Heart size={12} color="var(--color-primary)" style={{ fill: 'var(--color-primary)' }} /> for anime fans worldwide.
        </p>
      </div>

      <style>{`
        .footer-link:hover { color: var(--color-primary) !important; padding-left: 3px; }
        .footer-link { transition: var(--transition-fast); }

        .giant-logo-container {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1vw;
          user-select: none;
          width: 100%;
          flex-wrap: nowrap;
          padding: 30px 0 10px;
          overflow: hidden;
        }

        .giant-logo-letter {
          font-family: var(--font-display);
          font-size: clamp(3rem, 12vw, 12rem);
          font-weight: 900;
          color: rgba(255, 255, 255, 0.04);
          cursor: pointer;
          transition: transform 0.3s ease, color 0.3s ease;
          display: inline-block;
          letter-spacing: -0.02em;
          line-height: 0.9;
        }

        .giant-logo-letter:hover {
          color: rgba(243, 46, 53, 0.25);
          transform: translateY(-8px);
        }
      `}</style>
    </footer>
  );
};
