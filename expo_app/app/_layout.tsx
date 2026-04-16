import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { CartProvider } from '@/src/context/CartContext';
import { NotificationProvider } from '@/src/context/NotificationContext';
import { ChatProvider } from '@/src/context/ChatContext';

// Navigation Manager component
function RootNavigation() {
  const { user, token, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inCustomerGroup = segments[0] === '(customer)';
    const inSellerGroup = segments[0] === '(seller)';
    const inAdminGroup = segments[0] === '(admin)';

    if (!token && !inAuthGroup) {
      // Not logged in, redirect to landing
      router.replace('/(auth)/landing');
    } else if (token && user) {
      // Logged in, redirect based on role if they are in auth screens or at root
      const isRoot = !segments || (segments.length as number) === 0;
      if (inAuthGroup || isRoot) {
        if (user.role === 'admin') router.replace('/(admin)/dashboard');
        else if (user.role === 'seller') router.replace('/(seller)/dashboard');
        else router.replace('/(customer)/home');
      }
    }
  }, [user, token, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(customer)" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="(seller)" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="(admin)" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <ChatProvider>
              <RootNavigation />
              <StatusBar style="auto" />
            </ChatProvider>
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
