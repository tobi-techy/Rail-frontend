import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Stack } from 'expo-router';
import { AppState, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { focusManager, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
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
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores';
import '../global.css';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Critical synchronous inits only
initSentry();
initGlobalErrorHandlers();

if (!validateEnvironmentVariables().isValid && !__DEV__) {
  logger.error('[Layout] Critical environment configuration missing', { component: 'Layout' });
}

// Android baseline — deferred
if (Platform.OS === 'android') {
  const { InteractionManager } = require('react-native');
  InteractionManager.runAfterInteractions(() => {
    require('@/utils/androidVisualBaseline').configureAndroidVisualBaseline();
  });
}

const SPLASH_BG = '#ff3e00';
const SPLASH_MIN_MS = 600; // Just a flash of branding — dismiss as soon as ready
const SPLASH_MAX_MS = 1000; // Hard cap — never wait longer than this

// Lazy-loaded heavy components (not needed at startup)
const BlurView = lazy(() => import('expo-blur').then((m) => ({ default: m.BlurView })));

function AppReadyTracker() {
  const posthog = usePostHog();

  useEffect(() => {
    posthog?.capture('app_opened', { platform: Platform.OS });

    // Defer all non-critical SDK inits
    Promise.allSettled([
      import('@/utils/mixpanel').then((m) => m.initMixpanel()),
      import('@/hooks/usePushNotifications'),
      import('@/hooks/useForceUpdate'),
    ]);
  }, [posthog]);

  return null;
}

// Separate component to initialize push + force update AFTER app is ready
function PostReadyHooks() {
  const { usePushNotifications } = require('@/hooks/usePushNotifications');
  const { useForceUpdate } = require('@/hooks/useForceUpdate');
  usePushNotifications();
  useForceUpdate();
  return null;
}

function AppNavigator() {
  useProtectedRoute();
  useBiometricLock();

  return (
    <Stack initialRouteName="index" screenOptions={{ headerShown: false, contentStyle: styles.white }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login-passcode" />
      <Stack.Screen name="intro" options={{ contentStyle: styles.black }} />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="market-asset/[symbol]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="market-asset/trade" options={{ animation: 'slide_from_bottom', contentStyle: styles.black }} />
      <Stack.Screen name="spending-stash" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="investment-stash" />
      <Stack.Screen name="gameplay" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="subscription" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="withdraw" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="kyc" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="virtual-account" />
      <Stack.Screen name="passkey-settings" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="settings-notifications" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="fund-crosschain" options={{ animation: 'slide_from_bottom', contentStyle: styles.primary }} />
      <Stack.Screen name="fund-stash" options={{ animation: 'slide_from_bottom', contentStyle: styles.primary }} />
      <Stack.Screen name="fund-naira" options={{ animation: 'slide_from_bottom', contentStyle: styles.primary }} />
      <Stack.Screen name="paj-verify" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="ai-chat" options={{ animation: 'fade_from_bottom', animationDuration: 250, gestureEnabled: false }} />
    </Stack>
  );
}

export default function Layout() {
  const { fontsLoaded, error: fontError } = useFonts();
  const [showSplash, setShowSplash] = useState(true);
  const [securityChecked, setSecurityChecked] = useState(false);
  const splashStart = useRef<number | null>(null);
  const refreshCurrencyRates = useUIStore((s) => s.refreshCurrencyRates);
  const [isBlurred, setIsBlurred] = useState(false);

  // App state — blur only when backgrounded
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      setIsBlurred(s !== 'active');
      focusManager.setFocused(s === 'active');
    });
    return () => sub.remove();
  }, []);

  // Security checks in parallel
  useEffect(() => {
    Promise.all([
      enforceDeviceSecurity({ allowContinue: __DEV__ }),
      initEncryption(),
      import('@/utils/deviceFingerprint').then((m) => m.getDeviceFingerprint()),
    ]).finally(() => setSecurityChecked(true));
  }, []);

  // Hide native splash as soon as custom splash mounts
  const onCustomSplashReady = useCallback(async () => {
    if (splashStart.current === null) {
      await SplashScreen.hideAsync();
      splashStart.current = Date.now();
    }
  }, []);

  // Dismiss splash when ready
  useEffect(() => {
    if (!(fontsLoaded || fontError) || !securityChecked || splashStart.current === null) return;
    const elapsed = Date.now() - splashStart.current;
    const remaining = Math.max(0, SPLASH_MIN_MS - elapsed);
    const t = setTimeout(() => setShowSplash(false), remaining);
    return () => clearTimeout(t);
  }, [fontsLoaded, fontError, securityChecked]);

  // Hard timeout fallback
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), SPLASH_MAX_MS);
    return () => clearTimeout(t);
  }, []);

  // Post-splash: initialize session, prefetch data
  useEffect(() => {
    if (showSplash) return;

    SessionManager.initialize();

    // Deferred SDK init
    import('@/utils/gleap').then((m) => {
      const token = process.env.EXPO_PUBLIC_GLEAP_TOKEN ?? '';
      if (token) { m.default.initialize(token); m.default.showFeedbackButton(false); }
    }).catch(() => {});

    // Prefetch if authenticated
    const state = useAuthStore.getState();
    if (state?.isAuthenticated && state?.accessToken) {
      queryClient.prefetchQuery({ queryKey: queryKeys.station.home(), queryFn: () => stationService.getStation(), staleTime: 0 });
      refreshCurrencyRates();
    }
  }, [showSplash, refreshCurrencyRates]);

  const isReady = !showSplash && (fontsLoaded || !!fontError);

  return (
    <GestureHandlerRootView style={styles.root}>
      <BottomSheetModalProvider>
        <ErrorBoundary>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
          <KeyboardProvider>
            <QueryClientProvider client={queryClient}>
              <SafeAreaProvider style={styles.root}>
                <View style={styles.root}>
                  <PostHogProvider
                    apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? ''}
                    autocapture={false}
                    options={{ host: 'https://us.i.posthog.com', disabled: __DEV__ }}>
                    {isReady && <AppReadyTracker />}
                    {isReady && <PostReadyHooks />}
                    <AppNavigator />
                    <FeedbackPopupHost />
                    {isBlurred && (
                      <Suspense fallback={null}>
                        <BlurView intensity={50} tint="regular" style={StyleSheet.absoluteFill} />
                      </Suspense>
                    )}
                  </PostHogProvider>
                </View>
              </SafeAreaProvider>
            </QueryClientProvider>
          </KeyboardProvider>
        </ErrorBoundary>
      </BottomSheetModalProvider>
      {((!fontsLoaded && !fontError) || showSplash) && (
        <View style={[StyleSheet.absoluteFill, styles.splash]}>
          <CustomSplash onMounted={onCustomSplashReady} />
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  splash: { backgroundColor: SPLASH_BG, zIndex: 999 },
  white: { backgroundColor: '#FFFFFF' },
  black: { backgroundColor: '#000000' },
  primary: { backgroundColor: '#ff3e00' },
});
