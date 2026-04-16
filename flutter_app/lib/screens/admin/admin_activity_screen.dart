import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../widgets/app_navbar.dart';

class AdminActivityScreen extends StatefulWidget {
  const AdminActivityScreen({super.key});

  @override
  State<AdminActivityScreen> createState() => _AdminActivityScreenState();
}

class _AdminActivityScreenState extends State<AdminActivityScreen> {
  bool _loading = true;
  bool _broadcasting = false;
  List<Map<String, dynamic>> _activities = [];
  List<Map<String, dynamic>> _topLocations = [];
  final TextEditingController _broadcastController = TextEditingController();
  Timer? _liveTimer;

  @override
  void initState() {
    super.initState();
    _loadActivity();
    _liveTimer = Timer.periodic(const Duration(seconds: 20), (_) {
      _loadActivity(silent: true);
    });
  }

  @override
  void dispose() {
    _liveTimer?.cancel();
    _broadcastController.dispose();
    super.dispose();
  }

  Future<void> _loadActivity({bool silent = false}) async {
    if (!silent) {
      setState(() => _loading = true);
    }
    try {
      final res = await ApiClient().get('/admin/analytics');
      if (!mounted) return;

      final recent = (res.data['recentActivity'] as List? ?? [])
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();
      final locations = (res.data['topLocations'] as List? ?? [])
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();

      setState(() {
        _activities = recent;
        _topLocations = locations;
      });
    } catch (_) {}
    if (mounted && !silent) {
      setState(() => _loading = false);
    }
  }

  String _csvEscape(dynamic value) {
    final text = value?.toString() ?? '';
    return '"${text.replaceAll('"', '""')}"';
  }

  Future<void> _exportCsv() async {
    final rows = <List<dynamic>>[
      ['Type', 'Title', 'Description', 'Status', 'Time'],
      ..._activities.map(
        (a) => [
          a['type'] ?? 'activity',
          a['title'] ?? '',
          a['desc'] ?? '',
          a['status'] ?? '',
          a['time'] ?? '',
        ],
      ),
    ];

    final csv = rows.map((row) => row.map(_csvEscape).join(',')).join('\n');

    try {
      final directory = await getTemporaryDirectory();
      final date = DateTime.now().toIso8601String().split('T').first;
      final file = File('${directory.path}/admin_activity_$date.csv');
      await file.writeAsString(csv);

      await Share.shareXFiles(
        [XFile(file.path)],
        text: 'Admin activity log export',
        subject: 'Activity report',
      );
    } catch (_) {
      await Clipboard.setData(ClipboardData(text: csv));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Share unavailable. CSV copied to clipboard.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _broadcast() async {
    final message = _broadcastController.text.trim();
    if (message.isEmpty) return;

    setState(() => _broadcasting = true);
    try {
      await ApiClient().post('/admin/broadcast', data: {'message': message});
      if (!mounted) return;
      _broadcastController.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Broadcast sent successfully.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to send broadcast.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _broadcasting = false);
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
      appBar: const LumBarongAppBar(title: 'Recent Updates', showBack: true),
      bottomNavigationBar: const AppBottomNav(currentIndex: 1),
      body: RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: _loadActivity,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'System Activity',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: AppTheme.charcoal,
                    ),
                  ),
                ),
                IconButton(
                  tooltip: 'Export CSV',
                  onPressed: _activities.isEmpty ? null : _exportCsv,
                  icon: const Icon(Icons.file_download_outlined),
                ),
              ],
            ),
            const SizedBox(height: 14),
            if (_loading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: Center(
                  child: CircularProgressIndicator(color: AppTheme.primary),
                ),
              )
            else if (_activities.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 26),
                child: Center(
                  child: Text(
                    'No activity recorded yet.',
                    style: TextStyle(color: AppTheme.textMuted),
                  ),
                ),
              )
            else
              ..._activities.map(
                (a) => Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              (a['type'] ?? 'platform')
                                  .toString()
                                  .toUpperCase(),
                              style: const TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.primary,
                              ),
                            ),
                          ),
                          const Spacer(),
                          Text(
                            (a['time'] ?? '').toString(),
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        (a['title'] ?? '').toString(),
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.charcoal,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        (a['desc'] ?? '').toString(),
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Regional Distribution',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: AppTheme.charcoal,
                    ),
                  ),
                  const SizedBox(height: 10),
                  if (_topLocations.isEmpty)
                    const Text(
                      'No location data yet.',
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                    )
                  else
                    ..._topLocations.map(
                      (loc) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                (loc['city'] ?? 'Unknown').toString(),
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.charcoal,
                                ),
                              ),
                            ),
                            Text(
                              '${loc['count'] ?? 0} orders',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppTheme.primary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Broadcast System',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: AppTheme.charcoal,
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _broadcastController,
                    minLines: 3,
                    maxLines: 5,
                    decoration: InputDecoration(
                      hintText: 'Type broadcast message...',
                      filled: true,
                      fillColor: const Color(0xFFF9F6F2),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _broadcasting ? null : _broadcast,
                      icon: _broadcasting
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.campaign_outlined, size: 16),
                      label: Text(
                        _broadcasting ? 'Sending...' : 'Send Broadcast',
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.charcoal,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
