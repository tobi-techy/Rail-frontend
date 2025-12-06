import { Stack } from 'expo-router';
import React from 'react';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="trust-device" />
      <Stack.Screen name="enable-faceid" />
      <Stack.Screen name="enable-notifications" />
      <Stack.Screen name="components" />
    </Stack>
  );
}
