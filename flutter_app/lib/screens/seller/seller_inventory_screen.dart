import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
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
  List<Map<String, dynamic>> _allProducts = [];
  List<Map<String, dynamic>> _filtered = [];
  bool _loading = true;
  String _searchQuery = '';
  bool _showLowStockOnly = false;

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient().get('/products/seller');
      if (mounted && res.data is List) {
        _allProducts = (res.data as List)
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
        _applySearch();
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  void _applySearch() {
    final q = _searchQuery.toLowerCase();
    setState(() {
      _filtered = _allProducts.where((p) {
        final name = (p['name'] ?? '').toString().toLowerCase();
        final cat = (p['category'] ?? '').toString().toLowerCase();
        final stock = (p['stock'] as num?)?.toInt() ?? 0;
        final matchesText = name.contains(q) || cat.contains(q);
        final matchesStock = !_showLowStockOnly || stock <= 5;
        return matchesText && matchesStock;
      }).toList();
    });
  }

  int get _lowStockCount => _allProducts
      .where((p) => ((p['stock'] as num?)?.toInt() ?? 0) <= 5)
      .length;

  Future<void> _deleteProduct(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text(
          'Remove Masterpiece?',
          style: TextStyle(
            fontWeight: FontWeight.w900,
            color: AppTheme.charcoal,
          ),
        ),
        content: const Text(
          'Are you sure you want to remove this product from your artisan catalog?',
          style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text(
              'CANCEL',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                color: AppTheme.textMuted,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade600,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'REMOVE',
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ApiClient().delete('/products/$id');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Product removed from catalog'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Color(0xFF10B981),
          ),
        );
        _loadProducts();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to remove product'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Colors.red,
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
        title: const Text(
          'Update Stock',
          style: TextStyle(
            fontWeight: FontWeight.w900,
            color: AppTheme.charcoal,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              product['name']?.toString() ?? '',
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              autofocus: true,
              decoration: InputDecoration(
                labelText: 'QUANTITY',
                labelStyle: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5,
                  color: AppTheme.textMuted,
                ),
                filled: true,
                fillColor: const Color(0xFFF9F6F2),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
              ),
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
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () async {
              final newStock = int.tryParse(controller.text);
              if (newStock != null && newStock >= 0) {
                Navigator.pop(context);
                try {
                  await ApiClient().put(
                    '/products/${product['id']}',
                    data: {'stock': newStock},
                  );
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Stock updated'),
                        behavior: SnackBarBehavior.floating,
                        backgroundColor: Color(0xFF10B981),
                      ),
                    );
                    _loadProducts();
                  }
                } catch (e) {
                  if (mounted) {
                    String message = 'Failed to update stock';
                    try {
                      final dynamic err = e;
                      final data = err.response?.data;
                      if (data is Map && data['message'] != null) {
                        message = data['message'].toString();
                      }
                    } catch (_) {}

                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(message),
                        behavior: SnackBarBehavior.floating,
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'UPDATE',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 12,
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
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/');
      });
      return const SizedBox.shrink();
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF9F6F2),
      appBar: const LumBarongAppBar(title: 'Inventory', showBack: true),
      bottomNavigationBar: const AppBottomNav(currentIndex: 2),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/seller/add-product'),
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text(
          'NEW LISTING',
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 11,
            letterSpacing: 1,
          ),
        ),
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
            color: const Color(0xFFF9F6F2),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Artisan Catalog',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.charcoal,
                  ),
                ),
                Text(
                  'Inventory & Stock',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.primary,
                    fontStyle: FontStyle.italic,
                  ),
                ),
                const SizedBox(height: 20),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: TextField(
                    onChanged: (v) {
                      _searchQuery = v;
                      _applySearch();
                    },
                    decoration: const InputDecoration(
                      hintText: 'Filter your mastercrafts by name...',
                      hintStyle: TextStyle(
                        fontSize: 13,
                        color: AppTheme.textMuted,
                      ),
                      prefixIcon: Icon(
                        Icons.search,
                        color: AppTheme.textMuted,
                        size: 20,
                      ),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.borderLight),
                      ),
                      child: Text(
                        'Low Stock: $_lowStockCount',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: _lowStockCount > 0
                              ? Colors.orange.shade800
                              : AppTheme.textMuted,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    FilterChip(
                      label: const Text('Show low stock only'),
                      selected: _showLowStockOnly,
                      onSelected: (v) {
                        _showLowStockOnly = v;
                        _applySearch();
                      },
                      labelStyle: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: _showLowStockOnly
                            ? Colors.white
                            : AppTheme.textMuted,
                      ),
                      selectedColor: AppTheme.primary,
                      checkmarkColor: Colors.white,
                      backgroundColor: Colors.white,
                      side: const BorderSide(color: AppTheme.borderLight),
                    ),
                  ],
                ),
              ],
            ),
          ),

          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: AppTheme.primary),
                  )
                : _filtered.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.inventory_2_outlined,
                          size: 64,
                          color: AppTheme.textMuted.withValues(alpha: 0.2),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'No products found.',
                          style: TextStyle(
                            color: AppTheme.textMuted,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    color: AppTheme.primary,
                    onRefresh: _loadProducts,
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(24, 0, 24, 100),
                      itemCount: _filtered.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: 16),
                      itemBuilder: (ctx, i) => _InventoryCard(
                        product: _filtered[i],
                        onEditStock: () => _showEditStockDialog(_filtered[i]),
                        onDelete: () =>
                            _deleteProduct(_filtered[i]['id'].toString()),
                        onEdit: () => context.push(
                          '/seller/edit-product?id=${_filtered[i]['id']}',
                        ),
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _InventoryCard extends StatelessWidget {
  final Map<String, dynamic> product;
  final VoidCallback onEditStock;
  final VoidCallback onDelete;
  final VoidCallback onEdit;

  const _InventoryCard({
    required this.product,
    required this.onEditStock,
    required this.onDelete,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    final stock = (product['stock'] as num?)?.toInt() ?? 0;
    final rawImg = product['image'];
    String? thumbUrl;
    if (rawImg is List && rawImg.isNotEmpty) {
      thumbUrl = rawImg.first is String
          ? rawImg.first
          : (rawImg.first is Map ? rawImg.first['url']?.toString() : null);
    } else if (rawImg is String && rawImg.isNotEmpty) {
      thumbUrl = rawImg;
    }

    final String stockLabel;
    final Color stockColor;
    if (stock == 0) {
      stockLabel = 'Out of Stock';
      stockColor = Colors.red;
    } else if (stock <= 5) {
      stockLabel = 'Low Stock';
      stockColor = Colors.orange;
    } else {
      stockLabel = 'Active';
      stockColor = const Color(0xFF10B981);
    }

    final double stockPercent = (stock / 20.0).clamp(0.0, 1.0);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: stock <= 5
              ? AppTheme.primary.withValues(alpha: 0.4)
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
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: const Color(0xFFF9F6F2),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.borderLight),
            ),
            clipBehavior: Clip.antiAlias,
            child: thumbUrl != null
                ? CachedNetworkImage(
                    imageUrl: thumbUrl,
                    fit: BoxFit.cover,
                    errorWidget: (context, url, error) => const Icon(
                      Icons.inventory_2,
                      color: AppTheme.borderLight,
                    ),
                  )
                : const Icon(Icons.inventory_2, color: AppTheme.borderLight),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        product['name']?.toString() ?? '',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          color: AppTheme.charcoal,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: stockColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: stockColor.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Text(
                        stockLabel,
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          color: stockColor,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '₱${product['price']} • ${product['category'] ?? 'Heritage Craft'}',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.textMuted,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '$stock units left',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: stockColor,
                            ),
                          ),
                          const SizedBox(height: 4),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: stockPercent,
                              minHeight: 6,
                              backgroundColor: AppTheme.borderLight,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                stockColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    IconButton(
                      onPressed: onEdit,
                      visualDensity: VisualDensity.compact,
                      icon: const Icon(Icons.edit_outlined, size: 18),
                      style: IconButton.styleFrom(
                        backgroundColor: AppTheme.background,
                        foregroundColor: AppTheme.charcoal,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    IconButton(
                      onPressed: onEditStock,
                      visualDensity: VisualDensity.compact,
                      icon: const Icon(Icons.edit_note, size: 18),
                      style: IconButton.styleFrom(
                        backgroundColor: AppTheme.primary.withValues(
                          alpha: 0.1,
                        ),
                        foregroundColor: AppTheme.primary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    IconButton(
                      onPressed: onDelete,
                      visualDensity: VisualDensity.compact,
                      icon: Icon(
                        Icons.delete_outline,
                        size: 18,
                        color: Colors.red.shade400,
                      ),
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.red.shade50,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
