import 'product.dart';

class OrderModel {
  final String id;
  final double totalAmount;
  final String paymentMethod;
  final String status;
  final String shippingAddress;
  final String? referenceNumber;
  final String? receiptImage;
  final bool isPaymentVerified;
  final int? rating;
  final String? reviewComment;
  final String customerId;
  final List<OrderItemModel> items;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  OrderModel({
    required this.id,
    required this.totalAmount,
    required this.paymentMethod,
    required this.status,
    required this.shippingAddress,
    this.referenceNumber,
    this.receiptImage,
    this.isPaymentVerified = false,
    this.rating,
    this.reviewComment,
    required this.customerId,
    this.items = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    List<OrderItemModel> itemList = [];
    if (json['items'] != null) {
      for (var e in json['items'] as List) {
        itemList.add(OrderItemModel.fromJson(Map<String, dynamic>.from(e as Map)));
      }
    }
    return OrderModel(
      id: json['id'] as String,
      totalAmount: (json['totalAmount'] is num) ? (json['totalAmount'] as num).toDouble() : double.tryParse(json['totalAmount'].toString()) ?? 0,
      paymentMethod: json['paymentMethod'] as String? ?? 'GCash',
      status: json['status'] as String? ?? 'Pending',
      shippingAddress: json['shippingAddress'] as String? ?? '',
      referenceNumber: json['referenceNumber'] as String?,
      receiptImage: json['receiptImage'] as String?,
      isPaymentVerified: json['isPaymentVerified'] as bool? ?? false,
      rating: json['rating'] as int?,
      reviewComment: json['reviewComment'] as String?,
      customerId: json['customerId'] as String,
      items: itemList,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt'].toString()) : null,
    );
  }
}

class OrderItemModel {
  final int id;
  final int quantity;
  final double price;
  final String orderId;
  final String productId;
  final String? color;
  final String? design;
  final String? size;
  final ProductModel? product;

  OrderItemModel({
    required this.id,
    required this.quantity,
    required this.price,
    required this.orderId,
    required this.productId,
    this.color,
    this.design,
    this.size,
    this.product,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    ProductModel? product;
    if (json['product'] != null) {
      product = ProductModel.fromJson(Map<String, dynamic>.from(json['product'] as Map));
    }
    return OrderItemModel(
      id: json['id'] as int,
      quantity: json['quantity'] as int,
      price: (json['price'] is num) ? (json['price'] as num).toDouble() : double.tryParse(json['price'].toString()) ?? 0,
      orderId: json['orderId'] as String,
      productId: json['productId'] as String,
      color: json['color'] as String?,
      design: json['design'] as String?,
      size: json['size'] as String?,
      product: product,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'quantity': quantity,
      'price': price,
      'orderId': orderId,
      'productId': productId,
      'color': color,
      'design': design,
      'size': size,
    };
  }
}
