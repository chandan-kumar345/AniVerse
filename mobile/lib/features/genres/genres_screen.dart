import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/safe_text.dart';
import '../../core/providers/app_providers.dart';

class GenresScreen extends ConsumerWidget {
  const GenresScreen({super.key});

  static const List<Map<String, dynamic>> _genreList = [
    {'name': 'Action', 'icon': Icons.flash_on_rounded},
    {'name': 'Adventure', 'icon': Icons.explore_rounded},
    {'name': 'Comedy', 'icon': Icons.sentiment_very_satisfied_rounded},
    {'name': 'Drama', 'icon': Icons.theater_comedy_rounded},
    {'name': 'Fantasy', 'icon': Icons.auto_awesome_rounded},
    {'name': 'Horror', 'icon': Icons.dark_mode_rounded},
    {'name': 'Mecha', 'icon': Icons.smart_toy_rounded},
    {'name': 'Music', 'icon': Icons.music_note_rounded},
    {'name': 'Mystery', 'icon': Icons.search_rounded},
    {'name': 'Psychological', 'icon': Icons.psychology_rounded},
    {'name': 'Romance', 'icon': Icons.favorite_rounded},
    {'name': 'Sci-Fi', 'icon': Icons.rocket_launch_rounded},
    {'name': 'Slice of Life', 'icon': Icons.coffee_rounded},
    {'name': 'Sports', 'icon': Icons.sports_basketball_rounded},
    {'name': 'Supernatural', 'icon': Icons.visibility_rounded},
    {'name': '18+ Mature', 'icon': Icons.explicit_rounded},
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedGenre = ref.watch(selectedGenreFilterProvider);

    return Scaffold(
      backgroundColor: AppColors.bgVoid,
      appBar: AppBar(
        title: const SafeText('Genres', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 22)),
      ),
      body: SafeArea(
        child: GridView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
            maxCrossAxisExtent: 180,
            childAspectRatio: 1.5,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
          ),
          itemCount: _genreList.length,
          itemBuilder: (context, index) {
            final item = _genreList[index];
            final name = item['name'] as String;
            final icon = item['icon'] as IconData;
            final isSelected = selectedGenre == name;

            return GestureDetector(
              onTap: () {
                ref.read(selectedGenreFilterProvider.notifier).state = name;
                context.go('/explore');
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.surfaceElevated : AppColors.surfaceCard,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSelected ? AppColors.primaryNeon : AppColors.border,
                    width: isSelected ? 1.5 : 1,
                  ),
                  boxShadow: isSelected
                      ? [BoxShadow(color: AppColors.primaryGlow, blurRadius: 10)]
                      : null,
                ),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(icon, color: isSelected ? AppColors.primaryNeon : AppColors.textSecondary, size: 28),
                      const SizedBox(height: 8),
                      SafeText(
                        name,
                        style: TextStyle(
                          color: isSelected ? Colors.white : AppColors.textPrimary,
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
