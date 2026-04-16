import React, { createContext, useContext, useState, useEffect } from 'react';
import socketService from '../services/socket';
import apiClient from '../api/client';
import { useAuth } from './AuthContext';
import { Message, Conversation } from '../types';

interface ChatContextType {
  conversations: Conversation[];
  activeChatMessages: Message[];
  fetchConversations: () => Promise<void>;
  fetchConversation: (otherUserId: string) => Promise<void>;
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  markAsRead: (otherUserId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatMessages, setActiveChatMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchConversations();
      
      socketService.on('receive_message', (msg: Message) => {
        // If it's for the current active chat, add it to the list
        if (currentChatId && (msg.senderId === currentChatId || msg.receiverId === currentChatId)) {
          setActiveChatMessages(prev => [...prev, msg]);
        }
        
        // Refresh conversations list to update last message/timestamp
        fetchConversations();
      });

      return () => {
        socketService.off('receive_message');
      };
    } else {
      setConversations([]);
      setActiveChatMessages([]);
    }
  }, [token, currentChatId]);

  const fetchConversations = async () => {
    try {
      const res = await apiClient.get('/chat/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const fetchConversation = async (otherUserId: string) => {
    try {
      setCurrentChatId(otherUserId);
      const res = await apiClient.get(`/chat/conversation/${otherUserId}`);
      setActiveChatMessages(res.data);
    } catch (err) {
      console.error('Error fetching conversation:', err);
    }
  };

  const sendMessage = async (receiverId: string, content: string) => {
    try {
      await apiClient.post('/chat/send', { receiverId, content });
      // The message will be added via the socket listener 'receive_message'
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const markAsRead = async (otherUserId: string) => {
    try {
      await apiClient.put(`/chat/read/${otherUserId}`);
      setConversations(prev => prev.map(c => 
        c.otherUser.id === otherUserId ? { ...c, unreadCount: 0 } : c
      ));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  return (
    <ChatContext.Provider value={{ 
      conversations, 
      activeChatMessages, 
      fetchConversations, 
      fetchConversation, 
      sendMessage,
      markAsRead
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
