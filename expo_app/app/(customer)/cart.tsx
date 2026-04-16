import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  Dimensions,
  Platform
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { useCart } from '@/src/context/CartContext';
import { StatusBar } from 'expo-status-bar';

export default function CartScreen() {
  const { items, selectedTotal, updateQuantity, removeFromCart, toggleSelection } = useCart();

  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `http://192.168.100.5:5000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.checkbox} 
        onPress={() => toggleSelection(item.product.id, item.color, item.size)}
      >
        <Ionicons 
          name={item.isSelected ? "checkbox" : "square-outline"} 
          size={24} 
          color={item.isSelected ? Theme.colors.primary : Theme.colors.border} 
        />
      </TouchableOpacity>

      <Image 
        source={getImageUrl(item.product.images[0]?.url)} 
        style={styles.itemImage}
      />

      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
        <Text style={styles.itemVariation}>
          {item.color}{item.color && item.size ? ' / ' : ''}{item.size}
        </Text>
        <Text style={styles.itemPrice}>₱{item.product.price.toLocaleString()}</Text>
        
        <View style={styles.qtyRow}>
          <View style={styles.qtyControls}>
            <TouchableOpacity 
              onPress={() => updateQuantity(item.product.id, item.quantity - 1, item.color, item.size)}
            >
              <Ionicons name="remove-circle-outline" size={24} color={Theme.colors.secondary} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity 
              onPress={() => updateQuantity(item.product.id, item.quantity + 1, item.color, item.size)}
            >
              <Ionicons name="add-circle-outline" size={24} color={Theme.colors.secondary} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            onPress={() => removeFromCart(item.product.id, item.color, item.size)}
          >
            <Ionicons name="trash-outline" size={20} color={Theme.colors.error} />
          </TouchableOpacity>
        </View>
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
        <Text style={styles.headerTitle}>Shopping Collection</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.product.id}-${index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={80} color={Theme.colors.border} />
            <Text style={styles.emptyText}>Your collection is empty</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(customer)/home')}>
              <Text style={styles.shopBtnText}>CONTINUE SHOPPING</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalPrice}>₱{selectedTotal.toLocaleString()}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.checkoutBtn, selectedTotal === 0 && styles.disabledBtn]} 
            onPress={() => router.push('/(customer)/checkout')}
            disabled={selectedTotal === 0}
          >
            <Text style={styles.checkoutText}>PROCEED TO SECURE CHECKOUT</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.secondary },
  listContent: { padding: 20 },
  card: { 
    flexDirection: 'row', 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  checkbox: { marginRight: 12 },
  itemImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: Theme.colors.inputBg },
  itemInfo: { flex: 1, marginLeft: 16 },
  itemName: { fontSize: 16, fontWeight: '700', color: Theme.colors.secondary, marginBottom: 4 },
  itemVariation: { fontSize: 12, color: Theme.colors.textMuted, marginBottom: 8 },
  itemPrice: { fontSize: 16, fontWeight: '800', color: Theme.colors.primary, marginBottom: 12 },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyText: { fontSize: 16, fontWeight: '800', color: Theme.colors.secondary },
  footer: { 
    padding: 20, 
    backgroundColor: 'white', 
    borderTopWidth: 1, 
    borderTopColor: Theme.colors.border,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontSize: 14, color: Theme.colors.textMuted, fontWeight: '600' },
  totalPrice: { fontSize: 24, fontWeight: '900', color: Theme.colors.secondary },
  checkoutBtn: { 
    backgroundColor: Theme.colors.secondary, 
    height: 60, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: Theme.colors.secondary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5
  },
  disabledBtn: { opacity: 0.5 },
  checkoutText: { color: 'white', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 16, color: Theme.colors.textMuted, fontWeight: '600' },
  shopBtn: { marginTop: 30, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, borderWidth: 1, borderColor: Theme.colors.primary },
  shopBtnText: { color: Theme.colors.primary, fontWeight: '800', fontSize: 12, letterSpacing: 1 }
});
