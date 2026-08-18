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
import { router, useLocalSearchParams } from 'expo-router';
import { OTPInput, Button } from '../../components/ui';
import { AuthGradient, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useVerifyCode, useResendCode, useEmailOTPLogin } from '@/api/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { getPostAuthRoute } from '@/utils/onboardingFlow';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';

export default function VerifyEmail() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const storedMode = useAuthStore((state) => state.pendingVerificationMode);
  // Prefer mode from store (survives navigation/reload) over URL param.
  // Default to 'signup' only when neither source explicitly says 'signin'.
  const isSigninMode = (storedMode ?? mode) === 'signin';

  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pendingEmail = useAuthStore((state) => state.pendingVerificationEmail);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { mutate: verifyCode, isPending: isVerifying } = useVerifyCode();
  const { mutate: emailOTPLogin, isPending: isEmailOTPLoggingIn } = useEmailOTPLogin();
  const { mutate: resendCode, isPending: isResending } = useResendCode();
  const otpRef = useRef<any>(null);
  const { showError, showInfo, showWarning } = useFeedbackPopup();
  const triggerFeedback = useButtonFeedback();

  useEffect(() => {
    if (!pendingEmail && !isAuthenticated && !isVerifying && !isEmailOTPLoggingIn && !isTransitioning) {
      // Pending email was cleared (e.g. stale state, deep link, or completed flow).
      // Route to signin — user can choose signin or signup from there. Routing to
      // signup assumes the user is new, which is wrong for existing users.
      router.replace(ROUTES.AUTH.SIGNIN as never);
      return;
    }
  }, [pendingEmail, isAuthenticated, isVerifying, isEmailOTPLoggingIn, isTransitioning]);

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
    if (code.length === 6 && pendingEmail && !isVerifying && !isEmailOTPLoggingIn && !isTransitioning) {
      handleVerifyWithCode(code);
    }
  };

  const handleVerifyWithCode = async (code: string) => {
    if (isSigninMode) {
      // Signin mode: use the typed email OTP login hook. The hook handles
      // response validation, auth state updates, passcode session grant,
      // passcode status sync, cache invalidation, and analytics — following
      // the Services → Hooks → Components boundary.
      setIsTransitioning(true);
      emailOTPLogin(
        { email: pendingEmail!, code },
        {
          onSuccess: (response) => {
            const route = getPostAuthRoute(response.user.onboardingStatus, {
              firstJob: useAuthStore.getState().registrationData.firstJob,
            });
            router.replace(route as never);
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
    } else {
      // Signup mode: use existing verify code
      verifyCode(
        { email: pendingEmail!, code },
        {
          onSuccess: (response) => {
            setIsTransitioning(true);
            if (response.accessToken) {
              const onboardingStatus =
                response.onboarding_status || response.user?.onboardingStatus;
              router.replace(
                getPostAuthRoute(onboardingStatus, {
                  firstJob: useAuthStore.getState().registrationData.firstJob,
                }) as never
              );
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
    }
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
                  <Text
                    className="font-subtitle text-[34px] text-charcoal-primary"
                    maxFontSizeMultiplier={1.3}>
                    Confirm email
                  </Text>
                  <View className="mt-4">
                    <Text className="font-body text-[18px] text-ash" maxFontSizeMultiplier={1.4}>
                      The code has been sent to
                    </Text>
                    <Text
                      className="mt-1 font-subtitle text-[28px] text-charcoal-primary"
                      maxFontSizeMultiplier={1.3}>
                      {pendingEmail || 'your email'}
                    </Text>
                  </View>
                </View>
              </StaggeredChild>

              <StaggeredChild index={1}>
                <View className="mb-8">
                  <Text className="font-body text-base text-ash" maxFontSizeMultiplier={1.4}>
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
                    <Button
                      title="Verify Email"
                      onPress={() => handleVerifyWithCode(otp)}
                      loading={isVerifying}
                    />
                  </View>
                </StaggeredChild>

                <StaggeredChild index={4} delay={80}>
                  <View className="items-center">
                    {canResend ? (
                      <TouchableOpacity
                        onPress={() => {
                          triggerFeedback();
                          handleResend();
                        }}
                        className="py-2"
                        disabled={isResending}>
                        <Text
                          className="font-body text-base text-charcoal-primary"
                          maxFontSizeMultiplier={1.4}>
                          {isResending ? 'Resending...' : "Didn't receive the code? Resend"}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Text
                        className="py-2 font-caption text-base text-smoke"
                        maxFontSizeMultiplier={1.4}>
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
