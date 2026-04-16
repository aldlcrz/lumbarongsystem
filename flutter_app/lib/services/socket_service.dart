import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../config/api_config.dart';

/// Real-time socket service for live notifications, orders, and messages.
/// Connects to backend socket.io server when user logs in.
/// Emits event streams for consumers (notification provider, orders screen, etc.)
class SocketService {
  static final SocketService _instance = SocketService._();
  factory SocketService() => _instance;

  SocketService._();

  IO.Socket? _socket;
  bool _isConnected = false;
  String? _userId;

  bool get isConnected => _isConnected;

  final StreamController<Map<String, dynamic>> _notificationStream =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _orderUpdateStream =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _messageStream =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<String> _typingStream =
      StreamController<String>.broadcast();

  Stream<Map<String, dynamic>> get notificationStream =>
      _notificationStream.stream;
  Stream<Map<String, dynamic>> get orderUpdateStream => _orderUpdateStream.stream;
  Stream<Map<String, dynamic>> get messageStream => _messageStream.stream;
  Stream<String> get typingStream => _typingStream.stream;

  /// Initialize and connect socket to backend
  Future<void> connect(String userId) async {
    if (_isConnected && _userId == userId) return;

    // Skip socket connection in mock mode
    if (kMockMode) {
      debugPrint('[SocketService] Mock mode - skipping socket connection');
      _userId = userId;
      _isConnected = false;
      return;
    }

    _userId = userId;

    try {
      final socketUrl = kSocketUrl;

      _socket = IO.io(
        socketUrl,
        IO.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .enableReconnection()
            .setReconnectionDelay(1000)
            .setReconnectionDelayMax(5000)
            .setReconnectionAttempts(10)
            .build(),
      );

      _socket!.on('connect', _onConnect);
      _socket!.on('disconnect', _onDisconnect);
      _socket!.on('connect_error', _onConnectError);
      _socket!.on('new_notification', _onNewNotification);
      _socket!.on('order_status_update', _onOrderStatusUpdate);
      _socket!.on('new_order_confirmed', _onNewOrderConfirmed);
      _socket!.on('new_message', _onNewMessage);
      _socket!.on('user_typing', _onUserTyping);

      debugPrint('[SocketService] Connecting to $socketUrl for user: $userId');
    } catch (e) {
      debugPrint('[SocketService] Connection error: $e');
    }
  }

  /// Disconnect socket
  void disconnect() {
    if (kMockMode) {
      _isConnected = false;
      return;
    }
    _socket?.disconnect();
    _isConnected = false;
    debugPrint('[SocketService] Disconnected');
  }

  /// Join user-specific room
  void _joinUserRoom() {
    if (_socket == null || _userId == null) return;

    _socket!.emit('join_room', 'user_$_userId');
    debugPrint('[SocketService] Joined room: user_$_userId');
  }

  /// Socket event handlers
  void _onConnect(dynamic data) {
    _isConnected = true;
    debugPrint('[SocketService] Connected with id: ${_socket!.id}');
    _joinUserRoom();
  }

  void _onDisconnect(dynamic data) {
    _isConnected = false;
    debugPrint('[SocketService] Disconnected');
  }

  void _onConnectError(dynamic error) {
    debugPrint('[SocketService] Connection error: $error');
  }

  void _onNewNotification(dynamic data) {
    if (data is Map<String, dynamic>) {
      debugPrint('[SocketService] New notification: ${data['title']}');
      _notificationStream.add(data);
    }
  }

  void _onOrderStatusUpdate(dynamic data) {
    if (data is Map<String, dynamic>) {
      debugPrint('[SocketService] Order status update: ${data['orderId']} -> ${data['status']}');
      _orderUpdateStream.add(data);
    }
  }

  void _onNewOrderConfirmed(dynamic data) {
    if (data is Map<String, dynamic>) {
      debugPrint('[SocketService] New order confirmed: ${data['orderId']}');
      _orderUpdateStream.add(data);
    }
  }

  void _onNewMessage(dynamic data) {
    if (data is Map<String, dynamic>) {
      debugPrint('[SocketService] New message from ${data['senderId']}');
      _messageStream.add(data);
    }
  }

  void _onUserTyping(dynamic data) {
    if (data is Map<String, dynamic>) {
      final typingUser = data['userId']?.toString() ?? '';
      debugPrint('[SocketService] User typing: $typingUser');
      _typingStream.add(typingUser);
    }
  }

  /// Emit events to backend
  void sendMessage(String receiverId, String content) {
    _socket?.emit('send_message', {
      'receiverId': receiverId,
      'content': content,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  void notifyTyping(String receiverId) {
    _socket?.emit('typing', {
      'receiverId': receiverId,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  /// Cleanup
  void dispose() {
    _notificationStream.close();
    _orderUpdateStream.close();
    _messageStream.close();
    _typingStream.close();
    disconnect();
  }
}
