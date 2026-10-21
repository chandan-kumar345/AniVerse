import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../network/api_client.dart';
import '../../data/repositories/anime_repository.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/models/anime_model.dart';

import 'package:shared_preferences/shared_preferences.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return AuthRepository(apiClient: client);
});

final isLoggedInProvider = FutureProvider<bool>((ref) async {
  final repo = ref.watch(authRepositoryProvider);
  return repo.isLoggedIn();
});

final currentUserProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final repo = ref.watch(authRepositoryProvider);
  return repo.getCurrentUser();
});

final animeRepositoryProvider = Provider<AnimeRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return AnimeRepository(apiClient: client);
});

// Single Unified Home Provider for zero-latency instant rendering
final homeDataProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final repo = ref.watch(animeRepositoryProvider);
  return repo.getHomeData();
});

// Watchlist State Management
class WatchlistNotifier extends StateNotifier<Set<String>> {
  WatchlistNotifier() : super({}) {
    _loadWatchlist();
  }

  Future<void> _loadWatchlist() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = prefs.getStringList('aniverse_saved_watchlist') ?? [];
      state = list.toSet();
    } catch (_) {}
  }

  Future<void> toggle(String slug) async {
    final next = Set<String>.from(state);
    if (next.contains(slug)) {
      next.remove(slug);
    } else {
      next.add(slug);
    }
    state = next;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList('aniverse_saved_watchlist', next.toList());
    } catch (_) {}
  }

  bool contains(String slug) => state.contains(slug);
}

final watchlistNotifierProvider = StateNotifierProvider<WatchlistNotifier, Set<String>>((ref) {
  return WatchlistNotifier();
});

// Home Page Data Providers
final trendingAnimeProvider = FutureProvider<List<AnimeModel>>((ref) async {
  final repo = ref.watch(animeRepositoryProvider);
  return repo.getTrending();
});

final popularAnimeProvider = FutureProvider<List<AnimeModel>>((ref) async {
  final repo = ref.watch(animeRepositoryProvider);
  return repo.getPopular();
});

final topTenAnimeProvider = FutureProvider<List<AnimeModel>>((ref) async {
  final repo = ref.watch(animeRepositoryProvider);
  return repo.getTopTen();
});

final genresListProvider = FutureProvider<List<String>>((ref) async {
  final repo = ref.watch(animeRepositoryProvider);
  return repo.getGenres();
});
final animeGenresProvider = genresListProvider;

final animeMoviesProvider = FutureProvider<List<AnimeModel>>((ref) async {
  final repo = ref.watch(animeRepositoryProvider);
  return repo.getAnimeList(contentType: 'movie', limit: 16);
});

// Bottom Navigation Tab Index Provider
final bottomNavIndexProvider = StateProvider<int>((ref) => 0);

// Explore Filter State Providers
final selectedGenreFilterProvider = StateProvider<String>((ref) => 'All');
final selectedTypeFilterProvider = StateProvider<String>((ref) => 'All');
final selectedStatusFilterProvider = StateProvider<String>((ref) => 'All');
final selectedSortFilterProvider = StateProvider<String>((ref) => 'popular');
final selectedYearFilterProvider = StateProvider<String>((ref) => 'All');
final selectedDubFilterProvider = StateProvider<bool?>((ref) => null);
final exploreCurrentPageProvider = StateProvider<int>((ref) => 1);

// Provider for animes filtered by selected genre (for home or quick views)
final genreFilteredAnimeProvider = FutureProvider.family<List<AnimeModel>, String>((ref, genre) async {
  final repo = ref.watch(animeRepositoryProvider);
  if (genre == 'All' || genre.isEmpty) {
    return repo.getTrending();
  }
  return repo.getAnimeList(genre: genre, limit: 30);
});

// Backward compatible provider for simple list
final animeExploreListProvider = FutureProvider<List<AnimeModel>>((ref) async {
  final repo = ref.watch(animeRepositoryProvider);
  final genre = ref.watch(selectedGenreFilterProvider);
  final type = ref.watch(selectedTypeFilterProvider);
  final status = ref.watch(selectedStatusFilterProvider);
  final sort = ref.watch(selectedSortFilterProvider);
  final yearStr = ref.watch(selectedYearFilterProvider);
  final hasDub = ref.watch(selectedDubFilterProvider);
  final page = ref.watch(exploreCurrentPageProvider);

  final year = int.tryParse(yearStr);

  return repo.getAnimeList(
    page: page,
    limit: 30,
    genre: genre == 'All' ? null : genre,
    type: type == 'All' ? null : type,
    status: status == 'All' ? null : status,
    sort: sort,
    year: year,
    hasDub: hasDub,
  );
});

// Full Paginated Explore Provider
final paginatedExploreProvider = FutureProvider<PaginatedAnimeResponse>((ref) async {
  final repo = ref.watch(animeRepositoryProvider);
  final genre = ref.watch(selectedGenreFilterProvider);
  final type = ref.watch(selectedTypeFilterProvider);
  final status = ref.watch(selectedStatusFilterProvider);
  final sort = ref.watch(selectedSortFilterProvider);
  final yearStr = ref.watch(selectedYearFilterProvider);
  final hasDub = ref.watch(selectedDubFilterProvider);
  final page = ref.watch(exploreCurrentPageProvider);

  final year = int.tryParse(yearStr);

  return repo.getPaginatedAnimeList(
    page: page,
    limit: 30,
    genre: genre == 'All' ? null : genre,
    type: type == 'All' ? null : type,
    status: status == 'All' ? null : status,
    sort: sort,
    year: year,
    hasDub: hasDub,
  );
});
