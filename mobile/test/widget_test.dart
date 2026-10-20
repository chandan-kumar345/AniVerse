import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:aniverse_mobile/main.dart';

void main() {
  testWidgets('AniVerse app boot test', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: AniVerseApp()));
    expect(find.byType(AniVerseApp), findsOneWidget);
    // Settle splash delay timer
    await tester.pumpAndSettle(const Duration(seconds: 4));
  });
}
