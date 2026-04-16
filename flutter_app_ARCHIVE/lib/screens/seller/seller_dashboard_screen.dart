import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../widgets/app_navbar.dart';

class SellerDashboardScreen extends StatefulWidget {
  const SellerDashboardScreen({super.key});

  @override
  State<SellerDashboardScreen> createState() => _SellerDashboardScreenState();
}

class _SellerDashboardScreenState extends State<SellerDashboardScreen> {
  Map<String, dynamic>? _stats;
  List<Map<String, dynamic>> _bestSellers = [];
  Map<String, dynamic> _funnel = {'total': 0, 'orders': 0, 'delivered': 0};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() => _loading = true);
    try {
      final auth = context.read<AuthProvider>();
      if (auth.user == null) return;

      final res = await ApiClient().get('/analytics/seller/${auth.user!.id}');
      if (res.data is Map) {
        setState(() {
          _stats = Map<String, dynamic>.from(res.data as Map);
          _bestSellers = (res.data['bestSellers'] as List? ?? [])
              .map((e) => Map<String, dynamic>.from(e as Map))
              .toList();
          if (res.data['funnel'] != null) {
            _funnel = Map<String, dynamic>.from(res.data['funnel'] as Map);
          }
        });
      }
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn || auth.user!.role != 'seller') {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/');
      });
      return const SizedBox.shrink();
    }
    final user = auth.user!;
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: const LumBarongAppBar(),
      bottomNavigationBar: const AppBottomNav(currentIndex: 0),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/seller/add-product'),
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        elevation: 4,
        icon: const Icon(Icons.add_circle_outline),
        label: const Text(
          'New Product',
          style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: 0.5),
        ),
      ),
      body: RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: _loadStats,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Shop Header
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  color: AppTheme.darkSection,
                  borderRadius: BorderRadius.circular(32),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.2),
                        ),
                      ),
                      child: Center(
                        child: Text(
                          user.name.substring(0, 1).toUpperCase(),
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user.shopName ?? user.name,
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: user.isVerified
                                  ? const Color(
                                      0xFF10B981,
                                    ).withValues(alpha: 0.2)
                                  : Colors.orange.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: user.isVerified
                                    ? const Color(
                                        0xFF10B981,
                                      ).withValues(alpha: 0.3)
                                    : Colors.orange.withValues(alpha: 0.3),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  user.isVerified
                                      ? Icons.verified
                                      : Icons.hourglass_empty,
                                  color: user.isVerified
                                      ? const Color(0xFF34D399)
                                      : Colors.orange,
                                  size: 12,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  user.isVerified
                                      ? 'VERIFIED ARTISAN'
                                      : 'PENDING APPROVAL',
                                  style: TextStyle(
                                    color: user.isVerified
                                        ? const Color(0xFF34D399)
                                        : Colors.orange,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              const _SectionLabel(text: 'PERFORMANCE OVERVIEW'),
              const SizedBox(height: 16),
              if (_loading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32),
                    child: CircularProgressIndicator(color: AppTheme.primary),
                  ),
                )
              else ...[
                _StatsRow(stats: _stats),
                const SizedBox(height: 32),
                const _SectionLabel(text: 'SALES FUNNEL SUPPORT'),
                const SizedBox(height: 16),
                _SalesFunnelWidget(funnel: _funnel),
                const SizedBox(height: 40),
                const _SectionLabel(text: 'BEST SELLING COLLECTIONS'),
                const SizedBox(height: 16),
                if (_bestSellers.isEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 32),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppTheme.borderLight),
                    ),
                    child: const Center(
                      child: Text(
                        'No sales data recorded yet.',
                        style: TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 12,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _bestSellers.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (ctx, i) =>
                        _BestSellerCard(product: _bestSellers[i]),
                  ),
                const SizedBox(height: 40),
                const _SectionLabel(text: 'QUICK ACTIONS'),
                const SizedBox(height: 16),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  childAspectRatio: 1.4,
                  children: [
                    _ActionTile(
                      icon: Icons.add_to_photos_outlined,
                      label: 'Add Product',
                      color: AppTheme.primary,
                      onTap: () => context.push('/seller/add-product'),
                    ),
                    _ActionTile(
                      icon: Icons.inventory_2_outlined,
                      label: 'Inventory',
                      color: const Color(0xFF10B981),
                      onTap: () => context.push('/seller/inventory'),
                    ),
                    _ActionTile(
                      icon: Icons.receipt_long_outlined,
                      label: 'Order Hub',
                      color: const Color(0xFF6366F1),
                      onTap: () => context.push('/seller/orders'),
                    ),
                    _ActionTile(
                      icon: Icons.storefront_outlined,
                      label: 'Storefront',
                      color: const Color(0xFFF59E0B),
                      onTap: () => context.push('/seller/products'),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 40),
            ],
          ),
        ),
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

