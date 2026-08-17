import React, { useState } from 'react';
import { Pressable, StatusBar, Text, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AuthGradient, StaggeredChild } from '@/components';
import { Button } from '@/components/ui';
import { MiriamCharacter } from '@/components/ai';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';
import type { FirstJob } from '@/stores/authStore';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import { ArrowDownLeft01Icon, InternetIcon, SavingsIcon, Message01Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';

const JOBS: {
  value: FirstJob;
  title: string;
  subtitle: string;
  icon: typeof ArrowDownLeft01Icon;
}[] = [
  {
    value: 'receive',
    title: 'Receive money',
    subtitle: 'Get paid or pull funds in',
    icon: ArrowDownLeft01Icon,
  },
  {
    value: 'send',
    title: 'Send abroad',
    subtitle: 'Pay someone with a RailTag',
    icon: InternetIcon,
  },
  {
    value: 'save',
    title: 'Save automatically',
    subtitle: 'Split what arrives',
    icon: SavingsIcon,
  },
  {
    value: 'explore',
    title: 'Just look around',
    subtitle: 'Home first. Verify later.',
    icon: Message01Icon,
  },
];

export default function FirstJobScreen() {
  const updateRegistrationData = useAuthStore((s) => s.updateRegistrationData);
  const existing = useAuthStore((s) => s.registrationData.firstJob);
  const { selection, notification } = useHaptics();
  const [selected, setSelected] = useState<FirstJob | null>(existing ?? null);

  const finish = (job: FirstJob) => {
    updateRegistrationData({ firstJob: job });
    notification('success');
    playUISound('transactionSuccess');
    if (job === 'send') {
      router.replace(ROUTES.AUTH.COMPLETE_PROFILE.CREATE_RAILTAG as never);
      return;
    }
    router.replace(ROUTES.TABS as never);
  };

  return (
    <AuthGradient>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={Platform.OS === 'android'}
        />
        <View className="flex-1 px-6 pt-6">
          <StaggeredChild index={0}>
            <View className="mb-8 items-center">
              <MiriamCharacter size={72} emotion="happy" animate />
              <Text
                className="mt-5 text-center font-headline-2 text-auth-title leading-[1.1] text-charcoal-primary"
                maxFontSizeMultiplier={1.3}>
                What should we do first?
              </Text>
              <Text
                className="mt-2 text-center font-body text-[15px] leading-6 text-ash"
                maxFontSizeMultiplier={1.4}>
                One choice. You can verify later. Crypto receive works now.
              </Text>
            </View>
          </StaggeredChild>

          <View className="gap-y-2.5">
            {JOBS.map((job, index) => {
              const isSelected = selected === job.value;
              return (
                <StaggeredChild key={job.value} index={index + 1}>
                  <Pressable
                    onPress={() => {
                      selection();
                      setSelected(job.value);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    className={`flex-row items-center rounded-2xl px-4 py-4 ${
                      isSelected ? 'bg-charcoal-primary' : 'bg-stone-surface'
                    }`}>
                    <View
                      className={`size-10 items-center justify-center rounded-full ${
                        isSelected ? 'bg-white/10' : 'bg-warm-canvas'
                      }`}>
                      <HugeiconsIcon
                        icon={job.icon}
                        size={18}
                        color={isSelected ? '#ffffff' : '#343433'}
                      />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text
                        className={`font-subtitle text-[16px] ${
                          isSelected ? 'text-white' : 'text-charcoal-primary'
                        }`}
                        maxFontSizeMultiplier={1.3}>
                        {job.title}
                      </Text>
                      <Text
                        className={`mt-0.5 font-body text-[13px] ${
                          isSelected ? 'text-white/65' : 'text-ash'
                        }`}
                        maxFontSizeMultiplier={1.4}>
                        {job.subtitle}
                      </Text>
                    </View>
                  </Pressable>
                </StaggeredChild>
              );
            })}
          </View>

          <View className="mt-auto pb-2">
            <Button
              title="Continue"
              variant="orange"
              disabled={!selected}
              onPress={() => selected && finish(selected)}
            />
            <Pressable
              onPress={() => finish('explore')}
              className="mt-4 items-center py-2"
              accessibilityRole="button">
              <Text className="font-body text-[14px] text-ash" maxFontSizeMultiplier={1.4}>
                Skip for now
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
