import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { AuthGradient, InputField, StaggeredChild } from '@/components';
import { ROUTES, type AuthRoute } from '@/constants/routes';
import { useLogin } from '@/api/hooks/useAuth';

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
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const { mutate: login, isPending } = useLogin();

  const handleSignIn = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!isValidPassword(password)) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    login(
      { email: email.trim().toLowerCase(), password },
      {
        onSuccess: (response) => {
          const onboardingStatus = response.user?.onboardingStatus;

          if (onboardingStatus === 'completed') {
            router.replace(ROUTES.TABS as any);
            return;
          }

          router.replace(ROUTES.AUTH.COMPLETE_PROFILE.PERSONAL_INFO as any);
        },
        onError: (error: any) => {
          const message = error?.message || 'Invalid credentials';
          Alert.alert('Sign In Failed', message);
        },
      }
    );
  };

  return (
    <AuthGradient>
      <StatusBar barStyle="dark-content" />
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
              <Text className="font-display text-[60px] leading-[1.1] text-black">
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
                onChangeText={setEmail}
                type="email"
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
                onChangeText={setPassword}
                type="password"
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
              <TouchableOpacity
                onPress={() => router.push(ROUTES.AUTH.INDEX)}
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
