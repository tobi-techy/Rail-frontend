import React, { useMemo } from 'react';
import { router } from 'expo-router';
import { View, Text, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { HeaderAction, ProgressDots } from './components';
import Passkey4Icon from '@/assets/Icons/passkey-4.svg';

const FaceIdIllustration = () => (
  <View className="relative h-28 w-28">
    <View className="h-20 w-20 rounded-[26px] bg-emerald-300" />
    <View className="absolute -left-2 bottom-0 h-16 w-16 rounded-full bg-emerald-500" />
    <View className="absolute right-0 top-0 h-24 w-[62px] rounded-[22px] bg-amber-400" />
    <View className="absolute right-4 top-4 h-[72px] w-[36px] rounded-[14px] bg-gray-900" />
  </View>
);

export default function EnableFaceIdScreen() {
  const next = () => router.push('/(auth)/onboarding/enable-notifications');
  const biometricLabel = useMemo(() => {
    if (Platform.OS === 'android') {
      return 'Enable biometrics';
    }
    return 'Enable Face ID';
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View className="flex-1 px-6 pb-8">
        <View className="mt-2 flex-row items-center justify-between">
          <HeaderAction icon="x" accessibilityLabel="Close onboarding" onPress={() => router.back()} />
        </View>

        <View className="mt-14">
          <Passkey4Icon width={100} height={150} />
          <View className="mt-8">
            <Text className="font-heading text-[32px] text-gray-900">{biometricLabel}</Text>
            <Text className="mt-4 font-body text-base leading-6 text-gray-600">
              Face ID keeps your account secure and unlocks instant access without needing to type
              your password every time.
            </Text>
          </View>
        </View>

        <View className="mt-12 rounded-3xl border border-gray-100 bg-gray-50 p-5">
          <Text className="font-body-semibold text-base text-gray-900">Here&apos;s why it matters</Text>
          <View className="mt-4 gap-y-3">
            {[
              'Instant sign-in with built-in biometrics',
              'Strong protection against fraud',
              'Manage this preference anytime in settings',
            ].map((item) => (
              <View key={item} className="flex-row items-start">
                <View className="mr-3 mt-[7px] h-1.5 w-1.5 rounded-full bg-gray-400" />
                <Text className="flex-1 font-body text-sm text-gray-600">{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="flex-1" />

        <View className="gap-y-4">
          <Button title="Enable" onPress={next} accessibilityRole="button" />
          <TouchableOpacity onPress={next} accessibilityRole="button">
            <Text className="text-center font-body text-base text-blue-600">Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
