class ApiConstants {
  // Live high-speed production backend deployed on Render
  static const String liveBaseUrl = 'https://aniverse-k94k.onrender.com';

  // Automatically selects correct host (allows --dart-define=API_BASE_URL override for local dev)
  static String get baseUrl {
    const custom = String.fromEnvironment('API_BASE_URL');
    if (custom.isNotEmpty) {
      return custom.replaceAll(RegExp(r'/+$'), '');
    }
    return liveBaseUrl;
  }

  // Unified Batch Home Endpoint
  static const String home = '/api/anime/home';

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
