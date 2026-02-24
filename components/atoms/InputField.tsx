import React, { forwardRef, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
  NativeSyntheticEvent,
  LayoutChangeEvent,
} from 'react-native';
import { Canvas, RoundedRect } from '@shopify/react-native-skia';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from './SafeIonicons';

interface InputFieldProps extends Omit<TextInputProps, 'onFocus' | 'onBlur'> {
  label: string;
  error?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'phone';
  icon?: keyof typeof Ionicons.glyphMap;
  isPasswordVisible?: boolean;
  onTogglePasswordVisibility?: () => void;
  onFocus?: (e: NativeSyntheticEvent<any>) => void;
  onBlur?: (e: NativeSyntheticEvent<any>) => void;
  variant?: 'light' | 'dark' | 'blended';
}

export const InputField = forwardRef<TextInput, InputFieldProps>(
  (
    {
      label,
      error,
      required = false,
      type = 'text',
      icon,
      value,
      onChangeText,
      placeholder,
      isPasswordVisible = false,
      onTogglePasswordVisibility,
      onFocus,
      onBlur,
      variant = 'blended',
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [renderError, setRenderError] = React.useState(Boolean(error));
    const [errorText, setErrorText] = React.useState(error ?? '');
    const [errorLineWidth, setErrorLineWidth] = React.useState(0);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isDark = variant === 'dark';
    const isBlended = variant === 'blended';
    const errorProgress = useSharedValue(error ? 1 : 0);

    const getKeyboardType = () => {
      switch (type) {
        case 'email':
          return 'email-address';
        case 'phone':
          return 'phone-pad';
        default:
          return 'default';
      }
    };

    const isPassword = type === 'password';
    const hasError = !!error;

    const handleFocus = (e: NativeSyntheticEvent<any>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: NativeSyntheticEvent<any>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    useEffect(() => {
      if (error) {
        // Clear any existing timer when error appears
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }

        setErrorText(error);
        setRenderError(true);
        errorProgress.value = withTiming(1, {
          duration: 240,
          easing: Easing.out(Easing.cubic),
        });
        return;
      }

      // Clear any existing timer before setting new one
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      errorProgress.value = withTiming(0, {
        duration: 180,
        easing: Easing.in(Easing.cubic),
      });

      // Set new timer to hide error after animation
      hideTimerRef.current = setTimeout(() => {
        setRenderError(false);
      }, 180);

      // Cleanup function to clear timer on unmount or dependency change
      return () => {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
      };
    }, [error]);

    const errorAnimatedStyle = useAnimatedStyle(() => ({
      opacity: errorProgress.value,
      transform: [{ translateY: (1 - errorProgress.value) * -6 }],
    }));

    const animatedLineWidth = useDerivedValue(() => errorLineWidth * errorProgress.value, [
      errorLineWidth,
    ]);

    const handleErrorLayout = (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      if (width !== errorLineWidth) {
        setErrorLineWidth(width);
      }
    };

    const getContainerStyle = () => {
      if (isDark) {
        return `border-b bg-transparent py-3 ${isFocused ? 'border-white' : hasError ? 'border-destructive' : 'border-white/30'}`;
      }
      if (isBlended) {
        if (hasError) {
          return 'h-[56px] rounded-2xl border border-destructive bg-red-50 px-4';
        }
        if (isFocused) {
          return 'h-[56px] rounded-2xl border border-black/20 bg-neutral-200 px-4';
        }
        return 'h-[56px] rounded-2xl border border-transparent bg-neutral-100 px-4';
      }
      return `h-[52px] rounded-sm border bg-surface px-4 ${isFocused ? 'border-primary-accent' : hasError ? 'border-destructive' : 'border-transparent'}`;
    };

    return (
      <View className={isDark ? 'mb-2' : 'mb-4'}>
        <View className="mb-1 flex-row">
          <Text
            className={`font-subtitle text-body ${isDark ? 'text-white/60' : 'text-text-primary'}`}>
            {label}
          </Text>
          {required && (
            <Text
              className={`font-subtitle text-body ${isDark ? 'text-white/60' : 'text-destructive'}`}>
              {' '}
              *
            </Text>
          )}
        </View>

        <View className={`flex-row items-center ${getContainerStyle()}`}>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={hasError ? '#F44336' : isFocused ? '#1B84FF' : isDark ? '#fff' : '#757575'}
              style={{ marginRight: 12 }}
            />
          )}

          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : '#9CA3AF'}
            keyboardType={getKeyboardType()}
            autoCapitalize={type === 'email' ? 'none' : 'sentences'}
            autoCorrect={false}
            secureTextEntry={isPassword && !isPasswordVisible}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`flex-1 font-body text-body ${isDark ? 'text-white' : 'text-text-primary'}`}
            {...props}
          />

          {isPassword && (
            <TouchableOpacity onPress={onTogglePasswordVisibility} className="ml-2">
              <Ionicons
                name={isPasswordVisible ? 'eye-off' : 'eye'}
                size={20}
                color={hasError ? '#F44336' : isDark ? '#fff' : '#757575'}
              />
            </TouchableOpacity>
          )}
        </View>

        {renderError && (
          <Animated.View style={errorAnimatedStyle}>
            <View className="mt-1.5" onLayout={handleErrorLayout}>
              <Text
                className={`mt-1 font-caption text-caption ${isDark ? 'text-white' : 'text-destructive'}`}>
                {errorText}
              </Text>
            </View>
          </Animated.View>
        )}
      </View>
    );
  }
);
