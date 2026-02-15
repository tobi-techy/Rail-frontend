import React, { useState } from 'react';
import { View, Text, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import { InputField, AuthGradient, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';

export default function PersonalInfo() {
  const registrationData = useAuthStore((state) => state.registrationData);
  const updateRegistrationData = useAuthStore((state) => state.updateRegistrationData);
  const [firstName, setFirstName] = useState(registrationData.firstName || '');
  const [lastName, setLastName] = useState(registrationData.lastName || '');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const { showWarning } = useFeedbackPopup();

  const handleNext = () => {
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();

    if (!normalizedFirstName || !normalizedLastName) {
      if (!normalizedFirstName) setFirstNameError('First name is required');
      if (!normalizedLastName) setLastNameError('Last name is required');
      showWarning('Missing Information', 'Please enter your first and last name.');
      return;
    }

    setFirstNameError('');
    setLastNameError('');
    updateRegistrationData({
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
    });
    router.push(ROUTES.AUTH.COMPLETE_PROFILE.DATE_OF_BIRTH as any);
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
              <Text className="font-subtitle text-[50px] text-black">Personal Info</Text>
              <Text className="mt-2 font-body text-[14px] text-black/60">
                Let&apos;s start with your name
              </Text>
            </View>
          </StaggeredChild>

          <View className="gap-y-4">
            <StaggeredChild index={1}>
              <InputField
                label="First Name"
                placeholder="First Name"
                value={firstName}
                onChangeText={(value) => {
                  setFirstName(value);
                  if (firstNameError) setFirstNameError('');
                }}
                error={firstNameError}
              />
            </StaggeredChild>
            <StaggeredChild index={2}>
              <InputField
                label="Last Name"
                placeholder="Last Name"
                value={lastName}
                onChangeText={(value) => {
                  setLastName(value);
                  if (lastNameError) setLastNameError('');
                }}
                error={lastNameError}
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
