import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../providers/auth_provider.dart';
import '../services/api_client.dart';
import 'widgets/app_navbar.dart';
import 'package:intl/intl.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  List<Map<String, dynamic>> _conversations = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadConversations();
  }

  Future<void> _loadConversations() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient().get('/chat/conversations');
      if (res.data is List) {
        setState(() {
          _conversations = (res.data as List)
              .map((e) => Map<String, dynamic>.from(e as Map))
              .toList();
        });
      }
    } catch (_) {}
    setState(() => _loading = false);
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
      backgroundColor: AppTheme.background,
      appBar: const LumBarongAppBar(title: 'Conversations', showBack: true),
      bottomNavigationBar: const AppBottomNav(currentIndex: 3),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            )
          : _conversations.isEmpty
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withValues(alpha: 0.05),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.chat_bubble_outline_rounded,
                      size: 64,
                      color: AppTheme.primary.withValues(alpha: 0.2),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Silence is Golden',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Messages with sellers and customers will appear here.',
                    style: TextStyle(color: AppTheme.textSecondary),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              color: AppTheme.primary,
              onRefresh: _loadConversations,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(vertical: 12),
                itemCount: _conversations.length,
                separatorBuilder: (context, index) => const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 24),
                  child: Divider(height: 1, color: AppTheme.borderLight),
                ),
                itemBuilder: (ctx, i) {
                  final conv = _conversations[i];
                  final otherUser = conv['otherUser'] as Map? ?? {};
                  final lastMsg = conv['lastMessage'] ?? '';
                  final timestamp = conv['timestamp'] != null
                      ? DateTime.tryParse(conv['timestamp'].toString()) ??
                            DateTime.now()
                      : DateTime.now();
                  final unread = conv['unreadCount'] ?? 0;

                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                    leading: Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Center(
                        child: Text(
                          (otherUser['shopName'] ?? otherUser['name'] ?? '?')
                              .toString()
                              .substring(0, 1)
                              .toUpperCase(),
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            color: AppTheme.primary,
                            fontSize: 20,
                          ),
                        ),
                      ),
                    ),
                    title: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            (otherUser['shopName'] ??
                                    otherUser['name'] ??
                                    'Unknown')
                                .toString()
                                .toUpperCase(),
                            style: TextStyle(
                              fontWeight: unread > 0
                                  ? FontWeight.w900
                                  : FontWeight.w800,
                              color: AppTheme.textPrimary,
                              fontSize: 13,
                              letterSpacing: 0.5,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Text(
                          DateFormat.jm().format(timestamp),
                          style: TextStyle(
                            fontSize: 10,
                            color: unread > 0
                                ? AppTheme.primary
                                : AppTheme.textMuted,
                            fontWeight: unread > 0
                                ? FontWeight.w800
                                : FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              lastMsg,
                              style: TextStyle(
                                color: unread > 0
                                    ? AppTheme.textPrimary
                                    : AppTheme.textSecondary,
                                fontWeight: unread > 0
                                    ? FontWeight.w600
                                    : FontWeight.normal,
                                fontSize: 13,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (unread > 0)
                            Container(
                              margin: const EdgeInsets.only(left: 8),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: AppTheme.primary,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                '$unread',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    onTap: () {
                      context.push(
                        '/chat/${otherUser['id']}/${Uri.encodeComponent((otherUser['shopName'] ?? otherUser['name'] ?? 'User').toString())}',
                      );
                    },
                  );
                },
              ),
            ),
    );
  }
}
