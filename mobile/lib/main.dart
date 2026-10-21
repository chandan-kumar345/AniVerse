import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'features/splash/splash_screen.dart';
import 'features/onboarding/onboarding_screen.dart';
import 'features/auth/login_screen.dart';
import 'features/main/main_navigation_screen.dart';
import 'features/details/anime_details_screen.dart';
import 'features/player/video_player_screen.dart';
import 'features/search/search_screen.dart';
import 'features/genres/genres_screen.dart';
import 'features/downloads/download_manager_screen.dart';
import 'features/settings/settings_screen.dart';
import 'features/notifications/notifications_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: AniVerseApp()));
}

final _router = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/home',
      builder: (context, state) => const MainNavigationScreen(),
    ),
    GoRoute(
      path: '/explore',
      builder: (context, state) => const MainNavigationScreen(),
    ),
    GoRoute(
      path: '/watchlist',
      builder: (context, state) => const MainNavigationScreen(),
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => const MainNavigationScreen(),
    ),
    GoRoute(
      path: '/anime/:slug',
      builder: (context, state) {
        final slug = state.pathParameters['slug'] ?? '';
        return AnimeDetailsScreen(slug: slug);
      },
    ),
    GoRoute(
      path: '/watch/:slug/:epNum',
      builder: (context, state) {
        final slug = state.pathParameters['slug'] ?? '';
        final epNum = int.tryParse(state.pathParameters['epNum'] ?? '1') ?? 1;
        return VideoPlayerScreen(slug: slug, epNum: epNum);
      },
    ),
    GoRoute(
      path: '/anime/:slug/watch/:epNum',
      builder: (context, state) {
        final slug = state.pathParameters['slug'] ?? '';
        final epNum = int.tryParse(state.pathParameters['epNum'] ?? '1') ?? 1;
        return VideoPlayerScreen(slug: slug, epNum: epNum);
      },
    ),
    GoRoute(
      path: '/search',
      builder: (context, state) => const SearchScreen(),
    ),
    GoRoute(
      path: '/genres',
      builder: (context, state) => const GenresScreen(),
    ),
    GoRoute(
      path: '/downloads',
      builder: (context, state) => const DownloadManagerScreen(),
    ),
    GoRoute(
      path: '/settings',
      builder: (context, state) => const SettingsScreen(),
    ),
    GoRoute(
      path: '/notifications',
      builder: (context, state) => const NotificationsScreen(),
    ),
  ],
);

class AniVerseApp extends StatelessWidget {
  const AniVerseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'AniVerse',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      routerConfig: _router,
      builder: (context, child) {
        // Enforce clamped text scaling so text wrapping and buttons never overflow on any device
        return MediaQuery.withClampedTextScaling(
          minScaleFactor: 0.85,
          maxScaleFactor: 1.25,
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
