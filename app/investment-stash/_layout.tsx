import { Stack } from 'expo-router';
import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function InvestmentStashLayout() {
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
