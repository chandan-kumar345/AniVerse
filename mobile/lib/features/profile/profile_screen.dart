import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/safe_text.dart';
import '../../core/widgets/neon_button.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgVoid,
      appBar: AppBar(
        title: const SafeText('Profile', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 22)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            children: [
              // User Avatar
              Center(
                child: Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.primaryNeon, width: 2.5),
                    boxShadow: [
                      BoxShadow(color: AppColors.primaryGlow, blurRadius: 20),
                    ],
                  ),
                  child: const Center(
                    child: Icon(Icons.person, color: Colors.white, size: 48),
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // User Name & Handle
              const SafeText(
                'Uxui Shrut',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white),
              ),
              const SizedBox(height: 4),
              const SafeText(
                '@uxui.shrut',
                style: TextStyle(fontSize: 13, color: AppColors.textMuted, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 24),

              // Stats Row (Watchlist, Completed, Following)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border, width: 1),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _statItem('12', 'Watchlist'),
                    _statDivider(),
                    _statItem('24', 'Completed'),
                    _statDivider(),
                    _statItem('8', 'Following'),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Menu List Items
              _menuTile(Icons.edit_outlined, 'Edit Profile', () {}),
              _menuTile(Icons.settings_outlined, 'Settings', () => context.push('/settings')),
              _menuTile(Icons.download_outlined, 'Download Manager', () => context.push('/downloads')),
              _menuTile(Icons.history_rounded, 'Watch History', () {}),
              _menuTile(Icons.help_outline_rounded, 'Help & Support', () {}),
              _menuTile(Icons.info_outline_rounded, 'About Aniverses', () {}),

              const SizedBox(height: 24),

              // Logout Button
              NeonButton(
                text: 'Logout',
                icon: const Icon(Icons.logout_rounded, color: Colors.white, size: 18),
                onPressed: () {
                  context.go('/login');
                },
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _statItem(String count, String label) {
    return Column(
      children: [
        SafeText(count, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.white)),
        const SizedBox(height: 4),
        SafeText(label, style: const TextStyle(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _statDivider() {
    return Container(height: 24, width: 1, color: AppColors.border);
  }

  Widget _menuTile(IconData icon, String title, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border, width: 1),
      ),
      child: ListTile(
        leading: Icon(icon, color: AppColors.textSecondary, size: 22),
        title: SafeText(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
        trailing: const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.textMuted, size: 14),
        onTap: onTap,
      ),
    );
  }
}
