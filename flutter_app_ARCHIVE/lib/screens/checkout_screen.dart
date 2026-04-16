// ignore_for_file: deprecated_member_use
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import '../config/app_theme.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../services/api_client.dart';
import 'widgets/app_navbar.dart';

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
            _phoneController.text = _selectedAddress!['phoneNumber'] ?? '';
            _addressController.text =
                '${_selectedAddress!['fullName']} | ${_selectedAddress!['street']}, ${_selectedAddress!['barangay']}, ${_selectedAddress!['city']}, ${_selectedAddress!['province']} ${_selectedAddress!['postalCode']}';
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
                        _phoneController.text = addr['phoneNumber'] ?? '';
                        _addressController.text =
                            '${addr['fullName']} | ${addr['street']}, ${addr['barangay']}, ${addr['city']}, ${addr['province']} ${addr['postalCode']}';
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
                                  addr['fullName'] ?? 'Address',
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
    if (cart.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cart is empty.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    setState(() => _isOrdering = true);
    try {
      final orderData = {
        'items': cart.items
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
        'totalAmount': cart.cartTotal,
        'paymentMethod': _paymentMethod,
        'shippingAddress':
            '${_addressController.text.trim()} | Contact: ${_phoneController.text.trim()}',
        'referenceNumber': _paymentMethod == 'GCash'
            ? _referenceController.text.trim()
            : null,
        'receiptImage': _paymentMethod == 'GCash' ? _receiptImageUrl : null,
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Order failed: ${e.toString()}'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final cart = context.watch<CartProvider>();
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
      return BarongScaffold(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: const BoxDecoration(
                    color: Color(0xFF10B981),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_rounded,
                    size: 48,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 32),
                const Text(
                  'ORDER PLACED',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 2,
                    color: AppTheme.primary,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Heritage en route',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Thank you for supporting Lumban craftsmanship. Your order has been received.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppTheme.textSecondary, height: 1.5),
                ),
                const SizedBox(height: 48),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => context.go('/orders'),
                    child: const Text('VIEW MY ORDERS'),
                  ),
                ),
                TextButton(
                  onPressed: () => context.go('/home'),
                  child: const Text(
                    'RETURN TO SHOP',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                      letterSpacing: 1,
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
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'CONTACT PHONE',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textMuted,
                        ),
                      ),
                      if (_addresses.isNotEmpty)
                        TextButton(
                          onPressed: _showAddressPicker,
                          style: TextButton.styleFrom(
                            padding: EdgeInsets.zero,
                            minimumSize: const Size(0, 0),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Text(
                            'CHANGE',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              color: AppTheme.primary,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _phoneController.text.isEmpty
                        ? 'Not set'
                        : _phoneController.text,
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      color: AppTheme.textPrimary,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'SHIPPING ADDRESS',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textMuted,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _addressController.text.isEmpty
                        ? 'No address selected'
                        : _addressController.text,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textSecondary,
                      height: 1.5,
                      fontSize: 13,
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
                      'Cash on Delivery',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    subtitle: const Text(
                      'Pay when you receive',
                      style: TextStyle(fontSize: 12),
                    ),
                    value: 'COD',
                    groupValue: _paymentMethod,
                    onChanged: (v) => setState(() => _paymentMethod = v!),
                  ),
                ],
              ),
            ),
            if (_paymentMethod == 'GCash') ...[
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFBFDBFE)),
                ),
                child: const Column(
                  children: [
                    Text(
                      'GCASH PAYMENT DETAILS',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5,
                        color: Color(0xFF1E40AF),
                      ),
                    ),
                    SizedBox(height: 12),
                    Text(
                      '0954 172 7787',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF1E3A8A),
                      ),
                    ),
                    Text(
                      'Aldrin C.',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF3B82F6),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const _SectionLabel(text: 'GCASH VERIFICATION'),
              const SizedBox(height: 16),
              TextFormField(
                controller: _referenceController,
                decoration: const InputDecoration(
                  labelText: 'Reference Number',
                  prefixIcon: Icon(Icons.numbers_rounded),
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
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppTheme.darkSection,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total Investment',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        '₱${cart.cartTotal.toStringAsFixed(0)}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isOrdering ? null : _submitOrder,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                      ),
                      child: _isOrdering
                          ? const SizedBox(
                              height: 24,
                              width: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text(
                              'CONFIRM PURCHASE',
                              style: TextStyle(letterSpacing: 1),
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
