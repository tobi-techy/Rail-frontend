import React, { useState, useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar, View } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import * as SplashScreen from 'expo-splash-screen';
import { initSentry } from '@/lib/sentry';
import { initGlobalErrorHandlers, logger } from '@/lib/logger';
import { validateEnvironmentVariables } from '@/utils/envValidator';
import { useFonts } from '@/hooks/useFonts';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { enforceDeviceSecurity } from '@/utils/deviceSecurity';
import { SplashScreen as CustomSplash } from '@/components/SplashScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FeedbackPopupHost } from '@/components/ui';
import queryClient from '@/api/queryClient';
import SessionManager from '@/utils/sessionManager';
import '../global.css';

// Keep native splash visible until we're ready
SplashScreen.preventAutoHideAsync();

const SPLASH_BG = '#FF2E01';

const SPLASH_MIN_DURATION_MS = 2500;
const SPLASH_MAX_DURATION_MS = 4000;

const SPLASH_DEBUG = __DEV__;

initSentry();
initGlobalErrorHandlers();

// Validate critical environment variables at startup
const envValidation = validateEnvironmentVariables();
if (!envValidation.isValid && !__DEV__) {
  // In production, critical config errors should prevent app launch
  logger.error('[Layout] Critical environment configuration missing', {
    component: 'Layout',
    action: 'env-validation-failed',
    errors: envValidation.errors,
  });
}

function AppNavigator() {
  return (
    <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login-passcode" />
      <Stack.Screen name="intro" />
      <Stack.Screen
        name="(auth)"
        options={
          {
            // Wrap auth screens in their own error boundary
            // This prevents auth errors from affecting other parts of the app
          }
        }
      />
      <Stack.Screen
        name="(tabs)"
        options={
          {
            // Wrap main app tabs in their own error boundary
            // This prevents tab screen errors from affecting the entire app
          }
        }
      />
      {/* Stash screens - disabled until feature is complete */}
      {/* <Stack.Screen name="spending-stash" options={{ headerShown: false }} /> */}
      {/* <Stack.Screen name="investment-stash" options={{ headerShown: false }} /> */}
      <Stack.Screen
        name="withdraw"
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
          animationTypeForReplace: 'push',
        }}
      />
      <Stack.Screen
        name="virtual-account"
        options={{ headerShown: false, presentation: 'modal' }}
      />
    </Stack>
  );
}

export default function Layout() {
  const { fontsLoaded, error: fontError } = useFonts();
  const [showSplash, setShowSplash] = useState(true);
  const [securityChecked, setSecurityChecked] = useState(false);
  const [customSplashStartTime, setCustomSplashStartTime] = useState<number | null>(null);

  useProtectedRoute();

  useEffect(() => {
    enforceDeviceSecurity({ allowContinue: true }).finally(() => {
      setSecurityChecked(true);
    });
  }, []);

  // Hide native splash once custom splash is mounted, start timer
  const onCustomSplashReady = useCallback(async () => {
    if (customSplashStartTime === null) {
      await SplashScreen.hideAsync();
      setCustomSplashStartTime(Date.now());
    }
  }, [customSplashStartTime]);

  // Unified splash logic: wait for fonts, security, and min duration from when custom splash showed
  useEffect(() => {
    const fontsReady = fontsLoaded || fontError;
    if (!fontsReady || !securityChecked || customSplashStartTime === null) return;

    const elapsed = Date.now() - customSplashStartTime;
    const remaining = SPLASH_MIN_DURATION_MS - elapsed;

    if (remaining <= 0) {
      logger.debug('[splash] Ready, hiding immediately', {
        component: 'Layout',
        action: 'splash-hide-immediate',
      });
      setShowSplash(false);
    } else {
      logger.debug('[splash] Ready, waiting', {
        component: 'Layout',
        action: 'splash-waiting',
        remainingMs: remaining,
      });
      const timer = setTimeout(() => setShowSplash(false), remaining);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, fontError, securityChecked, customSplashStartTime]);

  // Max timeout fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      logger.warn('[splash] Max duration reached, forcing hide', {
        component: 'Layout',
        action: 'splash-max-timeout',
        maxDurationMs: SPLASH_MAX_DURATION_MS,
      });
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
      logger.error(
        '[Layout] SessionManager init failed',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }, [showSplash]);

  const fontsReady = fontsLoaded || fontError;

  if (showSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: SPLASH_BG }}>
        <CustomSplash onMounted={onCustomSplashReady} />
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
              <FeedbackPopupHost />
            </SafeAreaProvider>
          </QueryClientProvider>
        </View>
      </KeyboardProvider>
    </ErrorBoundary>
  );
}
