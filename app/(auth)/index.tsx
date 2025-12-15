import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Keyboard, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../components/ui';
import { InputField } from '@/components';
import { useRegister } from '@/api/hooks';
import { useAuthStore } from '@/stores';

const scrollViewContentStyle = { paddingBottom: 120 };

export default function SignUp() {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate: register, isPending: isLoading } = useRegister();
  const setPendingEmail = useAuthStore((state) => state.setPendingEmail);

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

    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number (E.164 format)';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    register(
      {
        email: formData.email,
        password: formData.password,
        // Phone is optional and might need backend support, passing it if your backend supports it
        // phone: formData.phone
      },
      {
        onSuccess: (response) => {
          // Store pending email/identifier for verification
          setPendingEmail(response.identifier || formData.email);
          // Navigate to verify email screen
          router.push('/(auth)/verify-email');
        },
        onError: (error: any) => {
          console.error('Registration error:', error);

          // Handle specific error codes
          const errorCode = error?.error?.code;
          const errorMessage = error?.error?.message;

          let displayMessage = 'Failed to create account. Please try again.';

          switch (errorCode) {
            case 'USER_EXISTS':
              displayMessage = 'An account with this email already exists. Please sign in.';
              break;
            case 'VALIDATION_ERROR':
              displayMessage = errorMessage || 'Please check your email and password.';
              break;
            case 'VERIFICATION_SEND_FAILED':
              displayMessage = 'Failed to send verification code. Please try again.';
              break;
            default:
              displayMessage = errorMessage || displayMessage;
          }

          setErrors({
            email: displayMessage,
          });
        },
      }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={scrollViewContentStyle}
        showsVerticalScrollIndicator={false}>
        {/* Content */}
        <View className="px-6 pt-4">
          {/* Title */}
          <View className="mb-8 mt-4">
            <Text className="font-display text-[60px] text-gray-900">Create Account</Text>
            <Text className="mt-2 font-body-medium text-[14px] text-gray-600">
              Sign up to start your journey
            </Text>
          </View>

          {/* Form */}
          <View className="gap-y-4">
            <InputField
              required
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
              returnKeyType="next"
              editable={!isLoading}
              className="text-[14px]"
            />

            <InputField
              required
              type="password"
              label="Password"
              placeholder="Create a strong password"
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              error={errors.password}
              isPasswordVisible={showPassword}
              onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
              returnKeyType="next"
            />

            <InputField
              required
              type="password"
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              error={errors.confirmPassword}
              isPasswordVisible={showConfirmPassword}
              onTogglePasswordVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
              returnKeyType="done"
              onSubmitEditing={() => {
                Keyboard.dismiss();
                handleSignUp();
              }}
            />
          </View>

          <View className="mt-[200px]">
            {/* Terms */}
            <View className="mb-6">
              <Text className="text-center font-label text-sm text-gray-500">
                By creating an account, you agree to our{' '}
                <Text className="text-gray-900 underline">Terms of Service</Text> and{' '}
                <Text className="text-gray-900 underline">Privacy Policy</Text>
              </Text>
            </View>

            {/* Sign Up Button */}
            <View className="gap-y-2 pb-4">
              <Button
                title="Continue"
                onPress={handleSignUp}
                loading={isLoading}
                className="rounded-full font-body"
              />
              <TouchableOpacity onPress={() => router.push('/(auth)/signin')}>
                <Text className="text-center font-body-medium text-[14px] text-gray-900">
                  Already a Rail user? Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
