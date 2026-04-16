import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notification_provider.dart';
import '../widgets/app_navbar.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<NotificationProvider>().fetch();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/');
      });
      return const SizedBox.shrink();
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF9F6F2),
      appBar: const LumBarongAppBar(title: 'Notifications', showBack: true),
      body: Consumer<NotificationProvider>(
        builder: (context, provider, _) {
          final notifications = provider.notifications;

          if (provider.loading && notifications.isEmpty) {
            return const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            );
          }

          return RefreshIndicator(
            color: AppTheme.primary,
            onRefresh: provider.fetch,
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${provider.unreadCount} unread notification${provider.unreadCount == 1 ? '' : 's'}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.textMuted,
                              letterSpacing: 0.4,
                            ),
                          ),
                        ),
                        if (provider.unreadCount > 0)
                          TextButton(
                            onPressed: provider.markAllAsRead,
                            child: const Text(
                              'MARK ALL READ',
                              style: TextStyle(
                                color: AppTheme.primary,
                                fontWeight: FontWeight.w900,
                                fontSize: 11,
                                letterSpacing: 0.6,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                if (notifications.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.notifications_off_outlined,
                              size: 64,
                              color: AppTheme.textMuted.withValues(alpha: 0.45),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'You are all caught up.',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.charcoal,
                              ),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'New order and message updates will appear here.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 13,
                                color: AppTheme.textMuted,
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                else
                  SliverList.separated(
                    itemCount: notifications.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final notification = notifications[index];
                      final isRead = notification['read'] == true;
                      final title = (notification['title'] ?? 'Notification').toString();
                      final message = (notification['message'] ?? '').toString();
                      final type = (notification['type'] ?? '').toString().toLowerCase();
                      final timeText = _relativeTime(notification['createdAt']?.toString());

                      return Padding(
                        padding: EdgeInsets.fromLTRB(
                          16,
                          index == 0 ? 4 : 0,
                          16,
                          index == notifications.length - 1 ? 24 : 0,
                        ),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(18),
                          onTap: () async {
                            final id = notification['id']?.toString();
                            if (!isRead && id != null && id.isNotEmpty) {
                              await provider.markAsRead(id);
                            }

                            if (!context.mounted) return;
                            final link = notification['link']?.toString();
                            if (link != null && link.isNotEmpty) {
                              context.push(link);
                            }
                          },
                          child: Container(
                            decoration: BoxDecoration(
                              color: isRead ? Colors.white : AppTheme.primary.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: isRead ? AppTheme.borderLight : AppTheme.primary.withValues(alpha: 0.25),
                              ),
                            ),
                            padding: const EdgeInsets.all(14),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _notificationIcon(type),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              title,
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                              style: TextStyle(
                                                fontSize: 15,
                                                fontWeight: isRead ? FontWeight.w600 : FontWeight.w800,
                                                color: AppTheme.charcoal,
                                              ),
                                            ),
                                          ),
                                          if (!isRead)
                                            Container(
                                              width: 8,
                                              height: 8,
                                              margin: const EdgeInsets.only(left: 8),
                                              decoration: const BoxDecoration(
                                                color: AppTheme.rust,
                                                shape: BoxShape.circle,
                                              ),
                                            ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        message,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          color: AppTheme.textSecondary,
                                          height: 1.4,
                                        ),
                                      ),
                                      if (timeText.isNotEmpty) ...[
                                        const SizedBox(height: 8),
                                        Text(
                                          timeText,
                                          style: const TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
                                            color: AppTheme.textMuted,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _notificationIcon(String type) {
    final bool isOrder = type.contains('order');
    final bool isMessage = type.contains('message') || type.contains('chat');

    if (isOrder) {
      return _iconBadge(
        icon: Icons.shopping_bag_outlined,
        bg: const Color(0xFFFEF2F1),
        border: const Color(0xFFF4A8A3),
        color: AppTheme.rust,
      );
    }

    if (isMessage) {
      return _iconBadge(
        icon: Icons.chat_bubble_outline,
        bg: const Color(0xFFF8F5F1),
        border: const Color(0xFFDBD4CC),
        color: AppTheme.charcoal,
      );
    }

    return _iconBadge(
      icon: Icons.shield_outlined,
      bg: const Color(0xFFEAF7ED),
      border: const Color(0xFFA1D4B1),
      color: const Color(0xFF2A6D3A),
    );
  }

  Widget _iconBadge({
    required IconData icon,
    required Color bg,
    required Color border,
    required Color color,
  }) {
    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: border),
      ),
      child: Icon(icon, size: 20, color: color),
    );
  }

  String _relativeTime(String? rawDate) {
    if (rawDate == null || rawDate.isEmpty) return '';
    try {
      final when = DateTime.parse(rawDate).toLocal();
      final diff = DateTime.now().difference(when);
      if (diff.inDays > 0) return '${diff.inDays}d ago';
      if (diff.inHours > 0) return '${diff.inHours}h ago';
      if (diff.inMinutes > 0) return '${diff.inMinutes}m ago';
      return 'Just now';
    } catch (_) {
      return '';
    }
  }
}