import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AnimeCard } from '../components/AnimeCard';
import type { AnimeData } from '../components/AnimeCard';
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

export const PopularAnime: React.FC = () => {
  const [list, setList] = useState<AnimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    document.title = 'Most Popular & Top-Rated Anime - AniVerse';
    const fetchPopular = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/anime?sort=score&page=${page}&limit=18`);
        setList(res.data.animeList || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } catch (err) {
        console.error('Error fetching popular anime:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPopular();
  }, [page]);

  return (
    <div className="app-container" style={{ padding: '30px 24px', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <div style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
          <TrendingUp size={22} style={{ color: '#fff' }} />
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, margin: 0 }}>
            Most Popular Anime
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' }}>
            Top-rated anime series and movies ranked by global community scores.
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
