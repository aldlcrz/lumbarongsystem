import 'dart:async';
import 'dart:io';
import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../config/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../widgets/app_navbar.dart';

class SellerDashboardScreen extends StatefulWidget {
  const SellerDashboardScreen({super.key});

  @override
  State<SellerDashboardScreen> createState() => _SellerDashboardScreenState();
}

class _SellerDashboardScreenState extends State<SellerDashboardScreen> {
  static const Map<String, String> _filterLabels = {
    'today': 'Today',
    'week': 'This Week',
    'month': 'This Month',
    'year': 'This Year',
  };

  Map<String, dynamic> _stats = {
    'revenue': 0,
    'orders': 0,
    'inquiries': 0,
    'products': 0,
    'performance': const [],
    'topProducts': const [],
    'retention': 0,
    'funnel': const {'visitors': 0, 'views': 0, 'checkout': 0, 'completed': 0},
  };

  Timer? _pollTimer;
  String _dateFilter = 'month';
  bool _loading = true;
  String? _fetchError;

  @override
  void initState() {
    super.initState();
    _loadStats();
    _startRealtimePolling();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  void _startRealtimePolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 20), (_) {
      _loadStats(silent: true);
    });
  }

  Future<void> _loadStats({bool silent = false}) async {
    if (!mounted) return;

    setState(() {
      _loading = true;
      if (!silent) {
        _fetchError = null;
      }
    });

    try {
      final response = await ApiClient().get(
        '/products/seller-stats',
        queryParameters: {'range': _dateFilter},
      );

      if (mounted && response.data is Map) {
        setState(() {
          _stats = Map<String, dynamic>.from(response.data as Map);
          _fetchError = null;
        });
      }
    } catch (error) {
      if (mounted && !silent) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to refresh dashboard stats.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      if (mounted && !silent) {
        setState(() {
          _fetchError = error.toString();
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  String _csvEscape(dynamic value) {
    final text = value?.toString() ?? '';
    final escaped = text.replaceAll('"', '""');
    return '"$escaped"';
  }

  Future<void> _exportCsv() async {
    final topProducts = _topProducts();
    final rows = <List<dynamic>>[
      ['Metric', 'Value'],
      ['Total Revenue', _formatCurrency(_num(_stats['revenue']))],
      ['Total Orders', _num(_stats['orders']).toInt()],
      ['Inquiries', _num(_stats['inquiries']).toInt()],
      ['Products', _num(_stats['products']).toInt()],
      ['Retention', _formatPercent(_stats['retention'])],
      [],
      ['Top Products', 'Category', 'Sales', 'Revenue'],
      ...topProducts.map(
        (item) => [
          item['name'] ?? 'Unknown Product',
          item['category'] ?? 'Other',
          _num(item['sales']).toInt(),
          _formatCurrency(_num(item['revenue'])),
        ],
      ),
    ];

    final csv = rows.map((row) => row.map(_csvEscape).join(',')).join('\n');

    try {
      final directory = await getTemporaryDirectory();
      final date = DateTime.now().toIso8601String().split('T').first;
      final filePath = '${directory.path}/workshop_performance_$date.csv';
      final file = File(filePath);

      await file.writeAsString(csv);
      await Share.shareXFiles(
        [XFile(file.path)],
        text:
            'Workshop performance (${_filterLabels[_dateFilter] ?? 'This Month'})',
        subject: 'Workshop performance report',
      );
    } catch (error) {
      await Clipboard.setData(ClipboardData(text: csv));
      debugPrint('CSV export failed: $error');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'File sharing is unavailable on this device. CSV copied to clipboard.',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  double _num(dynamic value, {double fallback = 0}) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? fallback;
  }

  String _formatCurrency(num value) {
    final digits = value.round().toString();
    final reversed = digits.split('').reversed.toList();
    final buffer = StringBuffer();

    for (var index = 0; index < reversed.length; index++) {
      if (index > 0 && index % 3 == 0) {
        buffer.write(',');
      }
      buffer.write(reversed[index]);
    }

    return '₱${buffer.toString().split('').reversed.join()}';
  }

  String _formatPercent(dynamic value) {
    final percent = _num(value);
    return '${percent.toStringAsFixed(percent == percent.roundToDouble() ? 0 : 1)}%';
  }

  List<Map<String, dynamic>> _performancePoints() {
    final raw = _stats['performance'];
    if (raw is! List) return const [];
    return raw
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  List<Map<String, dynamic>> _topProducts() {
    final raw = _stats['topProducts'];
    if (raw is! List) return const [];
    return raw
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  Map<String, dynamic> _funnel() {
    final raw = _stats['funnel'];
    if (raw is Map) return Map<String, dynamic>.from(raw);
    return const {'visitors': 0, 'views': 0, 'checkout': 0, 'completed': 0};
  }

  Color _statusFill(String status) {
    final lower = status.toLowerCase();
    if (lower.contains('top')) return const Color(0xFFEAF5EB);
    if (lower.contains('low')) return const Color(0xFFFCEDEB);
    return const Color(0xFFFCF5E3);
  }

  Color _statusText(String status) {
    final lower = status.toLowerCase();
    if (lower.contains('top')) return const Color(0xFF3B8C4C);
    if (lower.contains('low')) return const Color(0xFFC95A46);
    return const Color(0xFFB88C35);
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required IconData icon,
    required Color background,
    required Color foreground,
  }) {
    final isLight = background == Colors.white;

    return Container(
      height: 150,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(22),
        border: isLight ? Border.all(color: AppTheme.borderLight) : null,
        boxShadow: [
          if (isLight)
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.4,
                    color: isLight
                        ? AppTheme.textMuted
                        : Colors.white.withValues(alpha: 0.72),
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: isLight
                      ? const Color(0xFFF9F6F2)
                      : Colors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 16, color: foreground),
              ),
            ],
          ),
          Text(
            value,
            style: GoogleFonts.playfairDisplay(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: foreground,
            ),
          ),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: const BoxDecoration(
                  color: Color(0xFF4ADE80),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 6),
              Text(
                'Live',
                style: TextStyle(
                  fontSize: 8,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.1,
                  color: isLight
                      ? AppTheme.textMuted
                      : Colors.white.withValues(alpha: 0.6),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    String? subtitle,
    Widget? trailing,
    required Widget child,
  }) {
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.charcoal,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppTheme.textMuted,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (trailing != null) trailing,
            ],
          ),
          const SizedBox(height: 20),
          child,
        ],
      ),
    );
  }

  Widget _buildFilterChip(String key, String label) {
    final active = _dateFilter == key;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: () {
            if (_dateFilter == key) return;
            setState(() => _dateFilter = key);
            _loadStats();
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            curve: Curves.easeOut,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: active ? AppTheme.rust : Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: active ? AppTheme.rust : AppTheme.borderLight,
              ),
              boxShadow: active
                  ? [
                      BoxShadow(
                        color: AppTheme.rust.withValues(alpha: 0.22),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ]
                  : null,
            ),
            child: Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.9,
                color: active ? Colors.white : AppTheme.textMuted,
              ),
            ),
          ),
        ),
      ),
    );
  }

  List<LineChartBarData> _buildPerformanceBars(
    List<Map<String, dynamic>> data,
  ) {
    if (data.isEmpty) {
      return [
        LineChartBarData(
          spots: const [FlSpot(0, 0)],
          isCurved: true,
          color: AppTheme.rust,
          barWidth: 3,
          dotData: const FlDotData(show: false),
        ),
      ];
    }

    return [
      LineChartBarData(
        spots: data.asMap().entries.map((entry) {
          return FlSpot(entry.key.toDouble(), _num(entry.value['sales']));
        }).toList(),
        isCurved: true,
        curveSmoothness: 0.35,
        color: AppTheme.rust,
        barWidth: 3,
        isStrokeCapRound: true,
        dotData: const FlDotData(show: false),
        belowBarData: BarAreaData(
          show: true,
          gradient: LinearGradient(
            colors: [
              AppTheme.rust.withValues(alpha: 0.24),
              AppTheme.rust.withValues(alpha: 0.0),
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
      ),
    ];
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

    final performance = _performancePoints();
    final topProducts = _topProducts();
    final funnel = _funnel();
    final funnelMax = math.max(
      math.max(_num(funnel['visitors']), _num(funnel['views'])),
      math.max(
        _num(funnel['checkout']),
        math.max(_num(funnel['completed']), 1),
      ),
    );
    final performanceMax = performance.fold<double>(1, (current, entry) {
      return math.max(current, _num(entry['sales']));
    });

    final filterLabel = _filterLabels[_dateFilter] ?? 'This Month';

    return Scaffold(
      backgroundColor: const Color(0xFFF9F6F2),
      appBar: const LumBarongAppBar(),
      bottomNavigationBar: const AppBottomNav(currentIndex: 0),
      body: RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: _loadStats,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'ARTISAN PERFORMANCE',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.textMuted,
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 6),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(
                            text: 'Workshop ',
                            style: GoogleFonts.playfairDisplay(
                              fontSize: 30,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.charcoal,
                            ),
                          ),
                          TextSpan(
                            text: 'Dashboard',
                            style: GoogleFonts.playfairDisplay(
                              fontSize: 30,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.rust,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Showing data for $filterLabel',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.textMuted,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  if (_loading)
                    const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppTheme.primary,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: _exportCsv,
                  icon: const Icon(Icons.file_download_outlined, size: 14),
                  label: const Text(
                    'DOWNLOAD REPORT',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 11,
                      letterSpacing: 0.4,
                    ),
                  ),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.white,
                    backgroundColor: AppTheme.charcoal,
                    side: const BorderSide(color: AppTheme.charcoal),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    minimumSize: const Size(0, 36),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              LayoutBuilder(
                builder: (context, constraints) {
                  return SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        minWidth: constraints.maxWidth,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _buildFilterChip('today', 'Today'),
                          _buildFilterChip('week', 'This Week'),
                          _buildFilterChip('month', 'This Month'),
                          _buildFilterChip('year', 'This Year'),
                        ],
                      ),
                    ),
                  );
                },
              ),
              if (_fetchError != null) ...[
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFDF2F2),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFFBCACA)),
                  ),
                  child: Text(
                    'Could not load stats: $_fetchError',
                    style: const TextStyle(
                      color: Color(0xFFB42318),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 22),
              LayoutBuilder(
                builder: (context, constraints) {
                  final crossAxisCount = constraints.maxWidth >= 600 ? 4 : 2;
                  return GridView.count(
                    crossAxisCount: crossAxisCount,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 14,
                    crossAxisSpacing: 14,
                    childAspectRatio: crossAxisCount == 4 ? 1.05 : 1.15,
                    children: [
                      _buildMetricCard(
                        title: 'Total Revenue',
                        value: _loading
                            ? '—'
                            : _formatCurrency(_num(_stats['revenue'])),
                        icon: Icons.payments_outlined,
                        background: AppTheme.rust,
                        foreground: Colors.white,
                      ),
                      _buildMetricCard(
                        title: 'Shop Orders',
                        value: _loading
                            ? '—'
                            : _num(_stats['orders']).toInt().toString(),
                        icon: Icons.shopping_bag_outlined,
                        background: Colors.white,
                        foreground: AppTheme.charcoal,
                      ),
                      _buildMetricCard(
                        title: 'Suki',
                        value: _loading
                            ? '—'
                            : _formatPercent(_stats['retention']),
                        icon: Icons.verified_user_outlined,
                        background: Colors.white,
                        foreground: AppTheme.charcoal,
                      ),
                      _buildMetricCard(
                        title: 'Inquiries',
                        value: _loading
                            ? '—'
                            : _num(_stats['inquiries']).toInt().toString(),
                        icon: Icons.chat_bubble_outline,
                        background: Colors.white,
                        foreground: AppTheme.charcoal,
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 18),
              _buildSectionCard(
                title: 'Revenue trend',
                subtitle: 'Financial performance for the selected period',
                child: SizedBox(
                  height: 250,
                  child: _loading
                      ? const Center(
                          child: CircularProgressIndicator(
                            color: AppTheme.primary,
                          ),
                        )
                      : LineChart(
                          LineChartData(
                            minX: 0,
                            maxX: math
                                .max(performance.length - 1, 1)
                                .toDouble(),
                            minY: 0,
                            maxY: math.max(1000, performanceMax * 1.2),
                            gridData: FlGridData(
                              show: true,
                              drawVerticalLine: false,
                              horizontalInterval: performanceMax > 0
                                  ? performanceMax / 4
                                  : 1,
                              getDrawingHorizontalLine: (value) => const FlLine(
                                color: AppTheme.borderLight,
                                strokeWidth: 1,
                                dashArray: [4, 4],
                              ),
                            ),
                            borderData: FlBorderData(show: false),
                            titlesData: FlTitlesData(
                              topTitles: const AxisTitles(
                                sideTitles: SideTitles(showTitles: false),
                              ),
                              rightTitles: const AxisTitles(
                                sideTitles: SideTitles(showTitles: false),
                              ),
                              leftTitles: AxisTitles(
                                sideTitles: SideTitles(
                                  showTitles: true,
                                  reservedSize: 42,
                                  interval: performanceMax > 0
                                      ? performanceMax / 4
                                      : 1,
                                  getTitlesWidget: (value, meta) {
                                    if (value == 0)
                                      return const SizedBox.shrink();
                                    return Text(
                                      '₱${(value / 1000).toStringAsFixed(0)}k',
                                      style: const TextStyle(
                                        color: AppTheme.textMuted,
                                        fontSize: 9,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    );
                                  },
                                ),
                              ),
                              bottomTitles: AxisTitles(
                                sideTitles: SideTitles(
                                  showTitles: true,
                                  reservedSize: 30,
                                  interval: 1,
                                  getTitlesWidget: (value, meta) {
                                    if (performance.isEmpty)
                                      return const SizedBox.shrink();
                                    final index = value.toInt();
                                    final step = performance.length > 6
                                        ? (performance.length / 5).ceil()
                                        : 1;
                                    final shouldShow =
                                        index == 0 ||
                                        index == performance.length - 1 ||
                                        index % step == 0;
                                    if (!shouldShow ||
                                        index < 0 ||
                                        index >= performance.length) {
                                      return const SizedBox.shrink();
                                    }
                                    return Padding(
                                      padding: const EdgeInsets.only(top: 8),
                                      child: Text(
                                        performance[index]['name']
                                                ?.toString() ??
                                            '',
                                        style: const TextStyle(
                                          color: AppTheme.textMuted,
                                          fontSize: 9,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ),
                            lineBarsData: _buildPerformanceBars(performance),
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 18),
              _buildSectionCard(
                title: 'Top products',
                subtitle: 'Most sold products for the selected period',
                child: _loading
                    ? const Padding(
                        padding: EdgeInsets.symmetric(vertical: 24),
                        child: Center(
                          child: CircularProgressIndicator(
                            color: AppTheme.primary,
                          ),
                        ),
                      )
                    : topProducts.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.symmetric(vertical: 16),
                        child: Center(
                          child: Text(
                            'No product sales yet in this period.',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.textMuted,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      )
                    : Column(
                        children: topProducts.asMap().entries.map((entry) {
                          final item = entry.value;
                          final sales = _num(item['sales']);
                          final maxSales = math.max(
                            _num(item['maxSalesRef']),
                            1,
                          );
                          final percent = (sales / maxSales).clamp(0.0, 1.0);
                          final status =
                              item['status']?.toString() ?? 'Trending';
                          final rating = _num(item['rating']);
                          final reviews = _num(item['reviewsCount']).toInt();

                          return Padding(
                            padding: EdgeInsets.only(
                              bottom: entry.key == topProducts.length - 1
                                  ? 0
                                  : 12,
                            ),
                            child: Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF7F6F2),
                                borderRadius: BorderRadius.circular(18),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              item['name']?.toString() ??
                                                  'Unknown Product',
                                              style: const TextStyle(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w800,
                                                color: AppTheme.charcoal,
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              (item['category']?.toString() ??
                                                      'Other')
                                                  .toLowerCase(),
                                              style: const TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w600,
                                                color: AppTheme.textMuted,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 4,
                                        ),
                                        decoration: BoxDecoration(
                                          color: _statusFill(status),
                                          borderRadius: BorderRadius.circular(
                                            999,
                                          ),
                                        ),
                                        child: Text(
                                          status,
                                          style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w800,
                                            color: _statusText(status),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(999),
                                    child: LinearProgressIndicator(
                                      value: percent,
                                      minHeight: 7,
                                      backgroundColor: const Color(0xFFE3DFD7),
                                      valueColor:
                                          const AlwaysStoppedAnimation<Color>(
                                            AppTheme.rust,
                                          ),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Text(
                                        '${sales.toInt()} sold',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.charcoal,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      const Text(
                                        '·',
                                        style: TextStyle(
                                          color: AppTheme.textMuted,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        _formatCurrency(_num(item['revenue'])),
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.textMuted,
                                        ),
                                      ),
                                      const Spacer(),
                                      Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(
                                            Icons.star,
                                            size: 13,
                                            color: Color(0xFFE56D4B),
                                          ),
                                          const SizedBox(width: 2),
                                          Text(
                                            rating > 0
                                                ? rating.toStringAsFixed(1)
                                                : '4.5',
                                            style: const TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w800,
                                              color: AppTheme.charcoal,
                                            ),
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            '($reviews reviews)',
                                            style: const TextStyle(
                                              fontSize: 10,
                                              color: AppTheme.textMuted,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                      ),
              ),
              const SizedBox(height: 18),
              _buildSectionCard(
                title: 'Sales funnel',
                subtitle: 'Visitors through completed sales',
                child: _loading
                    ? const Padding(
                        padding: EdgeInsets.symmetric(vertical: 24),
                        child: Center(
                          child: CircularProgressIndicator(
                            color: AppTheme.primary,
                          ),
                        ),
                      )
                    : Column(
                        children: [
                          _FunnelBar(
                            label: 'Visitors',
                            value: _num(funnel['visitors']).toInt(),
                            percent: funnelMax > 0
                                ? _num(funnel['visitors']) / funnelMax
                                : 0,
                            color: const Color(0xFF2C2420),
                            icon: Icons.groups_2_outlined,
                            helperText: 'Entry stage',
                          ),
                          const SizedBox(height: 12),
                          _FunnelBar(
                            label: 'Product Views',
                            value: _num(funnel['views']).toInt(),
                            percent: funnelMax > 0
                                ? _num(funnel['views']) / funnelMax
                                : 0,
                            color: const Color(0xFF594436),
                            icon: Icons.visibility_outlined,
                            helperText:
                                '${(_num(funnel['visitors']) > 0 ? ((_num(funnel['views']) / _num(funnel['visitors'])) * 100) : 0).toStringAsFixed(1)}% from visitors',
                          ),
                          const SizedBox(height: 12),
                          _FunnelBar(
                            label: 'Checkout',
                            value: _num(funnel['checkout']).toInt(),
                            percent: funnelMax > 0
                                ? _num(funnel['checkout']) / funnelMax
                                : 0,
                            color: const Color(0xFF8C7B70),
                            icon: Icons.shopping_cart_checkout_outlined,
                            helperText:
                                '${(_num(funnel['views']) > 0 ? ((_num(funnel['checkout']) / _num(funnel['views'])) * 100) : 0).toStringAsFixed(1)}% from views',
                          ),
                          const SizedBox(height: 12),
                          _FunnelBar(
                            label: 'Completed',
                            value: _num(funnel['completed']).toInt(),
                            percent: funnelMax > 0
                                ? _num(funnel['completed']) / funnelMax
                                : 0,
                            color: AppTheme.rust,
                            icon: Icons.task_alt_outlined,
                            helperText:
                                '${(_num(funnel['checkout']) > 0 ? ((_num(funnel['completed']) / _num(funnel['checkout'])) * 100) : 0).toStringAsFixed(1)}% from checkout',
                          ),
                        ],
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FunnelBar extends StatelessWidget {
  final String label;
  final int value;
  final double percent;
  final Color color;
  final IconData icon;
  final String helperText;

  const _FunnelBar({
    required this.label,
    required this.value,
    required this.percent,
    required this.color,
    required this.icon,
    required this.helperText,
  });

  @override
  Widget build(BuildContext context) {
    final normalized = percent.clamp(0.0, 1.0);
    final percentLabel = '${(normalized * 100).toStringAsFixed(1)}%';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F6F2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE9E2DA)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 16, color: color),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.charcoal,
                  ),
                ),
              ),
              Text(
                value.toString(),
                style: GoogleFonts.playfairDisplay(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.charcoal,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: TweenAnimationBuilder<double>(
              tween: Tween<double>(begin: 0, end: normalized),
              duration: const Duration(milliseconds: 700),
              curve: Curves.easeOutCubic,
              builder: (context, animatedValue, _) {
                return LinearProgressIndicator(
                  value: animatedValue,
                  minHeight: 8,
                  backgroundColor: const Color(0xFFE4DDD5),
                  valueColor: AlwaysStoppedAnimation<Color>(color),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(
                helperText,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textMuted,
                ),
              ),
              const Spacer(),
              Text(
                percentLabel,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: color,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
