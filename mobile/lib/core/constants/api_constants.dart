import 'package:flutter/foundation.dart';
import 'dart:io' show Platform;

class ApiConstants {
  // Automatically selects correct host based on device platform
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:5000';
    }
    try {
      if (Platform.isAndroid) {
        // Android Emulator loops back to development host via 10.0.2.2
        return 'http://10.0.2.2:5000';
      }
    } catch (_) {}
    return 'http://localhost:5000';
  }

  // Auth Endpoints
  static const String login = '/api/auth/login';
  static const String register = '/api/auth/register';
  static const String profile = '/api/auth/profile';

  // Anime Catalog Endpoints
  static const String animeList = '/api/anime';
  static const String trending = '/api/anime/trending';
  static const String popular = '/api/anime/popular';
  static const String topTen = '/api/anime/top-ten';
  static const String genres = '/api/anime/genres';
  static const String search = '/api/anime/search';

  // Details & Streaming
  static String animeDetail(String slug) => '/api/anime/$slug';
  static String episodeSources(String slug, int epNum) =>
      '/api/anime/$slug/episodes/$epNum/sources';

  // Watchlist Endpoints
  static const String watchlist = '/api/watchlist';
  static const String addToWatchlist = '/api/watchlist/add';
  static String watchlistStatus(String animeId) => '/api/watchlist/status/$animeId';
}
