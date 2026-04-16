import 'dart:ui'; // Need for ImageFilter
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/message_badge_provider.dart';
import '../../providers/notification_provider.dart';

/// A mobile-first BottomNavigationBar that adapts to user role.
class AppBottomNav extends StatelessWidget {
  final int currentIndex;
  const AppBottomNav({super.key, required this.currentIndex});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn) return const SizedBox.shrink();
    final role = auth.user!.role;

    if (role == 'customer') {
      final cartCount = context.watch<CartProvider>().cartCount;
      final messageBadge = context.watch<MessageBadgeProvider?>();
      messageBadge?.ensureLoaded();
      final unreadMessages = messageBadge?.unreadConversationCount ?? 0;
      return BottomNavigationBar(
        currentIndex: currentIndex,
        type: BottomNavigationBarType.fixed,
        onTap: (i) {
          switch (i) {
            case 0:
              context.go('/home');
              break;
            case 1:
              context.push('/orders');
              break;
            case 2:
              context.push('/cart');
              break;
            case 3:
              context.push('/messages');
              break;
            case 4:
              context.push('/profile');
              break;
          }
        },
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.storefront_outlined),
            activeIcon: Icon(Icons.storefront),
            label: 'Shop',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            activeIcon: Icon(Icons.receipt_long),
            label: 'Orders',
          ),
          BottomNavigationBarItem(
            icon: Badge(
              label: Text('$cartCount'),
              isLabelVisible: cartCount > 0,
              child: const Icon(Icons.shopping_cart_outlined),
            ),
            activeIcon: Badge(
              label: Text('$cartCount'),
              isLabelVisible: cartCount > 0,
              child: const Icon(Icons.shopping_cart),
            ),
            label: 'Cart',
          ),
          BottomNavigationBarItem(
            icon: Badge(
              label: Text(unreadMessages > 9 ? '9+' : '$unreadMessages'),
              isLabelVisible: unreadMessages > 0,
              child: const Icon(Icons.chat_bubble_outline),
            ),
            activeIcon: Badge(
              label: Text(unreadMessages > 9 ? '9+' : '$unreadMessages'),
              isLabelVisible: unreadMessages > 0,
              child: const Icon(Icons.chat_bubble),
            ),
            label: 'Messages',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      );
    }

    if (role == 'seller') {
      final messageBadge = context.watch<MessageBadgeProvider?>();
      messageBadge?.ensureLoaded();
      final unreadMessages = messageBadge?.unreadConversationCount ?? 0;
      return BottomNavigationBar(
        currentIndex: currentIndex,
        type: BottomNavigationBarType.fixed,
        onTap: (i) {
          switch (i) {
            case 0:
              context.go('/seller/dashboard');
              break;
            case 1:
              context.push('/seller/orders');
              break;
            case 2:
              context.push('/seller/inventory');
              break;
            case 3:
              context.push('/messages');
              break;
            case 4:
              context.push('/profile');
              break;
          }
        },
        items: [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            activeIcon: Icon(Icons.receipt_long),
            label: 'Orders',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2_outlined),
            activeIcon: Icon(Icons.inventory_2),
            label: 'Inventory',
          ),
          BottomNavigationBarItem(
            icon: Badge(
              label: Text(unreadMessages > 9 ? '9+' : '$unreadMessages'),
              isLabelVisible: unreadMessages > 0,
              child: const Icon(Icons.chat_bubble_outline),
            ),
            activeIcon: Badge(
              label: Text(unreadMessages > 9 ? '9+' : '$unreadMessages'),
              isLabelVisible: unreadMessages > 0,
              child: const Icon(Icons.chat_bubble),
            ),
            label: 'Messages',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      );
    }

    if (role == 'admin') {
      return BottomNavigationBar(
        currentIndex: currentIndex,
        type: BottomNavigationBarType.fixed,
        onTap: (i) {
          switch (i) {
            case 0:
              context.go('/admin/dashboard');
              break;
            case 1:
              context.push('/admin/activity');
              break;
            case 2:
              context.push('/admin/users');
              break;
            case 3:
              context.push('/admin/sellers');
              break;
            case 4:
              context.push('/admin/products');
              break;
          }
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.speed_outlined),
            activeIcon: Icon(Icons.speed),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.timeline_outlined),
            activeIcon: Icon(Icons.timeline),
            label: 'Activity',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.groups_outlined),
            activeIcon: Icon(Icons.groups),
            label: 'Users',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.store_outlined),
            activeIcon: Icon(Icons.store),
            label: 'Sellers',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_outlined),
            activeIcon: Icon(Icons.inventory),
            label: 'Products',
          ),
        ],
      );
    }

    return const SizedBox.shrink();
  }
}

