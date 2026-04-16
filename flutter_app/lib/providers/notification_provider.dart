import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../services/socket_service.dart';

class NotificationProvider extends ChangeNotifier {
  final ApiClient _api = ApiClient();
  final SocketService _socket = SocketService();

  NotificationProvider() {
    _initializeSocket();
  }

  List<Map<String, dynamic>> _notifications = [];
  bool _loading = false;
  StreamSubscription? _notificationStreamSub;

  List<Map<String, dynamic>> get notifications => _notifications;
  bool get loading => _loading;

  int get unreadCount => _notifications.where((n) => n['read'] != true).length;

  /// Initialize socket listeners for real-time notifications
  void _initializeSocket() {
    _notificationStreamSub = _socket.notificationStream.listen((notif) {
      _addNotification(notif);
    });
  }

  Map<String, dynamic> _normalizeNotification(Map<String, dynamic> notif) {
    return {
      ...notif,
      'id': notif['id']?.toString(),
      'read': notif['read'] == true,
    };
  }

  void _setNotificationRead(String id, {bool notify = true}) {
    final index = _notifications.indexWhere((n) => n['id']?.toString() == id);
    if (index == -1) return;

    _notifications[index] = {..._notifications[index], 'read': true};

    if (notify) {
      notifyListeners();
    }
  }

  /// Add notification to list (live from socket)
  void _addNotification(Map<String, dynamic> notif) {
    final normalized = _normalizeNotification(Map<String, dynamic>.from(notif));
    final idx = _notifications.indexWhere(
      (n) => n['id']?.toString() == normalized['id']?.toString(),
    );
    if (idx != -1) {
      _notifications[idx] = normalized;
    } else {
      _notifications.insert(0, normalized);
    }
    notifyListeners();
  }

  /// Fetch all notifications (initial load + manual refresh)
  Future<void> fetch() async {
    try {
      _loading = true;
      notifyListeners();
      final res = await _api.get<dynamic>('/notifications');
      final data = res.data;
      if (data is List) {
        _notifications = data
            .map(
              (e) =>
                  _normalizeNotification(Map<String, dynamic>.from(e as Map)),
            )
            .toList();
        _notifications.sort(
          (a, b) => (b['createdAt']?.toString() ?? '').compareTo(
            a['createdAt']?.toString() ?? '',
          ),
        );
      }
    } catch (_) {
      // Silently fail — don't crash the app if notifications can't be fetched
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  /// Mark notification as read
  Future<void> markAsRead(String id) async {
    try {
      _setNotificationRead(id);
      await _api.put<dynamic>('/notifications/$id/read');
    } catch (_) {}
  }

  /// Mark all notifications as read
  Future<void> markAllAsRead() async {
    final unread = _notifications.where((n) => n['read'] != true).toList();
    for (final n in unread) {
      final id = n['id']?.toString();
      if (id != null && id.isNotEmpty) {
        await markAsRead(id);
      }
    }
  }

  @override
  void dispose() {
    _notificationStreamSub?.cancel();
    super.dispose();
  }
}
