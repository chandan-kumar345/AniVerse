import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/safe_text.dart';
import '../../core/widgets/neon_button.dart';
import '../../core/providers/app_providers.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  bool _isLoginTab = true;
  bool _obscurePassword = true;
  final TextEditingController _identifierController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLoading = false;

  Future<void> _handleSubmit() async {
    final identifier = _identifierController.text.trim();
    final password = _passwordController.text.trim();

    if (identifier.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: SafeText('Please enter your credentials'),
          backgroundColor: AppColors.primaryNeon,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final authRepo = ref.read(authRepositoryProvider);
    Map<String, dynamic> result;

    if (_isLoginTab) {
      result = await authRepo.login(
        emailOrUsername: identifier,
        password: password,
      );
    } else {
      final email = identifier.contains('@') ? identifier : '$identifier@aniverse.app';
      final username = identifier.contains('@') ? identifier.split('@').first : identifier;
      result = await authRepo.register(
        email: email,
        username: username,
        password: password,
      );
    }

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (result['success'] == true) {
      ref.invalidate(isLoggedInProvider);
      ref.invalidate(currentUserProvider);
      context.go('/home');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: SafeText(result['message']?.toString() ?? 'Authentication failed'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  Future<void> _handleGuestLogin() async {
    setState(() => _isLoading = true);
    final authRepo = ref.read(authRepositoryProvider);
    await authRepo.login(
      emailOrUsername: 'guest_${DateTime.now().millisecondsSinceEpoch % 10000}',
      password: 'guest_secure_pass',
    );
    if (!mounted) return;
    setState(() => _isLoading = false);
    ref.invalidate(isLoggedInProvider);
    ref.invalidate(currentUserProvider);
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgVoid,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 20),

              // Logo & Title
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppColors.primaryGradient,
                  boxShadow: [
                    BoxShadow(color: AppColors.primaryGlow, blurRadius: 20),
                  ],
                ),
                child: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 36),
              ),
              const SizedBox(height: 16),
              const SafeText(
                'ANIVERSES',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 3,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              const SafeText(
                'ANIME BEYOND BORDERS',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 2,
                  color: AppColors.primaryNeon,
                ),
              ),
              const SizedBox(height: 36),

              // Segmented Tab Switcher (Login / Sign Up)
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppColors.surfaceCard,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border, width: 1),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _isLoginTab = true),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: _isLoginTab ? AppColors.surfaceElevated : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                            border: _isLoginTab ? Border.all(color: AppColors.primaryNeon, width: 1) : null,
                          ),
                          child: Center(
                            child: SafeText(
                              'Login',
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                                color: _isLoginTab ? AppColors.primaryNeon : AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _isLoginTab = false),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: !_isLoginTab ? AppColors.surfaceElevated : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                            border: !_isLoginTab ? Border.all(color: AppColors.primaryNeon, width: 1) : null,
                          ),
                          child: Center(
                            child: SafeText(
                              'Sign Up',
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                                color: !_isLoginTab ? AppColors.primaryNeon : AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // Identifier Field
              TextField(
                controller: _identifierController,
                style: const TextStyle(color: Colors.white, fontSize: 14),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: AppColors.surfaceCard,
                  hintText: 'Email or Username',
                  hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                  prefixIcon: const Icon(Icons.person_outline_rounded, color: AppColors.textMuted, size: 20),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.border),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.primaryNeon),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Password Field
              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                style: const TextStyle(color: Colors.white, fontSize: 14),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: AppColors.surfaceCard,
                  hintText: 'Password',
                  hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                  prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppColors.textMuted, size: 20),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                      color: AppColors.textMuted,
                      size: 20,
                    ),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.border),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.primaryNeon),
                  ),
                ),
              ),

              // Forgot Password link
              if (_isLoginTab) ...[
                const SizedBox(height: 10),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {},
                    child: const SafeText(
                      'Forgot Password?',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ] else ...[
                const SizedBox(height: 24),
              ],

              // Submit Button
              _isLoading
                  ? const CircularProgressIndicator(color: AppColors.primaryNeon)
                  : NeonButton(
                      text: _isLoginTab ? 'Login' : 'Create Account',
                      onPressed: _handleSubmit,
                    ),
              const SizedBox(height: 32),

              // Divider "OR CONTINUE WITH"
              Row(
                children: [
                  const Expanded(child: Divider(color: AppColors.border)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    child: SafeText(
                      'OR CONTINUE WITH',
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                  const Expanded(child: Divider(color: AppColors.border)),
                ],
              ),
              const SizedBox(height: 24),

              // Social Auth Buttons (Google, Apple, Discord)
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _socialButton(Icons.g_mobiledata_rounded, () => _handleSubmit()),
                  const SizedBox(width: 16),
                  _socialButton(Icons.apple_rounded, () => _handleSubmit()),
                  const SizedBox(width: 16),
                  _socialButton(Icons.chat_bubble_outline_rounded, () => _handleSubmit()),
                ],
              ),
              const SizedBox(height: 36),

              // Guest Skip Link
              TextButton(
                onPressed: _handleGuestLogin,
                child: const SafeText(
                  'Browse as Guest →',
                  style: TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _socialButton(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 52,
        height: 52,
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.border, width: 1),
        ),
        child: Center(
          child: Icon(icon, color: Colors.white, size: 26),
        ),
      ),
    );
  }
}
