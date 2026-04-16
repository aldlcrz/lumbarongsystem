import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';

import '../../config/app_theme.dart';
import '../../models/product.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../services/api_client.dart';
import '../widgets/app_navbar.dart';
import 'package:google_fonts/google_fonts.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  ProductModel? product;
  bool loading = true;
  int quantity = 1;
  String? selectedColor;
  String? selectedSize;
  String? selectedDesign;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final res = await ApiClient().get('/products/${widget.productId}');
      if (res.data is Map) {
        setState(() {
          product = ProductModel.fromJson(
            Map<String, dynamic>.from(res.data as Map),
          );
          loading = false;
        });
      } else {
        setState(() => loading = false);
      }
    } catch (_) {
      setState(() => loading = false);
    }
  }



  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final cart = context.watch<CartProvider>();
    if (!auth.isLoggedIn) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/');
      });
      return const SizedBox.shrink();
    }

    if (loading || product == null) {
      return const Scaffold(
        backgroundColor: AppTheme.background,
        appBar: LumBarongAppBar(title: 'Classic Piece', showBack: true),
        body: Center(child: CircularProgressIndicator(color: AppTheme.primary)),
      );
    }

    final p = product!;
    final ratingValue = p.rating ?? 5.0;
    final ratingsCount = p.ratings?.length ?? 0;
    final soldCount = p.soldCount;
    final fmt = NumberFormat.currency(
      locale: 'en_PH',
      symbol: '₱',
      decimalDigits: 0,
    );

    return Scaffold(
      backgroundColor: const Color(0xFFF9F6F2),
      appBar: const LumBarongAppBar(title: 'Heritage Detail', showBack: true),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Premium Image Gallery ──
            Container(
              color: Colors.white,
              child: Column(
                children: [
                  AspectRatio(
                    aspectRatio: 1,
                    child: Container(
                      decoration: const BoxDecoration(color: Color(0xFFF7F3EE)),
                      child: CachedNetworkImage(
                        imageUrl: p.imageUrl,
                        fit: BoxFit.contain,
                        placeholder: (context, url) => const Center(
                          child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2),
                        ),
                        errorWidget: (context, url, error) => const Icon(Icons.broken_image_outlined),
                      ),
                    ),
                  ),
                  if (p.images.length > 1)
                    Container(
                      height: 80,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        itemCount: p.images.length,
                        separatorBuilder: (context, index) => const SizedBox(width: 10),
                        itemBuilder: (context, index) {
                          final img = p.images[index];
                          final isSelected = p.imageUrl == img.url;
                          return GestureDetector(
                            onTap: () {
                              setState(() => product = p.copyWith(imageUrl: img.url));
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              width: 56,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(
                                  color: isSelected ? AppTheme.primary : AppTheme.borderLight,
                                  width: isSelected ? 2 : 1,
                                ),
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(2),
                                child: CachedNetworkImage(
                                  imageUrl: img.url,
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                ],
              ),
            ),

            // ── Product Identity & Commerce ──
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    p.name,
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.charcoal,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Text(
                        ratingValue.toStringAsFixed(1),
                        style: const TextStyle(
                          color: AppTheme.primary,
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                      const SizedBox(width: 6),
                      ...List.generate(5, (i) {
                        final icon = i < ratingValue.round()
                            ? Icons.star
                            : Icons.star_border;
                        return Icon(icon, color: AppTheme.primary, size: 12);
                      }),
                      const SizedBox(width: 12),
                      _verticalDivider(),
                      const SizedBox(width: 12),
                      Text(
                        '$ratingsCount Ratings',
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 12),
                      _verticalDivider(),
                      const SizedBox(width: 12),
                      Text(
                        '$soldCount Sold',
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFAFAFA),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      fmt.format(p.price),
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 32,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // ── Selection Controls ──
            Container(
              color: Colors.white,
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  _buildControlRow(
                    'Variation',
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: p.availableColors.map((c) {
                        return _OptionChip(
                          label: c,
                          isSelected: selectedColor == c,
                          onTap: () => setState(() => selectedColor = c),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 24),
                  if (p.availableSizes != null && p.availableSizes!.isNotEmpty) ...[
                    _buildControlRow(
                      'Size',
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: p.availableSizes!.map((s) {
                          return _OptionChip(
                            label: s,
                            isSelected: selectedSize == s,
                            onTap: () => setState(() => selectedSize = s),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                  _buildControlRow(
                    'Quantity',
                    Row(
                      children: [
                        _qtySelector(),
                        const SizedBox(width: 16),
                        Text('${p.stock} units left', style: const TextStyle(fontSize: 12, color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  _buildControlRow(
                    'Shipping',
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.local_shipping_outlined, color: Color(0xFF00BFA5), size: 18),
                            const SizedBox(width: 8),
                            const Text('Guaranteed by 28 - 30 Mar', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.charcoal)),
                          ],
                        ),
                        const Padding(
                          padding: EdgeInsets.only(left: 26, top: 4),
                          child: Text('Shipping Fee: ₱0 (Promotional)', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // ── Artisan Card ──
            Container(
              color: Colors.white,
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Container(
                    width: 60, height: 60,
                    decoration: const BoxDecoration(color: Color(0xFFF9F6F2), shape: BoxShape.circle),
                    alignment: Alignment.center,
                    child: Text(
                      (p.artisan ?? 'L')[0].toUpperCase(),
                      style: GoogleFonts.playfairDisplay(color: AppTheme.primary, fontWeight: FontWeight.w900, fontSize: 24),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(p.artisan ?? 'Lumban Master Craft', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppTheme.charcoal)),
                        const Text('Active 5 mins ago', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            _actionBtn('Chat Now', Icons.chat_outlined, () {
                              final artisanName = p.artisan ?? 'Artisan';
                              context.push('/chat/${p.sellerId}/${Uri.encodeComponent(artisanName)}');
                            }),
                            const SizedBox(width: 8),
                            _actionBtn('View Shop', Icons.storefront_outlined, () {
                              final sellerId = p.sellerId;
                              if (sellerId.isEmpty) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Seller shop is unavailable for this item.')),
                                );
                                return;
                              }
                              context.push('/shop/$sellerId');
                            }),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // ── Details & Specs ──
            _infoSection('Product Specifications', [
              _specRow('Category', p.category ?? 'Traditional'),
              _specRow('Stock', '${p.stock} pieces'),
              _specRow('Ships From', 'Lumban, Laguna'),
            ]),
            const SizedBox(height: 12),
            _infoSection('Product Description', [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Text(
                  p.description ?? 'A masterpiece of Filipino heritage...',
                  style: const TextStyle(fontSize: 14, color: AppTheme.charcoal, height: 1.6),
                ),
              ),
            ]),
            const SizedBox(height: 100),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -4))],
        ),
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => _handleAddToCart(cart, p, false),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppTheme.primary, width: 1.5),
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                  backgroundColor: AppTheme.primary.withValues(alpha: 0.05),
                ).copyWith(foregroundColor: WidgetStateProperty.all(AppTheme.primary)),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.add_shopping_cart_rounded, size: 18),
                    SizedBox(width: 8),
                    Text('ADD TO CART', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1)),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: () => _handleAddToCart(cart, p, true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                  elevation: 0,
                ).copyWith(foregroundColor: WidgetStateProperty.all(Colors.white)),
                child: const Text('BUY NOW', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _verticalDivider() => Container(width: 1, height: 14, color: AppTheme.borderLight);

  Widget _buildControlRow(String label, Widget child) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(width: 80, child: Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textMuted, fontWeight: FontWeight.w600))),
        Expanded(child: child),
      ],
    );
  }

  Widget _qtySelector() {
    return Container(
      decoration: BoxDecoration(border: Border.all(color: AppTheme.borderLight), borderRadius: BorderRadius.circular(2)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _qtyClickable('-', () => setState(() => quantity = (quantity > 1) ? quantity - 1 : 1)),
          Container(
            width: 40, height: 32,
            alignment: Alignment.center,
            decoration: const BoxDecoration(border: Border.symmetric(vertical: BorderSide(color: AppTheme.borderLight))),
            child: Text('$quantity', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
          ),
          _qtyClickable('+', () => setState(() => quantity++)),
        ],
      ),
    );
  }

  Widget _qtyClickable(String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(width: 32, height: 32, alignment: Alignment.center, child: Text(label, style: const TextStyle(fontSize: 18, color: AppTheme.textMuted))),
    );
  }

  Widget _actionBtn(String label, IconData icon, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(4),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(border: Border.all(color: AppTheme.borderLight), borderRadius: BorderRadius.circular(4)),
          child: Row(
            children: [
              Icon(icon, size: 14, color: AppTheme.charcoal),
              const SizedBox(width: 6),
              Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.charcoal)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoSection(String title, List<Widget> children) {
    return Container(
      color: Colors.white,
      width: double.infinity,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            color: const Color(0xFFFAFAFA),
            child: Text(title.toUpperCase(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: AppTheme.charcoal, letterSpacing: 1)),
          ),
          ...children,
        ],
      ),
    );
  }

  Widget _specRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: Row(
        children: [
          SizedBox(width: 120, child: Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textMuted))),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13, color: AppTheme.charcoal, fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }

  void _handleAddToCart(CartProvider cart, ProductModel p, bool isBuyNow) {
    if (quantity > p.stock) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Limited availability in stock.')));
      return;
    }
    if (p.availableColors.isNotEmpty && selectedColor == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a variation.')));
      return;
    }
    if (p.availableSizes != null && p.availableSizes!.isNotEmpty && selectedSize == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a size.')));
      return;
    }

    cart.addToCart(p, quantity, color: selectedColor, size: selectedSize, design: selectedDesign);
    
    if (isBuyNow) {
      context.push('/checkout');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Added to Collection', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1)),
          backgroundColor: AppTheme.darkSection,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
}

class _OptionChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  const _OptionChip({required this.label, required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.white,
          border: Border.all(color: isSelected ? AppTheme.primary : AppTheme.borderLight, width: isSelected ? 1.5 : 1),
          borderRadius: BorderRadius.circular(2),
          boxShadow: isSelected ? [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.1), blurRadius: 4)] : null,
        ),
        child: Text(
          label,
          style: TextStyle(fontSize: 12, color: isSelected ? AppTheme.primary : AppTheme.charcoal, fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600),
        ),
      ),
    );
  }
}

