import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Alert, AccessibilityInfo } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { OTPInput, Button } from '../../components/ui';
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

  // Validate OTP code and handle routing
  const validateOTP = useCallback(
    (code: string) => {
      if (code.length !== 6) {
        return;
      }

      setError('');
      setIsInvalid(false);

      verifyEmail(
        { email: pendingEmail || '', code },
        {
          onSuccess: (response) => {
            // Store user info and tokens from verification
            // Note: The hook already updates the auth store
            // Route directly to home screen after email verification
            router.replace('/(tabs)');
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
                // Navigate to signin after a delay
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

            // Announce error to screen readers
            AccessibilityInfo.isScreenReaderEnabled().then((screenReaderEnabled) => {
              if (screenReaderEnabled) {
                AccessibilityInfo.announceForAccessibility(displayMessage);
              }
            });
          },
        }
      );
    },
    [verifyEmail]
  );

  const handleOTPComplete = (code: string) => {
    setOtp(code);
    setError('');

    // Auto-validate when all digits are entered
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
          setOtp(''); // Clear current OTP input

          Alert.alert('Code Sent', response.message || 'A new verification code has been sent to your email.');

          // Announce to screen readers
          AccessibilityInfo.isScreenReaderEnabled().then((screenReaderEnabled) => {
            if (screenReaderEnabled) {
              AccessibilityInfo.announceForAccessibility('New verification code sent to your email');
            }
          });
        },
        onError: (err: any) => {
          const errorCode = err?.error?.code;
          const errorMessage = err?.error?.message;
          
          let displayMessage = 'Failed to resend code. Please try again.';
          
          switch (errorCode) {
            case 'TOO_MANY_REQUESTS':
              displayMessage = 'Too many requests. Please wait before requesting a new code.';
              break;
            case 'ALREADY_VERIFIED':
              displayMessage = 'Your email is already verified. Please sign in.';
              setTimeout(() => router.replace('/(auth)/signin'), 2000);
              break;
            default:
              displayMessage = errorMessage || displayMessage;
          }
          
          setError(displayMessage);
          Alert.alert('Error', displayMessage);
        },
      }
    );
  };

  const handlePasteCode = () => {
    // This would typically handle clipboard paste
    // For demo, we'll just focus the first input
    Alert.alert(
      'Paste Code',
      'In a real app, this would paste the code from your clipboard or from SMS.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Main Content */}
      <View className="flex-1 px-6 pb-6">
        {/* Title */}
        <View className="mb-8 mt-8">
          <Text className="font-body-bold text-[34px] text-gray-900" accessibilityRole="header">
            Confirm email
          </Text>
          <View className="mt-4">
            <Text
              className="font-sf-pro-medium text-[18px] text-gray-600"
              accessibilityLabel="The code has been sent to">
              The code has been sent to
            </Text>
            <Text
              className="mt-1 font-heading-light text-[28px] text-gray-900"
              accessibilityLabel={`Email: ${pendingEmail || 'your email'}`}>
              {pendingEmail || 'your email'}
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View className="mb-8">
          <Text
            className="font-sf-pro-medium text-base text-gray-600"
            accessibilityLabel="Please check your inbox and paste the code from the email below">
            Please check your inbox and{'\n'}paste the code from the email below
          </Text>
        </View>

        {/* OTP Input */}
        <View className="mb-8">
          <OTPInput
            length={6}
            onComplete={handleOTPComplete}
            error={error}
            isInvalid={isInvalid}
            autoValidate={true}
          />
          <TouchableOpacity
            onPress={handlePasteCode}
            className="mx-auto mt-4 w-[30%] items-center justify-center rounded-full bg-gray-100 px-4 py-2"
            accessibilityLabel="Paste verification code"
            accessibilityHint="Tap to paste verification code from clipboard"
            accessibilityRole="button">
            <Text className="font-sf-pro-medium text-[14px] text-gray-600">Paste</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-1" />

        {/* Verify Button */}
        <View className="mb-6">
          <Button
            title="Verify Email"
            onPress={handleVerify}
            loading={isVerifying}
            disabled={otp.length !== 6 || isVerifying}
            className="rounded-full"
            accessibilityLabel="Verify Email"
            accessibilityHint="Tap to verify your email with the entered code"
          />
        </View>

        {/* Resend Code */}
        <View className="items-center">
          {canResend ? (
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={isResendLoading}
              className="py-2"
              accessibilityLabel="Didn't receive the code? Resend"
              accessibilityHint="Tap to request a new verification code"
              accessibilityRole="button">
              <Text className="font-sf-pro-rounded-medium text-base text-gray-900">
                {isResendLoading ? 'Sending...' : "Didn't receive the code? Resend"}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text
              className="py-2 font-sf-pro-semibold text-base text-gray-500"
              accessibilityLabel={`Resend code in ${resendTimer} seconds`}>
              Resend code in {resendTimer}s
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
