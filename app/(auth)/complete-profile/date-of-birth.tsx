import React, { useState } from 'react';
import { View, Text, StatusBar, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../../../components/ui';
import { InputField } from '@/components';
import { useAuthStore } from '@/stores';
import { Ionicons } from '@/components/atoms/SafeIonicons'; // Assuming this exists or standard Ionicons

export default function DateOfBirth() {
  const { registrationData, updateRegistrationData } = useAuthStore();
  const [dob, setDob] = useState<Date | null>(
    registrationData.dob ? new Date(registrationData.dob) : null
  );
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!dob) {
      setError('Date of birth is required');
      return;
    }

    // Age check (18+)
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    if (age < 18) {
      setError('You must be at least 18 years old');
      return;
    }

    updateRegistrationData({ dob: dob.toISOString().split('T')[0] });
    router.push('/(auth)/complete-profile/address');
  };

  const onChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios'); // Keep open on iOS if desired, or toggle
    if (selectedDate) {
      if (Platform.OS === 'android') {
        setShowPicker(false);
      }
      setDob(selectedDate);
      setError('');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View className="flex-1 px-6 pt-4">
        {/* Header with Back Button */}
        <View className="mb-8 mt-4">
          <Pressable onPress={() => router.back()} className="mb-4">
            <Ionicons name="arrow-back" size={24} color="black" />
          </Pressable>
          <Text className="font-display text-[60px] text-gray-900">Date of Birth</Text>
          <Text className="font-body-medium mt-2 text-[14px] text-gray-600">
            We need to verify your age
          </Text>
        </View>

        <View className="gap-y-4">
          {/* Custom Input Trigger for Date Picker */}
          <Pressable onPress={() => setShowPicker(true)}>
            <View pointerEvents="none">
              <InputField
                label="Date of Birth"
                placeholder="YYYY-MM-DD"
                value={dob ? dob.toISOString().split('T')[0] : ''}
                editable={false}
                error={error}
              />
            </View>
          </Pressable>

          {showPicker && (
            <DateTimePicker
              value={dob || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        <View className="mt-auto pb-4">
          <Button title="Next" onPress={handleNext} className="rounded-full font-body" />
        </View>
      </View>
    </SafeAreaView>
  );
}
