import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AnimeCard, type AnimeData } from '../components/AnimeCard';
import { anilistService, type AniListMedia } from '../services/anilistService';
import { Search as SearchIcon, Filter, ChevronLeft, ChevronRight, SlidersHorizontal, Sparkles } from 'lucide-react';
import { AgeVerificationModal } from '../components/AgeVerificationModal';

export const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [animeList, setAnimeList] = useState<AnimeData[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Age verification state
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState<boolean>(() => {
    return localStorage.getItem('aniverse_age_verified') === 'true';
  });

  // Pagination states
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Query params
  const qParam = searchParams.get('q') || '';
  const genreParam = searchParams.get('genre') || '';
  const typeParam = searchParams.get('type') || '';
  const sortParam = searchParams.get('sort') || 'POPULARITY_DESC';
  const statusParam = searchParams.get('status') || '';
  const yearParam = searchParams.get('year') || '';
  const seasonParam = searchParams.get('season') || '';
  const pageParam = parseInt(searchParams.get('page') || '1');

  const [searchField, setSearchField] = useState(qParam);
  const [selectedGenre, setSelectedGenre] = useState(genreParam);
  const [selectedType, setSelectedType] = useState(typeParam);
  const [selectedSort, setSelectedSort] = useState(sortParam);
  const [selectedStatus, setSelectedStatus] = useState(statusParam);
  const [selectedYear, setSelectedYear] = useState(yearParam);
  const [selectedSeason, setSelectedSeason] = useState(seasonParam);

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Synchronize state with URL parameters
  useEffect(() => {
    setSearchField(qParam);
    setSelectedGenre(genreParam);
    setSelectedType(typeParam);
    setSelectedSort(sortParam);
    setSelectedStatus(statusParam);
    setSelectedYear(yearParam);
    setSelectedSeason(seasonParam);
    setCurrentPage(pageParam);
  }, [qParam, genreParam, typeParam, sortParam, statusParam, yearParam, seasonParam, pageParam]);

  // Document title
  useEffect(() => {
    const qText = qParam ? `for "${qParam}"` : genreParam ? `${genreParam} Anime` : 'Discover Anime';
    document.title = `${qText} | ANIVERSES`;
  }, [qParam, genreParam]);

  // Load genres
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const res = await axios.get('/api/anime/genres');
        if (res.data?.genres && res.data.genres.length > 0) {
          setGenres(res.data.genres);
          return;
        }
      } catch (_) {}
      setGenres(anilistService.getStandardGenres());
    };
    loadGenres();
  }, []);

  // Debounced search query & multi-source fetch
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const performSearch = async () => {
      try {
        // Intercept 18+ genre if unverified
        if (genreParam === '18+' && !isAgeVerified) {
          setIsAgeModalOpen(true);
          setAnimeList([]);
          setLoading(false);
          return;
        }

        // 1. Fetch from AniList GraphQL directly for complete global discovery
        const aniResult = await anilistService.search({
          search: qParam || undefined,
          genre: genreParam || undefined,
          year: yearParam ? parseInt(yearParam) : undefined,
          format: typeParam || undefined,
          season: (seasonParam as any) || undefined,
          status: statusParam === 'Currently Airing' ? 'RELEASING' : statusParam === 'Finished Airing' ? 'FINISHED' : undefined,
          sort: (sortParam as any) || 'POPULARITY_DESC',
          page: pageParam,
          perPage: 24,
        });

        if (aniResult && aniResult.media.length > 0 && isMounted) {
          const mapped: AnimeData[] = aniResult.media.map((m: AniListMedia) => {
            const title = m.title.english || m.title.romaji || m.title.native || 'Anime';
            const slug = m.slug || title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            return {
              id: String(m.id),
              slug,
              title,
              englishTitle: m.title.english,
              description: m.description ? m.description.replace(/<[^>]*>/g, '') : '',
              posterImage: m.coverImage?.extraLarge || m.coverImage?.large || '',
              bannerImage: m.bannerImage || m.coverImage?.extraLarge || '',
              score: m.averageScore ? m.averageScore / 10 : 7.8,
              type: m.format || 'TV',
              studio: m.studios?.nodes?.[0]?.name || 'Studio',
              status: m.status === 'RELEASING' ? 'Currently Airing' : 'Finished Airing',
              releasedYear: m.startDate?.year || 2024,
              duration: m.duration ? `${m.duration} min` : '24 min',
              genres: m.genres ? m.genres.join(', ') : 'Action',
              hasSub: true,
              hasDub: true,
            };
          });

          setAnimeList(mapped);
          setTotalPages(Math.min(50, Math.ceil(aniResult.pageInfo.total / 24) || 1));
          setLoading(false);
          return;
        }

        // 2. Fallback to local database search endpoint
        const queryParams = new URLSearchParams();
        if (qParam) queryParams.append('search', qParam);
        if (genreParam) queryParams.append('genre', genreParam);
        if (typeParam) queryParams.append('type', typeParam);
        if (statusParam) queryParams.append('status', statusParam);
        if (yearParam) queryParams.append('year', yearParam);
        queryParams.append('page', String(pageParam));
        queryParams.append('limit', '24');

        const res = await axios.get(`/api/anime?${queryParams.toString()}`);
        if (isMounted) {
          setAnimeList(res.data.animeList || []);
          setTotalPages(res.data.pagination?.totalPages || 1);
        }
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 150);
    return () => {
      clearTimeout(timer);
      isMounted = false;
    };
  }, [qParam, genreParam, typeParam, sortParam, statusParam, yearParam, seasonParam, pageParam, isAgeVerified]);

  const applyFilters = (targetPage = 1) => {
    if (selectedGenre === '18+' && !isAgeVerified) {
      setIsAgeModalOpen(true);
      return;
    }

    const newParams: Record<string, string> = {};
    if (searchField.trim()) newParams.q = searchField.trim();
    if (selectedGenre) newParams.genre = selectedGenre;
    if (selectedType) newParams.type = selectedType;
    if (selectedSort && selectedSort !== 'POPULARITY_DESC') newParams.sort = selectedSort;
    if (selectedStatus) newParams.status = selectedStatus;
    if (selectedYear) newParams.year = selectedYear;
    if (selectedSeason) newParams.season = selectedSeason;
    if (targetPage > 1) newParams.page = String(targetPage);

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
    setSelectedSort('POPULARITY_DESC');
    setSelectedStatus('');
    setSelectedYear('');
    setSelectedSeason('');
    setSearchParams({});
    setIsMobileFiltersOpen(false);
  };

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', padding: '36px 24px 80px 24px' }}>
      <div className="app-container">
        {/* HEADER BAR */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Discover Anime
              <Sparkles size={22} color="var(--color-primary)" />
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Explore the complete anime catalogue with deep genre, year, status and format filtering.
            </p>
          </div>

          {/* MOBILE FILTER TOGGLE */}
          <button
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="mobile-filter-btn"
            style={{
              display: 'none',
              background: '#12121A',
              border: '1px solid #292938',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <SlidersHorizontal size={15} /> Filters
          </button>
        </div>

        {/* 2-COLUMN LAYOUT: FILTERS SIDEBAR + RESULTS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '28px' }} className="search-layout-grid">
          {/* SIDEBAR FILTERS */}
          <aside
            style={{
              background: '#12121A',
              border: '1px solid #292938',
              borderRadius: '16px',
              padding: '22px',
              height: 'fit-content',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
            className={`search-sidebar ${isMobileFiltersOpen ? 'mobile-filters-open' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={15} color="var(--color-primary)" />
                <span>Filters</span>
              </div>
              <button
                onClick={clearFilters}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Reset All
              </button>
            </div>

            {/* Keyword Search Input */}
            <form onSubmit={handleSearchSubmit}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#08070B',
                  border: '1px solid #292938',
                  borderRadius: '8px',
                  padding: '6px 12px',
                }}
              >
                <input
                  type="text"
                  placeholder="Keyword search..."
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '13px' }}
                />
                <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>
                  <SearchIcon size={14} />
                </button>
              </div>
            </form>

            {/* Genre Select */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Genre</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                style={{
                  width: '100%',
                  background: '#08070B',
                  border: '1px solid #292938',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="">All Genres</option>
                {genres.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Sort Select */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Sort By</label>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                style={{
                  width: '100%',
                  background: '#08070B',
                  border: '1px solid #292938',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="POPULARITY_DESC">Most Popular</option>
                <option value="TRENDING_DESC">Trending Now</option>
                <option value="SCORE_DESC">Highest Rated</option>
                <option value="START_DATE_DESC">Newest Release</option>
                <option value="FAVOURITES_DESC">Top Favorites</option>
              </select>
            </div>

            {/* Format Select */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Format</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  width: '100%',
                  background: '#08070B',
                  border: '1px solid #292938',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="">All Formats</option>
                <option value="TV">TV Series</option>
                <option value="MOVIE">Movie</option>
                <option value="OVA">OVA</option>
                <option value="ONA">ONA</option>
                <option value="SPECIAL">Special</option>
              </select>
            </div>

            {/* Status Select */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Airing Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  width: '100%',
                  background: '#08070B',
                  border: '1px solid #292938',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value="">All Statuses</option>
                <option value="Currently Airing">Currently Airing</option>
                <option value="Finished Airing">Finished Airing</option>
              </select>
            </div>

            {/* Apply Action */}
            <button
              onClick={() => applyFilters(1)}
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                marginTop: '6px',
                boxShadow: '0 4px 14px var(--color-primary-glow)',
              }}
            >
              Apply Filters
            </button>
          </aside>

          {/* RESULTS CONTENT */}
          <main>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      aspectRatio: '2/3',
                      borderRadius: '12px',
                      background: '#12121A',
                      border: '1px solid #292938',
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                ))}
              </div>
            ) : animeList.length === 0 ? (
              <div
                style={{
                  background: '#12121A',
                  border: '1px solid #292938',
                  borderRadius: '16px',
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <SearchIcon size={40} color="var(--border-color)" style={{ marginBottom: '14px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                  No Anime Found
                </h3>
                <p style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
                  We couldn't find any anime matching your criteria. Try adjusting your keyword or filters.
                </p>
                <button
                  onClick={clearFilters}
                  style={{
                    marginTop: '18px',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                  {animeList.map((anime) => (
                    <AnimeCard key={anime.id} anime={anime} />
                  ))}
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '40px' }}>
                    <button
                      onClick={() => applyFilters(Math.max(1, currentPage - 1))}
                      disabled={currentPage <= 1}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: '#12121A',
                        border: '1px solid #292938',
                        color: currentPage <= 1 ? 'var(--text-muted)' : '#fff',
                        cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      <ChevronLeft size={16} /> Prev
                    </button>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => applyFilters(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage >= totalPages}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: '#12121A',
                        border: '1px solid #292938',
                        color: currentPage >= totalPages ? 'var(--text-muted)' : '#fff',
                        cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      <AgeVerificationModal
        isOpen={isAgeModalOpen}
        onConfirm={() => {
          localStorage.setItem('aniverse_age_verified', 'true');
          setIsAgeVerified(true);
          setIsAgeModalOpen(false);
        }}
        onDecline={() => {
          setIsAgeModalOpen(false);
          setSelectedGenre('');
          applyFilters(1);
        }}
      />

      <style>{`
        @media (max-width: 860px) {
          .search-layout-grid {
            grid-template-columns: 1fr !important;
          }
          .mobile-filter-btn {
            display: inline-flex !important;
          }
          .search-sidebar {
            display: none !important;
          }
          .search-sidebar.mobile-filters-open {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};
