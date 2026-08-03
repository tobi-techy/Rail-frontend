import { Stack, router } from 'expo-router';
import React, { useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useFeatureGate } from '@/hooks/useFeatureGate';

export default function InvestmentStashLayout() {
  const { canInvest } = useFeatureGate();

  useEffect(() => {
    if (!canInvest) {
      router.replace('/(tabs)');
    }
  }, [canInvest]);

  if (!canInvest) return null;

  return (
    <ErrorBoundary>
      <Stack
        screenOptions={{
          headerShown: false,
          headerTitle: '',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#fff' },
          contentStyle: { backgroundColor: '#fff' },
          animation: 'fade',
          gestureEnabled: true,
        }}
      />
    </ErrorBoundary>
  );
}
