import 'product.dart';

class CartItem {
  final ProductModel product;
  int quantity;
  String? color;
  String? design;
  String? size;

  CartItem({
    required this.product,
    this.quantity = 1,
    this.color,
    this.design,
    this.size,
  });

  double get subtotal => product.price * quantity;
}
