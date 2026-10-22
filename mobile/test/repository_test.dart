import 'package:flutter_test/flutter_test.dart';
import 'package:aniverse_mobile/core/network/api_client.dart';
import 'package:aniverse_mobile/data/repositories/anime_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('AnimeRepository provides instant initial home data from seed and cache', () async {
    final client = ApiClient();
    final repo = AnimeRepository(apiClient: client);

    final home = await repo.getHomeData();
    expect(home, isNotEmpty);
    expect(home['trending'], isNotEmpty);
    expect(home['popular'], isNotEmpty);
    expect(home['topTen'], isNotEmpty);

    final trending = await repo.getTrending();
    expect(trending, isNotEmpty);
    expect(trending.first.title, isNotEmpty);

    final popular = await repo.getPopular();
    expect(popular, isNotEmpty);

    final topTen = await repo.getTopTen();
    expect(topTen, isNotEmpty);

    final genres = await repo.getGenres();
    expect(genres, isNotEmpty);

    final running = await repo.getRunningAnime();
    expect(running, isNotEmpty);
    // Verify that running anime are sorted ascending by remainingTimeToAir (less timer first)
    for (int i = 0; i < running.length - 1; i++) {
      expect(
        running[i].remainingTimeToAir.inSeconds <= running[i + 1].remainingTimeToAir.inSeconds,
        isTrue,
        reason: 'Anime with less timer must show first (${running[i].title} vs ${running[i+1].title})',
      );
    }
  });
}
