import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  Map<String, dynamic> stats = {
    'artisanCount': 0,
    'productCount': 0,
    'averageRating': '4.9',
  };

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final res = await ApiClient().get('/auth/stats');
      if (res.data is Map) {
        setState(() => stats = Map<String, dynamic>.from(res.data as Map));
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (auth.loading) {
      return const Scaffold(
        backgroundColor: AppTheme.textPrimary,
        body: Center(child: CircularProgressIndicator(color: AppTheme.primary)),
      );
    }

    final screenWidth = MediaQuery.of(context).size.width;
    final isDesktop = screenWidth > 800;

    return Scaffold(
      backgroundColor: AppTheme.textPrimary,
      body: Stack(
        children: [
          // Full-bleed background image
          Positioned.fill(
            child: Image.asset(
              'assets/logo/background-app.jpg',
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) =>
                  Container(color: AppTheme.charcoal),
            ),
          ),
          // Dark warm overlay for readability (gradient to right)
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    AppTheme.textPrimary.withValues(alpha: 0.9),
                    AppTheme.textPrimary.withValues(alpha: 0.65),
                    AppTheme.textPrimary.withValues(alpha: 0.2),
                  ],
                ),
              ),
            ),
          ),
          // Gradient to top
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    AppTheme.textPrimary.withValues(alpha: 0.7),
                    Colors.transparent,
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // Header (matches Web)
                Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: isDesktop ? 56 : 24,
                    vertical: 24,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.asset(
                          'assets/logo/logo-app.jpg',
                          height: isDesktop ? 56 : 44,
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) =>
                              const Text(
                                'LumbaRong',
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w900,
                                  fontStyle: FontStyle.italic,
                                  color: Color(0xFFD4B896),
                                  letterSpacing: -0.5,
                                ),
                              ),
                        ),
                      ),
                      if (isDesktop)
                        Row(
                          children: [
                            TextButton(
                              onPressed: () => context.push('/login'),
                              child: const Text(
                                'SIGN IN',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.2,
                                  color: Color(0xCCD4B896),
                                ),
                              ),
                            ),
                            const SizedBox(width: 32),
                            ElevatedButton(
                              onPressed: () => context.push('/register'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 28,
                                  vertical: 16,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(30),
                                ),
                                elevation: 8,
                                shadowColor: AppTheme.primary.withValues(
                                  alpha: 0.3,
                                ),
                              ),
                              child: const Text(
                                'CREATE ACCOUNT',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.5,
                                ),
                              ),
                            ),
                          ],
                        )
                      else
                        IconButton(
                          icon: const Icon(
                            Icons.menu,
                            color: Color(0xFFD4B896),
                          ),
                          onPressed: () {
                            // Expand bottom sheet or modal menu for mobile
                            showModalBottomSheet(
                              context: context,
                              backgroundColor: AppTheme.textPrimary,
                              builder: (ctx) => _buildMobileMenu(ctx),
                            );
                          },
                        ),
                    ],
                  ),
                ),

                // Hero Content
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: isDesktop ? 64 : 24,
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Eyebrow badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.1),
                            border: Border.all(
                              color: AppTheme.primary.withValues(alpha: 0.5),
                            ),
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: const BoxDecoration(
                                  color: AppTheme.primary,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'DIRECT ARTISAN ACCESS',
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFFE8604A),
                                  letterSpacing: 2.2,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Headline
                        Text(
                          'Wear the',
                          style: TextStyle(
                            fontSize: isDesktop ? 88 : 44,
                            fontWeight: FontWeight.w900,
                            height: 0.9,
                            letterSpacing: -1.5,
                            color: const Color(0xFFF7F3EE),
                          ),
                        ),
                        Text(
                          'Spirit',
                          style: TextStyle(
                            fontSize: isDesktop ? 88 : 44,
                            fontWeight: FontWeight.w900,
                            fontStyle: FontStyle.italic,
                            color: AppTheme.primary,
                            height: 0.9,
                            letterSpacing: -1.5,
                          ),
                        ),
                        Text(
                          isDesktop
                              ? 'of the Philippines.'
                              : 'of the\nPhilippines.',
                          style: TextStyle(
                            fontSize: isDesktop ? 88 : 44,
                            fontWeight: FontWeight.w900,
                            height: 0.9,
                            letterSpacing: -1.5,
                            color: const Color(0xFFF7F3EE),
                          ),
                        ),

                        const SizedBox(height: 24),

                        // Subheadline
                        SizedBox(
                          width: isDesktop ? 440 : double.infinity,
                          child: Text(
                            'Buy directly from the makers of Barong. High quality, handmade clothes sent to your home.',
                            style: TextStyle(
                              fontSize: isDesktop ? 16 : 14,
                              color: const Color(0xCCD4B896),
                              fontWeight: FontWeight.w500,
                              height: 1.6,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ),

                        const SizedBox(height: 40),

                        // CTA Button
                        SizedBox(
                          width: isDesktop ? null : double.infinity,
                          child: ElevatedButton(
                            onPressed: () => context.push('/login'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primary,
                              foregroundColor: Colors.white,
                              padding: EdgeInsets.symmetric(
                                horizontal: isDesktop ? 32 : 0,
                                vertical: isDesktop ? 20 : 16,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(30),
                              ),
                              elevation: 12,
                              shadowColor: AppTheme.primary.withValues(
                                alpha: 0.4,
                              ),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'START SHOPPING',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 2.0,
                                  ),
                                ),
                                SizedBox(width: 12),
                                Icon(Icons.arrow_forward, size: 16),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Footer
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Text(
                    '© 2026 LUMBARONG PHILIPPINES',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 2.0,
                      color: Color(0x66D4B896),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMobileMenu(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
      decoration: const BoxDecoration(
        color: AppTheme.textPrimary,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.push('/login');
            },
            child: const Text(
              'SIGN IN',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
                color: Color(0xFFD4B896),
              ),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                context.push('/register');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              child: const Text(
                'CREATE ACCOUNT',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.5,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
