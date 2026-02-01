import React, { useState } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../../../components/ui';
import { AuthGradient, StaggeredChild } from '@/components';
import { useAuthStore } from '@/stores';

export default function DateOfBirth() {
  const { registrationData, updateRegistrationData } = useAuthStore();
  const [dob, setDob] = useState<Date>(
    registrationData.dob ? new Date(registrationData.dob) : new Date()
  );
  const [error, setError] = useState('');

  const handleNext = () => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 18) {
      setError('You must be at least 18 years old');
      return;
    }

    updateRegistrationData({ dob: dob.toISOString().split('T')[0] });
    router.push('/(auth)/complete-profile/address');
  };

  const onChange = (_: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDob(selectedDate);
      setError('');
    }
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar barStyle="light-content" />
        <View className="flex-1 px-6 pt-4">
          <StaggeredChild index={0}>
            <View className="mb-8 mt-4">
              <Text className="font-display text-[60px] text-white">Date of Birth</Text>
              <Text className="font-body-medium mt-2 text-[14px] text-white/70">
                We need to verify your age
              </Text>
            </View>
          </StaggeredChild>

          <StaggeredChild index={1}>
            <View className="gap-y-4 mt-28">
              <View className="rounded-xl bg-black overflow-hidden">
                <DateTimePicker
                  value={dob || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={onChange}
                  maximumDate={new Date()}
                  themeVariant="dark"
                />
              </View>
              {error && <Text className="text-white text-sm">{error}</Text>}
            </View>
          </StaggeredChild>

          <StaggeredChild index={2} delay={80} style={{ marginTop: 'auto' }}>
            <View className="pb-4">
              <Button title="Next" onPress={handleNext} variant="black" />
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
