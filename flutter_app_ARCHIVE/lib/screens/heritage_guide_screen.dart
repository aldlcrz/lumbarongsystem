import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import 'widgets/app_navbar.dart';

class HeritageGuideScreen extends StatelessWidget {
  const HeritageGuideScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: const LumBarongAppBar(title: 'Heritage Guide', showBack: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'A LEGACY OF THREADS',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 2,
                color: AppTheme.primary,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Understanding Lumban Craft',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w900,
                color: AppTheme.textPrimary,
                height: 1.1,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Discover the traditions behind every stitch, preserving centuries of Filipino craftsmanship for the modern era.',
              style: TextStyle(
                fontSize: 16,
                color: AppTheme.textSecondary,
                height: 1.6,
              ),
            ),
            const SizedBox(height: 48),
            _GuideSection(
              title: 'The Calado Technique',
              description:
                  'A signature of Lumban, Calado involves meticulously pulling threads from the fabric to create intricate lace-like patterns. It requires extreme precision and months of labor by senior artisans.',
              icon: Icons.auto_awesome_rounded,
              color: AppTheme.primary,
            ),
            const SizedBox(height: 24),
            _GuideSection(
              title: 'The Piña Fabric',
              description:
                  'Known as the "Queen of Philippine Fabrics," Piña is woven from fine pineapple fibers. It is prized for its translucent luster and delicate texture, traditionally used for high-end Barongs.',
              icon: Icons.eco_outlined,
              color: const Color(0xFF059669),
            ),
            const SizedBox(height: 24),
            _GuideSection(
              title: 'Jusi & Banana Fiber',
              description:
                  'Jusi is a mechanically woven fabric traditionally made from banana skins. It is more durable than Piña while maintaining a regal appearance, making it perfect for daily heritage wear.',
              icon: Icons.workspace_premium_outlined,
              color: const Color(0xFF4F46E5),
            ),
            const SizedBox(height: 48),
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: AppTheme.darkSection,
                borderRadius: BorderRadius.circular(32),
              ),
              child: const Column(
                children: [
                  Icon(
                    Icons.history_edu_rounded,
                    color: Colors.white,
                    size: 48,
                  ),
                  SizedBox(height: 24),
                  Text(
                    'Preserving the Legacy',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  SizedBox(height: 12),
                  Text(
                    'By supporting LumBarong, you directly contribute to the livelihood of traditional embroiderers in Lumban, Laguna, ensuring this art form survives for future generations.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white70,
                      height: 1.6,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }
}

class _GuideSection extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  final Color color;

  const _GuideSection({
    required this.title,
    required this.description,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 20),
          Text(
            title,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            description,
            style: const TextStyle(
              fontSize: 14,
              color: AppTheme.textSecondary,
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }
}
