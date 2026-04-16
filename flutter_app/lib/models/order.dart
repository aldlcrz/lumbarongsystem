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
    if (json['items'] != null && json['items'] is List) {
      for (var e in json['items'] as List) {
        if (e != null) {
          itemList.add(OrderItemModel.fromJson(Map<String, dynamic>.from(e as Map)));
        }
      }
    }
    return OrderModel(
      id: json['id']?.toString() ?? '',
      totalAmount: (json['totalAmount'] is num) ? (json['totalAmount'] as num).toDouble() : double.tryParse(json['totalAmount']?.toString() ?? '0') ?? 0,
      paymentMethod: json['paymentMethod']?.toString() ?? 'GCash',
      status: json['status']?.toString() ?? 'Pending',
      shippingAddress: json['shippingAddress']?.toString() ?? '',
      referenceNumber: json['referenceNumber']?.toString(),
      receiptImage: json['receiptImage']?.toString(),
      isPaymentVerified: json['isPaymentVerified'] == true || json['isVerified'] == 1,
      rating: int.tryParse(json['rating']?.toString() ?? ''),
      reviewComment: json['reviewComment']?.toString(),
      customerId: json['customerId']?.toString() ?? '',
      items: itemList,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt'].toString()) : null,
    );
  }

  OrderModel copyWith({
    String? id,
    double? totalAmount,
    String? paymentMethod,
    String? status,
    String? shippingAddress,
    String? referenceNumber,
    String? receiptImage,
    bool? isPaymentVerified,
    int? rating,
    String? reviewComment,
    String? customerId,
    List<OrderItemModel>? items,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return OrderModel(
      id: id ?? this.id,
      totalAmount: totalAmount ?? this.totalAmount,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      status: status ?? this.status,
      shippingAddress: shippingAddress ?? this.shippingAddress,
      referenceNumber: referenceNumber ?? this.referenceNumber,
      receiptImage: receiptImage ?? this.receiptImage,
      isPaymentVerified: isPaymentVerified ?? this.isPaymentVerified,
      rating: rating ?? this.rating,
      reviewComment: reviewComment ?? this.reviewComment,
      customerId: customerId ?? this.customerId,
      items: items ?? this.items,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
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
    if (json['product'] != null && json['product'] is Map) {
      product = ProductModel.fromJson(Map<String, dynamic>.from(json['product'] as Map));
    }
    return OrderItemModel(
      id: int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      quantity: int.tryParse(json['quantity']?.toString() ?? '1') ?? 1,
      price: (json['price'] is num) ? (json['price'] as num).toDouble() : double.tryParse(json['price']?.toString() ?? '0') ?? 0,
      orderId: json['orderId']?.toString() ?? '',
      productId: json['productId']?.toString() ?? '',
      color: json['color']?.toString(),
      design: json['design']?.toString(),
      size: json['size']?.toString(),
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
