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

export default function AdminUsersScreen() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'SELLERS' | 'CUSTOMERS'>('SELLERS');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [sRes, cRes] = await Promise.all([
        apiClient.get('/admin/sellers'),
        apiClient.get('/admin/customers')
      ]);
      setSellers(sRes.data);
      setCustomers(cRes.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const toggleStatus = async (id: string, role: string) => {
    try {
      const endpoint = role === 'seller' ? `/admin/sellers/${id}/toggle-status` : `/admin/customers/${id}/toggle-status`;
      await apiClient.put(endpoint);
      Alert.alert("Success", "User status updated.");
      fetchUsers();
    } catch (err) {
      Alert.alert("Error", "Could not update user status.");
    }
  };

  const verifySeller = async (id: string) => {
    try {
      await apiClient.put(`/admin/verify-seller/${id}`);
      Alert.alert("Success", "Artisan verified.");
      fetchUsers();
    } catch (err) {
      Alert.alert("Error", "Could not verify artisan.");
    }
  };

  const renderUser = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#10B98120' : '#EF444420' }]}>
          <Text style={[styles.statusText, { color: item.status === 'active' ? '#10B981' : '#EF4444' }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity 
          style={[styles.actionBtn, { borderColor: Theme.colors.border }]} 
          onPress={() => toggleStatus(item.id, item.role)}
        >
          <Ionicons name={item.status === 'active' ? 'lock-closed-outline' : 'lock-open-outline'} size={18} color={Theme.colors.secondary} />
          <Text style={styles.actionText}>{item.status === 'active' ? 'Block' : 'Unblock'}</Text>
        </TouchableOpacity>

        {item.role === 'seller' && !item.isVerified && (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary }]} 
            onPress={() => verifySeller(item.id)}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="white" />
            <Text style={[styles.actionText, { color: 'white' }]}>Verify Artisan</Text>
          </TouchableOpacity>
        )}
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
        <Text style={styles.headerTitle}>User Management</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'SELLERS' && styles.tabActive]}
          onPress={() => setActiveTab('SELLERS')}
        >
          <Text style={[styles.tabText, activeTab === 'SELLERS' && styles.tabTextActive]}>ARTISANS ({sellers.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'CUSTOMERS' && styles.tabActive]}
          onPress={() => setActiveTab('CUSTOMERS')}
        >
          <Text style={[styles.tabText, activeTab === 'CUSTOMERS' && styles.tabTextActive]}>CUSTOMERS ({customers.length})</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'SELLERS' ? sellers : customers}
          renderItem={renderUser}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />
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
    backgroundColor: 'white'
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.secondary },
  tabsContainer: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Theme.colors.primary },
  tabText: { fontSize: 11, fontWeight: '800', color: Theme.colors.textMuted, letterSpacing: 1 },
  tabTextActive: { color: Theme.colors.primary },
  listContent: { padding: 24 },
  userCard: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border
  },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '800', color: Theme.colors.secondary },
  userEmail: { fontSize: 13, color: Theme.colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '900' },
  userActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12,
    borderWidth: 1
  },
  actionText: { fontSize: 12, fontWeight: '700', color: Theme.colors.secondary }
});
