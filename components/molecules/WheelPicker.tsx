import React from 'react';
import RNWheelPicker from '@quidone/react-native-wheel-picker';
import * as Haptics from 'expo-haptics';

interface WheelPickerProps {
  items: string[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
}

const data = (items: string[]) => items.map((label, index) => ({ value: index, label }));

export function WheelPicker({ items, selectedIndex, onIndexChange }: WheelPickerProps) {
  return (
    <RNWheelPicker
      data={data(items)}
      value={selectedIndex}
      onValueChanging={() => Haptics.selectionAsync()}
      onValueChanged={({ item: { value } }) => onIndexChange(value as number)}
      enableScrollByTapOnItem
      visibleItemCount={5}
      itemHeight={52}
      itemTextStyle={{ fontSize: 17 }}
      overlayItemStyle={{ backgroundColor: '#F3F4F6', borderRadius: 12 }}
    />
  );
}
