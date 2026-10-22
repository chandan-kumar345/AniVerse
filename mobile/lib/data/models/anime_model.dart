import '../../core/constants/api_constants.dart';

class AnimeModel {
  final String id;
  final String slug;
  final String title;
  final String? englishTitle;
  final String posterImage;
  final String? bannerImage;
  final double score;
  final String type;
  final String genres;
  final String? status;
  final int totalEpisodes;
  final String? synopsis;
  final List<EpisodeModel> episodes;
  final int? releasedYear;
  final String? duration;
  final bool hasSub;
  final bool hasDub;
  final bool hasHindi;
  final String? rating;
  final String? studio;
  final String? contentType;
  final String? availabilityStatus;
  final int? malId;
  final int? tmdbId;

  AnimeModel({
    required this.id,
    required this.slug,
    required this.title,
    this.englishTitle,
    required this.posterImage,
    this.bannerImage,
    required this.score,
    required this.type,
    required this.genres,
    this.status,
    required this.totalEpisodes,
    this.synopsis,
    this.episodes = const [],
    this.releasedYear,
    this.duration,
    this.hasSub = true,
    this.hasDub = false,
    this.hasHindi = false,
    this.rating,
    this.studio,
    this.contentType,
    this.availabilityStatus,
    this.malId,
    this.tmdbId,
  });

  String get displayPoster {
    if (posterImage.isEmpty) {
      return 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';
    }
    if (posterImage.startsWith('http://') || posterImage.startsWith('https://')) {
      return posterImage;
    }
    if (posterImage.startsWith('/')) {
      return '${ApiConstants.baseUrl}$posterImage';
    }
    return '${ApiConstants.baseUrl}/$posterImage';
  }

  String get displayBanner {
    if (bannerImage != null && bannerImage!.isNotEmpty) {
      if (bannerImage!.startsWith('http://') || bannerImage!.startsWith('https://')) {
        return bannerImage!;
      }
      if (bannerImage!.startsWith('/')) {
        return '${ApiConstants.baseUrl}$bannerImage';
      }
      return '${ApiConstants.baseUrl}/$bannerImage';
    }
    return displayPoster;
  }

  int get latestEpisodeNumber {
    if (episodes.isNotEmpty) {
      return episodes.first.episodeNumber;
    }
    return totalEpisodes > 0 ? totalEpisodes : 1;
  }

  DateTime getNextEpisodeAiringDate() {
    final titleLower = title.toLowerCase();
    int dayOfWeekJST = 6; // Saturday default

    if (titleLower.contains('one piece') || titleLower.contains('demon slayer')) {
      dayOfWeekJST = 7; // Sunday
    } else if (titleLower.contains('bleach') ||
        titleLower.contains('my hero academia') ||
        titleLower.contains('solo leveling') ||
        titleLower.contains('kaiju')) {
      dayOfWeekJST = 6; // Saturday
    } else if (titleLower.contains('jujutsu kaisen') ||
        titleLower.contains('wind breaker')) {
      dayOfWeekJST = 4; // Thursday
    } else if (titleLower.contains('frieren') || titleLower.contains('dandadan')) {
      dayOfWeekJST = 5; // Friday
    } else if (titleLower.contains('blue lock') || titleLower.contains('chainsaw')) {
      dayOfWeekJST = 3; // Wednesday
    } else {
      // Deterministic spread based on title hash
      dayOfWeekJST = (title.codeUnits.fold<int>(0, (acc, c) => acc + c) % 7) + 1;
    }

    int hourJST = 23;
    int minuteJST = 0;

    if (titleLower.contains('one piece')) {
      hourJST = 9;
      minuteJST = 30;
    } else if (titleLower.contains('demon slayer')) {
      hourJST = 23;
      minuteJST = 15;
    } else if (titleLower.contains('bleach')) {
      hourJST = 23;
      minuteJST = 0;
    } else if (titleLower.contains('my hero academia')) {
      hourJST = 17;
      minuteJST = 30;
    } else if (titleLower.contains('jujutsu kaisen')) {
      hourJST = 23;
      minuteJST = 56;
    } else if (titleLower.contains('solo leveling')) {
      hourJST = 23;
      minuteJST = 30;
    } else {
      hourJST = 12 + (title.length % 12);
      minuteJST = (title.length * 13) % 60;
    }

    final nowUtc = DateTime.now().toUtc();
    final nowJst = nowUtc.add(const Duration(hours: 9));

    DateTime targetJst = DateTime.utc(
      nowJst.year,
      nowJst.month,
      nowJst.day,
      hourJST,
      minuteJST,
    );

    int daysDiff = dayOfWeekJST - nowJst.weekday;
    if (daysDiff < 0 || (daysDiff == 0 && nowJst.isAfter(targetJst))) {
      daysDiff += 7;
    }
    targetJst = targetJst.add(Duration(days: daysDiff));

    final targetUtc = targetJst.subtract(const Duration(hours: 9));
    return targetUtc.toLocal();
  }

  Duration get remainingTimeToAir {
    final target = getNextEpisodeAiringDate();
    final now = DateTime.now();
    final diff = target.difference(now);
    return diff.isNegative ? Duration.zero : diff;
  }

