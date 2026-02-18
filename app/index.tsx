import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

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

  useEffect(() => {
    if (!hydrated) {
      return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    }
  }, [hydrated]);

  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: '#FF2E01' }} />;
  }

  if (user && hasPasscode) {
    return <Redirect href={'/login-passcode' as any} />;
  }

  if (user && !hasPasscode) {
    return <Redirect href={'/(auth)/signin' as any} />;
  }

  return <Redirect href={'/intro' as any} />;
}
