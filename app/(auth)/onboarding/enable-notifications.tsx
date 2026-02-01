import React from 'react';
import { router } from 'expo-router';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { AuthGradient } from '@/components';
import { HeaderAction } from './components';
import Public from '@/assets/Icons/public.svg';
import { useAuthStore } from '@/stores/authStore';

export default function EnableNotificationsScreen() {
  const setHasCompletedOnboarding = useAuthStore((state) => state.setHasCompletedOnboarding);

  const finish = () => {
    setHasCompletedOnboarding(true);
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      useAuthStore.setState({
        user: { ...currentUser, onboardingStatus: 'completed' },
        onboardingStatus: 'completed',
      });
    }
    router.replace('/(tabs)');
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1">
        <StatusBar barStyle="light-content" />
        <View className="flex-1 px-6 pb-8">
          <View className="mt-2 flex-row items-center justify-between">
            <HeaderAction icon="x" accessibilityLabel="Close onboarding" onPress={() => router.back()} variant="dark" />
          </View>

          <View className="mt-14">
            <Public width={200} height={250} fill="#fff" />
            <View className="mt-8">
              <Text className="font-heading text-[32px] text-white">Enable Notifications</Text>
              <Text className="mt-4 font-body text-base leading-6 text-white/70">
                Get transaction alerts, investment milestones, and account reminders the moment they
                happen so you never miss a beat.
              </Text>
            </View>
          </View>

          {/*<View className="mt-12 rounded-3xl border border-white/10 bg-white/10 p-5">
            <Text className="font-body-semibold text-base text-white">
              What you&apos;ll be notified about
            </Text>
            <View className="mt-4 gap-y-3">
              {[
                'Purchases and card activity',
                'Rewards earned in real time',
                'Payment reminders and security alerts',
              ].map((item) => (
                <View key={item} className="flex-row items-start">
                  <View className="mr-3 mt-[7px] h-1.5 w-1.5 rounded-full bg-white/50" />
                  <Text className="flex-1 font-body text-sm text-white/70">{item}</Text>
                </View>
              ))}
            </View>
          </View>*/}

          <View className="flex-1" />

          <View className="gap-y-4">
            <Button title="Enable" onPress={finish} variant="black" />
            <TouchableOpacity onPress={finish} accessibilityRole="button">
              <Text className="text-center font-body text-base text-white/80">Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
