import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../widgets/app_navbar.dart';

class SellerProductsScreen extends StatefulWidget {
  const SellerProductsScreen({super.key});

  @override
  State<SellerProductsScreen> createState() => _SellerProductsScreenState();
}

class _SellerProductsScreenState extends State<SellerProductsScreen> {
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

  Future<void> _deleteProduct(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text(
          'Remove Product',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
        content: const Text(
          'Are you sure you want to remove this piece from your shop catalog?',
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
              backgroundColor: AppTheme.primary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'DELETE',
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
            content: Text('Product removed from shop'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: AppTheme.darkSection,
          ),
        );
        await _loadProducts();
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn || auth.user!.role != 'seller') {
      context.go('/');
      return const SizedBox.shrink();
    }
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: const LumBarongAppBar(title: 'Shop Catalog', showBack: true),
      bottomNavigationBar: const AppBottomNav(currentIndex: 2),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/seller/add-product'),
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        elevation: 4,
        child: const Icon(Icons.add_rounded),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            )
          : _products.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.inventory_2_outlined,
                      size: 64,
                      color: AppTheme.textMuted.withValues(alpha: 0.2),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'No products yet.',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPrimary,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Add your first artisan piece to showcase it in the marketplace.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => context.push('/seller/add-product'),
                      child: const Text('ADD MY FIRST PIECE'),
                    ),
                  ],
                ),
              ),
            )
          : RefreshIndicator(
              color: AppTheme.primary,
              onRefresh: _loadProducts,
              child: ListView.separated(
                padding: const EdgeInsets.all(20),
                itemCount: _products.length,
                separatorBuilder: (_, _) => const SizedBox(height: 16),
                itemBuilder: (ctx, i) {
                  final p = _products[i];
                  final images = p['images'] as List? ?? [];
                  final imageUrl = images.isNotEmpty
                      ? (images.first as Map)['url']?.toString() ?? ''
                      : '';
                  return Container(
                    padding: const EdgeInsets.all(16),
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
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: imageUrl.isNotEmpty
                              ? CachedNetworkImage(
                                  imageUrl: imageUrl,
                                  width: 72,
                                  height: 72,
                                  fit: BoxFit.cover,
                                  placeholder: (context, url) =>
                                      Container(color: AppTheme.background),
                                  errorWidget: (context, url, _) => Container(
                                    width: 72,
                                    height: 72,
                                    color: AppTheme.background,
                                    child: const Icon(
                                      Icons.image_not_supported_outlined,
                                      color: AppTheme.textMuted,
                                      size: 28,
                                    ),
                                  ),
                                )
                              : Container(
                                  width: 72,
                                  height: 72,
                                  color: AppTheme.background,
                                  child: const Icon(
                                    Icons.image_outlined,
                                    color: AppTheme.textMuted,
                                    size: 28,
                                  ),
                                ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                p['name']?.toString().toUpperCase() ?? '',
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
                                '₱${p['price']}',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                  color: AppTheme.primary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${p['stock']} units available',
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () => _deleteProduct(p['id'].toString()),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(
                              Icons.delete_outline_rounded,
                              color: AppTheme.primary,
                              size: 20,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
    );
  }
}
