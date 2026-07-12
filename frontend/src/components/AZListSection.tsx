import React from 'react';
import { Link } from 'react-router-dom';

export const AZListSection: React.FC = () => {
  return (
    <div style={{ background: '#110e16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', margin: '24px 0 10px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px', marginBottom: '14px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 800, color: '#fff' }}>A-Z List</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sort and find anime alphabetically from A to Z</p>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        <Link to="/search" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', minWidth: '40px', height: '36px', padding: '0 10px', color: 'var(--text-main)', fontSize: '13px', fontWeight: 600, textDecoration: 'none', transition: 'var(--transition-fast)' }} className="az-item">
          All
        </Link>
        <Link to="/search?letter=%23" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', width: '36px', height: '36px', color: 'var(--text-main)', fontSize: '13px', fontWeight: 600, textDecoration: 'none', transition: 'var(--transition-fast)' }} className="az-item">
          #
        </Link>
        {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => (
          <Link
            key={letter}
            to={`/search?letter=${letter}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', width: '36px', height: '36px', color: 'var(--text-main)', fontSize: '13px', fontWeight: 600, textDecoration: 'none', transition: 'var(--transition-fast)' }}
            className="az-item"
          >
            {letter}
          </Link>
        ))}
      </div>
    </div>
  );
};
