import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Platform, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { AuthGradient, InputField, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useRegister } from '@/api/hooks/useAuth';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function SignUp() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const { mutate: register, isPending } = useRegister();
  const { showError, showWarning, showSuccess } = useFeedbackPopup();

  const handleSignUp = () => {
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
    register(
      { email: normalizedEmail },
      {
        onSuccess: () => {
          showSuccess('Verification Sent', 'Check your email for a 6-digit verification code.');
          router.push(ROUTES.AUTH.VERIFY_EMAIL as any);
        },
        onError: (error: any) => {
          showError('Sign Up Failed', error?.message || 'Registration failed. Please try again.');
        },
      }
    );
  };

  return (
    <AuthGradient>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={Platform.OS === 'android'}
      />
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 20,
        }}
        keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6">
          <StaggeredChild index={0}>
            <View className="mb-10">
              <Text className="font-subtitle text-[50px] leading-[1.1] text-black">
                Enter your email
              </Text>
              <Text className="mt-2 font-body text-body text-black/60">
                Sign up to start your journey
              </Text>
            </View>
          </StaggeredChild>

          <StaggeredChild index={1}>
            <InputField
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (emailError) setEmailError('');
              }}
              type="email"
              error={emailError}
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />
          </StaggeredChild>

          <StaggeredChild index={2} delay={80} style={{ marginTop: 'auto' }}>
            <View className="pt-8">
              <Text className="mb-5 text-center font-caption text-[12px] text-black/50">
                By signing up, you agree to our{' '}
                <Text
                  className="underline"
                  onPress={() => Linking.openURL('https://userail.money/terms')}>
                  Terms
                </Text>
                {' & '}
                <Text
                  className="underline"
                  onPress={() => Linking.openURL('https://userail.money/privacy')}>
                  Privacy Policy
                </Text>
              </Text>
              <Button title="Continue" onPress={handleSignUp} loading={isPending} />
              <TouchableOpacity
                onPress={() => router.push(ROUTES.AUTH.SIGNIN as any)}
                className="mt-4">
                <Text className="text-center font-body text-[14px] text-black/60">
                  Already have an account?{' '}
                  <Text className="font-subtitle text-black underline">Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </StaggeredChild>
        </View>
      </KeyboardAwareScrollView>
    </AuthGradient>
  );
}
