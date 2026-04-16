import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/app_theme.dart';
import '../../models/product.dart';
import '../../services/api_client.dart';
import '../widgets/app_navbar.dart';
import '../widgets/product_card.dart';

/// Seller shop page — mirrors the Next.js /shop?id=X page.
/// Shows the seller's profile card and their listed products.
class ShopScreen extends StatefulWidget {
  /// Seller user ID passed via route query parameter.
  final String? sellerId;
  const ShopScreen({super.key, this.sellerId});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  Map<String, dynamic>? seller;
  List<ProductModel> products = [];
  bool loading = true;
  Timer? _pollTimer;
  bool _refreshInProgress = false;
  _ShopFilter _activeFilter = _ShopFilter.all;

  String get _shopName {
    final name = seller?['shopName']?.toString();
    if (name != null && name.trim().isNotEmpty) return name;
    return 'Lumban Master Craft';
  }

  String get _shopLocation {
    final location = seller?['location']?.toString();
    if (location != null && location.trim().isNotEmpty) return location;
    return 'Lumban, Laguna';
  }

  String get _joinedText {
    final joined = seller?['joined']?.toString();
    if (joined != null && joined.trim().isNotEmpty) return joined;
    return '12 Months Ago';
  }

  String get _responseRate {
    final response = seller?['responseRate']?.toString();
    if (response != null && response.trim().isNotEmpty) return response;
    return '98%';
  }

  String get _ratingText {
    final rating = seller?['rating'];
    if (rating == null) return '5.0';
    return rating.toString();
  }

