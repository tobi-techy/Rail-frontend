import React, { useState } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../../../components/ui';
import { AuthGradient, StaggeredChild } from '@/components';

export default function DateOfBirth() {
  const [dob, setDob] = useState<Date>(new Date());

  const handleNext = () => {
    router.push('/(auth)/complete-profile/address');
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
            <View className="mt-28 overflow-hidden rounded-xl bg-black">
              <DateTimePicker
                value={dob}
                mode="date"
                display="spinner"
                onChange={(_, date) => date && setDob(date)}
                maximumDate={new Date()}
                themeVariant="dark"
              />
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
