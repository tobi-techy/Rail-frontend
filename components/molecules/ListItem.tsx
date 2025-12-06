import React from 'react';
import { View, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../design/tokens';

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
        className={`
          flex-row items-center py-4 px-4
          ${onPress ? 'active:bg-[#F7F7F7]' : ''}
          ${className || ''}
        `}
        accessibilityRole={onPress ? 'button' : undefined}
        {...props}
      >
        {/* Left Icon */}
        {leftIcon && (
          <View className="mr-3">
            {leftIcon}
          </View>
        )}

        {/* Content */}
        <View className="flex-1">
          <Text 
            className="text-[#000000] text-base font-normal"
            style={{
              fontFamily: typography.fonts.secondary,
              fontSize: typography.styles.body.size,
              fontWeight: typography.weights.regular,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text 
              className="text-[#A0A0A0] text-sm mt-1"
              style={{
                fontFamily: typography.fonts.secondary,
                fontSize: typography.styles.label.size,
                fontWeight: typography.weights.regular,
              }}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right Content */}
        {(rightText || rightIcon) && (
          <View className="flex-row items-center ml-3">
            {rightText && (
              <Text 
                className="text-[#A0A0A0] text-sm mr-2"
                style={{
                  fontFamily: typography.fonts.secondary,
                  fontSize: typography.styles.label.size,
                }}
              >
                {rightText}
              </Text>
            )}
            {rightIcon && rightIcon}
          </View>
        )}
      </Component>

      {/* Divider */}
      {showDivider && (
        <View className="h-px bg-[#F7F7F7] ml-4" />
      )}
    </>
  );
};