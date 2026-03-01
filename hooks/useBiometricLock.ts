import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useUIStore } from '@/stores';
import { isPasskeyPromptInFlight } from '@/utils/passkeyPromptGuard';
import { logger } from '@/lib/logger';

export function useBiometricLock() {
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
        if (isAuthenticating.current || isPasskeyPromptInFlight()) return;
        appWasBackground.current = true;
        lastBackgroundAt.current = Date.now();
        return;
      }

      if (nextState !== 'active') return;
      if (isAuthenticating.current || !appWasBackground.current) return;
      if (isPasskeyPromptInFlight()) {
        appWasBackground.current = false;
        return;
      }

      const now = Date.now();

      if (now - lastAuthPromptAt.current < 2000) {
        appWasBackground.current = false;
        return;
      }
      if (now < authCooldownUntil.current) return;

      const backgroundDuration = lastBackgroundAt.current ? now - lastBackgroundAt.current : 0;
      if (backgroundDuration > 0 && backgroundDuration < 1000) {
        appWasBackground.current = false;
        return;
      }

      appWasBackground.current = false;
      isAuthenticating.current = true;
      lastAuthPromptAt.current = now;

      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to continue',
          cancelLabel: 'Cancel',
        });
        authCooldownUntil.current = Date.now() + (result.success ? 1_500 : 30_000);
      } catch {
        authCooldownUntil.current = Date.now() + 30_000;
        logger.warn('[useBiometricLock] Auth error', { component: 'useBiometricLock' });
      } finally {
        isAuthenticating.current = false;
        appWasBackground.current = false;
        lastBackgroundAt.current = null;
      }
    });

    return () => sub.remove();
  }, [requireBiometricOnResume]);
}
