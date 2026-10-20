import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AnimeCard } from '../components/AnimeCard';
import type { AnimeData } from '../components/AnimeCard';
import { Film, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export const AnimeMovies: React.FC = () => {
  const [moviesList, setMoviesList] = useState<AnimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedDub, setSelectedDub] = useState<'all' | 'dub' | 'hindi'>('all');
  const [sortBy, setSortBy] = useState('score');
  const [genres, setGenres] = useState<string[]>([]);

  useEffect(() => {
    document.title = 'Anime Movies - Stream English & Hindi Dubbed Anime Films Free | AniVerse';
    const fetchGenres = async () => {
      try {
        const res = await axios.get('/api/anime/genres');
        setGenres(res.data.genres || []);
      } catch (err) {
        console.error('Error fetching genres:', err);
      }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('contentType', 'movie');
        params.append('page', String(page));
        params.append('limit', '18');
        if (selectedGenre) params.append('genre', selectedGenre);
        if (selectedDub === 'dub') params.append('hasDub', 'true');
        if (selectedDub === 'hindi') params.append('hasHindi', 'true');
        if (sortBy === 'latest') params.append('sort', 'latest');
        if (sortBy === 'year') params.append('sort', 'year');

        const res = await axios.get(`/api/anime?${params.toString()}`);
        setMoviesList(res.data.animeList || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } catch (err) {
        console.error('Error fetching movies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [page, selectedGenre, selectedDub, sortBy]);

  return (
    <div className="app-container" style={{ padding: '30px 24px', color: '#fff' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
            <Film size={22} style={{ color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, margin: 0 }}>
              Anime Movies Catalog
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0' }}>
              Discover 200 cinematic anime feature films, Studio Ghibli legends, franchise blockbusters, and Makoto Shinkai masterworks.
            </p>
          </div>
        </div>

        {/* CONTROLS & DUB FILTER PILLS */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setSelectedDub('all'); setPage(1); }}
            className={`nm-pill ${selectedDub === 'all' ? 'active' : ''}`}
            style={{ padding: '7px 16px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
          >
            All Audio
          </button>
          <button
            onClick={() => { setSelectedDub('dub'); setPage(1); }}
            className={`nm-pill ${selectedDub === 'dub' ? 'active' : ''}`}
            style={{ padding: '7px 16px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🎙️ English Dubbed
          </button>
          <button
            onClick={() => { setSelectedDub('hindi'); setPage(1); }}
            className={`nm-pill ${selectedDub === 'hindi' ? 'active' : ''}`}
            style={{ padding: '7px 16px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🇮🇳 Hindi Dubbed
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="nm-card" style={{ padding: '14px 20px', borderRadius: '14px', marginBottom: '26px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Filter size={16} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1' }}>Filters:</span>
          
          <select
            value={selectedGenre}
            onChange={(e) => { setSelectedGenre(e.target.value); setPage(1); }}
            style={{ background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '6px 12px', color: '#fff', fontSize: '12px', outline: 'none' }}
          >
            <option value="">All Genres</option>
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            style={{ background: '#10121d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '6px 12px', color: '#fff', fontSize: '12px', outline: 'none' }}
          >
            <option value="score">Highest Rated</option>
            <option value="latest">Recently Added</option>
            <option value="year">Release Year</option>
          </select>
        </div>
      </div>

      {/* GRID */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ height: '280px', borderRadius: '12px' }} className="shimmer" />
          ))}
        </div>
      ) : moviesList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
          <h3>No anime movies found matching current filters.</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '22px' }}>
          {moviesList.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '40px' }}>
          <button
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page <= 1}
            className="nm-pill"
            style={{ padding: '8px 16px', border: 'none', color: page <= 1 ? '#475569' : '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ChevronLeft size={16} /> Previous
          </button>

          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
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
