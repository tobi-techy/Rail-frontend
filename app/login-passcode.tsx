import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Icon } from '@/components/atoms/Icon';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { useAuthStore } from '@/stores/authStore';
import { useVerifyPasscode } from '@/api/hooks';
import { userService } from '@/api/services';
import { haptics } from '@/utils/haptics';
import { SessionManager } from '@/utils/sessionManager';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { safeName } from '@/app/withdraw/method-screen/utils';
import { clearAutoFired } from '@/utils/passkeyPromptGuard';

type ProfileNamePayload = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
};

const extractProfileName = (profile: ProfileNamePayload) => {
  const firstName = safeName(profile.firstName || profile.first_name);
  const lastName = safeName(profile.lastName || profile.last_name);
  const directFullName = safeName(profile.fullName || profile.full_name || profile.name);
  const combinedFullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  return { firstName, lastName, fullName: combinedFullName || directFullName };
};

export default function LoginPasscodeScreen() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const updateUser = useAuthStore((s) => s.updateUser);
  const isBiometricEnabled = useAuthStore((s) => s.isBiometricEnabled);
  const profileFetchAttemptedRef = useRef(false);

  const userName = safeName(user?.firstName) || safeName(user?.fullName)?.split(' ')[0] || 'User';

  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);
  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState(0);

  const { mutate: verifyPasscode, isPending: isLoading } = useVerifyPasscode();
  const { showError, showWarning } = useFeedbackPopup();

  // Check biometric availability
  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    })();
  }, []);

  // Auto-trigger biometric on mount if enabled
  useEffect(() => {
    if (isBiometricEnabled && biometricAvailable) {
      handleBiometricAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricAvailable]);

  const handleBiometricAuth = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Sign in to Rail',
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: false,
    });
    if (result.success) {
      setLockoutUntil(null);
      // Grant a passcode session so the session guard doesn't bounce back
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      useAuthStore.getState().setPasscodeSession('biometric-granted', expiresAt);
      SessionManager.schedulePasscodeSessionExpiry(expiresAt);
      router.replace('/(tabs)');
    } else {
      setError('Biometric authentication cancelled');
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || safeName(user?.firstName) || profileFetchAttemptedRef.current) return;
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
        /* ignore */
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
    const update = () => {
      const remaining = Math.max(0, Math.ceil((lockoutUntil.getTime() - Date.now()) / 1000));
      setLockoutSecondsRemaining(remaining);
      if (remaining === 0) setLockoutUntil(null);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lockoutUntil]);

  const handlePasscodeSubmit = useCallback(
    (code: string) => {
      if (isLoading) return;
      if (lockoutSecondsRemaining > 0) {
        haptics.error();
        setError(`PIN is locked. Try again in ${lockoutSecondsRemaining}s.`);
        return;
      }
      setError('');

      verifyPasscode(
        { passcode: code },
        {
          onSuccess: async (response) => {
            if (!response.verified) {
              haptics.error();
              setError('PIN verification failed');
              setPasscode('');
              return;
            }
            if (response.passcodeSessionExpiresAt) {
              SessionManager.schedulePasscodeSessionExpiry(response.passcodeSessionExpiresAt);
            }
            setLockoutUntil(null);
            await new Promise((resolve) => setTimeout(resolve, 100));
            router.replace('/(tabs)');
          },
          onError: (err: unknown) => {
            const e = err as {
              status?: number;
              code?: string;
              message?: string;
              details?: { lockedUntil?: string; locked_until?: string };
              error?: { details?: { lockedUntil?: string; locked_until?: string } };
            };
            if (e?.status === 401 && e?.code === 'INVALID_PASSCODE') {
              haptics.error();
              setError(e?.message || 'Incorrect PIN. Please try again.');
              setPasscode('');
              return;
            }
            if (e?.status === 423) {
              const lockoutRaw =
                e?.details?.lockedUntil ??
                e?.details?.locked_until ??
                e?.error?.details?.lockedUntil ??
                e?.error?.details?.locked_until;
              const parsed = lockoutRaw ? new Date(lockoutRaw) : null;
              if (parsed && !Number.isNaN(parsed.getTime())) setLockoutUntil(parsed);
              setError(
                e?.message || 'Too many incorrect PIN attempts. Sign in with email to continue.'
              );
              setPasscode('');
              return;
            }
            if (e?.status === 401) {
              useAuthStore.getState().reset();
              showWarning('Session Expired', 'Please sign in again.');
              router.replace('/(auth)/signin');
              return;
            }
            const msg = e?.message || 'Incorrect PIN. Please try again.';
            haptics.error();
            setError(msg);
            showError('PIN Verification Failed', msg);
            setPasscode('');
          },
        }
      );
    },
    [isLoading, lockoutSecondsRemaining, showError, showWarning, verifyPasscode]
  );

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <View className="flex-1">
          <View className="mt-2 flex-row items-center justify-end px-6">
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              className="flex-row items-center gap-x-2 rounded-full bg-gray-100 px-4 py-2.5"
              activeOpacity={0.7}>
              <Icon name="message-circle" size={18} color="#374151" strokeWidth={2} />
              <Text className="font-body text-caption text-gray-700">Need help?</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-8 px-6">
            <Text className="font-subtitle text-headline-2 leading-[38px] text-text-primary">
              Welcome Back,
            </Text>
            <Text className="font-subtitle text-headline-1 text-text-primary">{userName}</Text>
          </View>

          <PasscodeInput
            subtitle="Enter your PIN"
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
            showFingerprint={biometricAvailable}
            onFingerprint={handleBiometricAuth}
            autoSubmit
            variant="light"
            className="flex-1"
          />

          <View className="mb-4 items-center gap-y-3 px-6">
            <View className="flex-row items-center gap-x-1">
              <Text className="font-body text-caption text-text-secondary">Not {userName}? </Text>
              <TouchableOpacity
                onPress={() => {
                  clearAutoFired(
                    `login-passcode:${useAuthStore.getState().user?.id || safeName(user?.email) || 'anonymous'}`
                  );
                  useAuthStore.getState().reset();
                  router.replace('/(auth)/signin');
                }}
                activeOpacity={0.7}>
                <Text className="font-button text-caption text-primary">Switch Account</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => router.push('/(auth)/signin')} activeOpacity={0.7}>
              <Text className="font-body text-caption text-text-secondary">Sign in with email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
