import axios from 'axios';
import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Platform, StyleSheet, ActivityIndicator } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_CONFIG } from '@/constants/Config';

export default function HomeScreen() {
  const [status, setStatus] = useState<'testing' | 'connected' | 'error'>('testing');

  useEffect(() => {
    const checkServer = async () => {
      try {
        // We'll try hitting a basic health check or just the base path
        await axios.get(`${API_CONFIG.getSocketUrl()}/api/v1/products`, { timeout: 3000 });
        setStatus('connected');
      } catch (err) {
        console.warn('Backend check failed:', err);
        setStatus('error');
      }
    };
    checkServer();
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">LumBarong Expo!</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Backend Connection Status:</ThemedText>
        <ThemedView style={styles.statusBox}>
          {status === 'testing' && <ActivityIndicator color="#0000ff" />}
          {status === 'connected' && (
            <ThemedText style={{ color: 'green' }}>✓ Connected to {API_CONFIG.host}</ThemedText>
          )}
          {status === 'error' && (
            <ThemedText style={{ color: 'red' }}>
              ✗ Connection Error. Make sure your PC and Phone are on the same Wi-Fi and the backend is running.
            </ThemedText>
          )}
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Open Expo Go</ThemedText>
        <ThemedText>
          Scan the QR code in your terminal to view this app on your phone.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Start Developing</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes instantly on your device via Expo Go.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  statusBox: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
