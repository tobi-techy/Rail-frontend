import React, { useState } from 'react';
import { View, Text, StatusBar, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../../../components/ui';
import { AuthGradient, StaggeredChild } from '@/components';
import { OnboardingWizardHeader } from '@/components/onboarding/OnboardingWizardHeader';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { useHaptics } from '@/hooks/useHaptics';

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
  const setOnboardingStatus = useAuthStore((state) => state.setOnboardingStatus);
  const { showWarning } = useFeedbackPopup();
  const { selection } = useHaptics();
  const initialDob = registrationData.dob ? new Date(registrationData.dob) : maxDate;
  const [dob, setDob] = useState<Date>(Number.isNaN(initialDob.getTime()) ? maxDate : initialDob);
  const [showPicker, setShowPicker] = useState(false);

  const handleNext = () => {
    if (getAge(dob) < MIN_AGE) {
      showWarning('Age Requirement', `You must be at least ${MIN_AGE} years old to use Rail.`);
      return;
    }
    updateRegistrationData({ dob: dob.toISOString() });
    setOnboardingStatus('basic_complete', 'kyc_address');
    router.push(ROUTES.AUTH.COMPLETE_KYC.ADDRESS as never);
  };

  const onChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      setDob(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
          <OnboardingWizardHeader step={2} total={4} />
          <StaggeredChild index={0}>
            <View className="mb-8">
              <Text
                className="font-headline-2 text-auth-title leading-[1.1] text-charcoal-primary"
                maxFontSizeMultiplier={1.3}>
                Date of Birth
              </Text>
              <Text className="mt-2 font-body text-caption text-ash" maxFontSizeMultiplier={1.4}>
                Enter the date of birth shown on your ID. You must be at least {MIN_AGE} to use
                Rail.
              </Text>
              <Text className="mt-8 font-body text-caption text-ash" maxFontSizeMultiplier={1.4}>
                Select your date of birth
              </Text>
              <Pressable
                onPress={() => {
                  selection();
                  setShowPicker(true);
                }}
                className="mt-2 h-14 w-full flex-row items-center rounded-lg border border-fog bg-warm-canvas px-4"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}>
                <Text
                  className="flex-1 font-body text-lg text-charcoal-primary"
                  maxFontSizeMultiplier={1.4}>
                  {formatDate(dob)}
                </Text>
                <Text className="text-smoke" maxFontSizeMultiplier={1.3}>
                  Date
                </Text>
              </Pressable>
            </View>
          </StaggeredChild>

          <StaggeredChild index={1}>
            <View className="mt-28">
              {showPicker && (
                <DateTimePicker
                  value={dob}
                  mode="date"
                  textColor="text-charcoal-primary"
                  accentColor="#ff3e00"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChange}
                  maximumDate={maxDate}
                  themeVariant="light"
                />
              )}

              {/* iOS only: Show "Done" button since we're using spinner mode */}
              {showPicker && Platform.OS === 'ios' && (
                <Button title="Confirm" onPress={() => setShowPicker(false)} variant="ghost" />
              )}
            </View>
          </StaggeredChild>

          <StaggeredChild index={2} delay={80} style={{ marginTop: 'auto' }}>
            <View className="pb-4">
              <Button title="Next" onPress={handleNext} variant="orange" />
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
