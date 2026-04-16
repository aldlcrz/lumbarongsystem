import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, ActivityIndicator, Alert, TextInput, Modal
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import apiClient from '@/src/api/client';
import { StatusBar } from 'expo-status-bar';

interface Address {
  id: string;
  recipientName: string;
  phone: string;
  houseNo: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

export default function AddressesScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [barangay, setBarangay] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/addresses');
      setAddresses(res.data);
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!recipientName || !phone || !city || !province) {
      Alert.alert("Error", "Please fill in the required fields (Name, Phone, City, Province).");
      return;
    }

    const payload = { recipientName, phone, houseNo, street, barangay, city, province, postalCode, isDefault };

    try {
      setSubmitting(true);
      if (editingId) {
        await apiClient.put(`/addresses/${editingId}`, payload);
      } else {
        await apiClient.post('/addresses', payload);
      }
      setModalVisible(false);
      resetForm();
      fetchAddresses();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to save address.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to remove this delivery address?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await apiClient.delete(`/addresses/${id}`);
              fetchAddresses();
            } catch (err) {
              Alert.alert("Error", "Failed to delete address.");
            }
          } 
        }
      ]
    );
  };

  const handleEdit = (address: Address) => {
    setEditingId(address.id);
    setRecipientName(address.recipientName);
    setPhone(address.phone);
    setHouseNo(address.houseNo);
    setStreet(address.street);
    setBarangay(address.barangay);
    setCity(address.city);
    setProvince(address.province);
    setPostalCode(address.postalCode);
    setIsDefault(address.isDefault);
    setModalVisible(true);
  };

  const setDefault = async (id: string) => {
    try {
      await apiClient.patch(`/addresses/${id}/set-default`);
      fetchAddresses();
    } catch (err) {
      Alert.alert("Error", "Failed to update default address.");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setRecipientName('');
    setPhone('');
    setHouseNo('');
    setStreet('');
    setBarangay('');
    setCity('');
    setProvince('');
    setPostalCode('');
    setIsDefault(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Addresses</Text>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => { resetForm(); setModalVisible(true); }}
        >
          <Ionicons name="add" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 40 }} />
        ) : addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color={Theme.colors.border} />
            <Text style={styles.emptyText}>No addresses saved yet.</Text>
            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={() => { resetForm(); setModalVisible(true); }}
            >
              <Text style={styles.primaryBtnText}>ADD NEW ADDRESS</Text>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map(address => (
            <View key={address.id} style={[styles.addressCard, address.isDefault && styles.defaultCard]}>
              <View style={styles.addressHeader}>
                <View style={styles.recipientRow}>
                  <Text style={styles.recipientName}>{address.recipientName}</Text>
                  {address.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                    </View>
                  )}
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={() => handleEdit(address)}>
                    <Ionicons name="create-outline" size={20} color={Theme.colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(address.id)}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={styles.addressPhone}>{address.phone}</Text>
              <Text style={styles.addressDetails}>
                {address.houseNo} {address.street}, {address.barangay}
              </Text>
              <Text style={styles.addressCity}>
                {address.city}, {address.province} {address.postalCode}
              </Text>

              {!address.isDefault && (
                <TouchableOpacity style={styles.setDefaultBtn} onPress={() => setDefault(address.id)}>
                  <Text style={styles.setDefaultText}>Set as Default</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Address' : 'New Address'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Theme.colors.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>RECIPIENT NAME</Text>
                <TextInput 
                  style={styles.input} 
                  value={recipientName} 
                  onChangeText={setRecipientName} 
                  placeholder="John Doe"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PHONE NUMBER</Text>
                <TextInput 
                  style={styles.input} 
                  value={phone} 
                  onChangeText={setPhone} 
                  placeholder="09123456789"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>HOUSE NO.</Text>
                  <TextInput style={styles.input} value={houseNo} onChangeText={setHouseNo} />
                </View>
                <View style={[styles.inputGroup, { flex: 2 }]}>
                  <Text style={styles.label}>STREET</Text>
                  <TextInput style={styles.input} value={street} onChangeText={setStreet} />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>BARANGAY</Text>
                <TextInput style={styles.input} value={barangay} onChangeText={setBarangay} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CITY / MUNICIPALITY</Text>
                <TextInput style={styles.input} value={city} onChangeText={setCity} />
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>PROVINCE</Text>
                  <TextInput style={styles.input} value={province} onChangeText={setProvince} />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>POSTAL CODE</Text>
                  <TextInput style={styles.input} value={postalCode} onChangeText={setPostalCode} keyboardType="numeric" />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleSave} 
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitBtnText}>{editingId ? 'UPDATE ADDRESS' : 'SAVE ADDRESS'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
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
  addBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.secondary },
  scrollContent: { padding: 20 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginVertical: 20, fontSize: 16, color: Theme.colors.textMuted, fontWeight: '600' },
  primaryBtn: { backgroundColor: Theme.colors.primary, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 30 },
  primaryBtnText: { color: 'white', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  addressCard: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border
  },
  defaultCard: { borderColor: Theme.colors.primary, borderWidth: 2 },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recipientName: { fontSize: 16, fontWeight: '800', color: Theme.colors.secondary },
  defaultBadge: { backgroundColor: Theme.colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  defaultBadgeText: { fontSize: 8, fontWeight: '900', color: 'white' },
  actionButtons: { flexDirection: 'row', gap: 12 },
  addressPhone: { fontSize: 14, color: Theme.colors.textMuted, marginBottom: 8 },
  addressDetails: { fontSize: 14, color: Theme.colors.secondary, marginBottom: 4 },
  addressCity: { fontSize: 14, color: Theme.colors.secondary, fontWeight: '600' },
  setDefaultBtn: { marginTop: 16, paddingVertical: 8, borderColor: Theme.colors.border, borderWidth: 1, borderRadius: 10, alignItems: 'center' },
  setDefaultText: { fontSize: 13, fontWeight: '700', color: Theme.colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Theme.colors.secondary },
  form: { padding: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 1.5, marginBottom: 8 },
  input: { height: 50, backgroundColor: Theme.colors.background, borderRadius: 12, paddingHorizontal: 16, fontSize: 14, borderWidth: 1, borderColor: Theme.colors.border },
  row: { flexDirection: 'row', gap: 12 },
  submitBtn: { backgroundColor: Theme.colors.primary, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 40 },
  submitBtnText: { color: 'white', fontWeight: '800', fontSize: 14, letterSpacing: 1 }
});
