import React, { useState } from 'react';
import { View, Text, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../../../components/ui';
import { AuthGradient, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';

const MIN_AGE = 18;

function getAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

// Max date = 18 years ago today (user must be at least 18)
const maxDate = new Date();
maxDate.setFullYear(maxDate.getFullYear() - MIN_AGE);

export default function DateOfBirth() {
  const registrationData = useAuthStore((state) => state.registrationData);
  const updateRegistrationData = useAuthStore((state) => state.updateRegistrationData);
  const { showWarning } = useFeedbackPopup();
  const initialDob = registrationData.dob ? new Date(registrationData.dob) : maxDate;
  const [dob, setDob] = useState<Date>(Number.isNaN(initialDob.getTime()) ? maxDate : initialDob);

  const handleNext = () => {
    if (getAge(dob) < MIN_AGE) {
      showWarning('Age Requirement', `You must be at least ${MIN_AGE} years old to use Rail.`);
      return;
    }
    updateRegistrationData({ dob: dob.toISOString() });
    router.push(ROUTES.AUTH.COMPLETE_PROFILE.ADDRESS as any);
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={Platform.OS === 'android'}
        />
        <View className="flex-1 px-6 pt-4">
          <StaggeredChild index={0}>
            <View className="mb-8 mt-4">
              <Text className="font-headline text-auth-title text-black">Date of Birth</Text>
              <Text className="mt-2 font-body text-caption text-black/60">
                You must be at least {MIN_AGE} to use Rail
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
                maximumDate={maxDate}
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
