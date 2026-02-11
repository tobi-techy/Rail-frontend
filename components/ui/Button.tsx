import React, { forwardRef, useRef, useCallback } from 'react';
import { Pressable, PressableProps, Text, ActivityIndicator, View, Animated } from 'react-native';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'black' | 'white' | 'orange' | 'destructive' | 'ghost';
  size?: 'small' | 'large';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  enableHaptics?: boolean;
  flex?: boolean;
}

export const Button = forwardRef<View, ButtonProps>(
  (
    {
      title,
      variant = 'black',
      size = 'large',
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      enableHaptics = true,
      flex = false,
      onPress,
      ...props
    },
    ref
  ) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const triggerFeedback = useButtonFeedback(enableHaptics);

    const handlePressIn = useCallback(() => {
      triggerFeedback();
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }, [scaleAnim, triggerFeedback]);

    const handlePressOut = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 8,
      }).start();
    }, [scaleAnim]);

    const handlePress = useCallback(
      (e: any) => {
        onPress?.(e);
      },
      [onPress]
    );

    const variantStyles = {
      black: 'bg-black',
      white: 'bg-white border border-gray-200',
      orange: 'bg-[#FF2E01]',
      destructive: 'bg-[#F44336]',
      ghost: 'bg-transparent',
    }[variant];

    const textStyles = {
      black: 'text-white',
      white: 'text-black',
      orange: 'text-white',
      destructive: 'text-white',
      ghost: 'text-text-secondary',
    }[variant];

    const sizeStyles = size === 'small' ? 'px-4 py-3' : 'px-6 py-5';
    const textSize = size === 'small' ? 'text-caption' : 'text-lg';

    return (
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          flex: flex ? 1 : undefined,
          alignSelf: flex ? undefined : size === 'small' ? 'flex-start' : 'stretch',
        }}>
        <Pressable
          ref={ref}
          disabled={disabled || loading}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          className={`flex-row items-center justify-center rounded-full ${variantStyles} ${sizeStyles} ${
            disabled ? 'opacity-50' : ''
          } ${className}`}
          {...props}>
          {loading ? (
            <ActivityIndicator color={variant === 'black' ? '#fff' : '#000'} size="small" />
          ) : (
            <View className="flex-row items-center">
              {leftIcon && <View className="mr-2">{leftIcon}</View>}
              <Text className={`font-button  ${textSize} ${textStyles}`}>{title}</Text>
              {rightIcon && <View className="ml-2">{rightIcon}</View>}
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  }
);

Button.displayName = 'Button';
