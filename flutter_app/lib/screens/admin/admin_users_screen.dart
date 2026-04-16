import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../widgets/app_navbar.dart';

class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> _filtered = [];
  bool _loading = true;
  String _searchQuery = '';
  Timer? _liveTimer;

  String _extractContact(Map<String, dynamic> user) {
    final raw =
        (user['mobileNumber'] ??
                user['mobile'] ??
                user['phone'] ??
                user['contactNumber'] ??
                '')
            .toString()
            .trim();
    return raw.isEmpty ? 'No contact number' : raw;
  }

  String _formatJoinedDate(Map<String, dynamic> user) {
    final raw = (user['createdAt'] ?? user['joinedAt'] ?? '').toString().trim();
    if (raw.isEmpty) return 'Unknown join date';

    final parsed = DateTime.tryParse(raw);
    if (parsed == null) return 'Unknown join date';

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    final localDate = parsed.toLocal();
    final month = monthNames[localDate.month - 1];
    return '$month ${localDate.day}, ${localDate.year}';
  }

  @override
  void initState() {
    super.initState();
    _loadUsers();
    _liveTimer = Timer.periodic(const Duration(seconds: 20), (_) {
      _loadUsers(silent: true);
    });
  }

  @override
  void dispose() {
    _liveTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadUsers({bool silent = false}) async {
    if (!silent) {
      setState(() => _loading = true);
    }
    try {
      final res = await ApiClient().get('/admin/customers');
      if (!mounted) return;
      if (res.data is List) {
        _users = (res.data as List)
            .map((item) => Map<String, dynamic>.from(item as Map))
            .toList();
        _applyFilter();
      }
    } catch (_) {}
    if (mounted && !silent) {
      setState(() => _loading = false);
    }
  }

  void _applyFilter() {
    final q = _searchQuery.toLowerCase();
    setState(() {
      _filtered = _users.where((u) {
        final name = (u['name'] ?? '').toString().toLowerCase();
        final email = (u['email'] ?? '').toString().toLowerCase();
        final mobile = (u['mobileNumber'] ?? u['mobile'] ?? '')
            .toString()
            .toLowerCase();
        return name.contains(q) || email.contains(q) || mobile.contains(q);
      }).toList();
    });
  }

  Future<void> _toggleUserStatus(String id) async {
    try {
      await ApiClient().put('/admin/customers/$id/toggle-status');
      await _loadUsers(silent: true);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Customer status updated.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to update status.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _deleteUser(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete user?'),
        content: const Text('This action permanently removes the customer.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ApiClient().delete('/admin/customers/$id');
      await _loadUsers(silent: true);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Customer deleted.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to delete customer.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn || auth.user!.role != 'admin') {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/');
      });
      return const SizedBox.shrink();
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF9F6F2),
      appBar: const LumBarongAppBar(title: 'Customers', showBack: true),
      bottomNavigationBar: const AppBottomNav(currentIndex: 2),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
            child: TextField(
              onChanged: (value) {
                _searchQuery = value;
                _applyFilter();
              },
              decoration: InputDecoration(
                hintText: 'Search by name, email, or mobile...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: AppTheme.borderLight),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: AppTheme.borderLight),
                ),
              ),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: AppTheme.primary),
                  )
                : RefreshIndicator(
                    color: AppTheme.primary,
                    onRefresh: _loadUsers,
                    child: _filtered.isEmpty
                        ? const Center(
                            child: Text(
                              'No customers found.',
                              style: TextStyle(color: AppTheme.textMuted),
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                            itemCount: _filtered.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final user = _filtered[index];
                              final status = (user['status'] ?? 'active')
                                  .toString()
                                  .toLowerCase();
                              final frozen = status == 'frozen';
                              final id = (user['id'] ?? user['_id']).toString();
                              final contact = _extractContact(user);
                              final joinedDate = _formatJoinedDate(user);

                              return Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: AppTheme.borderLight,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 22,
                                      backgroundColor: AppTheme.charcoal,
                                      child: Text(
                                        (user['name'] ?? 'U')
                                            .toString()
                                            .substring(0, 1)
                                            .toUpperCase(),
                                        style: const TextStyle(
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            (user['name'] ?? 'Unknown User')
                                                .toString(),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w800,
                                              color: AppTheme.charcoal,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            (user['email'] ?? '').toString(),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontSize: 11,
                                              color: AppTheme.textMuted,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            'Contact: $contact',
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontSize: 11,
                                              color: AppTheme.textMuted,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            'Joined: $joinedDate',
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontSize: 11,
                                              color: AppTheme.textMuted,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 8,
                                              vertical: 3,
                                            ),
                                            decoration: BoxDecoration(
                                              color: frozen
                                                  ? Colors.blue.shade50
                                                  : Colors.green.shade50,
                                              borderRadius:
                                                  BorderRadius.circular(999),
                                            ),
                                            child: Text(
                                              frozen ? 'FROZEN' : 'ACTIVE',
                                              style: TextStyle(
                                                fontSize: 9,
                                                fontWeight: FontWeight.w800,
                                                color: frozen
                                                    ? Colors.blue.shade700
                                                    : Colors.green.shade700,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    IconButton(
                                      tooltip: frozen ? 'Unfreeze' : 'Freeze',
                                      onPressed: () => _toggleUserStatus(id),
                                      icon: Icon(
                                        Icons.ac_unit,
                                        color: frozen
                                            ? Colors.green.shade700
                                            : Colors.blue.shade700,
                                      ),
                                    ),
                                    IconButton(
                                      tooltip: 'Delete',
                                      onPressed: () => _deleteUser(id),
                                      icon: Icon(
                                        Icons.delete_outline,
                                        color: Colors.red.shade600,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }
}
