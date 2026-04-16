import 'dart:async';

import 'package:flutter/foundation.dart';

import '../services/api_client.dart';
import '../services/socket_service.dart';

class MessageBadgeProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();
  final SocketService _socket = SocketService();

  StreamSubscription? _messageSub;
  bool _loaded = false;
  bool _fetching = false;
  int _unreadConversationCount = 0;

  int get unreadConversationCount => _unreadConversationCount;

  MessageBadgeProvider() {
    _messageSub = _socket.messageStream.listen((_) {
      refresh();
    });
  }

  Future<void> ensureLoaded() async {
    if (_loaded || _fetching) return;
    await refresh();
  }

  Future<void> refresh() async {
    if (_fetching) return;
    _fetching = true;

    try {
      final res = await _api.get<dynamic>('/chat/conversations');
      final data = res.data;
      if (data is List) {
        _applyFromConversations(data);
      }
      _loaded = true;
    } catch (_) {
      // Ignore failures silently; this badge is non-critical UI.
    } finally {
      _fetching = false;
    }
  }

  void applyFromConversations(List<dynamic> conversations) {
    _loaded = true;
    _applyFromConversations(conversations);
  }

  void _applyFromConversations(List<dynamic> conversations) {
    final unreadThreads = conversations.where((conv) {
      if (conv is! Map) return false;
      final unread = int.tryParse((conv['unreadCount'] ?? 0).toString()) ?? 0;
      return unread > 0;
    }).length;

    if (unreadThreads != _unreadConversationCount) {
      _unreadConversationCount = unreadThreads;
      notifyListeners();
    }
  }

  void reset() {
    if (_unreadConversationCount != 0 || _loaded) {
      _unreadConversationCount = 0;
      _loaded = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _messageSub?.cancel();
    super.dispose();
  }
}
