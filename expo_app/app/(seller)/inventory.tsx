import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, SafeAreaView, RefreshControl
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import apiClient from '@/src/api/client';
import { StatusBar } from 'expo-status-bar';

const STATUS_FILTERS = ['All', 'Active', 'Low Stock', 'Out of Stock'] as const;
type StockStatus = typeof STATUS_FILTERS[number];

function getStockStatus(stock: number): StockStatus {
  if (stock > 5) return 'Active';
  if (stock > 0) return 'Low Stock';
  return 'Out of Stock';
}

export default function InventoryScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatus>('All');

  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiClient.get('/products/seller');
      setProducts(res.data);
    } catch (err) {
      console.error('Inventory fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchProducts(); setRefreshing(false); };

  const handleDelete = (product: any) => {
    Alert.alert(
      'Remove from Registry',
      `Are you sure you want to remove "${product.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/products/${product.id}`);
              setProducts(prev => prev.filter(p => p.id !== product.id));
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete product.');
            }
          }
        }
      ]
    );
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.categories?.join(' ').toLowerCase().includes(search.toLowerCase()));
    const status = getStockStatus(p.stock);
    const matchStatus = statusFilter === 'All' || status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getImageUrl = (product: any) => {
    if (product.images && product.images.length > 0) {
      const url = product.images[0].url;
      if (url?.startsWith('http')) return url;
      return `http://192.168.100.5:5000${url?.startsWith('/') ? '' : '/'}${url}`;
    }
    return '';
  };

  const renderItem = ({ item }: any) => {
    const status = getStockStatus(item.stock);
    const statusColor = status === 'Active' ? '#16A34A' : status === 'Low Stock' ? '#B45309' : '#DC2626';
    const statusBg = status === 'Active' ? '#F0FDF4' : status === 'Low Stock' ? '#FFFBEB' : '#FEF2F2';

    return (
      <View style={styles.row}>
        <Image source={getImageUrl(item)} style={styles.productImage} contentFit="cover" />
        <View style={styles.rowInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productId}>Ref #ART-00{item.id}</Text>
          <View style={styles.stockRow}>
            <View style={styles.stockBarBg}>
              <View style={[styles.stockBarFill, {
                width: `${Math.min(item.stock * 5, 100)}%` as any,
                backgroundColor: status === 'Active' ? Theme.colors.secondary : status === 'Low Stock' ? '#F59E0B' : '#EF4444'
              }]} />
            </View>
            <Text style={styles.stockText}>{item.stock} units</Text>
          </View>
          <View style={styles.rowBottom}>
            <Text style={styles.price}>₱{parseFloat(item.price).toLocaleString()}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
            </View>
          </View>
        </View>
        <View style={styles.rowActions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push({ pathname: '/(seller)/add-product', params: { id: item.id } } as any)}>
            <Ionicons name="create-outline" size={18} color={Theme.colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.secondary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.eyebrow}>ARTISAN CATALOG</Text>
          <Text style={styles.title}>Inventory <Text style={styles.titleAccent}>& Stock</Text></Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(seller)/add-product')}>
          <Ionicons name="add" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search + Filter */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={Theme.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Filter by product name..."
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, statusFilter === f && styles.filterPillActive]}
            onPress={() => setStatusFilter(f)}
          >
            <Text style={[styles.filterText, statusFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={64} color={Theme.colors.border} />
              <Text style={styles.emptyText}>No products found</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(seller)/add-product')}>
                <Text style={styles.emptyBtnText}>ADD FIRST PRODUCT</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  eyebrow: { fontSize: 9, fontWeight: '800', color: Theme.colors.primary, letterSpacing: 2 },
  title: { fontSize: 20, fontWeight: '900', color: Theme.colors.secondary },
  titleAccent: { color: Theme.colors.primary, fontStyle: 'italic' },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', margin: 16, marginBottom: 8, borderRadius: 14, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: Theme.colors.border, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, color: Theme.colors.text },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: 'white', borderWidth: 1, borderColor: Theme.colors.border },
  filterPillActive: { backgroundColor: Theme.colors.secondary, borderColor: Theme.colors.secondary },
  filterText: { fontSize: 10, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 1 },
  filterTextActive: { color: 'white' },
  list: { padding: 16, gap: 12 },
  row: { backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: Theme.colors.border, padding: 16, flexDirection: 'row', gap: 16, alignItems: 'center' },
  productImage: { width: 80, height: 80, borderRadius: 14, backgroundColor: Theme.colors.inputBg },
  rowInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '800', color: Theme.colors.secondary, marginBottom: 2 },
  productId: { fontSize: 9, fontWeight: '700', color: Theme.colors.textMuted, letterSpacing: 1, marginBottom: 8 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  stockBarBg: { flex: 1, height: 5, backgroundColor: Theme.colors.border, borderRadius: 3, overflow: 'hidden' },
  stockBarFill: { height: '100%', borderRadius: 3 },
  stockText: { fontSize: 10, fontWeight: '700', color: Theme.colors.text },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 16, fontWeight: '900', color: Theme.colors.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  rowActions: { gap: 8 },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '800', color: Theme.colors.secondary, marginTop: 16 },
  emptyBtn: { marginTop: 20, backgroundColor: Theme.colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30 },
  emptyBtnText: { color: 'white', fontWeight: '900', fontSize: 11, letterSpacing: 2 },
});
