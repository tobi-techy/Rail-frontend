import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Stack } from 'expo-router';
import { AppState, Platform, StatusBar, View } from 'react-native';
import { focusManager, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { initSentry } from '@/lib/sentry';
import { initGlobalErrorHandlers, logger } from '@/lib/logger';
import { validateEnvironmentVariables } from '@/utils/envValidator';
import { useFonts } from '@/hooks/useFonts';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useBiometricLock } from '@/hooks/useBiometricLock';
import { enforceDeviceSecurity } from '@/utils/deviceSecurity';
import { initEncryption } from '@/utils/encryption';
import { SplashScreen as CustomSplash } from '@/components/SplashScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FeedbackPopupHost } from '@/components/ui';
import queryClient, { queryKeys } from '@/api/queryClient';
import { stationService } from '@/api/services/station.service';
import SessionManager from '@/utils/sessionManager';
import gleap from '@/utils/gleap';
import { PostHogProvider, PostHogSurveyProvider, usePostHog } from 'posthog-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores';
import '../global.css';

SplashScreen.preventAutoHideAsync().catch(() => {});

const SPLASH_BG = '#FF2E01';
const SPLASH_MIN_DURATION_MS = 2500;
const SPLASH_MAX_DURATION_MS = 4000;

initSentry();
initGlobalErrorHandlers();

const envValidation = validateEnvironmentVariables();
if (!envValidation.isValid && !__DEV__) {
  logger.error('[Layout] Critical environment configuration missing', {
    component: 'Layout',
    action: 'env-validation-failed',
    errors: envValidation.errors,
  });
}

function AppReadyTracker() {
  const posthog = usePostHog();
  useEffect(() => {
    posthog?.capture('app_opened', { platform: Platform.OS });
  }, [posthog]);
  return null;
}

function AppNavigator() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
      <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: '#FF2E01' } }} />
      <Stack.Screen
        name="login-passcode"
        options={{ contentStyle: { backgroundColor: '#FFFFFF' } }}
      />
      <Stack.Screen name="intro" options={{ contentStyle: { backgroundColor: '#000000' } }} />
      <Stack.Screen name="(auth)" options={{ contentStyle: { backgroundColor: '#FFFFFF' } }} />
      <Stack.Screen name="(tabs)" options={{ contentStyle: { backgroundColor: '#FFFFFF' } }} />
      <Stack.Screen
        name="market-asset/[symbol]"
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      />
      <Stack.Screen
        name="market-asset/trade"
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: '#000000' },
        }}
      />
      <Stack.Screen
        name="spending-stash"
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
          animationTypeForReplace: 'push',
        }}
      />
      <Stack.Screen name="investment-stash" options={{ headerShown: false }} />
      <Stack.Screen
        name="withdraw"
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
          animationTypeForReplace: 'push',
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      />
      <Stack.Screen
        name="kyc"
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
          animationTypeForReplace: 'push',
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      />
      <Stack.Screen
        name="virtual-account"
        options={{
          headerShown: false,
          presentation: 'modal',
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      />
      <Stack.Screen
        name="passkey-settings"
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      />
      <Stack.Screen
        name="settings-notifications"
        options={{
          headerShown: false,
          animation: 'slide_from_right',
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
  const refreshCurrencyRates = useUIStore((s) => s.refreshCurrencyRates);

  useProtectedRoute();
  useBiometricLock();

  useEffect(() => {
    Promise.all([enforceDeviceSecurity({ allowContinue: __DEV__ }), initEncryption()]).finally(() =>
      setSecurityChecked(true)
    );
  }, []);

  useEffect(() => {
    focusManager.setFocused(AppState.currentState === 'active');
    const sub = AppState.addEventListener('change', (s) => focusManager.setFocused(s === 'active'));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    void refreshCurrencyRates();
  }, [refreshCurrencyRates]);

  const onCustomSplashReady = useCallback(async () => {
    if (customSplashStartTime === null) {
      await SplashScreen.hideAsync();
      setCustomSplashStartTime(Date.now());
    }
  }, [customSplashStartTime]);

  useEffect(() => {
    const fontsReady = fontsLoaded || fontError;
    if (!fontsReady || !securityChecked || customSplashStartTime === null) return;
    const remaining = SPLASH_MIN_DURATION_MS - (Date.now() - customSplashStartTime);
    if (remaining <= 0) {
      setShowSplash(false);
    } else {
      const t = setTimeout(() => setShowSplash(false), remaining);
      return () => clearTimeout(t);
    }
  }, [fontsLoaded, fontError, securityChecked, customSplashStartTime]);

  // Max timeout fallback
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), SPLASH_MAX_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (showSplash) return;
    try {
      SessionManager.initialize();
      gleap.initialize(process.env.EXPO_PUBLIC_GLEAP_TOKEN ?? '');
      gleap.showFeedbackButton(false);
    } catch (error) {
      logger.error(
        '[Layout] SessionManager init failed',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }, [showSplash]);

  useEffect(() => {
    if (showSplash) return;
    const state = useAuthStore.getState();
    if (!state?.isAuthenticated || !state?.accessToken) return;
    void queryClient.prefetchQuery({
      queryKey: queryKeys.station.home(),
      queryFn: () => stationService.getStation(),
      staleTime: 0,
    });
  }, [showSplash]);

  if (showSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: SPLASH_BG }}>
        <CustomSplash onMounted={onCustomSplashReady} />
      </View>
    );
  }

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: SPLASH_BG }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <StatusBar barStyle="dark-content" />
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
              <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                <PostHogProvider
                  apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? ''}
                  options={{
                    host: 'https://us.i.posthog.com',
                    enableSessionReplay: true,
                    sessionReplayConfig: { maskAllTextInputs: true, maskAllImages: false },
                  }}>
                  <PostHogSurveyProvider>
                    <AppReadyTracker />
                    <AppNavigator />
                    <FeedbackPopupHost />
                  </PostHogSurveyProvider>
                </PostHogProvider>
              </View>
            </SafeAreaProvider>
          </QueryClientProvider>
        </KeyboardProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
