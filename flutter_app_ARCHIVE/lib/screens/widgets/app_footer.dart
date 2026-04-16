import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/app_theme.dart';

class AppFooter extends StatelessWidget {
  const AppFooter({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 64, horizontal: 24),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFF9FAFB))),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'LumBarong',
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w900,
              fontStyle: FontStyle.italic,
              color: AppTheme.primary,
              letterSpacing: -1.5,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'The premiere marketplace for authentic Filipino heritage. Connecting world-class artisans to the global stage.',
            style: TextStyle(
              color: AppTheme.textMuted,
              fontSize: 14,
              fontWeight: FontWeight.w500,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 48),
          const Text(
            'NAVIGATION',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: AppTheme.textPrimary,
              letterSpacing: 3,
            ),
          ),
          const SizedBox(height: 24),
          _FooterLink(
            label: 'ARTISAN CATALOG',
            subLabel: 'Browse our collection of handcrafted masterpieces',
            onTap: () => context.go('/home'),
          ),
          _FooterLink(
            label: 'HERITAGE GUIDE',
            subLabel: 'Learn about the traditions behind every stitch',
            onTap: () => context.push('/heritage-guide'),
          ),
          _FooterLink(
            label: 'OUR STORY',
            subLabel: 'Discover the journey of the Lumban artisans',
            highlight: true,
            onTap: () => context.push('/about'),
          ),
          const SizedBox(height: 40),
          const Text(
            'LEGACY SUPPORT',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: AppTheme.textPrimary,
              letterSpacing: 3,
            ),
          ),
          const SizedBox(height: 24),
          const _FooterLink(
            label: 'CUSTOMER CARE',
            subLabel: 'Dedicated support for your heritage commissions',
          ),
          const _FooterLink(
            label: 'PRIVACY POLICY',
            subLabel: 'Secure management of your registry data',
          ),
          const SizedBox(height: 64),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '© ${DateTime.now().year} LUMBARONG PH',
                style: const TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.textMuted,
                  letterSpacing: 1,
                ),
              ),
              const Row(
                children: [
                  Text(
                    'FACEBOOK',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.textMuted,
                    ),
                  ),
                  SizedBox(width: 20),
                  Text(
                    'INSTAGRAM',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _FooterLink extends StatelessWidget {
  final String label;
  final String? subLabel;
  final bool highlight;
  final VoidCallback? onTap;

  const _FooterLink({
    required this.label,
    this.subLabel,
    this.highlight = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w900,
                color: highlight ? AppTheme.primary : AppTheme.textMuted,
                letterSpacing: 1,
              ),
            ),
            if (subLabel != null) ...[
              const SizedBox(height: 4),
              Text(
                subLabel!,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  fontStyle: FontStyle.italic,
                  color: Color(0xFFD1D5DB),
                  height: 1.1,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
