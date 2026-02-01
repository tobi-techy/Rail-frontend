import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Alert, AccessibilityInfo } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { OTPInput, Button } from '../../components/ui';
import { AuthGradient } from '@/components';
import { useAuthStore } from '../../stores/authStore';
import { useVerifyCode, useResendCode } from '../../api/hooks';

export default function VerifyEmail() {
  const pendingEmail = useAuthStore((state) => state.pendingVerificationEmail);
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);

  const { mutate: verifyEmail, isPending: isVerifying } = useVerifyCode();
  const { mutate: resendCode, isPending: isResendLoading } = useResendCode();

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const validateOTP = useCallback(
    (code: string) => {
      if (code.length !== 6) return;

      setError('');
      setIsInvalid(false);

      verifyEmail(
        { email: pendingEmail || '', code },
        {
          onSuccess: () => {
            router.push('/(auth)/complete-profile/personal-info');
          },
          onError: (err: any) => {
            const errorCode = err?.error?.code;
            const errorMessage = err?.error?.message;

            let displayMessage = 'Invalid verification code. Please try again.';

            switch (errorCode) {
              case 'INVALID_CODE':
                displayMessage = 'Invalid or expired code. Please check and try again.';
                break;
              case 'ALREADY_VERIFIED':
                displayMessage = 'This email is already verified. Please sign in.';
                setTimeout(() => router.replace('/(auth)/signin'), 2000);
                break;
              case 'VALIDATION_ERROR':
                displayMessage = 'Please enter a valid 6-digit code.';
                break;
              default:
                displayMessage = errorMessage || displayMessage;
            }

            setIsInvalid(true);
            setError(displayMessage);

            AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
              if (enabled) AccessibilityInfo.announceForAccessibility(displayMessage);
            });
          },
        }
      );
    },
    [verifyEmail, pendingEmail]
  );

  const handleOTPComplete = (code: string) => {
    setOtp(code);
    setError('');
    validateOTP(code);
  };

  const handleVerify = () => {
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      setIsInvalid(true);
      return;
    }
    validateOTP(otp);
  };

  const handleResendCode = () => {
    if (!canResend) return;

    setError('');
    setIsInvalid(false);

    resendCode(
      { email: pendingEmail || '' },
      {
        onSuccess: (response) => {
          setResendTimer(60);
          setCanResend(false);
          setOtp('');
          Alert.alert('Code Sent', response.message || 'A new verification code has been sent.');
        },
        onError: (err: any) => {
          const errorCode = err?.error?.code;
          const errorMessage = err?.error?.message;

          let displayMessage = 'Failed to resend code. Please try again.';

          if (errorCode === 'TOO_MANY_REQUESTS') {
            displayMessage = 'Too many requests. Please wait before requesting a new code.';
          } else if (errorCode === 'ALREADY_VERIFIED') {
            displayMessage = 'Your email is already verified. Please sign in.';
            setTimeout(() => router.replace('/(auth)/signin'), 2000);
          } else {
            displayMessage = errorMessage || displayMessage;
          }

          setError(displayMessage);
          Alert.alert('Error', displayMessage);
        },
      }
    );
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1">
        <StatusBar barStyle="light-content" />

        <View className="flex-1 px-6 pb-6">
          <View className="mb-8 mt-8">
            <Text className="font-body-bold text-[34px] text-white" accessibilityRole="header">
              Confirm email
            </Text>
            <View className="mt-4">
              <Text className="font-body-medium text-[18px] text-white/70">
                The code has been sent to
              </Text>
              <Text className="mt-1 font-heading-light text-[28px] text-white">
                {pendingEmail || 'your email'}
              </Text>
            </View>
          </View>

          <View className="mb-8">
            <Text className="font-body-medium text-base text-white/70">
              Please check your inbox and{'\n'}paste the code from the email below
            </Text>
          </View>

          <View className="mb-8">
            <OTPInput
              length={6}
              onComplete={handleOTPComplete}
              error={error}
              isInvalid={isInvalid}
              autoValidate={true}
            />
            <TouchableOpacity
              onPress={() => {}}
              className="mx-auto mt-4 w-[30%] items-center justify-center rounded-full bg-white/20 px-4 py-2"
              accessibilityLabel="Paste verification code"
              accessibilityRole="button">
              <Text className="font-body-medium text-[14px] text-white">Paste</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-1" />

          <View className="mb-6">
            <Button
              title="Verify Email"
              onPress={handleVerify}
              loading={isVerifying}
              disabled={otp.length !== 6 || isVerifying}
              variant="black"
            />
          </View>

          <View className="items-center">
            {canResend ? (
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={isResendLoading}
                className="py-2"
                accessibilityRole="button">
                <Text className="font-body-rounded-medium text-base text-white">
                  {isResendLoading ? 'Sending...' : "Didn't receive the code? Resend"}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className="py-2 font-label text-base text-white/50">
                Resend code in {resendTimer}s
              </Text>
            )}
          </View>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
