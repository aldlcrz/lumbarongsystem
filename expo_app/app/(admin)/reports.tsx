import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import apiClient from '@/src/api/client';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function AdminReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/seller-performance');
      setPerformanceData(res.data);
    } catch (err) {
      console.error('Error fetching performance:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPerformance();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
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
        <Text style={styles.headerTitle}>System Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />}
      >
        <Text style={styles.sectionTitle}>ARTISAN RANKINGS</Text>
        {performanceData.sort((a, b) => b.totalRevenue - a.totalRevenue).map((item, idx) => (
          <View key={idx} style={styles.performanceCard}>
            <View style={styles.rankCircle}>
              <Text style={styles.rankText}>{idx + 1}</Text>
            </View>
            <View style={styles.artisanInfo}>
              <Text style={styles.artisanName}>{item.name}</Text>
              <Text style={styles.artisanSub}>{item.orderCount} Orders Fulfilled</Text>
            </View>
            <View style={styles.revenueBox}>
              <Text style={styles.revenueValue}>₱{item.totalRevenue.toLocaleString()}</Text>
            </View>
          </View>
        ))}

        {performanceData.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="bar-chart-outline" size={80} color={Theme.colors.border} />
            <Text style={styles.emptyText}>No performance data available for this period.</Text>
          </View>
        )}
      </ScrollView>
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
  scrollContent: { padding: 24 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: Theme.colors.textMuted, letterSpacing: 2, marginBottom: 20 },
  performanceCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 24, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border
  },
  rankCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  rankText: { fontSize: 14, fontWeight: '900', color: Theme.colors.secondary },
  artisanInfo: { flex: 1 },
  artisanName: { fontSize: 16, fontWeight: '800', color: Theme.colors.secondary },
  artisanSub: { fontSize: 12, color: Theme.colors.textMuted, marginTop: 2 },
  revenueBox: { alignItems: 'flex-end' },
  revenueValue: { fontSize: 16, fontWeight: '900', color: Theme.colors.primary },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 14, color: Theme.colors.textMuted, fontWeight: '600', textAlign: 'center' }
});
