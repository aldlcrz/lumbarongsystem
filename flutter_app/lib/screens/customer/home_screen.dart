import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/product.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../widgets/app_navbar.dart';
import '../widgets/product_card.dart';
import '../../config/api_config.dart';
import 'package:google_fonts/google_fonts.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<ProductModel> products = [];
  List<String> _dbCategories = [];
  bool loading = true;
  String? error;
  String activeCategory = 'ALL';
  String searchQuery = '';
  String sortBy = 'latest';
  final _searchController = TextEditingController();

  List<String> _categoryOptions() {
    final seen = <String>{};
    final options = <String>['ALL'];

    final Object? rawDbCategories = _dbCategories;
    final Iterable<String> dbCategories = rawDbCategories is Iterable
        ? rawDbCategories.whereType<String>()
        : const <String>[];

    for (final category in dbCategories) {
      final normalized = category.trim();
      if (normalized.isEmpty) continue;
      if (seen.add(normalized.toLowerCase())) {
        options.add(normalized);
      }
    }

    for (final product in products) {
      final category = _primaryCategory(product);
      if (category.isEmpty) continue;

      final key = category.toLowerCase();
      if (seen.add(key)) {
        options.add(category);
      }
    }

    return options;
  }

  String _primaryCategory(ProductModel product) {
    final category = product.category?.trim() ?? '';
    if (category.isNotEmpty) {
      return category;
    }

    if (product.categories.isNotEmpty) {
      return product.categories.first.trim();
    }

    return '';
  }

  bool _matchesCategory(ProductModel product, String selectedCategory) {
    if (selectedCategory == 'ALL') return true;

    final target = selectedCategory.toLowerCase();
    final primary = _primaryCategory(product).toLowerCase();
    if (primary == target) return true;

    return product.categories.any(
      (category) => category.trim().toLowerCase() == target,
    );
  }

  List<ProductModel> _visibleProducts() {
    final query = searchQuery.trim().toLowerCase();
    final filtered = products.where((product) {
      final matchesCategory = _matchesCategory(product, activeCategory);
      final matchesSearch =
          query.isEmpty ||
          product.name.toLowerCase().contains(query) ||
          (product.artisan?.toLowerCase().contains(query) ?? false) ||
          (product.description?.toLowerCase().contains(query) ?? false);
      return matchesCategory && matchesSearch;
    }).toList();

    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price.compareTo(b.price));
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price.compareTo(a.price));
        break;
      case 'popular':
        filtered.sort((a, b) => b.soldCount.compareTo(a.soldCount));
        break;
      case 'latest':
      default:
        break;
    }

    return filtered;
  }

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
      if (res.data is! List) return;

      final names =
          (res.data as List)
              .map((e) {
                if (e is Map && e['name'] != null) {
                  return e['name'].toString().trim();
                }
                return '';
              })
              .where((name) => name.isNotEmpty)
              .toSet()
              .toList()
            ..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));

      if (!mounted) return;
      setState(() {
        _dbCategories = List<String>.from(names);
        if (activeCategory != 'ALL' &&
            !_categoryOptions().contains(activeCategory)) {
          activeCategory = 'ALL';
        }
      });
    } catch (_) {
      // Keep product-derived categories as fallback.
    }
  }

  Future<void> _loadProducts() async {
    setState(() => loading = true);
    try {
      final res = await ApiClient().get('/products');
      if (res.data is List) {
        final list = res.data as List;
        final List<ProductModel> loaded = [];
        for (var e in list) {
          try {
            if (e != null) {
              loaded.add(
                ProductModel.fromJson(Map<String, dynamic>.from(e as Map)),
              );
            }
          } catch (err) {
            debugPrint('Error parsing single product: $err');
          }
        }
        setState(() {
          products = loaded;
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
        error = e.toString().contains('is not a subtype of')
            ? 'Data parsing error: $e\n\nPlease check if backend matches model.'
            : 'Connection failed. Please check your API IP in api_config.dart.\n\nCurrent Target: $kApiBaseUrl';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final visibleProducts = _visibleProducts();
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

              // Welcome heading — matches web
              Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Column(
                    children: [
                      Text(
                        'Welcome to',
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 32,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.charcoal,
                          letterSpacing: -0.5,
                        ),
                      ),
                      Text(
                        'Lumbarong',
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 32,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.primary,
                          fontStyle: FontStyle.italic,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              // Category Pills — dark style matching web
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _categoryOptions().map((catName) {
                    final isActive = activeCategory == catName;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: GestureDetector(
                        onTap: () {
                          setState(() => activeCategory = catName);
                          _loadProducts();
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: isActive
                                ? const Color(0xFF1A1A1A)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(32),
                            border: Border.all(
                              color: isActive
                                  ? const Color(0xFF1A1A1A)
                                  : AppTheme.borderLight,
                            ),
                            boxShadow: isActive
                                ? [
                                    BoxShadow(
                                      color: Colors.black.withValues(
                                        alpha: 0.15,
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
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.5,
                              color: isActive
                                  ? Colors.white
                                  : const Color(0xFF2A2A2A),
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
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
                        activeCategory == 'ALL'
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
              else if (visibleProducts.isEmpty)
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
                          setState(() => activeCategory = 'ALL');
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
                        ? 5
                        : (constraints.maxWidth > 600 ? 3 : 2);
                    return GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: crossCount,
                        childAspectRatio: 0.60,
                        crossAxisSpacing: 8,
                        mainAxisSpacing: 8,
                      ),
                      itemCount: visibleProducts.length,
                      itemBuilder: (_, i) =>
                          ProductCardWidget(product: visibleProducts[i]),
                    );
                  },
                ),
              const SizedBox(height: 40),
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