  String get countdownString {
    final diff = remainingTimeToAir;
    if (diff.inSeconds <= 0) return 'Airing Now';
    final days = diff.inDays;
    final hours = diff.inHours % 24;
    final minutes = diff.inMinutes % 60;
    final seconds = diff.inSeconds % 60;

    if (days > 0) {
      return '${days}d ${hours.toString().padLeft(2, '0')}h ${minutes.toString().padLeft(2, '0')}m ${seconds.toString().padLeft(2, '0')}s';
    }
    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}h ${minutes.toString().padLeft(2, '0')}m ${seconds.toString().padLeft(2, '0')}s';
    }
    return '${minutes.toString().padLeft(2, '0')}m ${seconds.toString().padLeft(2, '0')}s';
  }

  bool get is18Plus {
    final g = genres.toLowerCase();
    final r = (rating ?? '').toLowerCase();
    return g.contains('18+') ||
        r.contains('18+') ||
        r.contains('rx') ||
        g.contains('hentai') ||
        (g.contains('ecchi') &&
            !['my hero academia', 'dragon ball', 'naruto', 'one piece']
                .any((t) => title.toLowerCase().contains(t)));
  }

  factory AnimeModel.fromJson(Map<String, dynamic> json) {
    // If episodes is present as a list of episode objects
    final epList = (json['episodes'] as List<dynamic>?)
            ?.map((e) => EpisodeModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    final totalEps = (json['totalEpisodes'] as num?)?.toInt() ??
        (epList.isNotEmpty ? epList.first.episodeNumber : 1);

    return AnimeModel(
      id: json['id']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Anime',
      englishTitle: json['englishTitle']?.toString(),
      posterImage: json['posterImage']?.toString() ?? '',
      bannerImage: json['bannerImage']?.toString(),
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      type: json['type']?.toString() ?? 'TV',
      genres: json['genres']?.toString() ?? '',
      status: json['status']?.toString() ?? 'Finished Airing',
      totalEpisodes: totalEps,
      synopsis: json['description']?.toString() ?? json['synopsis']?.toString(),
      episodes: epList,
      releasedYear: (json['releasedYear'] as num?)?.toInt(),
      duration: json['duration']?.toString(),
      hasSub: json['hasSub'] as bool? ?? true,
      hasDub: json['hasDub'] as bool? ?? false,
      hasHindi: json['hasHindi'] as bool? ?? false,
      rating: json['rating']?.toString(),
      studio: json['studio']?.toString(),
      contentType: json['contentType']?.toString(),
      availabilityStatus: json['availabilityStatus']?.toString(),
      malId: (json['malId'] as num?)?.toInt(),
      tmdbId: (json['tmdbId'] as num?)?.toInt(),
    );
  }
}

class PaginatedAnimeResponse {
  final List<AnimeModel> animeList;
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  PaginatedAnimeResponse({
    required this.animeList,
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });

  factory PaginatedAnimeResponse.fromJson(Map<String, dynamic> json) {
    final list = (json['animeList'] as List<dynamic>?)
            ?.map((e) => AnimeModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];
    final pag = json['pagination'] as Map<String, dynamic>?;
    return PaginatedAnimeResponse(
      animeList: list,
      total: (pag?['total'] as num?)?.toInt() ?? list.length,
      page: (pag?['page'] as num?)?.toInt() ?? 1,
      limit: (pag?['limit'] as num?)?.toInt() ?? (list.isNotEmpty ? list.length : 20),
      totalPages: (pag?['totalPages'] as num?)?.toInt() ?? 1,
    );
  }
}

class EpisodeModel {
  final String id;
  final int episodeNumber;
  final String title;
  final String? thumbnail;
  final String? duration;
  final String? videoUrl;

  EpisodeModel({
    required this.id,
    required this.episodeNumber,
    required this.title,
    this.thumbnail,
    this.duration,
    this.videoUrl,
  });

  factory EpisodeModel.fromJson(Map<String, dynamic> json) {
    return EpisodeModel(
      id: json['id']?.toString() ?? '',
      episodeNumber: (json['episodeNumber'] as num?)?.toInt() ?? 1,
      title: json['title']?.toString() ?? 'Episode ${json['episodeNumber']}',
      thumbnail: json['thumbnail']?.toString(),
      duration: json['duration']?.toString() ?? '24 min',
      videoUrl: json['videoUrl']?.toString(),
    );
  }
}

class StreamSourceModel {
  final String id;
  final String name;
  final String embedUrl;

  StreamSourceModel({
    required this.id,
    required this.name,
    required this.embedUrl,
  });

  factory StreamSourceModel.fromJson(Map<String, dynamic> json) {
    return StreamSourceModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'HD Server',
      embedUrl: json['embedUrl']?.toString() ?? '',
    );
  }
}

class EpisodeSourcesResponse {
  final String embedUrl;
  final String server;
  final String lang;
  final bool hasSub;
  final bool hasDub;
  final bool hasHindi;
  final List<StreamSourceModel> servers;

  EpisodeSourcesResponse({
    required this.embedUrl,
    required this.server,
    required this.lang,
    required this.hasSub,
    required this.hasDub,
    required this.hasHindi,
    required this.servers,
  });

  factory EpisodeSourcesResponse.fromJson(Map<String, dynamic> json) {
    return EpisodeSourcesResponse(
      embedUrl: json['embedUrl']?.toString() ?? '',
      server: json['server']?.toString() ?? 'vidsrc',
      lang: json['lang']?.toString() ?? 'sub',
      hasSub: json['hasSub'] as bool? ?? true,
      hasDub: json['hasDub'] as bool? ?? false,
      hasHindi: json['hasHindi'] as bool? ?? false,
      servers: (json['servers'] as List<dynamic>?)
              ?.map((s) => StreamSourceModel.fromJson(s as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
