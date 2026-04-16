import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  TextInput, FlatList, ActivityIndicator, RefreshControl,
  SafeAreaView, Modal, Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { ProductCard } from '@/src/components/ProductCard';
import { Product } from '@/src/types';
import apiClient from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { useCart } from '@/src/context/CartContext';

export default function HomeScreen() {
  const { user } = useAuth();
  const { cartCount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['ALL']);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => { fetchData(); }, [activeCategory, searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const prodRes = await apiClient.get('/products');
      let fetched = prodRes.data as Product[];
      if (activeCategory !== 'ALL') {
        fetched = fetched.filter((p: any) => p.category === activeCategory || p.categories?.includes(activeCategory));
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        fetched = fetched.filter((p: any) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.seller?.shopName?.toLowerCase().includes(q) ||
          p.artisan?.toLowerCase().includes(q)
        );
      }
      setProducts(fetched);
      const catRes = await apiClient.get('/categories');
      const catNames = (catRes.data as any[]).map(c => c.name);
      setCategories(['ALL', ...new Set(catNames)]);
    } catch (err: any) {
      setError('Failed to load pieces. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Top Row */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(customer)/cart')}>
            <Ionicons name="cart-outline" size={22} color={Theme.colors.secondary} />
            {cartCount > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(customer)/profile' as any)}>
            <Ionicons name="person-outline" size={22} color={Theme.colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Theme.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by product or artisan..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Theme.colors.textMuted}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catScrollContent}>
        <TouchableOpacity
          style={[styles.catPill, activeCategory === 'ALL' && styles.catPillActive]}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={[styles.catText, activeCategory === 'ALL' && styles.catTextActive]}>ALL +</Text>
        </TouchableOpacity>
        {categories.slice(1, 4).map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.catPill, activeCategory === cat && styles.catPillActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Section Header */}
      <View style={styles.sectionRow}>
        <View>
          <Text style={styles.sectionTag}>ARTISAN COLLECTION</Text>
          <Text style={styles.sectionTitle}>{activeCategory === 'ALL' ? 'Curated For You' : activeCategory}</Text>
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowCategoryModal(true)}>
          <Ionicons name="options-outline" size={20} color={Theme.colors.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ProductCard product={item} />}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={Theme.colors.primary} style={styles.loader} />
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="wifi-outline" size={64} color={Theme.colors.textMuted} />
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
                <Text style={styles.retryText}>RETRY</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="bag-outline" size={64} color={Theme.colors.textMuted} />
              <Text style={styles.emptyText}>No pieces found matching your criteria.</Text>
            </View>
          )
        }
      />

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalEyebrow}>CATALOGUE</Text>
              <Text style={styles.modalTitle}>Browse Categories</Text>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {categories.map(cat => {
                const isSelected = activeCategory === cat;
                const displayName = cat === 'ALL' ? 'All Collections' : cat.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.modalItem, isSelected && styles.modalItemActive]}
                    onPress={() => { setActiveCategory(cat); setShowCategoryModal(false); }}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>{displayName}</Text>
                    {isSelected && <View style={styles.activeDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseRow} onPress={() => setShowCategoryModal(false)}>
              <Text style={styles.modalCloseText}>Select Category</Text>
              <View style={styles.modalCloseIcon}>
                <Ionicons name="close" size={16} color={Theme.colors.secondary} />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Theme.colors.background },
  listContent: { paddingBottom: 60 },
  header: { padding: Theme.spacing.lg, paddingTop: 10 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  welcomeText: { fontSize: 13, color: Theme.colors.textMuted },
  userName: { fontSize: 22, fontWeight: '800', color: Theme.colors.secondary },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border },
  badge: { position: 'absolute', top: -2, right: -2, backgroundColor: Theme.colors.primary, minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 2, borderColor: 'white' },
  badgeText: { color: 'white', fontSize: 9, fontWeight: '900' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: Theme.radius.md, paddingHorizontal: 14, height: 52, marginBottom: 20, borderWidth: 1, borderColor: Theme.colors.border, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, color: Theme.colors.text },
  catScroll: { marginBottom: 24 },
  catScrollContent: { gap: 8, paddingRight: 16 },
  catPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 30, backgroundColor: 'white', borderWidth: 1, borderColor: Theme.colors.border },
  catPillActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  catText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: Theme.colors.secondary },
  catTextActive: { color: 'white' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionTag: { fontSize: 8, fontWeight: '800', color: Theme.colors.primary, letterSpacing: 2, marginBottom: 4 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: Theme.colors.secondary },
  filterBtn: { padding: 8 },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: Theme.spacing.lg },
  loader: { marginTop: 100 },
  emptyContainer: { marginTop: 80, alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { marginTop: 16, fontSize: 14, color: Theme.colors.textMuted, textAlign: 'center', lineHeight: 20 },
  retryButton: { marginTop: 24, backgroundColor: Theme.colors.secondary, paddingVertical: 12, paddingHorizontal: 32, borderRadius: Theme.radius.full },
  retryText: { color: 'white', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(42, 30, 20, 0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 40, overflow: 'hidden', maxHeight: '80%' },
  modalHeader: { paddingHorizontal: 32, paddingTop: 32, paddingBottom: 16 },
  modalEyebrow: { fontSize: 9, fontWeight: '800', color: Theme.colors.primary, letterSpacing: 3, opacity: 0.7 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Theme.colors.secondary, marginTop: 4 },
  modalList: { maxHeight: 360, paddingHorizontal: 20 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderRadius: 16 },
  modalItemActive: { backgroundColor: Theme.colors.background },
  modalItemText: { fontSize: 16, color: Theme.colors.secondary + 'AA', fontWeight: '500' },
  modalItemTextActive: { color: Theme.colors.primary, fontWeight: '800' },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.colors.primary },
  modalCloseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', margin: 20, padding: 16, backgroundColor: Theme.colors.background, borderRadius: 20, borderWidth: 1, borderColor: Theme.colors.border },
  modalCloseText: { fontSize: 16, fontWeight: '800', color: Theme.colors.secondary },
  modalCloseIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
});
