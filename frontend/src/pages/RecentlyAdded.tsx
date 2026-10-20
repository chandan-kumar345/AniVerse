import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AnimeCard } from '../components/AnimeCard';
import type { AnimeData } from '../components/AnimeCard';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export const RecentlyAdded: React.FC = () => {
  const [list, setList] = useState<AnimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    document.title = 'Recently Added Anime & Movies - AniVerse';
    const fetchRecent = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/anime?sort=latest&page=${page}&limit=18`);
        setList(res.data.animeList || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } catch (err) {
        console.error('Error fetching recently added:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, [page]);

  return (
    <div className="app-container" style={{ padding: '30px 24px', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <div style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
          <Clock size={22} style={{ color: '#fff' }} />
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, margin: 0 }}>
            Recently Added Anime
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' }}>
            Latest series and movies ingested into the AniVerse library.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ height: '280px', borderRadius: '12px' }} className="shimmer" />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '22px' }}>
          {list.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '40px' }}>
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page <= 1}
            className="nm-pill"
            style={{ padding: '8px 16px', border: 'none', color: page <= 1 ? '#475569' : '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages}
            className="nm-pill"
            style={{ padding: '8px 16px', border: 'none', color: page >= totalPages ? '#475569' : '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
