import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Button } from '../../components/ui';
import { InputField, AuthGradient, StaggeredChild } from '@/components';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    router.back();
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
            <StaggeredChild index={0}>
              <View className="mb-8 mt-4">
                <Text className="font-display text-[60px] text-white">Forgot password</Text>
                <Text className="font-body-medium mt-2 text-base text-white/70">
                  Enter the email associated with your account and we will send you instructions to
                  reset your password.
                </Text>
              </View>
            </StaggeredChild>

            <StaggeredChild index={1}>
              <InputField
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                type="email"
                variant="dark"
              />
            </StaggeredChild>

            <StaggeredChild index={2} delay={80} style={{ marginTop: 'auto' }}>
              <View className="pt-8">
                <Button title="Send reset link" onPress={handleSubmit} variant="black" />
                <View className="mt-8 flex-row items-center justify-center">
                  <Text className="font-body-medium text-[14px] text-white/70">Remember it?</Text>
                  <TouchableOpacity
                    onPress={() => router.replace('/(auth)/signin')}
                    className="ml-2">
                    <Text className="font-body-medium text-[14px] text-white underline">
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
