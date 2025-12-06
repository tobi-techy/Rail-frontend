import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} >
    <Stack.Screen name="index" />
    <Stack.Screen name="signin" />
    <Stack.Screen name="verify-email" />
    <Stack.Screen name="create-passcode" />
    <Stack.Screen name="confirm-passcode" />
    <Stack.Screen name="forgot-password" />
    {/* Onboarding routes are handled by nested layout */}
    <Stack.Screen name="onboarding" />
  </Stack>;
}
