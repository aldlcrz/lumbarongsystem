import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../widgets/app_navbar.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) context.go('/');
      });
      return const SizedBox.shrink();
    }

    final user = auth.user!;
    final int navIndex = user.role == 'admin' ? 3 : 4;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: const LumBarongAppBar(title: 'My Profile', showBack: true),
      bottomNavigationBar: AppBottomNav(currentIndex: navIndex),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // User Header
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: user.role == 'seller'
                    ? AppTheme.darkSection
                    : Colors.white,
                borderRadius: BorderRadius.circular(32),
                border: Border.all(
                  color: user.role == 'seller'
                      ? Colors.white.withValues(alpha: 0.1)
                      : AppTheme.borderLight.withValues(alpha: 0.5),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 25,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Container(
                    width: 90,
                    height: 90,
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: user.role == 'seller'
                            ? AppTheme.primary.withValues(alpha: 0.3)
                            : AppTheme.borderLight,
                        width: 2,
                      ),
                    ),
                    child: Container(
                      decoration: BoxDecoration(
                        color: user.role == 'seller'
                            ? Colors.white.withValues(alpha: 0.05)
                            : AppTheme.background,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          user.name.isNotEmpty
                              ? user.name[0].toUpperCase()
                              : '?',
                          style: TextStyle(
                            fontSize: 36,
                            fontWeight: FontWeight.w900,
                            color: user.role == 'seller'
                                ? Colors.white
                                : AppTheme.primary,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    (user.role == 'seller'
                            ? (user.shopName ?? user.name)
                            : user.name)
                        .toUpperCase(),
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                      color: user.role == 'seller'
                          ? Colors.white
                          : AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    user.email.toLowerCase(),
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: user.role == 'seller'
                          ? Colors.white.withValues(alpha: 0.5)
                          : AppTheme.textMuted,
                    ),
                  ),
                  if (user.role == 'seller') ...[
                    const SizedBox(height: 20),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: user.isVerified
                            ? const Color(0xFFD4AF37).withValues(
                                alpha: 0.15,
                              ) // Artisan Gold
                            : Colors.orange.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: user.isVerified
                              ? const Color(0xFFD4AF37).withValues(alpha: 0.3)
                              : Colors.orange.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            user.isVerified
                                ? Icons.verified_rounded
                                : Icons.hourglass_empty_rounded,
                            size: 14,
                            color: user.isVerified
                                ? const Color(0xFFD4AF37)
                                : Colors.orange,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            user.isVerified
                                ? 'VERIFIED ARTISAN'
                                : 'PENDING APPROVAL',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1,
                              color: user.isVerified
                                  ? const Color(0xFFD4AF37)
                                  : Colors.orange,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    const SizedBox(height: 20),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.background,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.borderLight),
                      ),
                      child: Text(
                        'COLLECTOR',
                        style: const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Role-Based Section
            if (user.role == 'seller') ...[
              _buildSectionHeader('SHOP MANAGEMENT'),
              const SizedBox(height: 16),
              _buildActionTile(
                icon: Icons.dashboard_outlined,
                title: 'Shop Dashboard',
                subtitle: 'View your sales and performance',
                onTap: () => context.go('/seller/dashboard'),
              ),
              const SizedBox(height: 12),
              _buildActionTile(
                icon: Icons.inventory_2_outlined,
                title: 'My Catalog',
                subtitle: 'Manage your heritage pieces',
                onTap: () => context.push('/seller/products'),
              ),
              const SizedBox(height: 12),
              _buildActionTile(
                icon: Icons.receipt_long_outlined,
                title: 'Sales Registry',
                subtitle: 'Process your orders',
                onTap: () => context.push('/seller/orders'),
              ),
            ] else if (user.role == 'admin') ...[
              _buildSectionHeader('PLATFORM COMMAND'),
              const SizedBox(height: 16),
              _buildActionTile(
                icon: Icons.admin_panel_settings_outlined,
                title: 'Admin Dashboard',
                subtitle: 'Overview of system status',
                onTap: () => context.go('/admin/dashboard'),
              ),
              const SizedBox(height: 12),
              _buildActionTile(
                icon: Icons.people_outline_rounded,
                title: 'Seller Approvals',
                subtitle: 'Verify new artisans',
                onTap: () => context.push('/admin/sellers'),
              ),
              const SizedBox(height: 12),
              _buildActionTile(
                icon: Icons.inventory_outlined,
                title: 'Global Catalog',
                subtitle: 'Manage all platform products',
                onTap: () => context.push('/admin/products'),
              ),
            ] else ...[
              _buildSectionHeader('ACCOUNT MANAGEMENT'),
              const SizedBox(height: 16),
              _buildActionTile(
                icon: Icons.location_on_outlined,
                title: 'Address Book',
                subtitle: 'Manage your delivery locations',
                onTap: () => context.push('/profile/addresses'),
              ),
              const SizedBox(height: 12),
              _buildActionTile(
                icon: Icons.history_outlined,
                title: 'Purchase History',
                subtitle: 'View your previous orders',
                onTap: () => context.push('/orders'),
              ),
            ],

            const SizedBox(height: 12),
            if (user.role != 'admin')
              _buildActionTile(
                icon: Icons.chat_bubble_outline_rounded,
                title: 'Message Center',
                subtitle:
                    'Chat with ${user.role == 'customer' ? 'artisans' : 'customers'}',
                onTap: () => context.push('/messages'),
              ),

            const SizedBox(height: 32),
            _buildSectionHeader('SYSTEM'),
            const SizedBox(height: 16),
            _buildActionTile(
              icon: Icons.info_outline_rounded,
              title: 'About LumBarong',
              subtitle: 'Learn about our heritage',
              onTap: () => context.push('/about'),
            ),
            const SizedBox(height: 12),
            _buildActionTile(
              icon: Icons.logout_rounded,
              title: 'Sign Out',
              subtitle: 'Safely end your session',
              color: Colors.redAccent,
              onTap: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text(
                      'Sign Out',
                      style: TextStyle(fontWeight: FontWeight.w900),
                    ),
                    content: const Text('Are you sure you want to log out?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        child: const Text('CANCEL'),
                      ),
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        child: const Text(
                          'LOGOUT',
                          style: TextStyle(color: Colors.red),
                        ),
                      ),
                    ],
                  ),
                );
                if (confirm == true) {
                  await auth.logout();
                  if (context.mounted) context.go('/');
                }
              },
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Padding(
        padding: const EdgeInsets.only(left: 8),
        child: Text(
          title,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w900,
            letterSpacing: 2,
            color: AppTheme.textMuted,
          ),
        ),
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Color? color,
  }) {
    return Container(
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
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: (color ?? AppTheme.primary).withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Icon(icon, color: color ?? AppTheme.primary, size: 24),
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 16,
            color: AppTheme.textPrimary,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 12,
            color: AppTheme.textMuted,
          ),
        ),
        trailing: const Icon(
          Icons.chevron_right_rounded,
          color: AppTheme.textMuted,
          size: 20,
        ),
      ),
    );
  }
}
