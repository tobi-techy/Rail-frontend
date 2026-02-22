import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface GradientCardProps {
  title: string;
  amount: string;
  amountSubtitle?: string;
  icon?: React.ReactNode;
  backgroundColor?: string;
  gradientColors?: [string, string];
  onPress?: () => void;
  onMenuPress?: () => void;
  disabled?: boolean;
  testID?: string;
  className?: string;
}

export const GradientCard: React.FC<GradientCardProps> = ({
  title,
  amount,
  amountSubtitle,
  icon,
  backgroundColor = '#FF6B35',
  gradientColors,
  onPress,
  onMenuPress,
  disabled = false,
  testID,
  className,
}) => {
  const Container: any = onPress ? Pressable : View;
  const colors = gradientColors || [backgroundColor, backgroundColor];

  return (
    <Container
      onPress={onPress}
      disabled={disabled || !onPress}
      testID={testID}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `${title}: ${amount}` : undefined}
      accessibilityState={{ disabled: disabled || !onPress }}
      className={`overflow-hidden rounded-lg ${className || ''}`}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className={`flex-1 p-lg ${disabled ? 'opacity-60' : ''}`}>
        {/* Header with icon and menu */}
        <View className="mb-lg flex-row items-center justify-between">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-white/30">
            {icon}
          </View>
          {onMenuPress && (
            <Pressable
              onPress={onMenuPress}
              className="p-2"
              accessibilityRole="button"
              accessibilityLabel="Menu">
              <Text className="font-headline-2 text-white">⋯</Text>
            </Pressable>
          )}
        </View>

        {/* Amount section */}
        <View>
          <Text className="font-subtitle text-white">{amount}</Text>
          {amountSubtitle && (
            <Text className="font-body text-white/80">{amountSubtitle}</Text>
          )}
        </View>

        {/* Title section */}
        <View className="mt-auto">
          <Text className="font-body text-white/80">{title}</Text>
        </View>
      </LinearGradient>
    </Container>
  );
};
