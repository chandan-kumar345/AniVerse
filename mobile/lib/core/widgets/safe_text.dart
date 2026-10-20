import 'package:flutter/material.dart';

/// Ensures text always wraps safely, respects line limits, and uses ellipsis on overflow.
class SafeText extends StatelessWidget {
  const SafeText(
    this.text, {
    super.key,
    this.style,
    this.maxLines = 1,
    this.textAlign = TextAlign.start,
    this.overflow = TextOverflow.ellipsis,
  });

  final String text;
  final TextStyle? style;
  final int maxLines;
  final TextAlign textAlign;
  final TextOverflow overflow;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      maxLines: maxLines,
      overflow: overflow,
      softWrap: true,
      textAlign: textAlign,
      style: style,
    );
  }
}
