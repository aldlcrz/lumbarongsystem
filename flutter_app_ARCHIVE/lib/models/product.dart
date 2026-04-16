import 'user.dart';

class ProductModel {
  final String id;
  final String name;
  final String? description;
  final double price;
  final int stock;
  final String? category;
  final String sellerId;
  final UserModel? seller;
  final List<ProductImageModel> images;
  final List<String>? availableSizes;
  final List<String> availableColors;
  final List<String> availableDesigns;
  final List<ProductRatingModel>? ratings;

  ProductModel({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.stock,
    this.category,
    required this.sellerId,
    this.seller,
    this.images = const [],
    this.availableSizes,
    this.availableColors = const [],
    this.availableDesigns = const [],
    this.ratings,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    List<ProductImageModel> imgs = [];
    if (json['images'] != null) {
      for (var e in json['images'] as List) {
        imgs.add(
          ProductImageModel.fromJson(Map<String, dynamic>.from(e as Map)),
        );
      }
    }
    List<ProductRatingModel>? rates;
    if (json['ratings'] != null) {
      rates = (json['ratings'] as List)
          .map(
            (e) => ProductRatingModel.fromJson(
              Map<String, dynamic>.from(e as Map),
            ),
          )
          .toList();
    }
    UserModel? seller;
    if (json['seller'] != null) {
      seller = UserModel.fromJson(
        Map<String, dynamic>.from(json['seller'] as Map),
      );
    }
    List<String>? sizes;
    if (json['availableSizes'] != null) {
      sizes = (json['availableSizes'] as List)
          .map((e) => (e is Map) ? e['size'].toString() : e.toString())
          .toList();
    }
    List<String> colors = [];
    if (json['availableColors'] != null) {
      colors = (json['availableColors'] as List).map((e) => e.toString()).toList();
    }
    List<String> designs = [];
    if (json['availableDesigns'] != null) {
      designs = (json['availableDesigns'] as List).map((e) => e.toString()).toList();
    }
    return ProductModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      price: (json['price'] is num)
          ? (json['price'] as num).toDouble()
          : double.tryParse(json['price'].toString()) ?? 0,
      stock: json['stock'] as int? ?? 0,
      category: json['category'] as String?,
      sellerId: json['sellerId'] as String,
      seller: seller,
      images: imgs,
      availableSizes: sizes,
      availableColors: colors,
      availableDesigns: designs,
      ratings: rates,
    );
  }

  String get imageUrl {
    if (images.isNotEmpty) {
      return images.first.url;
    }
    return 'https://placehold.co/300x400/ececec/aaaaaa?text=Barong';
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'description': description,
    'price': price,
    'stock': stock,
    'category': category,
    'sellerId': sellerId,
    'seller': seller?.toJson(),
    'images': images.map((e) => {'id': e.id, 'url': e.url}).toList(),
    'availableColors': availableColors,
    'availableDesigns': availableDesigns,
  };
}

class ProductImageModel {
  final int? id;
  final String url;

  ProductImageModel({this.id, required this.url});

  factory ProductImageModel.fromJson(Map<String, dynamic> json) {
    String url = json['url'] as String? ?? '';
    if (url.isEmpty && json['url'] is Map) {
      url = (json['url'] as Map)['url']?.toString() ?? '';
    }
    return ProductImageModel(id: json['id'] as int?, url: url);
  }
}

class ProductRatingModel {
  final int id;
  final int rating;
  final String? review;
  final String userId;
  final String productId;

  ProductRatingModel({
    required this.id,
    required this.rating,
    this.review,
    required this.userId,
    required this.productId,
  });

  factory ProductRatingModel.fromJson(Map<String, dynamic> json) {
    return ProductRatingModel(
      id: json['id'] as int,
      rating: json['rating'] as int,
      review: json['review'] as String?,
      userId: json['userId'] as String,
      productId:
          json['ProductId'] as String? ?? json['productId'] as String? ?? '',
    );
  }
}
