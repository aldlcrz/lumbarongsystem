import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions,
  SafeAreaView,
  Platform
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { Product } from '@/src/types';
import apiClient from '@/src/api/client';
import { useCart } from '@/src/context/CartContext';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/products/${id}`);
      const p = res.data as Product;
      setProduct(p);
      if (p.images && p.images.length > 0) {
        setActiveImage(getImageUrl(p.images[0].url));
      }
    } catch (err) {
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `http://192.168.100.5:5000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleAddToCart = (isBuyNow: boolean) => {
    if (!product) return;
    
    if (product.availableSizes && product.availableSizes.length > 0 && !selectedSize) {
      alert('Please select a size');
      return;
    }

    addToCart(product, quantity, selectedColor || undefined, selectedSize || undefined);
    
    if (isBuyNow) {
      router.push('/(customer)/checkout');
    } else {
      alert('Added to cart!');
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text>Product not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Gallery */}
        <View style={styles.galleryContainer}>
          <Image 
            source={activeImage} 
            style={styles.mainImage}
            contentFit="cover"
            transition={300}
          />
          <TouchableOpacity style={styles.backFab} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Theme.colors.secondary} />
          </TouchableOpacity>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.thumbnailList}
            contentContainerStyle={styles.thumbnailContent}
          >
            {product.images.map((img, idx) => (
              <TouchableOpacity 
                key={idx} 
                onPress={() => setActiveImage(getImageUrl(img.url))}
                style={[
                  styles.thumbnailWrapper, 
                  activeImage === getImageUrl(img.url) && styles.thumbnailActive
                ]}
              >
                <Image source={getImageUrl(img.url)} style={styles.thumbnail} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.artisanName}>{product.seller?.shopName || 'LumbaRong Artisan'}</Text>
          <Text style={styles.title}>{product.name}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={14} color={Theme.colors.primary} />
              <Text style={styles.ratingText}>4.9</Text>
            </View>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.statsText}>{product.soldCount} SOLD</Text>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>₱{product.price.toLocaleString()}</Text>
          </View>

          {/* Variations */}
          {product.availableSizes && product.availableSizes.length > 0 && (
            <View style={styles.variationSection}>
              <Text style={styles.variationLabel}>SIZE</Text>
              <View style={styles.chipRow}>
                {product.availableSizes.map(size => (
                  <TouchableOpacity 
                    key={size}
                    style={[styles.chip, selectedSize === size && styles.chipActive]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text style={[styles.chipText, selectedSize === size && styles.chipTextActive]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionLabel}>DESCRIPTION</Text>
            <Text style={styles.descriptionText}>
              {product.description || 'This is a premium, handcrafted piece from our local weavers in Lumban, Laguna. Each stitch reflects generations of heritage and culture.'}
            </Text>
          </View>

          {/* Quantity */}
          <View style={styles.qtySection}>
            <Text style={styles.variationLabel}>QUANTITY</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity 
                style={styles.qtyBtn} 
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={20} color={Theme.colors.secondary} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity 
                style={styles.qtyBtn}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Ionicons name="add" size={20} color={Theme.colors.secondary} />
              </TouchableOpacity>
              <Text style={styles.stockText}>{product.stock} pieces available</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <SafeAreaView style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => handleAddToCart(false)}
          >
            <Ionicons name="cart-outline" size={24} color={Theme.colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.buyButton}
            onPress={() => handleAddToCart(true)}
          >
            <Text style={styles.buyButtonText}>BUY NOW</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    marginTop: 20,
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  galleryContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Theme.colors.inputBg,
  },
  mainImage: {
    flex: 1,
  },
  backFab: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  thumbnailList: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  thumbnailContent: {
    paddingHorizontal: 20,
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'white',
    marginRight: 10,
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: Theme.colors.primary,
  },
  thumbnail: {
    flex: 1,
  },
  infoSection: {
    padding: 24,
  },
  artisanName: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Theme.colors.secondary,
    lineHeight: 32,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  dot: {
    marginHorizontal: 12,
    color: Theme.colors.textMuted,
  },
  statsText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
  priceContainer: {
    backgroundColor: '#FAFAFA',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  price: {
    fontSize: 32,
    fontWeight: '900',
    color: Theme.colors.primary,
  },
  variationSection: {
    marginBottom: 32,
  },
  variationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.textMuted,
    letterSpacing: 2,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  chipActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '08',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.secondary,
  },
  chipTextActive: {
    color: Theme.colors.primary,
  },
  descriptionSection: {
    marginBottom: 32,
  },
  descriptionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.textMuted,
    letterSpacing: 2,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: Theme.colors.text,
    lineHeight: 24,
    opacity: 0.8,
  },
  qtySection: {
    marginBottom: 20,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.secondary,
  },
  stockText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  bottomBarContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cartButton: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButton: {
    flex: 1,
    height: 60,
    backgroundColor: Theme.colors.secondary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Theme.colors.secondary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  buyButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 2,
  }
});
