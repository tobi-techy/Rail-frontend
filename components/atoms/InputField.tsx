import React, { forwardRef, useMemo, useState } from 'react';
import {
  NativeSyntheticEvent,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from './SafeIonicons';

export interface InputFieldProps extends Omit<TextInputProps, 'onFocus' | 'onBlur'> {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'phone';
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  isPasswordVisible?: boolean;
  onTogglePasswordVisibility?: () => void;
  onFocus?: (e: NativeSyntheticEvent<any>) => void;
  onBlur?: (e: NativeSyntheticEvent<any>) => void;
  variant?: 'light' | 'dark' | 'blended';
  density?: 'default' | 'compact';
  containerClassName?: string;
  inputWrapperClassName?: string;
  inputClassName?: string;
  leftAccessory?: React.ReactNode;
  rightAccessory?: React.ReactNode;
}

const getKeyboardType = (type: InputFieldProps['type']) => {
  switch (type) {
    case 'email':
      return 'email-address' as const;
    case 'phone':
      return 'phone-pad' as const;
    default:
      return 'default' as const;
  }
};

export const InputField = forwardRef<TextInput, InputFieldProps>(
  (
    {
      label,
      helperText,
      error,
      required = false,
      type = 'text',
      icon,
      rightIcon,
      onRightIconPress,
      isPasswordVisible = false,
      onTogglePasswordVisibility,
      onFocus,
      onBlur,
      variant = 'light',
      density = 'default',
      containerClassName = '',
      inputWrapperClassName = '',
      inputClassName = '',
      leftAccessory,
      rightAccessory,
      autoCapitalize,
      autoCorrect,
      keyboardType,
      placeholderTextColor,
      multiline,
      editable = true,
      style,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const hasError = Boolean(error);
    const isPassword = type === 'password';
    const isDark = variant === 'dark';
    const isCompact = density === 'compact';

    const labelColorClass = isDark ? 'text-white/70' : 'text-text-secondary';
    const textColorClass = isDark ? 'text-white' : 'text-text-primary';
    const secondaryTextColorClass = isDark ? 'text-white/70' : 'text-text-secondary';

    const borderColor = useMemo(() => {
      if (!editable) return '#D4D4D4';
      if (hasError) return '#DC2626';
      if (focused) return isDark ? '#FFFFFF' : '#111827';
      return isDark ? 'rgba(255,255,255,0.28)' : '#D4D4D8';
    }, [editable, focused, hasError, isDark]);

    const backgroundColor = isDark ? 'rgba(255,255,255,0.06)' : editable ? '#FFFFFF' : '#F5F5F5';

    const handleFocus = (e: NativeSyntheticEvent<any>) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: NativeSyntheticEvent<any>) => {
      setFocused(false);
      onBlur?.(e);
    };

    const showRightAction = Boolean(
      rightAccessory ||
      (isPassword && onTogglePasswordVisibility) ||
      (rightIcon && onRightIconPress)
    );

    return (
      <View className={`w-full ${containerClassName}`}>
        {label ? (
          <View className="mb-2 flex-row items-center">
            <Text className={`font-subtitle text-[13px] leading-[18px] ${labelColorClass}`}>
              {label}
            </Text>
            {required ? (
              <Text className={`ml-1 font-subtitle text-[13px] leading-[18px] ${labelColorClass}`}>
                *
              </Text>
            ) : null}
          </View>
        ) : null}

        <View
          className={`w-full flex-row rounded-xl border px-4 ${
            multiline
              ? 'min-h-[110px] items-start py-3'
              : isCompact
                ? 'h-12 items-center'
                : 'h-14 items-center'
          } ${editable ? '' : 'opacity-70'} ${inputWrapperClassName}`}
          style={{ borderColor, backgroundColor }}>
          {leftAccessory ? (
            <View className="mr-3 items-center justify-center">{leftAccessory}</View>
          ) : null}

          {!leftAccessory && icon ? (
            <Ionicons
              name={icon}
              size={20}
              color={hasError ? '#DC2626' : isDark ? '#FFFFFF' : '#9CA3AF'}
              style={{ marginRight: 10 }}
            />
          ) : null}

          <TextInput
            ref={ref}
            editable={editable}
            onFocus={handleFocus}
            onBlur={handleBlur}
            keyboardType={keyboardType ?? getKeyboardType(type)}
            autoCapitalize={autoCapitalize ?? (type === 'email' ? 'none' : 'sentences')}
            autoCorrect={autoCorrect ?? false}
            secureTextEntry={isPassword && !isPasswordVisible}
            placeholderTextColor={
              placeholderTextColor ?? (isDark ? 'rgba(255,255,255,0.55)' : '#B3B3B3')
            }
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
            className={`flex-1 font-body ${isCompact ? 'text-[16px]' : 'text-body'} leading-[22px] ${textColorClass} ${inputClassName}`}
            style={[{ paddingVertical: 0 }, style]}
            accessibilityLabel={
              props.accessibilityLabel || label || props.placeholder || 'Input field'
            }
            {...props}
          />

          {showRightAction ? (
            <View className="ml-2 items-center justify-center">
              {rightAccessory ? (
                rightAccessory
              ) : isPassword && onTogglePasswordVisibility ? (
                <TouchableOpacity
                  onPress={onTogglePasswordVisibility}
                  className="min-h-[44px] min-w-[44px] items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}>
                  <Ionicons
                    name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={isDark ? '#FFFFFF' : '#6B7280'}
                  />
                </TouchableOpacity>
              ) : rightIcon && onRightIconPress ? (
                <TouchableOpacity
                  onPress={onRightIconPress}
                  className="min-h-[44px] min-w-[44px] items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Input action">
                  <Ionicons name={rightIcon} size={20} color={isDark ? '#FFFFFF' : '#6B7280'} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>

        {hasError ? (
          <Text
            className={`mt-2 font-caption text-caption ${isDark ? 'text-white/85' : 'text-destructive'}`}>
            {error}
          </Text>
        ) : helperText ? (
          <Text className={`mt-2 font-caption text-caption ${secondaryTextColorClass}`}>
            {helperText}
          </Text>
        ) : null}
      </View>
    );
  }
);

InputField.displayName = 'InputField';
