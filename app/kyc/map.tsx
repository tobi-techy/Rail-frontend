import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { getVerifyStartRoute } from '@/utils/onboardingFlow';
import { ROUTES } from '@/constants/routes';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import {
  ArrowLeft01Icon,
  UserIcon,
  Calendar03Icon,
  PinIcon,
  Building04Icon,
  ShieldKeyIcon,
  Tick02Icon,
} from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';

export default function KycMapScreen() {
  const { selection } = useHaptics();
  const data = useAuthStore((s) => s.registrationData);
  const user = useAuthStore((s) => s.user);

  const firstName = data.firstName || user?.firstName || '';
  const lastName = data.lastName || user?.lastName || '';

  const steps = useMemo(
    () => [
      {
        title: 'Legal name',
        detail: 'As it appears on your ID',
        done: Boolean(firstName && lastName),
        icon: UserIcon,
      },
      {
        title: 'Date of birth',
        detail: 'Must be 18 or older',
        done: Boolean(data.dob),
        icon: Calendar03Icon,
      },
      {
        title: 'Address & phone',
        detail: 'About 1 minute',
        done: Boolean(data.street),
        icon: PinIcon,
      },
      {
        title: 'About you',
        detail: 'Employment, purpose, source of funds',
        done: Boolean(data.employmentStatus && data.sourceOfFunds),
        icon: Building04Icon,
      },
      {
        title: 'Photo ID',
        detail: 'Unlocks named NGN, USD, and GBP accounts',
        done: false,
        icon: ShieldKeyIcon,
      },
    ],
    [data.dob, data.employmentStatus, data.sourceOfFunds, data.street, firstName, lastName]
  );

  const startRoute = getVerifyStartRoute({
    firstName,
    lastName,
    dob: data.dob,
    street: data.street,
    employmentStatus: data.employmentStatus,
    sourceOfFunds: data.sourceOfFunds,
  });

  return (
    <SafeAreaView className="flex-1 bg-warm-canvas" edges={['top', 'bottom']}>
      <View className="flex-1 px-6 pt-2">
        <Pressable
          onPress={() => {
            selection();
            if (router.canGoBack()) router.back();
            else router.replace(ROUTES.TABS as never);
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="size-10 items-center justify-center rounded-full bg-stone-surface">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color="#343433" />
        </Pressable>

        <Text
          className="mt-6 font-headline-2 text-auth-title leading-[1.1] text-charcoal-primary"
          maxFontSizeMultiplier={1.3}>
          Unlock named accounts
        </Text>
        <Text className="mt-2 font-body text-[15px] leading-6 text-ash" maxFontSizeMultiplier={1.4}>
          Crypto receive works now. These steps unlock bank details. Save anytime and come back.
        </Text>

        <View className="mt-8">
          {steps.map((step) => (
            <View key={step.title} className="mb-5 flex-row items-start">
              <View
                className={`size-10 items-center justify-center rounded-full ${
                  step.done ? 'bg-valid-green/12' : 'bg-stone-surface'
                }`}>
                <HugeiconsIcon
                  icon={step.done ? Tick02Icon : step.icon}
                  size={18}
                  color={step.done ? '#00c454' : '#343433'}
                />
              </View>
              <View className="ml-3 flex-1 border-b border-fog/40 pb-5">
                <Text
                  className="font-subtitle text-[16px] text-charcoal-primary"
                  maxFontSizeMultiplier={1.3}>
                  {step.title}
                </Text>
                <Text className="mt-0.5 font-body text-[13px] text-ash" maxFontSizeMultiplier={1.4}>
                  {step.detail}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View className="mt-auto pb-2">
          <Button
            title="Continue"
            variant="orange"
            onPress={() => {
              selection();
              playUISound('buttonClick');
              router.push(startRoute as never);
            }}
          />
          <Pressable
            onPress={() => router.replace(ROUTES.TABS as never)}
            className="mt-4 items-center py-2"
            accessibilityRole="button">
            <Text className="font-body text-[14px] text-ash" maxFontSizeMultiplier={1.4}>
              Later
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
