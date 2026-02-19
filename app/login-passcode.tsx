import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Passkey } from 'react-native-passkey';
import { Icon } from '@/components/atoms/Icon';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { useAuthStore } from '@/stores/authStore';
import { useVerifyPasscode } from '@/api/hooks';
import { authService, userService } from '@/api/services';
import { SessionManager } from '@/utils/sessionManager';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { APP_VERSION } from '@/utils/appVersion';

type ProfileNamePayload = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
};

const safeName = (value?: string) => value?.trim() || '';

const extractProfileName = (profile: ProfileNamePayload) => {
  const firstName = safeName(profile.firstName || profile.first_name);
  const lastName = safeName(profile.lastName || profile.last_name);
  const directFullName = safeName(profile.fullName || profile.full_name || profile.name);
  const combinedFullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return {
    firstName,
    lastName,
    fullName: combinedFullName || directFullName,
  };
};

type WebAuthnOptionsPayload = {
  publicKey?: Record<string, any>;
  [key: string]: any;
};

const normalizePasskeyGetRequest = (options: WebAuthnOptionsPayload) => {
  const publicKey = (options?.publicKey ?? options) as Record<string, any>;

  if (!publicKey?.challenge || !publicKey?.rpId) {
    throw new Error('Invalid passkey options from server');
  }

  return {
    challenge: publicKey.challenge,
    rpId: publicKey.rpId,
    timeout: publicKey.timeout,
    allowCredentials: publicKey.allowCredentials,
    userVerification: publicKey.userVerification,
    extensions: publicKey.extensions,
  };
};

