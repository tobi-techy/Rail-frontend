import { useState, useCallback, useEffect, useRef } from 'react';
import { Passkey } from 'react-native-passkey';
import { router } from 'expo-router';
import { authService } from '@/api/services';
import { useAuthStore } from '@/stores/authStore';
import { SessionManager } from '@/utils/sessionManager';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import {
  getNativePasskey,
  isPasskeyCancelledError,
  getPasskeyFallbackMessage,
  normalizePasskeyGetRequest,
} from '@/utils/passkeyNative';
import { safeName } from '@/app/withdraw/method-screen/utils';
import {
  beginPasskeyPrompt,
  canStartPasskeyPrompt,
  endPasskeyPrompt,
  markPasskeyPromptSuccess,
  suppressAutoPasskeyPrompt,
} from '@/utils/passkeyPromptGuard';
import { INACTIVITY_LIMIT_MS, PASSCODE_SESSION_MS } from '@/utils/sessionConstants';

interface UseLoginPasskeyOptions {
  email?: string;
  isLoading: boolean;
  autoTrigger?: boolean;
  onSuccess: () => void;
}

export function useLoginPasskey({
  email,
  isLoading,
  autoTrigger = false,
  onSuccess,
}: UseLoginPasskeyOptions) {
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [error, setError] = useState('');
  const { showError, showWarning } = useFeedbackPopup();
  const autoFiredRef = useRef(false);

  const scope = `login-passcode:${useAuthStore.getState().user?.id || safeName(email) || 'unknown'}`;

  const handlePasskeyAuth = useCallback(
    async (mode: 'auto' | 'manual' = 'manual') => {
      if (isPasskeyLoading || isLoading) return;

      const resolvedEmail = safeName(email);
      if (!Passkey.isSupported() || !resolvedEmail) {
        if (mode === 'manual') setError('Passkey is unavailable. Enter your PIN to continue.');
        return;
      }

      if (!canStartPasskeyPrompt(scope, mode) || !beginPasskeyPrompt()) return;

      setError('');
      setIsPasskeyLoading(true);

      try {
        const beginResponse = await authService.beginPasskeyLogin({ email: resolvedEmail });
        const assertion = await getNativePasskey(normalizePasskeyGetRequest(beginResponse.options));

        const finishResponse = await authService.finishPasskeyLogin({
          sessionId: beginResponse.sessionId,
          response: { ...assertion, type: assertion.type || 'public-key' },
        });

        const nowIso = new Date().toISOString();
        const passcodeSessionToken = String(finishResponse.passcodeSessionToken || '').trim();
        const tokenExpiresAt = finishResponse.expiresAt
          ? new Date(finishResponse.expiresAt).toISOString()
          : new Date(Date.now() + INACTIVITY_LIMIT_MS).toISOString();
        const passcodeSessionExpiresAt = finishResponse.passcodeSessionExpiresAt
          ? new Date(finishResponse.passcodeSessionExpiresAt).toISOString()
          : new Date(Date.now() + PASSCODE_SESSION_MS).toISOString();

        useAuthStore.setState({
          user: finishResponse.user,
          accessToken: finishResponse.accessToken,
          refreshToken: finishResponse.refreshToken,
          csrfToken: finishResponse.csrfToken || useAuthStore.getState().csrfToken,
          isAuthenticated: true,
          pendingVerificationEmail: null,
          onboardingStatus: finishResponse.user.onboardingStatus || null,
          lastActivityAt: nowIso,
          tokenIssuedAt: nowIso,
          tokenExpiresAt,
          passcodeSessionToken: passcodeSessionToken || undefined,
          passcodeSessionExpiresAt,
        });

        if (passcodeSessionToken) {
          SessionManager.schedulePasscodeSessionExpiry(passcodeSessionExpiresAt);
        }
        markPasskeyPromptSuccess(scope);
        if (!useAuthStore.getState().isBiometricEnabled) {
          useAuthStore.getState().enableBiometric();
        }

        onSuccess();
      } catch (err: unknown) {
        const e = err as { code?: string; error?: string; message?: string };
        if (isPasskeyCancelledError(err)) {
          suppressAutoPasskeyPrompt(scope);
          if (mode === 'manual') setError('Passkey cancelled. Enter your PIN to continue.');
          return;
        }
        const fallbackMessage = getPasskeyFallbackMessage(err);
        suppressAutoPasskeyPrompt(scope);
        if (mode === 'manual') {
          setError(fallbackMessage);
          const code = String(e?.code || e?.error || '').toUpperCase();
          if (
            code === 'WEBAUTHN_UNAVAILABLE' ||
            code === 'WEBAUTHN_SESSION_UNAVAILABLE' ||
            code === 'BADCONFIGURATION'
          ) {
            showWarning('Passkey Unavailable', fallbackMessage);
          } else if (code !== 'NOCREDENTIALS') {
            showError('Passkey Sign-in Failed', fallbackMessage);
          }
        }
      } finally {
        endPasskeyPrompt();
        setIsPasskeyLoading(false);
      }
    },
    [email, isLoading, isPasskeyLoading, onSuccess, scope, showError, showWarning]
  );

  // Auto-trigger once on mount when passkey is set up
  useEffect(() => {
    if (!autoTrigger || autoFiredRef.current || isLoading) return;
    autoFiredRef.current = true;
    // Small delay so the screen is fully rendered before the system sheet appears
    const t = setTimeout(() => handlePasskeyAuth('auto'), 400);
    return () => clearTimeout(t);
  }, [autoTrigger, handlePasskeyAuth, isLoading]);

  return {
    isPasskeyLoading,
    error,
    setError,
    handlePasskeyAuth: () => handlePasskeyAuth('manual'),
  };
}
