import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Icon } from '@/components/atoms/Icon';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { useAuthStore } from '@/stores/authStore';
import { useVerifyPasscode } from '@/api/hooks';
import { SessionManager } from '@/utils/sessionManager';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function LoginPasscodeScreen() {
  const user = useAuthStore((state) => state.user);
  const userName = user?.fullName || user?.email?.split('@')[0] || 'User';
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const { mutate: verifyPasscode, isPending: isLoading } = useVerifyPasscode();

  const handleBiometricAuth = useCallback(async () => {
    try {
      const isBiometricAvailable = await LocalAuthentication.hasHardwareAsync();
      const isBiometricEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!isBiometricAvailable || !isBiometricEnrolled) {
        setError('Biometric authentication not available');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your account',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        handlePasscodeSubmit('biometric');
      }
    } catch (error) {
      setError('Biometric authentication failed');
    }
  }, []);

  const handlePasscodeSubmit = useCallback(
    (code: string) => {
      if (isLoading) return;
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

            await new Promise((resolve) => setTimeout(resolve, 100));
            router.replace('/(tabs)');
          },
          onError: (err: any) => {
            const errorMessage =
              err?.error?.message || err?.message || 'Incorrect PIN. Please try again.';
            setError(errorMessage);
            setPasscode('');
          },
        }
      );
    },
    [verifyPasscode, isLoading]
  );

  const handleSwitchAccount = () => {
    // Clear user data and navigate to sign in
    useAuthStore.getState().reset();
    router.replace('/(auth)/signin');
  };

  const handleSignInWithEmail = () => {
    // Navigate to email/password sign in
    router.push('/(auth)/signin');
  };

  const handleNeedHelp = () => {
    // Navigate to help or support
    router.push('/(auth)/forgot-password');
  };

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="white" />

        <View className="flex-1">
          {/* Header with Need Help button */}
          <View className="mt-2 flex-row items-center justify-end px-6">
            <TouchableOpacity
              onPress={handleNeedHelp}
              className="bg-background-tertiary flex-row items-center gap-x-2 rounded-full px-4 py-2.5"
              activeOpacity={0.7}>
              <Icon name="message-circle" size={18} color="#fff" strokeWidth={2} />
              <Text className="font-body-medium text-[14px] text-white">Need help?</Text>
            </TouchableOpacity>
          </View>

          {/* Welcome Text */}
          <View className="mt-8 px-6">
            <Text className="font-subtitle text-[24px] leading-[38px] text-[#070914]">
              Welcome Back,
            </Text>
            <Text className="font-subtitle text-headline-1 text-[#070914]">{userName}</Text>
          </View>

          {/* PasscodeInput Component */}
          <PasscodeInput
            subtitle="Enter your account PIN to log in"
            length={4}
            value={passcode}
            onValueChange={(value) => {
              setPasscode(value);
              if (error) setError('');
            }}
            onComplete={handlePasscodeSubmit}
            errorText={error}
            showToggle
            showFingerprint
            onFingerprint={handleBiometricAuth}
            autoSubmit
            className="flex-1"
          />

          {/* Footer */}
          <View className="mb-4 items-center gap-y-3 px-6">
            <View className="flex-row items-center gap-x-1">
              <Text className="font-body-medium text-[14px] text-[#6B7280]">Not {userName}? </Text>
              <TouchableOpacity onPress={handleSwitchAccount} activeOpacity={0.7}>
                <Text className="font-body-semibold text-[14px] text-[#FF5A00]">
                  Switch Account
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleSignInWithEmail} activeOpacity={0.7}>
              <Text className="font-body-medium text-[14px] text-[#6B7280]">
                Sign in with email
              </Text>
            </TouchableOpacity>

            <Text className="font-body text-[12px] text-[#9CA3AF]">v2.1.6</Text>
          </View>
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
}
