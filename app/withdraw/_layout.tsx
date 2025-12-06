import React from 'react';
import { Stack } from 'expo-router';

export default function WithdrawLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Send token',
        }}
      />
      <Stack.Screen
        name="success"
        options={{
          title: 'Transaction Successful',
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}