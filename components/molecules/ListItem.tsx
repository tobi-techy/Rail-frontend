import React from 'react';
import { View, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { typography } from '../../design/tokens';

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
        className={`flex-row items-center py-4 px-4 ${onPress ? 'active:bg-surface' : ''} ${className || ''}`}
        accessibilityRole={onPress ? 'button' : undefined}
        {...props}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}

        <View className="flex-1">
          <Text
            className="text-text-primary text-body"
            style={{ fontFamily: typography.fonts.body }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              className="text-text-secondary text-caption mt-1"
              style={{ fontFamily: typography.fonts.caption }}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {(rightText || rightIcon) && (
          <View className="flex-row items-center ml-3">
            {rightText && (
              <Text className="text-text-secondary text-caption mr-2" style={{ fontFamily: typography.fonts.caption }}>
                {rightText}
              </Text>
            )}
            {rightIcon}
          </View>
        )}
      </Component>

      {showDivider && <View className="h-px bg-surface ml-4" />}
    </>
  );
};
