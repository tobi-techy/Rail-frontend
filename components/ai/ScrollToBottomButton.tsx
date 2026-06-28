import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from '@/utils/platformHaptics';
import { SPRING_SNAPPY, DUR } from '@/lib/motion';
import { ArrowDown01Icon, IconComponent as HugeiconsIcon } from '@/lib/icons';

interface Props {
  visible: boolean;
  onPress: () => void;
  bottom?: number;
}

/**
 * Floating "scroll to bottom" affordance that springs in when the user
 * has scrolled up far enough to miss new messages.
 */
export const ScrollToBottomButton = React.memo(function ScrollToBottomButton({
  visible,
  onPress,
  bottom = 96,
}: Props) {
  // Start from 0.8 (never scale(0) — that appears from nothing).
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, SPRING_SNAPPY);
      opacity.value = withTiming(1, { duration: DUR.enter });
    } else {
      scale.value = withTiming(0.8, { duration: DUR.exit });
      opacity.value = withTiming(0, { duration: DUR.exit });
    }
  }, [visible, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
    pointerEvents: visible ? 'auto' : 'none',
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          position: 'absolute',
          right: 16,
          bottom,
          zIndex: 20,
        },
      ]}>
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel="Scroll to latest message"
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 6,
        }}>
        <HugeiconsIcon icon={ArrowDown01Icon} size={18} color="#343433" />
      </Pressable>
    </Animated.View>
  );
});
