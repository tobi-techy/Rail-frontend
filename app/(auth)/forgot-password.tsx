import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, Keyboard, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../components/ui';
import { InputField, AuthGradient, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useForgotPassword } from '@/api/hooks/useAuth';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { mutate: forgotPassword, isPending } = useForgotPassword();
  const { showError, showWarning, showInfo } = useFeedbackPopup();

  const handleSendReset = () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setEmailError('Email is required');
      showWarning('Missing Email', 'Please enter your email address.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setEmailError('Please enter a valid email address');
      showWarning('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setEmailError('');
    forgotPassword(
      { email: normalizedEmail },
      {
        onSuccess: () => {
          setIsEmailSent(true);
          showInfo('Reset Link Sent', 'If the account exists, reset instructions were sent.');
        },
        onError: (error: any) => {
          showError('Request Failed', error?.message || 'Unable to send reset instructions');
        },
      }
    );
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1">
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={Platform.OS === 'android'}
        />
        <Pressable className="flex-1 px-6 pb-6" onPress={Keyboard.dismiss}>
            <StaggeredChild index={0}>
              {isEmailSent ? (
                <View className="mb-8 mt-4">
                  <Text className="font-headline text-auth-title text-black">Check your email</Text>
                  <Text className="mt-2 font-body text-base text-black/60">
                    If an account exists for this email, password reset instructions have been sent.
                  </Text>
                </View>
              ) : (
                <View className="mb-8 mt-4">
                  <Text className="font-headline text-auth-title text-black">Forgot password</Text>
                  <Text className="mt-2 font-body text-base text-black/60">
                    Enter the email associated with your account and we will send you instructions
                    to reset your password.
                  </Text>
                </View>
              )}
            </StaggeredChild>

            <StaggeredChild index={1}>
              {!isEmailSent && (
                <InputField
                  label="Email Address"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (emailError) setEmailError('');
                  }}
                  type="email"
                  error={emailError}
                />
              )}
            </StaggeredChild>

            <StaggeredChild index={2} delay={80} style={{ marginTop: 'auto' }}>
              <View className="pt-8">
                {isEmailSent ? (
                  <Button
                    title="Back to sign in"
                    onPress={() => router.replace(ROUTES.AUTH.SIGNIN as never)}
                  />
                ) : (
                  <Button title="Send reset link" onPress={handleSendReset} loading={isPending} />
                )}
                <View className="mt-8 flex-row items-center justify-center">
                  <Text className="font-body text-caption text-black/60">Remember it?</Text>
                  <TouchableOpacity
                    onPress={() => router.replace(ROUTES.AUTH.SIGNIN as never)}
                    className="ml-2">
                    <Text className="font-body text-caption text-black underline">
                      Back to sign in
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </StaggeredChild>
        </Pressable>
      </SafeAreaView>
    </AuthGradient>
  );
}
