import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { AuthGradient, InputField, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useLogin, useAppleSignIn } from '@/api/hooks/useAuth';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const { mutate: login, isPending } = useLogin();
  const { mutate: appleSignIn, isPending: isAppleLoading } = useAppleSignIn();
  const { showError, showWarning } = useFeedbackPopup();

  const handleSignIn = () => {
    if (!email || !password) {
      if (!email) setEmailError('Email is required');
      if (!password) setPasswordError('Password is required');
      showWarning('Missing Fields', 'Please enter both email and password.');
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      showWarning('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!isValidPassword(password)) {
      setPasswordError('Password must be at least 8 characters');
      showWarning('Weak Password', 'Password must be at least 8 characters.');
      return;
    }

    setEmailError('');
    setPasswordError('');

    // Clear password from state immediately for security
    // Store in temp variable to pass to login function
    const passwordToUse = password;
    setPassword('');

    login(
      { email: email.trim().toLowerCase(), password: passwordToUse },
      {
        onSuccess: (response) => {
          const onboardingStatus = response.user?.onboardingStatus;

          if (onboardingStatus === 'completed') {
            router.replace(ROUTES.TABS as any);
            return;
          }

          if (onboardingStatus === 'kyc_pending' || onboardingStatus === 'kyc_rejected') {
            router.replace(ROUTES.AUTH.KYC as any);
            return;
          }

          router.replace(ROUTES.AUTH.COMPLETE_PROFILE.PERSONAL_INFO as any);
        },
        onError: (error: any) => {
          // Categorize error for better user messaging
          let userMessage = 'Sign in failed. Please try again.';

          if (error?.code === 'NETWORK_ERROR') {
            userMessage = 'Connection error. Check your internet and try again.';
          } else if (error?.status === 429) {
            userMessage = 'Too many attempts. Please wait a moment.';
          } else if (error?.status >= 500) {
            userMessage = 'Server error. Please try again later.';
          } else if (error?.status === 401 || error?.status === 403) {
            userMessage = 'Invalid email or password.';
          } else if (error?.message) {
            userMessage = error.message;
          }

          setPasswordError(userMessage);
          showError('Sign In Failed', userMessage);
          // Password already cleared from state above
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
                Welcome Back
              </Text>
              <Text className="mt-2 font-body text-body text-black/60">Sign in to continue</Text>
            </View>
          </StaggeredChild>

          <View className="gap-y-2">
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
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />
            </StaggeredChild>

            <StaggeredChild index={2}>
              <InputField
                ref={passwordRef}
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (passwordError) setPasswordError('');
                }}
                type="password"
                error={passwordError}
                isPasswordVisible={showPassword}
                onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />
            </StaggeredChild>

            <StaggeredChild index={3}>
              <TouchableOpacity
                onPress={() => router.push(ROUTES.AUTH.FORGOT_PASSWORD)}
                className="self-end"
                accessibilityLabel="Forgot Password"
                accessibilityHint="Navigate to reset your password">
                <Text className="font-subtitle text-[13px] text-black/50">Forgot Password?</Text>
              </TouchableOpacity>
            </StaggeredChild>
          </View>

          <StaggeredChild index={4} delay={80} style={{ marginTop: 'auto' }}>
            <View className="pt-8">
              <Button title="Sign In" onPress={handleSignIn} loading={isPending} />

              <Button
                title="Sign In with Apple"
                variant="black"
                onPress={() => {
                  appleSignIn(undefined, {
                    onSuccess: (resp) => {
                      const onboardingStatus = resp.user?.onboardingStatus;
                      if (onboardingStatus === 'completed') {
                        router.replace(ROUTES.TABS as any);
                        return;
                      }
                      router.replace(ROUTES.AUTH.COMPLETE_PROFILE.PERSONAL_INFO as any);
                    },
                    onError: () => {
                      showError('Apple Sign-In Failed', 'Please try again or use email.');
                    },
                  });
                }}
                loading={isAppleLoading}
                className="mt-3"
              />

              <TouchableOpacity
                onPress={() => router.push(ROUTES.AUTH.SIGNUP as any)}
                className="mt-4"
                accessibilityLabel="Sign up"
                accessibilityHint="Navigate to registration">
                <Text className="text-center font-body text-[14px] text-black/60">
                  New to Rail? <Text className="font-subtitle text-black underline">Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </StaggeredChild>
        </View>
      </KeyboardAwareScrollView>
    </AuthGradient>
  );
}
