import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AnimeCard } from '../components/AnimeCard';
import type { AnimeData } from '../components/AnimeCard';
import { Search as SearchIcon, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';

export const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [animeList, setAnimeList] = useState<AnimeData[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter form states (tied to URL search params)
  const qParam = searchParams.get('q') || '';
  const genreParam = searchParams.get('genre') || '';
  const typeParam = searchParams.get('type') || '';
  const statusParam = searchParams.get('status') || '';
  const yearParam = searchParams.get('year') || '';
  const letterParam = searchParams.get('letter') || '';
  const pageParam = parseInt(searchParams.get('page') || '1');

  const [searchField, setSearchField] = useState(qParam);
  const [selectedGenre, setSelectedGenre] = useState(genreParam);
  const [selectedType, setSelectedType] = useState(typeParam);
  const [selectedStatus, setSelectedStatus] = useState(statusParam);
  const [selectedYear, setSelectedYear] = useState(yearParam);

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Sync inputs with URL changes
  useEffect(() => {
    setSearchField(qParam);
    setSelectedGenre(genreParam);
    setSelectedType(typeParam);
    setSelectedStatus(statusParam);
    setSelectedYear(yearParam);
    setCurrentPage(pageParam);
  }, [qParam, genreParam, typeParam, statusParam, yearParam, pageParam, letterParam]);

  useEffect(() => {
    const qText = qParam ? `for "${qParam}"` : letterParam ? `starting with "${letterParam}"` : 'Catalog';
    document.title = `Search Anime ${qText} Online Free in HD - AniVerse`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', `Browse our catalog ${qText}. Filter by genre, format, released year, and airing status. Stream anime online free on AniVerse.`);
    }
  }, [qParam, letterParam]);

  // Load distinct genres list once
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await axios.get('/api/anime/genres');
        setGenres(res.data.genres || []);
      } catch (err) {
        console.error('Error fetching genres list:', err);
      }
    };
    fetchGenres();
  }, []);

  // Fetch results based on URL queries
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (qParam) queryParams.append('search', qParam);
        if (genreParam) queryParams.append('genre', genreParam);
        if (typeParam) queryParams.append('type', typeParam);
        if (statusParam) queryParams.append('status', statusParam);
        if (yearParam) queryParams.append('year', yearParam);
        if (letterParam) queryParams.append('letter', letterParam);
        queryParams.append('page', String(pageParam));
        queryParams.append('limit', '12');

        const res = await axios.get(`/api/anime?${queryParams.toString()}`);
        setAnimeList(res.data.animeList || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } catch (err) {
        console.error('Search query error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [qParam, genreParam, typeParam, statusParam, yearParam, pageParam, letterParam]);

  // Apply filters
  const applyFilters = (updatedPage?: number) => {
    const newParams: Record<string, string> = {};
    if (searchField) newParams.q = searchField;
    if (selectedGenre) newParams.genre = selectedGenre;
    if (selectedType) newParams.type = selectedType;
    if (selectedStatus) newParams.status = selectedStatus;
    if (selectedYear) newParams.year = selectedYear;

    const pageToUse = updatedPage !== undefined ? updatedPage : 1;
    if (pageToUse > 1) {
      newParams.page = String(pageToUse);
    }

    setSearchParams(newParams);
    setIsMobileFiltersOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(1);
  };

  const clearFilters = () => {
    setSearchField('');
    setSelectedGenre('');
    setSelectedType('');
    setSelectedStatus('');
    setSelectedYear('');
    setSearchParams({});
    setIsMobileFiltersOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      applyFilters(newPage);
    }
  };

  return (
    <div className="app-container" style={{ padding: '30px 20px', color: '#fff' }}>
      
      {/* HEADER TITLE */}
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, marginBottom: '24px', borderLeft: '4px solid var(--color-primary)', paddingLeft: '12px' }}>
        Anime Catalog
      </h2>

      {/* SEARCH / FILTERS BUTTONS FOR MOBILE */}
      <div className="mobile-filter-bar" style={{ display: 'none', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setIsMobileFiltersOpen(true)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
          <Filter size={16} /> Filters
        </button>
      </div>

      {/* MAIN LAYOUT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '30px' }} className="search-grid-layout">
        
        {/* FILTERS PANEL (LEFT SIDEBAR) */}
        <aside className={`filters-panel ${isMobileFiltersOpen ? 'mobile-open' : ''}`} style={{ background: '#12121c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Mobile close */}
          <div style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center' }} className="mobile-filter-header">
            <h3>Filters</h3>
            <button onClick={() => setIsMobileFiltersOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
          </div>

          {/* Search field */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0 10px' }}>
            <input
              type="text"
              placeholder="Keyword..."
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              style={{ flex: 1, background: 'none', border: 'none', padding: '10px 0', color: '#fff', outline: 'none', fontSize: '13px' }}
            />
            <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><SearchIcon size={16} /></button>
          </form>

          {/* Genre select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Genre</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              style={{ background: '#0e0e15', border: '1px solid rgba(255,255,255,0.08)', padding: '10px', color: '#fff', borderRadius: '8px', outline: 'none', fontSize: '13px' }}
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Format/Type select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Format</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ background: '#0e0e15', border: '1px solid rgba(255,255,255,0.08)', padding: '10px', color: '#fff', borderRadius: '8px', outline: 'none', fontSize: '13px' }}
            >
              <option value="">All Types</option>
              <option value="TV">TV</option>
              <option value="Movie">Movie</option>
              <option value="OVA">OVA</option>
              <option value="Special">Special</option>
            </select>
          </div>

          {/* Status select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Airing Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ background: '#0e0e15', border: '1px solid rgba(255,255,255,0.08)', padding: '10px', color: '#fff', borderRadius: '8px', outline: 'none', fontSize: '13px' }}
            >
              <option value="">All Statuses</option>
              <option value="Currently Airing">Currently Airing</option>
              <option value="Finished Airing">Finished Airing</option>
            </select>
          </div>

          {/* Year select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Released Year</label>
            <input
              type="number"
              placeholder="e.g. 2024"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{ background: '#0e0e15', border: '1px solid rgba(255,255,255,0.08)', padding: '10px', color: '#fff', borderRadius: '8px', outline: 'none', fontSize: '13px' }}
            />
          </div>

          {/* Filter action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={() => applyFilters(1)} className="btn-primary" style={{ flex: 1, padding: '10px 0', justifyContent: 'center', fontSize: '13px' }}>
              Filter
            </button>
            <button onClick={clearFilters} className="btn-secondary" style={{ flex: 1, padding: '10px 0', justifyContent: 'center', fontSize: '13px' }}>
              Reset
            </button>
          </div>
        </aside>

        {/* RESULTS GRID (RIGHT SECTION) */}
        <div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} style={{ height: '280px', width: '100%', borderRadius: '8px' }} className="shimmer" />
              ))}
            </div>
          ) : animeList.length === 0 ? (
            <div style={{ textTransform: 'none', background: '#12121c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <h3>No results matching your filters.</h3>
              <p style={{ marginTop: '8px', fontSize: '14px' }}>Try resetting filters or searching another keyword.</p>
              <button onClick={clearFilters} className="btn-primary" style={{ marginTop: '20px', padding: '8px 24px', fontSize: '13px' }}>
                Reset Catalog
              </button>
            </div>
          ) : (
            <>
              {/* Anime list grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px 20px' }}>
                {animeList.map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '50px' }}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{ padding: '8px 14px', opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                    className="btn-secondary"
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Page <span style={{ color: '#fff' }}>{currentPage}</span> of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{ padding: '8px 14px', opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                    className="btn-secondary"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .search-grid-layout { grid-template-columns: 1fr !important; }
          .mobile-filter-bar { display: flex !important; }
          .filters-panel {
            position: fixed;
            top: 0;
            left: -320px;
            bottom: 0;
            width: 280px;
            z-index: 1000;
            border-radius: 0 !important;
            transition: left 0.3s ease;
            box-shadow: 10px 0 30px rgba(0,0,0,0.8);
          }
          .filters-panel.mobile-open { left: 0; }
          .mobile-filter-header { display: flex !important; margin-bottom: 10px; }
        }
      `}</style>
    </div>
  );
};
