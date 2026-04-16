import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../providers/auth_provider.dart';
import '../services/api_client.dart';
import 'widgets/app_navbar.dart';
import 'widgets/app_footer.dart';

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
    // While auth is initializing, show a loader.
    // GoRouter's redirect (refreshListenable: authProvider) handles all
    // role-based navigation once loading completes — no context.go() needed here.
    if (auth.loading) {
      return const BarongScaffold(
        child: Center(
          child: CircularProgressIndicator(color: AppTheme.primary),
        ),
      );
    }

    return BarongScaffold(
      child: SafeArea(
        child: Column(
          children: [
            // Custom Landing Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'LumBarong',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      fontStyle: FontStyle.italic,
                      color: AppTheme.primary,
                    ),
                  ),
                  Row(
                    children: [
                      TextButton(
                        onPressed: () => context.push('/login'),
                        child: const Text(
                          'Sign In',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: () => context.push('/register'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.darkSection,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: const Text(
                          'Register',
                          style: TextStyle(fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 40),
                    // Badge inspired by web
                    Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(30),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: AppTheme.primary,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 10),
                            const Text(
                              'SUPPORTING LUMBAN ARTISANS',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                color: AppTheme.primary,
                                letterSpacing: 1.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 40),
                    const SizedBox(height: 40),
                    const Text(
                      'Wear the',
                      style: TextStyle(
                        fontSize: 56,
                        fontWeight: FontWeight.w900,
                        height: 0.9,
                        letterSpacing: -2,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const Text(
                      'Spirit',
                      style: TextStyle(
                        fontSize: 84,
                        fontWeight: FontWeight.w900,
                        fontStyle: FontStyle.italic,
                        color: AppTheme.primary,
                        height: 1.0,
                        letterSpacing: -3,
                      ),
                    ),
                    const Text(
                      'of the Philippines.',
                      style: TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.w900,
                        height: 0.9,
                        letterSpacing: -1,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'LumBarong connects you directly with master embroiderers of Lumban. Authentic, high-quality traditional wear delivered to your doorstep.',
                      style: TextStyle(
                        fontSize: 16,
                        color: AppTheme.textSecondary,
                        fontWeight: FontWeight.w500,
                        height: 1.6,
                      ),
                    ),
                    const SizedBox(height: 48),
                    Center(
                      child: Column(
                        children: [
                          SizedBox(
                            width: double.infinity,
                            height: 72,
                            child: ElevatedButton(
                              onPressed: () => context.push('/register'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(24),
                                ),
                                elevation: 20,
                                shadowColor: AppTheme.primary.withValues(
                                  alpha: 0.3,
                                ),
                              ),
                              child: const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    'START YOUR COLLECTION',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 1,
                                    ),
                                  ),
                                  SizedBox(width: 12),
                                  Icon(Icons.arrow_forward_rounded, size: 24),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            height: 72,
                            child: OutlinedButton(
                              onPressed: () => context.push('/login'),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(
                                  color: AppTheme.borderLight,
                                  width: 2,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(24),
                                ),
                              ),
                              child: const Text(
                                'BROWSE COLLECTION',
                                style: TextStyle(
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 48),
                    // Decorative Hero Image inspired by web
                    Center(
                      child: SizedBox(
                        height: 440,
                        width: double.infinity,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            // The red floating block
                            Positioned(
                              left: 20,
                              child: Container(
                                width: 180,
                                height: 260,
                                decoration: BoxDecoration(
                                  color: AppTheme.primary,
                                  borderRadius: BorderRadius.circular(40),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppTheme.primary.withValues(
                                        alpha: 0.3,
                                      ),
                                      blurRadius: 40,
                                      offset: const Offset(0, 10),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            // The image card
                            Container(
                              width: 260,
                              height: 380,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                border: Border.all(
                                  color: Colors.white,
                                  width: 16, // Matched to web's thick border
                                ),
                                borderRadius: BorderRadius.circular(64),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.1),
                                    blurRadius: 40,
                                    offset: const Offset(0, 20),
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(56),
                                child: Image.network(
                                  'https://images.unsplash.com/photo-1544441893-675973e31985?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Stats
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _StatItem(
                          value: '${stats['productCount'] ?? 24}+',
                          label: 'DESIGNS',
                        ),
                        Container(
                          height: 40,
                          width: 1,
                          color: AppTheme.borderLight,
                        ),
                        _StatItem(
                          value: '${stats['artisanCount'] ?? 12}+',
                          label: 'ARTISANS',
                        ),
                        Container(
                          height: 40,
                          width: 1,
                          color: AppTheme.borderLight,
                        ),
                        _StatItem(
                          value: '${stats['averageRating'] ?? '4.9'}',
                          label: 'RATING',
                        ),
                      ],
                    ),
                    const SizedBox(height: 48),
                    // Feature Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        color: AppTheme.darkSection,
                        borderRadius: BorderRadius.circular(32),
                      ),
                      child: Column(
                        children: [
                          const Icon(
                            Icons.verified_outlined,
                            size: 48,
                            color: AppTheme.primary,
                          ),
                          const SizedBox(height: 20),
                          const Text(
                            'Verified Authenticity',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'Every piece is hand-inspected to ensure traditional embroidery techniques of the highest standard.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 13,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 48),
                    const AppFooter(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String value;
  final String label;

  const _StatItem({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.w900,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w800,
            color: AppTheme.textMuted,
            letterSpacing: 1.5,
          ),
        ),
      ],
    );
  }
}
