import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { Passkey } from 'react-native-passkey';
import { usePasskeys, useRegisterPasskey, useVerifyPasscode } from '@/api/hooks';
import { useAuthStore } from '@/stores/authStore';
import { SessionManager } from '@/utils/sessionManager';
import { usePasskeyAuthorize } from '@/hooks/usePasskeyAuthorize';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { parseApiError } from '@/utils/apiError';
import { safeName } from './utils';
import type { ProfileNamePayload } from './types';

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30_000;

interface UseWithdrawalAuthorizeOptions {
  selectedMethod: string;
  numericAmount: number;
  isFundFlow: boolean;
  isMWAWithdrawMethod: boolean;
  isVisible: boolean;
  setIsVisible: (v: boolean) => void;
  onSubmitWithdrawal: () => void;
  onWhitelistRequired: () => void;
  onMFARequired: () => void;
  onWithdrawalFailed: (msg: string) => void;
}

export function useWithdrawalAuthorize({
  selectedMethod,
  numericAmount,
  isFundFlow,
  isMWAWithdrawMethod,
  isVisible,
  setIsVisible,
  onSubmitWithdrawal,
  onWhitelistRequired,
  onMFARequired,
  onWithdrawalFailed,
}: UseWithdrawalAuthorizeOptions) {
  const user = useAuthStore((s) => s.user as ProfileNamePayload | undefined);
  const { showError, showSuccess } = useFeedbackPopup();
  const { data: passkeys, isLoading: isPasskeysLoading } = usePasskeys();
  const { mutateAsync: registerPasskey, isPending: isRegisteringPasskey } = useRegisterPasskey();
  const { mutate: verifyPasscode, isPending: isPasscodeVerifying } = useVerifyPasscode();

  const [pinAttempts, setPinAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState(0);
  const [submitWithActiveSession, setSubmitWithActiveSession] = useState(false);

  const passkeySupported = Passkey.isSupported() && Boolean(safeName(user?.email));
  const hasPasskey = (passkeys?.length ?? 0) > 0;
  const passkeyAvailable = passkeySupported && hasPasskey;

  const txFingerprint = `${selectedMethod}:${numericAmount.toFixed(2)}`;
  const passkeyPromptScope = `withdraw-authorize:${safeName(user?.email) || 'unknown'}:${txFingerprint}`;

  // Lockout countdown
  useEffect(() => {
    if (!lockoutUntil) return;
    const tick = setInterval(() => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setLockoutSecondsRemaining(0);
        setPinAttempts(0);
      } else {
        setLockoutSecondsRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [lockoutUntil]);

  const passkey = usePasskeyAuthorize({
    email: user?.email,
    passkeyPromptScope,
    autoTrigger: isVisible && passkeyAvailable,
    onAuthorized: onSubmitWithdrawal,
  });
  const passkeyRef = useRef(passkey);
  passkeyRef.current = passkey;

  const isAuthorizing = isPasscodeVerifying || passkey.isPasskeyLoading || isRegisteringPasskey;
  const authorizingTitle = isRegisteringPasskey ? 'Creating passkey...' : undefined;

  const handleConfirmReturn = useCallback(() => {
    passkey.onAuthPasscodeChange('');
    // Returning from the dedicated authorize screen, which just minted a passcode
    // session for this exact transaction. Trust it and submit without re-prompting.
    const s = useAuthStore.getState();
    const sessionValid =
      s.isAuthenticated && !!s.passcodeSessionToken && !SessionManager.isPasscodeSessionExpired();
    if (sessionValid) {
      setSubmitWithActiveSession(true);
    } else {
      setIsVisible(true);
    }
  }, [passkey, setIsVisible]);

  useEffect(() => {
    if (!submitWithActiveSession) return;
    setSubmitWithActiveSession(false);
    onSubmitWithdrawal();
  }, [onSubmitWithdrawal, submitWithActiveSession]);

  const showAuthorizeScreen = useCallback(() => {
    passkey.onAuthPasscodeChange('');
    passkey.setAuthError('');
    setIsVisible(true);
  }, [passkey, setIsVisible]);

  const hideAuthorizeScreen = useCallback(() => {
    setIsVisible(false);
  }, [setIsVisible]);

  const onPasscodeAuthorize = useCallback(
    (code: string) => {
      if (isAuthorizing || lockoutUntil) return;
      passkey.setAuthError('');
      verifyPasscode(
        { passcode: code },
        {
          onSuccess: (result) => {
            if (!result.verified) {
              const next = pinAttempts + 1;
              setPinAttempts(next);
              if (next >= MAX_PIN_ATTEMPTS) {
                setLockoutUntil(Date.now() + LOCKOUT_DURATION_MS);
                setLockoutSecondsRemaining(LOCKOUT_DURATION_MS / 1000);
                passkey.setAuthError('Too many failed attempts. You are temporarily locked out.');
              } else {
                passkey.setAuthError(
                  `Invalid PIN. ${MAX_PIN_ATTEMPTS - next} attempt${MAX_PIN_ATTEMPTS - next !== 1 ? 's' : ''} remaining.`
                );
              }
              passkey.onAuthPasscodeChange('');
              return;
            }
            setPinAttempts(0);
            setLockoutUntil(null);
            onSubmitWithdrawal();
          },
          onError: (err: unknown) => {
            passkey.setAuthError(parseApiError(err, 'Failed to verify PIN.'));
            passkey.onAuthPasscodeChange('');
          },
        }
      );
    },
    [isAuthorizing, lockoutUntil, onSubmitWithdrawal, passkey, pinAttempts, verifyPasscode]
  );

  const handlePasskeyPress = useCallback(() => {
    if (isAuthorizing || lockoutUntil) return;
    if (!passkeySupported) {
      passkey.setAuthError('Passkey is unavailable. Enter your PIN to continue.');
      return;
    }
    if (!isPasskeysLoading && !hasPasskey) {
      Alert.alert('Create a passkey?', 'Set up a passkey to approve withdrawals faster.', [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Create passkey',
          onPress: async () => {
            try {
              await registerPasskey(undefined);
              showSuccess('Passkey ready', 'You can now approve with passkey.');
              passkey.onPasskeyAuthorize();
            } catch (err: any) {
              const message = String(err?.message || '');
              if (err?.name === 'NotAllowedError' || message.toLowerCase().includes('cancel'))
                return;
              showError('Passkey setup failed', err?.message || 'Could not create passkey.');
            }
          },
        },
      ]);
      return;
    }
    passkey.onPasskeyAuthorize();
  }, [
    hasPasskey,
    isAuthorizing,
    isPasskeysLoading,
    lockoutUntil,
    passkey,
    passkeySupported,
    registerPasskey,
    showError,
    showSuccess,
  ]);

  return {
    isAuthorizing,
    authorizingTitle,
    passkeySupported,
    passkey,
    pinAttempts,
    lockoutUntil,
    lockoutSecondsRemaining,
    handleConfirmReturn,
    showAuthorizeScreen,
    hideAuthorizeScreen,
    onPasscodeAuthorize,
    handlePasskeyPress,
    MAX_PIN_ATTEMPTS,
  };
}
