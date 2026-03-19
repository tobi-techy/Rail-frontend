import React, { useRef, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useHaptics } from '@/hooks/useHaptics';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ITEM_WIDTH = 56;

interface Props {
  selectedIndex: number;
  onSelect: (index: number) => void;
  activeIndices?: number[];
}

function MonthDot({
  label,
  isSelected,
  hasData,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  hasData: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.88, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 300 });
      }}
      activeOpacity={1}
      style={{ width: ITEM_WIDTH }}
      className="items-center py-2">
      <Animated.View style={animStyle} className="items-center">
        <View
          className={`h-7 w-7 items-center justify-center rounded-full ${
            isSelected
              ? 'bg-black'
              : hasData
                ? 'border-[1.5px] border-black'
                : 'border border-gray-200'
          }`}>
          {hasData && !isSelected && <View className="h-[5px] w-[5px] rounded-full bg-black" />}
        </View>
        <Text
          className={`mt-[5px] text-center text-[11px] ${
            isSelected ? 'font-button text-black' : 'font-caption text-gray-400'
          }`}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function MonthScrubber({ selectedIndex, onSelect, activeIndices = [] }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const activeSet = new Set(activeIndices);
  const { selection } = useHaptics();

  const handleSelect = useCallback(
    (index: number) => {
      selection();
      onSelect(index);
      const screenWidth = Dimensions.get('window').width;
      const offset = index * ITEM_WIDTH - screenWidth / 2 + ITEM_WIDTH / 2;
      scrollRef.current?.scrollTo({ x: Math.max(0, offset), animated: true });
    },
    [onSelect, selection]
  );

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 24 }}>
      {MONTHS.map((month, i) => (
        <MonthDot
          key={month}
          label={month}
          isSelected={i === selectedIndex}
          hasData={activeSet.has(i)}
          onPress={() => handleSelect(i)}
        />
      ))}
    </ScrollView>
  );
}
