import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Icon } from '../atoms';
import { SafeAreaView } from 'moti';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  showBackButton?: boolean;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  showBackButton = false,
  className,
}) => {
  return (
    <SafeAreaView className="bg-background-main">
      <View className={`flex-row items-center justify-between px-lg py-3 bg-background-main ${className || ''}`}>
        <View className="flex-row items-center flex-1">
          {(leftIcon || showBackButton) && (
            <TouchableOpacity
              onPress={onLeftPress}
              className="mr-3 p-2 -ml-2"
              accessibilityRole="button"
              accessibilityLabel={showBackButton ? 'Go back' : 'Left action'}
            >
              {leftIcon || (showBackButton && (
                <Icon library="ionicons" name="arrow-back" size={24} className="text-text-primary" />
              ))}
            </TouchableOpacity>
          )}

          <View className="flex-1">
            <Text className="text-text-primary text-headline-2 font-headline-2" numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text className="text-text-secondary text-caption font-caption" numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightPress}
            className="p-2 -mr-2"
            accessibilityRole="button"
            accessibilityLabel="Right action"
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};
