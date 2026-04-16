import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../widgets/app_navbar.dart';
import 'package:cached_network_image/cached_network_image.dart';

class AdminSellersScreen extends StatefulWidget {
  const AdminSellersScreen({super.key});

  @override
  State<AdminSellersScreen> createState() => _AdminSellersScreenState();
}

class _AdminSellersScreenState extends State<AdminSellersScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _pending = [];
  List<Map<String, dynamic>> _verified = [];
  List<Map<String, dynamic>> _allPending = [];
  List<Map<String, dynamic>> _allVerified = [];
  bool _loading = true;
  String _searchQuery = '';
  Timer? _liveTimer;

  bool _isSellerVerified(dynamic value) {
    if (value is bool) return value;
    if (value is num) return value != 0;
    if (value is String) {
      final normalized = value.trim().toLowerCase();
      return normalized == 'true' || normalized == '1' || normalized == 'yes';
    }
    return false;
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadSellers();
    _liveTimer = Timer.periodic(const Duration(seconds: 20), (_) {
      _loadSellers(silent: true);
    });
  }

  @override
  void dispose() {
    _liveTimer?.cancel();
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadSellers({bool silent = false}) async {
    if (!silent) {
      setState(() => _loading = true);
    }
    try {
      final sellersRes = await ApiClient().get('/auth/sellers');
      if (!mounted) return;
      if (sellersRes.data is List) {
        final allSellers = (sellersRes.data as List)
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();

        _allPending = allSellers
            .where((s) => !_isSellerVerified(s['isVerified']))
            .toList();
        _allVerified = allSellers
            .where((s) => _isSellerVerified(s['isVerified']))
            .toList();
      }

      _applySearch();
    } catch (_) {}
    if (mounted && !silent) setState(() => _loading = false);
  }

  void _applySearch() {
    setState(() {
      final q = _searchQuery.toLowerCase();
      _pending = _allPending.where((s) {
        final name = (s['shopName'] ?? s['name'] ?? '')
            .toString()
            .toLowerCase();
        final email = (s['email'] ?? '').toString().toLowerCase();
        return name.contains(q) || email.contains(q);
      }).toList();

      _verified = _allVerified.where((s) {
        final name = (s['shopName'] ?? s['name'] ?? '')
            .toString()
            .toLowerCase();
        final email = (s['email'] ?? '').toString().toLowerCase();
        return name.contains(q) || email.contains(q);
      }).toList();
    });
  }

  Future<void> _approveSeller(String id) async {
    try {
      await ApiClient().put('/admin/verify-seller/$id');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Artisan approved and verified for commerce'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Color(0xFF10B981),
          ),
        );
        _loadSellers();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to approve artisan'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _revokeSeller(String id) async {
    try {
      await ApiClient().put('/auth/revoke-seller/$id');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Artisan verification revoked'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: AppTheme.darkSection,
          ),
        );
        _loadSellers();
      }
    } catch (_) {}
  }

  void _showDocumentModal(Map<String, dynamic> seller) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _DocumentVerificationModal(
        seller: seller,
        onApprove: () {
          Navigator.pop(ctx);
          _approveSeller(seller['_id'] ?? seller['id']);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isLoggedIn || auth.user!.role != 'admin') {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/');
      });
      return const SizedBox.shrink();
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF9F6F2),
      appBar: const LumBarongAppBar(title: 'User Management', showBack: true),
      bottomNavigationBar: const AppBottomNav(currentIndex: 3),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
            color: const Color(0xFFF9F6F2),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Seller Verification',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.charcoal,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: TextField(
                    onChanged: (v) {
                      _searchQuery = v;
                      _applySearch();
                    },
                    decoration: const InputDecoration(
                      hintText: 'Search artisans by name or email...',
                      hintStyle: TextStyle(
                        fontSize: 13,
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
                const SizedBox(height: 24),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: TabBar(
                    controller: _tabController,
                    labelColor: AppTheme.primary,
                    unselectedLabelColor: AppTheme.textMuted,
                    indicator: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      color: AppTheme.primary.withValues(alpha: 0.1),
                    ),
                    indicatorSize: TabBarIndicatorSize.tab,
                    dividerColor: Colors.transparent,
                    labelStyle: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1,
                    ),
                    unselectedLabelStyle: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                    tabs: [
                      Tab(text: 'PENDING (${_pending.length})'),
                      Tab(text: 'VERIFIED (${_verified.length})'),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: AppTheme.primary),
                  )
                : TabBarView(
                    controller: _tabController,
                    children: [
                      _SellerList(
                        sellers: _pending,
                        showApprove: true,
                        onViewDocs: _showDocumentModal,
                        onApprove: (id) => _approveSeller(id),
                      ),
                      _SellerList(
                        sellers: _verified,
                        showRevoke: true,
                        onRevoke: (id) => _revokeSeller(id),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _SellerList extends StatelessWidget {
  final List<Map<String, dynamic>> sellers;
  final bool showApprove;
  final bool showRevoke;
  final void Function(Map<String, dynamic>)? onViewDocs;
  final void Function(String)? onApprove;
  final void Function(String)? onRevoke;

  const _SellerList({
    required this.sellers,
    this.showApprove = false,
    this.showRevoke = false,
    this.onViewDocs,
    this.onApprove,
    this.onRevoke,
  });

  @override
  Widget build(BuildContext context) {
    if (sellers.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: Icon(
                Icons.check_circle_outline,
                size: 48,
                color: Colors.green.shade300,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Queue is empty',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppTheme.charcoal,
              ),
            ),
            const Text(
              'No artisans found in this section.',
              style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      color: AppTheme.primary,
      onRefresh: () async {},
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
        itemCount: sellers.length,
        separatorBuilder: (_, _) => const SizedBox(height: 16),
        itemBuilder: (context, i) {
          final s = sellers[i];
          final sId = s['_id'] ?? s['id'];
          final isVerified = s['isVerified'] ?? false;
          final dateStr = s['createdAt']?.toString().split('T').first ?? '';

          return Container(
            padding: const EdgeInsets.all(20),
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
                Row(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: AppTheme.charcoal,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.charcoal.withValues(alpha: 0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          (s['name']?.toString() ?? '?')
                              .substring(0, 1)
                              .toUpperCase(),
                          style: GoogleFonts.playfairDisplay(
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            fontSize: 24,
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
                            (s['shopName'] ?? s['name'] ?? 'Artisan')
                                .toString(),
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            s['email']?.toString() ?? '',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.textMuted,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: isVerified
                                      ? Colors.amber.shade100
                                      : Colors.red.shade50,
                                  borderRadius: BorderRadius.circular(100),
                                ),
                                child: Text(
                                  isVerified ? 'VERIFIED' : 'PENDING APPROVAL',
                                  style: TextStyle(
                                    fontSize: 8,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1,
                                    color: isVerified
                                        ? Colors.amber.shade800
                                        : Colors.red.shade700,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Icon(
                                Icons.access_time,
                                size: 10,
                                color: AppTheme.textMuted,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'Joined $dateStr',
                                style: const TextStyle(
                                  fontSize: 9,
                                  color: AppTheme.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    if (showApprove && onViewDocs != null) ...[
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => onViewDocs!(s),
                          icon: const Icon(Icons.visibility_outlined, size: 14),
                          label: const Text(
                            'VIEW DOCS',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppTheme.charcoal,
                            side: const BorderSide(color: AppTheme.borderLight),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],
                    if (showApprove && onApprove != null)
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => onApprove!(sId.toString()),
                          icon: const Icon(
                            Icons.verified_user_outlined,
                            size: 14,
                          ),
                          label: const Text(
                            'APPROVE ARTISAN',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.charcoal,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                    if (showRevoke && onRevoke != null)
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => onRevoke!(sId.toString()),
                          icon: const Icon(Icons.block, size: 14),
                          label: const Text(
                            'REVOKE VERIFICATION',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.red.shade600,
                            side: BorderSide(color: Colors.red.shade200),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _DocumentVerificationModal extends StatelessWidget {
  final Map<String, dynamic> seller;
  final VoidCallback onApprove;

  const _DocumentVerificationModal({
    required this.seller,
    required this.onApprove,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFFF9F6F2).withValues(alpha: 0.5),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(32),
              ),
              border: const Border(
                bottom: BorderSide(color: AppTheme.borderLight),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Verification Documents',
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.charcoal,
                        ),
                      ),
                      RichText(
                        text: TextSpan(
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppTheme.textMuted,
                          ),
                          children: [
                            const TextSpan(text: 'Reviewing credentials for '),
                            TextSpan(
                              text: seller['shopName'] ?? seller['name'],
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.white,
                    shape: const CircleBorder(),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  _DocumentCard(
                    title: 'INDIGENCY CERTIFICATE',
                    src: seller['indigencyCertificate'],
                  ),
                  const SizedBox(height: 24),
                  _DocumentCard(title: 'VALID ID', src: seller['validId']),
                  const SizedBox(height: 24),
                  _DocumentCard(
                    title: 'GCASH QR CODE',
                    src: seller['gcashQrCode'],
                  ),
                ],
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: AppTheme.borderLight)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text(
                      'BACK TO QUEUE',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textMuted,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: onApprove,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.charcoal,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 4,
                    ),
                    child: const Text(
                      'APPROVE ARTISAN',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DocumentCard extends StatelessWidget {
  final String title;
  final String? src;

  const _DocumentCard({required this.title, this.src});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.5,
              color: AppTheme.textMuted,
            ),
          ),
        ),
        Container(
          width: double.infinity,
          height: 240,
          decoration: BoxDecoration(
            color: const Color(0xFFF9F6F2).withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppTheme.borderLight, width: 2),
          ),
          clipBehavior: Clip.antiAlias,
          child: src != null && src!.isNotEmpty
              ? GestureDetector(
                  onTap: () {
                    // Could add a full-screen image viewer here, but keeping it simple for now
                  },
                  child: CachedNetworkImage(
                    imageUrl: src!,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => const Center(
                      child: CircularProgressIndicator(color: AppTheme.primary),
                    ),
                    errorWidget: (context, url, error) => _buildEmptyState(),
                  ),
                )
              : _buildEmptyState(),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.broken_image_outlined,
          size: 40,
          color: AppTheme.textMuted.withValues(alpha: 0.3),
        ),
        const SizedBox(height: 12),
        const Text(
          'No document available',
          style: TextStyle(
            fontSize: 12,
            color: AppTheme.textMuted,
            fontStyle: FontStyle.italic,
          ),
        ),
      ],
    );
  }
}
