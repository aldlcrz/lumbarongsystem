import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dio/dio.dart' as dio;
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../widgets/app_navbar.dart';

class EditProductScreen extends StatefulWidget {
  final String productId;
  const EditProductScreen({super.key, required this.productId});

  @override
  State<EditProductScreen> createState() => _EditProductScreenState();
}

class _EditProductScreenState extends State<EditProductScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _stockCtrl = TextEditingController();
  final _shippingFeeCtrl = TextEditingController();
  final _shippingDaysCtrl = TextEditingController();
  List<String> _selectedCategories = ['Traditional'];
  List<String> _categories = ['Traditional'];
  final List<XFile> _imageFiles = [];
  List<String> _existingImages = []; // URL list from backend
  List<String> _selectedSizes = ['S', 'M', 'L', 'XL'];

  bool _isLoading = true;
  bool _isSubmitting = false;
  String? _error;
  final ImagePicker _picker = ImagePicker();

  static const _fallbackCategories = [
    'Formal',
    'Casual',
    'Traditional',
    'Modern',
    'Custom',
  ];

  String _normalizeCategory(String? raw) {
    final value = (raw ?? '').trim();
    if (_categories.contains(value)) return value;

    final lower = value.toLowerCase();
    final traditional = _categories.firstWhere(
      (c) => c.toLowerCase() == 'traditional',
      orElse: () => _categories.first,
    );
    final casual = _categories.firstWhere(
      (c) => c.toLowerCase() == 'casual',
      orElse: () => _categories.first,
    );
    final custom = _categories.firstWhere(
      (c) => c.toLowerCase() == 'custom',
      orElse: () => _categories.first,
    );

    if (lower.contains('barong') || lower.contains('filipiniana')) {
      return traditional;
    }
    if (lower.contains('accessor')) return casual;
    if (lower.contains('other')) return custom;

    return custom;
  }

  List<String> _extractSelectedCategories(
    dynamic rawCategories,
    dynamic rawCategory,
  ) {
    final extracted = <String>[];

    if (rawCategories is List) {
      extracted.addAll(
        rawCategories
            .map((e) => e.toString().trim())
            .where((e) => e.isNotEmpty),
      );
    } else if (rawCategories is String && rawCategories.trim().isNotEmpty) {
      final value = rawCategories.trim();
      try {
        final decoded = jsonDecode(value);
        if (decoded is List) {
          extracted.addAll(
            decoded.map((e) => e.toString().trim()).where((e) => e.isNotEmpty),
          );
        } else {
          extracted.add(_normalizeCategory(value));
        }
      } catch (_) {
        extracted.add(_normalizeCategory(value));
      }
    }

    if (extracted.isEmpty) {
      extracted.add(_normalizeCategory(rawCategory?.toString()));
    }

    return extracted
        .map(_normalizeCategory)
        .toSet()
        .where((e) => e.isNotEmpty)
        .toList();
  }

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    await _loadCategories();
    await _loadProductDetails();
  }

  Future<void> _loadCategories() async {
    try {
      final res = await ApiClient().get('/categories');
      if (res.data is! List) return;

      final names =
          (res.data as List)
              .map((e) {
                if (e is Map && e['name'] != null) {
                  return e['name'].toString().trim();
                }
                return '';
              })
              .where((name) => name.isNotEmpty)
              .toSet()
              .toList()
            ..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));

      if (!mounted) return;
      setState(() {
        _categories = names.isNotEmpty ? names : List.from(_fallbackCategories);
        _selectedCategories = _selectedCategories
            .where((c) => _categories.contains(c))
            .toList();
        if (_selectedCategories.isEmpty && _categories.isNotEmpty) {
          _selectedCategories = [_categories.first];
        }
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _categories = List.from(_fallbackCategories);
        _selectedCategories = _selectedCategories
            .where((c) => _categories.contains(c))
            .toList();
        if (_selectedCategories.isEmpty && _categories.isNotEmpty) {
          _selectedCategories = [_categories.first];
        }
      });
    }
  }

  Future<void> _loadProductDetails() async {
    try {
      final res = await ApiClient().get('/products/${widget.productId}');
      final data = res.data;
      if (data != null && data is Map) {
        setState(() {
          _nameCtrl.text = data['name'] ?? '';
          _descCtrl.text = data['description'] ?? '';
          _priceCtrl.text = (data['price'] ?? 0).toString();
          _stockCtrl.text = (data['stock'] ?? 0).toString();
          _selectedCategories = _extractSelectedCategories(
            data['categories'],
            data['category'],
          );
          if (_selectedCategories.isEmpty && _categories.isNotEmpty) {
            _selectedCategories = [_categories.first];
          }

          if (data['sizes'] != null) {
            if (data['sizes'] is List) {
              _selectedSizes = (data['sizes'] as List)
                  .map((e) => e.toString())
                  .toList();
            } else if (data['sizes'] is String) {
              _selectedSizes = (data['sizes'] as String)
                  .split(',')
                  .where((e) => e.trim().isNotEmpty)
                  .toList();
            }
          }

          final imageSource = data['images'] ?? data['image'];
          if (imageSource != null) {
            try {
              if (imageSource is List) {
                _existingImages = imageSource
                    .map((e) {
                      if (e is String) return e;
                      if (e is Map && e['url'] != null) {
                        return e['url'].toString();
                      }
                      return '';
                    })
                    .where((e) => e.trim().isNotEmpty)
                    .toList();
              } else if (imageSource is Map &&
                  imageSource.containsKey('images')) {
                final nested = imageSource['images'];
                if (nested is List) {
                  _existingImages = nested
                      .map((e) {
                        if (e is String) return e;
                        if (e is Map && e['url'] != null) {
                          return e['url'].toString();
                        }
                        return '';
                      })
                      .where((e) => e.trim().isNotEmpty)
                      .toList();
                }
              } else if (imageSource is String &&
                  imageSource.trim().isNotEmpty) {
                _existingImages = [imageSource.trim()];
              }
            } catch (_) {}
          }

          _shippingFeeCtrl.text = (data['shippingFee'] ?? 0).toString();
          _shippingDaysCtrl.text = (data['shippingDays'] ?? 3).toString();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Failed to load product details: $e';
          _isLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    _priceCtrl.dispose();
    _stockCtrl.dispose();
    _shippingFeeCtrl.dispose();
    _shippingDaysCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final List<XFile> selected = await _picker.pickMultiImage();
      if (selected.isNotEmpty) {
        setState(() => _imageFiles.addAll(selected));
      }
    } catch (e) {
      setState(() => _error = 'Failed to access gallery.');
    }
  }

  Future<void> _takePhoto() async {
    try {
      final XFile? photo = await _picker.pickImage(source: ImageSource.camera);
      if (photo != null) setState(() => _imageFiles.add(photo));
    } catch (e) {
      setState(() => _error = 'Failed to access camera.');
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategories.isEmpty) {
      setState(() => _error = 'Please select at least one category.');
      return;
    }

    // allow submission with empty new images if there are existing images
    if (_imageFiles.isEmpty && _existingImages.isEmpty) {
      setState(
        () => _error = 'Please ensure at least one product image exists.',
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final List<dio.MultipartFile> multipartFiles = [];
      for (var file in _imageFiles) {
        final bytes = await file.readAsBytes();
        multipartFiles.add(
          dio.MultipartFile.fromBytes(bytes, filename: file.name),
        );
      }

      final formData = dio.FormData.fromMap({
        'name': _nameCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'price': double.tryParse(_priceCtrl.text) ?? 0,
        'stock': int.tryParse(_stockCtrl.text) ?? 0,
        'category': _selectedCategories.first,
        'categories': jsonEncode(_selectedCategories),
        'sizes': jsonEncode(_selectedSizes),
        'shippingFee': double.tryParse(_shippingFeeCtrl.text) ?? 0,
        'shippingDays': int.tryParse(_shippingDaysCtrl.text) ?? 3,
      });

      if (multipartFiles.isNotEmpty) {
        formData.files.addAll(multipartFiles.map((m) => MapEntry('images', m)));
      }

      await ApiClient().putMultipart(
        '/products/${widget.productId}',
        data: formData,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Heritage listing updated successfully!'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Color(0xFF10B981),
          ),
        );
        context.pop();
      }
    } catch (e) {
      setState(
        () => _error = 'Failed to update listing. Please check connectivity.',
      );
    }
    if (mounted) setState(() => _isSubmitting = false);
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w900,
          letterSpacing: 1.5,
          color: AppTheme.textMuted,
        ),
      ),
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String hint,
    String? label,
    int maxLines = 1,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) _buildLabel(label),
        TextField(
          controller: controller,
          maxLines: maxLines,
          keyboardType: keyboardType,
          style: const TextStyle(fontWeight: FontWeight.w700),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn ||
        (auth.user!.role != 'seller' && auth.user!.role != 'admin')) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/');
      });
      return const SizedBox.shrink();
    }

    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFFF9F6F2),
        appBar: LumBarongAppBar(title: 'Edit Listing', showBack: true),
        body: Center(child: CircularProgressIndicator(color: AppTheme.primary)),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF9F6F2),
      appBar: const LumBarongAppBar(title: 'Edit Listing', showBack: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Premium Header
              const Text(
                'INVENTORY MANAGEMENT',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.primary,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 6),
              Text.rich(
                TextSpan(
                  children: [
                    TextSpan(
                      text: 'Edit ',
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.charcoal,
                      ),
                    ),
                    TextSpan(
                      text: 'Listing',
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.primary,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              if (_error != null) ...[
                Container(
                  margin: const EdgeInsets.only(bottom: 20),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.warning_amber_rounded,
                        color: Colors.red.shade600,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _error!,
                          style: TextStyle(
                            color: Colors.red.shade700,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              // Base Information card
              _SectionCard(
                title: 'Base Information',
                child: Column(
                  children: [
                    _buildField(
                      controller: _nameCtrl,
                      label: 'Product Name',
                      hint: 'e.g. Piña-Silk Formal Barong',
                    ),
                    const SizedBox(height: 16),
                    _buildField(
                      controller: _descCtrl,
                      label: 'Description',
                      hint:
                          'Describe the artisan craft, materials, and history...',
                      maxLines: 4,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Pricing & Stock
              _SectionCard(
                title: 'Pricing & Stock',
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _buildField(
                            controller: _priceCtrl,
                            label: 'Price (₱)',
                            hint: '2500',
                            keyboardType: const TextInputType.numberWithOptions(
                              decimal: true,
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildField(
                            controller: _stockCtrl,
                            label: 'Stock Quantity',
                            hint: '10',
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _buildField(
                            controller: _shippingFeeCtrl,
                            label: 'Shipping Fee (₱)',
                            hint: '0',
                            keyboardType: const TextInputType.numberWithOptions(
                              decimal: true,
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildField(
                            controller: _shippingDaysCtrl,
                            label: 'Shipping Days',
                            hint: '3',
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Product Details card
              _SectionCard(
                title: 'Product Details',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildLabel('Heritage Sizing Available'),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: ['S', 'M', 'L', 'XL', 'XXL'].map((size) {
                        final selected = _selectedSizes.contains(size);
                        return GestureDetector(
                          onTap: () => setState(() {
                            if (selected) {
                              _selectedSizes.remove(size);
                            } else {
                              _selectedSizes.add(size);
                            }
                          }),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: selected ? AppTheme.primary : Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: selected
                                    ? AppTheme.primary
                                    : AppTheme.borderLight,
                                width: 2,
                              ),
                            ),
                            child: Text(
                              size,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w900,
                                color: selected
                                    ? Colors.white
                                    : AppTheme.textMuted,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 20),
                    _buildLabel('Categories'),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _selectedCategories
                          .map(
                            (category) => Chip(
                              label: Text(
                                category,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                ),
                              ),
                              backgroundColor: AppTheme.primary,
                              deleteIcon: const Icon(
                                Icons.close,
                                size: 18,
                                color: Colors.white,
                              ),
                              onDeleted: () {
                                setState(() {
                                  _selectedCategories.remove(category);
                                });
                              },
                            ),
                          )
                          .toList(),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: DropdownButtonFormField<String>(
                        value: null,
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 4,
                          ),
                          hintText: '+ Select Category',
                        ),
                        items: _categories
                            .map(
                              (c) => DropdownMenuItem(
                                value: c,
                                enabled: !_selectedCategories.contains(c),
                                child: Text(
                                  c,
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: _selectedCategories.contains(c)
                                        ? AppTheme.textMuted
                                        : AppTheme.charcoal,
                                  ),
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (v) {
                          if (v == null || _selectedCategories.contains(v)) {
                            return;
                          }
                          setState(() {
                            _selectedCategories = [..._selectedCategories, v];
                          });
                        },
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Media Gallery card
              _SectionCard(
                title: 'Variations & Media',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_existingImages.isNotEmpty ||
                        _imageFiles.isNotEmpty) ...[
                      SizedBox(
                        height: 120,
                        child: ListView(
                          scrollDirection: Axis.horizontal,
                          children: [
                            // Render existing server images (simulated as grey boxes or cached images)
                            ..._existingImages.map(
                              (imgUrl) => Container(
                                margin: const EdgeInsets.only(right: 16),
                                width: 120,
                                height: 120,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: AppTheme.borderLight,
                                    width: 2,
                                  ),
                                  // Using generic container or CachedNetworkImage if imported,
                                  // omitting Image.network here to prevent errors, just grey block.
                                  color: AppTheme.borderLight,
                                ),
                                alignment: Alignment.center,
                                child: const Icon(
                                  Icons.cloud_done,
                                  color: AppTheme.textMuted,
                                ),
                              ),
                            ),
                            // Render new local images
                            ..._imageFiles.map(
                              (file) => Stack(
                                children: [
                                  Container(
                                    margin: const EdgeInsets.only(right: 16),
                                    width: 120,
                                    height: 120,
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                        color: AppTheme.borderLight,
                                        width: 2,
                                      ),
                                    ),
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(18),
                                      child: FutureBuilder<Uint8List>(
                                        future: file.readAsBytes(),
                                        builder: (context, snap) {
                                          if (!snap.hasData) {
                                            return Container(
                                              color: AppTheme.borderLight,
                                              alignment: Alignment.center,
                                              child: const SizedBox(
                                                width: 18,
                                                height: 18,
                                                child:
                                                    CircularProgressIndicator(
                                                      strokeWidth: 2,
                                                    ),
                                              ),
                                            );
                                          }
                                          return Image.memory(
                                            snap.data!,
                                            fit: BoxFit.cover,
                                          );
                                        },
                                      ),
                                    ),
                                  ),
                                  Positioned(
                                    top: 6,
                                    right: 22,
                                    child: GestureDetector(
                                      onTap: () => setState(
                                        () => _imageFiles.remove(file),
                                      ),
                                      child: Container(
                                        padding: const EdgeInsets.all(4),
                                        decoration: const BoxDecoration(
                                          color: Colors.white,
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(
                                          Icons.close,
                                          size: 16,
                                          color: AppTheme.primary,
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
                      const SizedBox(height: 16),
                    ],
                    Row(
                      children: [
                        Expanded(
                          child: _UploadButton(
                            icon: Icons.photo_library_outlined,
                            label: 'Browse Gallery',
                            onTap: _pickImage,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _UploadButton(
                            icon: Icons.camera_alt_outlined,
                            label: 'Take Photo',
                            onTap: _takePhoto,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 4,
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.save_as_rounded, size: 18),
                            SizedBox(width: 10),
                            Text(
                              'UPDATE LISTING',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.5,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final Widget child;
  const _SectionCard({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppTheme.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.playfairDisplay(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppTheme.charcoal,
            ),
          ),
          const SizedBox(height: 20),
          child,
        ],
      ),
    );
  }
}

class _UploadButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _UploadButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: const Color(0xFFF9F6F2),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.borderLight, width: 2),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppTheme.primary, size: 28),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                color: AppTheme.textMuted,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
