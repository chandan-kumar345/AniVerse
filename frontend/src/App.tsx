import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { AnimeDetail } from './pages/AnimeDetail';
import { Watch } from './pages/Watch';
import { Search } from './pages/Search';
import { Auth } from './pages/Auth';
import { Profile } from './pages/Profile';
import { AnimeSeries } from './pages/AnimeSeries';
import { AnimeMovies } from './pages/AnimeMovies';
import { Genres } from './pages/Genres';
import { RecentlyAdded } from './pages/RecentlyAdded';
import { PopularAnime } from './pages/PopularAnime';
import { LanguageFilterPage } from './pages/LanguageFilterPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { WatchHistoryPage } from './pages/WatchHistoryPage';
import { Admin } from './pages/Admin';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)' }}>
          {/* HEADER NAV */}
          <Header />

          {/* MAIN PAGE RENDER */}
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/series" element={<AnimeSeries />} />
              <Route path="/movies" element={<AnimeMovies />} />
              <Route path="/genres" element={<Genres />} />
              <Route path="/recently-added" element={<RecentlyAdded />} />
              <Route path="/popular" element={<PopularAnime />} />
              <Route path="/watchlist" element={<WatchlistPage />} />
              <Route path="/history" element={<WatchHistoryPage />} />
              <Route path="/dubs/:lang" element={<LanguageFilterPage />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/anime/:slug" element={<AnimeDetail />} />
              <Route path="/watch/:slug/episode/:epNum" element={<Watch />} />
              <Route path="/search" element={<Search />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>

          {/* FOOTER */}
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
