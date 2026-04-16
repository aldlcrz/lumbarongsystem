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
  final String? gcashQrCode;
  final String? mayaNumber;
  final String? mayaQrCode;
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
    this.gcashQrCode,
    this.mayaNumber,
    this.mayaQrCode,
    this.facebook,
    this.instagram,
    this.tiktok,
    this.twitter,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unknown',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? 'customer',
      phone: json['phone']?.toString() ?? json['mobileNumber']?.toString() ?? json['mobile']?.toString(),
      address: json['address']?.toString(),
      shopName: json['shopName']?.toString(),
      shopDescription: json['shopDescription']?.toString(),
      isVerified: json['isVerified'] == true || json['isVerified'] == 1,
      profileImage: json['profileImage']?.toString(),
      gcashNumber: json['gcashNumber']?.toString(),
      gcashQrCode: json['gcashQrCode']?.toString(),
      mayaNumber: json['mayaNumber']?.toString(),
      mayaQrCode: json['mayaQrCode']?.toString(),
      facebook: json['facebookLink']?.toString() ?? json['facebook']?.toString(),
      instagram: json['instagramLink']?.toString() ?? json['instagram']?.toString(),
      tiktok: json['tiktok']?.toString(),
      twitter: json['twitter']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'role': role,
    'phone': phone,
    'mobileNumber': phone,
    'address': address,
    'shopName': shopName,
    'shopDescription': shopDescription,
    'isVerified': isVerified,
    'profileImage': profileImage,
    'gcashNumber': gcashNumber,
    'gcashQrCode': gcashQrCode,
    'mayaNumber': mayaNumber,
    'mayaQrCode': mayaQrCode,
    'facebook': facebook,
    'instagram': instagram,
    'tiktok': tiktok,
    'twitter': twitter,
  };
}
