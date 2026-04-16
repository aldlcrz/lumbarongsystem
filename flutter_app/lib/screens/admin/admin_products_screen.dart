import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../widgets/app_navbar.dart';

class AdminProductsScreen extends StatefulWidget {
  const AdminProductsScreen({super.key});

  @override
  State<AdminProductsScreen> createState() => _AdminProductsScreenState();
}

class _AdminProductsScreenState extends State<AdminProductsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Data
  List<Map<String, dynamic>> _allProducts = [];
  List<Map<String, dynamic>> _filteredProducts = [];
  List<Map<String, dynamic>> _categories = [];

  // State
  bool _loading = true;
  String _searchQuery = '';
  Timer? _liveTimer;

  // New Category Form
  final _catNameController = TextEditingController();
  final _catDescController = TextEditingController();
  bool _isAddingCategory = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
    _liveTimer = Timer.periodic(const Duration(seconds: 20), (_) {
      _loadData(silent: true);
    });
  }

  @override
  void dispose() {
    _liveTimer?.cancel();
    _tabController.dispose();
    _catNameController.dispose();
    _catDescController.dispose();
    super.dispose();
  }

  Future<void> _loadData({bool silent = false}) async {
    if (!silent) {
      setState(() => _loading = true);
    }
    try {
      final pRes = await ApiClient().get('/products');
      if (mounted && pRes.data is List) {
        _allProducts = (pRes.data as List)
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
      }

      final cRes = await ApiClient().get('/categories');
      if (mounted && cRes.data is List) {
        _categories = (cRes.data as List)
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
      }

      _applySearch();
    } catch (_) {}
    if (mounted && !silent) setState(() => _loading = false);
  }

  void _applySearch() {
    setState(() {
      final q = _searchQuery.toLowerCase();
      _filteredProducts = _allProducts.where((p) {
        final name = (p['name'] ?? '').toString().toLowerCase();
        final cat = (p['category'] ?? '').toString().toLowerCase();
        final seller = (p['seller']?['name'] ?? '').toString().toLowerCase();
        return name.contains(q) || cat.contains(q) || seller.contains(q);
      }).toList();
    });
  }

  Future<void> _deleteProduct(String id) async {
    final confirmed = await _showConfirmDialog(
      'Delete Product',
      'Are you sure you want to permanently remove this product from the global marketplace?',
    );
    if (confirmed != true) return;

    try {
      await ApiClient().delete('/products/$id');
      if (mounted) {
        _showSuccess('Product removed from catalog');
        _loadData();
      }
    } catch (_) {
      _showError('Failed to delete product');
    }
  }

  Future<void> _addCategory() async {
    final name = _catNameController.text.trim();
    if (name.isEmpty) return;

    setState(() => _isAddingCategory = true);
    try {
      await ApiClient().post(
        '/categories',
        data: {'name': name, 'description': _catDescController.text.trim()},
      );
      if (mounted) {
        _catNameController.clear();
        _catDescController.clear();
        _showSuccess('Segment "$name" added to registry');
        _loadData();
      }
    } catch (_) {
      _showError('Failed to add category');
    }
    if (mounted) setState(() => _isAddingCategory = false);
  }

  Future<void> _deleteCategory(String id, String name) async {
    final confirmed = await _showConfirmDialog(
      'Delete Category',
      'Are you sure you want to delete "$name"? This is only allowed if no products are assigned to it.',
    );
    if (confirmed != true) return;

    try {
      await ApiClient().delete('/categories/$id');
      if (mounted) {
        _showSuccess('Category deleted');
        _loadData();
      }
    } catch (_) {
      _showError('Operation failed. Category might be in use.');
    }
  }

  // --- Helpers ---

  Future<bool?> _showConfirmDialog(String title, String content) {
    return showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.w900,
            color: AppTheme.charcoal,
          ),
        ),
        content: Text(
          content,
          style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
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
              'DELETE',
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  void _showSuccess(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        behavior: SnackBarBehavior.floating,
        backgroundColor: const Color(0xFF10B981),
      ),
    );
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        behavior: SnackBarBehavior.floating,
        backgroundColor: Colors.red,
      ),
    );
  }

  // --- Build ---

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
      appBar: const LumBarongAppBar(title: 'Global Catalog', showBack: true),
      bottomNavigationBar: const AppBottomNav(currentIndex: 4),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
            color: const Color(0xFFF9F6F2),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Central Catalog',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.charcoal,
                  ),
                ),
                Text(
                  'Overseeing all heritage collections and segments.',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.textMuted.withValues(alpha: 0.6),
                    letterSpacing: 1.5,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 24),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: TabBar(
                    controller: _tabController,
                    labelColor: AppTheme.primary,
                    unselectedLabelColor: AppTheme.textMuted,
                    indicator: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      color: AppTheme.primary.withValues(alpha: 0.1),
                    ),
                    indicatorSize: TabBarIndicatorSize.tab,
                    dividerColor: Colors.transparent,
                    labelStyle: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1,
                    ),
                    unselectedLabelStyle: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                    tabs: const [
                      Tab(
                        text: 'PRODUCTS',
                        icon: Icon(Icons.inventory_2_outlined, size: 16),
                      ),
                      Tab(
                        text: 'CATEGORIES',
                        icon: Icon(Icons.grid_view_outlined, size: 16),
                      ),
                    ],
                  ),
                ),
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
                    children: [_buildProductsTab(), _buildCategoriesTab()],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductsTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
          child: Container(
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
                hintText: 'Filter by name, category, or artisan...',
                hintStyle: TextStyle(fontSize: 13, color: AppTheme.textMuted),
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
        ),
        Expanded(
          child: _filteredProducts.isEmpty
              ? _buildEmptyState(
                  'No products found',
                  'Try adjusting your search filters.',
                )
              : RefreshIndicator(
                  color: AppTheme.primary,
                  onRefresh: _loadData,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 8,
                    ),
                    itemCount: _filteredProducts.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 16),
                    itemBuilder: (ctx, i) {
                      final p = _filteredProducts[i];
                      final seller = p['seller'] as Map? ?? {};
                      // image can be a List<dynamic> where elements might be Strings or Maps.
                      // We safely pick the first string-compatible item.
                      final rawImages = p['image'];
                      String? thumbnailUrl;
                      if (rawImages is List && rawImages.isNotEmpty) {
                        final first = rawImages.first;
                        if (first is String) {
                          thumbnailUrl = first;
                        } else if (first is Map) {
                          thumbnailUrl =
                              first['url']?.toString() ??
                              first['path']?.toString();
                        }
                      } else if (rawImages is String && rawImages.isNotEmpty) {
                        thumbnailUrl = rawImages;
                      }

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
                            Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF9F6F2),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppTheme.borderLight),
                              ),
                              clipBehavior: Clip.antiAlias,
                              child: thumbnailUrl != null
                                  ? CachedNetworkImage(
                                      imageUrl: thumbnailUrl,
                                      fit: BoxFit.cover,
                                      errorWidget: (context, url, error) =>
                                          const Icon(
                                            Icons.inventory_2,
                                            color: AppTheme.borderLight,
                                          ),
                                    )
                                  : const Icon(
                                      Icons.inventory_2,
                                      color: AppTheme.borderLight,
                                    ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    p['name']?.toString() ?? '',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 14,
                                      color: AppTheme.charcoal,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  Text(
                                    'Category: ${p['category']}',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      color: AppTheme.textMuted,
                                      fontStyle: FontStyle.italic,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.storefront,
                                        size: 10,
                                        color: AppTheme.primary,
                                      ),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          (seller['shopName'] ??
                                                  seller['name'] ??
                                                  'Unknown Artisan')
                                              .toString(),
                                          style: const TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w700,
                                            color: AppTheme.charcoal,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                IconButton(
                                  onPressed: () =>
                                      _deleteProduct(p['id'].toString()),
                                  icon: Icon(
                                    Icons.delete_outline,
                                    color: Colors.red.shade400,
                                    size: 20,
                                  ),
                                  style: IconButton.styleFrom(
                                    backgroundColor: Colors.red.shade50,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildCategoriesTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Registration Form
          Container(
            padding: const EdgeInsets.all(24),
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'REGISTER NEW CATEGORY',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.charcoal,
                  ),
                ),
                const SizedBox(height: 16),
                _buildLabel('Category Name'),
                TextField(
                  controller: _catNameController,
                  decoration: InputDecoration(
                    hintText: 'e.g. Pina Barong',
                    hintStyle: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.textMuted,
                    ),
                    filled: true,
                    fillColor: const Color(0xFFF9F6F2).withValues(alpha: 0.5),
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
                const SizedBox(height: 16),
                _buildLabel('Segment Description'),
                TextField(
                  controller: _catDescController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: 'Brief description of this heritage segment...',
                    hintStyle: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.textMuted,
                    ),
                    filled: true,
                    fillColor: const Color(0xFFF9F6F2).withValues(alpha: 0.5),
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
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isAddingCategory ? null : _addCategory,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isAddingCategory
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text(
                            'ADD TO REGISTRY',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 2,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),

          const Text(
            'ACTIVE SEGMENTS',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.5,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 12),

          if (_categories.isEmpty)
            _buildEmptyState(
              'No segments registered',
              'Add a category above to get started.',
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _categories.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (ctx, i) {
                final c = _categories[i];
                return Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              c['name']?.toString().toUpperCase() ?? '',
                              style: const TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 13,
                                color: AppTheme.charcoal,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              c['description']?.toString() ??
                                  'No description provided.',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppTheme.textMuted,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () => _deleteCategory(
                          c['id'].toString(),
                          c['name'].toString(),
                        ),
                        icon: Icon(
                          Icons.delete_outline,
                          color: Colors.red.shade400,
                          size: 20,
                        ),
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.transparent,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w900,
          letterSpacing: 1.5,
          color: AppTheme.textMuted,
        ),
      ),
    );
  }

  Widget _buildEmptyState(String title, String subtitle) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Column(
          children: [
            Icon(
              Icons.inbox_outlined,
              size: 48,
              color: AppTheme.textMuted.withValues(alpha: 0.2),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppTheme.charcoal,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
            ),
          ],
        ),
      ),
    );
  }
}
