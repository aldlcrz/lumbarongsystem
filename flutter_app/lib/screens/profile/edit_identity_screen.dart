import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../widgets/app_navbar.dart';

class EditIdentityScreen extends StatefulWidget {
  const EditIdentityScreen({super.key});

  @override
  State<EditIdentityScreen> createState() => _EditIdentityScreenState();
}

class _EditIdentityScreenState extends State<EditIdentityScreen> {
  final ApiClient _api = ApiClient();
  final ImagePicker _imagePicker = ImagePicker();

  late TextEditingController _shopNameController;
  late TextEditingController _mobileController;
  late TextEditingController _facebookController;
  late TextEditingController _instagramController;
  late TextEditingController _gcashNumberController;
  late TextEditingController _mayaNumberController;

  File? _gcashQrImage;
  File? _mayaQrImage;

  bool _isLoading = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _shopNameController = TextEditingController();
    _mobileController = TextEditingController();
    _facebookController = TextEditingController();
    _instagramController = TextEditingController();
    _gcashNumberController = TextEditingController();
    _mayaNumberController = TextEditingController();
    _loadProfileData();
  }

  @override
  void dispose() {
    _shopNameController.dispose();
    _mobileController.dispose();
    _facebookController.dispose();
    _instagramController.dispose();
    _gcashNumberController.dispose();
    _mayaNumberController.dispose();
    super.dispose();
  }

  Future<void> _loadProfileData() async {
    if (mounted) setState(() => _isLoading = true);
    try {
      final res = await _api.get('/users/profile');
      final data = res.data;

      Map<String, dynamic>? profile;
      if (data is Map && data['user'] is Map) {
        profile = Map<String, dynamic>.from(data['user'] as Map);
      } else if (data is Map) {
        profile = Map<String, dynamic>.from(data);
      }

      if (profile != null && mounted) {
        setState(() {
          _shopNameController.text = profile?['shopName']?.toString() ?? '';
          _mobileController.text =
              profile?['mobileNumber']?.toString() ??
              profile?['mobile']?.toString() ??
              '';
          _facebookController.text = profile?['facebookLink']?.toString() ?? '';
          _instagramController.text =
              profile?['instagramLink']?.toString() ?? '';
          _gcashNumberController.text =
              profile?['gcashNumber']?.toString() ?? '';
          _mayaNumberController.text = profile?['mayaNumber']?.toString() ?? '';
        });
      }
    } catch (_) {
      if (mounted) _showSnack('Failed to load profile data.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _pickQrImage({required bool maya}) async {
    try {
      final XFile? pickedFile = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
      );

      if (pickedFile != null) {
        setState(() {
          if (maya) {
            _mayaQrImage = File(pickedFile.path);
          } else {
            _gcashQrImage = File(pickedFile.path);
          }
        });
      }
    } catch (_) {
      _showSnack('Failed to pick image.');
    }
  }

  Future<void> _saveIdentity() async {
    final shopName = _shopNameController.text.trim();

    if (shopName.isEmpty) {
      _showSnack('Shop name is required.');
      return;
    }

    setState(() => _isSaving = true);
    try {
      final Map<String, dynamic> updateData = {
        'shopName': shopName,
        'mobileNumber': _mobileController.text.trim(),
        'facebookLink': _facebookController.text.trim(),
        'instagramLink': _instagramController.text.trim(),
        'gcashNumber': _gcashNumberController.text.trim(),
        'mayaNumber': _mayaNumberController.text.trim(),
      };

      if (_gcashQrImage != null) {
        final formData = FormData.fromMap({
          'image': await MultipartFile.fromFile(
            _gcashQrImage!.path,
            filename: 'gcash-qr.jpg',
          ),
        });
        final uploadRes = await _api.postMultipart('/upload', data: formData);
        if (uploadRes.data is Map && (uploadRes.data as Map)['url'] != null) {
          updateData['gcashQrCode'] = (uploadRes.data as Map)['url'].toString();
        }
      }

      if (_mayaQrImage != null) {
        final formData = FormData.fromMap({
          'image': await MultipartFile.fromFile(
            _mayaQrImage!.path,
            filename: 'maya-qr.jpg',
          ),
        });
        final uploadRes = await _api.postMultipart('/upload', data: formData);
        if (uploadRes.data is Map && (uploadRes.data as Map)['url'] != null) {
          updateData['mayaQrCode'] = (uploadRes.data as Map)['url'].toString();
        }
      }

      await _api.put('/users/profile', data: updateData);

      if (!mounted) return;
      _showSnack('Platform identity updated successfully.');
      Future.delayed(const Duration(milliseconds: 800), () {
        if (mounted) context.pop();
      });
    } catch (e) {
      _showSnack(_extractError(e, 'Failed to update identity.'));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  String _extractError(Object error, String fallback) {
    try {
      final dynamic e = error;
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        return data['message'].toString();
      }
    } catch (_) {}
    return fallback;
  }

  void _showSnack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) context.go('/');
      });
      return const SizedBox.shrink();
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: const LumBarongAppBar(title: 'My Profile', showBack: true),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 24),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 860),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.08),
                          blurRadius: 24,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.fromLTRB(24, 22, 24, 22),
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [Color(0xFFC74520), Color(0xFFA83D1A)],
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 48,
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.14),
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: const Icon(
                                    Icons.storefront_rounded,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                const Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Edit Profile',
                                        style: TextStyle(
                                          fontSize: 22,
                                          fontWeight: FontWeight.w800,
                                          color: Colors.white,
                                        ),
                                      ),
                                      SizedBox(height: 4),
                                      Text(
                                        'Update your shop identity and registry details.',
                                        style: TextStyle(
                                          fontSize: 13,
                                          color: Colors.white70,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  onPressed: () => context.pop(),
                                  icon: const Icon(
                                    Icons.close_rounded,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(22),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildSectionLabel('Platform Identity'),
                                const SizedBox(height: 14),
                                LayoutBuilder(
                                  builder: (context, constraints) {
                                    final twoColumns =
                                        constraints.maxWidth >= 720;
                                    return Column(
                                      children: [
                                        _buildResponsiveRow(
                                          twoColumns: twoColumns,
                                          left: _buildTextField(
                                            label: 'Registry Name',
                                            controller: _shopNameController,
                                            hint: 'Shop name',
                                            icon: Icons.badge_outlined,
                                          ),
                                          right: _buildTextField(
                                            label: 'Mobile Connection',
                                            controller: _mobileController,
                                            hint: '+63 9xx xxx xxxx',
                                            keyboardType: TextInputType.phone,
                                            icon: Icons.phone_outlined,
                                          ),
                                        ),
                                        const SizedBox(height: 16),
                                        _buildResponsiveRow(
                                          twoColumns: twoColumns,
                                          left: _buildTextField(
                                            label: 'Facebook (Optional)',
                                            controller: _facebookController,
                                            hint: 'e.g. facebook.com/shop',
                                            icon: Icons.facebook,
                                          ),
                                          right: _buildTextField(
                                            label: 'Instagram (Optional)',
                                            controller: _instagramController,
                                            hint: 'e.g. instagram.com/shop',
                                            icon: Icons.camera_alt_outlined,
                                          ),
                                        ),
                                        const SizedBox(height: 16),
                                        _buildResponsiveRow(
                                          twoColumns: twoColumns,
                                          left: _buildTextField(
                                            label: 'GCash Direct Pay Number',
                                            controller: _gcashNumberController,
                                            hint: '0917-123-4567',
                                            keyboardType: TextInputType.phone,
                                            icon: Icons
                                                .account_balance_wallet_outlined,
                                          ),
                                          right: _buildImagePickerField(
                                            label: 'New GCash QR Code (Image)',
                                            image: _gcashQrImage,
                                            onTap: () =>
                                                _pickQrImage(maya: false),
                                          ),
                                        ),
                                        const SizedBox(height: 16),
                                        _buildResponsiveRow(
                                          twoColumns: twoColumns,
                                          left: _buildTextField(
                                            label: 'Maya Direct Pay Number',
                                            controller: _mayaNumberController,
                                            hint: '0917-123-4567',
                                            keyboardType: TextInputType.phone,
                                            icon: Icons.credit_card_outlined,
                                          ),
                                          right: _buildImagePickerField(
                                            label: 'New Maya QR Code (Image)',
                                            image: _mayaQrImage,
                                            onTap: () =>
                                                _pickQrImage(maya: true),
                                          ),
                                        ),
                                      ],
                                    );
                                  },
                                ),
                                const SizedBox(height: 24),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    onPressed: _isSaving ? null : _saveIdentity,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppTheme.primary,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 16,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                      elevation: 2,
                                    ),
                                    child: _isSaving
                                        ? const SizedBox(
                                            height: 18,
                                            width: 18,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              color: Colors.white,
                                            ),
                                          )
                                        : const Text(
                                            'SAVE IDENTITY METADATA',
                                            style: TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w700,
                                              letterSpacing: 0.6,
                                            ),
                                          ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: AppTheme.textMuted,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFFBFAF8),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.primary.withValues(alpha: 0.22)),
          ),
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppTheme.charcoal,
            ),
            decoration: InputDecoration(
              border: InputBorder.none,
              prefixIcon: Icon(icon, size: 18, color: AppTheme.primary),
              hintText: hint,
              hintStyle: const TextStyle(
                color: AppTheme.textMuted,
                fontSize: 14,
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 14,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildImagePickerField({
    required String label,
    required File? image,
    required VoidCallback onTap,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: AppTheme.textMuted,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: _isSaving ? null : onTap,
          borderRadius: BorderRadius.circular(14),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFFBFAF8),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: AppTheme.primary.withValues(alpha: 0.22),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.cloud_upload_outlined,
                    color: AppTheme.primary,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        image?.path.split('\\').last.split('/').last ??
                            'Choose file',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.charcoal,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Tap to select a QR image',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                if (image != null)
                  const Icon(Icons.check_circle, color: AppTheme.primary),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSectionLabel(String text) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w800,
        color: AppTheme.textMuted,
        letterSpacing: 1.4,
      ),
    );
  }

  Widget _buildResponsiveRow({
    required bool twoColumns,
    required Widget left,
    required Widget right,
  }) {
    if (!twoColumns) {
      return Column(children: [left, const SizedBox(height: 16), right]);
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: left),
        const SizedBox(width: 16),
        Expanded(child: right),
      ],
    );
  }
}
