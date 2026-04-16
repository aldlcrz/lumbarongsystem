// Basic Flutter widget test for LumBarong app.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('App placeholder test', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Center(child: Text('LumBarong')),
        ),
      ),
    );
    expect(find.text('LumBarong'), findsOneWidget);
  });
}
