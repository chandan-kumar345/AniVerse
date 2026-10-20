import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/safe_text.dart';
import '../../core/widgets/neon_button.dart';
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

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.bgVoid,
        body: Center(child: CircularProgressIndicator(color: AppColors.primaryNeon)),
      );
    }

    if (_anime == null) {
      return Scaffold(
        backgroundColor: AppColors.bgVoid,
        appBar: AppBar(),
        body: const Center(
          child: SafeText('Anime not found.', style: TextStyle(color: AppColors.textMuted)),
        ),
      );
    }

    final anime = _anime!;

    return Scaffold(
      backgroundColor: AppColors.bgVoid,
      body: CustomScrollView(
        slivers: [
          // Collapsible Header Backdrop
          SliverAppBar(
            expandedHeight: 320,
            pinned: true,
            backgroundColor: AppColors.surfaceCard,
            leading: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.6),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 16),
              ),
              onPressed: () => context.pop(),
            ),
            actions: [
              IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.bookmark_outline_rounded, color: Colors.white, size: 18),
                ),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: SafeText('Saved "${anime.title}" to Watchlist!')),
                  );
                },
              ),
              IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.share_outlined, color: Colors.white, size: 18),
                ),
                onPressed: () {},
              ),
              const SizedBox(width: 8),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl: anime.bannerImage ?? anime.posterImage,
                    fit: BoxFit.cover,
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.transparent,
                          AppColors.bgVoid.withOpacity(0.4),
                          AppColors.bgVoid,
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Metadata & Info Section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  SafeText(
                    anime.title,
                    maxLines: 2,
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Metadata Badges (Year, Rating, Episodes, HD)
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      _badge('TV', AppColors.surfaceElevated),
                      _badge('${anime.totalEpisodes} Episodes', AppColors.surfaceElevated),
                      _badge('HD', AppColors.primaryNeon.withOpacity(0.2), textColor: AppColors.primaryNeon),
                      if (anime.score > 0)
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.star_rounded, color: AppColors.accentGold, size: 16),
                            const SizedBox(width: 3),
                            SafeText(
                              anime.score.toStringAsFixed(1),
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12),
                            ),
                          ],
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Genre Tags
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: anime.genres.split(',').map((g) {
                      final name = g.trim();
                      if (name.isEmpty) return const SizedBox.shrink();
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceCard,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.borderLight, width: 0.5),
                        ),
                        child: SafeText(
                          name,
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w600),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 20),

                  // Action Buttons: Watch Now & + Add to List
                  Row(
                    children: [
                      Expanded(
                        child: NeonButton(
                          text: 'Watch Now',
                          icon: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 20),
                          onPressed: () => context.push('/watch/${anime.slug}/1'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: NeonButton(
                          text: '+ Add to List',
                          isSecondary: true,
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: SafeText('Added "${anime.title}" to Watchlist!')),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Synopsis
                  SafeText(
                    anime.synopsis ?? 'No synopsis available for this title.',
                    maxLines: 4,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Tabs: Episodes | About | More Like This
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: AppColors.border, width: 1)),
              ),
              child: TabBar(
                controller: _tabController,
                indicatorColor: AppColors.primaryNeon,
                indicatorWeight: 3,
                labelColor: AppColors.primaryNeon,
                unselectedLabelColor: AppColors.textMuted,
                labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                tabs: const [
                  Tab(text: 'Episodes'),
                  Tab(text: 'About'),
                  Tab(text: 'More Like This'),
                ],
              ),
            ),
          ),

          // Episode List (Screen 10 in mockup)
          if (anime.episodes.isNotEmpty)
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final ep = anime.episodes[index];
                    return _buildEpisodeItem(context, anime, ep);
                  },
                  childCount: anime.episodes.length,
                ),
              ),
            )
          else
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Center(
                  child: ElevatedButton(
                    onPressed: () => context.push('/watch/${anime.slug}/1'),
                    child: const Text('Play Episode 1'),
                  ),
                ),
              ),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ),
    );
  }

  Widget _badge(String text, Color bgColor, {Color textColor = Colors.white}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: SafeText(
        text,
        style: TextStyle(color: textColor, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }

  Widget _buildEpisodeItem(BuildContext context, AnimeModel anime, EpisodeModel ep) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border, width: 1),
      ),
      child: InkWell(
        onTap: () => context.push('/watch/${anime.slug}/${ep.episodeNumber}'),
        child: Row(
          children: [
            // Thumbnail with Play icon
            Container(
              width: 90,
              height: 56,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                color: AppColors.surfaceElevated,
              ),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl: ep.thumbnail ?? anime.posterImage,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => const Icon(Icons.movie_creation_outlined, color: AppColors.textMuted),
                  ),
                  Center(
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 18),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 14),

            // Episode Title & Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SafeText(
                    '${ep.episodeNumber}. ${ep.title}',
                    maxLines: 1,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  SafeText(
                    ep.duration ?? '24m',
                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                  ),
                ],
              ),
            ),

            // Download Icon
            IconButton(
              icon: const Icon(Icons.download_rounded, color: AppColors.textSecondary, size: 20),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: SafeText('Download started for Episode ${ep.episodeNumber}!')),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
