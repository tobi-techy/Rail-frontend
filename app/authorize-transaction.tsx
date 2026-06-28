import { View, Text, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useVerifyPasscode } from '@/api/hooks';
import { useAuthStore } from '@/stores/authStore';
import { usePasskeyAuthorize } from '@/hooks/usePasskeyAuthorize';
import { useCallback, useEffect, useState } from 'react';
import { useHaptics } from '@/hooks/useHaptics';
import { ArrowLeft01Icon, EyeIcon, ViewOffIcon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { logger } from '@/lib/logger';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

export default function AuthorizeTransactionScreen() {
  const params = useLocalSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // SECURITY FIX (NEW-M4): Reject deep link access — this screen must only be
  // reached from internal navigation. If not authenticated, redirect immediately.
  useEffect(() => {
    if (!isAuthenticated) {
      logger.warn(
        '[AuthorizeTransaction] Unauthenticated access attempt — possible deep link abuse',
        {
          component: 'AuthorizeTransaction',
          action: 'unauthorized-access',
        }
      );
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

  const { isPasskeyLoading, authError, authPasscode, setAuthError, onAuthPasscodeChange } =
    usePasskeyAuthorize({
      email: user?.email,
      passkeyPromptScope,
      autoTrigger: isBiometricEnabled,
      onAuthorized: () => router.back(),
    });

  const { notification, impact } = useHaptics();
  const [showPin, setShowPin] = useState(false);

  // Crossfade between eye / eye-slash icons
  const eyeOpacity = useSharedValue(0);
  const eyeSlashOpacity = useSharedValue(1);
  const eyeScale = useSharedValue(0.25);
  const eyeSlashScale = useSharedValue(1);

  useEffect(() => {
    eyeOpacity.value = withTiming(showPin ? 1 : 0, { duration: 180 });
    eyeSlashOpacity.value = withTiming(showPin ? 0 : 1, { duration: 180 });
    eyeScale.value = withTiming(showPin ? 1 : 0.25, { duration: 180 });
    eyeSlashScale.value = withTiming(showPin ? 0.25 : 1, { duration: 180 });
  }, [showPin]);

  const eyeAnimStyle = useAnimatedStyle(() => ({
    opacity: eyeOpacity.value,
    transform: [{ scale: eyeScale.value }],
    position: 'absolute',
  }));
  const eyeSlashAnimStyle = useAnimatedStyle(() => ({
    opacity: eyeSlashOpacity.value,
    transform: [{ scale: eyeSlashScale.value }],
    position: 'absolute',
  }));

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
        <Animated.View entering={FadeInUp.duration(220)} className="mt-2 px-6">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-[#F0F0F0] active:scale-[0.96]">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#343433" strokeWidth={2} />
          </Pressable>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInUp.delay(60).duration(250)} className="mt-6 px-6">
          <Text className="font-heading text-[32px] leading-[38px] text-[#1a1a1a]">
            Authorize{'\n'}transaction
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View entering={FadeInUp.delay(100).duration(250)} className="mt-4 px-6">
          <Text className="font-body text-[15px] text-[#848281]">Enter Your Account Pin</Text>
        </Animated.View>

        {/* PIN boxes + eye toggle */}
        <Animated.View
          entering={FadeInUp.delay(140).duration(260)}
          className="mt-5 flex-row items-center justify-between px-6">
          <View className="flex-row gap-x-3">
            {[0, 1, 2, 3].map((i) => {
              const filled = i < authPasscode.length;
              return (
                <View
                  key={i}
                  className="h-[56px] w-[56px] items-center justify-center rounded-xl bg-[#F0F0F0]">
                  {filled &&
                    (showPin ? (
                      <Text
                        className="font-subtitle text-[22px] text-[#1a1a1a]"
                        style={{ fontVariant: ['tabular-nums'] }}>
                        {authPasscode[i]}
                      </Text>
                    ) : (
                      <View className="h-3 w-3 rounded-full bg-[#343433]" />
                    ))}
                </View>
              );
            })}
          </View>
          <Pressable
            onPress={() => setShowPin((v) => !v)}
            className="h-12 w-12 items-center justify-center rounded-full bg-[#EEF2FF] active:scale-[0.96]">
            {/* Two icons cross-fading */}
            <View className="size-[22px] items-center justify-center">
              <Animated.View style={eyeAnimStyle}>
                <HugeiconsIcon icon={EyeIcon} size={22} color="#6366F1" />
              </Animated.View>
              <Animated.View style={eyeSlashAnimStyle}>
                <HugeiconsIcon icon={ViewOffIcon} size={22} color="#6366F1" />
              </Animated.View>
            </View>
          </Pressable>
        </Animated.View>

        {/* Error */}
        {authError ? (
          <View className="mt-3 px-6">
            <Text className="font-body text-[13px] text-coral-red">{authError}</Text>
          </View>
        ) : null}

        {/* Spacer */}
        <View className="flex-1" />

        {/* Number pad */}
        <Animated.View entering={FadeInUp.delay(180).duration(280)} className="px-6 pb-2">
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
                  className="h-[64px] flex-1 items-center justify-center active:scale-[0.96]">
                  <Text
                    className="font-subtitle text-[28px] text-[#343433]"
                    style={{ fontVariant: ['tabular-nums'] }}>
                    {n}
                  </Text>
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
              className="h-[64px] flex-1 items-center justify-center active:scale-[0.96]">
              <Text
                className="font-subtitle text-[28px] text-[#343433]"
                style={{ fontVariant: ['tabular-nums'] }}>
                0
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (authPasscode.length > 0) {
                  onAuthPasscodeChange(authPasscode.slice(0, -1));
                }
              }}
              className="h-[64px] flex-1 items-center justify-center active:scale-[0.96]">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color="#343433" strokeWidth={2} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Forgot PIN */}
        <Animated.View entering={FadeInUp.delay(220).duration(280)} className="mb-6 items-center">
          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            className="active:opacity-70"
            hitSlop={8}>
            <Text className="font-body text-[15px] text-[#0090ff] underline">Forgot PIN?</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
