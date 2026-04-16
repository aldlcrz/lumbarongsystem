import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

/// Enable this to run the app with local mock API responses.
/// Set to false when backend is available.
const bool kMockMode = false;

/// --- API CONFIGURATION ---
/// For local development:
/// - Windows/iOS/Web: 'localhost'
/// - Android Emulator: '10.0.2.2'
/// For physical devices on same network: machine's IP address (e.g., '192.168.1.5')
const String _defaultHost = 'localhost';

String get _hostIp {
  if (kIsWeb) return 'localhost';
  try {
    if (Platform.isAndroid) return '10.0.2.2';
  } catch (_) {}
  return _defaultHost;
}

/// API base URL Configuration
String get kApiBaseUrl {
  return 'http://$_hostIp:5000/api/v1';
}

/// Socket.io connection URL (without /api/v1 path)
String get kSocketUrl {
  return 'http://$_hostIp:5000';
}
