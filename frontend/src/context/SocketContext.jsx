"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '@/lib/api';
const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentBroadcast, setCurrentBroadcast] = useState(null);

  const clearBroadcast = () => setCurrentBroadcast(null);

  useEffect(() => {
    const socketInstance = io(BACKEND_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);

      // Join user-specific rooms if logged in
      try {
        const adminUser = JSON.parse(localStorage.getItem('admin_user') || 'null');
        const sellerUser = JSON.parse(localStorage.getItem('seller_user') || 'null');
        const customerUser = JSON.parse(localStorage.getItem('customer_user') || 'null');
        
        const joinForUser = (user) => {
          if (user && user.id) {
            socketInstance.emit('join_room', `user_${user.id}`);
            console.log(`Joined user room: user_${user.id}`);
            if (user.role === 'admin') {
              socketInstance.emit('join_room', 'admin');
              console.log('Joined admin room');
            }
          }
        };

        if (adminUser) joinForUser(adminUser);
        if (sellerUser) joinForUser(sellerUser);
        if (customerUser) joinForUser(customerUser);
      } catch (e) {
        console.error('Failed to parse user for socket room joining', e);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('broadcast_message', (data) => {
      // Global broadcast handler - replacing legacy alert with state management
      setCurrentBroadcast({
        id: Date.now(),
        title: data.title || 'System Broadcast',
        message: data.message,
        timestamp: data.timestamp || new Date(),
        type: data.type || 'system'
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const value = React.useMemo(() => ({ 
    socket, 
    isConnected, 
    currentBroadcast, 
    clearBroadcast 
  }), [socket, isConnected, currentBroadcast]);
  
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
