// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAppStore } from '../src/store/useAppStore';
import { storageService } from '../src/services/storageService';
import NetInfo from '@react-native-community/netinfo';

export default function RootLayout() {
  const setIsOnline = useAppStore((state) => state.setIsOnline);

  useEffect(() => {
    // Monitor network connectivity
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return unsubscribe;
  }, [setIsOnline]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}