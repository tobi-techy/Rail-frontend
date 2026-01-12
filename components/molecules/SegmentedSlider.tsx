import { useCallback, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface SegmentedSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  segments?: number;
  label?: string;
  showPercentage?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  className?: string;
}

export function SegmentedSlider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  segments = 50,
  label,
  showPercentage = true,
  activeColor = '#D946EF',
  inactiveColor = '#E5E5E5',
  className,
}: SegmentedSliderProps) {
  const sliderWidth = useSharedValue(0);
  const lastSegment = useRef(-1);

  const normalizedValue = ((value - min) / (max - min)) * 100;
  const activeSegments = Math.round((normalizedValue / 100) * segments);

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleValueChange = useCallback(
    (newValue: number) => {
      const clampedValue = Math.min(max, Math.max(min, newValue));
      const steppedValue = Math.round(clampedValue / step) * step;

      const newSegment = Math.round(((steppedValue - min) / (max - min)) * segments);
      if (newSegment !== lastSegment.current) {
        lastSegment.current = newSegment;
        triggerHaptic();
      }

      onValueChange(steppedValue);
    },
    [min, max, step, segments, onValueChange, triggerHaptic]
  );

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const percentage = Math.max(0, Math.min(1, e.x / sliderWidth.value));
      const newValue = min + percentage * (max - min);
      runOnJS(handleValueChange)(newValue);
    })
    .hitSlop({ vertical: 20 });

  const tapGesture = Gesture.Tap().onEnd((e) => {
    const percentage = Math.max(0, Math.min(1, e.x / sliderWidth.value));
    const newValue = min + percentage * (max - min);
    runOnJS(handleValueChange)(newValue);
  });

  const gesture = Gesture.Race(panGesture, tapGesture);

  return (
    <View className={className}>
      {(label || showPercentage) && (
        <View className="mb-2 flex-row items-center justify-between">
          {label && <Text className="text-sm text-neutral-500">{label}</Text>}
          {showPercentage && (
            <Text className="text-sm font-medium text-neutral-900">
              {Math.round(normalizedValue)}%
            </Text>
          )}
        </View>
      )}

      <GestureDetector gesture={gesture}>
        <Animated.View
          className="flex-row items-end gap-[2px]"
          onLayout={(e) => {
            sliderWidth.value = e.nativeEvent.layout.width;
          }}>
          {Array.from({ length: segments }).map((_, i) => (
            <SegmentBar
              key={i}
              isActive={i < activeSegments}
              activeColor={activeColor}
              inactiveColor={inactiveColor}
            />
          ))}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function SegmentBar({
  isActive,
  activeColor,
  inactiveColor,
}: {
  isActive: boolean;
  activeColor: string;
  inactiveColor: string;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: isActive ? activeColor : inactiveColor,
    transform: [{ scaleY: scale.value }],
  }));

  return <Animated.View className="h-12 flex-1 rounded-sm" style={animatedStyle} />;
}
