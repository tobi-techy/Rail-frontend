import React, { useState, useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar, View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { initSentry } from '@/lib/sentry';
import { useFonts } from '@/hooks/useFonts';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { enforceDeviceSecurity } from '@/utils/deviceSecurity';
import { SplashScreen } from '@/components/SplashScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import queryClient from '@/api/queryClient';
import '../global.css';

const SPLASH_BG = '#FF5A00';

// Simplified splash timing - much shorter and safer
const SPLASH_MIN_DURATION_MS = 2000; // 2 seconds minimum
const SPLASH_MAX_DURATION_MS = 8000; // 8 seconds maximum (iOS watchdog safe)

// Toggle console logs for debugging splash behavior.
const SPLASH_DEBUG = __DEV__;

initSentry();

function AppNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login-passcode" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="spending-stash" />
      <Stack.Screen name="investment-stash" />
    </Stack>
  );
}

export default function Layout() {
  const { fontsLoaded, error: fontError } = useFonts();
  const [showSplash, setShowSplash] = useState(true);
  const [splashStartTime] = useState(() => Date.now());
  const [securityChecked, setSecurityChecked] = useState(false);

  useProtectedRoute();

  // Device security check on app start
  useEffect(() => {
    enforceDeviceSecurity({ allowContinue: true }).finally(() => {
      setSecurityChecked(true);
    });
  }, []);

  useEffect(() => {
    if (SPLASH_DEBUG) {
      console.log('[splash] fontsLoaded:', fontsLoaded, 'fontError:', fontError);
    }
  }, [fontsLoaded, fontError]);

  // Simplified splash logic - just one timer with proper cleanup
  useEffect(() => {
    const minSplashTimeout = setTimeout(() => {
      if (SPLASH_DEBUG) console.log('[splash] Minimum duration elapsed');
    }, SPLASH_MIN_DURATION_MS);

    // Maximum timeout to prevent iOS watchdog kills
    const maxSplashTimeout = setTimeout(() => {
      if (SPLASH_DEBUG) console.log('[splash] Maximum duration reached, forcing hide');
      setShowSplash(false);
    }, SPLASH_MAX_DURATION_MS);

    return () => {
      clearTimeout(minSplashTimeout);
      clearTimeout(maxSplashTimeout);
    };
  }, []);

  // Hide splash when fonts are loaded (or failed) and minimum time has passed
  useEffect(() => {
    const elapsed = Date.now() - splashStartTime;
    const minTimeElapsed = elapsed >= SPLASH_MIN_DURATION_MS;
    const fontsReady = fontsLoaded || fontError; // Continue even if fonts fail

    if (fontsReady && minTimeElapsed) {
      if (SPLASH_DEBUG) {
        console.log('[splash] Ready to hide:', { fontsLoaded, fontError, elapsed });
      }
      setShowSplash(false);
    }
  }, [fontsLoaded, fontError, splashStartTime]);

  const handleSplashComplete = useCallback(() => {
    if (SPLASH_DEBUG) console.log('[splash] onAnimationComplete -> hiding splash');
    setShowSplash(false);
  }, []);

  // Determine if splash should be shown
  const fontsReady = fontsLoaded || fontError;
  const elapsed = Date.now() - splashStartTime;
  const shouldShowSplash = showSplash && (!fontsReady || elapsed < SPLASH_MIN_DURATION_MS);

  if (shouldShowSplash) {
    const isSplashReady = fontsReady && elapsed >= SPLASH_MIN_DURATION_MS;
    return (
      <View style={{ flex: 1, backgroundColor: SPLASH_BG }}>
        <SplashScreen
          isReady={isSplashReady ? true : false}
          onAnimationComplete={handleSplashComplete}
        />
      </View>
    );
  }

  // Show loading background while fonts are loading (but after splash is done)
  if (!fontsReady) {
    return <View style={{ flex: 1, backgroundColor: SPLASH_BG }} />;
  }

  return (
    <ErrorBoundary>
      <StatusBar barStyle={'dark-content'} />
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
