import 'dart:convert';
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../config/app_theme.dart';
import '../../models/order.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../../services/socket_service.dart';
import '../widgets/app_navbar.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  StreamSubscription? _orderUpdateSub;
  List<OrderModel> orders = [];
  List<OrderModel> _filtered = [];
  bool loading = true;
  bool _loadError = false;
  String _searchQuery = '';
  static const _tabs = [
    'ALL',
    'PENDING',
    'TO SHIP',
    'TO RECEIVE',
    'COMPLETED',
    'CANCELLED',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(() => _applyFilter());
    _load();
    _initializeRealtimeUpdates();
  }

  @override
  void dispose() {
    _orderUpdateSub?.cancel();
    _tabController.dispose();
    super.dispose();
  }

  void _initializeRealtimeUpdates() {
    final socketService = SocketService();
    _orderUpdateSub = socketService.orderUpdateStream.listen((update) {
      _handleOrderUpdate(update);
    });
  }

  void _handleOrderUpdate(Map<String, dynamic> update) {
    final orderId = update['orderId']?.toString();
    final newStatus = update['status']?.toString();
    if (orderId == null || newStatus == null) return;
    final index = orders.indexWhere((o) => o.id == orderId);
    if (index != -1) {
      orders[index] = orders[index].copyWith(status: newStatus);
      _applyFilter();
      if (mounted)
        debugPrint('[OrdersScreen] Order $orderId updated to $newStatus');
    }
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent && mounted) {
      setState(() {
        loading = true;
        _loadError = false;
      });
    }
    try {
      final res = await ApiClient().get('/orders/my-orders');
      if (res.data is List) {
        final nextOrders = (res.data as List)
            .map(
              (e) => OrderModel.fromJson(Map<String, dynamic>.from(e as Map)),
            )
            .toList();

        if (!mounted) return;
        setState(() {
          orders = nextOrders;
          loading = false;
          _loadError = false;
        });
        _applyFilter();
      } else if (mounted && !silent) {
        setState(() {
          loading = false;
          _loadError = true;
        });
      }
    } catch (_) {
      if (mounted && !silent) {
        setState(() {
          loading = false;
          _loadError = true;
        });
      }
    }
  }

  void _applyFilter() {
    final tab = _tabs[_tabController.index].toLowerCase();
    final q = _searchQuery.toLowerCase();
    final filtered = orders.where((o) {
      final status = o.status.toLowerCase();
      final matchesTab = tab == 'all'
          ? status != 'cancelled'
          : (tab == 'pending' && status == 'pending') ||
                (tab == 'to ship' &&
                    (status == 'processing' || status == 'to ship')) ||
                (tab == 'to receive' && status == 'shipped') ||
                (tab == 'completed' &&
                    (status == 'delivered' || status == 'completed')) ||
                (tab == 'cancelled' && status == 'cancelled');

      final matchesSearch =
          q.isEmpty ||
          o.id.toLowerCase().contains(q) ||
          o.items.any((i) => (i.product?.name ?? '').toLowerCase().contains(q));

      return matchesTab && matchesSearch;
    }).toList();

    if (!mounted) return;
    setState(() => _filtered = filtered);
  }

  void _openOrderDetail(OrderModel order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _OrderDetailSheet(
        order: order,
        onCancel: () => _cancelOrder(order.id),
      ),
    );
  }

  Future<void> _cancelOrder(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Order'),
        content: const Text(
          'Are you sure you want to cancel this order? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('NO'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('YES, CANCEL'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ApiClient().patch('/orders/$id/cancel');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Order cancelled successfully'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        _load();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to cancel order'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/');
      });
      return const SizedBox.shrink();
    }
    final fmt = NumberFormat.currency(
      locale: 'en_PH',
      symbol: '₱',
      decimalDigits: 0,
    );
    return Scaffold(
      backgroundColor: const Color(0xFFF9F6F2),
      appBar: const LumBarongAppBar(title: 'My Orders', showBack: true),
      bottomNavigationBar: const AppBottomNav(currentIndex: 1),
      body: Column(
        children: [
          // Header + Search + Tabs
          Container(
            padding: const EdgeInsets.fromLTRB(
              24,
              12,
              24,
              0,
            ), // Reduced top padding from 24 to 12
            color: const Color(0xFFF9F6F2),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                // Search bar Row
                Container(
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.borderLight),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.03),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: TextField(
                    onChanged: (v) {
                      _searchQuery = v;
                      _applyFilter();
                    },
                    decoration: const InputDecoration(
                      hintText: 'Search by order or product...',
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
                      contentPadding: EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                // Tabs
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: List.generate(_tabs.length, (i) {
                      final label = _tabs[i];
                      final active = _tabController.index == i;
                      return GestureDetector(
                        onTap: () => _tabController.animateTo(i),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          margin: const EdgeInsets.only(right: 24),
                          padding: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            border: Border(
                              bottom: BorderSide(
                                color: active
                                    ? AppTheme.primary
                                    : Colors.transparent,
                                width: 3,
                              ),
                            ),
                          ),
                          child: Text(
                            label,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: active
                                  ? FontWeight.w900
                                  : FontWeight.w700,
                              color: active
                                  ? AppTheme.primary
                                  : AppTheme.textMuted,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ),
                const SizedBox(height: 4),
                const Divider(height: 1, color: Color(0xFFEEE4D8)),
              ],
            ),
          ),

          Expanded(
            child: loading
                ? const Center(
                    child: CircularProgressIndicator(color: AppTheme.primary),
                  )
                : _loadError
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.wifi_off_rounded,
                          size: 52,
                          color: AppTheme.textMuted,
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Unable to load orders.',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppTheme.textMuted,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: _load,
                          child: const Text('Try again'),
                        ),
                      ],
                    ),
                  )
                : _filtered.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.receipt_long_outlined,
                          size: 80,
                          color: AppTheme.textMuted.withOpacity(0.2),
                        ),
                        const SizedBox(height: 24),
                        const Text(
                          'No matching orders found.',
                          style: TextStyle(
                            fontSize: 16,
                            color: AppTheme.textMuted,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    color: AppTheme.primary,
                    onRefresh: _load,
                    child: ListView.separated(
                      padding: const EdgeInsets.all(24),
                      itemCount: _filtered.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: 16),
                      itemBuilder: (_, i) {
                        final o = _filtered[i];
                        return InkWell(
                          onTap: () => _openOrderDetail(o),
                          borderRadius: BorderRadius.circular(24),
                          child: Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(color: AppTheme.borderLight),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.03),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primary.withOpacity(0.05),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.inventory_2_outlined,
                                    color: AppTheme.primary,
                                    size: 24,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'ORDER #${o.id.substring(0, 8).toUpperCase()}',
                                                style: const TextStyle(
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.w800,
                                                  letterSpacing: 1,
                                                  color: AppTheme.textMuted,
                                                ),
                                              ),
                                              if (o.createdAt != null) ...[
                                                const SizedBox(height: 4),
                                                Row(
                                                  children: [
                                                    const Icon(
                                                      Icons
                                                          .calendar_today_outlined,
                                                      size: 12,
                                                      color: AppTheme.textMuted,
                                                    ),
                                                    const SizedBox(width: 6),
                                                    Text(
                                                      DateFormat('MMM d, yyyy')
                                                          .format(o.createdAt!)
                                                          .toUpperCase(),
                                                      style: const TextStyle(
                                                        fontSize: 10,
                                                        fontWeight:
                                                            FontWeight.w800,
                                                        color:
                                                            AppTheme.textMuted,
                                                        letterSpacing: 0.3,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ],
                                            ],
                                          ),
                                          Text(
                                            fmt.format(o.totalAmount),
                                            style: const TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w900,
                                              color: AppTheme.primary,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 12),
                                      ...o.items.map(
                                        (item) => Padding(
                                          padding: const EdgeInsets.only(
                                            bottom: 8,
                                          ),
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                item.product?.name ?? 'Piece',
                                                style: const TextStyle(
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.w900,
                                                  color: AppTheme.textPrimary,
                                                ),
                                              ),
                                              if (item.color != null ||
                                                  item.size != null ||
                                                  item.design != null)
                                                Padding(
                                                  padding:
                                                      const EdgeInsets.only(
                                                        top: 2,
                                                      ),
                                                  child: Text(
                                                    '${item.color?.toUpperCase() ?? "NONE"} | ${item.size?.toUpperCase() ?? "M"} | ${item.design?.toUpperCase() ?? "NORMAL"}',
                                                    style: const TextStyle(
                                                      fontSize: 9,
                                                      fontWeight:
                                                          FontWeight.w800,
                                                      color: AppTheme.textMuted,
                                                      letterSpacing: 0.5,
                                                    ),
                                                  ),
                                                ),
                                            ],
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      Builder(
                                        builder: (_) {
                                          final status = o.status.toLowerCase();
                                          final color = status == 'pending'
                                              ? Colors.orange
                                              : status == 'cancelled'
                                              ? Colors.red
                                              : status == 'delivered'
                                              ? const Color(0xFF10B981)
                                              : status == 'processing'
                                              ? const Color(0xFF6366F1)
                                              : status == 'shipped'
                                              ? const Color(0xFF0EA5E9)
                                              : const Color(0xFF10B981);
                                          return Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 10,
                                              vertical: 4,
                                            ),
                                            decoration: BoxDecoration(
                                              color: color.withValues(
                                                alpha: 0.1,
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Container(
                                                  width: 6,
                                                  height: 6,
                                                  decoration: BoxDecoration(
                                                    color: color,
                                                    shape: BoxShape.circle,
                                                  ),
                                                ),
                                                const SizedBox(width: 6),
                                                Text(
                                                  o.status.toUpperCase(),
                                                  style: TextStyle(
                                                    fontSize: 9,
                                                    fontWeight: FontWeight.w900,
                                                    color: color,
                                                    letterSpacing: 0.5,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          );
                                        },
                                      ),
                                    ],
                                  ),
                                ),
                                const Icon(
                                  Icons.chevron_right_rounded,
                                  color: AppTheme.textMuted,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _OrderDetailSheet extends StatelessWidget {
  final OrderModel order;
  final VoidCallback onCancel;

  const _OrderDetailSheet({required this.order, required this.onCancel});

  String _formatAddress(String address) {
    if (address.isEmpty) return 'Lumban, Laguna, Philippines';
    try {
      final dynamic parsed = jsonDecode(address);
      if (parsed is Map) {
        final map = Map<String, dynamic>.from(parsed);
        final name = (map['name'] ?? map['recipientName'] ?? '')
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

        final line1Parts = <String>[];
        if (houseNo.isNotEmpty) line1Parts.add(houseNo);
        if (street.isNotEmpty) line1Parts.add(street);

        final line2Parts = <String>[];
        if (barangay.isNotEmpty) line2Parts.add(barangay);
        if (city.isNotEmpty) line2Parts.add(city);
        if (province.isNotEmpty) line2Parts.add(province);
        if (postalCode.isNotEmpty) line2Parts.add(postalCode);

        final lines = <String>[];
        if (name.isNotEmpty) lines.add(name);
        if (line1Parts.isNotEmpty) lines.add(line1Parts.join(', '));
        if (line2Parts.isNotEmpty) lines.add(line2Parts.join(', '));
        if (phone.isNotEmpty) lines.add('Phone: $phone');

        if (lines.isNotEmpty) return lines.join('\n');
      }
    } catch (_) {
      // Address is not JSON, use raw text below.
    }
    return address;
  }

  @override
  Widget build(BuildContext context) {
    final shortId = order.id.length > 8
        ? order.id.substring(0, 8).toUpperCase()
        : order.id;
    final items = order.items;
    final total = order.totalAmount;

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
                              'Order Details',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                color: AppTheme.primary,
                                letterSpacing: 1.5,
                              ),
                            ),
                            Text(
                              'Order #LB-$shortId',
                              style: const TextStyle(
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
                  // Timeline Info (Bought/Cancelled)
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
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(
                                  Icons.calendar_today_outlined,
                                  size: 12,
                                  color: AppTheme.textMuted,
                                ),
                                const SizedBox(width: 8),
                                const Text(
                                  'DATE',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1,
                                    color: AppTheme.textMuted,
                                  ),
                                ),
                              ],
                            ),
                            Text(
                              order.createdAt != null
                                  ? DateFormat(
                                      'MMM d, yyyy',
                                    ).format(order.createdAt!).toUpperCase()
                                  : 'N/A',
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.charcoal,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                        if (order.status.toLowerCase() == 'cancelled' &&
                            order.updatedAt != null) ...[
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: Divider(
                              height: 1,
                              color: AppTheme.borderLight,
                            ),
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'CANCELLED ON',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1,
                                  color: Colors.red,
                                ),
                              ),
                              Text(
                                DateFormat(
                                  'MMM d, yyyy',
                                ).format(order.updatedAt!).toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.red,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ],
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 12),
                          child: Divider(
                            height: 1,
                            color: AppTheme.borderLight,
                          ),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'CURRENT STATUS',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1,
                                color: AppTheme.textMuted,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                order.status.toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  color: AppTheme.primary,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Shipping Info
                  _SheetSection(
                    icon: Icons.location_on_outlined,
                    title: 'Shipping Information',
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.background,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'DELIVERY ADDRESS',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              color: AppTheme.textMuted,
                              letterSpacing: 1,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _formatAddress(order.shippingAddress),
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppTheme.charcoal,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Payment
                  _SheetSection(
                    icon: Icons.credit_card_outlined,
                    title: 'Payment Details',
                    child: Row(
                      children: [
                        Expanded(
                          child: _MetaItem(
                            label: 'METHOD',
                            value: order.paymentMethod.toUpperCase(),
                          ),
                        ),
                        if (order.referenceNumber != null)
                          Expanded(
                            child: _MetaItem(
                              label: 'REF NO.',
                              value: order.referenceNumber!,
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Order Items
                  _SheetSection(
                    icon: Icons.shopping_bag_outlined,
                    title: 'Order Items',
                    child: Column(
                      children: [
                        ...items.map((item) {
                          final thumbUrl = item.product?.imageUrl;
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
                                  width: 56,
                                  height: 56,
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: AppTheme.borderLight,
                                    ),
                                  ),
                                  clipBehavior: Clip.antiAlias,
                                  child:
                                      (thumbUrl != null &&
                                          thumbUrl.trim().isNotEmpty)
                                      ? CachedNetworkImage(
                                          imageUrl: thumbUrl,
                                          fit: BoxFit.cover,
                                          errorWidget: (context, url, error) =>
                                              const Icon(
                                                Icons.inventory_2_outlined,
                                                color: AppTheme.borderLight,
                                              ),
                                        )
                                      : const Icon(
                                          Icons.inventory_2_outlined,
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
                                        item.product?.name ?? 'Piece',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 13,
                                          color: AppTheme.charcoal,
                                        ),
                                      ),
                                      Text(
                                        'Qty: ${item.quantity} × ₱${item.price.toStringAsFixed(0)}',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: AppTheme.textMuted,
                                        ),
                                      ),
                                      if (item.color != null ||
                                          item.size != null)
                                        Text(
                                          '${item.color ?? ""} | ${item.size ?? ""}',
                                          style: const TextStyle(
                                            fontSize: 10,
                                            color: AppTheme.textMuted,
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
                                'TOTAL AMOUNT',
                                style: TextStyle(
                                  color: Colors.white60,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1,
                                ),
                              ),
                              Text(
                                '₱${total.toStringAsFixed(0)}',
                                style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                  fontFamily: 'serif',
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  if (order.status.toLowerCase() == 'pending')
                    Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: InkWell(
                        onTap: () {
                          Navigator.pop(context);
                          onCancel();
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          decoration: BoxDecoration(
                            color: Colors.red.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: Colors.red.withValues(alpha: 0.3),
                            ),
                          ),
                          child: const Text(
                            'CANCEL ORDER',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              color: Colors.red,
                              letterSpacing: 1.5,
                            ),
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
                style: const TextStyle(
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
  const _MetaItem({required this.label, required this.value});

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
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: AppTheme.charcoal,
          ),
        ),
      ],
    );
  }
}
