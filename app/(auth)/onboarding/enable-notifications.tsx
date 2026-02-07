import React from 'react';
import { router } from 'expo-router';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { AuthGradient, StaggeredChild } from '@/components';
import { HeaderAction } from './components';
import Public from '@/assets/Icons/public.svg';
import { ROUTES } from '@/constants/routes';

export default function EnableNotificationsScreen() {
  const finish = () => router.push(ROUTES.AUTH.WELCOME_COMPLETE as any);
  const skip = () => router.replace(ROUTES.TABS as any);

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1">
        <StatusBar barStyle="dark-content" />
        <View className="flex-1 px-6 pb-8">
          <View className="mt-2 flex-row items-center justify-between">
            <HeaderAction icon="x" accessibilityLabel="Close onboarding" onPress={skip} />
          </View>

          <StaggeredChild index={0}>
            <View className="mt-14">
              <Public width={200} height={250} fill="#000" />
              <View className="mt-8">
                <Text className="font-heading text-[32px] text-black">Enable Notifications</Text>
                <Text className="mt-4 font-body text-base leading-6 text-black/60">
                  Get transaction alerts, investment milestones, and account reminders the moment
                  they happen so you never miss a beat.
                </Text>
              </View>
            </View>
          </StaggeredChild>

          <View className="flex-1" />

          <StaggeredChild index={1} delay={80}>
            <View className="gap-y-4">
              <Button title="Enable" onPress={finish} />
              <TouchableOpacity onPress={finish} accessibilityRole="button">
                <Text className="text-center font-body text-base text-black/60">Maybe later</Text>
              </TouchableOpacity>
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
