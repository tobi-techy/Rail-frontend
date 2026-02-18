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
import { SessionManager } from '@/utils/sessionManager';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';

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

export default function LoginPasscodeScreen() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const updateUser = useAuthStore((state) => state.updateUser);
  const isBiometricEnabled = useAuthStore((state) => state.isBiometricEnabled);
  const profileFetchAttemptedRef = useRef(false);
  const combinedStoredFullName = [safeName(user?.firstName), safeName(user?.lastName)]
    .filter(Boolean)
    .join(' ')
    .trim();
  const userName =
    combinedStoredFullName || safeName(user?.fullName) || safeName(user?.firstName) || 'User';
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);
  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState(0);

  const { mutate: verifyPasscode, isPending: isLoading } = useVerifyPasscode();
  const { showError, showWarning } = useFeedbackPopup();

  // Check biometric availability on mount
  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    })();
  }, []);

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

  const handleBiometricAuth = useCallback(async () => {
    if (!biometricAvailable) return;

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your account',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (!result.success) return;

      // Biometric confirmed device owner identity.
      // Check if we still have valid auth tokens to create a session.
      const state = useAuthStore.getState();

      if (state.isAuthenticated && state.accessToken) {
        // User has valid tokens — grant passcode session and proceed
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        state.setPasscodeSession('biometric-validated', expiresAt);
        SessionManager.schedulePasscodeSessionExpiry(expiresAt);
        router.replace('/(tabs)');
        return;
      }

      // No valid tokens — biometric alone can't re-authenticate.
      // Fall through to PIN entry which calls passcode-login endpoint.
      setError('Session expired. Please enter your PIN.');
    } catch {
      setError('Biometric authentication failed');
    }
  }, [biometricAvailable]);

  // Auto-trigger biometric on mount if enabled and available
  useEffect(() => {
    if (isBiometricEnabled && biometricAvailable) {
      handleBiometricAuth();
    }
  }, [isBiometricEnabled, biometricAvailable, handleBiometricAuth]);

  const handlePasscodeSubmit = useCallback(
    (code: string) => {
      if (isLoading) return;
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

            // If biometric hardware is available but not enabled, prompt user to enable
            if (biometricAvailable && !isBiometricEnabled) {
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
      lockoutSecondsRemaining,
      biometricAvailable,
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

  // Only show biometric button if hardware is available
  const showBiometric = biometricAvailable;

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
              <Text className="font-body text-[14px] text-gray-700">Need help?</Text>
            </TouchableOpacity>
          </View>

          {/* Welcome Text */}
          <View className="mt-8 px-6">
            <Text className="font-subtitle text-[24px] leading-[38px] text-[#070914]">
              Welcome Back,
            </Text>
            <Text className="font-subtitle text-headline-1 text-[#070914]">{userName}</Text>
          </View>

          {/* PasscodeInput */}
          <PasscodeInput
            subtitle="Enter your account PIN to log in"
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
            onFingerprint={handleBiometricAuth}
            autoSubmit
            variant="light"
            className="flex-1"
          />

          {/* Footer */}
          <View className="mb-4 items-center gap-y-3 px-6">
            <View className="flex-row items-center gap-x-1">
              <Text className="font-body text-[14px] text-[#6B7280]">Not {userName}? </Text>
              <TouchableOpacity onPress={handleSwitchAccount} activeOpacity={0.7}>
                <Text className="font-button text-[14px] text-[#FF5A00]">Switch Account</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleSignInWithEmail} activeOpacity={0.7}>
              <Text className="font-body text-[14px] text-[#6B7280]">Sign in with email</Text>
            </TouchableOpacity>

            <Text className="font-body text-[12px] text-[#9CA3AF]">v2.1.6</Text>
          </View>
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
