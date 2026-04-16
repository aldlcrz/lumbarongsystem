import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Colors from frontend globals.css
  static const Color cream = Color(0xFFF7F3EE);
  static const Color warmWhite = Color(0xFFFDFAF7);
  static const Color charcoal = Color(0xFF1C1917);
  static const Color bark = Color(0xFF3D2B1F);
  static const Color rust = Color(0xFFC0422A);
  static const Color rustLight = Color(0xFFE8604A);
  static const Color sand = Color(0xFFD4B896);
  static const Color sage = Color(0xFF8FA882);
  static const Color muted = Color(0xFF8C7B70);
  static const Color border = Color(0xFFE5DDD5);
  static const Color inputBg = Color(0xFFF9F6F2);
  static const Color green = Color(0xFF4A9E6A);
  static const Color amber = Color(0xFFC47C1A);
  static const Color blue = Color(0xFF3B7FD4);

  static ThemeData get theme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: cream,
      primaryColor: rust,
      colorScheme: const ColorScheme.light(
        primary: rust,
        secondary: bark,
        surface: warmWhite,
        error: rustLight,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: charcoal,
        onError: Colors.white,
      ),
      textTheme: GoogleFonts.interTextTheme().apply(
        bodyColor: charcoal,
        displayColor: charcoal,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: cream,
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: charcoal),
        titleTextStyle: TextStyle(
          color: charcoal,
          fontSize: 18,
          fontWeight: FontWeight.w600,
          fontFamily: 'Inter',
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: bark,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            fontFamily: 'Inter',
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: inputBg,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: rust),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        hintStyle: const TextStyle(color: muted, fontSize: 14),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: border),
        ),
        margin: EdgeInsets.zero,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: rust,
        unselectedItemColor: muted,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
    );
  }

  // Semantic color mappings for existing UI screens
  static const Color primary = rust;
  static const Color background = cream;
  static const Color textPrimary = charcoal;
  static const Color textSecondary = muted;
  static const Color textMuted = muted;
  static const Color borderLight = border;
  static const Color darkSection = bark;
}