/// Top AppBar used in all authenticated screens.
class LumBarongAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final bool showBack;

  const LumBarongAppBar({super.key, this.title, this.showBack = false});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isAdmin = auth.isLoggedIn && auth.user?.role == 'admin';
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      shadowColor: Colors.black.withValues(alpha: 0.05),
      surfaceTintColor: Colors.transparent,
      leading: showBack
          ? IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, size: 20),
              onPressed: () => context.pop(),
            )
          : null,
      title: title != null
          ? Text(
              title!,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppTheme.textPrimary,
              ),
            )
          : GestureDetector(
              onTap: () => context.go('/home'),
              child: const Text(
                'LumBarong',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  fontStyle: FontStyle.italic,
                  color: AppTheme.primary,
                  letterSpacing: -1.0,
                ),
              ),
            ),
      actions: [
        if (auth.isLoggedIn) ...[
          // ─── Notification Bell ───────────────────────────────────────
          Builder(
            builder: (ctx) {
              final notifProvider = ctx.watch<NotificationProvider>();
              final count = notifProvider.unreadCount;
              return Stack(
                clipBehavior: Clip.none,
                children: [
                  IconButton(
                    icon: const Icon(
                      Icons.notifications_none_rounded,
                      size: 22,
                      color: AppTheme.textMuted,
                    ),
                    onPressed: () {
                      notifProvider.fetch();
                      context.push('/notifications');
                    },
                  ),
                  if (count > 0)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: const BoxDecoration(
                          color: AppTheme.rust,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 14,
                          minHeight: 14,
                        ),
                        child: Text(
                          count > 9 ? '9+' : '$count',
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
            },
          ),
          // Hide profile shortcut for admin accounts.
          if (!isAdmin)
            GestureDetector(
              onTap: () => context.push('/profile'),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Text(
                  auth.user!.name.split(' ').first,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ),
            ),
          if (isAdmin)
            Padding(
              padding: const EdgeInsets.only(right: 6),
              child: Text(
                auth.user?.name.toString().trim().isNotEmpty == true
                    ? auth.user!.name
                    : 'Admin',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textSecondary,
                ),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.logout, size: 20, color: AppTheme.textMuted),
            onPressed: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Log Out'),
                  content: const Text('Are you sure you want to log out?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx, false),
                      child: const Text('Cancel'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(ctx, true),
                      style: TextButton.styleFrom(foregroundColor: Colors.red),
                      child: const Text('Log Out'),
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
        ],
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(height: 1, color: AppTheme.borderLight),
      ),
    );
  }
}

/// A Scaffold with the warm blurred blobs background used on auth screens.
/// Renamed internally to keep the BarongScaffold class name for backwards compatibility,
/// but visually it mimics the Next.js auth background.
class BarongScaffold extends StatelessWidget {
  final Widget child;
  const BarongScaffold({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background, // Cream: #F7F3EE
      body: Stack(
        children: [
          // Top Right Blob (Rust)
          Positioned(
            top: -200,
            right: -150,
            child: ImageFiltered(
              imageFilter: ImageFilter.blur(sigmaX: 100, sigmaY: 100),
              child: Container(
                width: 500,
                height: 500,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
          // Bottom Left Blob (Sand/BorderLight)
          Positioned(
            bottom: -150,
            left: -150,
            child: ImageFiltered(
              imageFilter: ImageFilter.blur(sigmaX: 100, sigmaY: 100),
              child: Container(
                width: 400,
                height: 400,
                decoration: BoxDecoration(
                  color: const Color(0xFFD4B896).withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),

          // Main Content
          Positioned.fill(child: child),
        ],
      ),
    );
  }
}

void _showNotificationsSheet(
  BuildContext context,
  NotificationProvider provider,
) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) {
      return Container(
        height: MediaQuery.of(ctx).size.height * 0.75,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // Sheet Header
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 16, 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Notifications',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.charcoal,
                    ),
                  ),
                  Row(
                    children: [
                      if (provider.unreadCount > 0)
                        TextButton(
                          onPressed: () {
                            provider.markAllAsRead();
                          },
                          child: const Text(
                            'Mark all read',
                            style: TextStyle(
                              fontSize: 14,
                              color: AppTheme.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      IconButton(
                        onPressed: () => Navigator.pop(ctx),
                        icon: const Icon(
                          Icons.close,
                          color: AppTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppTheme.borderLight),
            // Notifications List
            Expanded(
              child: Consumer<NotificationProvider>(
                builder: (context, notifProvider, child) {
                  if (notifProvider.loading &&
                      notifProvider.notifications.isEmpty) {
                    return const Center(
                      child: CircularProgressIndicator(color: AppTheme.primary),
                    );
                  }

                  final notifs = notifProvider.notifications;
                  if (notifs.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.notifications_off_outlined,
                            size: 64,
                            color: AppTheme.textMuted.withValues(alpha: 0.5),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'No notifications yet',
                            style: TextStyle(
                              color: AppTheme.textSecondary,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: notifs.length,
                    separatorBuilder: (_, __) =>
                        const Divider(height: 1, color: AppTheme.borderLight),
                    itemBuilder: (context, index) {
                      final n = notifs[index];
                      final isRead = n['read'] == true;

                      // Format date
                      final dateStr = n['createdAt'] as String?;
                      String timeText = '';
                      if (dateStr != null) {
                        try {
                          final date = DateTime.parse(dateStr).toLocal();
                          final now = DateTime.now();
                          final diff = now.difference(date);
                          if (diff.inDays > 0) {
                            timeText = '${diff.inDays}d ago';
                          } else if (diff.inHours > 0) {
                            timeText = '${diff.inHours}h ago';
                          } else if (diff.inMinutes > 0) {
                            timeText = '${diff.inMinutes}m ago';
                          } else {
                            timeText = 'Just now';
                          }
                        } catch (_) {}
                      }

                      return InkWell(
                        onTap: () {
                          if (!isRead) {
                            notifProvider.markAsRead(n['id'] as String);
                          }
                          // Navigate based on link
                          final link = n['link'] as String?;
                          if (link != null && link.isNotEmpty) {
                            Navigator.pop(ctx); // Close the bottom sheet
                            context.push(link);
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          color: isRead
                              ? Colors.transparent
                              : AppTheme.primary.withValues(alpha: 0.05),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                margin: const EdgeInsets.only(
                                  top: 6,
                                  right: 12,
                                ),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: isRead
                                      ? Colors.transparent
                                      : AppTheme.primary,
                                ),
                              ),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      n['title'] ?? 'Notification',
                                      style: TextStyle(
                                        fontWeight: isRead
                                            ? FontWeight.w500
                                            : FontWeight.w700,
                                        color: AppTheme.charcoal,
                                        fontSize: 16,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      n['message'] ?? '',
                                      style: const TextStyle(
                                        color: AppTheme.textSecondary,
                                        fontSize: 14,
                                        height: 1.4,
                                      ),
                                    ),
                                    if (timeText.isNotEmpty) ...[
                                      const SizedBox(height: 6),
                                      Text(
                                        timeText,
                                        style: const TextStyle(
                                          color: AppTheme.textMuted,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      );
    },
  );
}
