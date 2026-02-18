import { Stack } from 'expo-router';
import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function AuthLayout() {
  return (
    <ErrorBoundary>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 200,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}>
        <Stack.Screen name="signup" />
        <Stack.Screen name="signin" />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="create-passcode" />
        <Stack.Screen name="confirm-passcode" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="kyc" />
        <Stack.Screen name="complete-profile" />
      </Stack>
    </ErrorBoundary>
  );
}
