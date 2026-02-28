import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { OTPInput, Button } from '../../components/ui';
import { AuthGradient, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useVerifyCode, useResendCode } from '@/api/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { getPostAuthRoute } from '@/utils/onboardingFlow';

export default function VerifyEmail() {
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pendingEmail = useAuthStore((state) => state.pendingVerificationEmail);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { mutate: verifyCode, isPending: isVerifying } = useVerifyCode();
  const { mutate: resendCode, isPending: isResending } = useResendCode();
  const otpRef = useRef<any>(null);
  const { showError, showInfo, showWarning } = useFeedbackPopup();

  useEffect(() => {
    if (!pendingEmail && !isAuthenticated && !isVerifying && !isTransitioning) {
      router.replace(ROUTES.AUTH.SIGNUP as never);
      return;
    }
  }, [pendingEmail, isAuthenticated, isVerifying, isTransitioning]);

  useEffect(() => {
    if (!pendingEmail) return;
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }

    setCanResend(true);
  }, [resendTimer, pendingEmail]);

  const handleOTPComplete = (code: string) => {
    setErrorMessage('');
    setOtp(code);
    Keyboard.dismiss();
  };

  const handleVerify = () => {
    if (isVerifying || isTransitioning) return;

    Keyboard.dismiss();

    if (!pendingEmail) {
      router.replace(ROUTES.AUTH.SIGNUP as never);
      return;
    }

    if (otp.length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code');
      showWarning('Incomplete Code', 'Please enter the full 6-digit verification code.');
      return;
    }

    verifyCode(
      { email: pendingEmail, code: otp },
      {
        onSuccess: (response) => {
          setIsTransitioning(true);

          if (response.accessToken) {
            const onboardingStatus = response.onboarding_status || response.user?.onboardingStatus;
            router.replace(getPostAuthRoute(onboardingStatus) as never);
            return;
          }

          router.replace(ROUTES.AUTH.SIGNIN as never);
        },
        onError: (error: any) => {
          setIsTransitioning(false);
          const message = error?.message || 'Invalid or expired verification code';
          setErrorMessage(message);
          setOtp('');
          otpRef.current?.clear?.();
          showError('Verification Failed', message);
        },
      }
    );
  };

  const handleResend = () => {
    if (!canResend || !pendingEmail) return;

    resendCode(
      { email: pendingEmail },
      {
        onSuccess: () => {
          setResendTimer(60);
          setCanResend(false);
          setOtp('');
          setErrorMessage('');
          otpRef.current?.clear?.();
          showInfo('Code Resent', 'A new verification code has been sent.');
        },
        onError: (error: any) => {
          showError('Resend Failed', error?.message || 'Unable to resend verification code');
        },
      }
    );
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={Platform.OS === 'android'}
        />
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
              <StaggeredChild index={0}>
                <View className="mb-8 mt-8">
                  <Text className="font-subtitle text-[34px] text-black">Confirm email</Text>
                  <View className="mt-4">
                    <Text className="font-body text-[18px] text-black/60">
                      The code has been sent to
                    </Text>
                    <Text className="mt-1 font-subtitle text-[28px] text-black">
                      {pendingEmail || 'your email'}
                    </Text>
                  </View>
                </View>
              </StaggeredChild>

              <StaggeredChild index={1}>
                <View className="mb-8">
                  <Text className="font-body text-base text-black/60">
                    Please check your inbox and{'\n'}paste the code from the email below
                  </Text>
                </View>
              </StaggeredChild>

              <StaggeredChild index={2}>
                <View className="mb-8">
                  <OTPInput
                    ref={otpRef}
                    length={6}
                    onComplete={handleOTPComplete}
                    autoValidate={true}
                    error={errorMessage}
                    isInvalid={!!errorMessage}
                  />
                </View>
              </StaggeredChild>

              <View className="mt-auto">
                <StaggeredChild index={3} delay={80}>
                  <View className="mb-6">
                    <Button title="Verify Email" onPress={handleVerify} loading={isVerifying} />
                  </View>
                </StaggeredChild>

                <StaggeredChild index={4} delay={80}>
                  <View className="items-center">
                    {canResend ? (
                      <TouchableOpacity
                        onPress={handleResend}
                        className="py-2"
                        disabled={isResending}>
                        <Text className="font-body text-base text-black">
                          {isResending ? 'Resending...' : "Didn't receive the code? Resend"}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Text className="py-2 font-caption text-base text-black/40">
                        Resend code in {resendTimer}s
                      </Text>
                    )}
                  </View>
                </StaggeredChild>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthGradient>
  );
}
