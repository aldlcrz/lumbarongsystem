import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Product } from '../types';
import { Theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - Theme.spacing.lg * 2 - Theme.spacing.sm) / 2;

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // Helper to get formatted image URL
  const getImageUrl = () => {
    if (product.images && product.images.length > 0) {
      const url = product.images[0].url;
      if (url.startsWith('http')) return url;
      // Handle local platform uploads
      return `http://192.168.100.5:5000${url.startsWith('/') ? '' : '/'}${url}`;
    }
    return '';
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.9}
      onPress={() => router.push({ pathname: '/(customer)/product/[id]', params: { id: product.id } })}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={getImageUrl()} 
          style={styles.image}
          contentFit="cover"
          transition={500}
        />
        {product.soldCount > 0 && (
          <View style={styles.soldBadge}>
            <Text style={styles.soldText}>{product.soldCount} SOLD</Text>
          </View>
        )}
        <TouchableOpacity style={styles.wishlistBtn}>
          <Ionicons name="heart-outline" size={16} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <View style={styles.shopRow}>
          <Ionicons name="storefront-outline" size={10} color={Theme.colors.primary} />
          <Text style={styles.artisan} numberOfLines={1}>
            {product.seller?.shopName || 'LumbaRong Artisan'}
          </Text>
        </View>
        
        <Text style={styles.title} numberOfLines={2}>{product.name}</Text>
        
        <View style={styles.ratingRow}>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons 
                key={s} 
                name={s <= Math.round(product.rating || 4.5) ? "star" : "star-outline"} 
                size={10} 
                color={Theme.colors.primary} 
              />
            ))}
          </View>
          <Text style={styles.ratingText}>({product.reviews?.length || 12})</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.price}>₱{product.price.toLocaleString()}</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={20} color={Theme.colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: COLUMN_WIDTH,
    backgroundColor: 'white',
    borderRadius: Theme.radius.lg,
    marginBottom: Theme.spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    // shadow-artisan equivalent from system
    shadowColor: 'rgba(60, 40, 20, 1)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.85,
    backgroundColor: Theme.colors.inputBg,
  },
  image: {
    flex: 1,
  },
  soldBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(28, 25, 23, 0.8)', // Dark/Charcoal with opacity
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  soldText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  info: {
    padding: 12,
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  artisan: {
    fontSize: 9,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.secondary,
    lineHeight: 18,
    height: 36,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  price: {
    fontSize: 15,
    fontWeight: '900',
    color: Theme.colors.secondary,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
