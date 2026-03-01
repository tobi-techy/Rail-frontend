import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { SessionManager } from '@/utils/sessionManager';

/**
 * Root index — waits for store hydration, then routes:
 * - Returning user with passcode → /login-passcode
 * - Returning user without passcode → /signin (incomplete onboarding)
 * - New user → /intro
 */
export default function IndexScreen() {
  const [hydrated, setHydrated] = useState(useAuthStore.persist.hasHydrated());
  const user = useAuthStore((s) => s.user);
  const hasPasscode = useAuthStore((s) => s.hasPasscode);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!hydrated) {
      return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    }
  }, [hydrated]);

  const hasValidAuthSession = Boolean(isAuthenticated && accessToken);
  const hasValidPasscodeSession = hasValidAuthSession
    ? !SessionManager.isPasscodeSessionExpired()
    : false;

  const targetRoute = !hydrated
    ? null
    : hasValidAuthSession && (!hasPasscode || hasValidPasscodeSession)
      ? '/(tabs)'
      : user && hasPasscode
        ? '/login-passcode'
        : user && !hasPasscode
          ? '/(auth)/signin'
          : '/intro';

  useEffect(() => {
    if (targetRoute) {
      router.replace(targetRoute as never);
    }
  }, [targetRoute]);

  // Keep an orange surface while startup routing resolves.
  return <View style={{ flex: 1, backgroundColor: '#FF2E01' }} />;
}
