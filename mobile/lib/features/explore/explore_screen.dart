import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/safe_text.dart';
import '../../core/widgets/anime_card.dart';
import '../../core/providers/app_providers.dart';
import '../../data/models/anime_model.dart';

class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});

  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  bool _isAgeVerified = false;

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
    'Science Fiction',
    'Mecha',
    'Sports',
    'Supernatural',
    'Historical',
    'Family',
    'Music',
    '18+'
  ];

  static const List<String> _allTypes = [
    'All',
    'TV',
    'Movie',
    'OVA',
    'ONA',
    'Special',
  ];

  static const List<String> _allStatuses = [
    'All',
    'Currently Airing',
    'Finished Airing',
    'Not Yet Aired',
  ];

  static const Map<String, String> _sortOptions = {
    'popular': 'Most Popular',
    'score': 'Top Rated',
    'latest': 'Latest Update',
    'year': 'Release Year',
  };

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

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _scrollToTop() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOutCubic,
      );
    }
  }

  void _clearAllFilters() {
    ref.read(selectedGenreFilterProvider.notifier).state = 'All';
    ref.read(selectedTypeFilterProvider.notifier).state = 'All';
    ref.read(selectedStatusFilterProvider.notifier).state = 'All';
    ref.read(selectedSortFilterProvider.notifier).state = 'popular';
    ref.read(selectedYearFilterProvider.notifier).state = 'All';
    ref.read(selectedDubFilterProvider.notifier).state = null;
    ref.read(exploreCurrentPageProvider.notifier).state = 1;
    _scrollToTop();
  }

  bool _hasActiveFilters() {
    return ref.watch(selectedGenreFilterProvider) != 'All' ||
        ref.watch(selectedTypeFilterProvider) != 'All' ||
        ref.watch(selectedStatusFilterProvider) != 'All' ||
        ref.watch(selectedSortFilterProvider) != 'popular' ||
        ref.watch(selectedYearFilterProvider) != 'All' ||
        ref.watch(selectedDubFilterProvider) != null;
  }

  @override
  Widget build(BuildContext context) {
    final paginatedAsync = ref.watch(paginatedExploreProvider);
    final selectedGenre = ref.watch(selectedGenreFilterProvider);
    final selectedType = ref.watch(selectedTypeFilterProvider);
    final selectedStatus = ref.watch(selectedStatusFilterProvider);
    final selectedSort = ref.watch(selectedSortFilterProvider);
    final selectedYear = ref.watch(selectedYearFilterProvider);
    final selectedDub = ref.watch(selectedDubFilterProvider);
    final currentPage = ref.watch(exploreCurrentPageProvider);

    return Scaffold(
      backgroundColor: AppColors.bgVoid,
      appBar: AppBar(
        backgroundColor: AppColors.bgVoid,
        elevation: 0,
        title: const SafeText(
          'Explore Catalog',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: AppColors.textPrimary),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded, color: Colors.white),
            onPressed: () => context.push('/search'),
          ),
          if (_hasActiveFilters())
            TextButton(
              onPressed: _clearAllFilters,
              child: const SafeText(
                'Reset',
                style: TextStyle(color: AppColors.primaryNeon, fontWeight: FontWeight.w700, fontSize: 13),
              ),
            ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primaryNeon,
          backgroundColor: AppColors.surfaceElevated,
          onRefresh: () async {
            ref.invalidate(paginatedExploreProvider);
          },
          child: Column(
            children: [
              // Horizontal Filter Chips Bar
              Container(
                height: 48,
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    _buildFilterChip(
                      icon: Icons.category_rounded,
                      label: 'Genre: $selectedGenre',
                      isActive: selectedGenre != 'All',
                      onTap: () => _openGenreSheet(context),
                    ),
                    const SizedBox(width: 8),
                    _buildFilterChip(
                      icon: Icons.sort_rounded,
                      label: 'Sort: ${_sortOptions[selectedSort] ?? selectedSort}',
                      isActive: selectedSort != 'popular',
                      onTap: () => _openSortSheet(context),
                    ),
                    const SizedBox(width: 8),
                    _buildFilterChip(
                      icon: Icons.tv_rounded,
                      label: 'Type: $selectedType',
                      isActive: selectedType != 'All',
                      onTap: () => _openTypeSheet(context),
                    ),
                    const SizedBox(width: 8),
                    _buildFilterChip(
                      icon: Icons.calendar_month_rounded,
                      label: 'Year: $selectedYear',
                      isActive: selectedYear != 'All',
                      onTap: () => _openYearSheet(context),
                    ),
                    const SizedBox(width: 8),
                    _buildFilterChip(
                      icon: Icons.timelapse_rounded,
                      label: 'Status: $selectedStatus',
                      isActive: selectedStatus != 'All',
                      onTap: () => _openStatusSheet(context),
                    ),
                    const SizedBox(width: 8),
                    _buildFilterChip(
                      icon: Icons.record_voice_over_rounded,
                      label: selectedDub == null
                          ? 'Audio: All'
                          : (selectedDub ? 'Dubbed' : 'Subbed'),
                      isActive: selectedDub != null,
                      onTap: () => _openAudioSheet(context),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 4),

              // Results Count Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: paginatedAsync.when(
                  data: (data) => Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      SafeText(
                        '${data.total} Titles Found',
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      SafeText(
                        'Page ${data.page} of ${data.totalPages}',
                        style: const TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  loading: () => const Row(
                    children: [
                      SafeText(
                        'Loading titles...',
                        style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                      ),
                    ],
                  ),
                  error: (_, __) => const SizedBox.shrink(),
                ),
              ),

              // 2-Column Responsive Anime Grid
              Expanded(
                child: paginatedAsync.when(
                  data: (data) {
                    final list = data.animeList;
                    if (list.isEmpty) {
                      return Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 64,
                                height: 64,
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceElevated,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.search_off_rounded, color: AppColors.textMuted, size: 32),
                              ),
                              const SizedBox(height: 16),
                              const SafeText(
                                'No anime found matching your criteria',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 8),
                              const SafeText(
                                'Try resetting your filters to explore our full library of 500+ anime.',
                                textAlign: TextAlign.center,
                                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                              ),
                              const SizedBox(height: 20),
                              ElevatedButton(
                                onPressed: _clearAllFilters,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primaryNeon,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                                ),
                                child: const SafeText(
                                  'Reset Filters',
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }

                    return GridView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                        maxCrossAxisExtent: 200,
                        childAspectRatio: 0.58,
                        mainAxisSpacing: 14,
                        crossAxisSpacing: 14,
                      ),
                      itemCount: list.length,
                      itemBuilder: (context, index) {
                        final anime = list[index];
                        return AnimeCard(
                          anime: anime,
                          onTap: () => context.push('/anime/${anime.slug}'),
                        );
                      },
                    );
                  },
                  loading: () => GridView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                      maxCrossAxisExtent: 200,
                      childAspectRatio: 0.58,
                      mainAxisSpacing: 14,
                      crossAxisSpacing: 14,
                    ),
                    itemCount: 8,
                    itemBuilder: (context, index) {
                      return Shimmer.fromColors(
                        baseColor: AppColors.surfaceCard,
                        highlightColor: AppColors.surfaceElevated,
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppColors.surfaceCard,
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      );
                    },
                  ),
                  error: (e, _) => Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.cloud_off_rounded, color: AppColors.textMuted, size: 40),
                          const SizedBox(height: 12),
                          SafeText(
                            'Failed to load catalog: $e',
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () => ref.invalidate(paginatedExploreProvider),
                            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryNeon),
                            child: const SafeText('Retry', style: TextStyle(color: Colors.white)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              // Bottom Pagination Controls (Previous / Next)
              paginatedAsync.when(
                data: (data) {
                  if (data.totalPages <= 1) return const SizedBox.shrink();
                  final isFirstPage = data.page <= 1;
                  final isLastPage = data.page >= data.totalPages;

                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceCard,
                      border: Border(top: BorderSide(color: AppColors.border, width: 0.8)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Previous Page Button
                        ElevatedButton.icon(
                          onPressed: isFirstPage
                              ? null
                              : () {
                                  ref.read(exploreCurrentPageProvider.notifier).state = data.page - 1;
                                  _scrollToTop();
                                },
                          icon: const Icon(Icons.chevron_left_rounded, size: 18),
                          label: const SafeText('Prev'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.surfaceElevated,
                            foregroundColor: Colors.white,
                            disabledBackgroundColor: AppColors.surfaceElevated.withOpacity(0.4),
                            disabledForegroundColor: AppColors.textMuted,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),

                        // Current Page Indicator
                        SafeText(
                          'Page ${data.page} of ${data.totalPages}',
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),

                        // Next Page Button
                        ElevatedButton.icon(
                          onPressed: isLastPage
                              ? null
                              : () {
                                  ref.read(exploreCurrentPageProvider.notifier).state = data.page + 1;
                                  _scrollToTop();
                                },
                          icon: const SafeText('Next'),
                          label: const Icon(Icons.chevron_right_rounded, size: 18),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryNeon,
                            foregroundColor: Colors.white,
                            disabledBackgroundColor: AppColors.surfaceElevated.withOpacity(0.4),
                            disabledForegroundColor: AppColors.textMuted,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                      ],
                    ),
                  );
                },
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Filter Pill Chip
  Widget _buildFilterChip({
    required IconData icon,
    required String label,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primaryNeon.withOpacity(0.18) : AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isActive ? AppColors.primaryNeon : AppColors.border,
            width: isActive ? 1.2 : 0.8,
          ),
          boxShadow: isActive
              ? [BoxShadow(color: AppColors.primaryGlow.withOpacity(0.3), blurRadius: 6)]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 14,
              color: isActive ? AppColors.primaryNeon : AppColors.textSecondary,
            ),
            const SizedBox(width: 6),
            SafeText(
              label,
              style: TextStyle(
                color: isActive ? Colors.white : AppColors.textSecondary,
                fontSize: 12,
                fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              Icons.keyboard_arrow_down_rounded,
              size: 16,
              color: isActive ? AppColors.primaryNeon : AppColors.textMuted,
            ),
          ],
        ),
      ),
    );
  }

  // Genre Bottom Sheet Modal
  void _openGenreSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        final current = ref.watch(selectedGenreFilterProvider);
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const SafeText(
                      'Select Genre',
                      style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.white),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: Colors.white, size: 20),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: SingleChildScrollView(
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _allGenres.map((g) {
                        final isSel = current == g;
                        final is18Plus = g == '18+';
                        return ActionChip(
                          backgroundColor: isSel
                              ? (is18Plus ? const Color(0xFFE11D48) : AppColors.primaryNeon)
                              : AppColors.surfaceCard,
                          label: SafeText(
                            g,
                            style: TextStyle(
                              color: isSel ? Colors.white : AppColors.textPrimary,
                              fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                              fontSize: 12,
                            ),
                          ),
                          onPressed: () {
                            Navigator.pop(context);
                            if (g == '18+' && !_isAgeVerified) {
                              _showAgeVerificationDialog(context);
                              return;
                            }
                            ref.read(selectedGenreFilterProvider.notifier).state = g;
                            ref.read(exploreCurrentPageProvider.notifier).state = 1;
                            _scrollToTop();
                          },
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // Sort By Bottom Sheet
  void _openSortSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        final current = ref.watch(selectedSortFilterProvider);
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SafeText(
                  'Sort Anime By',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.white),
                ),
                const SizedBox(height: 14),
                ..._sortOptions.entries.map((entry) {
                  final isSel = current == entry.key;
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: SafeText(
                      entry.value,
                      style: TextStyle(
                        color: isSel ? AppColors.primaryNeon : AppColors.textPrimary,
                        fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                      ),
                    ),
                    trailing: isSel
                        ? const Icon(Icons.check_circle_rounded, color: AppColors.primaryNeon)
                        : null,
                    onTap: () {
                      ref.read(selectedSortFilterProvider.notifier).state = entry.key;
                      ref.read(exploreCurrentPageProvider.notifier).state = 1;
                      Navigator.pop(context);
                      _scrollToTop();
                    },
                  );
                }),
              ],
            ),
          ),
        );
      },
    );
  }

  // Type Bottom Sheet
  void _openTypeSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        final current = ref.watch(selectedTypeFilterProvider);
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SafeText(
                  'Select Format / Type',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.white),
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _allTypes.map((t) {
                    final isSel = current == t;
                    return ActionChip(
                      backgroundColor: isSel ? AppColors.primaryNeon : AppColors.surfaceCard,
                      label: SafeText(
                        t,
                        style: TextStyle(
                          color: isSel ? Colors.white : AppColors.textPrimary,
                          fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                        ),
                      ),
                      onPressed: () {
                        ref.read(selectedTypeFilterProvider.notifier).state = t;
                        ref.read(exploreCurrentPageProvider.notifier).state = 1;
                        Navigator.pop(context);
                        _scrollToTop();
                      },
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // Year Bottom Sheet
  void _openYearSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        final current = ref.watch(selectedYearFilterProvider);
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SafeText(
                  'Select Release Year',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.white),
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _allYears.map((y) {
                    final isSel = current == y;
                    return ActionChip(
                      backgroundColor: isSel ? AppColors.primaryNeon : AppColors.surfaceCard,
                      label: SafeText(
                        y,
                        style: TextStyle(
                          color: isSel ? Colors.white : AppColors.textPrimary,
                          fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                        ),
                      ),
                      onPressed: () {
                        ref.read(selectedYearFilterProvider.notifier).state = y;
                        ref.read(exploreCurrentPageProvider.notifier).state = 1;
                        Navigator.pop(context);
                        _scrollToTop();
                      },
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // Status Bottom Sheet
  void _openStatusSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        final current = ref.watch(selectedStatusFilterProvider);
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SafeText(
                  'Select Airing Status',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.white),
                ),
                const SizedBox(height: 14),
                ..._allStatuses.map((s) {
                  final isSel = current == s;
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: SafeText(
                      s,
                      style: TextStyle(
                        color: isSel ? AppColors.primaryNeon : AppColors.textPrimary,
                        fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                      ),
                    ),
                    trailing: isSel
                        ? const Icon(Icons.check_circle_rounded, color: AppColors.primaryNeon)
                        : null,
                    onTap: () {
                      ref.read(selectedStatusFilterProvider.notifier).state = s;
                      ref.read(exploreCurrentPageProvider.notifier).state = 1;
                      Navigator.pop(context);
                      _scrollToTop();
                    },
                  );
                }),
              ],
            ),
          ),
        );
      },
    );
  }

  // Audio / Dub Sheet
  void _openAudioSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        final current = ref.watch(selectedDubFilterProvider);
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SafeText(
                  'Audio / Language',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.white),
                ),
                const SizedBox(height: 14),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: SafeText(
                    'All Languages',
                    style: TextStyle(
                      color: current == null ? AppColors.primaryNeon : AppColors.textPrimary,
                      fontWeight: current == null ? FontWeight.w800 : FontWeight.w600,
                    ),
                  ),
                  trailing: current == null
                      ? const Icon(Icons.check_circle_rounded, color: AppColors.primaryNeon)
                      : null,
                  onTap: () {
                    ref.read(selectedDubFilterProvider.notifier).state = null;
                    ref.read(exploreCurrentPageProvider.notifier).state = 1;
                    Navigator.pop(context);
                    _scrollToTop();
                  },
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: SafeText(
                    'Dubbed (English Dub)',
                    style: TextStyle(
                      color: current == true ? AppColors.primaryNeon : AppColors.textPrimary,
                      fontWeight: current == true ? FontWeight.w800 : FontWeight.w600,
                    ),
                  ),
                  trailing: current == true
                      ? const Icon(Icons.check_circle_rounded, color: AppColors.primaryNeon)
                      : null,
                  onTap: () {
                    ref.read(selectedDubFilterProvider.notifier).state = true;
                    ref.read(exploreCurrentPageProvider.notifier).state = 1;
                    Navigator.pop(context);
                    _scrollToTop();
                  },
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: SafeText(
                    'Subbed Only',
                    style: TextStyle(
                      color: current == false ? AppColors.primaryNeon : AppColors.textPrimary,
                      fontWeight: current == false ? FontWeight.w800 : FontWeight.w600,
                    ),
                  ),
                  trailing: current == false
                      ? const Icon(Icons.check_circle_rounded, color: AppColors.primaryNeon)
                      : null,
                  onTap: () {
                    ref.read(selectedDubFilterProvider.notifier).state = false;
                    ref.read(exploreCurrentPageProvider.notifier).state = 1;
                    Navigator.pop(context);
                    _scrollToTop();
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // Age Verification Dialog (Matching web's AgeVerificationModal)
  void _showAgeVerificationDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          backgroundColor: AppColors.surfaceElevated,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Color(0xFFE11D48), size: 28),
              SizedBox(width: 8),
              SafeText(
                'Age Verification',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.white),
              ),
            ],
          ),
          content: const SafeText(
            'This category contains 18+ mature and uncensored anime content intended exclusively for adult audiences.\n\nAre you at least 18 years old?',
            style: TextStyle(fontSize: 13, height: 1.4, color: AppColors.textSecondary),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: const SafeText('Decline', style: TextStyle(color: AppColors.textMuted)),
            ),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _isAgeVerified = true;
                });
                Navigator.pop(context);
                ref.read(selectedGenreFilterProvider.notifier).state = '18+';
                ref.read(exploreCurrentPageProvider.notifier).state = 1;
                _scrollToTop();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE11D48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const SafeText(
                'I am 18 or Older',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
              ),
            ),
          ],
        );
      },
    );
  }
}
