import { View, Text, Pressable, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Passkey } from 'react-native-passkey';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { useVerifyPasscode } from '@/api/hooks';
import { useAuthStore } from '@/stores/authStore';
import { usePasskeyAuthorize } from '@/hooks/usePasskeyAuthorize';
import { useCallback, useEffect } from 'react';
import { useHaptics } from '@/hooks/useHaptics';
import { ArrowLeft01Icon, FingerPrintIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { logger } from '@/lib/logger';

export default function AuthorizeTransactionScreen() {
  const params = useLocalSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // SECURITY FIX (NEW-M4): Reject deep link access — this screen must only be
  // reached from internal navigation. If not authenticated, redirect immediately.
  useEffect(() => {
    if (!isAuthenticated) {
      logger.warn('[AuthorizeTransaction] Unauthenticated access attempt — possible deep link abuse', {
        component: 'AuthorizeTransaction',
        action: 'unauthorized-access',
      });
      router.replace('/');
    }
  }, [isAuthenticated]);

  const amount = (typeof params.amount === 'string' ? params.amount : '')
    .replace(/[^0-9.]/g, '')
    .slice(0, 20);
  const type = (typeof params.type === 'string' ? params.type : '')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 30);
  const recipient = (typeof params.recipient === 'string' ? params.recipient : '')
    .replace(/[^a-zA-Z0-9@._\-]/g, '')
    .slice(0, 100);

  const user = useAuthStore((s) => s.user);
  const isBiometricEnabled = useAuthStore((s) => s.isBiometricEnabled);

  const passkeyPromptScope = `authorize-transaction:${user?.id ?? user?.email ?? 'unknown'}`;

  const { mutate: verifyPasscode, isPending: isLoading } = useVerifyPasscode();

  const {
    isPasskeyLoading,
    authError,
    authPasscode,
    setAuthError,
    onAuthPasscodeChange,
    onPasskeyAuthorize,
  } = usePasskeyAuthorize({
    email: user?.email,
    passkeyPromptScope,
    autoTrigger: isBiometricEnabled,
    onAuthorized: () => router.back(),
  });

  const { notification, impact } = useHaptics();

  const handlePasscodeSubmit = useCallback(
    (code: string) => {
      if (isLoading || isPasskeyLoading) return;
      setAuthError('');
      verifyPasscode(
        { passcode: code },
        {
          onSuccess: (result) => {
            if (result.verified) {
              notification();
              router.back();
            } else {
              impact();
              setAuthError('Invalid PIN. Please try again.');
              onAuthPasscodeChange('');
            }
          },
          onError: (err: any) => {
            impact();
            setAuthError(err?.message || 'Failed to verify PIN. Please try again.');
            onAuthPasscodeChange('');
          },
        }
      );
    },
    [
      verifyPasscode,
      isLoading,
      isPasskeyLoading,
      setAuthError,
      onAuthPasscodeChange,
      notification,
      impact,
    ]
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <View className="flex-1">
        {/* Back button */}
        <View className="mt-2 px-6">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6]">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#070914" strokeWidth={2} />
          </Pressable>
        </View>

        {/* Title */}
        <View className="mt-6 px-6">
          <Text className="font-heading text-[32px] leading-[38px] text-[#070914]">
            Authorize{'\n'}transaction
          </Text>
        </View>

        {/* Subtitle */}
        <View className="mt-4 px-6">
          <Text className="font-body text-[15px] text-[#6B7280]">Enter Your Account Pin</Text>
        </View>

        {/* PIN boxes + eye toggle */}
        <View className="mt-5 flex-row items-center justify-between px-6">
          <View className="flex-row gap-x-3">
            {[0, 1, 2, 3].map((i) => {
              const filled = i < authPasscode.length;
              return (
                <View
                  key={i}
                  className="h-[56px] w-[56px] items-center justify-center rounded-xl bg-[#F3F4F6]">
                  {filled && <View className="h-3 w-3 rounded-full bg-[#070914]" />}
                </View>
              );
            })}
          </View>
          {isBiometricEnabled && Passkey.isSupported() && (
            <Pressable
              onPress={onPasskeyAuthorize}
              disabled={isPasskeyLoading || isLoading}
              className="h-12 w-12 items-center justify-center rounded-full bg-[#EEF2FF]">
              {isPasskeyLoading ? (
                <ActivityIndicator size="small" color="#070914" />
              ) : (
                <HugeiconsIcon icon={FingerPrintIcon} size={22} color="#6366F1" />
              )}
            </Pressable>
          )}
        </View>

        {/* Error */}
        {authError ? (
          <View className="mt-3 px-6">
            <Text className="font-body text-[13px] text-red-500">{authError}</Text>
          </View>
        ) : null}

        {/* Spacer */}
        <View className="flex-1" />

        {/* Number pad */}
        <View className="px-6 pb-2">
          {[
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
          ].map((row, ri) => (
            <View key={ri} className="mb-2 flex-row justify-between">
              {row.map((n) => (
                <Pressable
                  key={n}
                  onPress={() => {
                    if (authPasscode.length < 4) {
                      const next = authPasscode + String(n);
                      onAuthPasscodeChange(next);
                      if (next.length === 4) handlePasscodeSubmit(next);
                    }
                  }}
                  className="h-[64px] flex-1 items-center justify-center">
                  <Text className="font-subtitle text-[28px] text-[#070914]">{n}</Text>
                </Pressable>
              ))}
            </View>
          ))}
          <View className="mb-2 flex-row justify-between">
            <View className="h-[64px] flex-1" />
            <Pressable
              onPress={() => {
                if (authPasscode.length < 4) {
                  const next = authPasscode + '0';
                  onAuthPasscodeChange(next);
                  if (next.length === 4) handlePasscodeSubmit(next);
                }
              }}
              className="h-[64px] flex-1 items-center justify-center">
              <Text className="font-subtitle text-[28px] text-[#070914]">0</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (authPasscode.length > 0) {
                  onAuthPasscodeChange(authPasscode.slice(0, -1));
                }
              }}
              className="h-[64px] flex-1 items-center justify-center">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#070914" strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {/* Forgot PIN */}
        <View className="mb-6 items-center">
          <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
            <Text className="font-body text-[15px] text-[#3B82F6] underline">Forgot PIN?</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
