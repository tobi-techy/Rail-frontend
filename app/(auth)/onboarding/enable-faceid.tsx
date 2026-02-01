import React, { useMemo } from 'react';
import { router } from 'expo-router';
import { View, Text, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { AuthGradient } from '@/components';
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
            <HeaderAction icon="x" accessibilityLabel="Close onboarding" onPress={() => router.back()} variant="dark" />
          </View>

          <View className="mt-14">
            <Passkey4Icon width={200} height={250} fill="#fff" />
            <View className="mt-8">
              <Text className="font-heading text-[32px] text-white">{biometricLabel}</Text>
              <Text className="mt-4 font-body text-base leading-6 text-white/70">
                Face ID keeps your account secure and unlocks instant access without needing to type
                your password every time.
              </Text>
            </View>
          </View>

          {/*<View className="mt-12 rounded-3xl border border-white/10 bg-white/10 p-5">
            <Text className="font-body-semibold text-base text-white">Here&apos;s why it matters</Text>
            <View className="mt-4 gap-y-3">
              {[
                'Instant sign-in with built-in biometrics',
                'Strong protection against fraud',
                'Manage this preference anytime in settings',
              ].map((item) => (
                <View key={item} className="flex-row items-start">
                  <View className="mr-3 mt-[7px] h-1.5 w-1.5 rounded-full bg-white/50" />
                  <Text className="flex-1 font-body text-sm text-white/70">{item}</Text>
                </View>
              ))}
            </View>
          </View>*/}

          <View className="flex-1" />

          <View className="gap-y-4 mt-4">
            <Button title="Enable" onPress={next} variant="black" />
            <TouchableOpacity onPress={next} accessibilityRole="button">
              <Text className="text-center font-body text-base text-white/80">Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
