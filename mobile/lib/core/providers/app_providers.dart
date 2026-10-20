import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../network/api_client.dart';
import '../../data/repositories/anime_repository.dart';
import '../../data/models/anime_model.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

final animeRepositoryProvider = Provider<AnimeRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return AnimeRepository(apiClient: client);
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

final animeMoviesProvider = FutureProvider<List<AnimeModel>>((ref) async {
  final repo = ref.watch(animeRepositoryProvider);
  return repo.getAnimeList(contentType: 'movie', limit: 16);
});

// Explore Filter State Providers
final selectedGenreFilterProvider = StateProvider<String>((ref) => 'All');
final selectedTypeFilterProvider = StateProvider<String>((ref) => 'All');
final selectedStatusFilterProvider = StateProvider<String>((ref) => 'All');
final selectedSortFilterProvider = StateProvider<String>((ref) => 'popular');
final selectedYearFilterProvider = StateProvider<String>((ref) => 'All');
final selectedDubFilterProvider = StateProvider<bool?>((ref) => null);
final exploreCurrentPageProvider = StateProvider<int>((ref) => 1);

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
    limit: 24,
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
    limit: 24,
    genre: genre == 'All' ? null : genre,
    type: type == 'All' ? null : type,
    status: status == 'All' ? null : status,
    sort: sort,
    year: year,
    hasDub: hasDub,
  );
});