  List<ProductModel> get _visibleProducts {
    final list = List<ProductModel>.from(products);
    switch (_activeFilter) {
      case _ShopFilter.all:
        return list;
      case _ShopFilter.onSale:
        if (list.isEmpty) return list;
        final avgPrice =
            list.fold<double>(0, (sum, p) => sum + p.price) / list.length;
        final deals = list.where((p) => p.price <= avgPrice).toList();
        return deals.isEmpty ? list : deals;
      case _ShopFilter.highestRated:
        list.sort((a, b) => (b.rating ?? 0).compareTo(a.rating ?? 0));
        return list;
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
    _startRealtimePolling();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  void _startRealtimePolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 20), (_) {
      _load(showLoader: false);
    });
  }

  Future<void> _load({bool showLoader = true}) async {
    if (_refreshInProgress) return;
    _refreshInProgress = true;

    if (widget.sellerId == null) {
      if (mounted) setState(() => loading = false);
      _refreshInProgress = false;
      return;
    }

    if (showLoader && mounted) {
      setState(() => loading = true);
    }

    try {
      // Backend currently supports seller filtering via /products?seller=<id>
      // and does not expose /users/seller/:id in this codebase.
      final productsRes = await ApiClient().get(
        '/products',
        queryParameters: {'seller': widget.sellerId},
      );

      final productsData = productsRes.data;
      final loadedProducts =
          (productsData as List?)
              ?.map(
                (e) =>
                    ProductModel.fromJson(Map<String, dynamic>.from(e as Map)),
              )
              .toList() ??
          [];

      // Build seller display info from first product's seller object.
      Map<String, dynamic>? sellerData;
      if (loadedProducts.isNotEmpty && loadedProducts.first.seller != null) {
        final s = loadedProducts.first.seller!;
        sellerData = {
          'id': s.id,
          'shopName': (s.shopName != null && s.shopName!.trim().isNotEmpty)
              ? s.shopName
              : s.name,
          'location': 'Lumban, Laguna',
          'rating': '5.0',
          'joined': '12 Months Ago',
          'responseRate': '98%',
        };
      }

      if (mounted) {
        setState(() {
          seller = sellerData;
          products = loadedProducts;
          loading = false;
        });
      }
    } catch (e) {
      debugPrint('ShopScreen load error: $e');
      if (mounted) setState(() => loading = false);
    } finally {
      _refreshInProgress = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final visibleProducts = _visibleProducts;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: const LumBarongAppBar(showBack: true, title: 'Artisan Workshop'),
      bottomNavigationBar: const AppBottomNav(currentIndex: 0),
      body: loading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            )
          : widget.sellerId == null
          ? const Center(
              child: Text(
                'No shop selected.',
                style: TextStyle(color: AppTheme.textMuted),
              ),
            )
          : RefreshIndicator(
              color: AppTheme.primary,
              onRefresh: _load,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  // ── Shop Hero ──
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(14, 14, 14, 0),
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          gradient: const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [Color(0xFF1E1B1A), Color(0xFF2C2624)],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.12),
                              blurRadius: 14,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 58,
                                  height: 58,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Colors.white.withValues(alpha: 0.08),
                                    border: Border.all(
                                      color: Colors.white.withValues(
                                        alpha: 0.2,
                                      ),
                                      width: 2,
                                    ),
                                  ),
                                  child: Center(
                                    child: Text(
                                      _shopName[0].toUpperCase(),
                                      style: const TextStyle(
                                        fontSize: 28,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.white,
                                      ),
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
                                        _shopName,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 20,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Active 5 mins ago',
                                        style: TextStyle(
                                          color: Colors.white.withValues(
                                            alpha: 0.75,
                                          ),
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            Row(
                              children: [
                                Expanded(
                                  child: _heroButton(
                                    icon: Icons.chat_bubble_outline,
                                    label: 'CHAT',
                                    onTap: () {
                                      final encoded = Uri.encodeComponent(
                                        _shopName,
                                      );
                                      context.push(
                                        '/chat/${widget.sellerId}/$encoded',
                                      );
                                    },
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: _heroButton(
                                    icon: Icons.add,
                                    label: 'FOLLOW',
                                    onTap: () {
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        const SnackBar(
                                          content: Text(
                                            'Follow feature is coming soon.',
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // ── Shop Stats ──
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(14, 12, 14, 0),
                      child: GridView.count(
                        crossAxisCount: 2,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        childAspectRatio: 2.5,
                        children: [
                          _statTile(
                            Icons.inventory_2_outlined,
                            'Products',
                            '${products.length}',
                          ),
                          _statTile(
                            Icons.chat_outlined,
                            'Response',
                            _responseRate,
                          ),
                          _statTile(Icons.star_outline, 'Rating', _ratingText),
                          _statTile(
                            Icons.location_on_outlined,
                            'Location',
                            _shopLocation,
                          ),
                          _statTile(
                            Icons.access_time_rounded,
                            'Joined',
                            _joinedText,
                          ),
                          _statTile(
                            Icons.verified_outlined,
                            'Verified',
                            'Registry Gold',
                          ),
                        ],
                      ),
                    ),
                  ),

                  // ── Collection Header + Filters ──
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 22, 16, 10),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: const [
                              Text(
                                'Artisan ',
                                style: TextStyle(
                                  fontSize: 26,
                                  fontWeight: FontWeight.w900,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                              Text(
                                'Collection',
                                style: TextStyle(
                                  fontSize: 26,
                                  fontWeight: FontWeight.w700,
                                  fontStyle: FontStyle.italic,
                                  color: AppTheme.primary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                _filterChip('All Products', _ShopFilter.all),
                                const SizedBox(width: 8),
                                _filterChip('On Sale', _ShopFilter.onSale),
                                const SizedBox(width: 8),
                                _filterChip(
                                  'Highest Rated',
                                  _ShopFilter.highestRated,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // ── Product Grid ──
                  visibleProducts.isEmpty
                      ? SliverToBoxAdapter(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
                            child: ConstrainedBox(
                              constraints: BoxConstraints(
                                minHeight:
                                    MediaQuery.of(context).size.height * 0.24,
                              ),
                              child: const Center(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.inventory_2_outlined,
                                      size: 64,
                                      color: AppTheme.borderLight,
                                    ),
                                    SizedBox(height: 12),
                                    Text(
                                      'No products listed yet.',
                                      style: TextStyle(
                                        color: AppTheme.textMuted,
                                        fontStyle: FontStyle.italic,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        )
                      : SliverPadding(
                          padding: const EdgeInsets.fromLTRB(10, 6, 10, 24),
                          sliver: SliverLayoutBuilder(
                            builder: (context, constraints) {
                              final crossCount =
                                  constraints.crossAxisExtent > 680 ? 3 : 2;
                              return SliverGrid(
                                delegate: SliverChildBuilderDelegate(
                                  (_, i) => ProductCardWidget(
                                    product: visibleProducts[i],
                                  ),
                                  childCount: visibleProducts.length,
                                ),
                                gridDelegate:
                                    SliverGridDelegateWithFixedCrossAxisCount(
                                      crossAxisCount: crossCount,
                                      childAspectRatio: 0.60,
                                      crossAxisSpacing: 10,
                                      mainAxisSpacing: 10,
                                    ),
                              );
                            },
                          ),
                        ),
                ],
              ),
            ),
    );
  }

  Widget _heroButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.white.withValues(alpha: 0.28)),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 14, color: Colors.white),
              const SizedBox(width: 6),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _statTile(IconData icon, String label, String value) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderLight),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
      child: Row(
        children: [
          Icon(icon, size: 15, color: AppTheme.primary),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppTheme.textMuted,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.primary,
                    fontWeight: FontWeight.w800,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip(String label, _ShopFilter filter) {
    final active = _activeFilter == filter;
    return GestureDetector(
      onTap: () => setState(() => _activeFilter = filter),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: active
              ? AppTheme.primary.withValues(alpha: 0.1)
              : Colors.white,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: active ? AppTheme.primary : AppTheme.borderLight,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: active ? FontWeight.w800 : FontWeight.w600,
            color: active ? AppTheme.primary : AppTheme.textMuted,
          ),
        ),
      ),
    );
  }
}

enum _ShopFilter { all, onSale, highestRated }
