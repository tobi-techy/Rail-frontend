import { View, Text, TouchableOpacity } from 'react-native'
import { Icon } from './Icon';
import React from 'react'

export const ActionButton = ({
    icon,
    label,
    onPress,
    library = 'lucide',
    bgColor = 'bg-secondary',
  }: {
    icon: string;
    label: string;
    onPress?: () => void;
    library?: string;
    bgColor?: string;
  }) => (
    <TouchableOpacity 
      className="items-center justify-center"
      onPress={onPress}
      accessibilityLabel={label}
    >
      <View className={`w-[60px] h-[60px] rounded-full ${bgColor} items-center justify-center mb-1`}>
        <Icon
          library={library as any}
          name={icon}
          size={28}
          strokeWidth={2}
        />
      </View>
      <Text className="text-[14px] font-body-medium">{label}</Text>
    </TouchableOpacity>
  );