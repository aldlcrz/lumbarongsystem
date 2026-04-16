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
  Image,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import apiClient from '@/src/api/client';
import { Product } from '@/src/types';
import { StatusBar } from 'expo-status-bar';

export default function SellerProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/products');
      // On backend, GET /products usually returns all, but for seller we might need a specific filter
      // For now, assuming current simple logic or filtering on frontend if needed
      // Actually, standard backend logic filters by sellerId if authenticated as seller? 
      // Need to verify backend product controller.
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching seller products:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Unlist Piece",
      "Are you sure you want to remove this piece from the registry?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(`/products/${id}`);
              setProducts(products.filter(p => p.id !== id));
            } catch (err) {
              Alert.alert("Error", "Could not remove product.");
            }
          }
        }
      ]
    );
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image 
        source={{ uri: item.images[0]?.url }} 
        style={styles.productImage} 
      />
      <View style={styles.productInfo}>
        <Text style={styles.categoryBadge}>{(item.category || item.categories?.[0] || 'Uncategorized').toUpperCase()}</Text>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productPrice}>₱{item.price.toLocaleString()}</Text>
        
        <View style={styles.stockRow}>
          <Text style={[styles.stockLabel, item.stock < 10 && styles.lowStock]}>
            {item.stock} in stock
          </Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="create-outline" size={20} color={Theme.colors.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={20} color={Theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Heritage Registry</Text>
        <TouchableOpacity onPress={() => router.push('/(seller)/add-product')}>
          <Ionicons name="add-circle" size={28} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={80} color={Theme.colors.border} />
              <Text style={styles.emptyText}>Registry is empty. Start listing!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.secondary },
  listContent: { padding: 20 },
  productCard: { 
    flexDirection: 'row', 
    backgroundColor: 'white', 
    borderRadius: 20, 
    marginBottom: 16, 
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border
  },
  productImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: Theme.colors.background },
  productInfo: { flex: 1, marginLeft: 16 },
  categoryBadge: { fontSize: 9, fontWeight: '800', color: Theme.colors.primary, letterSpacing: 1, marginBottom: 4 },
  productName: { fontSize: 16, fontWeight: '700', color: Theme.colors.secondary },
  productPrice: { fontSize: 14, fontWeight: '800', color: Theme.colors.primary, marginTop: 2 },
  stockRow: { marginTop: 6 },
  stockLabel: { fontSize: 11, fontWeight: '700', color: Theme.colors.textMuted },
  lowStock: { color: Theme.colors.error },
  actions: { gap: 12, paddingHorizontal: 12 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 120 },
  emptyText: { marginTop: 24, fontSize: 14, color: Theme.colors.textMuted, fontWeight: '600' }
});
