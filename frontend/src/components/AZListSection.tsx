import React from 'react';
import { Link } from 'react-router-dom';

export const AZListSection: React.FC = () => {
  return (
    <div className="nm-card" style={{ padding: '24px', margin: '24px 0 10px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px', marginBottom: '18px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center' }}>
          <span className="section-indicator" />
          A-Z List
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sort and find anime alphabetically from A to Z</p>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <Link 
          to="/search" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: '#161828', 
            border: '1px solid rgba(255,255,255,0.06)', 
            boxShadow: '3px 3px 6px #08090f, -2px -2px 5px #202238',
            borderRadius: '8px', 
            minWidth: '44px', 
            height: '38px', 
            padding: '0 12px', 
            color: 'var(--text-main)', 
            fontSize: '13px', 
            fontWeight: 700, 
            textDecoration: 'none', 
            transition: 'var(--transition-fast)' 
          }} 
          className="az-item"
        >
          All
        </Link>
        <Link 
          to="/search?letter=%23" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: '#161828', 
            border: '1px solid rgba(255,255,255,0.06)', 
            boxShadow: '3px 3px 6px #08090f, -2px -2px 5px #202238',
            borderRadius: '8px', 
            width: '38px', 
            height: '38px', 
            color: 'var(--text-main)', 
            fontSize: '13px', 
            fontWeight: 700, 
            textDecoration: 'none', 
            transition: 'var(--transition-fast)' 
          }} 
          className="az-item"
        >
          #
        </Link>
        {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => (
          <Link
            key={letter}
            to={`/search?letter=${letter}`}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              background: '#161828', 
              border: '1px solid rgba(255,255,255,0.06)', 
              boxShadow: '3px 3px 6px #08090f, -2px -2px 5px #202238',
              borderRadius: '8px', 
              width: '38px', 
              height: '38px', 
              color: 'var(--text-main)', 
              fontSize: '13px', 
              fontWeight: 700, 
              textDecoration: 'none', 
              transition: 'var(--transition-fast)' 
            }}
            className="az-item"
          >
            {letter}
          </Link>
        ))}
      </div>
    </div>
  );
};
