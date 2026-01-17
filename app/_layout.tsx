// app/_layout.tsx
import 'react-native-get-random-values';
import '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import NetInfo from '@react-native-community/netinfo';

export default function RootLayout() {
  const setIsOnline = useAppStore((state) => state.setIsOnline);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });
    return unsubscribe;
  }, [setIsOnline]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="case-detail"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}