const isPasskeyCancelledError = (error: any) => {
  const code = String(error?.code || error?.error || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();

  return (
    code.includes('usercancel') ||
    code.includes('cancel') ||
    code.includes('abort') ||
    message.includes('cancelled') ||
    message.includes('canceled')
  );
};

const getPasskeyFallbackMessage = (error: any) => {
  const code = String(error?.code || error?.error || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();

  if (code === 'NOCREDENTIALS' || message.includes('no credentials')) {
    return 'No passkey found for this account on this device. Enter your PIN.';
  }

  if (code === 'INVALID_SESSION') {
    return 'Passkey session expired. Please try again or enter your PIN.';
  }

  if (code === 'NETWORK_ERROR' || code === 'NETWORK_TIMEOUT' || error?.status === 0) {
    return 'Network issue during passkey sign-in. Enter your PIN.';
  }

  return 'Passkey sign-in failed. Enter your PIN to continue.';
};

export default function LoginPasscodeScreen() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const updateUser = useAuthStore((state) => state.updateUser);
  const isBiometricEnabled = useAuthStore((state) => state.isBiometricEnabled);
  const profileFetchAttemptedRef = useRef(false);
  const passkeyAutoAttemptedRef = useRef(false);
  const combinedStoredFullName = [safeName(user?.firstName), safeName(user?.lastName)]
    .filter(Boolean)
    .join(' ')
    .trim();
  const userName =
    combinedStoredFullName || safeName(user?.fullName) || safeName(user?.firstName) || 'User';
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);
  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState(0);

  const { mutate: verifyPasscode, isPending: isLoading } = useVerifyPasscode();
  const { showError, showWarning } = useFeedbackPopup();

  // Check passkey availability and account prerequisites.
  useEffect(() => {
    const hasEmail = Boolean(safeName(user?.email));
    setPasskeyAvailable(Passkey.isSupported() && hasEmail);
  }, [user?.email]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (safeName(user?.firstName)) return;
    if (profileFetchAttemptedRef.current) return;
    profileFetchAttemptedRef.current = true;

    let isMounted = true;
    (async () => {
      try {
        const profile = (await userService.getProfile()) as ProfileNamePayload;
        if (!isMounted) return;

        const { firstName, lastName, fullName } = extractProfileName(profile);
        if (!firstName && !fullName) return;

        updateUser({
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          fullName: fullName || undefined,
        });
      } catch {
        // Ignore profile fetch errors on passcode screen; user can still sign in with PIN.
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, updateUser, user?.firstName]);

  useEffect(() => {
    if (!lockoutUntil) {
      setLockoutSecondsRemaining(0);
      return;
    }

    const updateCountdown = () => {
      const remainingSeconds = Math.max(0, Math.ceil((lockoutUntil.getTime() - Date.now()) / 1000));
      setLockoutSecondsRemaining(remainingSeconds);
      if (remainingSeconds === 0) setLockoutUntil(null);
    };

    updateCountdown();
    const id = setInterval(updateCountdown, 1000);
    return () => clearInterval(id);
  }, [lockoutUntil]);

  const handlePasskeyAuth = useCallback(async () => {
    if (isPasskeyLoading || isLoading) return;

    const email = safeName(user?.email);
    if (!Passkey.isSupported() || !email) {
      setError('Passkey is unavailable. Enter your PIN to continue.');
      return;
    }

    setError('');
    setIsPasskeyLoading(true);

    try {
      const beginResponse = await authService.beginPasskeyLogin({ email });
      const passkeyRequest = normalizePasskeyGetRequest(beginResponse.options);
      const assertion = await Passkey.get(passkeyRequest);

      const finishResponse = await authService.finishPasskeyLogin({
        sessionId: beginResponse.sessionId,
        response: {
          ...assertion,
          type: assertion.type || 'public-key',
        },
      });

      const nowIso = new Date().toISOString();
      const tokenExpiresAt = finishResponse.expiresAt
        ? new Date(finishResponse.expiresAt).toISOString()
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const passcodeSessionExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      useAuthStore.setState({
        user: finishResponse.user,
        accessToken: finishResponse.accessToken,
        refreshToken: finishResponse.refreshToken,
        isAuthenticated: true,
        pendingVerificationEmail: null,
        onboardingStatus: finishResponse.user.onboardingStatus || null,
        lastActivityAt: nowIso,
        tokenIssuedAt: nowIso,
        tokenExpiresAt,
        passcodeSessionToken: 'passkey-login',
        passcodeSessionExpiresAt,
      });

      SessionManager.schedulePasscodeSessionExpiry(passcodeSessionExpiresAt);
      if (!useAuthStore.getState().isBiometricEnabled) {
        useAuthStore.getState().enableBiometric();
      }

      setLockoutUntil(null);
      router.replace('/(tabs)');
    } catch (err: any) {
      if (isPasskeyCancelledError(err)) {
        setError('Passkey cancelled. Enter your PIN to continue.');
        return;
      }

      const fallbackMessage = getPasskeyFallbackMessage(err);
      setError(fallbackMessage);

      const code = String(err?.code || err?.error || '').toUpperCase();
      if (
        code === 'WEBAUTHN_UNAVAILABLE' ||
        code === 'WEBAUTHN_SESSION_UNAVAILABLE' ||
        code === 'BADCONFIGURATION'
      ) {
        showWarning('Passkey Unavailable', fallbackMessage);
      } else if (code !== 'NOCREDENTIALS') {
        showError('Passkey Sign-in Failed', fallbackMessage);
      }
    } finally {
      setIsPasskeyLoading(false);
    }
  }, [isPasskeyLoading, isLoading, showError, showWarning, user?.email]);

  // Auto-trigger passkey on mount when user opted in and passkey is supported.
  useEffect(() => {
    if (!isBiometricEnabled || !passkeyAvailable) return;
    if (passkeyAutoAttemptedRef.current) return;

    passkeyAutoAttemptedRef.current = true;
    handlePasskeyAuth();
  }, [isBiometricEnabled, passkeyAvailable, handlePasskeyAuth]);

  useEffect(() => {
    if (passkeyAvailable) {
      passkeyAutoAttemptedRef.current = false;
    }
  }, [passkeyAvailable, user?.id]);

  const handlePasscodeSubmit = useCallback(
    (code: string) => {
      if (isLoading || isPasskeyLoading) return;
      if (lockoutSecondsRemaining > 0) {
        setError(`PIN is locked. Try again in ${lockoutSecondsRemaining}s.`);
        return;
      }
      setError('');

      verifyPasscode(
        { passcode: code },
        {
          onSuccess: async (response) => {
            if (!response.verified) {
              setError('PIN verification failed');
              setPasscode('');
              return;
            }

            if (response.passcodeSessionExpiresAt) {
              SessionManager.schedulePasscodeSessionExpiry(response.passcodeSessionExpiresAt);
            }

            // If passkey support is available but not enabled, opt user in after successful PIN auth.
            if (passkeyAvailable && !isBiometricEnabled) {
              const { enableBiometric } = useAuthStore.getState();
              enableBiometric();
            }

            setLockoutUntil(null);
            await new Promise((resolve) => setTimeout(resolve, 100));
            router.replace('/(tabs)');
          },
          onError: (err: any) => {
            if (err?.status === 401 && err?.code === 'INVALID_PASSCODE') {
              setError(err?.message || 'Incorrect PIN. Please try again.');
              setPasscode('');
              return;
            }

            if (err?.status === 423) {
              const lockoutRaw =
                err?.details?.lockedUntil ??
                err?.details?.locked_until ??
                err?.error?.details?.lockedUntil ??
                err?.error?.details?.locked_until;
              const parsedLockout = lockoutRaw ? new Date(lockoutRaw) : null;
              if (parsedLockout && !Number.isNaN(parsedLockout.getTime())) {
                setLockoutUntil(parsedLockout);
              }
              setError(
                err?.message || 'Too many incorrect PIN attempts. Sign in with email to continue.'
              );
              setPasscode('');
              return;
            }

            if (err?.status === 401) {
              useAuthStore.getState().reset();
              showWarning('Session Expired', 'Please sign in again.');
              router.replace('/(auth)/signin');
              return;
            }

            const errorMessage =
              err?.error?.message || err?.message || 'Incorrect PIN. Please try again.';
            setError(errorMessage);
            showError('PIN Verification Failed', errorMessage);
            setPasscode('');
          },
        }
      );
    },
    [
      verifyPasscode,
      isLoading,
      isPasskeyLoading,
      lockoutSecondsRemaining,
      passkeyAvailable,
      isBiometricEnabled,
      showError,
      showWarning,
    ]
  );

  const handleSwitchAccount = () => {
    useAuthStore.getState().reset();
    router.replace('/(auth)/signin');
  };

  const handleSignInWithEmail = () => {
    router.push('/(auth)/signin');
  };

  const handleNeedHelp = () => {
    router.push('/(auth)/forgot-password');
  };

  // Show passkey button only if passkeys are supported and we have an email identifier.
  const showBiometric = passkeyAvailable;

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="white" />

        <View className="flex-1">
          {/* Header */}
          <View className="mt-2 flex-row items-center justify-end px-6">
            <TouchableOpacity
              onPress={handleNeedHelp}
              className="flex-row items-center gap-x-2 rounded-full bg-gray-100 px-4 py-2.5"
              activeOpacity={0.7}>
              <Icon name="message-circle" size={18} color="#374151" strokeWidth={2} />
              <Text className="font-body text-caption text-gray-700">Need help?</Text>
            </TouchableOpacity>
          </View>

          {/* Welcome Text */}
          <View className="mt-8 px-6">
            <Text className="font-subtitle text-headline-2 leading-[38px] text-text-primary">
              Welcome Back,
            </Text>
            <Text className="font-subtitle text-headline-1 text-text-primary">{userName}</Text>
          </View>

          {/* PasscodeInput */}
          <PasscodeInput
            subtitle="Use passkey or enter your account PIN"
            length={4}
            value={passcode}
            onValueChange={(value) => {
              setPasscode(value);
              if (error) setError('');
            }}
            onComplete={handlePasscodeSubmit}
            errorText={
              lockoutSecondsRemaining > 0
                ? `PIN is locked. Try again in ${lockoutSecondsRemaining}s or sign in with email.`
                : error
            }
            showToggle
            showFingerprint={showBiometric}
            onFingerprint={handlePasskeyAuth}
            autoSubmit
            variant="light"
            className="flex-1"
          />

          {/* Footer */}
          <View className="mb-4 items-center gap-y-3 px-6">
            <View className="flex-row items-center gap-x-1">
              <Text className="font-body text-caption text-text-secondary">Not {userName}? </Text>
              <TouchableOpacity onPress={handleSwitchAccount} activeOpacity={0.7}>
                <Text className="font-button text-caption text-primary">Switch Account</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleSignInWithEmail} activeOpacity={0.7}>
              <Text className="font-body text-caption text-text-secondary">Sign in with email</Text>
            </TouchableOpacity>

            <Text className="font-body text-small text-text-tertiary">v{APP_VERSION}</Text>
          </View>
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
