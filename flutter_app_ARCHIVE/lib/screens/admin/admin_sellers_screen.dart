import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../widgets/app_navbar.dart';

class AdminSellersScreen extends StatefulWidget {
  const AdminSellersScreen({super.key});

  @override
  State<AdminSellersScreen> createState() => _AdminSellersScreenState();
}

class _AdminSellersScreenState extends State<AdminSellersScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _pending = [];
  List<Map<String, dynamic>> _verified = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadSellers();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadSellers() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient().get('/auth/sellers');
      if (res.data is List) {
        final all = (res.data as List)
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
        setState(() {
          _pending = all.where((s) => s['isVerified'] == false).toList();
          _verified = all.where((s) => s['isVerified'] == true).toList();
        });
      }
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _approveSeller(String id) async {
    try {
      await ApiClient().put('/auth/approve-seller/$id');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Artisan approved for commerce'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: AppTheme.darkSection,
          ),
        );
        await _loadSellers();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to approve artisan'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _revokeSeller(String id) async {
    try {
      await ApiClient().put('/auth/revoke-seller/$id');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Artisan verification revoked'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: AppTheme.darkSection,
          ),
        );
        await _loadSellers();
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn || auth.user!.role != 'admin') {
      context.go('/');
      return const SizedBox.shrink();
    }
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: LumBarongAppBar(title: 'Manage Artisans', showBack: true),
      bottomNavigationBar: const AppBottomNav(currentIndex: 1),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              labelColor: AppTheme.primary,
              unselectedLabelColor: AppTheme.textMuted,
              indicatorColor: AppTheme.primary,
              indicatorWeight: 3,
              dividerColor: AppTheme.borderLight,
              labelStyle: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                letterSpacing: 1,
              ),
              unselectedLabelStyle: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
              tabs: [
                Tab(text: 'PENDING (${_pending.length})'),
                Tab(text: 'VERIFIED (${_verified.length})'),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: AppTheme.primary),
                  )
                : TabBarView(
                    controller: _tabController,
                    children: [
                      _SellerList(
                        sellers: _pending,
                        onApprove: _approveSeller,
                        showApprove: true,
                      ),
                      _SellerList(
                        sellers: _verified,
                        onRevoke: _revokeSeller,
                        showRevoke: true,
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _SellerList extends StatelessWidget {
  final List<Map<String, dynamic>> sellers;
  final bool showApprove;
  final bool showRevoke;
  final void Function(String)? onApprove;
  final void Function(String)? onRevoke;

  const _SellerList({
    required this.sellers,
    this.showApprove = false,
    this.showRevoke = false,
    this.onApprove,
    this.onRevoke,
  });

  @override
  Widget build(BuildContext context) {
    if (sellers.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.storefront_outlined,
              size: 64,
              color: AppTheme.textMuted.withValues(alpha: 0.2),
            ),
            const SizedBox(height: 16),
            const Text(
              'No artisans found',
              style: TextStyle(
                color: AppTheme.textMuted,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      color: AppTheme.primary,
      onRefresh: () async {},
      child: ListView.separated(
        padding: const EdgeInsets.all(20),
        itemCount: sellers.length,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (context, i) {
          final s = sellers[i];
          return Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppTheme.borderLight),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: Text(
                      (s['name']?.toString() ?? '?')
                          .substring(0, 1)
                          .toUpperCase(),
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        color: AppTheme.primary,
                        fontSize: 18,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        (s['shopName']?.toString() ??
                                s['name']?.toString() ??
                                'Artisan')
                            .toUpperCase(),
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary,
                          fontSize: 13,
                          letterSpacing: 0.5,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        s['email']?.toString() ?? '',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                if (showApprove)
                  ElevatedButton(
                    onPressed: () => onApprove?.call(s['id'].toString()),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'APPROVE',
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                if (showRevoke)
                  OutlinedButton(
                    onPressed: () => onRevoke?.call(s['id'].toString()),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primary,
                      side: const BorderSide(color: AppTheme.primary),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'REVOKE',
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
