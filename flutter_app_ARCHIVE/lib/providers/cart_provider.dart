import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/cart_item.dart';
import '../models/product.dart';

class CartProvider with ChangeNotifier {
  final List<CartItem> _items = [];
  static const String _cartKey = 'cart';

  List<CartItem> get items => List.unmodifiable(_items);
  int get cartCount => _items.fold(0, (sum, i) => sum + i.quantity);
  double get cartTotal => _items.fold(0.0, (sum, i) => sum + i.subtotal);

  CartProvider() {
    _loadCart();
  }

  Future<void> _loadCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final s = prefs.getString(_cartKey);
      if (s != null && s.isNotEmpty) {
        final list = jsonDecode(s) as List;
        _items.clear();
        for (var e in list) {
          final map = Map<String, dynamic>.from(e as Map);
          final productMap = Map<String, dynamic>.from(map['product'] as Map);
          final product = ProductModel.fromJson(productMap);
          final qty = map['quantity'] as int? ?? 1;
          _items.add(CartItem(
            product: product,
            quantity: qty,
            color: map['color'] as String?,
            design: map['design'] as String?,
            size: map['size'] as String?,
          ));
        }
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> _saveCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final encoded = jsonEncode(
        _items
            .map((i) => {
                  'product': i.product.toJson(),
                  'quantity': i.quantity,
                  'color': i.color,
                  'design': i.design,
                  'size': i.size,
                })
            .toList(),
      );
      await prefs.setString(_cartKey, encoded);
    } catch (_) {}
  }

  void addToCart(ProductModel product, int quantity,
      {String? color, String? design, String? size}) {
    final idx = _items.indexWhere((i) =>
        i.product.id == product.id &&
        i.color == color &&
        i.design == design &&
        i.size == size);

    if (idx >= 0) {
      _items[idx].quantity += quantity;
    } else {
      _items.add(CartItem(
        product: product,
        quantity: quantity,
        color: color,
        design: design,
        size: size,
      ));
    }
    _saveCart();
    notifyListeners();
  }

  void removeFromCart(String productId) {
    _items.removeWhere((i) => i.product.id == productId);
    _saveCart();
    notifyListeners();
  }

  void updateQuantity(String productId, int quantity) {
    if (quantity < 1) return;
    final idx = _items.indexWhere((i) => i.product.id == productId);
    if (idx >= 0) {
      _items[idx].quantity = quantity;
      _saveCart();
      notifyListeners();
    }
  }

  void clearCart() {
    _items.clear();
    _saveCart();
    notifyListeners();
  }
}
