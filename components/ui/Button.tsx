import React, { forwardRef, useRef, useCallback } from 'react';
import { Pressable, PressableProps, Text, ActivityIndicator, View, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'black' | 'white' | 'orange';
  size?: 'small' | 'large';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  enableHaptics?: boolean;
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
      onPress,
      ...props
    },
    ref
  ) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
      if (enableHaptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }, [scaleAnim, enableHaptics]);

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
        if (enableHaptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onPress?.(e);
      },
      [enableHaptics, onPress]
    );

    const variantStyles =
      variant === 'white'
        ? 'bg-white border border-gray-200'
        : variant === 'orange'
          ? 'bg-[#FF5A00]'
          : 'bg-black';
    const textStyles =
      variant === 'white' ? 'text-black' : variant === 'orange' ? 'text-white' : 'text-white';
    const sizeStyles = size === 'small' ? 'px-4 py-3' : 'px-6 py-5';
    const textSize = size === 'small' ? 'text-sm' : 'text-lg';
    const widthStyles = size === 'small' ? 'w-[30%]' : 'w-full';

    return (
      <Animated.View
        style={{ transform: [{ scale: scaleAnim }], width: size === 'small' ? '30%' : '100%' }}>
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
              <Text className={`font-button ${textSize} ${textStyles}`}>{title}</Text>
              {rightIcon && <View className="ml-2">{rightIcon}</View>}
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  }
);

Button.displayName = 'Button';
