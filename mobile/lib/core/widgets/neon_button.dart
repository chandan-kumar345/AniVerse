import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'safe_text.dart';

class NeonButton extends StatelessWidget {
  const NeonButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.icon,
    this.isFullWidth = true,
    this.isSecondary = false,
  });

  final String text;
  final VoidCallback onPressed;
  final Widget? icon;
  final bool isFullWidth;
  final bool isSecondary;

  @override
  Widget build(BuildContext context) {
    final buttonChild = Row(
      mainAxisSize: isFullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (icon != null) ...[
          icon!,
          const SizedBox(width: 8),
        ],
        Flexible(
          child: SafeText(
            text,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 14,
            ),
          ),
        ),
      ],
    );

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        boxShadow: isSecondary
            ? null
            : [
                BoxShadow(
                  color: AppColors.primaryGlow,
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onPressed,
          child: Ink(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              gradient: isSecondary ? null : AppColors.primaryGradient,
              color: isSecondary ? AppColors.surfaceElevated : null,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isSecondary ? AppColors.borderLight : Colors.transparent,
                width: 1,
              ),
            ),
            child: buttonChild,
          ),
        ),
      ),
    );
  }
}
