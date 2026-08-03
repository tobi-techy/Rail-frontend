import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { DiceBearAvatar } from '@/components/atoms/DiceBearAvatar';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';

interface RecipientRowProps {
  name: string;
  subtitle: string;
  index?: number;
  onPress: () => void;
}

export function RecipientRow({ name, subtitle, index = 0, onPress }: RecipientRowProps) {
  const triggerFeedback = useButtonFeedback();

  return (
    <Animated.View entering={FadeInUp.delay(160 + index * 40).duration(200)}>
      <Pressable
        className="flex-row items-center gap-3 rounded-2xl px-2 py-3 active:bg-surface"
        onPress={() => {
          triggerFeedback();
          onPress();
        }}>
        <DiceBearAvatar seed={name} size={44} />
        <View className="flex-1">
          <Text className="font-subtitle text-[15px] text-text-primary" numberOfLines={1}>
            {name}
          </Text>
          <Text className="font-body text-[13px] text-text-secondary" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
