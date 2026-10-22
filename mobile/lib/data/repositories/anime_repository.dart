import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/anime_model.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';
import '../seed/anime_seed_data.dart';

class AnimeRepository {
  AnimeRepository({required ApiClient apiClient}) : _client = apiClient;

  final ApiClient _client;

  // In-memory cache for ultra-fast instant home loading
  Map<String, dynamic>? _cachedHomeData;
  DateTime? _lastHomeFetchTime;
  Future<Map<String, dynamic>>? _inFlightHomeRequest;
  bool _isInitialized = false;

  void clearCache() {
    _cachedHomeData = null;
    _lastHomeFetchTime = null;
    _inFlightHomeRequest = null;
    _isInitialized = false;
  }

  Future<void> _ensureInitialized() async {
    if (_isInitialized) return;
    _isInitialized = true;
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedStr = prefs.getString('aniverse_home_cache_v2');
      if (cachedStr != null && cachedStr.isNotEmpty) {
        final decoded = jsonDecode(cachedStr);
        if (decoded is Map && (decoded['trending'] != null || decoded['topTen'] != null)) {
          _cachedHomeData = Map<String, dynamic>.from(decoded);
          return;
        }
      }
    } catch (_) {}
    // If local cache not present, immediately prime with built-in verified seed data
    _cachedHomeData = AnimeSeedData.initialHomeData;
  }

  Future<void> _persistCache(Map<String, dynamic> data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('aniverse_home_cache_v2', jsonEncode(data));
    } catch (_) {}
  }

  Future<Map<String, dynamic>> getHomeData({bool forceRefresh = false}) async {
    await _ensureInitialized();

    if (!forceRefresh &&
        _cachedHomeData != null &&
        _cachedHomeData!.isNotEmpty &&
        _lastHomeFetchTime != null &&
        DateTime.now().difference(_lastHomeFetchTime!).inMinutes < 10) {
      return _cachedHomeData!;
    }

    if (!forceRefresh && _inFlightHomeRequest != null) {
      return _inFlightHomeRequest!;
    }

    final Future<Map<String, dynamic>> future = () async {
      // 1. Fast Path: Unified /api/anime/home endpoint
      try {
        final response = await _client.dio.get(ApiConstants.home);
        if (response.data is Map &&
            (response.data['trending'] != null || response.data['topTen'] != null)) {
          _cachedHomeData = Map<String, dynamic>.from(response.data as Map);
          _lastHomeFetchTime = DateTime.now();
          _persistCache(_cachedHomeData!);
          return _cachedHomeData!;
        }
      } catch (_) {
        // Fallback to parallel endpoints
      }

      // 2. Fallback Path: Parallel queries with Future.wait (matching website Home.tsx)
      try {
        final results = await Future.wait([
          _client.dio.get(ApiConstants.trending).catchError((_) => null as dynamic),
          _client.dio.get(ApiConstants.popular).catchError((_) => null as dynamic),
          _client.dio.get(ApiConstants.topTen).catchError((_) => null as dynamic),
          _client.dio.get(ApiConstants.genres).catchError((_) => null as dynamic),
        ]);

        final dynamic trendingRes = results[0];
        final dynamic popularRes = results[1];
        final dynamic topTenRes = results[2];
        final dynamic genresRes = results[3];

        final List trendingList = (trendingRes != null && trendingRes.data is Map)
            ? (trendingRes.data['trending'] ?? trendingRes.data['spotlight'] ?? [])
            : [];
        final List popularList = (popularRes != null && popularRes.data is Map)
            ? (popularRes.data['popular'] ?? [])
            : [];
        final List topTenList = (topTenRes != null && topTenRes.data is Map)
            ? (topTenRes.data['topTen'] ?? [])
            : [];
        final List genresList = (genresRes != null && genresRes.data is Map)
            ? (genresRes.data['genres'] ?? [])
            : [];

        if (trendingList.isNotEmpty || popularList.isNotEmpty || topTenList.isNotEmpty) {
          final merged = Map<String, dynamic>.from(_cachedHomeData ?? AnimeSeedData.initialHomeData);
          if (trendingList.isNotEmpty) merged['trending'] = trendingList;
          if (popularList.isNotEmpty) merged['popular'] = popularList;
          if (topTenList.isNotEmpty) merged['topTen'] = topTenList;
          if (genresList.isNotEmpty) merged['genres'] = genresList;

          _cachedHomeData = merged;
          _lastHomeFetchTime = DateTime.now();
          _persistCache(_cachedHomeData!);
          return _cachedHomeData!;
        }
      } catch (_) {}

      // 3. Fallback to cached or verified seed data
      return _cachedHomeData ?? AnimeSeedData.initialHomeData;
    }();

    _inFlightHomeRequest = future;
    try {
      return await future;
    } finally {
      _inFlightHomeRequest = null;
    }
  }

  Future<List<AnimeModel>> getTrending() async {
    await _ensureInitialized();

    if (_cachedHomeData != null && _cachedHomeData!['trending'] is List) {
      final List list = _cachedHomeData!['trending'];
      if (list.isNotEmpty) {
        return list.map((e) => AnimeModel.fromJson(e)).toList();
      }
    }

    final home = await getHomeData();
    if (home['trending'] is List && (home['trending'] as List).isNotEmpty) {
      return (home['trending'] as List).map((e) => AnimeModel.fromJson(e)).toList();
    }

    try {
      final response = await _client.dio.get(ApiConstants.trending);
      final List list = response.data['trending'] ?? response.data['spotlight'] ?? [];
      if (list.isNotEmpty) {
        return list.map((e) => AnimeModel.fromJson(e)).toList();
      }
    } catch (_) {}

    // Fallback to seed data
    return AnimeSeedData.trending.map((e) => AnimeModel.fromJson(e)).toList();
  }

  Future<List<AnimeModel>> getPopular() async {
    await _ensureInitialized();

    if (_cachedHomeData != null && _cachedHomeData!['popular'] is List) {
      final List list = _cachedHomeData!['popular'];
      if (list.isNotEmpty) {
        return list.map((e) => AnimeModel.fromJson(e)).toList();
      }
    }

    final home = await getHomeData();
    if (home['popular'] is List && (home['popular'] as List).isNotEmpty) {
      return (home['popular'] as List).map((e) => AnimeModel.fromJson(e)).toList();
    }

    try {
      final response = await _client.dio.get(ApiConstants.popular);
      final List list = response.data['popular'] ?? [];
      if (list.isNotEmpty) {
        return list.map((e) => AnimeModel.fromJson(e)).toList();
      }
    } catch (_) {}

    // Fallback to seed data
    return AnimeSeedData.popular.map((e) => AnimeModel.fromJson(e)).toList();
  }

  Future<List<AnimeModel>> getTopTen() async {
    await _ensureInitialized();

    if (_cachedHomeData != null && _cachedHomeData!['topTen'] is List) {
      final List list = _cachedHomeData!['topTen'];
      if (list.isNotEmpty) {
        return list.map((e) => AnimeModel.fromJson(e)).toList();
      }
    }

    final home = await getHomeData();
    if (home['topTen'] is List && (home['topTen'] as List).isNotEmpty) {
      return (home['topTen'] as List).map((e) => AnimeModel.fromJson(e)).toList();
    }

    try {
      final response = await _client.dio.get(ApiConstants.topTen);
      final List list = response.data['topTen'] ?? [];
      if (list.isNotEmpty) {
        return list.map((e) => AnimeModel.fromJson(e)).toList();
      }
    } catch (_) {}

    // Fallback to seed data
    return AnimeSeedData.topTen.map((e) => AnimeModel.fromJson(e)).toList();
  }

  Future<List<AnimeModel>> getRunningAnime() async {
    List<AnimeModel> airingList = [];

    // 1. Try querying Currently Airing titles from backend API
    try {
      final response = await _client.dio.get(
        ApiConstants.animeList,
        queryParameters: {'status': 'Currently Airing', 'limit': 30},
      );
      final List list = response.data['animeList'] ?? [];
      if (list.isNotEmpty) {
        airingList = list.map((e) => AnimeModel.fromJson(e)).toList();
      }
    } catch (_) {}

    // 2. If backend response empty, combine trending & popular airing series
    if (airingList.isEmpty) {
      try {
        final trending = await getTrending();
        final popular = await getPopular();
        final combined = [...trending, ...popular];
        final seen = <String>{};
        airingList = combined.where((a) => seen.add(a.slug)).toList();
      } catch (_) {}
    }

    // 3. Fallback to topTen if still empty
    if (airingList.isEmpty) {
      airingList = (await getTopTen()).take(12).toList();
    }

    // 4. Sort ascending by remaining countdown (less timer anime will show first)
    airingList.sort((a, b) {
      return a.remainingTimeToAir.compareTo(b.remainingTimeToAir);
    });

    return airingList;
  }

  Future<List<String>> getGenres() async {
    await _ensureInitialized();

    if (_cachedHomeData != null && _cachedHomeData!['genres'] is List) {
      final List list = _cachedHomeData!['genres'];
      if (list.isNotEmpty) {
        return list.map((e) => e.toString()).toList();
      }
    }

    final home = await getHomeData();
    if (home['genres'] is List && (home['genres'] as List).isNotEmpty) {
      return (home['genres'] as List).map((e) => e.toString()).toList();
    }

    try {
      final response = await _client.dio.get(ApiConstants.genres);
      final List list = response.data['genres'] ?? [];
      if (list.isNotEmpty) {
        return list.map((e) => e.toString()).toList();
      }
    } catch (_) {}

    return AnimeSeedData.genres.isNotEmpty
        ? AnimeSeedData.genres
        : const [
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

  Future<List<AnimeModel>> getAnimeList({
    int page = 1,
    int limit = 30,
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
    int limit = 30,
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
      // Fallback: If offline or error on page 1, return matching items from seed data
      if (page == 1) {
        final List<AnimeModel> fallbackList = (AnimeSeedData.trending)
            .map((e) => AnimeModel.fromJson(e))
            .where((a) {
              if (genre != null && genre.isNotEmpty && genre != 'All') {
                return a.genres.toLowerCase().contains(genre.toLowerCase());
              }
              if (contentType != null && contentType.isNotEmpty && contentType != 'All') {
                return (a.contentType ?? '').toLowerCase() == contentType.toLowerCase();
              }
              return true;
            })
            .toList();
        if (fallbackList.isNotEmpty) {
          return PaginatedAnimeResponse(
            animeList: fallbackList,
            total: fallbackList.length,
            page: 1,
            limit: limit,
            totalPages: 1,
          );
        }
      }
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
      // Fallback to seed data item if matching slug exists
      for (final raw in [...AnimeSeedData.topTen, ...AnimeSeedData.trending, ...AnimeSeedData.popular]) {
        if (raw['slug'] == slug) {
          return AnimeModel.fromJson(raw);
        }
      }
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
