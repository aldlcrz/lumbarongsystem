import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../widgets/app_navbar.dart';

class SellerOrdersScreen extends StatefulWidget {
  const SellerOrdersScreen({super.key});

  @override
  State<SellerOrdersScreen> createState() => _SellerOrdersScreenState();
}

class _SellerOrdersScreenState extends State<SellerOrdersScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _orders = [];
  List<Map<String, dynamic>> _filtered = [];
  bool _loading = true;
  String _searchQuery = '';

  static const _tabs = [
    'All',
    'Pending',
    'Processing',
    'Shipped',
    'Delivered',
    'Completed',
    'Cancelled',
  ];
  static const _statusCycle = [
    'Pending',
    'Processing',
    'Shipped',
    'Delivered',
    'Completed',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(() => _applyFilter());
    _loadOrders();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadOrders() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient().get('/orders/seller');
      if (mounted && res.data is List) {
        _orders = (res.data as List)
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
        _applyFilter();
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  void _applyFilter() {
    final tab = _tabs[_tabController.index];
    final q = _searchQuery.toLowerCase();
    setState(() {
      _filtered = _orders.where((o) {
        final status = (o['status']?.toString() ?? '').trim();
        final statusLower = status.toLowerCase();
        final isCancelled = statusLower == 'cancelled';
        final isCompleted = statusLower == 'completed';

        final matchesTab = tab == 'All'
            ? !isCancelled && !isCompleted
            : statusLower == tab.toLowerCase();
        final orderId = o['id']?.toString() ?? '';
        final customerName =
            (o['customer']?['name'] ?? o['buyer']?['name'] ?? '')
                .toString()
                .toLowerCase();
        final matchesSearch =
            q.isEmpty ||
            orderId.toLowerCase().contains(q) ||
            customerName.contains(q);
        return matchesTab && matchesSearch;
      }).toList();
    });
  }

  Future<void> _updateStatus(String orderId, String status) async {
    try {
      await ApiClient().put(
        '/orders/$orderId/status',
        data: {'status': status},
      );
      if (mounted) {
        _showSuccess('Order marked as $status');
        _loadOrders();
      }
    } catch (_) {
      _showError('Failed to update status');
    }
  }

  void _showSuccess(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        behavior: SnackBarBehavior.floating,
        backgroundColor: const Color(0xFF10B981),
      ),
    );
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        behavior: SnackBarBehavior.floating,
        backgroundColor: Colors.red,
      ),
    );
  }

  void _openOrderDetail(Map<String, dynamic> order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _OrderDetailSheet(
        order: order,
        statusCycle: _statusCycle,
        onUpdateStatus: (s) => _updateStatus(order['id'].toString(), s),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn || auth.user!.role != 'seller') {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/');
      });
      return const SizedBox.shrink();
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF9F6F2),
      appBar: const LumBarongAppBar(title: 'Order Registry', showBack: true),
      bottomNavigationBar: const AppBottomNav(currentIndex: 1),
      body: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
            color: const Color(0xFFF9F6F2),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 32,
                      height: 2,
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'WORKSHOP LOG',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.primary,
                        letterSpacing: 2,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Order\nRegistry',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.charcoal,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 20),
                // Search
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: TextField(
                    onChanged: (v) {
                      _searchQuery = v;
                      _applyFilter();
                    },
                    decoration: const InputDecoration(
                      hintText: 'Search by order ID or customer...',
                      hintStyle: TextStyle(
                        fontSize: 12,
                        color: AppTheme.textMuted,
                      ),
                      prefixIcon: Icon(
                        Icons.search,
                        color: AppTheme.textMuted,
                        size: 20,
                      ),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Tab bar
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _tabs.asMap().entries.map((entry) {
                      final i = entry.key;
                      final tab = entry.value;
                      final active = _tabController.index == i;
                      return GestureDetector(
                        onTap: () => _tabController.animateTo(i),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          margin: const EdgeInsets.only(right: 8),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: active ? AppTheme.primary : Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: active
                                  ? AppTheme.primary
                                  : AppTheme.borderLight,
                            ),
                          ),
                          child: Text(
                            tab.toUpperCase(),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1,
                              color: active ? Colors.white : AppTheme.textMuted,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),

          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: AppTheme.primary),
                  )
                : _filtered.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.shopping_bag_outlined,
                          size: 64,
                          color: AppTheme.textMuted.withValues(alpha: 0.2),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'No orders in this registry sector.',
                          style: TextStyle(
                            color: AppTheme.textMuted,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    color: AppTheme.primary,
                    onRefresh: _loadOrders,
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                      itemCount: _filtered.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: 16),
                      itemBuilder: (ctx, i) => _OrderCard(
                        order: _filtered[i],
                        statusCycle: _statusCycle,
                        onView: () => _openOrderDetail(_filtered[i]),
                        onUpdateStatus: (s) =>
                            _updateStatus(_filtered[i]['id'].toString(), s),
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final Map<String, dynamic> order;
  final List<String> statusCycle;
  final VoidCallback onView;
  final void Function(String) onUpdateStatus;

  const _OrderCard({
    required this.order,
    required this.statusCycle,
    required this.onView,
    required this.onUpdateStatus,
  });

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return const Color(0xFF10B981);
      case 'processing':
        return const Color(0xFF6366F1);
      case 'shipped':
        return const Color(0xFF3B82F6);
      case 'pending':
        return Colors.orange;
      case 'cancelled':
        return Colors.red;
      default:
        return AppTheme.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = order['status']?.toString() ?? 'pending';
    final orderId = order['id']?.toString() ?? '';
    final shortId = orderId.length > 8
        ? '#LB-${orderId.substring(0, 8).toUpperCase()}'
        : '#LB-$orderId';
    final customer =
        (order['customer'] as Map?) ?? (order['buyer'] as Map?) ?? {};
    final items =
        (order['items'] as List?) ?? (order['orderItems'] as List?) ?? [];
    final total = order['totalAmount'] ?? order['totalPrice'] ?? 0;

    final currentIdx = statusCycle.indexWhere(
      (s) => s.toLowerCase() == status.toLowerCase(),
    );
    final nextStatus = currentIdx >= 0 && currentIdx < statusCycle.length - 1
        ? statusCycle[currentIdx + 1]
        : null;

    return Container(
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
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      shortId,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                        color: AppTheme.charcoal,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _statusColor(status).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: _statusColor(status).withValues(alpha: 0.3),
                        ),
                      ),
                      child: Text(
                        status.toUpperCase(),
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          color: _statusColor(status),
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                // Progress dots
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Row(
                    children: List.generate(statusCycle.length, (i) {
                      final isCompleted = i < currentIdx;
                      final isActive = i == currentIdx;
                      return Expanded(
                        child: Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isCompleted
                                    ? const Color(0xFF10B981)
                                    : isActive
                                    ? AppTheme.primary
                                    : AppTheme.borderLight,
                              ),
                            ),
                            if (i < statusCycle.length - 1)
                              Expanded(
                                child: Container(
                                  height: 1.5,
                                  color: i < currentIdx
                                      ? const Color(0xFF10B981)
                                      : AppTheme.borderLight,
                                ),
                              ),
                          ],
                        ),
                      );
                    }),
                  ),
                ),
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppTheme.darkSection,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Text(
                          customer['name']
                                  ?.toString()
                                  .substring(0, 1)
                                  .toUpperCase() ??
                              'C',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            customer['name']?.toString() ?? 'Guest Buyer',
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 14,
                              color: AppTheme.charcoal,
                            ),
                          ),
                          Text(
                            '${items.length} piece(s) • ₱${total.toString()}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: onView,
                      icon: const Icon(Icons.open_in_new, size: 18),
                      style: IconButton.styleFrom(
                        backgroundColor: AppTheme.background,
                        foregroundColor: AppTheme.textMuted,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          if (nextStatus != null)
            InkWell(
              onTap: () => onUpdateStatus(nextStatus),
              borderRadius: const BorderRadius.vertical(
                bottom: Radius.circular(24),
              ),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.06),
                  borderRadius: const BorderRadius.vertical(
                    bottom: Radius.circular(24),
                  ),
                ),
                child: Text(
                  'MARK AS ${nextStatus.toUpperCase()} →',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.primary,
                    letterSpacing: 1.5,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _OrderDetailSheet extends StatelessWidget {
  final Map<String, dynamic> order;
  final List<String> statusCycle;
  final void Function(String) onUpdateStatus;

  const _OrderDetailSheet({
    required this.order,
    required this.statusCycle,
    required this.onUpdateStatus,
  });

  String _formatAddress(dynamic address) {
    if (address == null) return 'Lumban, Laguna, Philippines';

    if (address is String) {
      final raw = address.trim();
      if (raw.isEmpty) return 'Lumban, Laguna, Philippines';
      try {
        final decoded = jsonDecode(raw);
        if (decoded is Map) {
          return _formatAddress(decoded);
        }
      } catch (_) {
        return raw;
      }
      return raw;
    }

    if (address is Map) {
      final map = Map<String, dynamic>.from(address);
      final name =
          (map['name'] ?? map['recipientName'] ?? map['fullName'] ?? '')
              .toString()
              .trim();
      final phone = (map['phone'] ?? map['phoneNumber'] ?? '')
          .toString()
          .trim();
      final houseNo = (map['houseNo'] ?? '').toString().trim();
      final street = (map['street'] ?? '').toString().trim();
      final barangay = (map['barangay'] ?? '').toString().trim();
      final city = (map['city'] ?? '').toString().trim();
      final province = (map['province'] ?? '').toString().trim();
      final postalCode = (map['postalCode'] ?? '').toString().trim();

      final line1 = [houseNo, street].where((e) => e.isNotEmpty).join(', ');
      final line2 = [
        barangay,
        city,
        province,
        postalCode,
      ].where((e) => e.isNotEmpty).join(', ');

      final lines = <String>[];
      if (name.isNotEmpty) lines.add(name);
      if (line1.isNotEmpty) lines.add(line1);
      if (line2.isNotEmpty) lines.add(line2);
      if (phone.isNotEmpty) lines.add('Phone: $phone');

      if (lines.isNotEmpty) return lines.join('\n');
      return 'Lumban, Laguna, Philippines';
    }

    return 'Lumban, Laguna, Philippines';
  }

  @override
  Widget build(BuildContext context) {
    final status = order['status']?.toString() ?? 'pending';
    final orderId = order['id']?.toString() ?? '';
    final shortId = orderId.length > 8
        ? orderId.substring(0, 8).toUpperCase()
        : orderId;
    final customer =
        (order['customer'] as Map?) ?? (order['buyer'] as Map?) ?? {};
    final items =
        (order['items'] as List?) ?? (order['orderItems'] as List?) ?? [];
    final total = order['totalAmount'] ?? order['totalPrice'] ?? 0;
    final currentIdx = statusCycle.indexWhere(
      (s) => s.toLowerCase() == status.toLowerCase(),
    );

    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      maxChildSize: 0.97,
      minChildSize: 0.5,
      builder: (_, controller) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          children: [
            // Handle + header
            Container(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(32),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppTheme.borderLight,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Commission Details',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                color: AppTheme.primary,
                                letterSpacing: 1.5,
                              ),
                            ),
                            Text(
                              'Order #LB-$shortId',
                              style: GoogleFonts.playfairDisplay(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.charcoal,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close),
                        style: IconButton.styleFrom(
                          backgroundColor: AppTheme.background,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            Expanded(
              child: ListView(
                controller: controller,
                padding: const EdgeInsets.all(24),
                children: [
                  // Progress Stepper
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF9F6F2),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppTheme.borderLight),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: statusCycle.asMap().entries.map((entry) {
                            final i = entry.key;
                            final step = entry.value;
                            final isCompleted = i < currentIdx;
                            final isActive = i == currentIdx;
                            return Expanded(
                              child: Column(
                                children: [
                                  Row(
                                    children: [
                                      GestureDetector(
                                        onTap: () {
                                          Navigator.pop(context);
                                          onUpdateStatus(step);
                                        },
                                        child: Container(
                                          width: 36,
                                          height: 36,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: isCompleted
                                                ? const Color(0xFF10B981)
                                                : isActive
                                                ? AppTheme.primary
                                                : Colors.white,
                                            border: Border.all(
                                              color: isCompleted
                                                  ? const Color(0xFF10B981)
                                                  : isActive
                                                  ? AppTheme.primary
                                                  : AppTheme.borderLight,
                                              width: 2,
                                            ),
                                          ),
                                          child: Center(
                                            child: isCompleted
                                                ? const Icon(
                                                    Icons.check,
                                                    size: 14,
                                                    color: Colors.white,
                                                  )
                                                : Text(
                                                    '${i + 1}',
                                                    style: TextStyle(
                                                      fontSize: 11,
                                                      fontWeight:
                                                          FontWeight.w900,
                                                      color: isActive
                                                          ? Colors.white
                                                          : AppTheme.textMuted,
                                                    ),
                                                  ),
                                          ),
                                        ),
                                      ),
                                      if (i < statusCycle.length - 1)
                                        Expanded(
                                          child: Container(
                                            height: 2,
                                            color: i < currentIdx
                                                ? const Color(0xFF10B981)
                                                : AppTheme.borderLight,
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    step.toUpperCase(),
                                    style: TextStyle(
                                      fontSize: 7,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 0.5,
                                      color: isActive
                                          ? AppTheme.primary
                                          : AppTheme.textMuted,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Client Info
                  _SheetSection(
                    icon: Icons.location_on_outlined,
                    title: 'Client Information',
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: AppTheme.darkSection,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Center(
                                child: Text(
                                  customer['name']
                                          ?.toString()
                                          .substring(0, 1)
                                          .toUpperCase() ??
                                      'C',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 20,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    customer['name']?.toString() ?? 'Customer',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                      color: AppTheme.charcoal,
                                    ),
                                  ),
                                  Text(
                                    customer['email']?.toString() ?? '',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: AppTheme.textMuted,
                                      fontStyle: FontStyle.italic,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.background,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'SHIPPING LOGISTICS',
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900,
                                  color: AppTheme.textMuted,
                                  letterSpacing: 1,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _formatAddress(order['shippingAddress']),
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.charcoal,
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Payment
                  _SheetSection(
                    icon: Icons.credit_card_outlined,
                    title: 'Payment Summary',
                    child: Row(
                      children: [
                        Expanded(
                          child: _MetaItem(
                            label: 'SETTLEMENT METHOD',
                            value: (order['paymentMethod']?.toString() ?? 'N/A')
                                .toUpperCase(),
                          ),
                        ),
                        Expanded(
                          child: _MetaItem(
                            label: 'ORDER STATUS',
                            value: status.toUpperCase(),
                            valueColor: AppTheme.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Order Items
                  _SheetSection(
                    icon: Icons.shopping_bag_outlined,
                    title: 'Requested Pieces',
                    child: Column(
                      children: [
                        ...items.map((item) {
                          final product = item['product'] as Map? ?? {};
                          final rawImg = product['image'];
                          String? thumbUrl;
                          if (rawImg is List && rawImg.isNotEmpty) {
                            thumbUrl = rawImg.first is String
                                ? rawImg.first
                                : (rawImg.first is Map
                                      ? rawImg.first['url']?.toString()
                                      : null);
                          } else if (rawImg is String && rawImg.isNotEmpty) {
                            thumbUrl = rawImg;
                          }
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppTheme.background,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppTheme.borderLight),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 64,
                                  height: 64,
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: AppTheme.borderLight,
                                    ),
                                  ),
                                  clipBehavior: Clip.antiAlias,
                                  child: thumbUrl != null
                                      ? CachedNetworkImage(
                                          imageUrl: thumbUrl,
                                          fit: BoxFit.cover,
                                          errorWidget: (context, url, error) =>
                                              const Icon(
                                                Icons.inventory_2,
                                                color: AppTheme.borderLight,
                                              ),
                                        )
                                      : const Icon(
                                          Icons.inventory_2,
                                          color: AppTheme.borderLight,
                                        ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        product['name']?.toString() ??
                                            'Product',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 13,
                                          color: AppTheme.charcoal,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      Text(
                                        'Qty: ${item['quantity']} × ₱${item['price']}',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: AppTheme.textMuted,
                                        ),
                                      ),
                                      if (item['variant'] != null)
                                        Container(
                                          margin: const EdgeInsets.only(top: 4),
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(
                                              6,
                                            ),
                                            border: Border.all(
                                              color: AppTheme.borderLight,
                                            ),
                                          ),
                                          child: Text(
                                            item['variant'].toString(),
                                            style: const TextStyle(
                                              fontSize: 9,
                                              fontWeight: FontWeight.w900,
                                              color: AppTheme.textMuted,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.darkSection,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'GRAND TOTAL',
                                style: TextStyle(
                                  color: Colors.white60,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1,
                                ),
                              ),
                              Text(
                                '₱${total.toString()}',
                                style: GoogleFonts.playfairDisplay(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SheetSection extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget child;
  const _SheetSection({
    required this.icon,
    required this.title,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
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
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: Colors.white, size: 16),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: GoogleFonts.playfairDisplay(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.charcoal,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

class _MetaItem extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  const _MetaItem({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w900,
            color: AppTheme.textMuted,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: valueColor ?? AppTheme.charcoal,
          ),
        ),
      ],
    );
  }
}
