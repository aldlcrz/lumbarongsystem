import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import apiClient from '@/src/api/client';
import { StatusBar } from 'expo-status-bar';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  variation?: string;
  size?: string;
  product?: {
    name: string;
    images?: { url: string }[];
  };
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');

  const tabs = ['ALL', 'PENDING', 'TO SHIP', 'COMPLETED', 'CANCELLED'];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/orders/my-orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#F59E0B'; // Amber
      case 'processing':
      case 'to ship': return '#3B82F6'; // Blue
      case 'shipped': return '#8B5CF6'; // Purple
      case 'delivered':
      case 'completed': return '#10B981'; // Green
      case 'cancelled': return '#EF4444'; // Red
      default: return Theme.colors.textMuted;
    }
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PENDING') return o.status.toLowerCase() === 'pending';
    if (activeTab === 'TO SHIP') return o.status.toLowerCase() === 'processing' || o.status.toLowerCase() === 'to ship';
    if (activeTab === 'COMPLETED') return o.status.toLowerCase() === 'completed' || o.status.toLowerCase() === 'delivered';
    if (activeTab === 'CANCELLED') return o.status.toLowerCase() === 'cancelled';
    return true;
  });

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.orderCard} 
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/(customer)/orders/[id]', params: { id: item.id } } as any)}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>ORDER REF: <Text style={styles.orderIdVal}>#{item.id.substring(0, 8).toUpperCase()}</Text></Text>
          <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.itemsList}>
        {item.items.slice(0, 2).map((it, idx) => (
          <View key={idx} style={styles.itemRow}>
            <View style={styles.itemIconBox}>
              <Ionicons name="shirt-outline" size={14} color={Theme.colors.primary} />
            </View>
            <Text style={styles.itemName} numberOfLines={1}>
              {it.product?.name || 'Artisan Piece'}
            </Text>
            <Text style={styles.itemQty}>× {it.quantity}</Text>
          </View>
        ))}
        {item.items.length > 2 && (
          <Text style={styles.moreItems}>+ {item.items.length - 2} more pieces</Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View>
          <Text style={styles.totalLabel}>TOTAL INVESTMENT</Text>
          <Text style={styles.totalAmount}>₱{item.totalAmount.toLocaleString()}</Text>
        </View>
        <View style={styles.detailsBtn}>
          <Text style={styles.detailsBtnText}>View Details</Text>
          <Ionicons name="chevron-forward" size={14} color={Theme.colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.secondary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.eyebrow}>MY PURCHASES</Text>
          <Text style={styles.headerTitle}>Heritage <Text style={styles.headerTitleAccent}>Registry</Text></Text>
        </View>
        <TouchableOpacity style={styles.filterIcn}>
          <Ionicons name="search-outline" size={22} color={Theme.colors.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
          {tabs.map(item => (
            <TouchableOpacity 
              key={item}
              style={[styles.tab, activeTab === item && styles.tabActive]}
              onPress={() => setActiveTab(item)}
            >
              <Text style={[styles.tabText, activeTab === item && styles.tabTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="bag-outline" size={40} color={Theme.colors.border} />
              </View>
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptyText}>Your curated collection of heritage pieces will appear here.</Text>
              <TouchableOpacity style={styles.shopNowBtn} onPress={() => router.replace('/(customer)/home')}>
                <Text style={styles.shopNowText}>START BROWSING</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  filterIcn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  eyebrow: { fontSize: 8, fontWeight: '800', color: Theme.colors.primary, letterSpacing: 2 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: Theme.colors.secondary },
  headerTitleAccent: { color: Theme.colors.primary, fontStyle: 'italic' },
  tabsWrapper: { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  tabsScrollContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border
  },
  tabActive: { backgroundColor: Theme.colors.secondary, borderColor: Theme.colors.secondary },
  tabText: { fontSize: 10, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 1 },
  tabTextActive: { color: 'white' },
  listContent: { padding: 20, paddingBottom: 40 },
  orderCard: { 
    backgroundColor: 'white', 
    borderRadius: 28, 
    padding: 20, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  orderId: { fontSize: 9, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 1 },
  orderIdVal: { color: Theme.colors.secondary },
  orderDate: { fontSize: 9, fontWeight: '800', color: Theme.colors.textMuted, marginTop: 4, letterSpacing: 0.5 },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 10,
    gap: 6
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  itemsList: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, paddingBottom: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  itemIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  itemName: { flex: 1, fontSize: 13, fontWeight: '700', color: Theme.colors.secondary },
  itemQty: { fontSize: 13, fontWeight: '800', color: Theme.colors.textMuted },
  moreItems: { fontSize: 11, color: Theme.colors.primary, fontWeight: '700', marginLeft: 40, marginTop: -4 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  totalLabel: { fontSize: 8, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 1.5, marginBottom: 4 },
  totalAmount: { fontSize: 20, fontWeight: '900', color: Theme.colors.secondary },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Theme.colors.background, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  detailsBtnText: { fontSize: 11, fontWeight: '800', color: Theme.colors.primary },
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border, marginBottom: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.secondary, marginBottom: 8 },
  emptyText: { fontSize: 13, color: Theme.colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  shopNowBtn: { backgroundColor: Theme.colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 28 },
  shopNowText: { color: 'white', fontSize: 12, fontWeight: '900', letterSpacing: 1 }
});
