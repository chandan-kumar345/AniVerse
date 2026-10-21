import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/safe_text.dart';
import '../../core/providers/app_providers.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    // Pre-warm home catalog and wake up backend in background
    ref.read(animeRepositoryProvider).getHomeData();
    _checkAuthAndNavigate();
  }

  Future<void> _checkAuthAndNavigate() async {
    // Give animation 1.8 seconds to display brand splash
    await Future.delayed(const Duration(milliseconds: 1800));
    if (!mounted) return;

    final authRepo = ref.read(authRepositoryProvider);
    final loggedIn = await authRepo.isLoggedIn();

    if (mounted) {
      if (loggedIn) {
        context.go('/home');
      } else {
        context.go('/onboarding');
      }
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgVoid,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Background Red Glowing Moon Effect
          Center(
            child: AnimatedBuilder(
              animation: _pulseController,
              builder: (context, child) {
                return Container(
                  width: 260 + (_pulseController.value * 30),
                  height: 260 + (_pulseController.value * 30),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primaryNeon.withValues(alpha: 0.25 + (_pulseController.value * 0.15)),
                        blurRadius: 100,
                        spreadRadius: 20,
                      ),
                    ],
                    gradient: RadialGradient(
                      colors: [
                        AppColors.primaryNeon.withValues(alpha: 0.4),
                        Colors.transparent,
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Central Logo & Title
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: AppColors.primaryGradient,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primaryGlow,
                        blurRadius: 30,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Icon(Icons.play_arrow_rounded, color: Colors.white, size: 48),
                  ),
                ),
                const SizedBox(height: 24),
                const SafeText(
                  'ANIVERSES',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 4,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                const SafeText(
                  'ANIME BEYOND BORDERS',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 2,
                    color: AppColors.primaryNeon,
                  ),
                ),
              ],
            ),
          ),

          // Bottom Loading Spinner
          Positioned(
            bottom: 60,
            left: 0,
            right: 0,
            child: Center(
              child: SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryNeon),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
