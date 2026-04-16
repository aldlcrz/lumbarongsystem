import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, SafeAreaView, Dimensions, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import apiClient from '@/src/api/client';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48 - 16) / 2;
const FILTERS = ['today', 'week', 'month', 'year'] as const;
type DateFilter = typeof FILTERS[number];

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  pending:    { bg: '#FFFBEB', text: '#B45309', icon: 'time-outline' },
  processing: { bg: '#EFF6FF', text: '#1D4ED8', icon: 'refresh-outline' },
  shipped:    { bg: '#EEF2FF', text: '#4338CA', icon: 'car-outline' },
  completed:  { bg: '#F0FDF4', text: '#15803D', icon: 'checkmark-circle-outline' },
  cancelled:  { bg: '#FEF2F2', text: '#DC2626', icon: 'close-circle-outline' },
};

import socketService from '@/src/services/socket';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('week');
  const [stats, setStats] = useState({
    totalSales: '—', totalOrders: '—', activeCustomers: '—', liveProducts: '—'
  });
  const [analytics, setAnalytics] = useState({
    revenueSeries: [] as any[],
    monthlySignups: [] as any[],
    recentActivity: [] as any[],
    topLocations: [] as any[],
    orderStatusBreakdown: { pending: 0, processing: 0, shipped: 0, completed: 0, cancelled: 0 },
    topProducts: [] as any[],
    topCategories: [] as any[],
  });

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        apiClient.get(`/admin/stats?range=${dateFilter}`),
        apiClient.get(`/admin/analytics?range=${dateFilter}`)
      ]);
      setStats(statsRes.data);
      const d = analyticsRes.data;
      setAnalytics({
        revenueSeries: d.revenueSeries || [],
        monthlySignups: d.monthlySignups || [],
        recentActivity: d.recentActivity || [],
        topLocations: d.topLocations || [],
        orderStatusBreakdown: d.orderStatusBreakdown || { pending: 0, processing: 0, shipped: 0, completed: 0, cancelled: 0 },
        topProducts: d.topProducts || [],
        topCategories: d.topCategories || [],
      });
    } catch (err) {
      console.error('Admin dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => { 
    fetchData(); 
    
    // Socket real-time listeners
    socketService.on('stats_update', () => fetchData());
    socketService.on('order_created', () => fetchData());
    socketService.on('order_updated', () => fetchData());
    socketService.on('user_updated', () => fetchData());

    return () => {
      socketService.off('stats_update');
      socketService.off('order_created');
      socketService.off('order_updated');
      socketService.off('user_updated');
    };
  }, [dateFilter]);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const handleDownloadReport = () => {
    Alert.alert('Download Report', 'Report download is available on the web dashboard. Please visit the admin panel on your browser to export CSV reports.');
  };

  const maxRevenue = Math.max(...analytics.revenueSeries.map((d: any) => d.revenue || 0), 1);
  const maxLocation = Math.max(...analytics.topLocations.map((l: any) => l.count || 0), 1);
  const maxProductSales = Math.max(...analytics.topProducts.map((p: any) => p.sales || 0), 1);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>ENTERPRISE OVERVIEW</Text>
          <Text style={styles.title}>Dashboard <Text style={styles.titleMuted}>Insights</Text></Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadReport}>
            <Ionicons name="download-outline" size={16} color="white" />
            <Text style={styles.downloadBtnText}>Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
            <Ionicons name="log-out-outline" size={20} color={Theme.colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Filter */}
        <View style={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[styles.filterPill, dateFilter === f && styles.filterPillActive]} onPress={() => setDateFilter(f)}>
              <Text style={[styles.filterText, dateFilter === f && styles.filterTextActive]}>{f.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* KPI Cards */}
            <View style={styles.kpiGrid}>
              <StatCard label="Total Sales" value={String(stats.totalSales)} icon="cash-outline" color={Theme.colors.primary} />
              <StatCard label="Total Orders" value={String(stats.totalOrders)} icon="bag-outline" color="#3B82F6" />
              <StatCard label="Active Customers" value={String(stats.activeCustomers)} icon="people-outline" color="#10B981" />
              <StatCard label="Live Products" value={String(stats.liveProducts)} icon="cube-outline" color="#F59E0B" />
            </View>

            {/* Quick Nav */}
            <Text style={styles.sectionLabel}>MANAGE PLATFORM</Text>
            <View style={styles.navGrid}>
              {[
                { label: 'Pending Sellers', icon: 'storefront-outline', route: '/(admin)/pending-sellers', color: '#F59E0B' },
                { label: 'All Users', icon: 'people-outline', route: '/(admin)/users', color: '#3B82F6' },
                { label: 'Reports', icon: 'bar-chart-outline', route: '/(admin)/reports', color: Theme.colors.primary },
                { label: 'Settings', icon: 'settings-outline', route: '/(admin)/settings', color: '#10B981' },
              ].map(n => (
                <TouchableOpacity key={n.label} style={styles.navCard} onPress={() => router.push(n.route as any)}>
                  <View style={[styles.navIcon, { backgroundColor: n.color + '20' }]}>
                    <Ionicons name={n.icon as any} size={22} color={n.color} />
                  </View>
                  <Text style={styles.navLabel}>{n.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Revenue Trend (simplified bar chart) */}
            {analytics.revenueSeries.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Revenue Trend</Text>
                <Text style={styles.cardSub}>Total earnings · {dateFilter} view</Text>
                <View style={styles.chartArea}>
                  {analytics.revenueSeries.slice(-7).map((d: any, i: number) => {
                    const pct = maxRevenue > 0 ? Math.max((d.revenue / maxRevenue) * 100, 2) : 2;
                    return (
                      <View key={i} style={styles.barGroup}>
                        <View style={styles.barContainer}>
                          <View style={[styles.barColumn, { height: `${pct}%` as any }]} />
                        </View>
                        <Text style={styles.barLabel}>{d.name}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Order Status Breakdown */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Order Status</Text>
              <Text style={styles.cardSub}>Breakdown by fulfillment stage</Text>
              <View style={styles.statusGrid}>
                {Object.entries(analytics.orderStatusBreakdown).map(([status, count]) => {
                  const meta = STATUS_COLORS[status] || STATUS_COLORS.pending;
                  return (
                    <View key={status} style={[styles.statusCard, { backgroundColor: meta.bg }]}>
                      <Ionicons name={meta.icon as any} size={20} color={meta.text} />
                      <Text style={[styles.statusCount, { color: meta.text }]}>{count as number}</Text>
                      <Text style={[styles.statusLabel, { color: meta.text }]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Top Products */}
            {analytics.topProducts.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Top Selling Products</Text>
                <Text style={styles.cardSub}>Best performing listings</Text>
                {analytics.topProducts.slice(0, 5).map((prod: any, i: number) => {
                  const pct = Math.max((prod.sales / maxProductSales) * 100, 2);
                  return (
                    <View key={i} style={styles.topProdRow}>
                      <View style={styles.topProdInfo}>
                        <Text style={styles.topProdName} numberOfLines={1}>{prod.name}</Text>
                        <Text style={styles.topProdCat}>{prod.category}</Text>
                      </View>
                      <View style={styles.topProdStats}>
                        <View style={styles.barBgSmall}>
                          <View style={[styles.barFillSmall, { width: `${pct}%` as any }]} />
                        </View>
                        <Text style={styles.topProdSales}>{prod.sales} sold</Text>
                      </View>
                      <Text style={styles.topProdRev}>₱{prod.revenue?.toLocaleString() || 0}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Orders by Location */}
            {analytics.topLocations.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Orders by Location</Text>
                <Text style={styles.cardSub}>Top delivery cities</Text>
                <View style={{ marginTop: 16, gap: 16 }}>
                  {analytics.topLocations.map((loc: any, i: number) => {
                    const pct = Math.max((loc.count / maxLocation) * 100, 2);
                    return (
                      <View key={i}>
                        <View style={styles.locRow}>
                          <Text style={styles.locCity}>{loc.city?.toUpperCase()}</Text>
                          <Text style={styles.locCount}>{loc.count} orders</Text>
                        </View>
                        <View style={styles.locBarBg}>
                          <View style={[styles.locBarFill, { width: `${pct}%` as any }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Top Categories */}
            {analytics.topCategories.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Top Categories</Text>
                <Text style={styles.cardSub}>Sales by product category</Text>
                {analytics.topCategories.map((cat: any, i: number) => {
                  const colors = [Theme.colors.primary, '#E56D4B', Theme.colors.textMuted, '#B3A499', Theme.colors.border];
                  return (
                    <View key={i} style={styles.catRow}>
                      <View style={[styles.catDot, { backgroundColor: colors[i % colors.length] }]} />
                      <Text style={styles.catName}>{cat.name}</Text>
                      <Text style={styles.catValue}>{cat.value} items</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <View style={[styles.kpiCard]}>
      <View style={styles.kpiTop}>
        <View style={[styles.kpiIconBox, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={styles.livePill}><View style={styles.liveDot} /></View>
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  eyebrow: { fontSize: 9, fontWeight: '800', color: Theme.colors.primary, letterSpacing: 2 },
  title: { fontSize: 22, fontWeight: '900', color: Theme.colors.secondary, marginTop: 2 },
  titleMuted: { color: Theme.colors.textMuted, fontWeight: '300', fontStyle: 'italic' },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  downloadBtn: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: Theme.colors.secondary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  downloadBtnText: { color: 'white', fontSize: 11, fontWeight: '800' },
  logoutBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border },
  scrollContent: { padding: 24, paddingBottom: 40 },
  filterRow: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 14, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: Theme.colors.border, gap: 2 },
  filterPill: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  filterPillActive: { backgroundColor: Theme.colors.primary },
  filterText: { fontSize: 9, fontWeight: '900', color: Theme.colors.textMuted, letterSpacing: 1.5 },
  filterTextActive: { color: 'white' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  kpiCard: { width: CARD_W, backgroundColor: 'white', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: Theme.colors.border },
  kpiTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  kpiIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  livePill: { flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
  kpiValue: { fontSize: 20, fontWeight: '900', color: Theme.colors.secondary, marginBottom: 4 },
  kpiLabel: { fontSize: 9, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 1.5 },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: Theme.colors.textMuted, letterSpacing: 2, marginBottom: 16 },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  navCard: { width: CARD_W, backgroundColor: 'white', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: Theme.colors.border, alignItems: 'center', justifyContent: 'center', height: 100 },
  navIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  navLabel: { fontSize: 12, fontWeight: '800', color: Theme.colors.secondary, textAlign: 'center' },
  card: { backgroundColor: 'white', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: Theme.colors.border, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.secondary, marginBottom: 4 },
  cardSub: { fontSize: 11, color: Theme.colors.textMuted, fontWeight: '600', marginBottom: 4 },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', height: 150, marginTop: 20, gap: 6 },
  barGroup: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barContainer: { width: '100%', height: 130, justifyContent: 'flex-end' },
  barColumn: { width: '100%', backgroundColor: Theme.colors.primary, borderRadius: 4, opacity: 0.85 },
  barLabel: { fontSize: 8, fontWeight: '700', color: Theme.colors.textMuted, marginTop: 4, textAlign: 'center' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  statusCard: { width: (width - 48 - 40 - 8) / 3, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6 },
  statusCount: { fontSize: 22, fontWeight: '900' },
  statusLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  topProdRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.background, borderRadius: 12, padding: 10, marginTop: 8, gap: 12 },
  topProdInfo: { flex: 2 },
  topProdName: { fontSize: 12, fontWeight: '800', color: Theme.colors.secondary },
  topProdCat: { fontSize: 10, color: Theme.colors.textMuted, fontWeight: '600' },
  topProdStats: { flex: 2 },
  barBgSmall: { height: 5, backgroundColor: Theme.colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 3 },
  barFillSmall: { height: '100%', backgroundColor: Theme.colors.primary, borderRadius: 3 },
  topProdSales: { fontSize: 10, fontWeight: '700', color: Theme.colors.text },
  topProdRev: { fontSize: 12, fontWeight: '900', color: Theme.colors.primary, flex: 1, textAlign: 'right' },
  locRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  locCity: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, color: Theme.colors.secondary },
  locCount: { fontSize: 10, fontWeight: '700', color: Theme.colors.textMuted },
  locBarBg: { height: 8, backgroundColor: Theme.colors.background, borderRadius: 4, overflow: 'hidden' },
  locBarFill: { height: '100%', backgroundColor: Theme.colors.primary, borderRadius: 4 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { flex: 1, fontSize: 13, fontWeight: '700', color: Theme.colors.secondary },
  catValue: { fontSize: 12, fontWeight: '700', color: Theme.colors.textMuted },
});
