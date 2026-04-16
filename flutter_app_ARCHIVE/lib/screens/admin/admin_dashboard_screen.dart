import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../widgets/app_navbar.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  Map<String, dynamic>? _stats;
  List<Map<String, dynamic>> _pendingSellers = [];
  List<Map<String, dynamic>> _pendingProducts = [];
  bool _loading = true;
  bool _actionLoading = false;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient().get('/admin/stats');
      if (res.data is Map) {
        setState(() => _stats = Map<String, dynamic>.from(res.data as Map));
      }

      // Fetch pending sellers
      final sellersRes = await ApiClient().get('/auth/sellers');
      if (sellersRes.data is List) {
        setState(() {
          _pendingSellers = (sellersRes.data as List)
              .map((e) => Map<String, dynamic>.from(e as Map))
              .where((s) => s['isVerified'] == false)
              .toList();
        });
      }

      // Fetch pending products
      final prodRes = await ApiClient().get('/products');
      if (prodRes.data is List) {
        setState(() {
          _pendingProducts = (prodRes.data as List)
              .map((e) => Map<String, dynamic>.from(e as Map))
              .where((p) => p['status'] == 'pending')
              .toList();
        });
      }
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _approveSeller(String id) async {
    setState(() => _actionLoading = true);
    try {
      await ApiClient().put('/auth/approve-seller/$id');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Artisan approved for commerce'),
            behavior: SnackBarBehavior.floating,
          ),
        );
        _loadStats();
      }
    } catch (_) {}
    setState(() => _actionLoading = false);
  }

  Future<void> _updateProductStatus(String id, String status) async {
    setState(() => _actionLoading = true);
    try {
      await ApiClient().patch('/products/$id/status', data: {'status': status});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Product $status successfully'),
            behavior: SnackBarBehavior.floating,
          ),
        );
        _loadStats();
      }
    } catch (_) {}
    setState(() => _actionLoading = false);
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
      appBar: const LumBarongAppBar(title: 'Admin Command'),
      bottomNavigationBar: const AppBottomNav(currentIndex: 0),
      body: Stack(
        children: [
          RefreshIndicator(
            color: AppTheme.primary,
            onRefresh: _loadStats,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'MABUHAY, ${auth.user!.name.split(' ').first.toUpperCase()}!',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 2,
                      color: AppTheme.primary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Admin Console',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'High-level platform overview & controls',
                    style: TextStyle(
                      color: AppTheme.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 32),
                  if (_loading)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(40),
                        child: CircularProgressIndicator(
                          color: AppTheme.primary,
                        ),
                      ),
                    )
                  else ...[
                    _StatsGrid(stats: _stats),
                    const SizedBox(height: 40),
                    const _SectionLabel(text: 'REGISTRY APPLICATIONS'),
                    const SizedBox(height: 16),
                    if (_pendingSellers.isEmpty)
                      _EmptyState(
                        icon: Icons.shield_outlined,
                        text: 'No pending artisan registries',
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _pendingSellers.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 12),
                        itemBuilder: (ctx, i) => _SellerRegistryCard(
                          seller: _pendingSellers[i],
                          onApprove: _approveSeller,
                        ),
                      ),
                    const SizedBox(height: 40),
                    const _SectionLabel(text: 'PRODUCT REGISTRY'),
                    const SizedBox(height: 16),
                    if (_pendingProducts.isEmpty)
                      _EmptyState(
                        icon: Icons.storefront_outlined,
                        text: 'No pending product listings',
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _pendingProducts.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 12),
                        itemBuilder: (ctx, i) => _ProductRegistryCard(
                          product: _pendingProducts[i],
                          onAction: _updateProductStatus,
                        ),
                      ),
                  ],
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
          if (_actionLoading)
            Container(
              color: Colors.black26,
              alignment: Alignment.center,
              child: const CircularProgressIndicator(color: AppTheme.primary),
            ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String text;
  const _EmptyState({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 40),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Column(
        children: [
          Icon(
            icon,
            size: 32,
            color: AppTheme.textMuted.withValues(alpha: 0.3),
          ),
          const SizedBox(height: 12),
          Text(
            text,
            style: const TextStyle(
              color: AppTheme.textMuted,
              fontSize: 12,
              fontWeight: FontWeight.w600,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }
}

class _SellerRegistryCard extends StatelessWidget {
  final Map<String, dynamic> seller;
  final Function(String) onApprove;
  const _SellerRegistryCard({required this.seller, required this.onApprove});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.borderLight),
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
                seller['name'].toString().substring(0, 1).toUpperCase(),
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
                  (seller['shopName'] ?? seller['name'])
                      .toString()
                      .toUpperCase(),
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                    letterSpacing: 0.5,
                  ),
                ),
                Text(
                  'Joined ${seller['createdAt']?.toString().split('T').first ?? ''}',
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () => onApprove(seller['id'].toString()),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'VERIFY',
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
  }
}

class _ProductRegistryCard extends StatelessWidget {
  final Map<String, dynamic> product;
  final Function(String, String) onAction;
  const _ProductRegistryCard({required this.product, required this.onAction});

  @override
  Widget build(BuildContext context) {
    final seller = product['seller'] as Map? ?? {};
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: AppTheme.background,
                  borderRadius: BorderRadius.circular(12),
                  image:
                      product['images'] != null &&
                          (product['images'] as List).isNotEmpty
                      ? DecorationImage(
                          image: NetworkImage(
                            product['images'][0]['url'] ?? product['images'][0],
                          ),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product['name'].toString().toUpperCase(),
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        letterSpacing: 0.5,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '₱${product['price']} • by ${seller['shopName'] ?? seller['name']}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppTheme.textMuted,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () =>
                      onAction(product['id'].toString(), 'approved'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'APPROVE',
                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: () =>
                      onAction(product['id'].toString(), 'rejected'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.primary,
                    side: const BorderSide(color: AppTheme.primary),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'REJECT',
                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel({required this.text});

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.5,
        color: AppTheme.textMuted,
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  final Map<String, dynamic>? stats;
  const _StatsGrid({this.stats});

  @override
  Widget build(BuildContext context) {
    final totalUsers = stats?['totalUsers'] ?? '--';
    final totalOrders = stats?['totalOrders'] ?? '--';
    final totalRevenue = stats?['totalRevenue'] ?? '--';
    final pendingSellers = stats?['pendingSellers'] ?? '--';
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 1.3,
      children: [
        _StatCard(
          icon: Icons.people_outline,
          label: 'TOTAL USERS',
          value: '$totalUsers',
          color: const Color(0xFF6366F1),
        ),
        _StatCard(
          icon: Icons.shopping_bag_outlined,
          label: 'TOTAL ORDERS',
          value: '$totalOrders',
          color: const Color(0xFF10B981),
        ),
        _StatCard(
          icon: Icons.payments_outlined,
          label: 'REVENUE',
          value: '₱$totalRevenue',
          color: const Color(0xFFF59E0B),
        ),
        _StatCard(
          icon: Icons.storefront_outlined,
          label: 'PENDING',
          value: '$pendingSellers',
          color: AppTheme.primary,
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 8,
                  color: AppTheme.textMuted,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
