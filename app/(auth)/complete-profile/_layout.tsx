import { Stack } from 'expo-router';
import React from 'react';

export default function CompleteProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 250,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="personal-info" />
      <Stack.Screen name="date-of-birth" />
      <Stack.Screen name="address" />
      <Stack.Screen name="phone" />
    </Stack>
  );
}
