import 'package:flutter/material.dart';

/// AniVerse Official Mobile Cyberpunk Design System Color Tokens
class AppColors {
  // Canvas & Backgrounds
  static const Color bgVoid = Color(0xFF09080D);
  static const Color bgSecondary = Color(0xFF0E0F17);
  static const Color surfaceCard = Color(0xFF13141F);
  static const Color surfaceElevated = Color(0xFF181A29);
  static const Color surfaceGlass = Color(0xCC13141F);

  // Brand Accents
  static const Color primaryNeon = Color(0xFFFF2E55); // Crimson Red
  static const Color primaryDark = Color(0xFFE11D48);
  static const Color primaryGlow = Color(0x66FF2E55);

  // Translation & Metadata Accents
  static const Color accentPurple = Color(0xFF8B5CF6); // CC SUB
  static const Color accentCyan = Color(0xFF06B6D4);   // English DUB
  static const Color accentGold = Color(0xFFF59E0B);   // Hindi DUB / Rating
  static const Color accentGreen = Color(0xFF10B981);  // Completed / Success

  // Typography
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);

  // Borders & Dividers
  static const Color border = Color(0x1AFFFFFF);
  static const Color borderLight = Color(0x33FFFFFF);
  static const Color borderGlow = Color(0x66FF2E55);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFFFF2E55), Color(0xFFBE123C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFF181A29), Color(0xFF13141F)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
