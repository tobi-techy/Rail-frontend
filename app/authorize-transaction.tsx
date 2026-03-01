import { View, Text, Pressable, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Fingerprint } from 'lucide-react-native';
import { Passkey } from 'react-native-passkey';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { useVerifyPasscode } from '@/api/hooks';
import { useAuthStore } from '@/stores/authStore';
import { usePasskeyAuthorize } from '@/hooks/usePasskeyAuthorize';
import { useCallback } from 'react';
import { useHaptics } from '@/hooks/useHaptics';

export default function AuthorizeTransactionScreen() {
  const params = useLocalSearchParams();
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
    [verifyPasscode, isLoading, isPasskeyLoading, setAuthError, onAuthPasscodeChange, notification, impact]
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <View className="flex-1">
        <View className="mt-2 px-6">
          <Pressable
            onPress={() => router.back()}
            className="h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6]">
            <ArrowLeft size={24} color="#070914" strokeWidth={2} />
          </Pressable>
        </View>

        <View className="mt-12 px-6">
          <Text className="font-heading text-[36px] leading-[42px] text-[#070914]">
            Authorize{'\n'}transaction
          </Text>
          {amount ? (
            <Text className="mt-2 font-body text-base text-[#6B7280]">
              Confirm {type ? String(type).toLowerCase() : 'transaction'}
              {amount ? ` of $${amount}` : ''}
              {recipient ? ` to ${recipient}` : ''}
            </Text>
          ) : null}
        </View>

        <View className="mt-8 px-6">
        {isBiometricEnabled && Passkey.isSupported() && (
          <>
            <Pressable
              onPress={onPasskeyAuthorize}
              disabled={isPasskeyLoading || isLoading}
              className="flex-row items-center justify-center gap-3 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] py-4">
              {isPasskeyLoading ? (
                <ActivityIndicator size="small" color="#070914" />
              ) : (
                <Fingerprint size={22} color="#070914" />
              )}
              <Text className="font-subtitle text-base text-[#070914]">
                {isPasskeyLoading ? 'Verifying…' : 'Use Passkey'}
              </Text>
            </Pressable>

            <View className="my-6 flex-row items-center gap-3">
              <View className="h-px flex-1 bg-[#E5E7EB]" />
              <Text className="font-caption text-sm text-[#9CA3AF]">or enter PIN</Text>
              <View className="h-px flex-1 bg-[#E5E7EB]" />
            </View>
          </>
        )}
        </View>

        <PasscodeInput
          subtitle="Enter your account PIN"
          length={4}
          value={authPasscode}
          onValueChange={onAuthPasscodeChange}
          onComplete={handlePasscodeSubmit}
          errorText={authError}
          showToggle
          autoSubmit
          className="mt-10 flex-1"
        />

        <View className="mb-8 items-center px-6">
          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}>
            <Text className="font-body-semibold text-[16px] text-[#3B82F6]">Forgot PIN?</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
