import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/message_badge_provider.dart';
import '../../services/api_client.dart';
import '../../services/socket_service.dart';
import '../widgets/app_navbar.dart';
import 'package:intl/intl.dart';

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  List<Map<String, dynamic>> _conversations = [];
  bool _loading = true;
  String _searchQuery = '';
  StreamSubscription? _messageStreamSub;

  @override
  void initState() {
    super.initState();
    _fetchConversations();
    _initializeRealtimeUpdates();
  }

  @override
  void dispose() {
    _messageStreamSub?.cancel();
    super.dispose();
  }

  void _initializeRealtimeUpdates() {
    final socketService = SocketService();
    _messageStreamSub = socketService.messageStream.listen((message) {
      _fetchConversations();
    });
  }

  Future<void> _fetchConversations() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient().get('/chat/conversations');
      if (res.data is List) {
        final List<Map<String, dynamic>> threads = (res.data as List)
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();

        if (mounted) {
          context.read<MessageBadgeProvider?>()?.applyFromConversations(
            threads,
          );
        }

        if (mounted) {
          setState(() {
            _conversations = threads;
            _loading = false;
          });
        }
      } else {
        if (mounted) setState(() => _loading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _buildConversationTile(
    String otherId,
    String otherName,
    String lastMsg,
    DateTime timestamp,
    bool isUnread,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isUnread ? AppTheme.primary : AppTheme.borderLight,
          width: isUnread ? 1.5 : 1,
        ),
        boxShadow: isUnread
            ? [
                BoxShadow(
                  color: AppTheme.primary.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ]
            : [],
      ),
      clipBehavior: Clip.antiAlias,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            context
                .push('/chat/$otherId/${Uri.encodeComponent(otherName)}')
                .then((_) => _fetchConversations());
          },
          child: IntrinsicHeight(
            child: Row(
              children: [
                if (isUnread) Container(width: 4, color: AppTheme.primary),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        // Avatar
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Center(
                            child: Text(
                              otherName.substring(0, 1).toUpperCase(),
                              style: const TextStyle(
                                fontWeight: FontWeight.w900,
                                color: AppTheme.primary,
                                fontSize: 18,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        // Details
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      otherName,
                                      style: TextStyle(
                                        fontWeight: FontWeight.w800,
                                        color: AppTheme.textPrimary,
                                        fontSize: 14,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        DateFormat.jm().format(timestamp),
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: isUnread
                                              ? FontWeight.w800
                                              : FontWeight.w600,
                                          color: isUnread
                                              ? AppTheme.rust
                                              : AppTheme.textMuted,
                                        ),
                                      ),
                                      if (isUnread)
                                        Container(
                                          padding: const EdgeInsets.all(6),
                                          margin: const EdgeInsets.only(top: 8),
                                          decoration: const BoxDecoration(
                                            color: AppTheme.rust,
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                lastMsg,
                                style: TextStyle(
                                  color: isUnread
                                      ? AppTheme.textPrimary
                                      : AppTheme.textSecondary,
                                  fontWeight: isUnread
                                      ? FontWeight.w600
                                      : FontWeight.normal,
                                  fontSize: 13,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
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

    final filtered = _conversations.where((conv) {
      final otherUser = conv['otherUser'] as Map? ?? {};
      final name = (otherUser['shopName'] ?? otherUser['name'] ?? '')
          .toString()
          .toLowerCase();
      return name.contains(_searchQuery.toLowerCase());
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: const LumBarongAppBar(showBack: false),
      bottomNavigationBar: const AppBottomNav(currentIndex: 3),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Custom Header to match Web UI
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 20,
                      height: 1.5,
                      color: AppTheme.primary,
                      margin: const EdgeInsets.only(right: 8),
                    ),
                    const Text(
                      'COMMUNICATION',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 2.0,
                        color: AppTheme.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                RichText(
                  text: TextSpan(
                    style: const TextStyle(
                      fontFamily: 'PlayfairDisplay',
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.charcoal,
                    ),
                    children: [
                      const TextSpan(text: 'Heritage '),
                      TextSpan(
                        text: 'inquiries',
                        style: const TextStyle(
                          fontStyle: FontStyle.italic,
                          color: AppTheme.primary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: TextField(
                onChanged: (val) => setState(() => _searchQuery = val),
                decoration: InputDecoration(
                  hintText: 'Search artisans...',
                  hintStyle: const TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 14,
                  ),
                  prefixIcon: const Icon(
                    Icons.search,
                    color: AppTheme.textMuted,
                    size: 20,
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // List body
          Expanded(
            child: _loading
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
                    onRefresh: _fetchConversations,
                    child: Column(
                      children: [
                        if (filtered.isEmpty)
                          const Expanded(
                            child: Center(
                              child: Text(
                                'No active conversations found',
                                style: TextStyle(
                                  color: AppTheme.textMuted,
                                  fontSize: 13,
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ),
                          )
                        else
                          Expanded(
                            child: ListView.separated(
                              padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
                              itemCount: filtered.length,
                              separatorBuilder: (_, __) =>
                                  const SizedBox(height: 12),
                              itemBuilder: (ctx, i) {
                                final conv = filtered[i];
                                final otherUser =
                                    conv['otherUser'] as Map? ?? {};
                                final lastMsg = conv['lastMessage'] ?? '';

                                final timestamp = conv['timestamp'] != null
                                    ? DateTime.tryParse(
                                            conv['timestamp'].toString(),
                                          ) ??
                                          DateTime.now()
                                    : DateTime.now();
                                final unread = conv['unreadCount'] ?? 0;

                                final String otherId =
                                    otherUser['id']?.toString() ?? '';
                                final String rawName =
                                    (otherUser['shopName'] ?? otherUser['name'])
                                        ?.toString() ??
                                    'User';
                                final String otherName = rawName.isNotEmpty
                                    ? rawName
                                    : 'User';

                                return _buildConversationTile(
                                  otherId,
                                  otherName,
                                  lastMsg,
                                  timestamp,
                                  unread > 0,
                                );
                              },
                            ),
                          ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
