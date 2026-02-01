import React, { useState } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import { InputField, AuthGradient, StaggeredChild } from '@/components';
import { useAuthStore } from '@/stores';

export default function PersonalInfo() {
  const { registrationData, updateRegistrationData } = useAuthStore();
  const [firstName, setFirstName] = useState(registrationData.firstName);
  const [lastName, setLastName] = useState(registrationData.lastName);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});

  const handleNext = () => {
    const newErrors: { firstName?: string; lastName?: string } = {};
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateRegistrationData({ firstName, lastName });
    router.push('/(auth)/complete-profile/date-of-birth');
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar barStyle="light-content" />
        <View className="flex-1 px-6 pt-4">
          <StaggeredChild index={0}>
            <View className="mb-8 mt-4">
              <Text className="font-display text-[60px] text-white">Personal Info</Text>
              <Text className="font-body-medium mt-2 text-[14px] text-white/70">
                Let&apos;s start with your name
              </Text>
            </View>
          </StaggeredChild>

          <View className="gap-y-4">
            <StaggeredChild index={1}>
              <InputField
                required
                label="First Name"
                placeholder="First Name"
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
                }}
                error={errors.firstName}
                variant="dark"
              />
            </StaggeredChild>
            <StaggeredChild index={2}>
              <InputField
                required
                label="Last Name"
                placeholder="Last Name"
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
                }}
                error={errors.lastName}
                variant="dark"
              />
            </StaggeredChild>
          </View>

          <StaggeredChild index={3} delay={80} style={{ marginTop: 'auto' }}>
            <View className="pb-4">
              <Button title="Next" onPress={handleNext} variant="black" />
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
