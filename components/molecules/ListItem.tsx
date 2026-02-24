import React from 'react';
import { View, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

export interface ListItemProps extends TouchableOpacityProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightText?: string;
  onPress?: () => void;
  showDivider?: boolean;
  className?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  rightText,
  onPress,
  showDivider = true,
  className,
  ...props
}) => {
  const Component = onPress ? TouchableOpacity : View;

  return (
    <>
      <Component
        onPress={onPress}
        className={`min-h-[56px] flex-row items-center px-4 py-4 ${onPress ? 'active:bg-surface' : ''} ${className || ''}`}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={
          onPress
            ? `${title}${subtitle ? `, ${subtitle}` : ''}${rightText ? `, ${rightText}` : ''}`
            : undefined
        }
        {...props}>
        {leftIcon && <View className="mr-3">{leftIcon}</View>}

        <View className="flex-1">
          <Text className="font-body text-body text-text-primary" numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text className="mt-1 font-caption text-caption text-text-secondary" numberOfLines={2}>
              {subtitle}
            </Text>
          )}
        </View>

        {(rightText || rightIcon) && (
          <View className="ml-3 flex-row items-center">
            {rightText && (
              <Text className="mr-2 font-caption text-caption text-text-secondary">
                {rightText}
              </Text>
            )}
            {rightIcon}
          </View>
        )}
      </Component>

      {showDivider && <View className="ml-4 h-px bg-surface" />}
    </>
  );
};
