import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { useNotifications } from '@/src/context/NotificationContext';
import { StatusBar } from 'expo-status-bar';

export default function NotificationsScreen() {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'order': return 'cube-outline';
      case 'payment': return 'card-outline';
      case 'system': return 'notifications-outline';
      case 'chat': return 'chatbubble-outline';
      default: return 'notifications-outline';
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.notifCard, !item.read && styles.notifCardUnread]}
      onPress={() => {
        markAsRead(item.id);
        if (item.link) {
          // Navigate to link if it works with expo-router
          // item.link might be like /orders or /chat/123
          router.push(item.link as any);
        }
      }}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.read ? Theme.colors.border : Theme.colors.primary + '15' }]}>
        <Ionicons 
          name={getIcon(item.type)} 
          size={20} 
          color={item.read ? Theme.colors.textMuted : Theme.colors.primary} 
        />
      </View>
      
      <View style={styles.notifInfo}>
        <View style={styles.notifHeader}>
          <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>{item.title}</Text>
          <Text style={styles.notifTime}>
            {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
      </View>
      
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Heritage Alerts</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={80} color={Theme.colors.border} />
            <Text style={styles.emptyText}>All caught up! No recent alerts.</Text>
          </View>
        }
      />
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
  markAllText: { fontSize: 10, fontWeight: '800', color: Theme.colors.primary, letterSpacing: 0.5 },
  listContent: { paddingBottom: 40 },
  notifCard: { 
    flexDirection: 'row', 
    padding: 20, 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: Theme.colors.border,
    alignItems: 'center'
  },
  notifCardUnread: { backgroundColor: Theme.colors.primary + '03' },
  iconContainer: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 16
  },
  notifInfo: { flex: 1 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: Theme.colors.textMuted },
  notifTitleUnread: { color: Theme.colors.secondary, fontWeight: '800' },
  notifTime: { fontSize: 10, color: Theme.colors.textMuted, fontWeight: '600' },
  notifMessage: { fontSize: 13, color: Theme.colors.text, opacity: 0.7, lineHeight: 18 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.colors.primary, marginLeft: 12 },
  emptyContainer: { alignItems: 'center', marginTop: 120 },
  emptyText: { marginTop: 24, fontSize: 14, color: Theme.colors.textMuted, fontWeight: '600' }
});
