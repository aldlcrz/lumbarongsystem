import 'package:flutter/foundation.dart';

/// --- API CONFIGURATION ---
/// Change the [hostIp] below to match your machine's IP address
/// if you are testing on a physical mobile device.
const String _hostIp = '192.168.1.14';

/// API base URL Configuration
///
/// Automatically detects environment and sets appropriate URL.
String get kApiBaseUrl {
  if (kIsWeb) {
    return 'http://127.0.0.1:5000/api/v1';
  }

  // Use the local machine IP for all mobile platforms to support physical devices
  // Note: For Android emulators, you can also use 10.0.2.2
  return 'http://$_hostIp:5000/api/v1';
}
