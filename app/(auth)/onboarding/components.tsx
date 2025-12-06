import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const TOTAL_ONBOARDING_STEPS = 3;

export const ProgressDots = ({ activeStep }: { activeStep: number }) => (
  <View className="mt-6 flex-row items-center justify-center space-x-2">
    {Array.from({ length: TOTAL_ONBOARDING_STEPS }).map((_, index) => {
      const isActive = index + 1 === activeStep;
      return (
        <View
          key={index}
          className={`h-1.5 rounded-full ${isActive ? 'bg-gray-900' : 'bg-gray-200'}`}
          style={{ flex: isActive ? 2.4 : 1 } as ViewStyle}
        />
      );
    })}
  </View>
);

export const HeaderAction = ({
  icon,
  accessibilityLabel,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  accessibilityLabel: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
    <Feather name={icon} size={22} color="#111827" />
  </TouchableOpacity>
);

// Default export to satisfy expo-router
export default function OnboardingComponents() {
  return null;
}
