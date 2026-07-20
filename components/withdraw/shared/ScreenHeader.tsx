import { View, Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';
import { useHaptics } from '@/hooks/useHaptics';
import { playUISound } from '@/lib/uiSounds';
import * as Haptics from '@/utils/platformHaptics';

interface ScreenHeaderProps {
  onBack?: () => void;
  /** Optional centered title. When set, the header uses a 3-column layout so
   *  the title stays optically centered regardless of the trailing slot. */
  title?: string;
  /** Optional trailing accessory (e.g. a Share button), right-aligned. */
  right?: React.ReactNode;
}

export function ScreenHeader({ onBack, title, right }: ScreenHeaderProps) {
  const { impact } = useHaptics();

  const handleBack = () => {
    impact(Haptics.ImpactFeedbackStyle.Light);
    playUISound('dismiss');
    (onBack ?? (() => router.back()))();
  };

  return (
    <View className="flex-row items-center justify-between px-5 pb-2 pt-1">
      <Pressable
        className="size-11 items-center justify-center rounded-full bg-surface active:opacity-70"
        onPress={handleBack}
        accessibilityRole="button"
        accessibilityLabel="Go back">
        <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#343433" />
      </Pressable>

      {title ? (
        <Text
          className="font-subtitle text-[17px] text-text-primary"
          maxFontSizeMultiplier={1.3}
          numberOfLines={1}>
          {title}
        </Text>
      ) : null}

      {/* Balances the back button so a title centers; holds the trailing slot. */}
      <View className="size-11 items-center justify-center">{right}</View>
    </View>
  );
}
