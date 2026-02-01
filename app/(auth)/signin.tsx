import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { AuthGradient, InputField } from '@/components';
import { useLogin } from '@/api/hooks';
import { useAuthStore } from '@/stores/authStore';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const passwordRef = useRef<TextInput>(null);

  const { mutate: login, isPending: isLoading } = useLogin();

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = () => {
    if (!validateForm()) return;
    login(
      { email: formData.email, password: formData.password },
      {
        onSuccess: () => router.replace('/(tabs)'),
        onError: (err: any) => {
          const msg = err?.error?.message || 'Invalid email or password';
          if (msg.toLowerCase().includes('verif')) {
            useAuthStore.setState({ pendingVerificationEmail: formData.email });
            router.push('/(auth)/verify-email');
            return;
          }
          setErrors({ password: msg });
        },
      }
    );
  };

  return (
    <AuthGradient>
      <StatusBar barStyle="light-content" />
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 20,
        }}
        keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6">
          <View className="mb-10">
            <Text className="font-display text-[60px] leading-[1.1] text-white">Welcome Back</Text>
            <Text className="mt-2 font-body text-body text-white/70">Sign in to continue</Text>
          </View>

          <View className="gap-y-2">
            <InputField
              label="Email"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(v) => updateField('email', v)}
              error={errors.email}
              type="email"
              variant="dark"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              editable={!isLoading}
            />

            <InputField
              ref={passwordRef}
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={(v) => updateField('password', v)}
              error={errors.password}
              type="password"
              variant="dark"
              isPasswordVisible={showPassword}
              onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              editable={!isLoading}
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              className="self-end">
              <Text className="font-subtitle text-[13px] text-white/60">Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-auto pt-8">
            <Button title="Sign In" onPress={handleSignIn} loading={isLoading} variant="black" />
            <TouchableOpacity onPress={() => router.push('/(auth)')} className="mt-4">
              <Text className="text-center font-body text-[14px] text-white/70">
                New to Rail? <Text className="font-subtitle text-white underline">Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </AuthGradient>
  );
}
