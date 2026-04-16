import 'dart:convert';

import '../config/api_config.dart';
import 'user.dart';

class ProductModel {
  final String id;
  final String name;
  final String? description;
  final double price;
  final int stock;
  final String? category;
  final List<String> categories;
  final String sellerId;
  final UserModel? seller;
  final List<ProductImageModel> images;
  final List<String>? availableSizes;
  final List<String> availableColors;
  final List<String> availableDesigns;
  final List<ProductRatingModel>? ratings;
  final int soldCount;

  ProductModel({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.stock,
    this.category,
    this.categories = const [],
    required this.sellerId,
    this.seller,
    this.images = const [],
    this.availableSizes,
    this.availableColors = const [],
    this.availableDesigns = const [],
    this.ratings,
    this.soldCount = 0,
  });

  static List<String> _parseStringList(dynamic value) {
    if (value == null) return [];

    if (value is List) {
      return value
          .map((e) => e?.toString().trim() ?? '')
          .where((e) => e.isNotEmpty)
          .toList();
    }

    if (value is String && value.trim().isNotEmpty) {
      final trimmed = value.trim();
      if (trimmed.startsWith('[')) {
        try {
          final parsed = jsonDecode(trimmed);
          if (parsed is List) {
            return parsed
                .map((e) => e.toString().trim())
                .where((e) => e.isNotEmpty)
                .toList();
          }
        } catch (_) {}
      }

      return [trimmed];
    }

    return [];
  }

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    List<ProductImageModel> imgs = [];
    final dynamic imageSource = json['images'] ?? json['image'];
    if (imageSource is List) {
      for (var e in imageSource) {
        if (e is Map) {
          imgs.add(ProductImageModel.fromJson(Map<String, dynamic>.from(e)));
        } else if (e is String && e.trim().isNotEmpty) {
          imgs.add(ProductImageModel(url: e.trim()));
        }
      }
    } else if (imageSource is String && imageSource.trim().isNotEmpty) {
      final trimmed = imageSource.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          final parsed = jsonDecode(trimmed);
          if (parsed is List) {
            for (var e in parsed) {
              if (e is Map) {
                imgs.add(
                  ProductImageModel.fromJson(Map<String, dynamic>.from(e)),
                );
              } else if (e is String && e.trim().isNotEmpty) {
                imgs.add(ProductImageModel(url: e.trim()));
              }
            }
          } else if (parsed is Map) {
            imgs.add(
              ProductImageModel.fromJson(Map<String, dynamic>.from(parsed)),
            );
          } else {
            imgs.add(ProductImageModel(url: trimmed));
          }
        } catch (_) {
          imgs.add(ProductImageModel(url: trimmed));
        }
      } else {
        imgs.add(ProductImageModel(url: trimmed));
      }
    } else if (imageSource is Map) {
      if (imageSource['images'] is List) {
        for (var e in imageSource['images'] as List) {
          if (e is Map) {
            imgs.add(ProductImageModel.fromJson(Map<String, dynamic>.from(e)));
          } else if (e is String && e.trim().isNotEmpty) {
            imgs.add(ProductImageModel(url: e.trim()));
          }
        }
      } else if (imageSource['url'] != null) {
        final u = imageSource['url'].toString().trim();
        if (u.isNotEmpty) imgs.add(ProductImageModel(url: u));
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
    final categories = _parseStringList(json['categories'] ?? json['category']);

    List<String>? sizes;
    final parsedSizes = _parseStringList(
      json['availableSizes'] ?? json['sizes'],
    );
    if (parsedSizes.isNotEmpty) {
      sizes = parsedSizes;
    }

    final colors = _parseStringList(json['availableColors']);
    final designs = _parseStringList(json['availableDesigns']);
    return ProductModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unnamed Product',
      description: json['description']?.toString(),
      price: (json['price'] is num)
          ? (json['price'] as num).toDouble()
          : double.tryParse(json['price'].toString()) ?? 0,
      stock: (json['stock'] is int)
          ? (json['stock'] as int)
          : int.tryParse(json['stock']?.toString() ?? '0') ?? 0,
      category:
          json['category']?.toString() ??
          (categories.isNotEmpty ? categories.first : null),
      categories: categories,
      sellerId: json['sellerId']?.toString() ?? '',
      seller: seller,
      images: imgs,
      availableSizes: sizes,
      availableColors: colors,
      availableDesigns: designs,
      ratings: rates,
      soldCount: (json['soldCount'] is num)
          ? (json['soldCount'] as num).toInt()
          : int.tryParse(
                  (json['soldCount'] ?? json['sold'] ?? json['sales'] ?? '0')
                      .toString(),
                ) ??
                0,
    );
  }

  String get imageUrl {
    if (images.isNotEmpty) {
      final raw = images.first.url.trim();
      if (raw.isEmpty) return '';

      if (raw.startsWith('http://') ||
          raw.startsWith('https://') ||
          raw.startsWith('data:') ||
          raw.startsWith('blob:')) {
        return raw;
      }

      final base = Uri.parse(kApiBaseUrl);
      final origin =
          '${base.scheme}://${base.host}${base.hasPort ? ':${base.port}' : ''}';

      if (raw.startsWith('/')) {
        return '$origin$raw';
      }

      return '$origin/$raw';
    }

    return '';
  }

  /// Average rating computed from the ratings list.
  double? get rating {
    if (ratings == null || ratings!.isEmpty) return null;
    final sum = ratings!.fold<int>(0, (acc, r) => acc + r.rating);
    return sum / ratings!.length;
  }

  /// Artisan display name from the associated seller.
  String? get artisan => seller?.shopName ?? seller?.name;

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'description': description,
    'price': price,
    'stock': stock,
    'category': category,
    'categories': categories,
    'sellerId': sellerId,
    'seller': seller?.toJson(),
    'images': images.map((e) => {'id': e.id, 'url': e.url}).toList(),
    'availableColors': availableColors,
    'availableDesigns': availableDesigns,
  };

  ProductModel copyWith({
    String? id,
    String? name,
    String? description,
    double? price,
    int? stock,
    String? category,
    List<String>? categories,
    String? sellerId,
    UserModel? seller,
    List<ProductImageModel>? images,
    List<String>? availableSizes,
    List<String>? availableColors,
    List<String>? availableDesigns,
    List<ProductRatingModel>? ratings,
    int? soldCount,
    String? imageUrl, // High-level override for simple gallery switching
  }) {
    // If imageUrl is provided, we ensure it's the first in the list
    List<ProductImageModel> updatedImages = images ?? List.from(this.images);
    if (imageUrl != null) {
      final idx = updatedImages.indexWhere((img) => img.url == imageUrl);
      if (idx != -1) {
        final img = updatedImages.removeAt(idx);
        updatedImages.insert(0, img);
      } else {
        updatedImages.insert(0, ProductImageModel(url: imageUrl));
      }
    }

    return ProductModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      price: price ?? this.price,
      stock: stock ?? this.stock,
      category: category ?? this.category,
      categories: categories ?? this.categories,
      sellerId: sellerId ?? this.sellerId,
      seller: seller ?? this.seller,
      images: updatedImages,
      availableSizes: availableSizes ?? this.availableSizes,
      availableColors: availableColors ?? this.availableColors,
      availableDesigns: availableDesigns ?? this.availableDesigns,
      ratings: ratings ?? this.ratings,
      soldCount: soldCount ?? this.soldCount,
    );
  }
}

class ProductImageModel {
  final int? id;
  final String url;

  ProductImageModel({this.id, required this.url});

  factory ProductImageModel.fromJson(Map<String, dynamic> json) {
    String url = json['url']?.toString() ?? '';
    if (url.isEmpty && json['url'] is Map) {
      url = (json['url'] as Map)['url']?.toString() ?? '';
    }
    return ProductImageModel(
      id: int.tryParse(json['id']?.toString() ?? ''),
      url: url,
    );
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
      id: int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      rating: int.tryParse(json['rating']?.toString() ?? '5') ?? 5,
      review: json['review']?.toString(),
      userId: json['userId']?.toString() ?? '',
      productId:
          (json['ProductId'] ?? json['productId'] ?? '')?.toString() ?? '',
    );
  }
}
