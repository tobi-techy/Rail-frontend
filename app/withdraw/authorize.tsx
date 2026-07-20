import { useCallback, useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Passkey } from 'react-native-passkey';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { usePasskeys, useRegisterPasskey, useVerifyPasscode } from '@/api/hooks';
import { useAuthStore } from '@/stores/authStore';
import { usePasskeyAuthorize } from '@/hooks/usePasskeyAuthorize';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { parseApiError } from '@/utils/apiError';
import { safeName } from '@/components/withdraw/method-screen/utils';
import { ArrowLeft01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30_000;

/**
 * Unified withdrawal authorization screen.
 * All withdrawal flows (crypto, naira, USD, EUR, etc.) navigate here after review.
 * On successful PIN/passkey verification, navigates back — the calling screen
 * detects the active passcode session and proceeds with submission.
 */
export default function WithdrawAuthorizeScreen() {
  const params = useLocalSearchParams<{
    amount?: string;
    label?: string;
    method?: string;
    _confirmParams?: string;
  }>();
  const user = useAuthStore((s) => s.user);
  const { showError, showSuccess } = useFeedbackPopup();

  const { data: passkeys, isLoading: isPasskeysLoading } = usePasskeys();
  const { mutateAsync: registerPasskey, isPending: isRegisteringPasskey } = useRegisterPasskey();
  const { mutate: verifyPasscode, isPending: isPasscodeVerifying } = useVerifyPasscode();

  const [pinAttempts, setPinAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState(0);
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);

  const passkeySupported = Passkey.isSupported() && Boolean(safeName(user?.email));
  const hasPasskey = (passkeys?.length ?? 0) > 0;
  const passkeyAvailable = passkeySupported && hasPasskey;

  const subtitle = params.amount
    ? `Enter your 4-digit PIN to approve ${params.label || `$${params.amount}`} withdrawal.`
    : 'Enter your 4-digit PIN to approve this withdrawal.';

  const onAuthorized = useCallback(() => {
    // Show processing state briefly before navigating back
    setProcessing(true);
    processingRef.current = true;
    // If we have confirm params, dismiss back to [method] with _confirm flag
    if (params._confirmParams && params.method) {
      try {
        const confirmParams = JSON.parse(params._confirmParams);
        router.dismissTo({
          pathname: '/withdraw/[method]',
          params: { ...confirmParams, _confirm: '1' },
        });
      } catch {
        router.back();
      }
    } else {
      router.back();
    }
  }, [params._confirmParams, params.method]);

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

  const passkeyPromptScope = `withdraw-authorize:${safeName(user?.email) || 'unknown'}`;

  const passkey = usePasskeyAuthorize({
    email: user?.email,
    passkeyPromptScope,
    autoTrigger: false,
    onAuthorized,
  });

  const isAuthorizing = isPasscodeVerifying || passkey.isPasskeyLoading || isRegisteringPasskey;

  const onPasscodeComplete = useCallback(
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
            onAuthorized();
          },
          onError: (err: unknown) => {
            passkey.setAuthError(parseApiError(err, 'Failed to verify PIN.'));
            passkey.onAuthPasscodeChange('');
          },
        }
      );
    },
    [isAuthorizing, lockoutUntil, onAuthorized, passkey, pinAttempts, verifyPasscode]
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

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <View className="px-4 pt-2">
        <Pressable
          className="size-11 items-center justify-center rounded-full bg-stone-surface"
          onPress={() => {
            if (!isAuthorizing && !processing) {
              router.back();
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#111111" />
        </Pressable>
      </View>

      <View className="px-4 pt-2">
        {(isAuthorizing || processing) && (
          <View className="mt-2 flex-row items-center gap-2">
            <ActivityIndicator size="small" color="#111111" />
            <Text className="font-body text-sm text-text-secondary" maxFontSizeMultiplier={1.4}>
              {isRegisteringPasskey
                ? 'Creating passkey...'
                : processing
                  ? 'Processing withdrawal...'
                  : 'Authorizing...'}
            </Text>
          </View>
        )}

        {!!lockoutUntil && (
          <View className="mt-3 rounded-lg bg-coral-red/10 px-4 py-3">
            <Text className="font-subtitle text-sm text-coral-red" maxFontSizeMultiplier={1.3}>
              Too many failed attempts. Try again in {lockoutSecondsRemaining}s.
            </Text>
          </View>
        )}

        {!lockoutUntil && pinAttempts > 0 && MAX_PIN_ATTEMPTS - pinAttempts <= 3 && (
          <View className="mt-3 rounded-lg bg-sunburst-yellow/10 px-4 py-3">
            <Text className="font-body text-sm text-amber-700" maxFontSizeMultiplier={1.4}>
              {MAX_PIN_ATTEMPTS - pinAttempts} attempt
              {MAX_PIN_ATTEMPTS - pinAttempts !== 1 ? 's' : ''} remaining before lockout.
            </Text>
          </View>
        )}
      </View>

      <PasscodeInput
        title="Authorize transaction"
        subtitle={subtitle}
        length={4}
        value={passkey.authPasscode}
        onValueChange={passkey.onAuthPasscodeChange}
        onComplete={lockoutUntil ? undefined : onPasscodeComplete}
        errorText={passkey.authError}
        showPasskey={passkeySupported}
        onPasskey={lockoutUntil ? undefined : handlePasskeyPress}
        autoSubmit
        variant="light"
        className="mt-4 flex-1"
      />
    </SafeAreaView>
  );
}
