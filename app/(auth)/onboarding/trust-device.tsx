import React from 'react';
import { router } from 'expo-router';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { HeaderAction, ProgressDots } from './components';
import { Feather } from '@expo/vector-icons';

export default function TrustDeviceScreen() {
  const goToNext = () => router.push('/(auth)/onboarding/enable-faceid');

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View className="flex-1 px-6 pb-8">
        <View className="mt-2 flex-row items-center justify-between">
          <HeaderAction
            icon="x"
            accessibilityLabel="Close onboarding"
            onPress={() => router.replace('/(tabs)')}
          />
          <HeaderAction
            icon="help-circle"
            accessibilityLabel="Learn more about trusted devices"
            onPress={() => {}}
          />
        </View>

        <View className="mt-16">
          <Text className="font-heading text-[34px] text-gray-900">Trust this device?</Text>
          <Text className="mt-4 font-body text-base leading-6 text-gray-600">
            We won&apos;t ask to verify your identity again if this device is trusted. Choose
            &apos;Always trust&apos; only on personal devices you control.
          </Text>
        </View>

        <View className="mt-12 rounded-3xl border border-gray-100 bg-gray-50 p-5">
          <View className="mb-4 flex-row items-center gap-x-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-900/90">
              <Feather name="shield" size={20} color="#fff" />
            </View>
            <Text className="font-body-semibold text-base text-gray-900">Extra secure by design</Text>
          </View>
          <Text className="font-body text-sm leading-6 text-gray-600">
            We encrypt device details and only trust it after successful identity confirmation. You
            can manage trusted devices anytime in your security settings.
          </Text>
        </View>

        <View className="flex-1" />

        <View className="gap-y-4">
          <Button title="Always trust" onPress={goToNext} accessibilityRole="button" />
          <TouchableOpacity onPress={goToNext} accessibilityRole="button">
            <Text className="text-center font-body text-base text-blue-600">Trust once</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
