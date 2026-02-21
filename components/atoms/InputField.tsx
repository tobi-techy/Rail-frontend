import React, { forwardRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
  NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from './SafeIonicons';

interface InputFieldProps extends Omit<TextInputProps, 'onFocus' | 'onBlur'> {
  label?: string;
  error?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'phone';
  icon?: keyof typeof Ionicons.glyphMap;
  isPasswordVisible?: boolean;
  onTogglePasswordVisibility?: () => void;
  onFocus?: (e: NativeSyntheticEvent<any>) => void;
  onBlur?: (e: NativeSyntheticEvent<any>) => void;
  variant?: 'light' | 'dark' | 'blended';
  density?: 'default' | 'compact';
  containerClassName?: string;
  inputClassName?: string;
}

const TIMING = { duration: 200, easing: Easing.out(Easing.cubic) };

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
      density = 'default',
      containerClassName = '',
      inputClassName = '',
      ...props
    },
    ref
  ) => {
    const isFocused = useSharedValue(false);
    const errorOpacity = useSharedValue(error ? 1 : 0);
    const [errorText, setErrorText] = React.useState(error ?? '');
    const [focused, setFocused] = React.useState(false);

    const isDark = variant === 'dark';
    const hasError = !!error;
    const isPassword = type === 'password';

    // Update error animation
    React.useEffect(() => {
      if (error) {
        setErrorText(error);
        errorOpacity.value = withTiming(1, TIMING);
      } else {
        errorOpacity.value = withTiming(0, { duration: 160, easing: Easing.in(Easing.cubic) });
      }
    }, [error]);

    const handleFocus = useCallback(
      (e: NativeSyntheticEvent<any>) => {
        isFocused.value = true;
        setFocused(true);
        onFocus?.(e);
      },
      [onFocus]
    );

    const handleBlur = useCallback(
      (e: NativeSyntheticEvent<any>) => {
        isFocused.value = false;
        setFocused(false);
        onBlur?.(e);
      },
      [onBlur]
    );

    const errorAnimStyle = useAnimatedStyle(() => ({
      opacity: errorOpacity.value,
      transform: [{ translateY: (1 - errorOpacity.value) * -4 }],
    }));

    const getKeyboardType = () => {
      switch (type) {
        case 'email':
          return 'email-address' as const;
        case 'phone':
          return 'phone-pad' as const;
        default:
          return 'default' as const;
      }
    };

    const isCompact = density === 'compact';

    // Container styles — MoonPay-inspired
    const containerClass = isDark
      ? `border-b ${isCompact ? 'py-2.5' : 'py-3'} bg-transparent ${
          focused ? 'border-white' : hasError ? 'border-destructive' : 'border-white/30'
        }`
      : variant === 'light'
        ? `rounded-xl px-3 ${isCompact ? 'py-3.5' : 'py-4'} ${
            hasError
              ? 'border border-red-300 bg-red-50'
              : focused
                ? 'border border-gray-400 bg-white'
                : 'border border-gray-200 bg-white'
          }`
        : `rounded-xl px-2 ${isCompact ? 'py-4' : 'py-6'} ${
            hasError
              ? 'border border-destructive/40 bg-red-50'
              : focused
                ? 'border border-black/10 bg-neutral-100'
                : 'border border-transparent bg-neutral-100'
          }`;

    const textColor = isDark ? 'text-white' : 'text-text-primary';
    const placeholderColor = isDark ? 'rgba(255,255,255,0.4)' : '#9CA3AF';
    const labelColor = isDark ? 'text-white/60' : 'text-text-primary';

    return (
      <View className="mb-3">
        {label && (
          <View className="mb-1.5 flex-row">
            <Text className={`font-subtitle text-caption ${labelColor}`}>{label}</Text>
            {required && (
              <Text
                className={`font-subtitle text-caption ${isDark ? 'text-white/60' : 'text-destructive'}`}>
                {' '}
                *
              </Text>
            )}
          </View>
        )}

        <View className={`flex-row items-center ${containerClass} ${containerClassName}`}>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={hasError ? '#F44336' : isDark ? '#fff' : '#9CA3AF'}
              style={{ marginRight: 10 }}
            />
          )}

          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={placeholderColor}
            keyboardType={getKeyboardType()}
            autoCapitalize={type === 'email' ? 'none' : 'sentences'}
            autoCorrect={false}
            secureTextEntry={isPassword && !isPasswordVisible}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`flex-1 font-body ${isCompact ? 'text-[17px]' : 'text-body'} ${textColor} ${inputClassName}`}
            style={{ paddingVertical: 0 }}
            {...props}
          />

          {isPassword && (
            <TouchableOpacity
              onPress={onTogglePasswordVisibility}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="ml-2">
              <Ionicons
                name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={isDark ? '#fff' : '#9CA3AF'}
              />
            </TouchableOpacity>
          )}
        </View>

        {(hasError || errorText) && (
          <Animated.View style={errorAnimStyle}>
            <Text
              className={`mt-1.5 font-caption text-caption ${isDark ? 'text-white' : 'text-destructive'}`}>
              {errorText}
            </Text>
          </Animated.View>
        )}
      </View>
    );
  }
);
