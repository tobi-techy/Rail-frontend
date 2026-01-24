import React, { useState } from 'react';
import { View, Text, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import { PhoneNumberInput } from '@/components';
import { useAuthStore } from '@/stores';
import { Ionicons } from '@/components/atoms/SafeIonicons';

export default function Phone() {
  const { registrationData, updateRegistrationData, updateUser } = useAuthStore();
  const [phone, setPhone] = useState(registrationData.phone);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    // Optional phone validation if needed, or if it's optional allow empty?
    // User request said "optional phone" in original conversation context,
    // but typically "complete profile" implies finalizing.
    // Let's assume it's optional as per original code `label="Phone (Optional)"`.

    setIsLoading(true);
    updateRegistrationData({ phone });

    // Simulate API call and Finalize
    setTimeout(() => {
      setIsLoading(false);
      // Commit data to user profile
      updateUser({
        fullName: `${registrationData.firstName} ${registrationData.lastName}`,
        // In a real app we'd map the rest of the data to the user object or make an API call
      });

      // Navigate to Create Passcode
      router.push('/(auth)/create-passcode');
    }, 1000);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View className="flex-1 px-6 pt-4">
        <Pressable onPress={() => router.back()} className="mb-4">
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
        <View className="mb-8">
          <Text className="font-display text-[60px] text-gray-900">Phone Number</Text>
          <Text className="font-body-medium mt-2 text-[14px] text-gray-600">
            Add a phone number (Optional)
          </Text>
        </View>

        <View className="gap-y-4">
          <PhoneNumberInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            error={error}
          />
        </View>

        <View className="mt-auto pb-4">
          <Button
            title="Complete Setup"
            onPress={handleComplete}
            loading={isLoading}
            className="rounded-full font-body"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
