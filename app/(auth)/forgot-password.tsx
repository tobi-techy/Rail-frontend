import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Button } from '../../components/ui';
import { InputField } from '@/components';

const EMAIL_REGEX = /\S+@\S+\.\S+/;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = () => {
    if (!validateEmail()) return;

    setIsLoading(true);
    setIsSuccess(false);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={40}>
          <View className="flex-1 px-6 pb-6">
            <View className="mb-8 mt-4">
              <Text className="font-body-bold text-[40px] text-gray-900" accessibilityRole="header">
                Forgot password
              </Text>
              <Text className="mt-2 font-body-medium text-base text-gray-600">
                Enter the email associated with your account and we will send you instructions to
                reset your password.
              </Text>
            </View>

            <View>
              <InputField
                required
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={(value: string) => {
                  setEmail(value);
                  if (error) {
                    setError('');
                  }
                }}
                onBlur={validateEmail}
                error={error}
                type="email"
                autoCapitalize="none"
                textContentType="emailAddress"
              />
            </View>

            <View className="mt-6">
              <Button
                title="Send reset link"
                onPress={handleSubmit}
                loading={isLoading}
                disabled={!email.trim() || isLoading}
                className="rounded-full"
                accessibilityLabel="Send password reset instructions"
              />

              {isSuccess && (
                <View className="mt-4 rounded-2xl bg-gray-100 p-4">
                  <Text className="font-sf-pro-medium text-[14px] text-gray-700">
                    Check your inbox for password reset instructions. If you do not see the email,
                    check your spam folder or try again in a few minutes.
                  </Text>
                </View>
              )}
            </View>

            <View className="mt-8 flex-row items-center justify-center">
              <Text className="font-sf-pro-medium text-[14px] text-gray-600">Remember it?</Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/signin')} className="ml-2">
                <Text className="font-sf-pro-medium text-[14px] text-primary">Back to sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
