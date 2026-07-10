import React from 'react';
import { Link } from 'react-router-dom';
import { Tv, Heart, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{ background: '#07070a', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '60px 20px 30px', marginTop: '60px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px' }}>
        
        {/* About column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#fff' }}>
            <Tv size={28} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px' }}>
              BANKAI<span style={{ color: 'var(--color-primary)' }}>TV</span>
            </span>
          </Link>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
            Bankai TV is a premium anime streaming platform featuring high-definition playback, an interactive custom player, and a passionate social community.
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', transition: 'var(--transition-fast)' }} className="social-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/></svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', transition: 'var(--transition-fast)' }} className="social-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', transition: 'var(--transition-fast)' }} className="social-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/><polygon points="10 15 15 12 10 9"/></svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#fff', marginBottom: '20px', fontWeight: 600 }}>Quick Links</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            <li><Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'var(--transition-fast)' }} className="footer-link">Home</Link></li>
            <li><Link to="/search" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'var(--transition-fast)' }} className="footer-link">Catalog</Link></li>
            <li><Link to="/search?status=Currently+Airing" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'var(--transition-fast)' }} className="footer-link">Airing Anime</Link></li>
            <li><Link to="/search?type=Movie" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'var(--transition-fast)' }} className="footer-link">Anime Movies</Link></li>
          </ul>
        </div>

        {/* Community / Support */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#fff', marginBottom: '20px', fontWeight: 600 }}>Community</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            <li><Link to="/profile" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'var(--transition-fast)' }} className="footer-link">My Profile</Link></li>
            <li><Link to="/profile?tab=watchlist" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'var(--transition-fast)' }} className="footer-link">Watchlist</Link></li>
            <li><a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'var(--transition-fast)' }} className="footer-link">Discord Server</a></li>
            <li><a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'var(--transition-fast)' }} className="footer-link">Terms of Service</a></li>
          </ul>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '50px', paddingTop: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', maxWidth: '1400px', margin: '50px auto 0', paddingRight: '20px', paddingLeft: '20px' }}>
        <p style={{ color: 'var(--text-dark)', fontSize: '13px' }}>
          &copy; {new Date().getFullYear()} Bankai TV. All rights reserved. Built for anime fans.
        </p>
        <p style={{ color: 'var(--text-dark)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Made with <Heart size={12} style={{ color: 'var(--color-primary)' }} /> and <Shield size={12} style={{ color: 'var(--color-teal)' }} />
        </p>
      </div>

      <style>{`
        .footer-link:hover { color: var(--color-primary) !important; padding-left: 4px; }
        .social-icon:hover { color: var(--color-primary) !important; transform: scale(1.15); }
        .footer-link { display: inline-block; transition: var(--transition-fast); }
      `}</style>
    </footer>
  );
};
