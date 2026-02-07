import React, { useState } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../../../components/ui';
import { AuthGradient, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';

export default function DateOfBirth() {
  const registrationData = useAuthStore((state) => state.registrationData);
  const updateRegistrationData = useAuthStore((state) => state.updateRegistrationData);
  const initialDob = registrationData.dob ? new Date(registrationData.dob) : new Date();
  const [dob, setDob] = useState<Date>(
    Number.isNaN(initialDob.getTime()) ? new Date() : initialDob
  );

  const handleNext = () => {
    updateRegistrationData({ dob: dob.toISOString() });
    router.push(ROUTES.AUTH.COMPLETE_PROFILE.ADDRESS as any);
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View className="flex-1 px-6 pt-4">
          <StaggeredChild index={0}>
            <View className="mb-8 mt-4">
              <Text className="font-display text-[60px] text-black">Date of Birth</Text>
              <Text className="font-body-medium mt-2 text-[14px] text-black/60">
                We need to verify your age
              </Text>
            </View>
          </StaggeredChild>

          <StaggeredChild index={1}>
            <View className="mt-28">
              <DateTimePicker
                value={dob}
                mode="date"
                display="spinner"
                onChange={(_, date) => date && setDob(date)}
                maximumDate={new Date()}
                themeVariant="light"
              />
            </View>
          </StaggeredChild>

          <StaggeredChild index={2} delay={80} style={{ marginTop: 'auto' }}>
            <View className="pb-4">
              <Button title="Next" onPress={handleNext} />
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
