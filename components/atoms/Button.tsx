import React, { forwardRef } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Text,
  ActivityIndicator,
  View,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<View, ButtonProps>(({
  title,
  variant = 'primary',
  size = 'lg',
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  testID,
  ...props
}, ref) => {
  const isPrimary = variant === 'primary';
  const baseStyle = isPrimary
    ? 'bg-primary-accent'
    : 'bg-background-main border border-primary-accent';
  const textColor = isPrimary ? 'text-white' : 'text-primary-accent';
  const loaderColor = isPrimary ? '#FFFFFF' : '#1B84FF';

  return (
    <TouchableOpacity
      ref={ref}
      disabled={disabled || loading}
      testID={testID}
      accessible
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      className={`w-full flex-row items-center justify-center rounded-sm h-12 ${baseStyle} ${
        disabled ? 'opacity-50' : ''
      } ${className}`}
      {...props}>
      {loading ? (
        <ActivityIndicator color={loaderColor} size="small" />
      ) : (
        <View className="flex-row items-center">
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text className={`font-button text-button-lg ${textColor}`}>{title}</Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
});

Button.displayName = 'Button';
