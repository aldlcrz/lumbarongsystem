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
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import apiClient from '@/src/api/client';
import { StatusBar } from 'expo-status-bar';

export default function PendingSellersScreen() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/pending-sellers');
      setSellers(res.data);
    } catch (err) {
      console.error('Error fetching pending sellers:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPending();
    setRefreshing(false);
  };

  const handleAction = async (id: string, action: 'verify' | 'reject') => {
    try {
      if (action === 'verify') {
        await apiClient.put(`/admin/verify-seller/${id}`);
        Alert.alert("Success", "Artisan verified.");
      } else {
        await apiClient.put(`/admin/reject-seller/${id}`);
        Alert.alert("Success", "Application rejected.");
      }
      fetchPending();
    } catch (err) {
      Alert.alert("Error", `Could not ${action} artisan.`);
    }
  };

  const renderSeller = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
           <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
          <Text style={styles.date}>Joined {new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => handleAction(item.id, 'reject')}>
          <Text style={styles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.verifyBtn]} onPress={() => handleAction(item.id, 'verify')}>
          <Text style={styles.verifyBtnText}>Verify Artisan</Text>
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
        <Text style={styles.headerTitle}>Verification Requests</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sellers}
          renderItem={renderSeller}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-outline" size={80} color={Theme.colors.border} />
              <Text style={styles.emptyText}>No pending verifications. All artisans are current.</Text>
            </View>
          }
        />
      )}
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.secondary },
  listContent: { padding: 24 },
  card: { 
    backgroundColor: 'white', 
    borderRadius: 24, 
    padding: 24, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border
  },
  cardHeader: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Theme.colors.secondary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontSize: 20, fontWeight: '900' },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: '800', color: Theme.colors.secondary },
  email: { fontSize: 13, color: Theme.colors.textMuted },
  date: { fontSize: 11, color: Theme.colors.textMuted, marginTop: 4, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  verifyBtn: { backgroundColor: Theme.colors.primary },
  verifyBtnText: { color: 'white', fontWeight: '800', fontSize: 13 },
  rejectBtn: { backgroundColor: 'white', borderWidth: 1, borderColor: Theme.colors.border },
  rejectBtnText: { color: Theme.colors.error, fontWeight: '800', fontSize: 13 },
  emptyContainer: { alignItems: 'center', marginTop: 120 },
  emptyText: { marginTop: 24, fontSize: 14, color: Theme.colors.textMuted, fontWeight: '600', textAlign: 'center' }
});
