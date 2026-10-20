import '../models/anime_model.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';

class AnimeRepository {
  AnimeRepository({required ApiClient apiClient}) : _client = apiClient;

  final ApiClient _client;

  Future<List<AnimeModel>> getTrending() async {
    try {
      final response = await _client.dio.get(ApiConstants.trending);
      final List list = response.data['trending'] ?? response.data['spotlight'] ?? [];
      if (list.isNotEmpty) {
        return list.map((e) => AnimeModel.fromJson(e)).toList();
      }
    } catch (_) {}

    // Fallback to top anime list
    try {
      final response = await _client.dio.get(ApiConstants.animeList, queryParameters: {'limit': 10});
      final List list = response.data['animeList'] ?? [];
      return list.map((e) => AnimeModel.fromJson(e)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<List<AnimeModel>> getPopular() async {
    try {
      final response = await _client.dio.get(ApiConstants.popular);
      final List list = response.data['popular'] ?? [];
      if (list.isNotEmpty) {
        return list.map((e) => AnimeModel.fromJson(e)).toList();
      }
    } catch (_) {}

    // Fallback to anime list with sort=score
    try {
      final response = await _client.dio.get(ApiConstants.animeList, queryParameters: {'limit': 12, 'sort': 'score'});
      final List list = response.data['animeList'] ?? [];
      return list.map((e) => AnimeModel.fromJson(e)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<List<AnimeModel>> getTopTen() async {
    try {
      final response = await _client.dio.get(ApiConstants.topTen);
      final List list = response.data['topTen'] ?? [];
      if (list.isNotEmpty) {
        return list.map((e) => AnimeModel.fromJson(e)).toList();
      }
    } catch (_) {}

    return getTrending();
  }

  Future<List<String>> getGenres() async {
    try {
      final response = await _client.dio.get(ApiConstants.genres);
      final List list = response.data['genres'] ?? [];
      return list.map((e) => e.toString()).toList();
    } catch (_) {
      return [
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
        '18+'
      ];
    }
  }

  Future<List<AnimeModel>> getAnimeList({
    int page = 1,
    int limit = 24,
    String? genre,
    String? search,
    String? sort = 'popular',
    String? type,
    String? contentType,
    String? status,
    bool? hasDub,
    bool? hasHindi,
    int? year,
  }) async {
    final paginated = await getPaginatedAnimeList(
      page: page,
      limit: limit,
      genre: genre,
      search: search,
      sort: sort,
      type: type,
      contentType: contentType,
      status: status,
      hasDub: hasDub,
      hasHindi: hasHindi,
      year: year,
    );
    return paginated.animeList;
  }

  Future<PaginatedAnimeResponse> getPaginatedAnimeList({
    int page = 1,
    int limit = 24,
    String? genre,
    String? search,
    String? sort = 'popular',
    String? type,
    String? contentType,
    String? status,
    bool? hasDub,
    bool? hasHindi,
    int? year,
  }) async {
    final query = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (genre != null && genre.isNotEmpty && genre != 'All') 'genre': genre,
      if (search != null && search.isNotEmpty) 'search': search,
      if (sort != null && sort.isNotEmpty) 'sort': sort,
      if (type != null && type.isNotEmpty && type != 'All') 'type': type,
      if (contentType != null && contentType.isNotEmpty && contentType != 'All') 'contentType': contentType,
      if (status != null && status.isNotEmpty && status != 'All') 'status': status,
      if (hasDub != null) 'hasDub': hasDub.toString(),
      if (hasHindi != null) 'hasHindi': hasHindi.toString(),
      if (year != null) 'year': year,
    };

    try {
      final response = await _client.dio.get(ApiConstants.animeList, queryParameters: query);
      return PaginatedAnimeResponse.fromJson(response.data);
    } catch (_) {
      return PaginatedAnimeResponse(animeList: [], total: 0, page: page, limit: limit, totalPages: 1);
    }
  }

  Future<AnimeModel?> getAnimeDetail(String slug) async {
    try {
      final response = await _client.dio.get(ApiConstants.animeDetail(slug));
      final data = response.data['anime'] ?? response.data;
      if (data == null) return null;
      return AnimeModel.fromJson(data);
    } catch (_) {
      return null;
    }
  }

  Future<EpisodeSourcesResponse> getEpisodeSources(
    String slug,
    int epNum, {
    String? server,
    String? lang,
  }) async {
    final response = await _client.dio.get(
      ApiConstants.episodeSources(slug, epNum),
      queryParameters: {
        if (server != null) 'server': server,
        if (lang != null) 'lang': lang,
      },
    );
    return EpisodeSourcesResponse.fromJson(response.data);
  }
}
