// ignore_for_file: deprecated_member_use
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../services/api_client.dart';
import '../widgets/app_navbar.dart';
import 'package:google_fonts/google_fonts.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  String _paymentMethod = 'GCash';
  final _referenceController = TextEditingController();
  String? _receiptImageUrl;
  File? _receiptFile;
  bool _isOrdering = false;
  bool _orderComplete = false;
  List<dynamic> _addresses = [];
  Map<String, dynamic>? _selectedAddress;

  @override
  void initState() {
    super.initState();
    _loadAddresses();
  }

  Future<void> _loadAddresses() async {
    try {
      final res = await ApiClient().get('/users/addresses');
      if (res.data is List && (res.data as List).isNotEmpty) {
        final list = res.data as List;
        setState(() {
          _addresses = list;
          _selectedAddress = list.firstWhere(
            (a) => a['isDefault'] == true,
            orElse: () => list.first,
          );
          if (_selectedAddress != null) {
            _phoneController.text =
                (_selectedAddress!['phone'] ??
                        _selectedAddress!['phoneNumber'] ??
                        _selectedAddress!['mobileNumber'] ??
                        '')
                    .toString();
            _addressController.text =
                '${_selectedAddress!['recipientName'] ?? _selectedAddress!['fullName'] ?? _selectedAddress!['name'] ?? ''} | ${_selectedAddress!['street'] ?? ''}, ${_selectedAddress!['barangay'] ?? ''}, ${_selectedAddress!['city'] ?? ''}, ${_selectedAddress!['province'] ?? ''} ${_selectedAddress!['postalCode'] ?? ''}';
          }
        });
      }
    } catch (e) {
      debugPrint('Error loading addresses: $e');
    }
  }

  void _showAddressPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'SELECT ADDRESS',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 2,
                color: AppTheme.textMuted,
              ),
            ),
            const SizedBox(height: 24),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: _addresses.length,
                separatorBuilder: (_, _) => const SizedBox(height: 12),
                itemBuilder: (ctx, i) {
                  final addr = _addresses[i];
                  final bool isSelected = _selectedAddress?['id'] == addr['id'];
                  return InkWell(
                    onTap: () {
                      setState(() {
                        _selectedAddress = addr;
                        _phoneController.text =
                            (addr['phone'] ??
                                    addr['phoneNumber'] ??
                                    addr['mobileNumber'] ??
                                    '')
                                .toString();
                        _addressController.text =
                            '${addr['recipientName'] ?? addr['fullName'] ?? addr['name'] ?? ''} | ${addr['street']}, ${addr['barangay']}, ${addr['city']}, ${addr['province']} ${addr['postalCode']}';
                      });
                      Navigator.pop(context);
                    },
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppTheme.primary.withValues(alpha: 0.05)
                            : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected
                              ? AppTheme.primary
                              : AppTheme.borderLight,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            addr['label'] == 'Home'
                                ? Icons.home_outlined
                                : Icons.work_outline,
                            size: 20,
                            color: isSelected
                                ? AppTheme.primary
                                : AppTheme.textMuted,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  (addr['recipientName'] ??
                                          addr['fullName'] ??
                                          addr['name'] ??
                                          'Address')
                                      .toString(),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 14,
                                  ),
                                ),
                                Text(
                                  '${addr['street']}, ${addr['city']}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppTheme.textSecondary,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          if (isSelected)
                            const Icon(
                              Icons.check_circle,
                              color: AppTheme.primary,
                              size: 20,
                            ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 24),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                context
                    .push('/profile/addresses/add')
                    .then((_) => _loadAddresses());
              },
              child: const Text(
                '+ ADD NEW ADDRESS',
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 11,
                  color: AppTheme.primary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _addressController.dispose();
    _referenceController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final x = await picker.pickImage(source: ImageSource.gallery);
    if (x == null) return;
    setState(() => _receiptFile = File(x.path));
    try {
      final formData = FormData.fromMap({
        'image': await MultipartFile.fromFile(x.path, filename: 'receipt.jpg'),
      });
      final res = await ApiClient().postMultipart('/upload', data: formData);
      if (res.data is Map && (res.data as Map)['url'] != null) {
        setState(() => _receiptImageUrl = (res.data as Map)['url'].toString());
      }
    } catch (_) {}
  }

  Future<void> _submitOrder() async {
    if (_addressController.text.trim().isEmpty ||
        _phoneController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please complete shipping details.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    final cart = context.read<CartProvider>();
    final itemsToBuy = cart.selectedItems;
    if (itemsToBuy.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No items selected for checkout.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    setState(() => _isOrdering = true);
    try {
      final normalizedPaymentMethod = _paymentMethod;

      final orderData = {
        'items': itemsToBuy
            .map(
              (i) => {
                'product': i.product.id,
                'quantity': i.quantity,
                'price': i.product.price,
                'color': i.color,
                'design': i.design,
                'size': i.size,
              },
            )
            .toList(),
        'totalAmount': cart.selectedTotal,
        'paymentMethod': normalizedPaymentMethod,
        'addressId': _selectedAddress?['id'],
        'shippingAddress': _selectedAddress != null
            ? {
                'name':
                    _selectedAddress!['recipientName'] ??
                    _selectedAddress!['fullName'] ??
                    '',
                'phone':
                    _selectedAddress!['phone'] ??
                    _selectedAddress!['phoneNumber'] ??
                    '',
                'houseNo': _selectedAddress!['houseNo'] ?? '',
                'street': _selectedAddress!['street'] ?? '',
                'barangay': _selectedAddress!['barangay'] ?? '',
                'city': _selectedAddress!['city'] ?? '',
                'province': _selectedAddress!['province'] ?? '',
                'postalCode': _selectedAddress!['postalCode'] ?? '',
                'latitude': _selectedAddress!['latitude'],
                'longitude': _selectedAddress!['longitude'],
              }
            : '${_addressController.text.trim()} | Contact: ${_phoneController.text.trim()}',
        'paymentReference':
            (_paymentMethod == 'GCash' || _paymentMethod == 'Maya')
            ? _referenceController.text.trim()
            : null,
        'receiptImage': (_paymentMethod == 'GCash' || _paymentMethod == 'Maya')
            ? _receiptImageUrl
            : null,
      };
      await ApiClient().post('/orders', data: orderData);
      if (!mounted) return;
      context.read<CartProvider>().clearCart();
      setState(() {
        _orderComplete = true;
        _isOrdering = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Order placed successfully!'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: AppTheme.darkSection,
          ),
        );
      }
    } catch (e) {
      setState(() => _isOrdering = false);
      if (mounted) {
        String message = 'Order failed. Please check your cart and try again.';
        if (e is DioException) {
          final data = e.response?.data;
          if (data is Map && data['message'] != null) {
            message = data['message'].toString();
          } else if (e.message != null && e.message!.isNotEmpty) {
            message = e.message!;
          }
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final cart = context.watch<CartProvider>();
    final selectedItems = cart.selectedItems.isNotEmpty
        ? cart.selectedItems
        : cart.items;
    final seller = selectedItems.isNotEmpty
        ? selectedItems.first.product.seller
        : null;
    if (!auth.isLoggedIn) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/');
      });
      return const SizedBox.shrink();
    }
    if (cart.items.isEmpty && !_orderComplete) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/home');
      });
      return const SizedBox.shrink();
    }
    if (_orderComplete) {
      return Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.verified_outlined,
                  size: 80,
                  color: AppTheme.primary,
                ),
                const SizedBox(height: 32),
                Text(
                  'ORDER PLACED',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 3,
                    color: AppTheme.textMuted,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Heritage en route',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 32,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.charcoal,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Thank you for supporting Lumban craftsmanship. Your order has been received and is being prepared.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 14,
                    height: 1.6,
                  ),
                ),
                const SizedBox(height: 60),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => context.go('/orders'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    child: const Text(
                      'VIEW MY ORDERS',
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => context.go('/home'),
                  child: const Text(
                    'RETURN TO SHOP',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                      letterSpacing: 1,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: const LumBarongAppBar(title: 'Checkout', showBack: true),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const _SectionLabel(text: 'SHIPPING DETAILS'),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(
                  color: AppTheme.borderLight.withValues(alpha: 0.5),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(
                            Icons.location_on_outlined,
                            size: 14,
                            color: AppTheme.primary,
                          ),
                          SizedBox(width: 6),
                          Text(
                            'ADDRESS',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              color: AppTheme.textMuted,
                              letterSpacing: 1,
                            ),
                          ),
                        ],
                      ),
                      GestureDetector(
                        onTap: _showAddressPicker,
                        child: const Text(
                          'CHANGE',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.primary,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _addressController.text.isEmpty
                        ? 'Select an address'
                        : _addressController.text,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.charcoal,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Phone: ${_phoneController.text.isEmpty ? "N/A" : _phoneController.text}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            const _SectionLabel(text: 'PAYMENT METHOD'),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: Column(
                children: [
                  RadioListTile<String>(
                    activeColor: AppTheme.primary,
                    title: const Text(
                      'GCash',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    subtitle: const Text(
                      'Direct payment transfer',
                      style: TextStyle(fontSize: 12),
                    ),
                    value: 'GCash',
                    groupValue: _paymentMethod,
                    onChanged: (v) => setState(() => _paymentMethod = v!),
                  ),
                  const Divider(height: 1, indent: 64),
                  RadioListTile<String>(
                    activeColor: AppTheme.primary,
                    title: const Text(
                      'Maya',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    subtitle: const Text(
                      'Digital wallet transfer',
                      style: TextStyle(fontSize: 12),
                    ),
                    value: 'Maya',
                    groupValue: _paymentMethod,
                    onChanged: (v) => setState(() => _paymentMethod = v!),
                  ),
                ],
              ),
            ),
            if (_paymentMethod == 'GCash' || _paymentMethod == 'Maya') ...[
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: _paymentMethod == 'GCash'
                      ? const Color(0xFFEFF6FF)
                      : const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: _paymentMethod == 'GCash'
                        ? const Color(0xFFBFDBFE)
                        : const Color(0xFFBBF7D0),
                  ),
                ),
                child: Column(
                  children: [
                    Text(
                      '${_paymentMethod.toUpperCase()} PAYMENT DETAILS',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5,
                        color: _paymentMethod == 'GCash'
                            ? const Color(0xFF1E40AF)
                            : const Color(0xFF15803D),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _paymentMethod == 'GCash'
                          ? (seller?.gcashNumber ?? '0954 172 7787')
                          : (seller?.mayaNumber ?? '0954 172 7787'),
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        color: _paymentMethod == 'GCash'
                            ? const Color(0xFF1E3A8A)
                            : const Color(0xFF166534),
                      ),
                    ),
                    Text(
                      seller?.name ?? 'LumbaRong Artisan',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: _paymentMethod == 'GCash'
                            ? const Color(0xFF3B82F6)
                            : const Color(0xFF22C55E),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              _SectionLabel(
                text: '${_paymentMethod.toUpperCase()} VERIFICATION',
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _referenceController,
                decoration: InputDecoration(
                  labelText: 'Reference Number',
                  prefixIcon: const Icon(Icons.numbers_rounded),
                ),
              ),
              const SizedBox(height: 16),
              GestureDetector(
                onTap: _pickImage,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppTheme.borderLight,
                      style: BorderStyle.solid,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.cloud_upload_outlined,
                        color: _receiptFile != null
                            ? const Color(0xFF10B981)
                            : AppTheme.primary,
                      ),
                      const SizedBox(width: 16),
                      Text(
                        _receiptFile != null
                            ? 'Receipt Snapshot Ready'
                            : 'Upload Payment Receipt',
                        style: TextStyle(
                          color: _receiptFile != null
                              ? const Color(0xFF059669)
                              : AppTheme.textPrimary,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                      const Spacer(),
                      if (_receiptFile != null)
                        const Icon(
                          Icons.check_circle_rounded,
                          color: Color(0xFF10B981),
                          size: 20,
                        ),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 48),
            const SizedBox(height: 48),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(
                  color: AppTheme.borderLight.withValues(alpha: 0.5),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 10,
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total Investment',
                        style: TextStyle(
                          color: AppTheme.textMuted,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                      Text(
                        '₱${cart.selectedTotal.toStringAsFixed(0)}',
                        style: GoogleFonts.playfairDisplay(
                          color: AppTheme.primary,
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isOrdering ? null : _submitOrder,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(4),
                        ),
                        elevation: 0,
                      ),
                      child: _isOrdering
                          ? const CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            )
                          : const Text(
                              'CONFIRM PURCHASE',
                              style: TextStyle(
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1,
                                color: Colors.white,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel({required this.text});

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.5,
        color: AppTheme.textMuted,
      ),
    );
  }
}
