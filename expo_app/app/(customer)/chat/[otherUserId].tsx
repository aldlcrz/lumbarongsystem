import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { useChat } from '@/src/context/ChatContext';
import { useAuth } from '@/src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function ChatDetailScreen() {
  const { otherUserId } = useLocalSearchParams();
  const { user } = useAuth();
  const { activeChatMessages, fetchConversation, sendMessage, markAsRead } = useChat();
  
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    initChat();
  }, [otherUserId]);

  const initChat = async () => {
    setLoading(true);
    await fetchConversation(otherUserId as string);
    await markAsRead(otherUserId as string);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!content.trim()) return;
    const msg = content;
    setContent('');
    await sendMessage(otherUserId as string, msg);
    // FlatList will auto-scroll due to useEffect on messages if we implement it
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
            {item.content}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.secondary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>LumbaRong Artisan</Text>
          <View style={styles.onlineStatus}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Active Now</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="call-outline" size={22} color={Theme.colors.secondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.content}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={activeChatMessages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="add" size={24} color={Theme.colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input}
              placeholder="Type your message..."
              value={content}
              onChangeText={setContent}
              multiline
            />
          </View>
          <TouchableOpacity 
            style={[styles.sendBtn, !content.trim() && styles.sendBtnDisabled]} 
            onPress={handleSend}
            disabled={!content.trim()}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: Theme.colors.border,
    backgroundColor: 'white'
  },
  headerInfo: { flex: 1, marginLeft: 15 },
  headerName: { fontSize: 16, fontWeight: '800', color: Theme.colors.secondary },
  onlineStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 },
  onlineText: { fontSize: 11, color: Theme.colors.textMuted, fontWeight: '600' },
  content: { flex: 1 },
  messageList: { padding: 20 },
  messageWrapper: { marginBottom: 20, maxWidth: '80%' },
  myMessageWrapper: { alignSelf: 'flex-end' },
  theirMessageWrapper: { alignSelf: 'flex-start' },
  bubble: { padding: 15, borderRadius: 20 },
  myBubble: { backgroundColor: Theme.colors.secondary, borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: Theme.colors.background, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  myMessageText: { color: 'white' },
  theirMessageText: { color: Theme.colors.text },
  timestamp: { fontSize: 9, color: Theme.colors.textMuted, marginTop: 4, alignSelf: 'flex-end', fontWeight: '600' },
  inputBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    borderTopWidth: 1, 
    borderTopColor: Theme.colors.border,
    backgroundColor: 'white'
  },
  attachBtn: { marginRight: 12 },
  inputContainer: { flex: 1, backgroundColor: Theme.colors.background, borderRadius: 25, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 100 },
  input: { fontSize: 15, color: Theme.colors.text, paddingTop: Platform.OS === 'ios' ? 8 : 4 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  sendBtnDisabled: { backgroundColor: Theme.colors.border }
});
