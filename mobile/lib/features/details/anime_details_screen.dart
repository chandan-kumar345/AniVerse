import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/safe_text.dart';
import '../../core/providers/app_providers.dart';
import '../../data/models/anime_model.dart';

class AnimeDetailsScreen extends ConsumerStatefulWidget {
  const AnimeDetailsScreen({super.key, required this.slug});

  final String slug;

  @override
  ConsumerState<AnimeDetailsScreen> createState() => _AnimeDetailsScreenState();
}

class _AnimeDetailsScreenState extends ConsumerState<AnimeDetailsScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  AnimeModel? _anime;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadAnime();
  }

  Future<void> _loadAnime() async {
    final repo = ref.read(animeRepositoryProvider);
    final data = await repo.getAnimeDetail(widget.slug);
    if (mounted) {
      setState(() {
        _anime = data;
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
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
    if (_isLoading) {
      return Scaffold(
        backgroundColor: const Color(0xFF09080D),
        body: SafeArea(
          child: Shimmer.fromColors(
            baseColor: const Color(0xFF13141F),
            highlightColor: const Color(0xFF1E2130),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(height: 330, color: const Color(0xFF13141F)),
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(width: 220, height: 26, color: Colors.white),
                      const SizedBox(height: 12),
                      Container(width: 160, height: 16, color: Colors.white),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Expanded(child: Container(height: 44, color: Colors.white)),
                          const SizedBox(width: 12),
                          Expanded(child: Container(height: 44, color: Colors.white)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_anime == null) {
      return Scaffold(
        backgroundColor: const Color(0xFF09080D),
        appBar: AppBar(backgroundColor: Colors.transparent),
        body: const Center(
          child: SafeText('Anime not found.', style: TextStyle(color: AppColors.textMuted)),
        ),
      );
    }

    final anime = _anime!;
    final watchlist = ref.watch(watchlistNotifierProvider);
    final isInWatchlist = watchlist.contains(anime.slug);
    final year = anime.releasedYear ?? 2024;
    final totalEps = anime.totalEpisodes > 0
        ? anime.totalEpisodes
        : (anime.episodes.isNotEmpty ? anime.episodes.length : 12);

    final hasLandscapeBanner = anime.bannerImage?.isNotEmpty == true &&
        anime.bannerImage != anime.posterImage;
    final primaryImgUrl = hasLandscapeBanner ? anime.bannerImage! : anime.displayPoster;

    return Scaffold(
      backgroundColor: const Color(0xFF09080D),
      body: CustomScrollView(
        slivers: [
          // Collapsible Header Backdrop (Perfect Image Fitting with Ambient Glow)
          SliverAppBar(
            expandedHeight: 330,
            pinned: true,
            backgroundColor: const Color(0xFF09080D),
            elevation: 0,
            leading: Padding(
              padding: const EdgeInsets.all(8),
              child: GestureDetector(
                onTap: () => context.pop(),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.55),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                  ),
                  child: const Center(
                    child: Icon(Icons.arrow_back_rounded, color: Colors.white, size: 20),
                  ),
                ),
              ),
            ),
            actions: [
              // Heart / Favorite Icon Button
              GestureDetector(
                onTap: () => _toggleWatchlist(anime),
                child: Container(
                  width: 38,
                  height: 38,
                  margin: const EdgeInsets.only(right: 10),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.55),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                  ),
                  child: Center(
                    child: Icon(
                      isInWatchlist ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                      color: isInWatchlist ? const Color(0xFFFF1E56) : Colors.white,
                      size: 20,
                    ),
                  ),
                ),
              ),
              // Share Icon Button
              GestureDetector(
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Link copied to clipboard: ${anime.title}')),
                  );
                },
                child: Container(
                  width: 38,
                  height: 38,
                  margin: const EdgeInsets.only(right: 16),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.55),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                  ),
                  child: const Center(
                    child: Icon(Icons.share_outlined, color: Colors.white, size: 19),
                  ),
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  // 1. Ambient Blurred Backdrop Layer (Zero Letterboxing)
                  CachedNetworkImage(
                    imageUrl: primaryImgUrl,
                    fit: BoxFit.cover,
                    placeholder: (_, _) => Container(color: const Color(0xFF13141F)),
                    errorWidget: (_, _, _) => Container(color: const Color(0xFF13141F)),
                  ),
                  BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
                    child: Container(
                      color: Colors.black.withValues(alpha: 0.5),
                    ),
                  ),

                  // 2. Focused Artwork Layer (Aligned topCenter so face/head is NEVER cut off)
                  Center(
                    child: CachedNetworkImage(
                      imageUrl: primaryImgUrl,
                      fit: hasLandscapeBanner ? BoxFit.cover : BoxFit.contain,
                      alignment: Alignment.topCenter,
                      placeholder: (_, _) => const SizedBox.shrink(),
                      errorWidget: (_, _, _) => const SizedBox.shrink(),
                    ),
                  ),

                  // 3. Cinematic Vignette Gradient Layer
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.transparent,
                          Colors.transparent,
                          const Color(0xFF09080D).withValues(alpha: 0.5),
                          const Color(0xFF09080D).withValues(alpha: 0.95),
                          const Color(0xFF09080D),
                        ],
                        stops: const [0.0, 0.35, 0.65, 0.88, 1.0],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Metadata & Info Section (Matching Image 2)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title: "Solo Leveling" (Large bold white)
                  Text(
                    anime.title,
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: -0.3,
                      height: 1.15,
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Metadata Badges Row: Flame/Score + Year + "PG-13" + "• 24 Episodes" + "HD"
                  Row(
                    children: [
                      // Red icon (Flame / Rating)
                      const Icon(Icons.local_fire_department_rounded, color: Color(0xFFFF1E56), size: 17),
                      const SizedBox(width: 4),
                      Text(
                        '$year',
                        style: const TextStyle(
                          color: Color(0xFFD1D5DB),
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(width: 8),

                      // "PG-13" capsule badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E2130),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                        ),
                        child: Text(
                          anime.is18Plus ? '18+' : 'PG-13',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // "• 24 Episodes"
                      Text(
                        '•  $totalEps Episodes',
                        style: const TextStyle(
                          color: Color(0xFFD1D5DB),
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 8),

                      // "HD" pill badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E2130),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                        ),
                        child: const Text(
                          'HD',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Genre Tags Row: "Action", "Fantasy", "Supernatural"
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: anime.genres.split(',').map((g) {
                      final name = g.trim();
                      if (name.isEmpty) return const SizedBox.shrink();
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFF131524),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                        ),
                        child: Text(
                          name,
                          style: const TextStyle(
                            color: Color(0xFFD1D5DB),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),

                  // Dual Action Buttons: "▶ Watch Now" & "+ Add to List" (Matching Image 2)
                  Row(
                    children: [
                      // Filled Red "▶ Watch Now" Button
                      Expanded(
                        child: Container(
                          height: 46,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFFF1E56), Color(0xFFE50914)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFFFF1E56).withValues(alpha: 0.45),
                                blurRadius: 12,
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
                                      fontSize: 14.5,
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

                      // Glassmorphic "+ Add to List" Button
                      Expanded(
                        child: Container(
                          height: 46,
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
                                    size: 19,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    isInWatchlist ? 'In My List' : '+ Add to List',
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
                  const SizedBox(height: 16),

                  // Synopsis Paragraph
                  Text(
                    anime.synopsis ?? 'In a world where hunters fight deadly monsters, Sung Jin-Woo, the weakest hunter of all, gains a mysterious power that changes everything.',
                    maxLines: 4,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF9CA3AF),
                      fontSize: 13,
                      height: 1.45,
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 18)),

          // Segmented Tabs Header: "Episodes" (active red line), "About", "More Like This"
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  child: Row(
                    children: [
                      _buildTabItem(label: 'Episodes', index: 0),
                      const SizedBox(width: 24),
                      _buildTabItem(label: 'About', index: 1),
                      const SizedBox(width: 24),
                      _buildTabItem(label: 'More Like This', index: 2),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // Season Dropdown Selector: "Season 1 ⌵"
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                    decoration: BoxDecoration(
                      color: const Color(0xFF131524),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Season 1',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        SizedBox(width: 6),
                        Icon(Icons.keyboard_arrow_down_rounded, color: Colors.white70, size: 18),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),
              ],
            ),
          ),

          // FULL DYNAMIC EPISODES IMPLEMENTATION
          // Dynamically builds all episodes 1..totalEps so EVERY anime has streamable episodes
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 18),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final epNum = index + 1;
                  // Look up real episode details if provided by backend, else fallback to dynamic model
                  EpisodeModel? existingEp;
                  if (anime.episodes.isNotEmpty) {
                    for (final e in anime.episodes) {
                      if (e.episodeNumber == epNum) {
                        existingEp = e;
                        break;
                      }
                    }
                  }

                  return _buildDynamicEpisodeRow(context, anime, epNum, existingEp);
                },
                childCount: totalEps,
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ),
    );
  }

  // Tab Header with red underline for active tab
  Widget _buildTabItem({required String label, required int index}) {
    final isActive = _tabController.index == index;
    return GestureDetector(
      onTap: () {
        setState(() {
          _tabController.animateTo(index);
        });
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: isActive ? Colors.white : const Color(0xFF9CA3AF),
              fontSize: 14.5,
              fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          Container(
            height: 2.5,
            width: isActive ? 28 : 0,
            decoration: BoxDecoration(
              color: const Color(0xFFFF1E56),
              borderRadius: BorderRadius.circular(2),
              boxShadow: isActive
                  ? [
                      BoxShadow(
                        color: const Color(0xFFFF1E56).withValues(alpha: 0.8),
                        blurRadius: 6,
                      ),
                    ]
                  : null,
            ),
          ),
        ],
      ),
    );
  }

  // Dynamic Episode Row with Thumbnail, Title, Duration, Download Icon
  Widget _buildDynamicEpisodeRow(
    BuildContext context,
    AnimeModel anime,
    int epNum,
    EpisodeModel? existingEp,
  ) {
    final title = existingEp?.title.isNotEmpty == true && existingEp?.title != 'Episode $epNum'
        ? '$epNum. ${existingEp!.title}'
        : '$epNum. Episode $epNum';
    final duration = existingEp?.duration?.isNotEmpty == true ? existingEp!.duration! : '24 min';
    final thumbUrl = existingEp?.thumbnail?.isNotEmpty == true
        ? existingEp!.thumbnail!
        : (anime.bannerImage?.isNotEmpty == true ? anime.bannerImage! : anime.displayPoster);

    return GestureDetector(
      onTap: () => context.push('/watch/${anime.slug}/$epNum'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        child: Row(
          children: [
            // Thumbnail with Play Circle Overlay
            Stack(
              alignment: Alignment.center,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: CachedNetworkImage(
                    imageUrl: thumbUrl,
                    width: 110,
                    height: 64,
                    fit: BoxFit.cover,
                    alignment: Alignment.topCenter,
                    placeholder: (_, _) => Container(color: const Color(0xFF181A29)),
                    errorWidget: (_, _, _) => Container(color: const Color(0xFF181A29)),
                  ),
                ),
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.6),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                  ),
                  child: const Center(
                    child: Icon(Icons.play_arrow_rounded, color: Colors.white, size: 20),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 12),

            // Title & Duration
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    duration,
                    style: const TextStyle(
                      color: Color(0xFF9CA3AF),
                      fontSize: 11.5,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),

            // Download Icon (Matching Image 2)
            IconButton(
              icon: const Icon(Icons.arrow_downward_rounded, color: Colors.white70, size: 20),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Downloading Episode $epNum of ${anime.title}...')),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
