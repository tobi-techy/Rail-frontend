import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';

interface ScreenHeaderProps {
  onBack?: () => void;
}

export function ScreenHeader({ onBack }: ScreenHeaderProps) {
  return (
    <View className="px-5 pb-2 pt-1">
      <Pressable
        className="size-11 items-center justify-center rounded-full bg-surface"
        onPress={onBack ?? (() => router.back())}
        accessibilityRole="button"
        accessibilityLabel="Go back">
        <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#343433" />
      </Pressable>
    </View>
  );
}
