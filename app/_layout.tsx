import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar, View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { initSentry } from '@/lib/sentry';
import { initGlobalErrorHandlers } from '@/lib/logger';
import { useFonts } from '@/hooks/useFonts';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { enforceDeviceSecurity } from '@/utils/deviceSecurity';
import { SplashScreen } from '@/components/SplashScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import queryClient from '@/api/queryClient';
import SessionManager from '@/utils/sessionManager';
import '../global.css';

const SPLASH_BG = '#FF5A00';

const SPLASH_MIN_DURATION_MS = 2000;
const SPLASH_MAX_DURATION_MS = 8000;

const SPLASH_DEBUG = __DEV__;

initSentry();
initGlobalErrorHandlers();

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

  useEffect(() => {
    enforceDeviceSecurity({ allowContinue: true }).finally(() => {
      setSecurityChecked(true);
    });
  }, []);

  // Unified splash logic: wait for fonts, security, and min duration
  useEffect(() => {
    const fontsReady = fontsLoaded || fontError;
    if (!fontsReady || !securityChecked) return;

    const elapsed = Date.now() - splashStartTime;
    const remaining = SPLASH_MIN_DURATION_MS - elapsed;

    if (remaining <= 0) {
      if (SPLASH_DEBUG) console.log('[splash] Ready, hiding immediately');
      setShowSplash(false);
    } else {
      if (SPLASH_DEBUG) console.log('[splash] Ready, waiting', remaining, 'ms');
      const timer = setTimeout(() => setShowSplash(false), remaining);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, fontError, securityChecked, splashStartTime]);

  // Max timeout fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (SPLASH_DEBUG) console.log('[splash] Max duration reached, forcing hide');
      setShowSplash(false);
    }, SPLASH_MAX_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  // Initialize session after splash
  useEffect(() => {
    if (showSplash) return;
    try {
      SessionManager.initialize();
    } catch (error) {
      if (__DEV__) console.error('[Layout] SessionManager init failed:', error);
    }
  }, [showSplash]);

  const fontsReady = fontsLoaded || fontError;

  if (showSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: SPLASH_BG }}>
        <SplashScreen isReady={!!(fontsReady && securityChecked)} onAnimationComplete={() => {}} />
      </View>
    );
  }

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
