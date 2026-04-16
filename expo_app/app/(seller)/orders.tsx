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
  ScrollView,
  Image,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import apiClient from '@/src/api/client';
import { StatusBar } from 'expo-status-bar';

const { height } = Dimensions.get('window');

export default function SellerOrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const tabs = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/orders/seller');
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching seller orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await apiClient.put(`/orders/${orderId}/status`, { status });
      Alert.alert("Success", `Order marked as ${status}`);
      fetchOrders();
      setModalVisible(false);
    } catch (err) {
      Alert.alert("Error", "Could not update order status.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#F59E0B';
      case 'processing': return '#3B82F6';
      case 'shipped': return '#8B5CF6';
      case 'delivered':
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return Theme.colors.textMuted;
    }
  };

  const filteredOrders = orders.filter(o => o.status.toUpperCase() === activeTab);

  const renderOrderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.orderCard} 
      activeOpacity={0.7}
      onPress={() => {
        setSelectedOrder(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>#LB-{item.id.substring(0, 8).toUpperCase()}</Text>
          <Text style={styles.customerName}>{item.customer?.name || 'Heritage Buyer'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Theme.colors.textMuted} />
      </View>

      <View style={styles.itemsPreview}>
        {item.items?.slice(0, 2).map((it: any, idx: number) => (
          <Text key={idx} style={styles.itemText} numberOfLines={1}>
            {it.quantity}x {it.product?.name || 'Artisan Piece'}
          </Text>
        ))}
        {item.items?.length > 2 && <Text style={styles.moreText}>+{item.items.length - 2} more pieces</Text>}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        <Text style={styles.orderTotal}>₱{item.totalAmount.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workshop Fulfillments</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tabs}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.tab, activeTab === item && styles.tabActive]}
              onPress={() => setActiveTab(item)}
            >
              <Text style={[styles.tabText, activeTab === item && styles.tabTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item}
          contentContainerStyle={styles.tabsScrollContent}
        />
      </View>

      {loading && !refreshing ? (
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
              <Ionicons name="documents-outline" size={80} color={Theme.colors.border} />
              <Text style={styles.emptyText}>No orders in this stage.</Text>
            </View>
          }
        />
      )}

      {/* Order Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Theme.colors.secondary} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.statusBanner, { backgroundColor: getStatusColor(selectedOrder.status) + '20' }]}>
                  <Text style={[styles.statusBannerText, { color: getStatusColor(selectedOrder.status) }]}>
                    CURRENT STATUS: {selectedOrder.status.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.orderSection}>
                  <Text style={styles.sectionLabel}>CUSTOMER & SHIPPING</Text>
                  <Text style={styles.customerText}>{selectedOrder.customer?.name}</Text>
                  <Text style={styles.addressText}>
                    {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.barangay}, {selectedOrder.shippingAddress?.city}
                  </Text>
                  <Text style={styles.phoneText}>Phone: {selectedOrder.shippingAddress?.phone}</Text>
                </View>

                <View style={styles.orderSection}>
                  <Text style={styles.sectionLabel}>ITEMS ORDERED</Text>
                  {selectedOrder.items.map((it: any, idx: number) => (
                    <View key={idx} style={styles.modalItemRow}>
                      <Text style={styles.modalItemText}>{it.quantity}x {it.product?.name}</Text>
                      <Text style={styles.modalItemPrice}>₱{(it.price * it.quantity).toLocaleString()}</Text>
                    </View>
                  ))}
                  <View style={styles.modalTotalRow}>
                    <Text style={styles.totalLabel}>TOTAL REVENUE</Text>
                    <Text style={styles.totalValue}>₱{selectedOrder.totalAmount.toLocaleString()}</Text>
                  </View>
                </View>

                {selectedOrder.paymentProof && (
                  <View style={styles.orderSection}>
                    <Text style={styles.sectionLabel}>PAYMENT VERIFICATION</Text>
                    <Image source={{ uri: selectedOrder.paymentProof }} style={styles.paymentProofImg} resizeMode="contain" />
                    <Text style={styles.refText}>Ref: {selectedOrder.paymentReference}</Text>
                  </View>
                )}

                {/* Status Transitions */}
                <View style={styles.statusActions}>
                  {selectedOrder.status === 'Pending' && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]} onPress={() => updateStatus(selectedOrder.id, 'Processing')}>
                      <Text style={styles.actionBtnText}>START PROCESSING</Text>
                    </TouchableOpacity>
                  )}
                  {selectedOrder.status === 'Processing' && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]} onPress={() => updateStatus(selectedOrder.id, 'Shipped')}>
                      <Text style={styles.actionBtnText}>MARK AS SHIPPED</Text>
                    </TouchableOpacity>
                  )}
                  {selectedOrder.status === 'Shipped' && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]} onPress={() => updateStatus(selectedOrder.id, 'Delivered')}>
                      <Text style={styles.actionBtnText}>MARK AS DELIVERED</Text>
                    </TouchableOpacity>
                  )}
                  {selectedOrder.status === 'Delivered' && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Theme.colors.secondary }]} onPress={() => updateStatus(selectedOrder.id, 'Completed')}>
                      <Text style={styles.actionBtnText}>COMPLETE COMMISSION</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    padding: 24,
    backgroundColor: 'white'
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.secondary },
  tabsContainer: { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  tabsScrollContent: { paddingHorizontal: 20, paddingBottom: 10 },
  tab: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    marginRight: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabActive: { borderBottomColor: Theme.colors.primary },
  tabText: { fontSize: 11, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 1 },
  tabTextActive: { color: Theme.colors.primary },
  listContent: { padding: 24 },
  orderCard: { 
    backgroundColor: 'white', 
    borderRadius: 24, 
    padding: 24, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  orderId: { fontSize: 10, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 1 },
  customerName: { fontSize: 16, fontWeight: '800', color: Theme.colors.secondary, marginTop: 4 },
  itemsPreview: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Theme.colors.border + '50' },
  itemText: { fontSize: 13, fontWeight: '600', color: Theme.colors.text, marginBottom: 4 },
  moreText: { fontSize: 12, color: Theme.colors.textMuted, fontStyle: 'italic' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderDate: { fontSize: 11, fontWeight: '700', color: Theme.colors.textMuted },
  orderTotal: { fontSize: 18, fontWeight: '900', color: Theme.colors.primary },
  emptyContainer: { alignItems: 'center', marginTop: 120 },
  emptyText: { marginTop: 24, fontSize: 14, color: Theme.colors.textMuted, fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: height * 0.85 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Theme.colors.secondary },
  statusBanner: { padding: 12, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  statusBannerText: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  orderSection: { marginBottom: 24 },
  sectionLabel: { fontSize: 9, fontWeight: '900', color: Theme.colors.textMuted, letterSpacing: 2, marginBottom: 12 },
  customerText: { fontSize: 16, fontWeight: '800', color: Theme.colors.secondary },
  addressText: { fontSize: 14, color: Theme.colors.text, marginTop: 4, lineHeight: 20 },
  phoneText: { fontSize: 13, color: Theme.colors.textMuted, marginTop: 4 },
  modalItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  modalItemText: { fontSize: 14, fontWeight: '600', color: Theme.colors.secondary },
  modalItemPrice: { fontSize: 14, fontWeight: '700', color: Theme.colors.text },
  modalTotalRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Theme.colors.border, flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 12, fontWeight: '800', color: Theme.colors.textMuted },
  totalValue: { fontSize: 20, fontWeight: '900', color: Theme.colors.primary },
  paymentProofImg: { width: '100%', height: 200, borderRadius: 16, backgroundColor: Theme.colors.background, marginBottom: 12 },
  refText: { fontSize: 12, color: Theme.colors.textMuted, textAlign: 'center', fontWeight: '700' },
  statusActions: { marginTop: 20, paddingBottom: 40 },
  actionBtn: { height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  actionBtnText: { color: 'white', fontWeight: '900', letterSpacing: 1.5, fontSize: 12 }
});
