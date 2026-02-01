import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Button } from '../../components/ui';
import { InputField, AuthGradient } from '@/components';

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

    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1">
        <StatusBar barStyle="light-content" />

        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          bottomOffset={40}>
          <View className="flex-1 px-6 pb-6">
            <View className="mb-8 mt-4">
              <Text className="font-display text-[60px] text-white" accessibilityRole="header">
                Forgot password
              </Text>
              <Text className="font-body-medium mt-2 text-base text-white/70">
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
                  if (error) setError('');
                }}
                onBlur={validateEmail}
                error={error}
                type="email"
                autoCapitalize="none"
                textContentType="emailAddress"
                variant="dark"
              />
            </View>

            <View className="absolute bottom-0 left-4 right-4">
              <Button
                title="Send reset link"
                onPress={handleSubmit}
                loading={isLoading}
                disabled={!email.trim() || isLoading}
                variant="black"
              />

              {isSuccess && (
                <View className="mt-4 rounded-2xl bg-white/10 p-4">
                  <Text className="font-body-medium text-[14px] text-white/80">
                    Check your inbox for password reset instructions. If you do not see the email,
                    check your spam folder or try again in a few minutes.
                  </Text>
                </View>
              )}

              <View className="mt-8 flex-row items-center justify-center">
                <Text className="font-body-medium text-[14px] text-white/70">Remember it?</Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/signin')} className="ml-2">
                  <Text className="font-body-medium text-[14px] text-white underline">
                    Back to sign in
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </AuthGradient>
  );
}
