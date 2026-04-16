import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../models/user.dart';
import '../services/api_client.dart';

class AuthProvider with ChangeNotifier {
  UserModel? _user;
  bool _loading = true;
  final ApiClient _api = ApiClient();

  UserModel? get user => _user;
  bool get loading => _loading;
  bool get isLoggedIn => _user != null;

  AuthProvider() {
    _loadStoredUser();
  }

  Future<void> _loadStoredUser() async {
    _loading = true;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final userJson = prefs.getString('user');
      if (token != null && userJson != null && token.isNotEmpty) {
        _user = UserModel.fromJson(Map<String, dynamic>.from(jsonDecode(userJson) as Map));
      } else {
        _user = null;
      }
    } catch (_) {
      _user = null;
    }
    _loading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final res = await _api.post('/auth/login', data: {'email': email, 'password': password});
      final data = res.data as Map<String, dynamic>;
      final token = data['token'] as String;
      final userMap = Map<String, dynamic>.from(data['user'] as Map);
      _user = UserModel.fromJson(userMap);
      await _api.setToken(token);
      await _api.setUser(userMap);
      notifyListeners();
      return {'success': true};
    } on DioException catch (e) {
      String message = 'Login failed';
      final data = e.response?.data;
      if (data is Map && data['message'] != null) message = data['message'].toString();
      return {'success': false, 'message': message};
    }
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    try {
      final res = await _api.post('/auth/register', data: userData);
      final data = res.data as Map<String, dynamic>;
      final token = data['token'] as String;
      final userMap = Map<String, dynamic>.from(data['user'] as Map);
      _user = UserModel.fromJson(userMap);
      await _api.setToken(token);
      await _api.setUser(userMap);
      notifyListeners();
      return {'success': true, 'message': data['message']?.toString() ?? 'Registration successful'};
    } on DioException catch (e) {
      String message = 'Registration failed';
      final data = e.response?.data;
      if (data is Map && data['message'] != null) message = data['message'].toString();
      return {'success': false, 'message': message};
    }
  }

  Future<void> logout() async {
    await _api.clearAuth();
    _user = null;
    notifyListeners();
  }
}
