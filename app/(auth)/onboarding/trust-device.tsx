import React from 'react';
import { router } from 'expo-router';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { AuthGradient, StaggeredChild } from '@/components';
import { HeaderAction } from './components';
import { Feather } from '@expo/vector-icons';

export default function TrustDeviceScreen() {
  const goToNext = () => router.push('/(auth)/onboarding/enable-faceid');

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1">
        <StatusBar barStyle="light-content" />
        <View className="flex-1 px-6 pb-8">
          <View className="mt-2 flex-row items-center justify-between">
            <HeaderAction
              icon="x"
              accessibilityLabel="Close onboarding"
              onPress={() => router.replace('/(tabs)')}
              variant="dark"
            />
            <HeaderAction
              icon="help-circle"
              accessibilityLabel="Learn more about trusted devices"
              onPress={() => {}}
              variant="dark"
            />
          </View>

          <StaggeredChild index={0}>
            <View className="mt-16">
              <Text className="font-heading text-[34px] text-white">Trust this device?</Text>
              <Text className="mt-4 font-body text-base leading-6 text-white/70">
                We won&apos;t ask to verify your identity again if this device is trusted. Choose
                &apos;Always trust&apos; only on personal devices you control.
              </Text>
            </View>
          </StaggeredChild>

          <StaggeredChild index={1}>
            <View className="mt-12 rounded-3xl border border-white/10 bg-white/10 p-5">
              <View className="mb-4 flex-row items-center gap-x-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Feather name="shield" size={20} color="#fff" />
                </View>
                <Text className="font-body-semibold text-base text-white">
                  Extra secure by design
                </Text>
              </View>
              <Text className="font-body text-sm leading-6 text-white/70">
                We encrypt device details and only trust it after successful identity confirmation.
                You can manage trusted devices anytime in your security settings.
              </Text>
            </View>
          </StaggeredChild>

          <View className="flex-1" />

          <StaggeredChild index={2} delay={80}>
            <View className="gap-y-4">
              <Button title="Always trust" onPress={goToNext} variant="black" />
              <TouchableOpacity onPress={goToNext} accessibilityRole="button">
                <Text className="text-center font-body text-base text-white/80">Trust once</Text>
              </TouchableOpacity>
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
