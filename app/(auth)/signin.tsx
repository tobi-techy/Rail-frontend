import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import { Button } from '@/components/ui';
import { AuthGradient, InputField, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const handleSignIn = () => {
    router.replace(ROUTES.TABS as any);
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
          <StaggeredChild index={0}>
            <View className="mb-10">
              <Text className="font-display text-[60px] leading-[1.1] text-white">Welcome Back</Text>
              <Text className="mt-2 font-body text-body text-white/70">Sign in to continue</Text>
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
                variant="dark"
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
                variant="dark"
                isPasswordVisible={showPassword}
                onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />
            </StaggeredChild>

            <StaggeredChild index={3}>
              <TouchableOpacity
                onPress={() => router.push(ROUTES.AUTH.FORGOT_PASSWORD as any)}
                className="self-end">
                <Text className="font-subtitle text-[13px] text-white/60">Forgot Password?</Text>
              </TouchableOpacity>
            </StaggeredChild>
          </View>

          <StaggeredChild index={4} delay={80} style={{ marginTop: 'auto' }}>
            <View className="pt-8">
              <Button title="Sign In" onPress={handleSignIn} variant="black" />
              <TouchableOpacity onPress={() => router.push(ROUTES.AUTH.INDEX as any)} className="mt-4">
                <Text className="text-center font-body text-[14px] text-white/70">
                  New to Rail? <Text className="font-subtitle text-white underline">Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </StaggeredChild>
        </View>
      </KeyboardAwareScrollView>
    </AuthGradient>
  );
}
