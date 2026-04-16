import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/app_theme.dart';
import '../models/product.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../services/api_client.dart';
import 'widgets/app_navbar.dart';

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

  Future<void> _launchUrl(String url) async {
    final Uri uri = Uri.parse(url.startsWith('http') ? url : 'https://$url');
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Could not launch $url')));
      }
    }
  }

  Future<void> _makePhoneCall(String phoneNumber) async {
    final Uri launchUri = Uri(scheme: 'tel', path: phoneNumber);
    if (!await launchUrl(launchUri)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not initiate call')),
        );
      }
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
    final fmt = NumberFormat.currency(
      locale: 'en_PH',
      symbol: '₱',
      decimalDigits: 0,
    );

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: const LumBarongAppBar(title: 'Heritage Detail', showBack: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(32),
                  child: AspectRatio(
                    aspectRatio: 1,
                    child: CachedNetworkImage(
                      imageUrl: p.imageUrl,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        color: AppTheme.primary.withValues(alpha: 0.05),
                      ),
                      errorWidget: (context, url, error) => Container(
                        color: AppTheme.primary.withValues(alpha: 0.05),
                        child: const Icon(
                          Icons.broken_image_outlined,
                          size: 48,
                          color: AppTheme.primary,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            Row(
              children: [
                if (p.category != null)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      p.category!.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                        color: AppTheme.primary,
                      ),
                    ),
                  ),
                const Spacer(),
                if (p.stock < 5)
                  Text(
                    'ONLY ${p.stock} LEFT',
                    style: const TextStyle(
                      color: AppTheme.primary,
                      fontWeight: FontWeight.w900,
                      fontSize: 10,
                      letterSpacing: 1,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              p.name.toUpperCase(),
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w900,
                color: AppTheme.textPrimary,
                letterSpacing: 0.5,
                height: 1.1,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              fmt.format(p.price),
              style: const TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w900,
                color: AppTheme.primary,
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(height: 32),
            
            // Selection Options
            if (p.availableColors.isNotEmpty) ...[
              const Text(
                'COLOR SELECTION',
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                  color: AppTheme.textMuted,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: p.availableColors.map((c) {
                  final bool isSelected = selectedColor == c;
                  return GestureDetector(
                    onTap: () => setState(() => selectedColor = c),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: isSelected ? AppTheme.primary : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected ? AppTheme.primary : AppTheme.borderLight,
                        ),
                      ),
                      child: Text(
                        c.toUpperCase(),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          color: isSelected ? Colors.white : AppTheme.textPrimary,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),
            ],

            if (p.availableSizes != null && p.availableSizes!.isNotEmpty) ...[
              const Text(
                'SIZE GUIDE',
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                  color: AppTheme.textMuted,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: p.availableSizes!.map((s) {
                  final bool isSelected = selectedSize == s;
                  return GestureDetector(
                    onTap: () => setState(() => selectedSize = s),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: isSelected ? AppTheme.primary : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected ? AppTheme.primary : AppTheme.borderLight,
                        ),
                      ),
                      child: Text(
                        s.toUpperCase(),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          color: isSelected ? Colors.white : AppTheme.textPrimary,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),
            ],

            if (p.availableDesigns.isNotEmpty) ...[
              const Text(
                'ARTISAN DESIGN',
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                  color: AppTheme.textMuted,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: p.availableDesigns.map((d) {
                  final bool isSelected = selectedDesign == d;
                  return GestureDetector(
                    onTap: () => setState(() => selectedDesign = d),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: isSelected ? AppTheme.primary : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected ? AppTheme.primary : AppTheme.borderLight,
                        ),
                      ),
                      child: Text(
                        d.toUpperCase(),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          color: isSelected ? Colors.white : AppTheme.textPrimary,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),
            ],

            if (p.description != null && p.description!.isNotEmpty) ...[
              const Text(
                'THE CRAFTSMANSHIP',
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                  color: AppTheme.textMuted,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                p.description!,
                style: const TextStyle(
                  fontSize: 15,
                  color: AppTheme.textSecondary,
                  height: 1.8,
                ),
              ),
            ],
            const SizedBox(height: 40),
            if (p.seller != null) ...[
              const Text(
                'ARTISAN PROFILE',
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2,
                  color: AppTheme.textMuted,
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: AppTheme.borderLight.withValues(alpha: 0.5),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 15,
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                      backgroundImage: p.seller?.profileImage != null
                          ? CachedNetworkImageProvider(p.seller!.profileImage!)
                          : null,
                      child: p.seller?.profileImage == null
                          ? Text(
                              (p.seller!.shopName ?? p.seller!.name)
                                  .substring(0, 1)
                                  .toUpperCase(),
                              style: const TextStyle(
                                color: AppTheme.primary,
                                fontWeight: FontWeight.w900,
                              ),
                            )
                          : null,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            (p.seller!.shopName ?? p.seller!.name)
                                .toUpperCase(),
                            style: const TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 13,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Authenticated Heritage Provider',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: AppTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.verified_rounded,
                      color: Color(0xFFD4AF37), // Artisan Gold
                      size: 22,
                    ),
                  ],
                ),
              ),
              if (p.seller != null &&
                  ((p.seller!.phone?.isNotEmpty ?? false) ||
                      (p.seller!.facebook?.isNotEmpty ?? false) ||
                      (p.seller!.instagram?.isNotEmpty ?? false) ||
                      (p.seller!.tiktok?.isNotEmpty ?? false) ||
                      (p.seller!.twitter?.isNotEmpty ?? false))) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: AppTheme.borderLight.withValues(alpha: 0.5),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (p.seller!.phone != null &&
                          p.seller!.phone!.isNotEmpty)
                        IconButton(
                          onPressed: () => _makePhoneCall(p.seller!.phone!),
                          icon: const Icon(
                            Icons.phone_rounded,
                            color: AppTheme.primary,
                            size: 18,
                          ),
                          tooltip: 'Call Business',
                        ),
                      if (p.seller!.facebook != null &&
                          p.seller!.facebook!.isNotEmpty)
                        IconButton(
                          onPressed: () => _launchUrl(p.seller!.facebook!),
                          icon: const Icon(
                            Icons.facebook_rounded,
                            color: Color(0xFF1877F2), // FB Blue
                            size: 18,
                          ),
                          tooltip: 'Facebook',
                        ),
                      if (p.seller!.instagram != null &&
                          p.seller!.instagram!.isNotEmpty)
                        IconButton(
                          onPressed: () => _launchUrl(
                            p.seller!.instagram!.startsWith('@')
                                ? 'https://instagram.com/${p.seller!.instagram!.substring(1)}'
                                : p.seller!.instagram!,
                          ),
                          icon: const Icon(
                            Icons.camera_alt_rounded,
                            color: Color(0xFFE4405F), // IG
                            size: 18,
                          ),
                          tooltip: 'Instagram',
                        ),
                      if (p.seller!.tiktok != null &&
                          p.seller!.tiktok!.isNotEmpty)
                        IconButton(
                          onPressed: () => _launchUrl(
                            p.seller!.tiktok!.startsWith('@')
                                ? 'https://tiktok.com/${p.seller!.tiktok!}'
                                : p.seller!.tiktok!,
                          ),
                          icon: const Icon(
                            Icons.video_library_rounded,
                            color: Colors.black, // TikTok Black
                            size: 18,
                          ),
                          tooltip: 'TikTok',
                        ),
                      if (p.seller!.twitter != null &&
                          p.seller!.twitter!.isNotEmpty)
                        IconButton(
                          onPressed: () => _launchUrl(p.seller!.twitter!),
                          icon: const Icon(
                            Icons.flutter_dash_rounded,
                            color: Color(0xFF1DA1F2), // Twitter/X Blue
                            size: 18,
                          ),
                          tooltip: 'Twitter',
                        ),
                    ],
                  ),
                ),
              ],
            ],
            const SizedBox(height: 100), // Spacing for fab bottom bar
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 20,
              offset: const Offset(0, -8),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.background,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: AppTheme.borderLight.withValues(alpha: 0.5),
                ),
              ),
              child: Row(
                children: [
                  _QtyActionBtn(
                    icon: Icons.remove_rounded,
                    onTap: quantity > 1
                        ? () => setState(() => quantity--)
                        : null,
                  ),
                  SizedBox(
                    width: 40,
                    child: Text(
                      '$quantity',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 16,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ),
                  _QtyActionBtn(
                    icon: Icons.add_rounded,
                    onTap: quantity < p.stock
                        ? () => setState(() => quantity++)
                        : null,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: ElevatedButton(
                onPressed: p.stock == 0
                    ? null
                    : () {
                        if (quantity > p.stock) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Limited availability in stock.'),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                          return;
                        }

                        // Mandatory selection checks
                        if (p.availableColors.isNotEmpty && selectedColor == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Please select a color.')),
                          );
                          return;
                        }
                        if (p.availableSizes != null && p.availableSizes!.isNotEmpty && selectedSize == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Please select a size.')),
                          );
                          return;
                        }
                        if (p.availableDesigns.isNotEmpty && selectedDesign == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Please select a design.')),
                          );
                          return;
                        }

                        cart.addToCart(
                          p, 
                          quantity,
                          color: selectedColor,
                          size: selectedSize,
                          design: selectedDesign,
                        );
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Added to Collection'),
                            behavior: SnackBarBehavior.floating,
                            backgroundColor: AppTheme.darkSection,
                          ),
                        );
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                  elevation: 0,
                ),
                child: Text(
                  p.stock == 0 ? 'NOT AVAILABLE' : 'ADD TO COLLECTION',
                  style: const TextStyle(
                    letterSpacing: 1.2,
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QtyActionBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  const _QtyActionBtn({required this.icon, this.onTap});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: onTap,
      icon: Icon(
        icon,
        size: 20,
        color: onTap == null ? AppTheme.textMuted : AppTheme.textPrimary,
      ),
      visualDensity: VisualDensity.compact,
    );
  }
}
