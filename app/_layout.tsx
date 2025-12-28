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

// Hard limit: force-hide the splash after this long, no matter what.
const SPLASH_HARD_TIMEOUT_MS = 0.5 * 60 * 1000;

// Soft minimum: don't *start* finishing the splash animation before this long.
// Keep it the same as the hard timeout unless you want a longer/shorter animation window.
const MIN_SPLASH_DURATION_MS = SPLASH_HARD_TIMEOUT_MS;

// Toggle console logs for debugging splash behavior.
const SPLASH_DEBUG = false;

// Persist splash timing across Layout unmount/remounts (expo-router can remount on reload/navigation)
let splashStartedAtMs: number | null = null;
let splashHardDeadlineMs: number | null = null;
let splashMinDeadlineMs: number | null = null;

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
  const { fontsLoaded } = useFonts();
  const [isAppReady, setIsAppReady] = useState(false);
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useProtectedRoute();

  useEffect(() => {
    const now = Date.now();

    // Initialize module-scoped timing once so remounts don't "reset" the timer.
    if (splashStartedAtMs === null) {
      splashStartedAtMs = now;
      splashHardDeadlineMs = splashStartedAtMs + SPLASH_HARD_TIMEOUT_MS;
      splashMinDeadlineMs = splashStartedAtMs + MIN_SPLASH_DURATION_MS;
    }

    if (SPLASH_DEBUG) {
      console.log('[splash] mounted');
      console.log('[splash] timing:', {
        startedAtMs: splashStartedAtMs,
        minDeadlineMs: splashMinDeadlineMs,
        hardDeadlineMs: splashHardDeadlineMs,
        now,
        msUntilMin: Math.max(0, (splashMinDeadlineMs ?? now) - now),
        msUntilHard: Math.max(0, (splashHardDeadlineMs ?? now) - now),
      });
    }

    const msUntilMin = Math.max(0, (splashMinDeadlineMs ?? now) - now);

    // Soft minimum: keep splash up for at least MIN_SPLASH_DURATION_MS (relative to first mount).
    const minTimer = setTimeout(() => {
      if (SPLASH_DEBUG) console.log('[splash] min duration elapsed');
      setMinSplashElapsed(true);
    }, msUntilMin);

    // Hard deadline enforcement: poll the absolute deadline so we don't rely on a single long timer.
    // (Some environments can be flaky with long setTimeouts.)
    let lastHeartbeatAt = now;

    const pollTimer = setInterval(() => {
      // If the splash is already hidden, stop polling to avoid repeated logs/work.
      if (!showSplash) {
        clearInterval(pollTimer);
        return;
      }

      const t = Date.now();
      const hardDeadline = splashHardDeadlineMs ?? t;
      const remainingMs = hardDeadline - t;

      // Heartbeat every 10 seconds while splash is shown (useful for debugging).
      if (SPLASH_DEBUG && t - lastHeartbeatAt >= 10_000) {
        lastHeartbeatAt = t;
        console.log('[splash] heartbeat:', {
          remainingMs: Math.max(0, remainingMs),
          showSplash,
          isAppReady,
          fontsLoaded,
          minSplashElapsed,
        });
      }

      if (t >= hardDeadline) {
        const elapsedMs = t - (splashStartedAtMs ?? t);
        if (SPLASH_DEBUG)
          console.log(`[splash] HARD DEADLINE reached after ${elapsedMs}ms -> hiding splash`);
        setShowSplash(false);
        clearInterval(pollTimer);
      }
    }, 1000);

    // If min deadline is already in the past (e.g., remount), apply immediately.
    if (msUntilMin === 0) setMinSplashElapsed(true);

    return () => {
      if (SPLASH_DEBUG) console.log('[splash] unmounted');
      clearTimeout(minTimer);
      clearInterval(pollTimer);
    };
    // Intentionally mount-only: deadlines are module-scoped and we don't want to re-arm on rerenders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (SPLASH_DEBUG) console.log('[splash] fontsLoaded changed:', fontsLoaded);
  }, [fontsLoaded]);

  useEffect(() => {
    // Only allow the splash animation to start finishing once fonts are ready AND
    // the minimum splash duration has elapsed.
    if (fontsLoaded && minSplashElapsed) {
      if (SPLASH_DEBUG)
        console.log('[splash] isAppReady -> true (fontsLoaded && minSplashElapsed)');
      setIsAppReady(true);
    }
  }, [fontsLoaded, minSplashElapsed]);

  useEffect(() => {
    // Safety net: if the animation callback never fires for any reason,
    // force-hide the splash shortly after it's allowed to complete.
    if (!showSplash) return;
    if (!isAppReady) return;

    if (SPLASH_DEBUG) console.log('[splash] isAppReady true, starting force-hide fallback timer');
    const forceHideTimer = setTimeout(() => {
      if (SPLASH_DEBUG) console.log('[splash] force-hide fallback fired -> hiding splash');
      setShowSplash(false);
    }, 1500);

    return () => clearTimeout(forceHideTimer);
  }, [isAppReady, showSplash]);

  const handleSplashComplete = useCallback(() => {
    if (SPLASH_DEBUG) console.log('[splash] onAnimationComplete -> hiding splash');
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
