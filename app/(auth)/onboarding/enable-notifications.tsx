import React from 'react';
import { router } from 'expo-router';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { HeaderAction, ProgressDots, TOTAL_ONBOARDING_STEPS } from './components';
import Public from '@/assets/Icons/public.svg';
import { useAuthStore } from '@/stores/authStore';

const NotificationIllustration = () => (
  <View className="relative h-28 w-28">
    <View className="absolute bottom-0 left-6 h-10 w-10 rounded-full bg-black/90" />
    <View className="absolute left-0 top-[22px] h-16 w-16 rounded-3xl bg-amber-400" />
    <View className="absolute right-2 top-0 h-8 w-8 items-center justify-center rounded-full bg-red-500">
      <Text className="font-body-semibold text-white">!</Text>
    </View>
  </View>
);

export default function EnableNotificationsScreen() {
  const setHasCompletedOnboarding = useAuthStore((state) => state.setHasCompletedOnboarding);
  
  const finish = () => {
    // Mark onboarding as complete
    setHasCompletedOnboarding(true);
    
    // Update user's onboarding status
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      useAuthStore.setState({
        user: { ...currentUser, onboardingStatus: 'completed' },
        onboardingStatus: 'completed',
      });
    }
    
    // Navigate to main app
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View className="flex-1 px-6 pb-8">
        <View className="mt-2 flex-row items-center justify-between">
          <HeaderAction icon="x" accessibilityLabel="Close onboarding" onPress={() => router.back()} />
        </View>

        <View className="mt-14">
         <Public width={100} height={150} />
          <View className="mt-8">
            <Text className="font-heading text-[32px] text-gray-900">Enable Notifications</Text>
            <Text className="mt-4 font-body text-base leading-6 text-gray-600">
              Get transaction alerts, investment milestones, and account reminders the moment they
              happen so you never miss a beat.
            </Text>
          </View>
        </View>

        <View className="mt-12 rounded-3xl border border-gray-100 bg-gray-50 p-5">
          <Text className="font-body-semibold text-base text-gray-900">
            What you&apos;ll be notified about
          </Text>
          <View className="mt-4 gap-y-3">
            {[
              'Purchases and card activity',
              'Rewards earned in real time',
              'Payment reminders and security alerts',
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
          <Button title="Enable" onPress={finish} accessibilityRole="button" />
          <TouchableOpacity onPress={finish} accessibilityRole="button">
            <Text className="text-center font-body text-base text-blue-600">Maybe later</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}