class _StatsRow extends StatelessWidget {
  final Map<String, dynamic>? stats;
  const _StatsRow({this.stats});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _MiniCard(
            label: 'PRODUCTS',
            value: '${stats?['productCount'] ?? 0}',
            icon: Icons.inventory_2_outlined,
            color: const Color(0xFF10B981),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _MiniCard(
            label: 'ORDERS',
            value: '${stats?['orderCount'] ?? 0}',
            icon: Icons.shopping_bag_outlined,
            color: const Color(0xFF6366F1),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _MiniCard(
            label: 'REVENUE',
            value: '₱${stats?['totalRevenue'] ?? 0}',
            icon: Icons.payments_outlined,
            color: AppTheme.primary,
          ),
        ),
      ],
    );
  }
}

class _MiniCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _MiniCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontSize: 8,
              fontWeight: FontWeight.w800,
              color: AppTheme.textMuted,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppTheme.borderLight),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 12),
            Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                color: AppTheme.textPrimary,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SalesFunnelWidget extends StatelessWidget {
  final Map<String, dynamic> funnel;
  const _SalesFunnelWidget({required this.funnel});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.darkSection,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          _FunnelStep(
            label: 'MARKETPLACE VISIBILITY',
            value: funnel['total']?.toString() ?? '0',
            percentage: '100%',
            color: Colors.white.withValues(alpha: 0.1),
            isBottom: false,
          ),
          _FunnelStep(
            label: 'HERITAGE INTEREST (ORDERS)',
            value: funnel['orders']?.toString() ?? '0',
            percentage: (funnel['total'] ?? 0) > 0
                ? '${(((funnel['orders'] ?? 0) / (funnel['total'] ?? 1)) * 100).toInt()}%'
                : '0%',
            color: AppTheme.primary.withValues(alpha: 0.4),
            isBottom: false,
          ),
          _FunnelStep(
            label: 'SEALED HERITAGE (DELIVERED)',
            value: funnel['delivered']?.toString() ?? '0',
            percentage: (funnel['orders'] ?? 0) > 0
                ? '${(((funnel['delivered'] ?? 0) / (funnel['orders'] ?? 1)) * 100).toInt()}%'
                : '0%',
            color: AppTheme.primary,
            isBottom: true,
          ),
        ],
      ),
    );
  }
}

class _FunnelStep extends StatelessWidget {
  final String label;
  final String value;
  final String percentage;
  final Color color;
  final bool isBottom;

  const _FunnelStep({
    required this.label,
    required this.value,
    required this.percentage,
    required this.color,
    required this.isBottom,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      value,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                percentage,
                style: const TextStyle(
                  color: Colors.white24,
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ),
        if (!isBottom)
          Container(
            height: 12,
            width: 2,
            color: Colors.white.withValues(alpha: 0.1),
          ),
      ],
    );
  }
}

class _BestSellerCard extends StatelessWidget {
  final Map<String, dynamic> product;
  const _BestSellerCard({required this.product});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.05),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.auto_awesome_rounded,
              color: AppTheme.primary,
              size: 20,
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
                    fontSize: 12,
                    letterSpacing: 0.5,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  '${product['sales']} Units Sold',
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppTheme.textMuted,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '₱${product['revenue']}',
                style: const TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                  color: AppTheme.primary,
                ),
              ),
              const Text(
                'REVENUE',
                style: TextStyle(
                  fontSize: 8,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.textMuted,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
