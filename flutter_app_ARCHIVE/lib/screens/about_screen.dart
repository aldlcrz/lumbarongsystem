import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import 'widgets/app_navbar.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: const LumBarongAppBar(title: 'Our Heritage', showBack: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(32),
              ),
              child: const Icon(
                Icons.temple_buddhist_outlined,
                size: 80,
                color: AppTheme.primary,
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'THE HEART OF LUMBAN',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 2,
                color: AppTheme.primary,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Woven with Soul',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w900,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'LumBarong was founded with a single mission: to bridge the gap between world-class Lumban artisans and heritage enthusiasts worldwide. We believe that every Barong tells a story of identity, pride, and patience.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 15,
                color: AppTheme.textSecondary,
                height: 1.7,
              ),
            ),
            const SizedBox(height: 48),
            const _MissionItem(
              icon: Icons.auto_awesome_outlined,
              title: 'Preservation',
              description:
                  'Keeping the centuries-old "Calado" embroidery alive by giving artisans a digital stage.',
            ),
            const SizedBox(height: 32),
            const _MissionItem(
              icon: Icons.favorite_border_rounded,
              title: 'Fair Trade',
              description:
                  'Ensuring our local craftsmen receive fair compensation and recognition for their meticulous work.',
            ),
            const SizedBox(height: 32),
            const _MissionItem(
              icon: Icons.public_rounded,
              title: 'Global Reach',
              description:
                  'Bringing the exquisite beauty of Philippine heritage to every corner of the globe.',
            ),
            const SizedBox(height: 64),
            const Divider(color: AppTheme.borderLight),
            const SizedBox(height: 32),
            const Text(
              'LUMBARONG HERITAGE PORTAL',
              style: TextStyle(
                color: AppTheme.textMuted,
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 1,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Made with pride in the Philippines 🇵🇭',
              style: TextStyle(
                color: AppTheme.textSecondary,
                fontStyle: FontStyle.italic,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }
}

class _MissionItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _MissionItem({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Icon(icon, color: AppTheme.primary, size: 28),
        ),
        const SizedBox(height: 16),
        Text(
          title.toUpperCase(),
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w900,
            letterSpacing: 1,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          description,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 14,
            color: AppTheme.textSecondary,
            height: 1.5,
          ),
        ),
      ],
    );
  }
}
