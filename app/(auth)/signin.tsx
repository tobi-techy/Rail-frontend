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
import { Input, Button } from '../../components/ui';
import { InputField } from '@/components';
import { useLogin } from '@/api/hooks';
import { useAuthStore } from '@/stores/authStore';

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { mutate: login, isPending: isLoading } = useLogin();

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = () => {
    if (!validateForm()) return;

    login(
      {
        email: formData.email,
        password: formData.password,
      },
      {
        onSuccess: (response) => {
          // Check if user already has a passcode or needs to create one
          const hasPasscode = response.user?.hasPasscode;
          const onboardingStatus = response.user?.onboardingStatus;
          
          if (hasPasscode) {
            // Returning user with passcode - go to login-passcode screen
            router.replace('/(auth)/login-passcode');
          } else if (onboardingStatus === 'completed') {
            // User completed onboarding but no passcode - direct to home
            router.replace('/(tabs)');
          } else {
            // New user or incomplete onboarding - navigate to create passcode
            router.replace('/(auth)/create-passcode');
          }
        },
        onError: (error: any) => {
          console.error('Login error:', error);
          
          // Handle specific error codes
          const errorCode = error?.error?.code;
          const errorMessage = error?.error?.message;
          
          let displayMessage = 'Invalid email or password';
          
          switch (errorCode) {
            case 'INVALID_CREDENTIALS':
              displayMessage = 'Invalid email or password. Please try again.';
              break;
            case 'ACCOUNT_INACTIVE':
              displayMessage = 'Your account is inactive. Please contact support.';
              break;
            case 'UNAUTHORIZED':
              // Check if email needs verification
              if (errorMessage?.toLowerCase().includes('verif')) {
                useAuthStore.setState({ pendingVerificationEmail: formData.email });
                router.push('/(auth)/verify-email');
                return;
              }
              displayMessage = errorMessage || displayMessage;
              break;
            case 'VALIDATION_ERROR':
              displayMessage = 'Please check your email and password.';
              break;
            default:
              displayMessage = errorMessage || displayMessage;
          }
          
          setErrors({
            password: displayMessage,
          });
        },
      }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={40}>
          {/* Content */}
          <View className="flex-1 px-6 pb-6">
            {/* Title */}
            <View className="mb-8 mt-4">
              <Text className="font-body-bold text-[40px] text-gray-900">Welcome Back</Text>
              <Text className="mt-2 font-body-medium text-base text-gray-600">
                Sign in to continue your investment journey
              </Text>
            </View>

            {/* Form */}
            <View className="gap-y-4">
              <InputField
                required
                label="Email Address"
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(value: string) => updateField('email', value)}
                error={errors.email}
                // leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
              />

              <InputField
                required
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={(value: string) => updateField('password', value)}
                error={errors.password}
                // leftIcon="lock-closed-outline"
                // rightIcon={showPassword ? 'eye-outline' : 'eye-off-outline'}
                // onRightIconPress={() => setShowPassword(!showPassword)}
                secureTextEntry={!showPassword}
                textContentType="password"
              />
            </View>

            {/* Forgot Password & Passcode Login */}
            <View className="mt-4 flex-row justify-end">
              
              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                className="self-end">
                <Text className="font-body text-[14px] font-bold text-blue-600">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <View className="absolute bottom-0 left-0 right-0 mx-[24px]">
              <Button
                title="Sign in"
                onPress={handleSignIn}
                loading={isLoading}
                className="rounded-full"
              />

              <TouchableOpacity onPress={() => router.push('/(auth)')} className="mt-4 self-center">
                <Text className="text-center font-sf-pro-medium text-[14px] text-gray-900">
                  New to Stacks? Sign up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
