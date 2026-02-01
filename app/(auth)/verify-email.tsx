import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { OTPInput, Button } from '../../components/ui';
import { AuthGradient, StaggeredChild } from '@/components';

export default function VerifyEmail() {
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOTPComplete = (code: string) => {
    setOtp(code);
    router.push('/(auth)/complete-profile/personal-info');
  };

  const handleVerify = () => {
    router.push('/(auth)/complete-profile/personal-info');
  };

  const handleResend = () => {
    if (!canResend) return;
    setResendTimer(60);
    setCanResend(false);
    setOtp('');
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1">
        <StatusBar barStyle="light-content" />
        <View className="flex-1 px-6 pb-6">
          <StaggeredChild index={0}>
            <View className="mb-8 mt-8">
              <Text className="font-body-bold text-[34px] text-white">Confirm email</Text>
              <View className="mt-4">
                <Text className="font-body-medium text-[18px] text-white/70">
                  The code has been sent to
                </Text>
                <Text className="mt-1 font-heading-light text-[28px] text-white">
                  test@example.com
                </Text>
              </View>
            </View>
          </StaggeredChild>

          <StaggeredChild index={1}>
            <View className="mb-8">
              <Text className="font-body-medium text-base text-white/70">
                Please check your inbox and{'\n'}paste the code from the email below
              </Text>
            </View>
          </StaggeredChild>

          <StaggeredChild index={2}>
            <View className="mb-8">
              <OTPInput length={6} onComplete={handleOTPComplete} autoValidate={true} variant="dark" />
              <TouchableOpacity className="mx-auto mt-4 w-[30%] items-center justify-center rounded-full bg-white/20 px-4 py-2">
                <Text className="font-body-medium text-[14px] text-white">Paste</Text>
              </TouchableOpacity>
            </View>
          </StaggeredChild>

          <View className="flex-1" />

          <StaggeredChild index={3} delay={80}>
            <View className="mb-6">
              <Button title="Verify Email" onPress={handleVerify} variant="black" />
            </View>
          </StaggeredChild>

          <StaggeredChild index={4} delay={80}>
            <View className="items-center">
              {canResend ? (
                <TouchableOpacity onPress={handleResend} className="py-2">
                  <Text className="font-body-rounded-medium text-base text-white">
                    Didn&apos;t receive the code? Resend
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text className="py-2 font-label text-base text-white/50">
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
