import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/safe_text.dart';
import '../../core/widgets/anime_card.dart';
import '../../core/providers/app_providers.dart';
import '../../data/models/anime_model.dart';
import '../../data/seed/anime_seed_data.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  late PageController _spotlightController;
  int _currentSpotlightIndex = 0;
  Timer? _spotlightTimer;

  static const Map<String, String> manualBannerOverrides = {
    'one-piece': 'https://image.tmdb.org/t/p/original/v38qp4bySLTXYu3MF8r5GD51FN3.jpg',
    'one piece': 'https://image.tmdb.org/t/p/original/v38qp4bySLTXYu3MF8r5GD51FN3.jpg',
    'solo-leveling': 'https://image.tmdb.org/t/p/original/xMNH87maNLt9n2bMDYeI6db5VFm.jpg',
    'solo leveling': 'https://image.tmdb.org/t/p/original/xMNH87maNLt9n2bMDYeI6db5VFm.jpg',
    'solo-leveling-season-2-arise-from-the-shadow': 'https://image.tmdb.org/t/p/original/xMNH87maNLt9n2bMDYeI6db5VFm.jpg',
    'jujutsu-kaisen': 'https://image.tmdb.org/t/p/original/2otstbLfQ7MXuFt1X8MFOb4OIgd.jpg',
    'jujutsu kaisen': 'https://image.tmdb.org/t/p/original/2otstbLfQ7MXuFt1X8MFOb4OIgd.jpg',
    'jujutsu-kaisen-season-2': 'https://image.tmdb.org/t/p/original/qpin8cASXEVtwhzNsprHYFiOAGk.jpg',
    'jujutsu-kaisen-0': 'https://image.tmdb.org/t/p/original/qpin8cASXEVtwhzNsprHYFiOAGk.jpg',
    'demon-slayer': 'https://image.tmdb.org/t/p/original/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg',
    'demon slayer': 'https://image.tmdb.org/t/p/original/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg',
    'demon-slayer-kimetsu-no-yaiba': 'https://image.tmdb.org/t/p/original/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg',
    'demon-slayer-kimetsu-no-yaiba-hashira-training-arc': 'https://image.tmdb.org/t/p/original/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg',
    'demon-slayer-kimetsu-no-yaiba-the-movie-mugen-train': 'https://image.tmdb.org/t/p/original/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg',
    'bleach': 'https://image.tmdb.org/t/p/original/o0NsbcIvsllg6CJX0FBFY8wWbsn.jpg',
    'bleach-thousand-year-blood-war': 'https://image.tmdb.org/t/p/original/o0NsbcIvsllg6CJX0FBFY8wWbsn.jpg',
    'attack-on-titan': 'https://image.tmdb.org/t/p/original/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg',
    'attack on titan': 'https://image.tmdb.org/t/p/original/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg',
    'attack-on-titan-the-final-season': 'https://image.tmdb.org/t/p/original/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg',
    'chainsaw-man': 'https://image.tmdb.org/t/p/original/5DUMPBSnHOZsbBv81GFXZXvDpo6.jpg',
    'chainsaw man': 'https://image.tmdb.org/t/p/original/5DUMPBSnHOZsbBv81GFXZXvDpo6.jpg',
    'dan-da-dan': 'https://image.tmdb.org/t/p/original/uNTrRKIOyKYISthoeizghtXPEOK.jpg',
    'dan da dan': 'https://image.tmdb.org/t/p/original/uNTrRKIOyKYISthoeizghtXPEOK.jpg',
    'dandadan': 'https://image.tmdb.org/t/p/original/uNTrRKIOyKYISthoeizghtXPEOK.jpg',
    'naruto': 'https://image.tmdb.org/t/p/original/z0YhJvomqedHF85bplUJEotkN5l.jpg',
    'naruto-shippuden': 'https://image.tmdb.org/t/p/original/z0YhJvomqedHF85bplUJEotkN5l.jpg',
    'naruto shippuden': 'https://image.tmdb.org/t/p/original/z0YhJvomqedHF85bplUJEotkN5l.jpg',
    'dragon-ball-super': 'https://image.tmdb.org/t/p/original/qA2UwUQbj05aeBMCuC0mHSQ4loE.jpg',
    'dragon ball super': 'https://image.tmdb.org/t/p/original/qA2UwUQbj05aeBMCuC0mHSQ4loE.jpg',
    'dragon-ball-z': 'https://image.tmdb.org/t/p/original/ydf1CeiBLfdxiyNTpskM0802TKl.jpg',
    'dragon ball z': 'https://image.tmdb.org/t/p/original/ydf1CeiBLfdxiyNTpskM0802TKl.jpg',
    'hunter-x-hunter': 'https://image.tmdb.org/t/p/original/bFKKyCI89Xq98Gul8cGox8K3sZa.jpg',
    'hunter-x-hunter-2011': 'https://image.tmdb.org/t/p/original/bFKKyCI89Xq98Gul8cGox8K3sZa.jpg',
    'hunter x hunter': 'https://image.tmdb.org/t/p/original/bFKKyCI89Xq98Gul8cGox8K3sZa.jpg',
    'blue-lock': 'https://image.tmdb.org/t/p/original/seMRyWVwIVBWbC9xaMzDMZJ8fUH.jpg',
    'blue lock': 'https://image.tmdb.org/t/p/original/seMRyWVwIVBWbC9xaMzDMZJ8fUH.jpg',
    'black-clover': 'https://image.tmdb.org/t/p/original/qu9epTZh29fGUkY7ZYc9PVsv0Ig.jpg',
    'black clover': 'https://image.tmdb.org/t/p/original/qu9epTZh29fGUkY7ZYc9PVsv0Ig.jpg',
    'one-punch-man': 'https://image.tmdb.org/t/p/original/s0w8JbuNNxL1YgaHeDWih12C3jG.jpg',
    'one punch man': 'https://image.tmdb.org/t/p/original/s0w8JbuNNxL1YgaHeDWih12C3jG.jpg',
    'kaiju-no-8': 'https://image.tmdb.org/t/p/original/htGeuCcNhlBe8GTx3izKOsd8frw.jpg',
    'kaiju no. 8': 'https://image.tmdb.org/t/p/original/htGeuCcNhlBe8GTx3izKOsd8frw.jpg',
    'my-hero-academia': 'https://image.tmdb.org/t/p/original/3ILMlmC30QUnYkY3XEBOyJ82Dqu.jpg',
    'my hero academia': 'https://image.tmdb.org/t/p/original/3ILMlmC30QUnYkY3XEBOyJ82Dqu.jpg',
    'spy-x-family': 'https://image.tmdb.org/t/p/original/lysUnU6V0VfcthDbviuVlIqgHOR.jpg',
    'spy x family': 'https://image.tmdb.org/t/p/original/lysUnU6V0VfcthDbviuVlIqgHOR.jpg',
    'death-note': 'https://image.tmdb.org/t/p/original/z8IPicmEKXUO4I2UDdMEqw7RqOE.jpg',
    'death note': 'https://image.tmdb.org/t/p/original/z8IPicmEKXUO4I2UDdMEqw7RqOE.jpg',
    'fullmetal-alchemist-brotherhood': 'https://image.tmdb.org/t/p/original/2UG177tWHy7xRmMKWJHB7nAUmKd.jpg',
    'fullmetal alchemist': 'https://image.tmdb.org/t/p/original/2UG177tWHy7xRmMKWJHB7nAUmKd.jpg',
    'your-name': 'https://image.tmdb.org/t/p/original/mMtUybQ6hL24FXo0F3Z4j2KG7kZ.jpg',
    'your name': 'https://image.tmdb.org/t/p/original/mMtUybQ6hL24FXo0F3Z4j2KG7kZ.jpg',
  };

  static String getHeroBanner(AnimeModel anime) {
    final s = anime.slug.toLowerCase();
    final t = anime.title.toLowerCase();
    if (manualBannerOverrides.containsKey(s)) return manualBannerOverrides[s]!;
    if (manualBannerOverrides.containsKey(t)) return manualBannerOverrides[t]!;
    for (final entry in manualBannerOverrides.entries) {
      if (s.contains(entry.key) || t.contains(entry.key)) {
        return entry.value;
      }
    }
    return anime.displayBanner.isNotEmpty ? anime.displayBanner : anime.displayPoster;
  }

  static const List<String> _quickGenres = [
    'All',
    'Action',
    'Romance',
    'Fantasy',
    'Comedy',
    'Adventure',
    'Isekai',
    'Shonen',
    'Sci-Fi',
    '18+',
  ];

  @override
  void initState() {
    super.initState();
    _spotlightController = PageController(viewportFraction: 1.0);
    _startSpotlightAutoScroll();
  }

  void _startSpotlightAutoScroll() {
    _spotlightTimer?.cancel();
    _spotlightTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (!mounted) return;
      if (_spotlightController.hasClients) {
        final list = ref.read(topTenAnimeProvider).valueOrNull ??
            ref.read(trendingAnimeProvider).valueOrNull ??
            [];
        if (list.isEmpty) return;
        final count = list.length > 10 ? 10 : list.length;
        final nextIndex = (_currentSpotlightIndex + 1) % count;
        _spotlightController.animateToPage(
          nextIndex,
          duration: const Duration(milliseconds: 650),
          curve: Curves.easeInOutCubic,
        );
      }
    });
  }

  @override
  void dispose() {
    _spotlightTimer?.cancel();
    _spotlightController.dispose();
    super.dispose();
  }

  Future<void> _refreshHomeData() async {
    ref.read(animeRepositoryProvider).clearCache();
    ref.invalidate(homeDataProvider);
    ref.invalidate(trendingAnimeProvider);
    ref.invalidate(popularAnimeProvider);
    ref.invalidate(topTenAnimeProvider);
    ref.invalidate(animeMoviesProvider);
    final selectedGenre = ref.read(selectedGenreFilterProvider);
    if (selectedGenre != 'All') {
      ref.invalidate(genreFilteredAnimeProvider(selectedGenre));
    }
  }

  void _toggleWatchlist(AnimeModel anime) {
    ref.read(watchlistNotifierProvider.notifier).toggle(anime.slug);
    final isNowIn = ref.read(watchlistNotifierProvider).contains(anime.slug);
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        duration: const Duration(seconds: 2),
        backgroundColor: const Color(0xFF181A29),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(
            color: isNowIn ? const Color(0xFFFF1E56) : Colors.white24,
            width: 1,
          ),
        ),
        content: Row(
          children: [
            Icon(
              isNowIn ? Icons.check_circle_rounded : Icons.bookmark_remove_rounded,
              color: isNowIn ? const Color(0xFFFF1E56) : AppColors.textSecondary,
              size: 20,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                isNowIn ? 'Added "${anime.title}" to My List' : 'Removed from My List',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final selectedGenre = ref.watch(selectedGenreFilterProvider);
    final genresListAsync = ref.watch(genresListProvider);
    final availableQuickGenres = [
      'All',
      ...(genresListAsync.valueOrNull ?? _quickGenres.where((g) => g != 'All')),
    ];
    final homeAsync = ref.watch(homeDataProvider);
    final trendingAsync = ref.watch(trendingAnimeProvider);
    final popularAsync = ref.watch(popularAnimeProvider);
    final topTenAsync = ref.watch(topTenAnimeProvider);
    final moviesAsync = ref.watch(animeMoviesProvider);
    final genreFilteredAsync = selectedGenre == 'All'
        ? null
        : ref.watch(genreFilteredAnimeProvider(selectedGenre));
    final watchlist = ref.watch(watchlistNotifierProvider);

    // Initial full-page skeleton loading while data is loading
    final isInitialLoading = trendingAsync.isLoading && popularAsync.isLoading && topTenAsync.isLoading;
    if (isInitialLoading && !homeAsync.hasValue) {
      return Scaffold(
        backgroundColor: const Color(0xFF09080D),
        body: SafeArea(
          child: _buildHomeSkeleton(),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF09080D),
      body: SafeArea(
        child: RefreshIndicator(
          color: const Color(0xFFFF1E56),
          backgroundColor: const Color(0xFF181A29),
          onRefresh: _refreshHomeData,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            slivers: [
              // 1. TOP APP BAR (Stylized ANIVERSES logo, search button, avatar with glowing ring)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // ANIVERSES official brand logo with transparent PNG
                      GestureDetector(
                        onTap: _refreshHomeData,
                        child: Image.asset(
                          'assets/images/logo.png',
                          height: 38,
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) => RichText(
                            text: TextSpan(
                              children: [
                                TextSpan(
                                  text: 'ANI',
                                  style: TextStyle(
                                    color: const Color(0xFFFF1E56),
                                    fontWeight: FontWeight.w900,
                                    fontSize: 22,
                                    letterSpacing: 2,
                                    shadows: [
                                      Shadow(
                                        color: const Color(0xFFFF1E56).withValues(alpha: 0.65),
                                        blurRadius: 12,
                                      ),
                                    ],
                                  ),
                                ),
                                const TextSpan(
                                  text: 'VERSES',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 22,
                                    letterSpacing: 2,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),

                      // Actions: Search Icon Button + Neon Profile Avatar
                      Row(
                        children: [
                          // Circular glass search button
                          GestureDetector(
                            onTap: () => context.push('/search'),
                            child: Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: const Color(0xFF131524),
                                border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.12),
                                  width: 1,
                                ),
                              ),
                              child: const Center(
                                child: Icon(Icons.search_rounded, color: Colors.white, size: 20),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),

                          // Glowing purple/cyan avatar
                          GestureDetector(
                            onTap: () {
                              ref.read(bottomNavIndexProvider.notifier).state = 3;
                            },
                            child: Container(
                              width: 38,
                              height: 38,
                              padding: const EdgeInsets.all(2),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF8B5CF6), Color(0xFFC084FC), Color(0xFF06B6D4)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF8B5CF6).withValues(alpha: 0.55),
                                    blurRadius: 10,
                                    spreadRadius: 1,
                                  ),
                                ],
                              ),
                              child: ClipOval(
                                child: Container(
                                  color: const Color(0xFF13141F),
                                  child: CachedNetworkImage(
                                    imageUrl: 'https://cdn.myanimelist.net/images/characters/9/131317.jpg',
                                    fit: BoxFit.cover,
                                    errorWidget: (_, _, _) => const Center(
                                      child: Icon(Icons.person, color: Colors.white, size: 18),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // 2. CATEGORY / GENRE FILTER CHIPS (Dynamic from API)
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 36,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: availableQuickGenres.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final genre = availableQuickGenres[index];
                      final isSelected = selectedGenre == genre;
                      return GestureDetector(
                        onTap: () {
                          ref.read(selectedGenreFilterProvider.notifier).state = genre;
                          setState(() {
                            _currentSpotlightIndex = 0;
                          });
                          if (_spotlightController.hasClients) {
                            _spotlightController.jumpToPage(0);
                          }
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: EdgeInsets.symmetric(
                            horizontal: isSelected ? 18 : 12,
                            vertical: 7,
                          ),
                          decoration: BoxDecoration(
                            gradient: isSelected
                                ? const LinearGradient(
                                    colors: [Color(0xFFFF1E56), Color(0xFFD61144)],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  )
                                : null,
                            color: isSelected ? null : Colors.transparent,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: isSelected
                                ? [
                                    BoxShadow(
                                      color: const Color(0xFFFF1E56).withValues(alpha: 0.6),
                                      blurRadius: 12,
                                      offset: const Offset(0, 2),
                                    ),
                                  ]
                                : null,
                          ),
                          child: Center(
                            child: Text(
                              genre,
                              style: TextStyle(
                                color: isSelected ? Colors.white : const Color(0xFF9CA3AF),
                                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 16)),

              // 3. HERO SPOTLIGHT CARD (Synchronized with Website: One Piece #1, 4K Banners)
              SliverToBoxAdapter(
                child: _buildHeroCarouselSection(
                  context: context,
                  topTenAsync: topTenAsync,
                  trendingAsync: trendingAsync,
                  watchlist: watchlist,
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 18)),

              // If a specific genre is selected, display that genre's anime catalog directly on screen!
              if (selectedGenre != 'All') ...[
                SliverToBoxAdapter(
                  child: _buildSectionHeader(
                    title: '$selectedGenre Anime',
                    onSeeAll: () {
                      ref.read(bottomNavIndexProvider.notifier).state = 1;
                    },
                  ),
                ),
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 196,
                    child: genreFilteredAsync?.when(
                          data: (list) {
                            if (list.isEmpty) {
                              return Center(
                                child: Text('No $selectedGenre anime found',
                                    style: const TextStyle(color: Color(0xFF9CA3AF))),
                              );
                            }
                            return ListView.separated(
                              scrollDirection: Axis.horizontal,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: list.length,
                              separatorBuilder: (_, _) => const SizedBox(width: 12),
                              itemBuilder: (context, index) {
                                final item = list[index];
                                return _buildTrendingCard(context, item, index);
                              },
                            );
                          },
                          loading: () => _buildTrendingShimmerRow(),
                          error: (_, _) => const SizedBox.shrink(),
                        ) ??
                        const SizedBox.shrink(),
                  ),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 24)),
              ],

              // 4. TRENDING NOW SECTION (Red bar indicator + cards matching image)
              SliverToBoxAdapter(
                child: _buildSectionHeader(
                  title: 'Trending Now',
                  onSeeAll: () {
                    ref.read(bottomNavIndexProvider.notifier).state = 1;
                  },
                ),
              ),

              SliverToBoxAdapter(
                child: SizedBox(
                  height: 196,
                  child: trendingAsync.when(
                    data: (list) {
                      final displayList = list.isNotEmpty
                          ? list
                          : AnimeSeedData.trending.map((e) => AnimeModel.fromJson(e)).toList();
                      return ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: displayList.length,
                        separatorBuilder: (_, _) => const SizedBox(width: 12),
                        itemBuilder: (context, index) {
                          final item = displayList[index];
                          return _buildTrendingCard(context, item, index);
                        },
                      );
                    },
                    loading: () => _buildTrendingShimmerRow(),
                    error: (_, _) {
                      final fallback = AnimeSeedData.trending.map((e) => AnimeModel.fromJson(e)).toList();
                      return ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: fallback.length,
                        separatorBuilder: (_, _) => const SizedBox(width: 12),
                        itemBuilder: (context, index) {
                          final item = fallback[index];
                          return _buildTrendingCard(context, item, index);
                        },
                      );
                    },
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 24)),

              // 5. POPULAR THIS SEASON SECTION
              SliverToBoxAdapter(
                child: _buildSectionHeader(
                  title: 'Popular This Season',
                  onSeeAll: () {
                    ref.read(selectedSortFilterProvider.notifier).state = 'popular';
                    ref.read(bottomNavIndexProvider.notifier).state = 1;
                  },
                ),
              ),

              SliverToBoxAdapter(
                child: SizedBox(
                  height: 265,
                  child: popularAsync.when(
                    data: (list) {
                      final displayList = list.isNotEmpty
                          ? list
                          : AnimeSeedData.popular.map((e) => AnimeModel.fromJson(e)).toList();
                      return ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: displayList.length,
                        separatorBuilder: (_, _) => const SizedBox(width: 14),
                        itemBuilder: (context, index) {
                          final item = displayList[index];
                          return AnimeCard(
                            width: 142,
                            anime: item,
                            showRank: false,
                            onTap: () => context.push('/anime/${item.slug}'),
                          );
                        },
                      );
                    },
                    loading: () => _buildStandardShimmerRow(),
                    error: (_, _) {
                      final fallback = AnimeSeedData.popular.map((e) => AnimeModel.fromJson(e)).toList();
                      return ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: fallback.length,
                        separatorBuilder: (_, _) => const SizedBox(width: 14),
                        itemBuilder: (context, index) {
                          final item = fallback[index];
                          return AnimeCard(
                            width: 142,
                            anime: item,
                            showRank: false,
                            onTap: () => context.push('/anime/${item.slug}'),
                          );
                        },
                      );
                    },
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 24)),

              // 6. ANIME MOVIES SECTION
              SliverToBoxAdapter(
                child: _buildSectionHeader(
                  title: 'Anime Movies',
                  onSeeAll: () {
                    ref.read(selectedTypeFilterProvider.notifier).state = 'Movie';
                    ref.read(bottomNavIndexProvider.notifier).state = 1;
                  },
                ),
              ),

              SliverToBoxAdapter(
                child: SizedBox(
                  height: 265,
                  child: moviesAsync.when(
                    data: (list) {
                      if (list.isEmpty) {
                        return const Center(
                          child: SafeText('No anime movies found', style: TextStyle(color: AppColors.textMuted)),
                        );
                      }
                      return ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: list.length,
                        separatorBuilder: (_, _) => const SizedBox(width: 14),
                        itemBuilder: (context, index) {
                          final item = list[index];
                          return AnimeCard(
                            width: 142,
                            anime: item,
                            showRank: false,
                            onTap: () => context.push('/anime/${item.slug}'),
                          );
                        },
                      );
                    },
                    loading: () => _buildStandardShimmerRow(),
                    error: (_, _) => const SizedBox.shrink(),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 24)),

              // 7. TOP 10 LEADERBOARD (Full ranked cards)
              SliverToBoxAdapter(
                child: _buildSectionHeader(
                  title: 'Top 10 of AniVerse',
                  onSeeAll: () {
                    ref.read(bottomNavIndexProvider.notifier).state = 1;
                  },
                ),
              ),

              topTenAsync.when(
                data: (list) {
                  final topList = list.take(10).toList();
                  return SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final anime = topList[index];
                          return _buildTopTenRow(context, anime, index + 1);
                        },
                        childCount: topList.length,
                      ),
                    ),
                  );
                },
                loading: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
                error: (_, _) => const SliverToBoxAdapter(child: SizedBox.shrink()),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 40)),
            ],
          ),
        ),
      ),
    );
  }

  // Hero Carousel Section (Synchronized with Website: One Piece #1, 4K Banners, 10 Spotlight Items)
  Widget _buildHeroCarouselSection({
    required BuildContext context,
    required AsyncValue<List<AnimeModel>> topTenAsync,
    required AsyncValue<List<AnimeModel>> trendingAsync,
    required Set<String> watchlist,
  }) {
    final rawList = topTenAsync.valueOrNull ?? trendingAsync.valueOrNull ?? [];
    final topTenList = rawList.isNotEmpty
        ? rawList
        : AnimeSeedData.topTen.map((e) => AnimeModel.fromJson(e)).toList();
    final isLoading = topTenAsync.isLoading;

    if (isLoading && topTenList.isEmpty) {
      return _buildHeroCardSkeleton();
    }

    // Reorder list to ensure One Piece is the #1 spotlight anime shown if present (matching website HeroSlider)
    final List<AnimeModel> ordered = List.from(topTenList);
    final onePieceIdx = ordered.indexWhere((a) =>
        a.slug.toLowerCase().contains('one-piece') ||
        a.title.toLowerCase().contains('one piece'));
    if (onePieceIdx > -1) {
      final onePiece = ordered.removeAt(onePieceIdx);
      ordered.insert(0, onePiece);
    }
    final allSlides = ordered.take(10).toList();

    return Column(
      children: [
        SizedBox(
          height: 385,
          child: PageView.builder(
            controller: _spotlightController,
            itemCount: allSlides.length,
            onPageChanged: (index) {
              setState(() {
                _currentSpotlightIndex = index;
              });
            },
            itemBuilder: (context, index) {
              final anime = allSlides[index];
              final isInWatchlist = watchlist.contains(anime.slug);
              return _buildDetailedHeroCard(context, anime, index, isInWatchlist);
            },
          ),
        ),
        const SizedBox(height: 10),
        // Spotlight pagination indicator (10 slides)
        if (allSlides.length > 1)
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(allSlides.length, (index) {
              final isActive = _currentSpotlightIndex == index;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: isActive ? 22 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: isActive ? const Color(0xFFFF1E56) : Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(3),
                  boxShadow: isActive
                      ? [
                          BoxShadow(
                            color: const Color(0xFFFF1E56).withValues(alpha: 0.6),
                            blurRadius: 6,
                          ),
                        ]
                      : null,
                ),
              );
            }),
          ),
      ],
    );
  }

  // Section Header with vertical red bar accent and "See All >"
  Widget _buildSectionHeader({
    required String title,
    required VoidCallback onSeeAll,
  }) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 3.5,
                height: 18,
                decoration: BoxDecoration(
                  color: const Color(0xFFFF1E56),
                  borderRadius: BorderRadius.circular(2),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFFF1E56).withValues(alpha: 0.6),
                      blurRadius: 6,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  letterSpacing: 0.2,
                ),
              ),
            ],
          ),
          GestureDetector(
            onTap: onSeeAll,
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'See All',
                  style: TextStyle(
                    color: Color(0xFF9CA3AF),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(width: 2),
                Icon(Icons.chevron_right_rounded, color: Color(0xFF9CA3AF), size: 18),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Detailed Hero Spotlight Card (Matching Screenshot)
  Widget _buildDetailedHeroCard(BuildContext context, AnimeModel anime, int index, bool isInWatchlist) {
    final heroBannerUrl = getHeroBanner(anime);
    final hasLandscapeBanner = (anime.bannerImage != null && anime.bannerImage!.isNotEmpty) ||
        (heroBannerUrl != anime.displayPoster && heroBannerUrl.isNotEmpty);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.6),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Ambient Blurred Backdrop Layer (Fills container with rich colors, eliminates letterboxing)
          CachedNetworkImage(
            imageUrl: heroBannerUrl.isNotEmpty ? heroBannerUrl : anime.displayPoster,
            fit: BoxFit.cover,
            alignment: Alignment.center,
            placeholder: (_, _) => Container(color: const Color(0xFF13141F)),
            errorWidget: (_, _, _) => Container(color: const Color(0xFF13141F)),
          ),
          BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
            child: Container(
              color: Colors.black.withValues(alpha: 0.45),
            ),
          ),

          // 2. Focused Foreground Artwork Layer (topCenter aligned so character head and face are NEVER cut off)
          CachedNetworkImage(
            imageUrl: heroBannerUrl,
            fit: hasLandscapeBanner ? BoxFit.cover : BoxFit.contain,
            alignment: Alignment.topCenter,
            placeholder: (_, _) => const SizedBox.shrink(),
            errorWidget: (_, _, _) => CachedNetworkImage(
              imageUrl: anime.displayPoster,
              fit: BoxFit.contain,
              alignment: Alignment.topCenter,
            ),
          ),

          // 3. Cinematic Vignette Overlay Gradient
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.4),
                  Colors.black.withValues(alpha: 0.88),
                  Colors.black.withValues(alpha: 0.98),
                ],
                stops: const [0.0, 0.35, 0.58, 0.82, 1.0],
              ),
            ),
          ),

          // Content info & Dual Action Buttons
          Positioned(
            left: 18,
            right: 18,
            bottom: 18,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Spotlight Tag Badge (Matching Website: #1 Spotlight)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF181A29),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: const Color(0xFFFF1E56).withValues(alpha: 0.55),
                      width: 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFF1E56).withValues(alpha: 0.28),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.star_rounded, color: Color(0xFFFF1E56), size: 14),
                      const SizedBox(width: 4),
                      Text(
                        '#${index + 1} Spotlight',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),

                // Display Title (White & Crimson Red stylized)
                _buildStylizedHeroTitle(anime.title),
                const SizedBox(height: 6),

                // Meta row: Star Rating, Type, Year, Status
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1F1D14),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFFACC15).withValues(alpha: 0.4)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star_rounded, color: Color(0xFFFACC15), size: 13),
                          const SizedBox(width: 3),
                          Text(
                            anime.score > 0 ? anime.score.toStringAsFixed(1) : '8.5',
                            style: const TextStyle(
                              color: Color(0xFFFACC15),
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${anime.type} • ${anime.releasedYear ?? 2024} • ${anime.status ?? "Airing"}',
                      style: const TextStyle(
                        color: Color(0xFFD1D5DB),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                if (anime.synopsis != null && anime.synopsis!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    anime.synopsis!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.72),
                      fontSize: 12,
                      height: 1.3,
                    ),
                  ),
                ],
                const SizedBox(height: 12),

                // Dual Action Buttons: "Watch Now" & "+ My List"
                Row(
                  children: [
                    // Filled Crimson Red "Watch Now" Button
                    Expanded(
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFFF1E56), Color(0xFFE50914)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFFF1E56).withValues(alpha: 0.4),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () => context.push('/watch/${anime.slug}/1'),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.play_arrow_rounded, color: Colors.white, size: 22),
                                SizedBox(width: 6),
                                Text(
                                  'Watch Now',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Glassmorphic "+ My List" Button
                    Expanded(
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: const Color(0xFF101528).withValues(alpha: 0.7),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: const Color(0xFF2E3A59).withValues(alpha: 0.8),
                            width: 1.5,
                          ),
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () => _toggleWatchlist(anime),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  isInWatchlist ? Icons.check_rounded : Icons.add_rounded,
                                  color: isInWatchlist ? const Color(0xFF10B981) : Colors.white,
                                  size: 18,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  isInWatchlist ? 'In My List' : '+ My List',
                                  style: TextStyle(
                                    color: isInWatchlist ? const Color(0xFF10B981) : Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Helper to render heroic stacked title
  Widget _buildStylizedHeroTitle(String title) {
    final words = title.trim().split(RegExp(r'\s+'));
    if (words.length > 1) {
      final firstPart = words.sublist(0, words.length - 1).join(' ').toUpperCase();
      final lastWord = words.last.toUpperCase();
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            firstPart,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              letterSpacing: 1.2,
              height: 1.1,
            ),
          ),
          Text(
            lastWord,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: Color(0xFFFF1E56),
              letterSpacing: 1.2,
              height: 1.1,
            ),
          ),
        ],
      );
    } else {
      return Text(
        title.toUpperCase(),
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w900,
          color: Colors.white,
          letterSpacing: 1.2,
          height: 1.1,
        ),
      );
    }
  }

  // Trending Anime Card (Matching Screenshot: Artwork, bottom title & "S1 • E3")
  Widget _buildTrendingCard(BuildContext context, AnimeModel anime, int index) {
    final isFirstCard = index == 0;
    return GestureDetector(
      onTap: () => context.push('/anime/${anime.slug}'),
      child: Container(
        width: 132,
        height: 196,
        decoration: BoxDecoration(
          color: const Color(0xFF13141F),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isFirstCard ? const Color(0xFFFF1E56) : Colors.white.withValues(alpha: 0.08),
            width: isFirstCard ? 1.5 : 1,
          ),
          boxShadow: isFirstCard
              ? [
                  BoxShadow(
                    color: const Color(0xFFFF1E56).withValues(alpha: 0.35),
                    blurRadius: 10,
                    spreadRadius: 0.5,
                  ),
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.4),
                    blurRadius: 8,
                  ),
                ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Anime Poster
            CachedNetworkImage(
              imageUrl: anime.displayPoster,
              fit: BoxFit.cover,
              placeholder: (_, _) => Container(color: const Color(0xFF13141F)),
              errorWidget: (_, _, _) => Container(
                color: const Color(0xFF181A29),
                child: const Center(
                  child: Icon(Icons.broken_image_rounded, color: Colors.white24),
                ),
              ),
            ),

            // Bottom dark gradient overlay for text readability
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.4),
                    Colors.black.withValues(alpha: 0.92),
                  ],
                  stops: const [0.0, 0.45, 0.7, 1.0],
                ),
              ),
            ),

            // Card Text: Title & "S1 • E3"
            Positioned(
              left: 10,
              right: 10,
              bottom: 10,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    anime.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 12.5,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    'S1 • E${anime.latestEpisodeNumber > 0 ? anime.latestEpisodeNumber : 1}',
                    style: const TextStyle(
                      color: Color(0xFF9CA3AF),
                      fontWeight: FontWeight.w600,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Top 10 Leaderboard Row Item
  Widget _buildTopTenRow(BuildContext context, AnimeModel anime, int rank) {
    return GestureDetector(
      onTap: () => context.push('/anime/${anime.slug}'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: const Color(0xFF13141F),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08), width: 1),
        ),
        child: Row(
          children: [
            // Rank Number
            SizedBox(
              width: 28,
              child: Center(
                child: Text(
                  rank.toString(),
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: rank <= 3 ? const Color(0xFFFF1E56) : const Color(0xFF9CA3AF),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),

            // Poster Thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: CachedNetworkImage(
                imageUrl: anime.displayPoster,
                width: 48,
                height: 64,
                fit: BoxFit.cover,
                placeholder: (_, _) => Container(color: const Color(0xFF181A29)),
                errorWidget: (_, _, _) => Container(color: const Color(0xFF181A29)),
              ),
            ),
            const SizedBox(width: 12),

            // Metadata & Title
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    anime.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 13.5,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${anime.type} • ${anime.genres.split(',').take(2).join(', ')}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF9CA3AF),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.star_rounded, color: AppColors.accentGold, size: 13),
                      const SizedBox(width: 3),
                      Text(
                        anime.score.toStringAsFixed(1),
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFFFACC15),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'EP ${anime.latestEpisodeNumber}',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Quick Play Button
            IconButton(
              icon: const Icon(Icons.play_circle_fill_rounded, color: Color(0xFFFF1E56), size: 30),
              onPressed: () => context.push('/watch/${anime.slug}/1'),
            ),
          ],
        ),
      ),
    );
  }

  // Full-Page Comprehensive Skeleton Loading (Matching image layout)
  Widget _buildHomeSkeleton() {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top bar skeleton
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _shimmerBox(width: 130, height: 24, radius: 6),
                Row(
                  children: [
                    _shimmerBox(width: 38, height: 38, radius: 19),
                    const SizedBox(width: 12),
                    _shimmerBox(width: 38, height: 38, radius: 19),
                  ],
                ),
              ],
            ),
          ),

          // Categories skeleton
          SizedBox(
            height: 36,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 5,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (_, index) => _shimmerBox(
                width: index == 0 ? 55 : 75,
                height: 36,
                radius: 18,
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Hero card skeleton
          _buildHeroCardSkeleton(),

          const SizedBox(height: 24),

          // Trending Now header skeleton
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 3.5,
                      height: 18,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFF1E56),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _shimmerBox(width: 120, height: 18, radius: 4),
                  ],
                ),
                _shimmerBox(width: 50, height: 14, radius: 4),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Trending Now horizontal cards skeleton
          _buildTrendingShimmerRow(),

          const SizedBox(height: 24),

          // Popular header skeleton
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 3.5,
                      height: 18,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFF1E56),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _shimmerBox(width: 140, height: 18, radius: 4),
                  ],
                ),
                _shimmerBox(width: 50, height: 14, radius: 4),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Popular horizontal cards skeleton
          _buildStandardShimmerRow(),
        ],
      ),
    );
  }

  // Hero Card Skeleton
  Widget _buildHeroCardSkeleton() {
    return Container(
      height: 370,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF13141F),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Shimmer.fromColors(
        baseColor: const Color(0xFF13141F),
        highlightColor: const Color(0xFF1E2130),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 180,
                height: 24,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
              const SizedBox(height: 8),
              Container(
                width: 120,
                height: 20,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
              const SizedBox(height: 10),
              Container(
                width: 150,
                height: 14,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Trending cards skeleton row
  Widget _buildTrendingShimmerRow() {
    return SizedBox(
      height: 196,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: 4,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (_, index) => Shimmer.fromColors(
          baseColor: const Color(0xFF13141F),
          highlightColor: const Color(0xFF1E2130),
          child: Container(
            width: 132,
            height: 196,
            decoration: BoxDecoration(
              color: const Color(0xFF13141F),
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
      ),
    );
  }

  // Standard cards skeleton row
  Widget _buildStandardShimmerRow() {
    return SizedBox(
      height: 265,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: 4,
        separatorBuilder: (_, _) => const SizedBox(width: 14),
        itemBuilder: (_, index) => Shimmer.fromColors(
          baseColor: const Color(0xFF13141F),
          highlightColor: const Color(0xFF1E2130),
          child: Container(
            width: 142,
            decoration: BoxDecoration(
              color: const Color(0xFF13141F),
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
      ),
    );
  }

  // Generic shimmer container helper
  Widget _shimmerBox({required double width, required double height, required double radius}) {
    return Shimmer.fromColors(
      baseColor: const Color(0xFF13141F),
      highlightColor: const Color(0xFF1E2130),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: const Color(0xFF13141F),
          borderRadius: BorderRadius.circular(radius),
        ),
      ),
    );
  }
}
