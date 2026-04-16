import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  RefreshControl,
  Image
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { useChat } from '@/src/context/ChatContext';
import { StatusBar } from 'expo-status-bar';

export default function ChatListScreen() {
  const { conversations, fetchConversations } = useChat();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const renderConversation = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.convCard}
      onPress={() => router.push(`/(customer)/chat/${item.otherUser.id}` as any)}
    >
      <View style={styles.avatarContainer}>
        {item.otherUser.profileImage ? (
          <Image source={{ uri: item.otherUser.profileImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: Theme.colors.primary + '20' }]}>
            <Text style={styles.avatarLetter}>{item.otherUser.name?.[0]?.toUpperCase() || 'A'}</Text>
          </View>
        )}
      </View>

      <View style={styles.convInfo}>
        <View style={styles.convHeader}>
          <Text style={styles.name}>{item.otherUser.name || 'LumbaRong Artisan'}</Text>
          <Text style={styles.time}>
            {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </Text>
        </View>
        
        <View style={styles.messageRow}>
          <Text style={[styles.lastMessage, item.unreadCount > 0 && styles.lastMessageUnread]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Heritage Messages</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={item => item.otherUser.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color={Theme.colors.border} />
            <Text style={styles.emptyText}>No conversations yet. Start chatting with an artisan!</Text>
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
  listContent: { paddingBottom: 40 },
  convCard: { 
    flexDirection: 'row', 
    padding: 20, 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: Theme.colors.border,
    alignItems: 'center'
  },
  avatarContainer: { marginRight: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  avatarLetter: { fontSize: 20, fontWeight: '800', color: Theme.colors.primary },
  convInfo: { flex: 1 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  name: { fontSize: 16, fontWeight: '700', color: Theme.colors.secondary },
  time: { fontSize: 10, color: Theme.colors.textMuted, fontWeight: '600' },
  messageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { fontSize: 14, color: Theme.colors.textMuted, flex: 1, marginRight: 10 },
  lastMessageUnread: { color: Theme.colors.text, fontWeight: '700' },
  badge: { 
    backgroundColor: Theme.colors.primary, 
    minWidth: 20, 
    height: 20, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 6
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '900' },
  emptyContainer: { alignItems: 'center', marginTop: 120 },
  emptyText: { marginTop: 24, fontSize: 14, color: Theme.colors.textMuted, fontWeight: '600', textAlign: 'center', paddingHorizontal: 40 }
});
