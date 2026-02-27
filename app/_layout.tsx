import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Stack } from 'expo-router';
import { AppState, Platform, StatusBar, View } from 'react-native';
import { focusManager, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as LocalAuthentication from 'expo-local-authentication';
import { initSentry } from '@/lib/sentry';
import { initGlobalErrorHandlers, logger } from '@/lib/logger';
import { validateEnvironmentVariables } from '@/utils/envValidator';
import { useFonts } from '@/hooks/useFonts';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
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
import { isPasskeyPromptInFlight } from '@/utils/passkeyPromptGuard';
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
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}>
      <Stack.Screen
        name="index"
        options={{
          contentStyle: { backgroundColor: '#FF2E01' },
        }}
      />
      <Stack.Screen
        name="login-passcode"
        options={{
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      />
      <Stack.Screen
        name="intro"
        options={{
          contentStyle: { backgroundColor: '#000000' },
        }}
      />
      <Stack.Screen
        name="(auth)"
        options={{
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      />
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
      {/* Stash screens - disabled until feature is complete */}
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

  useEffect(() => {
    Promise.all([enforceDeviceSecurity({ allowContinue: __DEV__ }), initEncryption()]).finally(
      () => {
        setSecurityChecked(true);
      }
    );
  }, []);

  useEffect(() => {
    focusManager.setFocused(AppState.currentState === 'active');
    const sub = AppState.addEventListener('change', (nextState) => {
      focusManager.setFocused(nextState === 'active');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    void refreshCurrencyRates();
  }, [refreshCurrencyRates]);

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

  // Initialize session and Gleap after splash
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

  // Biometric lock on resume
  const requireBiometricOnResume = useUIStore((s) => s.requireBiometricOnResume);
  const appWasBackground = useRef(false);
  const isAuthenticating = useRef(false);
  const lastBackgroundAt = useRef<number | null>(null);
  const lastAuthPromptAt = useRef(0);
  const authCooldownUntil = useRef(0);

  useEffect(() => {
    if (!requireBiometricOnResume) {
      appWasBackground.current = false;
      isAuthenticating.current = false;
      lastBackgroundAt.current = null;
      authCooldownUntil.current = 0;
      return;
    }

    const sub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'background') {
        // Ignore background events triggered by the authentication sheet itself.
        if (isAuthenticating.current || isPasskeyPromptInFlight()) return;
        appWasBackground.current = true;
        lastBackgroundAt.current = Date.now();
        return;
      }

      // Ignore transient inactive transitions caused by system overlays/prompts.
      if (nextState !== 'active') return;
      if (isAuthenticating.current || !appWasBackground.current) return;
      if (isPasskeyPromptInFlight()) {
        appWasBackground.current = false;
        return;
      }

      const now = Date.now();
      if (now - lastAuthPromptAt.current < 2000) {
        logger.debug('[Layout] Resume biometric skipped (recent prompt)', { component: 'Layout' });
        appWasBackground.current = false;
        return;
      }
      if (now < authCooldownUntil.current) {
        logger.debug('[Layout] Resume biometric suppressed by cooldown', { component: 'Layout' });
        return;
      }

      const backgroundDuration = lastBackgroundAt.current ? now - lastBackgroundAt.current : 0;
      if (backgroundDuration > 0 && backgroundDuration < 1000) {
        logger.debug('[Layout] Resume biometric skipped (short background bounce)', {
          component: 'Layout',
        });
        appWasBackground.current = false;
        return;
      }

      appWasBackground.current = false;
      isAuthenticating.current = true;
      lastAuthPromptAt.current = now;
      try {
        logger.debug('[Layout] Resume biometric challenge started', { component: 'Layout' });
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to continue',
          cancelLabel: 'Cancel',
        });
        if (!result.success) {
          authCooldownUntil.current = Date.now() + 30_000;
        } else {
          authCooldownUntil.current = Date.now() + 1_500;
        }
      } catch {
        authCooldownUntil.current = Date.now() + 30_000;
        logger.warn('[Layout] Biometric resume auth error', { component: 'Layout' });
      } finally {
        isAuthenticating.current = false;
        appWasBackground.current = false;
        lastBackgroundAt.current = null;
      }
    });
    return () => sub.remove();
  }, [requireBiometricOnResume]);

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <StatusBar barStyle={'dark-content'} />
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
              <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                <PostHogProvider
                  apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? ''}
                  options={{
                    host: 'https://us.i.posthog.com',
                    enableSessionReplay: true,
                    sessionReplayConfig: {
                      maskAllTextInputs: true,
                      maskAllImages: false,
                    },
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
