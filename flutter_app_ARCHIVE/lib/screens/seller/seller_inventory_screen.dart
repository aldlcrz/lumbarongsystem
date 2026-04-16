import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../widgets/app_navbar.dart';

class SellerInventoryScreen extends StatefulWidget {
  const SellerInventoryScreen({super.key});

  @override
  State<SellerInventoryScreen> createState() => _SellerInventoryScreenState();
}

class _SellerInventoryScreenState extends State<SellerInventoryScreen> {
  List<Map<String, dynamic>> _products = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    setState(() => _loading = true);
    try {
      final auth = context.read<AuthProvider>();
      final sellerId = auth.user?.id;
      final res = await ApiClient().get(
        '/products',
        queryParameters: {'shop': sellerId},
      );
      if (res.data is List) {
        setState(() {
          _products = (res.data as List)
              .map((e) => Map<String, dynamic>.from(e as Map))
              .toList();
        });
      }
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _updateStock(String productId, int newStock) async {
    try {
      await ApiClient().patch(
        '/products/$productId/stock',
        data: {'stock': newStock},
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Stock updated'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: AppTheme.darkSection,
          ),
        );
        await _loadProducts();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to update stock'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _showEditStockDialog(Map<String, dynamic> product) {
    final controller = TextEditingController(text: '${product['stock'] ?? 0}');
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(
          'Update Stock',
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              product['name']?.toString() ?? '',
              style: const TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              autofocus: true,
              decoration: const InputDecoration(labelText: 'QUANTITY'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'CANCEL',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                color: AppTheme.textMuted,
                fontSize: 12,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              final newStock = int.tryParse(controller.text);
              if (newStock != null && newStock >= 0) {
                Navigator.pop(context);
                _updateStock(product['id'].toString(), newStock);
              }
            },
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'UPDATE',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                letterSpacing: 1,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn || auth.user!.role != 'seller') {
      context.go('/');
      return const SizedBox.shrink();
    }

    final lowStock = _products
        .where((p) => (p['stock'] as int? ?? 0) <= 5)
        .toList();
    final inStock = _products
        .where((p) => (p['stock'] as int? ?? 0) > 5)
        .toList();

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: const LumBarongAppBar(title: 'Inventory Control', showBack: true),
      bottomNavigationBar: const AppBottomNav(currentIndex: 2),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            )
          : RefreshIndicator(
              color: AppTheme.primary,
              onRefresh: _loadProducts,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (lowStock.isNotEmpty) ...[
                      const _SectionLabel(text: 'CRITICAL STOCK ALERT'),
                      const SizedBox(height: 16),
                      ...lowStock.map(
                        (p) => _InventoryTile(
                          product: p,
                          isLowStock: true,
                          onEdit: _showEditStockDialog,
                        ),
                      ),
                      const SizedBox(height: 32),
                    ],
                    if (inStock.isNotEmpty) ...[
                      const _SectionLabel(text: 'ACTIVE INVENTORY'),
                      const SizedBox(height: 16),
                      ...inStock.map(
                        (p) => _InventoryTile(
                          product: p,
                          isLowStock: false,
                          onEdit: _showEditStockDialog,
                        ),
                      ),
                    ],
                    if (_products.isEmpty)
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.only(top: 80),
                          child: Column(
                            children: [
                              Icon(
                                Icons.inventory_2_outlined,
                                size: 64,
                                color: AppTheme.textMuted.withValues(
                                  alpha: 0.2,
                                ),
                              ),
                              const SizedBox(height: 20),
                              const Text(
                                'No products in inventory.',
                                style: TextStyle(
                                  color: AppTheme.textMuted,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(height: 32),
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

class _InventoryTile extends StatelessWidget {
  final Map<String, dynamic> product;
  final bool isLowStock;
  final void Function(Map<String, dynamic>) onEdit;

  const _InventoryTile({
    required this.product,
    required this.isLowStock,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    final stock = product['stock'] as int? ?? 0;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isLowStock
              ? AppTheme.primary.withValues(alpha: 0.3)
              : AppTheme.borderLight,
        ),
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
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product['name']?.toString().toUpperCase() ?? '',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                    letterSpacing: 0.5,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '₱${product['price']} • ${product['category'] ?? 'Heritage Craft'}',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: isLowStock
                  ? AppTheme.primary.withValues(alpha: 0.1)
                  : const Color(0xFF10B981).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (isLowStock)
                  const Padding(
                    padding: EdgeInsets.only(right: 6),
                    child: Icon(
                      Icons.warning_amber_rounded,
                      color: AppTheme.primary,
                      size: 14,
                    ),
                  ),
                Text(
                  '$stock UNITS',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 10,
                    color: isLowStock
                        ? AppTheme.primary
                        : const Color(0xFF10B981),
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: () => onEdit(product),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.background,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.edit_outlined,
                size: 18,
                color: AppTheme.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
