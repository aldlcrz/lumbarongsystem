class UserModel {
  final String id;
  final String name;
  final String email;
  final String role; // admin, seller, customer
  final String? phone;
  final String? address;
  final String? shopName;
  final String? shopDescription;
  final bool isVerified;
  final String? profileImage;
  final String? gcashNumber;
  final String? facebook;
  final String? instagram;
  final String? tiktok;
  final String? twitter;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
    this.address,
    this.shopName,
    this.shopDescription,
    this.isVerified = false,
    this.profileImage,
    this.gcashNumber,
    this.facebook,
    this.instagram,
    this.tiktok,
    this.twitter,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      role: json['role'] as String? ?? 'customer',
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      shopName: json['shopName'] as String?,
      shopDescription: json['shopDescription'] as String?,
      isVerified: json['isVerified'] as bool? ?? false,
      profileImage: json['profileImage'] as String?,
      gcashNumber: json['gcashNumber'] as String?,
      facebook: json['facebook'] as String?,
      instagram: json['instagram'] as String?,
      tiktok: json['tiktok'] as String?,
      twitter: json['twitter'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'role': role,
    'phone': phone,
    'address': address,
    'shopName': shopName,
    'shopDescription': shopDescription,
    'isVerified': isVerified,
    'profileImage': profileImage,
    'gcashNumber': gcashNumber,
    'facebook': facebook,
    'instagram': instagram,
    'tiktok': tiktok,
    'twitter': twitter,
  };
}
