import React, { useState, useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import * as SplashScreen from 'expo-splash-screen';
import { initSentry } from '@/lib/sentry';
import { useFonts } from '@/hooks/useFonts';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { SplashScreen as CustomSplashScreen } from '@/components/SplashScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import queryClient from '@/api/queryClient';
import '../global.css';

// Initialize Sentry
initSentry();

// Prevent native splash from auto-hiding
SplashScreen.preventAutoHideAsync();

const App = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login-passcode" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function Layout() {
  const { fontsLoaded, error } = useFonts();
  const [isAppReady, setIsAppReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    async function prepare() {
      if (fontsLoaded || error) {
        // Hide native splash screen immediately
        await SplashScreen.hideAsync();
        // Then mark app as ready after delay
        setTimeout(() => setIsAppReady(true), 1500);
      }
    }
    prepare();
  }, [fontsLoaded, error]);

  useProtectedRoute();

  const handleSplashComplete = useCallback(() => {
    setShowCustomSplash(false);
  }, []);

  if (showCustomSplash || !isAppReady) {
    return (
      <CustomSplashScreen
        isReady={isAppReady}
        onAnimationComplete={handleSplashComplete}
      />
    );
  }

  if (error) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login-passcode" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="basket/create" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
    );
  }

  return (
    <ErrorBoundary>
      <KeyboardProvider>
        <View className="flex-1 bg-white">
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
              <App />
            </SafeAreaProvider>
          </QueryClientProvider>
        </View>
      </KeyboardProvider>
    </ErrorBoundary>
  );
}
