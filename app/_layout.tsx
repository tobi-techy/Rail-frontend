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
import { PostHogProvider, PostHogSurveyProvider } from 'posthog-react-native';
import '../global.css';

// Keep native splash visible until we're ready
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if already prevented/hidden during fast refresh or re-mounts.
});

const SPLASH_BG = '#FF2E01';

const SPLASH_MIN_DURATION_MS = 2500;
const SPLASH_MAX_DURATION_MS = 4000;

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
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#FFFFFF' },
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}>
      <Stack.Screen
        name="index"
        options={{
          sceneStyle: { backgroundColor: '#FF2E01' },
          contentStyle: { backgroundColor: '#FF2E01' },
        }}
      />
      <Stack.Screen
        name="login-passcode"
        options={{
          sceneStyle: { backgroundColor: '#FFFFFF' },
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      />
      <Stack.Screen
        name="intro"
        options={{
          sceneStyle: { backgroundColor: '#000000' },
          contentStyle: { backgroundColor: '#000000' },
        }}
      />
      <Stack.Screen
        name="(auth)"
        options={{
          sceneStyle: { backgroundColor: '#FFFFFF' },
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{
          sceneStyle: { backgroundColor: '#FFFFFF' },
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
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
          sceneStyle: { backgroundColor: '#FFFFFF' },
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      />
      <Stack.Screen
        name="virtual-account"
        options={{
          headerShown: false,
          presentation: 'modal',
          sceneStyle: { backgroundColor: '#FFFFFF' },
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
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
    <PostHogProvider
      apiKey="phc_bG9OhXAMZfICZ0hFeCcHJSx5FGzpBhN4nDHbZAIYhbR"
      options={{
        host: 'https://us.i.posthog.com',
        // Enable session recording. Requires enabling in your project settings as well.
        // Default is false.
        enableSessionReplay: true,

        sessionReplayConfig: {
          // Whether text inputs are masked. Default is true.
          // Password inputs are always masked regardless
          maskAllTextInputs: true,

          // Whether images are masked. Default is true.
          maskAllImages: true,

          // Capture logs automatically. Default is true.
          // Android only (Native Logcat only)
          captureLog: true,

          // Whether network requests are captured in recordings. Default is true
          // Only metric-like data like speed, size, and response code are captured.
          // No data is captured from the request or response body.
          // iOS only
          captureNetworkTelemetry: true,

          // Throttling delay used to reduce the number of snapshots captured
          // and reduce performance impact. Default is 1000ms
          throttleDelayMs: 1000,
        },
      }}>
      <PostHogSurveyProvider>
        <ErrorBoundary>
          <StatusBar barStyle={'dark-content'} />
          <KeyboardProvider>
            <QueryClientProvider client={queryClient}>
              <SafeAreaProvider style={{ flex: 1, backgroundColor: SPLASH_BG }}>
                <View style={{ flex: 1, backgroundColor: SPLASH_BG }}>
                  <AppNavigator />
                  <FeedbackPopupHost />
                </View>
              </SafeAreaProvider>
            </QueryClientProvider>
          </KeyboardProvider>
        </ErrorBoundary>
      </PostHogSurveyProvider>
    </PostHogProvider>
  );
}
