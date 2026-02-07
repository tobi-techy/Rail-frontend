import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { OTPInput, Button } from '../../components/ui';
import { AuthGradient, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useVerifyCode, useResendCode } from '@/api/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';

export default function VerifyEmail() {
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const pendingEmail = useAuthStore((state) => state.pendingVerificationEmail);
  const { mutate: verifyCode, isPending: isVerifying } = useVerifyCode();
  const { mutate: resendCode, isPending: isResending } = useResendCode();
  const otpRef = useRef<any>(null);

  useEffect(() => {
    if (!pendingEmail) {
      router.replace(ROUTES.AUTH.INDEX as any);
      return;
    }

    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer, pendingEmail]);

  const handleOTPComplete = (code: string) => {
    setErrorMessage('');
    setOtp(code);
  };

  const handleVerify = () => {
    if (!pendingEmail) {
      router.replace(ROUTES.AUTH.INDEX as any);
      return;
    }

    if (otp.length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code');
      return;
    }

    verifyCode(
      { email: pendingEmail, code: otp },
      {
        onSuccess: (response) => {
          if (response.accessToken) {
            router.replace(ROUTES.AUTH.COMPLETE_PROFILE.PERSONAL_INFO as any);
            return;
          }

          router.replace(ROUTES.AUTH.SIGNIN as any);
        },
        onError: (error: any) => {
          const message = error?.message || 'Invalid or expired verification code';
          setErrorMessage(message);
          setOtp('');
          otpRef.current?.clear?.();
          Alert.alert('Verification Failed', message);
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
        },
        onError: (error: any) => {
          Alert.alert('Resend Failed', error?.message || 'Unable to resend verification code');
        },
      }
    );
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1">
        <StatusBar barStyle="dark-content" />
        <View className="flex-1 px-6 pb-6">
          <StaggeredChild index={0}>
            <View className="mb-8 mt-8">
              <Text className="font-body-bold text-[34px] text-black">Confirm email</Text>
              <View className="mt-4">
                <Text className="font-body-medium text-[18px] text-black/60">
                  The code has been sent to
                </Text>
                <Text className="font-heading-light mt-1 text-[28px] text-black">
                  {pendingEmail || 'your email'}
                </Text>
              </View>
            </View>
          </StaggeredChild>

          <StaggeredChild index={1}>
            <View className="mb-8">
              <Text className="font-body-medium text-base text-black/60">
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
              <TouchableOpacity className="mx-auto mt-4 w-[30%] items-center justify-center rounded-full bg-black/10 px-4 py-2">
                <Text className="font-body-medium text-[14px] text-black">Paste</Text>
              </TouchableOpacity>
            </View>
          </StaggeredChild>

          <View className="flex-1" />

          <StaggeredChild index={3} delay={80}>
            <View className="mb-6">
              <Button title="Verify Email" onPress={handleVerify} loading={isVerifying} />
            </View>
          </StaggeredChild>

          <StaggeredChild index={4} delay={80}>
            <View className="items-center">
              {canResend ? (
                <TouchableOpacity onPress={handleResend} className="py-2" disabled={isResending}>
                  <Text className="font-body-rounded-medium text-base text-black">
                    {isResending ? 'Resending...' : "Didn't receive the code? Resend"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text className="font-label py-2 text-base text-black/40">
                  Resend code in {resendTimer}s
                </Text>
              )}
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
