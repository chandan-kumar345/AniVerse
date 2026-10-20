import 'dart:async';
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

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  late PageController _spotlightController;
  int _currentSpotlightIndex = 0;
  Timer? _spotlightTimer;

  static const List<String> _quickGenres = [
    'All',
    'Action',
    'Adventure',
    'Fantasy',
    'Isekai',
    'Romance',
    'Comedy',
    'Shonen',
    'Sci-Fi',
    '18+'
  ];

  @override
  void initState() {
    super.initState();
    _spotlightController = PageController(viewportFraction: 0.92);
    _startSpotlightAutoScroll();
  }

  void _startSpotlightAutoScroll() {
    _spotlightTimer?.cancel();
    _spotlightTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (_spotlightController.hasClients) {
        final topTen = ref.read(topTenAnimeProvider).valueOrNull ?? [];
        if (topTen.isEmpty) return;
        final nextIndex = (_currentSpotlightIndex + 1) % topTen.take(8).length;
        _spotlightController.animateToPage(
          nextIndex,
          duration: const Duration(milliseconds: 600),
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
    ref.invalidate(trendingAnimeProvider);
    ref.invalidate(popularAnimeProvider);
    ref.invalidate(topTenAnimeProvider);
    ref.invalidate(animeMoviesProvider);
  }

  @override
  Widget build(BuildContext context) {
    final selectedGenre = ref.watch(selectedGenreFilterProvider);
    final trendingAsync = ref.watch(trendingAnimeProvider);
    final popularAsync = ref.watch(popularAnimeProvider);
    final topTenAsync = ref.watch(topTenAnimeProvider);
    final moviesAsync = ref.watch(animeMoviesProvider);

    return Scaffold(
      backgroundColor: AppColors.bgVoid,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primaryNeon,
          backgroundColor: AppColors.surfaceElevated,
          onRefresh: _refreshHomeData,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            slivers: [
              // Top Navigation Bar
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Brand Logo
                      GestureDetector(
                        onTap: () => _refreshHomeData(),
                        child: Row(
                          children: [
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: AppColors.primaryGradient,
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primaryGlow.withOpacity(0.4),
                                    blurRadius: 10,
                                  ),
                                ],
                              ),
                              child: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 20),
                            ),
                            const SizedBox(width: 10),
                            const SafeText(
                              'ANIVERSE',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 2,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Actions: Search, Notifications, Profile Avatar
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.search_rounded, color: Colors.white, size: 24),
                            onPressed: () => context.push('/search'),
                          ),
                          IconButton(
                            icon: const Icon(Icons.notifications_none_rounded, color: Colors.white, size: 24),
                            onPressed: () => context.push('/notifications'),
                          ),
                          const SizedBox(width: 4),
                          GestureDetector(
                            onTap: () => context.push('/profile'),
                            child: Container(
                              width: 34,
                              height: 34,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: AppColors.primaryNeon, width: 1.5),
                                color: AppColors.surfaceElevated,
                              ),
                              child: const Center(
                                child: Icon(Icons.person, color: Colors.white, size: 18),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // Quick Genre Filter Pills (Horizontally Scrollable)
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 38,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _quickGenres.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final genre = _quickGenres[index];
                      final isSelected = selectedGenre == genre;
                      return GestureDetector(
                        onTap: () {
                          ref.read(selectedGenreFilterProvider.notifier).state = genre;
                          context.go('/explore');
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 7),
                          decoration: BoxDecoration(
                            gradient: isSelected ? AppColors.primaryGradient : null,
                            color: isSelected ? null : AppColors.surfaceCard,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isSelected ? Colors.transparent : AppColors.border,
                              width: 1,
                            ),
                            boxShadow: isSelected
                                ? [BoxShadow(color: AppColors.primaryGlow.withOpacity(0.5), blurRadius: 8)]
                                : null,
                          ),
                          child: Center(
                            child: SafeText(
                              genre,
                              style: TextStyle(
                                color: isSelected ? Colors.white : AppColors.textSecondary,
                                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 18)),

              // 1. HERO SPOTLIGHT CAROUSEL (Top Ten Anime Spotlight)
              SliverToBoxAdapter(
                child: topTenAsync.when(
                  data: (list) {
                    if (list.isEmpty) return const SizedBox.shrink();
                    final spotlightList = list.take(8).toList();
                    return Column(
                      children: [
                        SizedBox(
                          height: 255,
                          child: PageView.builder(
                            controller: _spotlightController,
                            itemCount: spotlightList.length,
                            onPageChanged: (index) {
                              setState(() {
                                _currentSpotlightIndex = index;
                              });
                            },
                            itemBuilder: (context, index) {
                              final anime = spotlightList[index];
                              return _buildSpotlightCard(context, anime, index + 1);
                            },
                          ),
                        ),
                        const SizedBox(height: 10),
                        // Dot indicators
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(spotlightList.length, (index) {
                            final isActive = _currentSpotlightIndex == index;
                            return AnimatedContainer(
                              duration: const Duration(milliseconds: 300),
                              margin: const EdgeInsets.symmetric(horizontal: 3),
                              width: isActive ? 20 : 6,
                              height: 6,
                              decoration: BoxDecoration(
                                gradient: isActive ? AppColors.primaryGradient : null,
                                color: isActive ? null : Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(3),
                              ),
                            );
                          }),
                        ),
                      ],
                    );
                  },
                  loading: () => Container(
                    height: 255,
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceCard,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Shimmer.fromColors(
                      baseColor: AppColors.surfaceCard,
                      highlightColor: AppColors.surfaceElevated,
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.surfaceCard,
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                  ),
                  error: (_, __) => const SizedBox.shrink(),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 26)),

              // 2. TRENDING NOW SECTION (#1 to #10 numbered cards matching website)
              SliverToBoxAdapter(
                child: _buildSectionHeader(
                  context,
                  title: 'Trending Now',
                  onSeeAll: () => context.go('/explore'),
                ),
              ),

              SliverToBoxAdapter(
                child: SizedBox(
                  height: 270,
                  child: trendingAsync.when(
                    data: (list) {
                      if (list.isEmpty) {
                        return const Center(
                          child: SafeText('No trending anime available', style: TextStyle(color: AppColors.textMuted)),
                        );
                      }
                      return ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        itemCount: list.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 14),
                        itemBuilder: (context, index) {
                          final item = list[index];
                          return AnimeCard(
                            width: 145,
                            anime: item,
                            rank: index + 1,
                            showRank: true,
                            onTap: () => context.push('/anime/${item.slug}'),
                          );
                        },
                      );
                    },
                    loading: () => _buildHorizontalShimmer(),
                    error: (_, __) => const SizedBox.shrink(),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 28)),

              // 3. MOST POPULAR ANIME SECTION (Matching website)
              SliverToBoxAdapter(
                child: _buildSectionHeader(
                  context,
                  title: 'Most Popular',
                  onSeeAll: () {
                    ref.read(selectedSortFilterProvider.notifier).state = 'popular';
                    context.go('/explore');
                  },
                ),
              ),

              SliverToBoxAdapter(
                child: SizedBox(
                  height: 270,
                  child: popularAsync.when(
                    data: (list) {
                      if (list.isEmpty) {
                        return const Center(
                          child: SafeText('No popular anime available', style: TextStyle(color: AppColors.textMuted)),
                        );
                      }
                      return ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        itemCount: list.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 14),
                        itemBuilder: (context, index) {
                          final item = list[index];
                          return AnimeCard(
                            width: 145,
                            anime: item,
                            showRank: false,
                            onTap: () => context.push('/anime/${item.slug}'),
                          );
                        },
                      );
                    },
                    loading: () => _buildHorizontalShimmer(),
                    error: (_, __) => const SizedBox.shrink(),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 28)),

              // 4. ANIME MOVIES SECTION (Matching website movies row)
              SliverToBoxAdapter(
                child: _buildSectionHeader(
                  context,
                  title: 'Anime Movies',
                  onSeeAll: () {
                    ref.read(selectedTypeFilterProvider.notifier).state = 'Movie';
                    context.go('/explore');
                  },
                ),
              ),

              SliverToBoxAdapter(
                child: SizedBox(
                  height: 270,
                  child: moviesAsync.when(
                    data: (list) {
                      if (list.isEmpty) {
                        return const Center(
                          child: SafeText('No anime movies found', style: TextStyle(color: AppColors.textMuted)),
                        );
                      }
                      return ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        itemCount: list.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 14),
                        itemBuilder: (context, index) {
                          final item = list[index];
                          return AnimeCard(
                            width: 145,
                            anime: item,
                            showRank: false,
                            onTap: () => context.push('/anime/${item.slug}'),
                          );
                        },
                      );
                    },
                    loading: () => _buildHorizontalShimmer(),
                    error: (_, __) => const SizedBox.shrink(),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 28)),

              // 5. TOP 10 LEADERBOARD (Numbered ranking breakdown)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      Container(
                        width: 4,
                        height: 18,
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 8),
                      const SafeText(
                        'Top 10 Anime of AniVerse',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 12)),

              // Top 10 List Items
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
                error: (_, __) => const SliverToBoxAdapter(child: SizedBox.shrink()),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 40)),
            ],
          ),
        ),
      ),
    );
  }

  // Section Header with neon indicator and "See All"
  Widget _buildSectionHeader(BuildContext context, {required String title, required VoidCallback onSeeAll}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 4,
                height: 18,
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              SafeText(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          GestureDetector(
            onTap: onSeeAll,
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SafeText(
                  'See All',
                  style: TextStyle(
                    color: AppColors.primaryNeon,
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                SizedBox(width: 4),
                Icon(Icons.arrow_forward_ios_rounded, color: AppColors.primaryNeon, size: 11),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Spotlight Banner Card
  Widget _buildSpotlightCard(BuildContext context, AnimeModel anime, int rank) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 5),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border, width: 1),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Banner Artwork
          CachedNetworkImage(
            imageUrl: anime.displayBanner,
            fit: BoxFit.cover,
            placeholder: (context, url) => Container(color: AppColors.surfaceCard),
            errorWidget: (context, url, error) => CachedNetworkImage(
              imageUrl: anime.displayPoster,
              fit: BoxFit.cover,
            ),
          ),

          // Vignette & Dark Gradient Overlay
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withOpacity(0.35),
                  Colors.black.withOpacity(0.65),
                  Colors.black.withOpacity(0.92),
                ],
                stops: const [0.0, 0.45, 1.0],
              ),
            ),
          ),

          // Spotlight Rank Badge top-left
          Positioned(
            top: 12,
            left: 14,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                gradient: rank <= 3
                    ? const LinearGradient(colors: [Color(0xFFFF8A00), Color(0xFFE52E71)])
                    : AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.6), blurRadius: 6),
                ],
              ),
              child: SafeText(
                'SPOTLIGHT #$rank',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 11,
                  letterSpacing: 0.8,
                ),
              ),
            ),
          ),

          // Quality & Score badges top-right
          Positioned(
            top: 12,
            right: 14,
            child: Row(
              children: [
                if (anime.score > 0)
                  Container(
                    margin: const EdgeInsets.only(right: 6),
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF141624).withOpacity(0.9),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white.withOpacity(0.15)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.star_rounded, color: AppColors.accentGold, size: 12),
                        const SizedBox(width: 3),
                        SafeText(
                          anime.score.toStringAsFixed(1),
                          style: const TextStyle(
                            color: Color(0xFFFACC15),
                            fontWeight: FontWeight.w800,
                            fontSize: 10.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppColors.borderLight, width: 0.5),
                  ),
                  child: const SafeText(
                    'HD',
                    style: TextStyle(
                      color: AppColors.primaryNeon,
                      fontWeight: FontWeight.w900,
                      fontSize: 10,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Content info & Action buttons
          Positioned(
            left: 16,
            right: 16,
            bottom: 14,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Anime Title
                SafeText(
                  anime.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: 0.2,
                  ),
                ),
                const SizedBox(height: 4),

                // Tags Row: Type, Episodes, Status, Genres
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: SafeText(
                        anime.type,
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
                      ),
                    ),
                    const SizedBox(width: 6),
                    SafeText(
                      '• EP ${anime.latestEpisodeNumber} • ${anime.genres.split(',').take(2).join(', ')}',
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Action buttons: "Watch Now" & "Details"
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: ElevatedButton.icon(
                        onPressed: () => context.push('/anime/${anime.slug}/watch/1'),
                        icon: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 20),
                        label: const SafeText(
                          'Watch Now',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Colors.white),
                        ),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          backgroundColor: AppColors.primaryNeon,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 2,
                      child: OutlinedButton(
                        onPressed: () => context.push('/anime/${anime.slug}'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          side: BorderSide(color: Colors.white.withOpacity(0.3), width: 1),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          backgroundColor: Colors.black.withOpacity(0.3),
                        ),
                        child: const SafeText(
                          'Detail',
                          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: Colors.white),
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

  // Top 10 Leaderboard Row Item
  Widget _buildTopTenRow(BuildContext context, AnimeModel anime, int rank) {
    return GestureDetector(
      onTap: () => context.push('/anime/${anime.slug}'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border, width: 0.8),
        ),
        child: Row(
          children: [
            // Rank Number
            SizedBox(
              width: 32,
              child: SafeText(
                rank.toString().padLeft(2, '0'),
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: rank <= 3 ? const Color(0xFFFF8A00) : AppColors.textMuted,
                ),
              ),
            ),

            // Mini Thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: SizedBox(
                width: 48,
                height: 64,
                child: CachedNetworkImage(
                  imageUrl: anime.displayPoster,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(color: AppColors.surfaceElevated),
                  errorWidget: (context, url, error) => Container(color: AppColors.surfaceElevated),
                ),
              ),
            ),
            const SizedBox(width: 12),

            // Info: Title, Genres, Score
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SafeText(
                    anime.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  SafeText(
                    '${anime.type} • ${anime.genres.split(',').take(2).join(', ')}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.star_rounded, color: AppColors.accentGold, size: 13),
                      const SizedBox(width: 3),
                      SafeText(
                        anime.score.toStringAsFixed(1),
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFFFACC15),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SafeText(
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
              icon: const Icon(Icons.play_circle_fill_rounded, color: AppColors.primaryNeon, size: 30),
              onPressed: () => context.push('/anime/${anime.slug}/watch/1'),
            ),
          ],
        ),
      ),
    );
  }

  // Shimmer placeholder for horizontal sliders
  Widget _buildHorizontalShimmer() {
    return ListView.separated(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: 4,
      separatorBuilder: (context, index) => const SizedBox(width: 14),
      itemBuilder: (context, index) => Shimmer.fromColors(
        baseColor: AppColors.surfaceCard,
        highlightColor: AppColors.surfaceElevated,
        child: Container(
          width: 145,
          decoration: BoxDecoration(
            color: AppColors.surfaceCard,
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }
}
