import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/cart_item.dart';
import '../models/product.dart';

class CartProvider with ChangeNotifier {
  final List<CartItem> _items = [];
  static const String _cartKey = 'cart';
  int _cartAddAnimationTick = 0;

  List<CartItem> get items => List.unmodifiable(_items);
  List<CartItem> get selectedItems =>
      _items.where((i) => i.isSelected == true).toList();
  int get cartCount => _items.fold(0, (sum, i) => sum + i.quantity);
  int get cartAddAnimationTick => _cartAddAnimationTick;
  double get cartTotal => _items.fold(0.0, (sum, i) => sum + i.subtotal);
  double get selectedTotal => _items
      .where((i) => i.isSelected == true)
      .fold(0.0, (sum, i) => sum + i.subtotal);
  bool get allSelected =>
      _items.isNotEmpty && _items.every((i) => i.isSelected == true);

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
          _items.add(
            CartItem(
              product: product,
              quantity: qty,
              color: map['color'] as String?,
              design: map['design'] as String?,
              size: map['size'] as String?,
              isSelected: map['isSelected'] as bool? ?? true,
            ),
          );
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
            .map(
              (i) => {
                'product': i.product.toJson(),
                'quantity': i.quantity,
                'color': i.color,
                'design': i.design,
                'size': i.size,
                'isSelected': i.isSelected,
              },
            )
            .toList(),
      );
      await prefs.setString(_cartKey, encoded);
    } catch (_) {}
  }

  void _moveItemToTop(int index) {
    if (index <= 0 || index >= _items.length) return;
    final item = _items.removeAt(index);
    _items.insert(0, item);
  }

  void addToCart(
    ProductModel product,
    int quantity, {
    String? color,
    String? design,
    String? size,
  }) {
    final idx = _items.indexWhere(
      (i) =>
          i.product.id == product.id &&
          i.color == color &&
          i.design == design &&
          i.size == size,
    );

    if (idx >= 0) {
      _items[idx].quantity += quantity;
      _moveItemToTop(idx);
    } else {
      _items.add(
        CartItem(
          product: product,
          quantity: quantity,
          color: color,
          design: design,
          size: size,
          isSelected: true, // Default to true when adding a new item
        ),
      );
      _moveItemToTop(_items.length - 1);
    }
    _cartAddAnimationTick++;
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

  void toggleSelection(
    String productId, {
    String? color,
    String? design,
    String? size,
  }) {
    final idx = _items.indexWhere(
      (i) =>
          i.product.id == productId &&
          i.color == color &&
          i.design == design &&
          i.size == size,
    );
    if (idx >= 0) {
      _items[idx].isSelected = !(_items[idx].isSelected == true);
      _saveCart();
      notifyListeners();
    }
  }

  void toggleAll(bool? selected) {
    for (var i in _items) {
      i.isSelected = selected ?? true;
    }
    _saveCart();
    notifyListeners();
  }

  void clearCart() {
    _items.clear();
    _saveCart();
    notifyListeners();
  }
}
