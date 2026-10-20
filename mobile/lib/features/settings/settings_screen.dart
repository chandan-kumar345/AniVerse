import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/safe_text.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  int _appearanceIndex = 0;
  bool _wifiOnly = true;
  String _videoQuality = 'Auto (Recommended)';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgVoid,
      appBar: AppBar(
        title: const SafeText('Settings', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 22)),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          children: [
            // Appearance Segmented Controls
            const SafeText('Appearance', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AppColors.surfaceCard,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  _appearanceOption(0, Icons.dark_mode_rounded, 'Dark'),
                  _appearanceOption(1, Icons.settings_brightness_rounded, 'System'),
                  _appearanceOption(2, Icons.light_mode_rounded, 'Light'),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Video Quality Setting
            const SafeText('Playback', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: AppColors.surfaceCard,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: ListTile(
                title: const SafeText('Video Quality', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                trailing: DropdownButton<String>(
                  value: _videoQuality,
                  dropdownColor: AppColors.surfaceElevated,
                  underline: const SizedBox.shrink(),
                  items: ['Auto (Recommended)', '1080p', '720p', '480p']
                      .map((q) => DropdownMenuItem(value: q, child: SafeText(q, style: const TextStyle(color: Colors.white))))
                      .toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _videoQuality = val);
                  },
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Downloads Options
            const SafeText('Downloads', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: AppColors.surfaceCard,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: SwitchListTile(
                title: const SafeText('Download Over Wi-Fi Only', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                value: _wifiOnly,
                activeColor: AppColors.primaryNeon,
                onChanged: (val) => setState(() => _wifiOnly = val),
              ),
            ),
            const SizedBox(height: 24),

            // Clear Cache Option
            const SafeText('Storage', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: AppColors.surfaceCard,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: ListTile(
                title: const SafeText('Clear Cache', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const SafeText('256 MB', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                    const SizedBox(width: 8),
                    const Icon(Icons.delete_outline_rounded, color: AppColors.primaryNeon, size: 20),
                  ],
                ),
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: SafeText('Cache cleared successfully!')),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _appearanceOption(int index, IconData icon, String label) {
    final isSelected = _appearanceIndex == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _appearanceIndex = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.surfaceElevated : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            border: isSelected ? Border.all(color: AppColors.primaryNeon, width: 1) : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: isSelected ? AppColors.primaryNeon : AppColors.textMuted, size: 16),
              const SizedBox(width: 6),
              SafeText(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : AppColors.textSecondary,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
