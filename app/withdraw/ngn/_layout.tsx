import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { useFeatureGate } from '@/hooks/useFeatureGate';

export default function NgnLayout() {
  const { canReceiveNgn } = useFeatureGate();

  useEffect(() => {
    if (!canReceiveNgn) {
      router.replace('/(tabs)');
    }
  }, [canReceiveNgn]);

  if (!canReceiveNgn) return null;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="recipients" />
      <Stack.Screen name="select-bank" options={{ animationDuration: 200 }} />
      <Stack.Screen name="enter-account" options={{ animationDuration: 200 }} />
      <Stack.Screen
        name="enter-amount"
        options={{ animation: 'slide_from_bottom', animationDuration: 300 }}
      />
      <Stack.Screen name="confirm" />
    </Stack>
  );
}
