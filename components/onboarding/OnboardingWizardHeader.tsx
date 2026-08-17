import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft01Icon } from '@/lib/icons';
import { IconComponent as HugeiconsIcon } from '@/lib/icons';
import { ROUTES } from '@/constants/routes';
import { useHaptics } from '@/hooks/useHaptics';

interface Props {
  step: number;
  total: number;
  onBack?: () => void;
  onSaveAndExit?: () => void;
  showSaveAndExit?: boolean;
}

export function OnboardingWizardHeader({
  step,
  total,
  onBack,
  onSaveAndExit,
  showSaveAndExit = true,
}: Props) {
  const { selection } = useHaptics();
  const handleBack = () => {
    selection();
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.TABS as never);
  };

  const handleExit = () => {
    selection();
    if (onSaveAndExit) {
      onSaveAndExit();
      return;
    }
    router.replace(ROUTES.TABS as never);
  };

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="size-10 items-center justify-center rounded-full bg-stone-surface">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color="#343433" />
        </Pressable>
        <Text className="font-body text-[13px] tabular-nums text-ash" maxFontSizeMultiplier={1.3}>
          {step} of {total}
        </Text>
        {showSaveAndExit ? (
          <Pressable
            onPress={handleExit}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Save and exit">
            <Text className="font-subtitle text-[14px] text-graphite" maxFontSizeMultiplier={1.3}>
              Save & exit
            </Text>
          </Pressable>
        ) : (
          <View className="w-16" />
        )}
      </View>
      <View className="mt-4 flex-row gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i < step ? 'bg-ember-orange' : 'bg-stone-surface'
            }`}
          />
        ))}
      </View>
    </View>
  );
}
