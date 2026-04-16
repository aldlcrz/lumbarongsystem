import 'product.dart';

class CartItem {
  final ProductModel product;
  int quantity;
  String? color;
  String? design;
  String? size;

  bool _isSelected = true;
  bool get isSelected => _isSelected;
  set isSelected(bool? value) => _isSelected = value ?? true;
 
   CartItem({
     required this.product,
     this.quantity = 1,
     this.color,
     this.design,
     this.size,
     bool? isSelected,
   }) : _isSelected = isSelected ?? true;

  double get subtotal => product.price * quantity;
}
