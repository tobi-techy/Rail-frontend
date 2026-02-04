import React, { useState, useEffect, useCallback } from 'react';
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
  const [storeHydrated, setStoreHydrated] = useState(false);

  useProtectedRoute();

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

  useEffect(() => {
    const minSplashTimeout = setTimeout(() => {
      if (SPLASH_DEBUG) console.log('[splash] Minimum duration elapsed');
    }, SPLASH_MIN_DURATION_MS);

    const maxSplashTimeout = setTimeout(() => {
      if (SPLASH_DEBUG) console.log('[splash] Maximum duration reached, forcing hide');
      setShowSplash(false);
    }, SPLASH_MAX_DURATION_MS);

    return () => {
      clearTimeout(minSplashTimeout);
      clearTimeout(maxSplashTimeout);
    };
  }, []);

  useEffect(() => {
    const elapsed = Date.now() - splashStartTime;
    const minTimeElapsed = elapsed >= SPLASH_MIN_DURATION_MS;
    const fontsReady = fontsLoaded || fontError;

    if (fontsReady && minTimeElapsed) {
      if (SPLASH_DEBUG) {
        console.log('[splash] Ready to hide:', { fontsLoaded, fontError, elapsed });
      }
      setShowSplash(false);
    }
  }, [fontsLoaded, fontError, splashStartTime]);

  useEffect(() => {
    const fontsReady = fontsLoaded || fontError;
    if (!fontsReady || !securityChecked || showSplash) return;

    const initializeSession = async () => {
      try {
        SessionManager.initialize();
        setStoreHydrated(true);
      } catch (error) {
        if (__DEV__) {
          console.error('[Layout] SessionManager initialization failed:', error);
        }
        setStoreHydrated(true);
      }
    };

    initializeSession();
  }, [fontsLoaded, fontError, securityChecked, showSplash]);

  const handleSplashComplete = useCallback(() => {
    if (SPLASH_DEBUG) console.log('[splash] onAnimationComplete -> hiding splash');
    setShowSplash(false);
  }, []);

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
