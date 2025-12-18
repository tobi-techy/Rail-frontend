import React, { useState, useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { initSentry } from '@/lib/sentry';
import { useFonts } from '@/hooks/useFonts';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { SplashScreen } from '@/components/SplashScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import queryClient from '@/api/queryClient';
import '../global.css';

const SPLASH_BG = '#FF5A00';

initSentry();

function AppNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login-passcode" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function Layout() {
  const { fontsLoaded } = useFonts();
  const [isAppReady, setIsAppReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useProtectedRoute();

  useEffect(() => {
    // As soon as fonts are ready, mark the app as ready so the splash can fade out immediately.
    if (fontsLoaded) setIsAppReady(true);
  }, [fontsLoaded]);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (showSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: SPLASH_BG }}>
        <SplashScreen isReady={isAppReady} onAnimationComplete={handleSplashComplete} />
      </View>
    );
  }

  if (!fontsLoaded) {
    // Match the splash background to prevent any brief "flash" during startup.
    return <View style={{ flex: 1, backgroundColor: SPLASH_BG }} />;
  }

  return (
    <ErrorBoundary>
      <KeyboardProvider>
        <View style={{ flex: 1, backgroundColor: SPLASH_BG }}>
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
              <AppNavigator />
            </SafeAreaProvider>
          </QueryClientProvider>
        </View>
      </KeyboardProvider>
    </ErrorBoundary>
  );
}
