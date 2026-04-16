import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../models/product.dart';
import '../providers/auth_provider.dart';
import '../services/api_client.dart';
import 'widgets/app_navbar.dart';
import 'widgets/app_footer.dart';
import 'widgets/product_card.dart';
import '../config/api_config.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<ProductModel> products = [];
  bool loading = true;
  String? error;
  String activeCategory = 'All';
  String searchQuery = '';
  String sortBy = 'latest';
  final _searchController = TextEditingController();

  List<Map<String, dynamic>> categories = [
    {'id': 'All', 'name': 'All'},
  ];

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _loadProducts();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    try {
      final res = await ApiClient().get('/categories');
      if (res.data is List) {
        setState(() {
          categories = [
            {'id': 'All', 'name': 'All'},
            ...List<Map<String, dynamic>>.from(res.data as List),
          ];
        });
      }
    } catch (e) {
      debugPrint('Error loading categories: $e');
    }
  }

  Future<void> _loadProducts() async {
    setState(() => loading = true);
    try {
      final params = <String, dynamic>{};
      if (activeCategory != 'All') {
        final cat = categories.firstWhere(
          (c) => c['name'] == activeCategory,
          orElse: () => {'id': 'All'},
        );
        if (cat['id'] != 'All') params['categoryId'] = cat['id'];
      }
      if (searchQuery.isNotEmpty) params['search'] = searchQuery;
      params['sort'] = sortBy;

      final res = await ApiClient().get('/products', queryParameters: params);
      if (res.data is List) {
        setState(() {
          products = (res.data as List)
              .map(
                (e) =>
                    ProductModel.fromJson(Map<String, dynamic>.from(e as Map)),
              )
              .toList();
          loading = false;
          error = null;
        });
      } else {
        setState(() {
          loading = false;
          error = 'Unexpected data format from server.';
        });
      }
    } catch (e) {
      debugPrint('Error loading products: $e');
      setState(() {
        loading = false;
        error =
            'Connection failed. Please check your API IP in api_config.dart.\n\nCurrent Target: $kApiBaseUrl';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/');
      });
      return const SizedBox.shrink();
    }
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: const LumBarongAppBar(),
      bottomNavigationBar: const AppBottomNav(currentIndex: 0),
      body: RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: _loadProducts,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Premium Minimalist Search Bar
              Container(
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppTheme.borderLight.withValues(alpha: 0.5),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: TextField(
                  controller: _searchController,
                  onSubmitted: (v) {
                    setState(() => searchQuery = v);
                    _loadProducts();
                  },
                  decoration: InputDecoration(
                    hintText: 'Search Artisan Pieces...',
                    hintStyle: const TextStyle(
                      fontSize: 14,
                      color: AppTheme.textMuted,
                      fontWeight: FontWeight.w500,
                    ),
                    prefixIcon: const Icon(
                      Icons.search_rounded,
                      color: AppTheme.textMuted,
                      size: 20,
                    ),
                    suffixIcon: searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.close_rounded, size: 16),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => searchQuery = '');
                              _loadProducts();
                            },
                          )
                        : null,
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                ),
              ),

              // Heritage Hero Banner
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.02),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppTheme.primary.withValues(alpha: 0.05),
                  ),
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        'HERITAGE COLLECTION',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2,
                          color: AppTheme.primary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Artisan Masterpieces',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.textPrimary,
                        fontStyle: FontStyle.italic,
                        height: 1.1,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Discover handcrafted elegance from the heart of Lumban.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppTheme.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 24),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: categories.map((cat) {
                          final catName = cat['name'] as String;
                          final isActive = activeCategory == catName;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: GestureDetector(
                              onTap: () {
                                setState(() => activeCategory = catName);
                                _loadProducts();
                              },
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 250),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: isActive
                                      ? AppTheme.primary
                                      : Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isActive
                                        ? AppTheme.primary
                                        : AppTheme.borderLight,
                                  ),
                                  boxShadow: isActive
                                      ? [
                                          BoxShadow(
                                            color: AppTheme.primary.withValues(
                                              alpha: 0.2,
                                            ),
                                            blurRadius: 8,
                                            offset: const Offset(0, 4),
                                          ),
                                        ]
                                      : null,
                                ),
                                child: Text(
                                  catName.toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 8,
                                    fontWeight: FontWeight.w800,
                                    color: isActive
                                        ? Colors.white
                                        : AppTheme.textPrimary,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),
              // Section header & Sort
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'ARTISAN COLLECTION',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 2,
                          color: AppTheme.primary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        activeCategory == 'All'
                            ? 'Curated For You'
                            : activeCategory,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  PopupMenuButton<String>(
                    onSelected: (val) {
                      setState(() => sortBy = val);
                      _loadProducts();
                    },
                    icon: const Icon(
                      Icons.tune_rounded,
                      color: AppTheme.textPrimary,
                      size: 20,
                    ),
                    itemBuilder: (context) => [
                      _buildSortItem('latest', 'Latest'),
                      _buildSortItem('popular', 'Popular'),
                      _buildSortItem('price-low', 'Price: Low-High'),
                      _buildSortItem('price-high', 'Price: High-Low'),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),
              if (loading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(48),
                    child: CircularProgressIndicator(color: AppTheme.primary),
                  ),
                )
              else if (error != null)
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.wifi_off_rounded,
                        size: 64,
                        color: AppTheme.primary,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        error!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textMuted,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: _loadProducts,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text('Retry Connection'),
                      ),
                    ],
                  ),
                )
              else if (products.isEmpty)
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.shopping_bag_outlined,
                        size: 64,
                        color: Colors.grey.shade200,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'No pieces found.',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textMuted,
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextButton(
                        onPressed: () {
                          setState(() => activeCategory = 'All');
                          _loadProducts();
                        },
                        child: const Text(
                          'Clear Filters',
                          style: TextStyle(
                            color: AppTheme.primary,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              else
                LayoutBuilder(
                  builder: (context, constraints) {
                    final crossCount = constraints.maxWidth > 900
                        ? 4
                        : (constraints.maxWidth > 600 ? 3 : 2);
                    return GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: crossCount,
                        childAspectRatio: 0.68,
                        crossAxisSpacing: 14,
                        mainAxisSpacing: 14,
                      ),
                      itemCount: products.length,
                      itemBuilder: (_, i) =>
                          ProductCardWidget(product: products[i]),
                    );
                  },
                ),
              const SizedBox(height: 40),
              const AppFooter(),
            ],
          ),
        ),
      ),
    );
  }

  PopupMenuItem<String> _buildSortItem(String value, String label) {
    final bool isActive = sortBy == value;
    return PopupMenuItem<String>(
      value: value,
      child: Text(
        label.toUpperCase(),
        style: TextStyle(
          fontSize: 10,
          fontWeight: isActive ? FontWeight.w900 : FontWeight.w600,
          color: isActive ? AppTheme.primary : AppTheme.textPrimary,
          letterSpacing: 1,
        ),
      ),
    );
  }
}
