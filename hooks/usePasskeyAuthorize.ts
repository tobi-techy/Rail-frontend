import { useState, useCallback, useEffect, useRef } from 'react';
import { Passkey } from 'react-native-passkey';
import { authService } from '@/api/services';
import { useAuthStore } from '@/stores/authStore';
import { SessionManager } from '@/utils/sessionManager';
import {
  getNativePasskey,
  isPasskeyCancelledError,
  getPasskeyFallbackMessage,
  normalizePasskeyGetRequest,
} from '@/utils/passkeyNative';
import {
  beginPasskeyPrompt,
  canStartPasskeyPrompt,
  endPasskeyPrompt,
  markPasskeyPromptSuccess,
  suppressAutoPasskeyPrompt,
} from '@/utils/passkeyPromptGuard';
import { safeName } from '@/app/withdraw/method-screen/utils';

interface UsePasskeyAuthorizeOptions {
  email: string | undefined;
  passkeyPromptScope: string;
  autoTrigger?: boolean;
  onAuthorized: () => void;
}

export function usePasskeyAuthorize({
  email,
  passkeyPromptScope,
  autoTrigger = false,
  onAuthorized,
}: UsePasskeyAuthorizeOptions) {
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authPasscode, setAuthPasscode] = useState('');
  const autoFiredRef = useRef(false);

  const clearError = useCallback(() => setAuthError(''), []);

  const onAuthPasscodeChange = useCallback(
    (value: string) => {
      setAuthPasscode(value);
      if (authError) setAuthError('');
    },
    [authError]
  );

  const triggerPasskey = useCallback(
    async (mode: 'auto' | 'manual') => {
      const resolvedEmail = safeName(email);
      if (!Passkey.isSupported() || !resolvedEmail) {
        if (mode === 'manual') setAuthError('Passkey is unavailable. Enter your PIN to continue.');
        return;
      }
      if (!canStartPasskeyPrompt(passkeyPromptScope, mode)) return;
      if (!beginPasskeyPrompt()) return;

      setAuthError('');
      setIsPasskeyLoading(true);

      try {
        const beginResponse = await authService.beginPasskeyLogin({ email: resolvedEmail });
        const assertion = await getNativePasskey(normalizePasskeyGetRequest(beginResponse.options));

        const finishResponse = await authService.finishPasskeyLogin({
          sessionId: beginResponse.sessionId,
          response: { ...assertion, type: assertion.type || 'public-key' },
        });

        const passcodeSessionToken = String(finishResponse.passcodeSessionToken || '').trim();
        if (!passcodeSessionToken) {
          const err = new Error('Passcode session not issued after passkey login') as Error & {
            code: string;
          };
          err.code = 'PASSCODE_SESSION_UNAVAILABLE_AFTER_PASSKEY';
          throw err;
        }

        const nowIso = new Date().toISOString();
        const tokenExpiresAt = finishResponse.expiresAt
          ? new Date(finishResponse.expiresAt).toISOString()
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const passcodeSessionExpiresAt = finishResponse.passcodeSessionExpiresAt
          ? new Date(finishResponse.passcodeSessionExpiresAt).toISOString()
          : new Date(Date.now() + 10 * 60 * 1000).toISOString();

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
          passcodeSessionToken,
          passcodeSessionExpiresAt,
        });

        SessionManager.schedulePasscodeSessionExpiry(passcodeSessionExpiresAt);
        markPasskeyPromptSuccess(passkeyPromptScope);
        onAuthorized();
      } catch (err: unknown) {
        suppressAutoPasskeyPrompt(passkeyPromptScope);
        if (isPasskeyCancelledError(err)) {
          if (mode === 'manual') setAuthError('Passkey cancelled. Enter your PIN to continue.');
          return;
        }
        setAuthError(getPasskeyFallbackMessage(err));
      } finally {
        endPasskeyPrompt();
        setIsPasskeyLoading(false);
      }
    },
    [email, onAuthorized, passkeyPromptScope]
  );

  const onPasskeyAuthorize = useCallback(() => triggerPasskey('manual'), [triggerPasskey]);

  // Auto-trigger once when the authorize screen becomes visible
  useEffect(() => {
    if (!autoTrigger || autoFiredRef.current) return;
    autoFiredRef.current = true;
    const t = setTimeout(() => triggerPasskey('auto'), 400);
    return () => clearTimeout(t);
  }, [autoTrigger, triggerPasskey]);

  // Reset auto-fire gate when autoTrigger flips back off→on (screen re-shown)
  useEffect(() => {
    if (!autoTrigger) autoFiredRef.current = false;
  }, [autoTrigger]);

  return {
    isPasskeyLoading,
    authError,
    authPasscode,
    setAuthError,
    clearError,
    onAuthPasscodeChange,
    onPasskeyAuthorize,
  };
}
