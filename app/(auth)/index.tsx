import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { AuthGradient, InputField } from '@/components';
import { useRegister } from '@/api/hooks';
import { useAuthStore } from '@/stores';

export default function SignUp() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const { mutate: register, isPending: isLoading } = useRegister();
  const setPendingEmail = useAuthStore((state) => state.setPendingEmail);

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    return true;
  };

  const handleSignUp = () => {
    if (!validateForm()) return;
    register(
      { email, password: '' },
      {
        onSuccess: (res) => {
          setPendingEmail(res.identifier || email);
          router.push('/(auth)/verify-email');
        },
        onError: (err: any) => {
          const msg =
            err?.error?.code === 'USER_EXISTS'
              ? 'Account already exists'
              : err?.error?.message || 'Failed to create account';
          setError(msg);
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
            <Text className="font-display text-[60px] leading-[1.1] text-white">
              Enter your email
            </Text>
            <Text className="mt-2 font-body text-body text-white/70">
              Sign up to start your journey
            </Text>
          </View>

          <InputField
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (error) setError('');
            }}
            error={error}
            type="email"
            variant="dark"
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
            editable={!isLoading}
          />

          <View className="mt-auto pt-8">
            <Text className="mb-5 text-center font-caption text-[12px] text-white/60">
              By signing up, you agree to our Terms & Privacy Policy
            </Text>
            <Button title="Continue" onPress={handleSignUp} loading={isLoading} variant="black" />
            <TouchableOpacity onPress={() => router.push('/(auth)/signin')} className="mt-4">
              <Text className="text-center font-body text-[14px] text-white/70">
                Already have an account?{' '}
                <Text className="font-subtitle text-white underline">Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </AuthGradient>
  );
}
