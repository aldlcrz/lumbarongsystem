import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Theme } from '@/constants/theme';
import { useCart } from '@/src/context/CartContext';
import { useAuth } from '@/src/context/AuthContext';
import apiClient from '@/src/api/client';
import { Address } from '@/src/types';
import { StatusBar } from 'expo-status-bar';

export default function CheckoutScreen() {
  const { items, selectedTotal, clearCart } = useCart();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'GCash' | 'Maya'>('GCash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<any>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/users/addresses');
      const data = res.data as Address[];
      setAddresses(data);
      if (data.length > 0) {
        setSelectedAddress(data.find(a => a.isDefault) || data[0]);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setPaymentProof(asset.uri);
      
      // Prepare for multipart upload
      const localUri = asset.uri;
      const filename = localUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;
      
      setPaymentProofFile({ uri: localUri, name: filename, type });
    }
  };

  const handleSubmit = async () => {
    if (!selectedAddress) {
      Alert.alert('Selection Required', 'Please select a shipping address.');
      return;
    }

    if (!paymentReference) {
      Alert.alert('Verification Required', 'Please enter the payment reference number.');
      return;
    }

    if (!paymentProofFile) {
      Alert.alert('Verification Required', 'Please upload a snapshot of your payment receipt.');
      return;
    }

    try {
      setSubmitting(true);

      const itemsToBuy = items.filter(i => i.isSelected);
      
      const formData = new FormData();
      formData.append('paymentMethod', paymentMethod);
      formData.append('paymentReference', paymentReference);
      formData.append('addressId', selectedAddress.id);
      formData.append('items', JSON.stringify(itemsToBuy.map(i => ({
        product: i.product.id,
        quantity: i.quantity,
        price: i.product.price,
        size: i.size || 'M',
        variation: i.color || 'Original'
      }))));
      
      // Append file
      if (paymentProofFile) {
        formData.append('paymentProof', paymentProofFile as any);
      }

      await apiClient.post('/orders', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearCart();
      Alert.alert(
        'Success', 
        'Heritage en route! Your order has been placed successfully.',
        [{ text: 'View My Orders', onPress: () => router.replace('/(customer)/orders') }]
      );
    } catch (err: any) {
      console.error('Order error:', err);
      const msg = err.response?.data?.message || 'Order failed. Please check your verification details.';
      Alert.alert('Order Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout Registry</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SHIPPING DETAILS</Text>
          <TouchableOpacity style={styles.addressCard}>
            <View style={styles.addressIcon}>
              <Ionicons name="location-outline" size={20} color={Theme.colors.primary} />
            </View>
            <View style={styles.addressInfo}>
              {selectedAddress ? (
                <>
                  <Text style={styles.recipientName}>{selectedAddress.recipientName}</Text>
                  <Text style={styles.addressText}>
                    {selectedAddress.houseNo ? `${selectedAddress.houseNo} ` : ''}
                    {selectedAddress.street}, {selectedAddress.barangay}, {selectedAddress.city}
                  </Text>
                  <Text style={styles.phoneText}>{selectedAddress.phone}</Text>
                </>
              ) : (
                <Text style={styles.errorText}>No address selected. Please add one in profile.</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Items Summary (Mini) */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ORDER SUMMARY</Text>
          <View style={styles.itemsCard}>
            {items.filter(i => i.isSelected).map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemText} numberOfLines={1}>
                  {item.quantity}x {item.product.name} ({item.size})
                </Text>
                <Text style={styles.itemPriceText}>₱{(item.product.price * item.quantity).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
          <View style={styles.paymentSelector}>
            <TouchableOpacity 
              style={[styles.paymentBtn, paymentMethod === 'GCash' && styles.paymentBtnActive]}
              onPress={() => setPaymentMethod('GCash')}
            >
              <Text style={[styles.paymentBtnText, paymentMethod === 'GCash' && styles.paymentBtnTextActive]}>GCASH</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.paymentBtn, paymentMethod === 'Maya' && styles.paymentBtnActive]}
              onPress={() => setPaymentMethod('Maya')}
            >
              <Text style={[styles.paymentBtnText, paymentMethod === 'Maya' && styles.paymentBtnTextActive]}>MAYA</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.paymentInfoBox}>
            <Text style={styles.paymentInfoLabel}>{paymentMethod.toUpperCase()} RECIPIENT</Text>
            <Text style={styles.paymentInfoNumber}>0954 172 7787</Text>
            <Text style={styles.paymentInfoName}>LumbaRong Heritage Registry</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>REFERENCE NUMBER</Text>
            <TextInput 
              style={styles.input}
              placeholder="Enter Transaction ID"
              value={paymentReference}
              onChangeText={setPaymentReference}
            />
          </View>

          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
            <Ionicons 
              name={paymentProof ? "checkmark-circle" : "cloud-upload-outline"} 
              size={24} 
              color={paymentProof ? Theme.colors.success : Theme.colors.primary} 
            />
            <Text style={[styles.uploadBtnText, paymentProof && styles.uploadBtnTextSuccess]}>
              {paymentProof ? "Receipt Loaded Successfully" : "Upload Payment Snapshot"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Totals */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₱{selectedTotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping (Provincial)</Text>
            <Text style={styles.summaryValue}>₱0</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₱{selectedTotal.toLocaleString()}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.confirmBtn, submitting && styles.disabledBtn]} 
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.confirmBtnText}>CONFIRM & FINALIZE PURCHASE</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    elevation: 2
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.secondary, letterSpacing: 0.5 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  section: { marginBottom: 32 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 2, marginBottom: 12 },
  addressCard: { 
    flexDirection: 'row', 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border
  },
  addressIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: Theme.colors.background, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 16
  },
  addressInfo: { flex: 1 },
  recipientName: { fontSize: 16, fontWeight: '800', color: Theme.colors.secondary, marginBottom: 4 },
  addressText: { fontSize: 13, color: Theme.colors.textMuted, lineHeight: 18 },
  phoneText: { fontSize: 12, color: Theme.colors.textMuted, marginTop: 4 },
  errorText: { fontSize: 13, color: Theme.colors.error, fontWeight: '600' },
  itemsCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Theme.colors.border },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  itemText: { fontSize: 13, color: Theme.colors.text, flex: 1, marginRight: 20 },
  itemPriceText: { fontSize: 13, fontWeight: '700', color: Theme.colors.secondary },
  paymentSelector: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  paymentBtn: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: Theme.colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  paymentBtnActive: { borderColor: Theme.colors.primary, backgroundColor: Theme.colors.primary + '08' },
  paymentBtnText: { fontSize: 12, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 1 },
  paymentBtnTextActive: { color: Theme.colors.primary },
  paymentInfoBox: { backgroundColor: '#F0F9FF', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#BAE6FD' },
  paymentInfoLabel: { fontSize: 9, fontWeight: '800', color: '#0369A1', letterSpacing: 2, marginBottom: 8 },
  paymentInfoNumber: { fontSize: 24, fontWeight: '900', color: '#0C4A6E', marginBottom: 4 },
  paymentInfoName: { fontSize: 12, fontWeight: '700', color: '#0EA5E9' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 10, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 1.5, marginBottom: 8 },
  input: { height: 56, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: Theme.colors.border, paddingHorizontal: 16, fontSize: 16 },
  uploadBtn: { 
    height: 70, 
    backgroundColor: 'white', 
    borderRadius: 16, 
    borderWidth: 1.5, 
    borderColor: Theme.colors.border, 
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16
  },
  uploadBtnText: { fontSize: 13, fontWeight: '700', color: Theme.colors.text },
  uploadBtnTextSuccess: { color: Theme.colors.success },
  summaryCard: { backgroundColor: 'white', borderRadius: 16, padding: 24, marginBottom: 32, borderWidth: 1, borderColor: Theme.colors.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: Theme.colors.textMuted },
  summaryValue: { fontSize: 14, fontWeight: '700', color: Theme.colors.text },
  totalRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Theme.colors.border },
  totalLabel: { fontSize: 16, fontWeight: '800', color: Theme.colors.secondary },
  totalValue: { fontSize: 22, fontWeight: '900', color: Theme.colors.primary },
  confirmBtn: { 
    backgroundColor: Theme.colors.secondary, 
    height: 64, 
    borderRadius: 32, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: Theme.colors.secondary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8
  },
  confirmBtnText: { color: 'white', fontWeight: '800', fontSize: 12, letterSpacing: 2 },
  disabledBtn: { opacity: 0.7 }
});
