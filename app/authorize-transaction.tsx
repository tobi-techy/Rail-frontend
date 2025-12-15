import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { PasscodeInput } from '@/components/molecules/PasscodeInput';
import { useVerifyPasscode } from '@/api/hooks';

export default function AuthorizeTransactionScreen() {
  const params = useLocalSearchParams();
  const { transactionId, amount, type, recipient } = params;
  
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const { mutate: verifyPasscode, isPending: isLoading } = useVerifyPasscode();

  const handlePasscodeSubmit = useCallback((code: string) => {
    if (isLoading) return;
    setError('');

    verifyPasscode(
      { passcode: code },
      {
        onSuccess: (result) => {
          if (result.verified) {
            // TODO: Call transaction authorization API
            router.replace('/(tabs)' as any);
          } else {
            setError('Invalid PIN. Please try again.');
            setPasscode('');
          }
        },
        onError: (err: any) => {
          const errorMessage = err?.error?.message || err?.message || 'Failed to verify PIN. Please try again.';
          setError(errorMessage);
          setPasscode('');
        },
      }
    );
  }, [verifyPasscode, isLoading]);

  const handleBack = () => {
    router.back();
  };

  const handleForgotPIN = () => {
    // TODO: Navigate to forgot PIN flow
    console.log('Forgot PIN pressed');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <View className="flex-1">
        {/* Back Button */}
        <View className="mt-2 px-6">
          <TouchableOpacity
            onPress={handleBack}
            className="h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6]"
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#070914" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View className="mt-12 px-6">
          <Text className="font-heading text-[36px] leading-[42px] text-[#070914]">
            Authorize{'\n'}transaction
          </Text>
        </View>

        {/* PasscodeInput Component */}
        <PasscodeInput
          subtitle="Enter your account PIN"
          length={4}
          value={passcode}
          onValueChange={(value) => {
            setPasscode(value);
            if (error) setError('');
          }}
          onComplete={handlePasscodeSubmit}
          errorText={error}
          showToggle
          autoSubmit
          className="flex-1 mt-10"
        />

        {/* Forgot PIN Link */}
        <View className="mb-8 px-6 items-center">
          <TouchableOpacity onPress={handleForgotPIN} activeOpacity={0.7}>
            <Text className="font-body-semibold text-[16px] text-[#3B82F6]">
              Forgot PIN?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

