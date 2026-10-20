import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/safe_text.dart';

class DownloadManagerScreen extends StatelessWidget {
  const DownloadManagerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgVoid,
      appBar: AppBar(
        title: const SafeText('Downloads', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 22)),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Colors.white),
            onPressed: () {},
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          children: [
            _downloadItem(
              title: 'Solo Leveling • S1 E1',
              size: '241 MB • 1080p',
              isDownloading: true,
              progress: 0.65,
            ),
            const SizedBox(height: 12),
            _downloadItem(
              title: 'Demon Slayer • S1 E5',
              size: '314 MB • 1080p',
              isDownloading: false,
              progress: 1.0,
            ),
            const SizedBox(height: 12),
            _downloadItem(
              title: 'Jujutsu Kaisen • S2 E1',
              size: '280 MB • 1080p',
              isDownloading: false,
              progress: 1.0,
            ),
          ],
        ),
      ),
    );
  }

  Widget _downloadItem({
    required String title,
    required String size,
    required bool isDownloading,
    required double progress,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border, width: 1),
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: AppColors.surfaceElevated,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.movie_creation_outlined, color: AppColors.primaryNeon, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SafeText(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Colors.white),
                ),
                const SizedBox(height: 4),
                SafeText(size, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                if (isDownloading) ...[
                  const SizedBox(height: 6),
                  LinearProgressIndicator(
                    value: progress,
                    backgroundColor: AppColors.surfaceElevated,
                    color: AppColors.primaryNeon,
                  ),
                ],
              ],
            ),
          ),
          IconButton(
            icon: Icon(
              isDownloading ? Icons.pause_circle_outline_rounded : Icons.check_circle_outline_rounded,
              color: isDownloading ? AppColors.primaryNeon : AppColors.accentGreen,
              size: 24,
            ),
            onPressed: () {},
          ),
        ],
      ),
    );
  }
}
