import React, { useState } from 'react';
import { View, Text, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import { InputField, AuthGradient, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { personalInfoSchema, fieldError } from '@/utils/schemas';

export default function PersonalInfo() {
  const registrationData = useAuthStore((state) => state.registrationData);
  const updateRegistrationData = useAuthStore((state) => state.updateRegistrationData);
  const [firstName, setFirstName] = useState(registrationData.firstName || '');
  const [lastName, setLastName] = useState(registrationData.lastName || '');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const { showWarning } = useFeedbackPopup();

  const handleNext = () => {
    const result = personalInfoSchema.safeParse({ firstName, lastName });
    if (!result.success) {
      setFirstNameError(fieldError(result.error, 'firstName'));
      setLastNameError(fieldError(result.error, 'lastName'));
      const first = result.error.issues[0]?.message ?? 'Please check your input.';
      showWarning('Invalid Input', first);
      return;
    }

    setFirstNameError('');
    setLastNameError('');
    updateRegistrationData({
      firstName: result.data.firstName,
      lastName: result.data.lastName,
    });
    router.push(ROUTES.AUTH.COMPLETE_PROFILE.CREATE_PASSWORD as never);
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
              <Text className="font-headline-2 text-auth-title leading-[1.1] text-black">
                Personal Info
              </Text>
              <Text className="mt-2 font-body text-caption text-black/60">
                Enter your legal name exactly as it appears on your ID document.
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
              <Button title="Next" onPress={handleNext} variant="orange" />
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
