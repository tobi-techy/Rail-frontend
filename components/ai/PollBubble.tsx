import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from '@/utils/platformHaptics';
import { SPRING_PRESS } from '@/lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// One poll option with scale-on-press feedback.
function PollOption({
  label,
  picked,
  anyPicked,
  onPress,
}: {
  label: string;
  picked: boolean;
  anyPicked: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        if (!anyPicked) scale.value = withSpring(0.97, SPRING_PRESS);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_PRESS);
      }}
      disabled={anyPicked}
      style={[
        style,
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 14,
          borderWidth: 1,
          paddingVertical: 12,
          borderColor: picked ? '#FF3E00' : 'rgba(0,0,0,0.08)',
          backgroundColor: picked ? 'rgba(255,62,0,0.08)' : '#FFFFFF',
          opacity: anyPicked && !picked ? 0.5 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Text
        className="font-body-medium text-[15px]"
        style={{ color: picked ? '#FF3E00' : '#1C1C1E' }}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

interface PollData {
  question?: string;
  options?: string[];
}

interface Props {
  data: PollData;
  onPick?: (option: string) => void;
}

/**
 * Inline "this-or-that" poll — a playful, tappable choice from Miriam. Tapping an
 * option sends it back into the conversation as the user's reply, keeping the
 * thread interactive and engaging.
 */
export const PollBubble = React.memo(function PollBubble({ data, onPick }: Props) {
  const [picked, setPicked] = useState<string | null>(null);
  const question = data.question?.trim();
  const options = (data.options ?? []).filter((o) => typeof o === 'string' && o.trim()).slice(0, 4);

  if (options.length < 2) return null;

  const handlePick = (option: string) => {
    if (picked) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPicked(option);
    onPick?.(option);
  };

  return (
    <Animated.View entering={FadeIn.duration(220)} className="max-w-[88%] self-start">
      <View className="rounded-[20px] bg-[#E9E9EB] px-4 py-3.5">
        {question ? (
          <Text className="mb-3 font-body-medium text-[16px] leading-[22px] text-[#1C1C1E]">
            {question}
          </Text>
        ) : null}
        <View className="gap-2">
          {options.map((opt) => (
            <PollOption
              key={opt}
              label={opt}
              picked={picked === opt}
              anyPicked={!!picked}
              onPress={() => handlePick(opt)}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
});
