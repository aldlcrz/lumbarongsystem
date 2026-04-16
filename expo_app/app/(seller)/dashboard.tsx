import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, View, Text, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl, SafeAreaView, 
  Dimensions, Animated, Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import apiClient from '@/src/api/client';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48 - 16) / 2;
const FILTERS = ['today', 'week', 'month', 'year'] as const;
type DateFilter = typeof FILTERS[number];
const FILTER_LABELS: Record<DateFilter, string> = { today: 'Today', week: 'This Week', month: 'This Month', year: 'This Year' };

import socketService from '@/src/services/socket';

export default function SellerDashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const toastAnim = useRef(new Animated.Value(-80)).current;
  const [stats, setStats] = useState({
    revenue: 0, orders: 0, products: 0, inquiries: 0, retention: 0,
    topProducts: [] as any[], funnel: { visitors: 0, views: 0, checkout: 0, completed: 0 }
  });

  useEffect(() => { 
    fetchStats();
    
    // Socket real-time listeners
    socketService.on('stats_update', () => fetchStats());
    socketService.on('new_order', () => {
      showNewOrderToast();
      fetchStats();
    });

    return () => {
      socketService.off('stats_update');
      socketService.off('new_order');
    };
  }, [dateFilter]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/products/seller-stats?range=${dateFilter}`);
      setStats({ revenue: 0, orders: 0, products: 0, inquiries: 0, retention: 0, topProducts: [], funnel: { visitors: 0, views: 0, checkout: 0, completed: 0 }, ...res.data });
    } catch (err) {
      console.error('Error fetching seller stats:', err);
    } finally { setLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await fetchStats(); setRefreshing(false); };

  const showNewOrderToast = () => {
    setNewOrderAlert(true);
    Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(toastAnim, { toValue: -80, duration: 300, useNativeDriver: true }).start(() => setNewOrderAlert(false));
    }, 4000);
  };

  const handleExport = async () => {
    try {
      Alert.alert('Export', 'Report export feature coming soon. Please use the web dashboard to download CSV reports.');
    } catch (e) { console.error(e); }
  };

  const funnelMax = Math.max(stats.funnel.visitors, stats.funnel.views, stats.funnel.checkout, stats.funnel.completed, 1);
  const funnelSteps = [
    { label: 'Visitors', value: stats.funnel.visitors, color: Theme.colors.secondary },
    { label: 'Product Views', value: stats.funnel.views, color: '#594436' },
    { label: 'Checkout', value: stats.funnel.checkout, color: Theme.colors.textMuted },
    { label: 'Completed', value: stats.funnel.completed, color: Theme.colors.primary },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* New Order Toast */}
      {newOrderAlert && (
        <Animated.View style={[styles.toast, { transform: [{ translateY: toastAnim }] }]}>
          <Ionicons name="bag-check-outline" size={20} color="white" />
          <View>
            <Text style={styles.toastTitle}>New Heritage Order!</Text>
            <Text style={styles.toastSub}>A customer just placed an order.</Text>
          </View>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>ARTISAN PERFORMANCE</Text>
          <Text style={styles.shopName}>Workshop <Text style={styles.shopNameAccent}>Dashboard</Text></Text>
          <Text style={styles.filterLabel}>Showing: <Text style={{ color: Theme.colors.primary }}>{FILTER_LABELS[dateFilter]}</Text></Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <Ionicons name="download-outline" size={18} color="white" />
            <Text style={styles.exportBtnText}>Export</Text>
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
        {/* Date Filter Pills */}
        <View style={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, dateFilter === f && styles.filterPillActive]}
              onPress={() => setDateFilter(f)}
            >
              <Text style={[styles.filterPillText, dateFilter === f && styles.filterPillTextActive]}>
                {f.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* KPI Cards */}
            <View style={styles.kpiGrid}>
              <KPICard label="Total Revenue" value={`₱${stats.revenue.toLocaleString()}`} icon="wallet-outline" highlight />
              <KPICard label="Shop Orders" value={String(stats.orders)} icon="cart-outline" />
              <KPICard label="Suki %" value={`${stats.retention || 0}%`} icon="people-outline" />
              <KPICard label="Inquiries" value={String(stats.inquiries)} icon="chatbubbles-outline" />
            </View>

            {/* Action Cards */}
            <Text style={styles.sectionTitle}>WORKSHOP OPERATIONS</Text>
            <View style={styles.actionGrid}>
              {[
                { label: 'Manage Registry', icon: 'layers-outline', color: Theme.colors.secondary, route: '/(seller)/products' },
                { label: 'Inventory & Stock', icon: 'cube-outline', color: '#3B82F6', route: '/(seller)/inventory' },
                { label: 'List New Piece', icon: 'add-circle-outline', color: Theme.colors.primary, route: '/(seller)/add-product' },
                { label: 'Fulfillment', icon: 'list-outline', color: '#10B981', route: '/(seller)/orders' },
              ].map((a) => (
                <TouchableOpacity key={a.label} style={styles.actionCard} onPress={() => router.push(a.route as any)}>
                  <View style={[styles.actionIcon, { backgroundColor: a.color }]}>
                    <Ionicons name={a.icon as any} size={22} color="white" />
                  </View>
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Top Products */}
            {stats.topProducts && stats.topProducts.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Top Products</Text>
                <Text style={styles.cardSub}>Most sold · {FILTER_LABELS[dateFilter]}</Text>
                <View style={styles.tableHeader}>
                  {['PRODUCT', 'SALES VOL.', 'RATING', 'STATUS'].map(h => (
                    <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
                  ))}
                </View>
                {stats.topProducts.slice(0, 5).map((prod: any, i: number) => {
                  const max = prod.maxSalesRef || 1;
                  const pct = Math.max((prod.sales / max) * 100, 2);
                  return (
                    <View key={i} style={styles.tableRow}>
                      <Text style={styles.prodName} numberOfLines={1}>{prod.name}</Text>
                      <View style={styles.salesVolCol}>
                        <View style={styles.barBg}>
                          <View style={[styles.barFill, { width: `${pct}%` as any }]} />
                        </View>
                        <Text style={styles.salesText}>{prod.sales}</Text>
                      </View>
                      <View style={styles.starsRow}>
                        {[1,2,3,4,5].map(s => (
                          <Ionicons key={s} name={s <= Math.round(prod.rating || 4) ? 'star' : 'star-outline'} size={10} color={Theme.colors.primary} />
                        ))}
                      </View>
                      <View style={[styles.statusBadge, prod.status === 'Top seller' ? styles.badgeGreen : styles.badgeAmber]}>
                        <Text style={[styles.statusText, prod.status === 'Top seller' ? styles.statusGreen : styles.statusAmber]}>
                          {prod.status || 'Trending'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Sales Funnel */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Workshop Sales Funnel</Text>
              <Text style={styles.cardSub}>{FILTER_LABELS[dateFilter]}</Text>
              <View style={{ marginTop: 20, gap: 16 }}>
                {funnelSteps.map((step, i) => {
                  const pct = funnelMax > 0 ? Math.max((step.value / funnelMax) * 100, step.value > 0 ? 6 : 3) : 3;
                  return (
                    <View key={step.label} style={styles.funnelRow}>
                      <Text style={styles.funnelLabel}>{step.label.toUpperCase()}</Text>
                      <View style={styles.funnelBarBg}>
                        <View style={[styles.funnelBarFill, { width: `${pct}%` as any, backgroundColor: step.color }]}>
                          <Text style={styles.funnelValue}>{step.value}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function KPICard({ label, value, icon, highlight }: { label: string; value: string; icon: any; highlight?: boolean }) {
  return (
    <View style={[styles.kpiCard, highlight && styles.kpiCardHighlight]}>
      <View style={styles.kpiTop}>
        <Text style={[styles.kpiLabel, highlight && { color: 'rgba(255,255,255,0.7)' }]}>{label.toUpperCase()}</Text>
        <View style={[styles.kpiDot, highlight && { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
          <Ionicons name={icon} size={16} color={highlight ? 'white' : Theme.colors.textMuted} />
        </View>
      </View>
      <View style={styles.kpiBottom}>
        <Text style={[styles.kpiValue, highlight && { color: 'white' }]}>{value}</Text>
        <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  toast: { position: 'absolute', top: 0, left: 20, right: 20, zIndex: 999, backgroundColor: '#10B981', borderRadius: 20, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
  toastTitle: { color: 'white', fontWeight: '800', fontSize: 14 },
  toastSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 24, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  eyebrow: { fontSize: 9, fontWeight: '800', color: Theme.colors.primary, letterSpacing: 2 },
  shopName: { fontSize: 22, fontWeight: '900', color: Theme.colors.secondary, marginTop: 4 },
  shopNameAccent: { color: Theme.colors.primary, fontStyle: 'italic' },
  filterLabel: { fontSize: 11, color: Theme.colors.textMuted, marginTop: 2, fontWeight: '600' },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  exportBtn: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: Theme.colors.secondary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  exportBtnText: { color: 'white', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  logoutBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border },
  scrollContent: { padding: 24 },
  filterRow: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: Theme.colors.border, gap: 4 },
  filterPill: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  filterPillActive: { backgroundColor: Theme.colors.primary },
  filterPillText: { fontSize: 9, fontWeight: '900', color: Theme.colors.textMuted, letterSpacing: 1.5 },
  filterPillTextActive: { color: 'white' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  kpiCard: { width: CARD_W, backgroundColor: 'white', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: Theme.colors.border },
  kpiCardHighlight: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  kpiTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  kpiLabel: { fontSize: 9, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 1.5 },
  kpiDot: { width: 32, height: 32, borderRadius: 10, backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  kpiBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  kpiValue: { fontSize: 22, fontWeight: '900', color: Theme.colors.secondary },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.06)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  liveText: { fontSize: 7, fontWeight: '900', color: Theme.colors.textMuted, letterSpacing: 1 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: Theme.colors.textMuted, letterSpacing: 2, marginBottom: 16 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  actionCard: { width: CARD_W, backgroundColor: 'white', borderRadius: 24, padding: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Theme.colors.border, height: 120 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionLabel: { fontSize: 12, fontWeight: '800', color: Theme.colors.secondary, textAlign: 'center' },
  card: { backgroundColor: 'white', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Theme.colors.border, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.secondary, marginBottom: 4 },
  cardSub: { fontSize: 11, color: Theme.colors.textMuted, fontWeight: '600', marginBottom: 4 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderColor: Theme.colors.border, paddingBottom: 8, marginTop: 12, marginBottom: 4 },
  tableHeaderCell: { flex: 1, fontSize: 8, fontWeight: '900', color: Theme.colors.textMuted, letterSpacing: 1 },
  tableRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.background, borderRadius: 12, padding: 10, marginTop: 6 },
  prodName: { flex: 1, fontSize: 11, fontWeight: '700', color: Theme.colors.secondary },
  salesVolCol: { flex: 1, gap: 4 },
  barBg: { height: 6, backgroundColor: Theme.colors.border, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Theme.colors.primary, borderRadius: 3 },
  salesText: { fontSize: 10, fontWeight: '700', color: Theme.colors.text },
  starsRow: { flex: 1, flexDirection: 'row', gap: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeGreen: { backgroundColor: '#F0FDF4' },
  badgeAmber: { backgroundColor: '#FFFBEB' },
  statusText: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  statusGreen: { color: '#16A34A' },
  statusAmber: { color: '#B45309' },
  funnelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  funnelLabel: { width: 90, fontSize: 8, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 1, textAlign: 'right' },
  funnelBarBg: { flex: 1, height: 44, backgroundColor: Theme.colors.background, borderRadius: 12, overflow: 'hidden' },
  funnelBarFill: { height: '100%', borderRadius: 12, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 12 },
  funnelValue: { color: 'white', fontWeight: '800', fontSize: 14 },
});
