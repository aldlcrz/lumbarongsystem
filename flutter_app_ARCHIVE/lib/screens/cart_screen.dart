import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../config/app_theme.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import 'widgets/app_navbar.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final cart = context.watch<CartProvider>();
    if (!auth.isLoggedIn) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) context.go('/');
      });
      return const SizedBox.shrink();
    }

    final fmt = NumberFormat.currency(
      locale: 'en_PH',
      symbol: '₱',
      decimalDigits: 0,
    );

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: const LumBarongAppBar(title: 'My Collection', showBack: true),
      bottomNavigationBar: const AppBottomNav(currentIndex: 2),
      body: cart.cartCount == 0
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(40),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.03),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppTheme.primary.withValues(alpha: 0.1),
                        ),
                      ),
                      child: Icon(
                        Icons.shopping_bag_outlined,
                        size: 72,
                        color: AppTheme.primary.withValues(alpha: 0.3),
                      ),
                    ),
                    const SizedBox(height: 40),
                    const Text(
                      'COLECTION IS EMPTY',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2.5,
                        color: AppTheme.textMuted,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Discover handcrafted elegance for your heritage wardrobe.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 16,
                        color: AppTheme.textSecondary,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 48),
                    OutlinedButton(
                      onPressed: () => context.go('/home'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 48,
                          vertical: 20,
                        ),
                        side: const BorderSide(
                          color: AppTheme.primary,
                          width: 1.5,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: const Text(
                        'BROWSE PIECES',
                        style: TextStyle(
                          color: AppTheme.primary,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            )
          : Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
                    itemCount: cart.items.length,
                    itemBuilder: (context, index) {
                      final item = cart.items[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 20),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(28),
                          border: Border.all(
                            color: AppTheme.borderLight.withValues(alpha: 0.5),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.02),
                              blurRadius: 15,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(20),
                              child: Container(
                                width: 100,
                                height: 120,
                                color: AppTheme.background,
                                child: CachedNetworkImage(
                                  imageUrl: item.product.imageUrl,
                                  fit: BoxFit.cover,
                                  errorWidget: (_, _, _) =>
                                      const Icon(Icons.broken_image_rounded),
                                ),
                              ),
                            ),
                            const SizedBox(width: 20),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    (item.product.category ?? 'Piece')
                                        .toUpperCase(),
                                    style: const TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 1.5,
                                      color: AppTheme.primary,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    item.product.name.toUpperCase(),
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w900,
                                      color: AppTheme.textPrimary,
                                      letterSpacing: 0.5,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    fmt.format(item.product.price),
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w900,
                                      color: AppTheme.textPrimary,
                                      fontStyle: FontStyle.italic,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  Row(
                                    children: [
                                      _QtyActionBtn(
                                        icon: Icons.remove_rounded,
                                        onTap: () => cart.updateQuantity(
                                          item.product.id,
                                          item.quantity - 1,
                                        ),
                                      ),
                                      SizedBox(
                                        width: 32,
                                        child: Text(
                                          '${item.quantity}',
                                          textAlign: TextAlign.center,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w900,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ),
                                      _QtyActionBtn(
                                        icon: Icons.add_rounded,
                                        onTap: () => cart.updateQuantity(
                                          item.product.id,
                                          item.quantity + 1,
                                        ),
                                      ),
                                      const Spacer(),
                                      IconButton(
                                        onPressed: () => cart.removeFromCart(
                                          item.product.id,
                                        ),
                                        icon: const Icon(
                                          Icons.delete_outline_rounded,
                                          size: 20,
                                        ),
                                        color: AppTheme.textMuted,
                                        visualDensity: VisualDensity.compact,
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                Container(
                  padding: const EdgeInsets.fromLTRB(32, 28, 32, 40),
                  decoration: BoxDecoration(
                    color: AppTheme.darkSection,
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(40),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primary.withValues(alpha: 0.1),
                        blurRadius: 30,
                        offset: const Offset(0, -10),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'COLLECTION TOTAL',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 2,
                                color: Colors.white.withValues(alpha: 0.4),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              fmt.format(cart.cartTotal),
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 24),
                      ElevatedButton(
                        onPressed: () => context.push('/checkout'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: AppTheme.darkSection,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 32,
                            vertical: 18,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18),
                          ),
                          elevation: 0,
                        ),
                        child: const Text(
                          'CHECKOUT',
                          style: TextStyle(
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.5,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}

class _QtyActionBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _QtyActionBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          border: Border.all(
            color: AppTheme.borderLight.withValues(alpha: 0.5),
          ),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 18, color: AppTheme.textPrimary),
      ),
    );
  }
}
