import React, { useState } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import { PhoneNumberInput, AuthGradient, StaggeredChild } from '@/components';
import { useAuthStore } from '@/stores';

export default function Phone() {
  const { registrationData, updateRegistrationData, updateUser } = useAuthStore();
  const [phone, setPhone] = useState(registrationData.phone);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    setIsLoading(true);
    updateRegistrationData({ phone });

    setTimeout(() => {
      setIsLoading(false);
      updateUser({
        fullName: `${registrationData.firstName} ${registrationData.lastName}`,
      });
      router.push('/(auth)/create-passcode');
    }, 1000);
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar barStyle="light-content" />
        <View className="flex-1 px-6 pt-4">
          <StaggeredChild index={0}>
            <View className="mb-8 mt-4">
              <Text className="font-display text-[60px] text-white">Phone Number</Text>
              <Text className="font-body-medium mt-2 text-[14px] text-white/70">
                Add a phone number (Optional)
              </Text>
            </View>
          </StaggeredChild>

          <StaggeredChild index={1}>
            <PhoneNumberInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              error={error}
              variant="dark"
            />
          </StaggeredChild>

          <StaggeredChild index={2} delay={80} style={{ marginTop: 'auto' }}>
            <View className="pb-4">
              <Button
                title="Complete Setup"
                onPress={handleComplete}
                loading={isLoading}
                variant="black"
              />
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
