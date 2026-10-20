import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AnimeCard } from '../components/AnimeCard';
import type { AnimeData } from '../components/AnimeCard';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export const LanguageFilterPage: React.FC = () => {
  const { lang } = useParams<{ lang: string }>();
  const isHindi = lang?.toLowerCase() === 'hindi';
  const languageTitle = isHindi ? 'Hindi-Dubbed' : 'English-Dubbed';
  const languageFlag = isHindi ? '🇮🇳' : '🎙️';

  const [list, setList] = useState<AnimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contentType, setContentType] = useState('');
  const [genre, setGenre] = useState('');
  const [genres, setGenres] = useState<string[]>([]);

  useEffect(() => {
    document.title = `${languageTitle} Anime & Movies - AniVerse`;
    const fetchGenres = async () => {
      try {
        const res = await axios.get('/api/anime/genres');
        setGenres(res.data.genres || []);
      } catch (err) {
        console.error('Error fetching genres:', err);
      }
    };
    fetchGenres();
  }, [languageTitle]);

  useEffect(() => {
    const fetchDubs = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (isHindi) params.append('hasHindi', 'true');
        else params.append('hasDub', 'true');
        if (contentType) params.append('contentType', contentType);
        if (genre) params.append('genre', genre);
        params.append('page', String(page));
        params.append('limit', '18');

        const res = await axios.get(`/api/anime?${params.toString()}`);
        setList(res.data.animeList || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } catch (err) {
        console.error('Error fetching dubbed anime:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDubs();
  }, [lang, isHindi, contentType, genre, page]);

  return (
    <div className="app-container" style={{ padding: '30px 24px', color: '#fff' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: isHindi ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            padding: '12px',
            borderRadius: '12px',
            display: 'flex',
            fontSize: '22px'
          }}>
            {languageFlag}
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, margin: 0 }}>
              {languageTitle} Anime Library
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' }}>
              Only showing verified {languageTitle} anime series and movies with legitimate authorized audio tracks.
            </p>
          </div>
        </div>

        {/* SWITCH LANGUAGE */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            to="/dubs/english"
            className={`nm-pill ${!isHindi ? 'active' : ''}`}
            style={{ padding: '8px 16px', textDecoration: 'none', color: '#fff', fontSize: '12px', fontWeight: 700 }}
          >
            🎙️ English Dubbed
          </Link>
          <Link
            to="/dubs/hindi"
            className={`nm-pill ${isHindi ? 'active' : ''}`}
            style={{ padding: '8px 16px', textDecoration: 'none', color: '#fff', fontSize: '12px', fontWeight: 700 }}
          >
            🇮🇳 Hindi Dubbed
          </Link>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="nm-card" style={{ padding: '14px 20px', borderRadius: '14px', marginBottom: '26px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
        <Filter size={16} style={{ color: isHindi ? '#f59e0b' : '#06b6d4' }} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1' }}>Filters:</span>

        <select
          value={contentType}
          onChange={(e) => { setContentType(e.target.value); setPage(1); }}
          style={{ background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '6px 12px', color: '#fff', fontSize: '12px', outline: 'none' }}
        >
          <option value="">All Formats (Series + Movies)</option>
          <option value="series">Series Only</option>
          <option value="movie">Movies Only</option>
        </select>

        <select
          value={genre}
          onChange={(e) => { setGenre(e.target.value); setPage(1); }}
          style={{ background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '6px 12px', color: '#fff', fontSize: '12px', outline: 'none' }}
        >
          <option value="">All Genres</option>
          {genres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* GRID */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ height: '280px', borderRadius: '12px' }} className="shimmer" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
          <h3>No {languageTitle} titles found matching current filters.</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '22px' }}>
          {list.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      )}

      {/* PAGINATION */}
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
