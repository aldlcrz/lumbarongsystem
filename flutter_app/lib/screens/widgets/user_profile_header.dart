import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';

class UserProfileHeader extends StatelessWidget {
  const UserProfileHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final cart = context.watch<CartProvider>();
    final name = auth.user?.name ?? 'User';
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'U';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8.0),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Notification Bell
          _buildBadgeIcon(
            context,
            icon: Icons.notifications_none_rounded,
            count: 4,
            iconColor: AppTheme.rust,
            bgColor: const Color(0xFFF9F6F2),
          ),
          const SizedBox(width: 12),
          
          // Cart Icon
          _buildBadgeIcon(
            context,
            icon: Icons.shopping_cart_outlined,
            count: cart.cartCount,
            iconColor: AppTheme.charcoal,
            bgColor: const Color(0xFFF9F6F2),
          ),
          const SizedBox(width: 12),
          
          // Divider
          Container(
            height: 24,
            width: 1,
            color: AppTheme.borderLight,
          ),
          const SizedBox(width: 12),
          
          // User Info
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                name,
                style: const TextStyle(
                  color: Color(0xFF003366), // Deep blue-ish color from image
                  fontWeight: FontWeight.w900,
                  fontSize: 13,
                ),
              ),
              const Text(
                'CUSTOMER',
                style: TextStyle(
                  color: AppTheme.muted,
                  fontWeight: FontWeight.w900,
                  fontSize: 9,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(width: 12),
          
          // Avatar
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: AppTheme.sand,
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            alignment: Alignment.center,
            child: Text(
              initial,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBadgeIcon(
    BuildContext context, {
    required IconData icon,
    required int count,
    required Color iconColor,
    required Color bgColor,
  }) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 18, color: iconColor),
        ),
        if (count > 0)
          Positioned(
            top: -5,
            right: -5,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: Color(0xFFC0422A), // Rust color for badge
                shape: BoxShape.circle,
              ),
              constraints: const BoxConstraints(
                minWidth: 14,
                minHeight: 14,
              ),
              child: Text(
                count.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 8,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
      ],
    );
  }
}
