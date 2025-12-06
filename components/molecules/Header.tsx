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
  backgroundColor?: string;
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
  backgroundColor = 'bg-white',
  className,
}) => {
  return (
    <SafeAreaView className={backgroundColor}>
      <View
        className={`
          flex-row items-center justify-between px-4 py-3
          ${backgroundColor} ${className || ''}
        `}
      >
        {/* Left Section */}
        <View className="flex-row items-center flex-1">
          {(leftIcon || showBackButton) && (
            <TouchableOpacity
              onPress={onLeftPress}
              className="mr-3 p-2 -ml-2"
              accessibilityRole="button"
              accessibilityLabel={showBackButton ? 'Go back' : 'Left action'}
            >
              {leftIcon ||
                (showBackButton && (
                  <Icon
                    library="ionicons"
                    name="arrow-back"
                    size={24}
                    className="text-black"
                  />
                ))}
            </TouchableOpacity>
          )}

          {/* Title and Subtitle */}
          <View className="flex-1">
            <Text
              className="text-black text-[24px] font-bold font-sf-pro-bold"
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                className="text-gray-400 text-sm font-secondary"
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {/* Right Section */}
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
