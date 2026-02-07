import React, { useState } from 'react';
import { View, Text, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import { InputField, AuthGradient, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';

export default function CreatePassword() {
  const registrationData = useAuthStore((state) => state.registrationData);
  const updateRegistrationData = useAuthStore((state) => state.updateRegistrationData);
  const [password, setPassword] = useState(registrationData.password || '');
  const [confirmPassword, setConfirmPassword] = useState(registrationData.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleNext = () => {
    if (password.length < 12) {
      Alert.alert('Weak Password', 'Password must be at least 12 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    updateRegistrationData({ password });
    router.push(ROUTES.AUTH.COMPLETE_PROFILE.INVESTMENT_GOAL as any);
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View className="flex-1 px-6 pt-4">
          <StaggeredChild index={0}>
            <View className="mb-8 mt-4">
              <Text className="font-display text-[60px] text-black">Create Password</Text>
              <Text className="font-body-medium mt-2 text-[14px] text-black/60">
                Secure your account
              </Text>
            </View>
          </StaggeredChild>

          <View className="gap-y-2">
            <StaggeredChild index={1}>
              <InputField
                label="Password"
                placeholder="Min 12 characters"
                value={password}
                onChangeText={setPassword}
                type="password"
                isPasswordVisible={showPassword}
                onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
              />
            </StaggeredChild>

            <StaggeredChild index={2}>
              <InputField
                label="Confirm Password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                type="password"
                isPasswordVisible={showConfirm}
                onTogglePasswordVisibility={() => setShowConfirm(!showConfirm)}
              />
            </StaggeredChild>
          </View>

          <StaggeredChild index={3} delay={80} style={{ marginTop: 'auto' }}>
            <View className="pb-4">
              <Button title="Next" onPress={handleNext} />
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
