import React from 'react';
import { View } from 'react-native';
import { interpolate } from 'react-native-reanimated';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Stack } from './stack';

const screenOptions = {
  headerShown: false,
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
  screenStyleInterpolator: ({
    progress,
    layouts: { screen },
  }: {
    progress: number;
    layouts: { screen: { width: number; height: number } };
  }) => {
    'worklet';
    return {
      contentStyle: {
        transform: [
          {
            translateX: interpolate(progress, [0, 1, 2], [screen.width, 0, -screen.width * 0.25]),
          },
        ],
        opacity: interpolate(progress, [0, 0.5, 1, 2], [0, 1, 1, 1]),
      },
    };
  },
  transitionSpec: {
    open: { stiffness: 380, damping: 38, mass: 1 },
    close: { stiffness: 380, damping: 38, mass: 1 },
  },
};

export default function AuthLayout() {
  return (
    <ErrorBoundary>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <Stack screenOptions={screenOptions}>
          <Stack.Screen name="signup" />
          <Stack.Screen name="signin" />
          <Stack.Screen name="verify-email" />
          <Stack.Screen name="create-passcode" />
          <Stack.Screen name="confirm-passcode" />
          <Stack.Screen name="create-railtag" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="complete-profile" />
        </Stack>
      </View>
    </ErrorBoundary>
  );
}
