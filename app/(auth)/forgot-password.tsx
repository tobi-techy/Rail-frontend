import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Button } from '../../components/ui';
import { InputField, AuthGradient, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useForgotPassword } from '@/api/hooks/useAuth';

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const handleSendReset = () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    forgotPassword(
      { email: normalizedEmail },
      {
        onSuccess: () => {
          setIsEmailSent(true);
        },
        onError: (error: any) => {
          Alert.alert('Request Failed', error?.message || 'Unable to send reset instructions');
        },
      }
    );
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1">
        <StatusBar barStyle="dark-content" />
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          bottomOffset={40}>
          <View className="flex-1 px-6 pb-6">
            <StaggeredChild index={0}>
              {isEmailSent ? (
                <View className="mb-8 mt-4">
                  <Text className="font-display text-[60px] text-black">Check your email</Text>
                  <Text className="font-body-medium mt-2 text-base text-black/60">
                    If an account exists for this email, password reset instructions have been sent.
                  </Text>
                </View>
              ) : (
                <View className="mb-8 mt-4">
                  <Text className="font-display text-[60px] text-black">Forgot password</Text>
                  <Text className="font-body-medium mt-2 text-base text-black/60">
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
                  onChangeText={setEmail}
                  type="email"
                />
              )}
            </StaggeredChild>

            <StaggeredChild index={2} delay={80} style={{ marginTop: 'auto' }}>
              <View className="pt-8">
                {isEmailSent ? (
                  <Button
                    title="Back to sign in"
                    onPress={() => router.replace(ROUTES.AUTH.SIGNIN as any)}
                  />
                ) : (
                  <Button title="Send reset link" onPress={handleSendReset} loading={isPending} />
                )}
                <View className="mt-8 flex-row items-center justify-center">
                  <Text className="font-body-medium text-[14px] text-black/60">Remember it?</Text>
                  <TouchableOpacity
                    onPress={() => router.replace(ROUTES.AUTH.SIGNIN as any)}
                    className="ml-2">
                    <Text className="font-body-medium text-[14px] text-black underline">
                      Back to sign in
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </StaggeredChild>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </AuthGradient>
  );
}
