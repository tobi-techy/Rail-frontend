import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { OTPInput, Button } from '@/components/ui';
import { usePajInitiate, usePajVerify } from '@/api/hooks';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

export default function PajVerifyScreen() {
  const [step, setStep] = useState<'initiate' | 'verify'>('initiate');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [otp, setOtp] = useState('');
  const otpRef = useRef<any>(null);
  const { showError, showInfo } = useFeedbackPopup();

  const navigation = useNavigation();
  const safeGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [navigation]);

  const initiate = usePajInitiate();
  const verify = usePajVerify();

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleInitiate = useCallback(async () => {
    try {
      const res = await initiate.mutateAsync();
      if (res.status === 'already_verified') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        safeGoBack();
        return;
      }
      setMaskedEmail(res.email || '');
      setStep('verify');
      setResendTimer(60);
    } catch {
      showError('Failed to send verification code. Please try again.');
    }
  }, [initiate, showError, safeGoBack]);

  const handleVerify = useCallback(
    async (code: string) => {
      Keyboard.dismiss();
      setErrorMessage('');
      try {
        await verify.mutateAsync(code);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        safeGoBack();
      } catch {
        setErrorMessage('Invalid or expired code. Please try again.');
        setOtp('');
        otpRef.current?.clear?.();
      }
    },
    [verify, safeGoBack]
  );

  const handleOTPComplete = useCallback(
    (code: string) => {
      setOtp(code);
      if (code.length === 4 && !verify.isPending) {
        handleVerify(code);
      }
    },
    [handleVerify, verify.isPending]
  );

  const handleResend = useCallback(async () => {
    if (resendTimer > 0) return;
    try {
      await initiate.mutateAsync();
      setResendTimer(60);
      setErrorMessage('');
      setOtp('');
      otpRef.current?.clear?.();
      showInfo('Code Resent', 'A new verification code has been sent.');
    } catch {
      showError('Failed to resend code. Please try again.');
    }
  }, [resendTimer, initiate, showInfo, showError]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            className="flex-1"
            contentContainerClassName="flex-grow px-6 pb-6"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="flex-row items-center pb-2 pt-1">
              <Pressable
                className="size-11 items-center justify-center rounded-full bg-surface"
                onPress={safeGoBack}
                accessibilityRole="button"
                accessibilityLabel="Go back">
                <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#111827" />
              </Pressable>
            </View>

            {step === 'initiate' ? (
              <Animated.View entering={FadeInDown.duration(300)} className="flex-1">
                <View className="mb-8 mt-6">
                  <Text className="font-subtitle text-[34px] text-black">
                    Enable Naira{'\n'}transactions
                  </Text>
                  <Text className="mt-4 font-body text-[18px] leading-6 text-black/60">
                    To fund or withdraw Naira, we need to verify your identity with our payment
                    partner. You{"'"}ll receive a one-time code.
                  </Text>
                </View>

                <View className="mt-auto">
                  <Button
                    title="Send verification code"
                    variant="black"
                    className="bg-primary"
                    loading={initiate.isPending}
                    onPress={handleInitiate}
                  />
                  <Text className="mt-6 text-center font-body text-[11px] text-[#9CA3AF]">
                    Powered by Paj Cash
                  </Text>
                </View>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInDown.duration(300)} className="flex-1">
                <View className="mb-8 mt-6">
                  <Text className="font-subtitle text-[34px] text-black">Enter code</Text>
                  <View className="mt-4">
                    <Text className="font-body text-[18px] text-black/60">
                      We sent a 4-digit code to
                    </Text>
                    <Text className="mt-1 font-subtitle text-[28px] text-black">
                      {maskedEmail || 'your email'}
                    </Text>
                  </View>
                </View>

                <View className="mb-8">
                  <Text className="mb-4 font-body text-base text-black/60">
                    Check your inbox and enter the code below
                  </Text>
                  <OTPInput
                    ref={otpRef}
                    length={4}
                    onComplete={handleOTPComplete}
                    autoValidate
                    error={errorMessage}
                    isInvalid={!!errorMessage}
                  />
                </View>

                <View className="mt-auto">
                  <Button
                    title="Verify"
                    variant="black"
                    className="bg-primary"
                    loading={verify.isPending}
                    disabled={otp.length < 4}
                    onPress={() => handleVerify(otp)}
                  />

                  <View className="mt-6 items-center">
                    {resendTimer > 0 ? (
                      <Text className="py-2 font-caption text-base text-black/40">
                        Resend code in {resendTimer}s
                      </Text>
                    ) : (
                      <Pressable onPress={handleResend} disabled={initiate.isPending}>
                        <Text className="py-2 font-body text-base text-black">
                          {initiate.isPending ? 'Resending...' : "Didn't receive the code? Resend"}
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  <Text className="mt-4 text-center font-body text-[11px] text-[#9CA3AF]">
                    Powered by Paj Cash
                  </Text>
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
