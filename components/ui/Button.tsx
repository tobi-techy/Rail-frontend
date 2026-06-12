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
      black: 'bg-midnight',
      white: 'bg-parchment-card border border-fog',
      orange: 'bg-ember-orange',
      destructive: 'bg-coral-red',
      ghost: 'bg-transparent',
    }[variant];

    const textStyles = {
      black: 'text-white',
      white: 'text-charcoal-primary',
      orange: 'text-white',
      destructive: 'text-white',
      ghost: 'text-ember-orange',
    }[variant];

    const sizeStyles = size === 'small' ? 'min-h-[44px] px-5 py-3' : 'min-h-[58px] px-7 py-[17px]';
    const textSize = size === 'small' ? 'text-caption' : 'text-body';

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
          accessibilityRole="button"
          accessibilityState={{ disabled: disabled || loading, busy: loading }}
          accessibilityLabel={loading ? `${title}, loading` : title}
          className={`flex-row items-center justify-center overflow-hidden rounded-full ${variantStyles} ${sizeStyles} ${
            disabled ? 'opacity-50' : ''
          } ${className}`}
          {...props}>
          {loading ? (
            <ActivityIndicator
              color={variant === 'white' ? '#343433' : variant === 'ghost' ? '#ff3e00' : '#fff'}
              size="small"
            />
          ) : (
            <View className="max-w-full flex-shrink flex-row items-center justify-center">
              {leftIcon && <View className="mr-2 flex-shrink-0">{leftIcon}</View>}
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                className={`min-w-0 flex-shrink text-center font-button ${textSize} ${textStyles}`}>
                {title}
              </Text>
              {rightIcon && <View className="ml-2 flex-shrink-0">{rightIcon}</View>}
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  }
);

Button.displayName = 'Button';
