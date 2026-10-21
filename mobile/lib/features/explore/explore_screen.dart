import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/providers/app_providers.dart';
import '../../data/models/anime_model.dart';

class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});

  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen> {
  final ScrollController _scrollController = ScrollController();

  static const List<String> _allGenres = [
    'All',
    'Action',
    'Adventure',
    'Fantasy',
    'Isekai',
    'Shonen',
    'Romance',
    'Comedy',
    'Drama',
    'Slice of Life',
    'Horror',
    'Psychological',
    'Mystery',
    'Thriller',
    'Sci-Fi',
    'Mecha',
    'Sports',
    'Supernatural',
    '18+',
  ];

  static const List<String> _allYears = [
    'All',
    '2026',
    '2025',
    '2024',
    '2023',
    '2022',
    '2021',
    '2020',
    '2019',
    '2018',
    '2015',
    '2010',
    '2000',
  ];

  static const Map<String, String> _languages = {
    'all': 'All',
    'sub': 'Subbed',
    'dub': 'Dubbed',
    'hindi': 'Hindi Dub',
  };

  static const Map<String, String> _sortOptions = {
    'popular': 'Popular',
    'score': 'Top Rated',
    'latest': 'Latest',
    'year': 'Year',
  };

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToTop() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
      );
    }
  }

  void _openFilterSheet<T>({
    required String title,
    required List<T> items,
    required T selectedItem,
    required String Function(T) itemLabel,
    required void Function(T) onSelected,
  }) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF131524),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                margin: const EdgeInsets.symmetric(vertical: 10),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: Colors.white, size: 20),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              const Divider(color: Color(0xFF1E2130), height: 1),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const Divider(color: Color(0xFF181A29), height: 1),
                  itemBuilder: (context, index) {
                    final item = items[index];
                    final isSelected = item == selectedItem;
                    return ListTile(
                      title: Text(
                        itemLabel(item),
                        style: TextStyle(
                          color: isSelected ? const Color(0xFFFF1E56) : Colors.white,
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                          fontSize: 14,
                        ),
                      ),
                      trailing: isSelected
                          ? const Icon(Icons.check_rounded, color: Color(0xFFFF1E56), size: 20)
                          : null,
                      onTap: () {
                        onSelected(item);
                        Navigator.pop(context);
                        _scrollToTop();
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final paginatedAsync = ref.watch(paginatedExploreProvider);
    final selectedGenre = ref.watch(selectedGenreFilterProvider);
    final selectedYear = ref.watch(selectedYearFilterProvider);
    final selectedDub = ref.watch(selectedDubFilterProvider);
    final selectedSort = ref.watch(selectedSortFilterProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF09080D),
      body: SafeArea(
        child: Column(
          children: [
            // Top Header: "Explore" title & Circular search button (Matching image 1)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 16, 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Explore',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.3,
                    ),
                  ),
                  // Circular search button
                  GestureDetector(
                    onTap: () => context.push('/search'),
                    child: Container(
                      width: 40,
                      height: 40,
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
                ],
              ),
            ),

            // Horizontal Filter Pills: "Genre ⌵", "Year ⌵", "Language ⌵", "Sort ⌵"
            SizedBox(
              height: 38,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  // 1. Genre Filter
                  _buildFilterPill(
                    label: selectedGenre == 'All' ? 'Genre ⌵' : '$selectedGenre ⌵',
                    isActive: selectedGenre != 'All',
                    onTap: () => _openFilterSheet<String>(
                      title: 'Select Genre',
                      items: _allGenres,
                      selectedItem: selectedGenre,
                      itemLabel: (item) => item,
                      onSelected: (val) {
                        ref.read(selectedGenreFilterProvider.notifier).state = val;
                        ref.read(exploreCurrentPageProvider.notifier).state = 1;
                      },
                    ),
                  ),
                  const SizedBox(width: 8),

                  // 2. Year Filter
                  _buildFilterPill(
                    label: selectedYear == 'All' ? 'Year ⌵' : '$selectedYear ⌵',
                    isActive: selectedYear != 'All',
                    onTap: () => _openFilterSheet<String>(
                      title: 'Select Year',
                      items: _allYears,
                      selectedItem: selectedYear,
                      itemLabel: (item) => item,
                      onSelected: (val) {
                        ref.read(selectedYearFilterProvider.notifier).state = val;
                        ref.read(exploreCurrentPageProvider.notifier).state = 1;
                      },
                    ),
                  ),
                  const SizedBox(width: 8),

                  // 3. Language Filter
                  _buildFilterPill(
                    label: selectedDub == null
                        ? 'Language ⌵'
                        : (selectedDub ? 'Dubbed ⌵' : 'Subbed ⌵'),
                    isActive: selectedDub != null,
                    onTap: () => _openFilterSheet<String>(
                      title: 'Select Audio',
                      items: ['all', 'sub', 'dub'],
                      selectedItem: selectedDub == null
                          ? 'all'
                          : (selectedDub ? 'dub' : 'sub'),
                      itemLabel: (item) => _languages[item] ?? item,
                      onSelected: (val) {
                        if (val == 'all') {
                          ref.read(selectedDubFilterProvider.notifier).state = null;
                        } else if (val == 'dub') {
                          ref.read(selectedDubFilterProvider.notifier).state = true;
                        } else {
                          ref.read(selectedDubFilterProvider.notifier).state = false;
                        }
                        ref.read(exploreCurrentPageProvider.notifier).state = 1;
                      },
                    ),
                  ),
                  const SizedBox(width: 8),

                  // 4. Sort Filter
                  _buildFilterPill(
                    label: '${_sortOptions[selectedSort] ?? "Sort"} ⌵',
                    isActive: selectedSort != 'popular',
                    onTap: () => _openFilterSheet<String>(
                      title: 'Sort By',
                      items: _sortOptions.keys.toList(),
                      selectedItem: selectedSort,
                      itemLabel: (item) => _sortOptions[item] ?? item,
                      onSelected: (val) {
                        ref.read(selectedSortFilterProvider.notifier).state = val;
                        ref.read(exploreCurrentPageProvider.notifier).state = 1;
                      },
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // Anime Count & Filter Status Header Row (Shows total count dynamically)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 3.5,
                        height: 14,
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
                        paginatedAsync.hasValue
                            ? '${paginatedAsync.value!.total} Anime Available'
                            : 'Explore Catalog',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.2,
                        ),
                      ),
                    ],
                  ),
                  if (selectedGenre != 'All')
                    GestureDetector(
                      onTap: () {
                        ref.read(selectedGenreFilterProvider.notifier).state = 'All';
                        ref.read(exploreCurrentPageProvider.notifier).state = 1;
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E1724),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFFF1E56).withValues(alpha: 0.5)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              selectedGenre,
                              style: const TextStyle(
                                color: Color(0xFFFF1E56),
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(Icons.close_rounded, color: Color(0xFFFF1E56), size: 12),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 4),

            // 3-Column Grid of Anime Cards (Matching Image 1: Solo Leveling, Attack on Titan, etc.)
            Expanded(
              child: paginatedAsync.when(
                data: (response) {
                  final list = response.animeList;
                  if (list.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.search_off_rounded, color: Color(0xFF64748B), size: 48),
                          const SizedBox(height: 12),
                          const Text(
                            'No anime found matching filters',
                            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                          ),
                          const SizedBox(height: 12),
                          TextButton(
                            onPressed: () {
                              ref.read(selectedGenreFilterProvider.notifier).state = 'All';
                              ref.read(selectedYearFilterProvider.notifier).state = 'All';
                              ref.read(selectedDubFilterProvider.notifier).state = null;
                              ref.read(selectedSortFilterProvider.notifier).state = 'popular';
                              ref.read(exploreCurrentPageProvider.notifier).state = 1;
                            },
                            child: const Text('Reset Filters',
                                style: TextStyle(color: Color(0xFFFF1E56), fontWeight: FontWeight.w700)),
                          ),
                        ],
                      ),
                    );
                  }

                  return GridView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      childAspectRatio: 0.58,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 16,
                    ),
                    itemCount: list.length,
                    itemBuilder: (context, index) {
                      final item = list[index];
                      return _buildExploreGridCard(context, item);
                    },
                  );
                },
                loading: () => _buildExploreSkeletonGrid(),
                error: (_, _) => const Center(
                  child: Text('Failed to load anime', style: TextStyle(color: Color(0xFF64748B))),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Rounded filter pill button
  Widget _buildFilterPill({
    required String label,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFF1E1724) : const Color(0xFF131524),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isActive ? const Color(0xFFFF1E56) : Colors.white.withValues(alpha: 0.12),
            width: isActive ? 1.5 : 1,
          ),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: const Color(0xFFFF1E56).withValues(alpha: 0.3),
                    blurRadius: 8,
                  ),
                ]
              : null,
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: isActive ? const Color(0xFFFF1E56) : const Color(0xFFD1D5DB),
              fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
              fontSize: 12.5,
            ),
          ),
        ),
      ),
    );
  }

  // 3-Column Explore Grid Card (Matching Image 1)
  Widget _buildExploreGridCard(BuildContext context, AnimeModel anime) {
    final year = anime.releasedYear ?? 2024;
    final eps = anime.latestEpisodeNumber > 0 ? anime.latestEpisodeNumber : 12;

    return GestureDetector(
      onTap: () => context.push('/anime/${anime.slug}'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Poster Artwork
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white.withValues(alpha: 0.08), width: 1),
                boxShadow: [
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
                ],
              ),
            ),
          ),
          const SizedBox(height: 6),

          // Anime Title
          Text(
            anime.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 2),

          // Metadata row: "2024  24 eps"
          Text(
            '$year  $eps eps',
            style: const TextStyle(
              color: Color(0xFF9CA3AF),
              fontSize: 10.5,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  // Explore Skeleton Grid
  Widget _buildExploreSkeletonGrid() {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 0.58,
        crossAxisSpacing: 10,
        mainAxisSpacing: 16,
      ),
      itemCount: 9,
      itemBuilder: (context, index) {
        return Shimmer.fromColors(
          baseColor: const Color(0xFF13141F),
          highlightColor: const Color(0xFF1E2130),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF13141F),
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Container(
                width: 70,
                height: 12,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              const SizedBox(height: 3),
              Container(
                width: 45,
                height: 10,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
