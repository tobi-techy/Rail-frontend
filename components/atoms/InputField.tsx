import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
  NativeSyntheticEvent,
} from 'react-native';
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
  variant?: 'light' | 'dark';
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
      variant = 'light',
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const isDark = variant === 'dark';

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

        <View
          className={`flex-row items-center ${
            isDark ? 'border-b bg-transparent py-3' : 'h-[52px] rounded-sm border bg-surface px-4'
          } ${
            isFocused
              ? isDark
                ? 'border-white'
                : 'border-primary-accent'
              : hasError
                ? 'border-destructive'
                : isDark
                  ? 'border-white/30'
                  : 'border-transparent'
          }`}>
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
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : '#757575'}
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

        {hasError && (
          <Text
            className={`mt-1 font-caption text-caption ${isDark ? 'text-white' : 'text-destructive'}`}>
            {error}
          </Text>
        )}
      </View>
    );
  }
);
