import React, { useRef, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ITEM_WIDTH = 56;

interface Props {
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Indices that have data (non-zero spend) */
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
      onPressIn={() => { scale.value = withSpring(0.88, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 300 }); }}
      activeOpacity={1}
      style={{ width: ITEM_WIDTH, alignItems: 'center', paddingVertical: 8 }}>
      <Animated.View style={animStyle}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isSelected ? '#000' : 'transparent',
            borderWidth: isSelected ? 0 : hasData ? 1.5 : 1,
            borderColor: isSelected ? 'transparent' : hasData ? '#000' : '#E5E5E5',
          }}>
          {hasData && !isSelected && (
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: '#000',
              }}
            />
          )}
        </View>
        <Text
          style={{
            fontFamily: isSelected ? 'SF-Pro-Rounded-Semibold' : 'SF-Pro-Rounded-Regular',
            fontSize: 11,
            color: isSelected ? '#000' : '#9CA3AF',
            marginTop: 5,
            textAlign: 'center',
          }}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function MonthScrubber({ selectedIndex, onSelect, activeIndices = [] }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const activeSet = new Set(activeIndices);

  const handleSelect = useCallback(
    (index: number) => {
      Haptics.selectionAsync();
      onSelect(index);
      // Scroll to keep selected item centered
      const screenWidth = Dimensions.get('window').width;
      const offset = index * ITEM_WIDTH - screenWidth / 2 + ITEM_WIDTH / 2;
      scrollRef.current?.scrollTo({ x: Math.max(0, offset), animated: true });
    },
    [onSelect]
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
