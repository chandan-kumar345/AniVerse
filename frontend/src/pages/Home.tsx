import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HeroSlider } from '../components/HeroSlider';
import { AnimeSlider } from '../components/AnimeSlider';
import { LatestUpdatesSection } from '../components/LatestUpdatesSection';
import { SectionWisePanels } from '../components/SectionWisePanels';
import { EstimatedSchedule } from '../components/EstimatedSchedule';
import { AZListSection } from '../components/AZListSection';
import type { AnimeData } from '../components/AnimeCard';

export const Home: React.FC = () => {
  const [trending, setTrending] = useState<AnimeData[]>([]);
  const [popular, setPopular] = useState<AnimeData[]>([]);
  const [topTen, setTopTen] = useState<AnimeData[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<AnimeData[]>([]);
  const [movies, setMovies] = useState<AnimeData[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [newRelease, setNewRelease] = useState<AnimeData[]>([]);
  const [newAdded, setNewAdded] = useState<AnimeData[]>([]);
  const [justCompleted, setJustCompleted] = useState<AnimeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [
          trendingRes,
          popularRes,
          topTenRes,
          moviesRes,
          genresRes,
          newReleaseRes,
          newAddedRes,
          justCompletedRes
        ] = await Promise.all([
          axios.get('/api/anime/trending'),
          axios.get('/api/anime/popular'),
          axios.get('/api/anime/top-ten'),
          axios.get('/api/anime?type=MOVIE&limit=12'),
          axios.get('/api/anime/genres'),
          axios.get('/api/anime?status=Currently Airing&limit=5'),
          axios.get('/api/anime?sort=latest&limit=5'),
          axios.get('/api/anime?status=Finished Airing&limit=5')
        ]);

        // Query AniList for top 35 popular releasing shows (airing right now in market!)
        let liveUpdatesList: AnimeData[] = [];
        try {
          const aniListResponse = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              query: `
                query {
                  Page(page: 1, perPage: 35) {
                    media(status: RELEASING, type: ANIME, sort: POPULARITY_DESC) {
                      id
                      title {
                        romaji
                        english
                        native
                      }
                      coverImage {
                        extraLarge
                        large
                      }
                      bannerImage
                      description
                      averageScore
                      format
                      status
                      startDate {
                        year
                      }
                      duration
                      genres
                      studios(isMain: true) {
                        nodes {
                          name
                        }
                      }
                      nextAiringEpisode {
                        airingAt
                        episode
                      }
                    }
                  }
                }
              `
            })
          });

          const aniListJson = await aniListResponse.json();
          const releasingMedia = aniListJson.data?.Page?.media || [];

          liveUpdatesList = releasingMedia.map((media: any) => {
            const title = media.title.english || media.title.romaji || media.title.native;
            const cleanTitle = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
            // Find local match
            const localMatch = (trendingRes.data.trending || [])
              .concat(popularRes.data.popular || [])
              .find((local: any) => {
                const localT = cleanTitle(local.title);
                const romajiT = cleanTitle(media.title.romaji || '');
                const englishT = cleanTitle(media.title.english || '');
                return localT === romajiT || localT === englishT;
              });

            return {
              id: localMatch ? localMatch.id : `anilist-${media.id}`,
              slug: localMatch ? localMatch.slug : `search?q=${encodeURIComponent(title)}`,
              title,
              englishTitle: media.title.english,
              description: media.description ? media.description.replace(/<[^>]*>/g, '') : 'No description available.',
              posterImage: media.coverImage.extraLarge || media.coverImage.large,
              bannerImage: media.bannerImage || media.coverImage.extraLarge,
              score: media.averageScore ? media.averageScore / 10 : 7.5,
              type: media.format || 'TV',
              status: 'Currently Airing',
              releasedYear: media.startDate?.year || 2026,
              duration: media.duration ? `${media.duration} min` : '24 min',
              genres: media.genres ? media.genres.join(', ') : 'Anime',
              studio: media.studios?.nodes[0]?.name || 'Unknown',
              nextAiringEpisode: media.nextAiringEpisode,
            };
          });
        } catch (aniListErr) {
          console.error('Error fetching live updates from AniList:', aniListErr);
          // Fallback to local DB list if AniList fails
          const fallbackRes = await axios.get('/api/anime?sort=latest&limit=35');
          liveUpdatesList = fallbackRes.data.animeList || [];
        }

        setTrending(trendingRes.data.trending || []);
        setPopular(popularRes.data.popular || []);
        setTopTen(topTenRes.data.topTen || []);
        setLatestUpdates(liveUpdatesList);
        setMovies(moviesRes.data.animeList || []);
        setGenres(genresRes.data.genres || []);
        setNewRelease(newReleaseRes.data.animeList || []);
        setNewAdded(newAddedRes.data.animeList || []);
        setJustCompleted(justCompletedRes.data.animeList || []);
      } catch (err) {
        console.error('Error fetching home page data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();

    // Auto-update home data every 60 seconds
    const interval = setInterval(fetchHomeData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.title = "AniVerse - Watch Free Anime Online in HD (No Ads) - Aniwave Alternative";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Stream high-definition popular anime series like Bleach TYBW, Demon Slayer, Jujutsu Kaisen, and One Piece online for free on AniVerse with custom HTML5 player, ad-blocked iframe servers, and dynamic nested comments.');
    }
  }, []);

  if (loading) {
    return (
      <div className="app-container" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Banner Skeleton */}
        <div style={{ height: '600px', width: '100%', borderRadius: '16px' }} className="shimmer" />
        {/* Row Skeletons */}
        <div style={{ display: 'flex', gap: '20px', overflow: 'hidden' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ flex: '1 0 180px', height: '270px', borderRadius: '8px' }} className="shimmer" />
          ))}
        </div>
      </div>
    );
  }

  // To re-order sections, simply swap the indices or positions below.
  return (
    <div className="app-container" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. HERO SPOTLIGHT SLIDER */}
      <HeroSlider animeList={topTen} />

      {/* 2. TRENDING NOW SLIDER */}
      <AnimeSlider title="Trending Now" animeList={trending} showCountdown={false} />

      {/* 3. LATEST EPISODE UPDATES & SIDEBAR */}
      <LatestUpdatesSection 
        latestUpdates={latestUpdates} 
        topTen={topTen} 
        genres={genres} 
      />

      {/* 3.5. ANIME MOVIES SLIDER */}
      <AnimeSlider title="Anime Movies" animeList={movies} showCountdown={false} />

      {/* 4. MOST POPULAR SLIDER */}
      <AnimeSlider title="Most Popular" animeList={popular} showCountdown={false} />

      {/* 5. NEW RELEASE / NEW ADDED / JUST COMPLETED PANELS */}
      <SectionWisePanels 
        newRelease={newRelease} 
        newAdded={newAdded} 
        justCompleted={justCompleted} 
      />

      {/* 6. ESTIMATED AIRING SCHEDULE */}
      <EstimatedSchedule animeList={trending.concat(popular)} />

      {/* 7. A-Z ALPHABET LISTING PANEL */}
      <AZListSection />

      <style>{`
        .genre-item-link:hover { background: var(--color-primary) !important; color: #fff !important; box-shadow: var(--glow-shadow); }
        .view-all-link:hover { color: var(--color-primary-hover) !important; }
        
        .section-list-item:hover .section-item-title { color: var(--color-primary) !important; }
        .section-list-item:hover .section-item-thumb { transform: scale(1.05); border-color: var(--color-primary) !important; }
        .section-item-thumb { transition: var(--transition-fast); }
        
        .az-item:hover { background: var(--color-primary) !important; border-color: var(--color-primary) !important; color: #fff !important; box-shadow: var(--glow-shadow); }

        @media (max-width: 992px) {
          .home-content-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
