import React, { useRef, useCallback, useEffect } from 'react';
import { ScrollView, View, Text, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import * as Haptics from 'expo-haptics';

const ITEM_HEIGHT = 52;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface WheelPickerProps {
  items: string[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
}

export function WheelPicker({ items, selectedIndex, onIndexChange }: WheelPickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const lastIndex = useRef(selectedIndex);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
  }, []);

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(items.length - 1, index));
      if (clamped !== lastIndex.current) {
        lastIndex.current = clamped;
        Haptics.selectionAsync();
        onIndexChange(clamped);
      }
    },
    [items.length, onIndexChange]
  );

  return (
    <View style={{ height: PICKER_HEIGHT, overflow: 'hidden' }}>
      {/* Selection highlight */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: ITEM_HEIGHT * 2,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT,
          backgroundColor: '#F3F4F6',
          borderRadius: 12,
        }}
      />
      {/* Top fade */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT * 2,
          zIndex: 1,
          opacity: 0.85,
          backgroundColor: '#fff',
        }}
      />
      {/* Bottom fade */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT * 2,
          zIndex: 1,
          opacity: 0.85,
          backgroundColor: '#fff',
        }}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        onMomentumScrollEnd={handleMomentumEnd}>
        {items.map((item, i) => {
          const isSelected = i === selectedIndex;
          return (
            <View
              key={item}
              style={{ height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
              <Text
                style={{
                  fontSize: isSelected ? 18 : 15,
                  fontWeight: isSelected ? '600' : '400',
                  color: isSelected ? '#111827' : '#9CA3AF',
                }}>
                {item}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
