import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Theme } from '@/constants/theme';
import apiClient from '@/src/api/client';
import { StatusBar } from 'expo-status-bar';

export default function AddProductScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(isEditMode);

  useEffect(() => {
    fetchCategories();
    if (isEditMode) loadExistingProduct();
  }, []);

  const loadExistingProduct = async () => {
    try {
      const res = await apiClient.get(`/products/${id}`);
      const p = res.data;
      setName(p.name || '');
      setDescription(p.description || '');
      setPrice(String(p.price || ''));
      setStock(String(p.stock || ''));
      setCategory(p.categories?.[0] || p.category || '');
      const urls = (p.images || []).map((img: any) => img.url || img);
      setExistingImageUrls(urls);
    } catch (err) {
      console.error('Load product error:', err);
    } finally {
      setInitialLoad(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/categories');
      const names = res.data.map((c: any) => c.name);
      setCategories(names);
      if (names.length > 0 && !isEditMode) setCategory(names[0]);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => {
        const localUri = asset.uri;
        const filename = localUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;
        return { uri: localUri, name: filename, type };
      });
      setImages([...images, ...newImages]);
    }
  };

  const handleSubmit = async () => {
    if (!name || !price || !stock) {
      Alert.alert("Missing Information", "Please fill in all required fields.");
      return;
    }
    if (!isEditMode && images.length === 0) {
      Alert.alert("Missing Images", "Please upload at least one product image.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('stock', stock);
      formData.append('category', category);
      images.forEach((img) => { formData.append('images', img as any); });

      if (isEditMode) {
        await apiClient.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        Alert.alert("Updated!", "Product listing has been updated.", [
          { text: "View Inventory", onPress: () => router.replace('/(seller)/inventory' as any) }
        ]);
      } else {
        await apiClient.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        Alert.alert("Published!", "Heritage piece published to registry!", [
          { text: "View Registry", onPress: () => router.replace('/(seller)/products') }
        ]);
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Could not save product.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Listing' : 'New Heritage Listing'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Media Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>VISUALS & VARIATIONS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            {images.map((img, idx) => (
              <View key={idx} style={styles.imageWrapper}>
                <Image source={{ uri: img.uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => setImages(images.filter((_, i) => i !== idx))}>
                  <Ionicons name="close" size={14} color="white" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
              <Ionicons name="add" size={32} color={Theme.colors.primary} />
              <Text style={styles.uploadText}>Add Photo</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PIECE DETAILS</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PRODUCT NAME</Text>
            <TextInput 
              style={styles.input}
              placeholder="e.g. Piña-Silk Formal Barong"
              value={name}
              onChangeText={setName}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>DESCRIPTION</Text>
            <TextInput 
              style={[styles.input, styles.textArea]}
              placeholder="Describe the artisan craft, materials, and history..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Categories & Stock */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>REGISTRY DATA</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>PRICE (₱)</Text>
              <TextInput 
                style={styles.input}
                placeholder="2500"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>STOCK</Text>
              <TextInput 
                style={styles.input}
                placeholder="10"
                value={stock}
                onChangeText={setStock}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CATEGORY</Text>
            <View style={styles.categoryList}>
              {categories.map((cat, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, loading && styles.disabledBtn]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitBtnText}>{isEditMode ? 'SAVE CHANGES' : 'FINALIZE HERITAGE LISTING'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
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
  scrollContent: { padding: 24, paddingBottom: 60 },
  section: { marginBottom: 32 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 2, marginBottom: 16 },
  imageScroll: { flexDirection: 'row' },
  imageWrapper: { marginRight: 12, position: 'relative' },
  previewImage: { width: 100, height: 100, borderRadius: 16, backgroundColor: 'white' },
  removeBtn: { position: 'absolute', top: -5, right: -5, width: 20, height: 20, borderRadius: 10, backgroundColor: Theme.colors.error, justifyContent: 'center', alignItems: 'center' },
  uploadBtn: { 
    width: 100, 
    height: 100, 
    borderRadius: 16, 
    borderWidth: 1.5, 
    borderColor: Theme.colors.border, 
    borderStyle: 'dashed',
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'white'
  },
  uploadText: { fontSize: 10, fontWeight: '800', color: Theme.colors.primary, marginTop: 4 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 1.5, marginBottom: 8 },
  input: { height: 56, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: Theme.colors.border, paddingHorizontal: 16, fontSize: 16 },
  textArea: { height: 120, paddingTop: 16, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 16 },
  categoryList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: Theme.colors.border },
  categoryChipActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  categoryText: { fontSize: 12, fontWeight: '700', color: Theme.colors.textMuted },
  categoryTextActive: { color: 'white' },
  submitBtn: { 
    backgroundColor: Theme.colors.primary, 
    height: 64, 
    borderRadius: 32, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 20,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8
  },
  submitBtnText: { color: 'white', fontWeight: '800', fontSize: 12, letterSpacing: 2 },
  disabledBtn: { opacity: 0.7 }
});
