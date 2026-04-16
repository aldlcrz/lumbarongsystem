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

String _compactAxisNum(double value) {
  if (value >= 1000000) return '${(value / 1000000).toStringAsFixed(1)}M';
  if (value >= 1000) return '${(value / 1000).toStringAsFixed(0)}k';
  return value.toStringAsFixed(0);
}

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  String _dateFilter = 'week';
  bool _loading = true;
  bool _showRevenueTrend = true;
  bool _showUserGrowth = true;

  Timer? _liveTimer;

  Map<String, dynamic> _stats = {
    'totalSales': '—',
    'totalOrders': '—',
    'activeCustomers': '—',
    'liveProducts': '—',
  };

  Map<String, dynamic> _analytics = {
    'revenueSeries': <Map<String, dynamic>>[],
    'monthlySignups': <Map<String, dynamic>>[],
    'topLocations': <Map<String, dynamic>>[],
    'orderStatusBreakdown': {
      'pending': 0,
      'processing': 0,
      'shipped': 0,
      'completed': 0,
      'cancelled': 0,
    },
    'topProducts': <Map<String, dynamic>>[],
    'topCategories': <Map<String, dynamic>>[],
  };

  @override
  void initState() {
    super.initState();
    _loadDashboard();
    _liveTimer = Timer.periodic(const Duration(seconds: 20), (_) {
      _loadDashboard(silent: true);
    });
  }

  @override
  void dispose() {
    _liveTimer?.cancel();
    super.dispose();
  }

  double _num(dynamic value, {double fallback = 0}) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? fallback;
  }

  int _toInt(dynamic value) => _num(value).toInt();

  List<Map<String, dynamic>> _asList(dynamic value) {
    if (value is! List) return const [];
    return value
        .whereType<Map>()
        .map(
          (item) =>
              item.map((key, val) => MapEntry(key?.toString() ?? '', val)),
        )
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  Future<void> _loadDashboard({bool silent = false}) async {
    if (!mounted) return;

    if (!silent) {
      setState(() {
        _loading = true;
      });
    }

    try {
      final statsRes = await ApiClient().get(
        '/admin/stats',
        queryParameters: {'range': _dateFilter},
      );
      final analyticsRes = await ApiClient().get(
        '/admin/analytics',
        queryParameters: {'range': _dateFilter},
      );

      if (!mounted) return;

      final stats = statsRes.data is Map
          ? Map<String, dynamic>.from(statsRes.data as Map)
          : <String, dynamic>{};
      final analytics = analyticsRes.data is Map
          ? Map<String, dynamic>.from(analyticsRes.data as Map)
          : <String, dynamic>{};

      setState(() {
        _stats = {
          'totalSales': stats['totalSales'] ?? '—',
          'totalOrders': stats['totalOrders'] ?? '—',
          'activeCustomers': stats['activeCustomers'] ?? '—',
          'liveProducts': stats['liveProducts'] ?? '—',
        };

        _analytics = {
          'revenueSeries': _asList(analytics['revenueSeries']),
          'monthlySignups': _asList(analytics['monthlySignups']),
          'topLocations': _asList(analytics['topLocations']),
          'orderStatusBreakdown': analytics['orderStatusBreakdown'] is Map
              ? Map<String, dynamic>.from(analytics['orderStatusBreakdown'])
              : {
                  'pending': 0,
                  'processing': 0,
                  'shipped': 0,
                  'completed': 0,
                  'cancelled': 0,
                },
          'topProducts': _asList(analytics['topProducts']),
          'topCategories': _asList(analytics['topCategories']),
        };
      });
    } catch (_) {
      // Keep existing data on transient network errors.
    } finally {
      if (mounted && !silent) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _refresh() async {
    await _loadDashboard(silent: true);
  }

  Widget _rangeChip(String range) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(range.toUpperCase()),
        selected: _dateFilter == range,
        onSelected: (_) {
          if (_dateFilter == range) return;
          setState(() => _dateFilter = range);
          _loadDashboard();
        },
        selectedColor: AppTheme.rust,
        labelStyle: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          color: _dateFilter == range ? Colors.white : AppTheme.textMuted,
        ),
        side: BorderSide(
          color: _dateFilter == range ? AppTheme.rust : AppTheme.borderLight,
        ),
        backgroundColor: Colors.white,
      ),
    );
  }

  String _csvEscape(dynamic value) {
    final text = value?.toString() ?? '';
    return '"${text.replaceAll('"', '""')}"';
  }

  Future<void> _exportReport() async {
    final rows = <List<dynamic>>[
      ['Metric', 'Value'],
      ['Total Sales', _stats['totalSales']],
      ['Total Orders', _stats['totalOrders']],
      ['Active Customers', _stats['activeCustomers']],
      ['Live Products', _stats['liveProducts']],
    ];

    final csv = rows.map((row) => row.map(_csvEscape).join(',')).join('\n');

    try {
      final directory = await getTemporaryDirectory();
      final date = DateTime.now().toIso8601String().split('T').first;
      final file = File('${directory.path}/lumbarong_report_$date.csv');
      await file.writeAsString(csv);
      await Share.shareXFiles(
        [XFile(file.path)],
        text: 'Lumbarong admin dashboard report',
        subject: 'Dashboard report',
      );
    } catch (_) {
      await Clipboard.setData(ClipboardData(text: csv));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Share unavailable. Report copied to clipboard.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  List<Map<String, dynamic>> get _revenueSeries =>
      (_analytics['revenueSeries'] as List).cast<Map<String, dynamic>>();

  List<Map<String, dynamic>> get _monthlySignups =>
      (_analytics['monthlySignups'] as List).cast<Map<String, dynamic>>();

  List<Map<String, dynamic>> get _topLocations =>
      (_analytics['topLocations'] as List).cast<Map<String, dynamic>>();

  List<Map<String, dynamic>> get _topProducts =>
      (_analytics['topProducts'] as List).cast<Map<String, dynamic>>();

  List<Map<String, dynamic>> get _topCategories =>
      (_analytics['topCategories'] as List).cast<Map<String, dynamic>>();

  Map<String, dynamic> get _statusBreakdown =>
      Map<String, dynamic>.from(_analytics['orderStatusBreakdown'] as Map);

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
      appBar: const LumBarongAppBar(title: 'Admin Command'),
      bottomNavigationBar: const AppBottomNav(currentIndex: 0),
      body: RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: _refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
          children: [
            const Text(
              'ENTERPRISE OVERVIEW',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                color: AppTheme.textMuted,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 8),
            Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: 'Dashboard ',
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 32,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.charcoal,
                    ),
                  ),
                  TextSpan(
                    text: 'Insights',
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 32,
                      fontWeight: FontWeight.w300,
                      fontStyle: FontStyle.italic,
                      color: const Color(0xFFD4B896),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                SizedBox(
                  height: 40,
                  child: ElevatedButton.icon(
                    onPressed: _exportReport,
                    icon: const Icon(Icons.download_outlined, size: 14),
                    label: const Text('Download Report'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      textStyle: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: ConstrainedBox(
                    constraints: BoxConstraints(minWidth: constraints.maxWidth),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _rangeChip('today'),
                        _rangeChip('week'),
                        _rangeChip('month'),
                        _rangeChip('year'),
                      ],
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 10),
            const SizedBox(height: 18),
            if (_loading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 36),
                child: Center(
                  child: CircularProgressIndicator(color: AppTheme.primary),
                ),
              )
            else ...[
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 1.35,
                children: [
                  _StatCard(
                    label: 'Total Sales',
                    value: _stats['totalSales'].toString(),
                    icon: Icons.payments_outlined,
                    color: AppTheme.primary,
                  ),
                  _StatCard(
                    label: 'Total Orders',
                    value: _stats['totalOrders'].toString(),
                    icon: Icons.shopping_bag_outlined,
                    color: Colors.blue.shade600,
                  ),
                  _StatCard(
                    label: 'Active Customers',
                    value: _stats['activeCustomers'].toString(),
                    icon: Icons.people_outline,
                    color: Colors.green.shade600,
                  ),
                  _StatCard(
                    label: 'Live Products',
                    value: _stats['liveProducts'].toString(),
                    icon: Icons.inventory_2_outlined,
                    color: Colors.amber.shade700,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _ToggleSectionCard(
                title: 'Revenue Trend',
                subtitle: 'Total earnings • $_dateFilter view',
                expanded: _showRevenueTrend,
                onToggle: () =>
                    setState(() => _showRevenueTrend = !_showRevenueTrend),
                child: _SimpleLineChart(
                  data: _revenueSeries,
                  valueKey: 'revenue',
                  emptyLabel: 'No revenue data for this period',
                ),
              ),
              const SizedBox(height: 12),
              _ToggleSectionCard(
                title: 'User Growth',
                subtitle: 'New registrations • $_dateFilter view',
                expanded: _showUserGrowth,
                onToggle: () =>
                    setState(() => _showUserGrowth = !_showUserGrowth),
                child: _SimpleLineChart(
                  data: _monthlySignups,
                  valueKey: 'hits',
                  emptyLabel: 'No signup data for this period',
                ),
              ),
              const SizedBox(height: 12),
              _Panel(
                title: 'Orders by Location',
                child: _topLocations.isEmpty
                    ? const _MutedCenter(text: 'No location data yet')
                    : Column(
                        children: _topLocations.map((loc) {
                          final maxCount = _topLocations
                              .map((item) => _toInt(item['count']))
                              .fold<int>(1, math.max);
                          final count = _toInt(loc['count']);
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        (loc['city'] ?? 'Unknown').toString(),
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.charcoal,
                                        ),
                                      ),
                                    ),
                                    Text(
                                      '$count orders',
                                      style: const TextStyle(
                                        fontSize: 10,
                                        color: AppTheme.textMuted,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 5),
                                LinearProgressIndicator(
                                  value: maxCount > 0 ? count / maxCount : 0,
                                  minHeight: 7,
                                  color: AppTheme.rust,
                                  backgroundColor: const Color(0xFFF2ECE5),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
              ),
              const SizedBox(height: 12),
              _Panel(
                title: 'Order Status Breakdown',
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _StatusChip('Pending', _toInt(_statusBreakdown['pending'])),
                    _StatusChip(
                      'Processing',
                      _toInt(_statusBreakdown['processing']),
                    ),
                    _StatusChip('Shipped', _toInt(_statusBreakdown['shipped'])),
                    _StatusChip(
                      'Completed',
                      _toInt(_statusBreakdown['completed']),
                    ),
                    _StatusChip(
                      'Cancelled',
                      _toInt(_statusBreakdown['cancelled']),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              _Panel(
                title: 'Top Selling Products',
                child: _topProducts.isEmpty
                    ? const _MutedCenter(
                        text: 'No product sales in this period',
                      )
                    : Column(
                        children: _topProducts.take(5).map((product) {
                          final maxSales = _topProducts
                              .map((item) => _num(item['sales']))
                              .fold<double>(1, math.max);
                          final sales = _num(product['sales']);
                          final revenue = _num(product['revenue']);
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF7F6F2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    (product['name'] ?? 'Unknown').toString(),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 12,
                                      color: AppTheme.charcoal,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    (product['category'] ?? 'Other').toString(),
                                    style: const TextStyle(
                                      fontSize: 10,
                                      color: AppTheme.textMuted,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  LinearProgressIndicator(
                                    value: maxSales > 0 ? sales / maxSales : 0,
                                    minHeight: 6,
                                    color: AppTheme.rust,
                                    backgroundColor: const Color(0xFFE3DFD7),
                                  ),
                                  const SizedBox(height: 5),
                                  Row(
                                    children: [
                                      Text(
                                        '${sales.toInt()} sold',
                                        style: const TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.charcoal,
                                        ),
                                      ),
                                      const Spacer(),
                                      Text(
                                        '₱${revenue.toStringAsFixed(0)}',
                                        style: const TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w800,
                                          color: AppTheme.rust,
                                        ),
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
              const SizedBox(height: 12),
              _Panel(
                title: 'Top Categories',
                child: _topCategories.isEmpty
                    ? const _MutedCenter(text: 'No category data yet')
                    : Column(
                        children: [
                          SizedBox(
                            height: 220,
                            child: PieChart(
                              PieChartData(
                                centerSpaceRadius: 48,
                                sectionsSpace: 3,
                                sections: _topCategories.asMap().entries.map((
                                  entry,
                                ) {
                                  final index = entry.key;
                                  final item = entry.value;
                                  final colors = [
                                    const Color(0xFFC0422A),
                                    const Color(0xFFE56D4B),
                                    const Color(0xFF8C7B70),
                                    const Color(0xFFB3A499),
                                    const Color(0xFFE5DDD5),
                                  ];
                                  return PieChartSectionData(
                                    value: _num(item['value']),
                                    color: colors[index % colors.length],
                                    radius: 22,
                                    showTitle: false,
                                  );
                                }).toList(),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 6,
                            children: _topCategories.asMap().entries.map((
                              entry,
                            ) {
                              final index = entry.key;
                              final item = entry.value;
                              final colors = [
                                const Color(0xFFC0422A),
                                const Color(0xFFE56D4B),
                                const Color(0xFF8C7B70),
                                const Color(0xFFB3A499),
                                const Color(0xFFE5DDD5),
                              ];
                              return Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 10,
                                    height: 10,
                                    decoration: BoxDecoration(
                                      color: colors[index % colors.length],
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 5),
                                  Text(
                                    '${item['name']} (${_toInt(item['value'])})',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.charcoal,
                                    ),
                                  ),
                                ],
                              );
                            }).toList(),
                          ),
                        ],
                      ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _Panel extends StatelessWidget {
  final String title;
  final Widget child;

  const _Panel({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: AppTheme.charcoal,
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _ToggleSectionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final bool expanded;
  final VoidCallback onToggle;
  final Widget child;

  const _ToggleSectionCard({
    required this.title,
    required this.subtitle,
    required this.expanded,
    required this.onToggle,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return _Panel(
      title: title,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppTheme.textMuted,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              IconButton(
                onPressed: onToggle,
                icon: Icon(
                  expanded
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                  size: 18,
                ),
                style: IconButton.styleFrom(
                  backgroundColor: const Color(0xFFF7F6F2),
                ),
              ),
            ],
          ),
          if (expanded) ...[const SizedBox(height: 10), child],
        ],
      ),
    );
  }
}

class _SimpleLineChart extends StatelessWidget {
  final List<Map<String, dynamic>> data;
  final String valueKey;
  final String emptyLabel;

  const _SimpleLineChart({
    required this.data,
    required this.valueKey,
    required this.emptyLabel,
  });

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) {
      return SizedBox(
        height: 180,
        child: Center(
          child: Text(
            emptyLabel,
            style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
          ),
        ),
      );
    }

    final spots = data.asMap().entries.map((entry) {
      final index = entry.key.toDouble();
      final value = (entry.value[valueKey] as num?)?.toDouble() ?? 0;
      return FlSpot(index, value);
    }).toList();

    final maxY = data
        .map((item) => (item[valueKey] as num?)?.toDouble() ?? 0)
        .fold<double>(1, math.max);

    return SizedBox(
      height: 220,
      child: LineChart(
        LineChartData(
          minX: 0,
          maxX: math.max(data.length - 1, 1).toDouble(),
          minY: 0,
          maxY: maxY <= 0 ? 1 : maxY * 1.2,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (value) => const FlLine(
              color: Color(0xFFE5DDD5),
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
                reservedSize: 34,
                getTitlesWidget: (value, meta) => Text(
                  _compactAxisNum(value),
                  style: const TextStyle(
                    fontSize: 9,
                    color: AppTheme.textMuted,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 28,
                getTitlesWidget: (value, meta) {
                  final index = value.toInt();
                  if (index < 0 || index >= data.length) {
                    return const SizedBox.shrink();
                  }
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      (data[index]['name'] ?? '').toString(),
                      style: const TextStyle(
                        fontSize: 9,
                        color: AppTheme.textMuted,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          lineBarsData: [
            LineChartBarData(
              spots: spots,
              isCurved: true,
              curveSmoothness: 0.35,
              color: AppTheme.rust,
              barWidth: 3,
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(
                show: true,
                gradient: LinearGradient(
                  colors: [
                    AppTheme.rust.withValues(alpha: 0.20),
                    AppTheme.rust.withValues(alpha: 0.0),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 16, color: color),
              ),
              const Spacer(),
              const Icon(Icons.brightness_1, size: 7, color: Color(0xFF4ADE80)),
            ],
          ),
          const Spacer(),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 30,
                fontWeight: FontWeight.w800,
                color: AppTheme.charcoal,
                height: 1,
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w800,
              color: AppTheme.textMuted,
              letterSpacing: 0.8,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final int value;

  const _StatusChip(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F6F2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$value',
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: AppTheme.charcoal,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              color: AppTheme.textMuted,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _MutedCenter extends StatelessWidget {
  final String text;

  const _MutedCenter({required this.text});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 120,
      child: Center(
        child: Text(
          text,
          style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
        ),
      ),
    );
  }
}
