import React, { useState } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import { PhoneNumberInput, AuthGradient, StaggeredChild } from '@/components';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';

export default function Phone() {
  const registrationData = useAuthStore((state) => state.registrationData);
  const updateRegistrationData = useAuthStore((state) => state.updateRegistrationData);
  const [phone, setPhone] = useState(registrationData.phone || '');

  const handleNext = () => {
    updateRegistrationData({ phone: phone.trim() });
    router.push(ROUTES.AUTH.COMPLETE_PROFILE.CREATE_PASSWORD as any);
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View className="flex-1 px-6 pt-4">
          <StaggeredChild index={0}>
            <View className="mb-8 mt-4">
              <Text className="font-subtitle text-[50px] text-black">Phone Number</Text>
              <Text className="font-body mt-2 text-[14px] text-black/60">
                Add a phone number (Optional)
              </Text>
            </View>
          </StaggeredChild>

          <StaggeredChild index={1}>
            <PhoneNumberInput label="Phone Number" value={phone} onChangeText={setPhone} />
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
