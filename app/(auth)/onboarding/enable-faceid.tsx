import React, { useMemo } from 'react';
import { router } from 'expo-router';
import { View, Text, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { AuthGradient, StaggeredChild } from '@/components';
import { HeaderAction } from './components';
import Passkey4Icon from '@/assets/Icons/passkey-4.svg';

export default function EnableFaceIdScreen() {
  const next = () => router.push('/(auth)/onboarding/enable-notifications');
  const biometricLabel = useMemo(() => {
    if (Platform.OS === 'android') return 'Enable biometrics';
    return 'Enable Face ID';
  }, []);

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
          </View>

          <StaggeredChild index={0}>
            <View className="mt-14">
              <Passkey4Icon width={200} height={250} fill="#fff" />
              <View className="mt-8">
                <Text className="font-heading text-[32px] text-white">{biometricLabel}</Text>
                <Text className="mt-4 font-body text-base leading-6 text-white/70">
                  Face ID keeps your account secure and unlocks instant access without needing to
                  type your password every time.
                </Text>
              </View>
            </View>
          </StaggeredChild>

          <View className="flex-1" />

          <StaggeredChild index={1} delay={80}>
            <View className="mt-4 gap-y-4">
              <Button title="Enable" onPress={next} variant="black" />
              <TouchableOpacity onPress={next} accessibilityRole="button">
                <Text className="text-center font-body text-base text-white/80">Maybe later</Text>
              </TouchableOpacity>
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
