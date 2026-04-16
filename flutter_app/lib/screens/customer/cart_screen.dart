import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../models/cart_item.dart';
import '../widgets/app_navbar.dart';
import 'package:google_fonts/google_fonts.dart';

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

    // Group items by artisan
    final Map<String, List<CartItem>> groupedItems = {};
    for (var item in cart.items) {
      final artisan = item.product.artisan ?? 'Lumban Artisan';
      if (!groupedItems.containsKey(artisan)) groupedItems[artisan] = [];
      groupedItems[artisan]!.add(item);
    }
    final artisans = groupedItems.keys.toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF9F6F2),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 20,
            color: AppTheme.charcoal,
          ),
        ),
        title: const Text(
          'My Cart',
          style: TextStyle(
            color: AppTheme.charcoal,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
        actions: [
          if (cart.items.isNotEmpty)
            IconButton(
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Clear Cart'),
                    content: const Text(
                      'Are you sure you want to delete all items?',
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        child: const Text('Cancel'),
                      ),
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        style: TextButton.styleFrom(
                          foregroundColor: Colors.red,
                        ),
                        child: const Text('Delete'),
                      ),
                    ],
                  ),
                );
                if (confirm == true) cart.clearCart();
              },
              icon: const Icon(
                Icons.delete_outline_rounded,
                color: AppTheme.textMuted,
              ),
            ),
        ],
      ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 2),
      body: cart.cartCount == 0
          ? _buildEmptyState(context)
          : Column(
              children: [
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 8,
                    ),
                    children: [
                      _buildHeader(),
                      const SizedBox(height: 24),
                      _buildSyncedStatus(artisans.length),
                      const SizedBox(height: 32),
                      ...artisans.map(
                        (artisan) => _buildArtisanGroup(
                          context,
                          artisan,
                          groupedItems[artisan]!,
                          cart,
                          fmt,
                        ),
                      ),
                      const SizedBox(height: 100), // Bottom padding for summary
                    ],
                  ),
                ),
                _buildStickyFooter(context, cart, fmt),
              ],
            ),
    );
  }

  Widget _buildHeader() {
    return const SizedBox.shrink(); // Removed large My Cart title
  }

  Widget _buildSyncedStatus(int count) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        const Icon(Icons.sync_rounded, size: 16, color: Color(0xFF10B981)),
        const SizedBox(width: 8),
        Flexible(
          child: Text(
            'SYNCED WITH $count SHOP${count > 1 ? 'S' : ''}',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.right,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.5,
              color: Color(0xFF10B981),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildArtisanGroup(
    BuildContext context,
    String artisan,
    List<CartItem> items,
    CartProvider cart,
    NumberFormat fmt,
  ) {
    return Column(
      children: [
        Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.borderLight),
          ),
          child: Column(
            children: [
              // Artisan Header
              Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: const BoxDecoration(
                      color: Color(0xFF2A2A2A),
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      artisan[0].toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      artisan.toUpperCase(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.charcoal,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'VERIFIED',
                      style: TextStyle(
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF10B981),
                      ),
                    ),
                  ),
                ],
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Divider(height: 1, color: AppTheme.borderLight),
              ),
              // Items
              ...items.map((item) => _buildCartItem(context, item, cart, fmt)),
            ],
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildCartItem(
    BuildContext context,
    CartItem item,
    CartProvider cart,
    NumberFormat fmt,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Checkbox(
            value: item.isSelected == true,
            onChanged: (val) => cart.toggleSelection(
              item.product.id,
              color: item.color,
              size: item.size,
              design: item.design,
            ),
            activeColor: const Color(0xFF8B4513),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(width: 4),
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: 70,
              height: 80,
              color: const Color(0xFFF7F3EE),
              child: CachedNetworkImage(
                imageUrl: item.product.imageUrl,
                fit: BoxFit.cover,
                errorWidget: (_, _, _) =>
                    const Icon(Icons.broken_image_rounded),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.product.name,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.charcoal,
                    height: 1.2,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '${item.product.category?.toUpperCase() ?? "PIECE"} • SIZE ${item.size ?? "M"}',
                  style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.textMuted,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 12),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final isCompact = constraints.maxWidth < 230;

                    Future<void> confirmRemove() async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text('Remove Item'),
                          content: const Text(
                            'Remove this item from your cart?',
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(ctx, false),
                              child: const Text('Cancel'),
                            ),
                            TextButton(
                              onPressed: () => Navigator.pop(ctx, true),
                              style: TextButton.styleFrom(
                                foregroundColor: Colors.red,
                              ),
                              child: const Text('Remove'),
                            ),
                          ],
                        ),
                      );

                      if (confirm == true) {
                        cart.removeFromCart(item.product.id);
                      }
                    }

                    final qtyControls = Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _QtyBtn(
                          '-',
                          () => cart.updateQuantity(
                            item.product.id,
                            item.quantity - 1,
                          ),
                        ),
                        Container(
                          width: 24,
                          alignment: Alignment.center,
                          child: Text(
                            '${item.quantity}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                        _QtyBtn(
                          '+',
                          () => cart.updateQuantity(
                            item.product.id,
                            item.quantity + 1,
                          ),
                        ),
                      ],
                    );

                    final deleteAction = InkWell(
                      onTap: confirmRemove,
                      borderRadius: BorderRadius.circular(6),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 3,
                        ),
                        child: isCompact
                            ? const Icon(
                                Icons.delete_outline_rounded,
                                size: 16,
                                color: AppTheme.textMuted,
                              )
                            : const Text(
                                'DELETE',
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900,
                                  color: AppTheme.textMuted,
                                  letterSpacing: 1,
                                ),
                              ),
                      ),
                    );

                    final priceText = Text(
                      fmt.format(item.product.price),
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF8B4513),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    );

                    if (isCompact) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          priceText,
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              qtyControls,
                              const Spacer(),
                              deleteAction,
                            ],
                          ),
                        ],
                      );
                    }

                    return Row(
                      children: [
                        Expanded(child: priceText),
                        const SizedBox(width: 8),
                        qtyControls,
                        const SizedBox(width: 8),
                        deleteAction,
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStickyFooter(
    BuildContext context,
    CartProvider cart,
    NumberFormat fmt,
  ) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, -10),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Checkbox(
                value: cart.allSelected == true,
                onChanged: (val) => cart.toggleAll(val ?? true),
                activeColor: const Color(0xFF8B4513),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const Text(
                'Select All',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.charcoal,
                ),
              ),
              const Spacer(),
              Flexible(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text(
                      'ORDER TOTAL',
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.textMuted,
                        letterSpacing: 1,
                      ),
                    ),
                    Text(
                      fmt.format(cart.selectedTotal),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF8B4513),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 60,
            child: ElevatedButton(
              onPressed: cart.selectedItems.isEmpty
                  ? null
                  : () => context.push('/checkout?mode=cart'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(
                  0xFFD2B48C,
                ).withOpacity(0.8), // Sage/Nude tone like in web
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: Text(
                'CHECK OUT (${cart.selectedItems.fold(0, (sum, i) => sum + i.quantity)})',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5,
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.verified_user_outlined,
                size: 14,
                color: Color(0xFF10B981),
              ),
              SizedBox(width: 8),
              Text(
                'SECURE CHECKOUT',
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF10B981),
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.03),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.shopping_bag_outlined,
                size: 72,
                color: AppTheme.primary.withOpacity(0.3),
              ),
            ),
            const SizedBox(height: 40),
            const Text(
              'CART IS EMPTY',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                letterSpacing: 2.5,
                color: AppTheme.textMuted,
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
                side: const BorderSide(color: AppTheme.primary, width: 1.5),
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
    );
  }
}

class _QtyBtn extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _QtyBtn(this.label, this.onTap);

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 28,
        height: 28,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppTheme.background,
          border: Border.all(color: AppTheme.borderLight),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: AppTheme.charcoal,
          ),
        ),
      ),
    );
  }
}
