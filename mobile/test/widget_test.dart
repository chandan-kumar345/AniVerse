import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:aniverse_mobile/main.dart';

void main() {
  testWidgets('AniVerse app boot test', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: AniVerseApp()));
    expect(find.byType(AniVerseApp), findsOneWidget);
    // Pump frames to verify splash screen rendering without indefinite pumpAndSettle
    await tester.pump(const Duration(milliseconds: 500));
    await tester.pump(const Duration(seconds: 2));
    expect(find.byType(AniVerseApp), findsOneWidget);
  });
}

