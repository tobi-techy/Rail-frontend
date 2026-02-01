import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ViewProps } from 'react-native';
import { Icon } from '../atoms/Icon';
import { Keypad } from './Keypad';

export type PasscodeInputStatus = 'empty' | 'default' | 'error' | 'success';

export interface PasscodeInputProps extends ViewProps {
  title?: string;
  subtitle?: string;
  length?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (nextValue: string) => void;
  onComplete?: (passcode: string) => void;
  errorText?: string;
  successText?: string;
  status?: PasscodeInputStatus;
  showToggle?: boolean;
  showFingerprint?: boolean;
  onFingerprint?: () => void;
  className?: string;
  autoSubmit?: boolean;
  variant?: 'light' | 'dark';
}

export const PasscodeInput: React.FC<PasscodeInputProps> = ({
  title,
  subtitle,
  length = 4,
  value,
  defaultValue = '',
  onValueChange,
  onComplete,
  errorText,
  successText,
  status,
  showToggle = false,
  showFingerprint = false,
  onFingerprint,
  className = '',
  autoSubmit = false,
  variant = 'light',
  ...rest
}) => {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [showPasscode, setShowPasscode] = useState(false);
  const isDark = variant === 'dark';

  const passcode = useMemo(
    () => (isControlled ? (value ?? '') : internalValue),
    [isControlled, internalValue, value]
  );

  const setPasscode = useCallback(
    (next: string) => {
      const normalized = next.slice(0, length);
      if (!isControlled) setInternalValue(normalized);
      onValueChange?.(normalized);
      if (normalized.length === length) onComplete?.(normalized);
    },
    [isControlled, length, onValueChange, onComplete]
  );

  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === 'backspace') {
        if (passcode.length > 0) setPasscode(passcode.slice(0, -1));
      } else if (key === 'fingerprint') {
        onFingerprint?.();
      } else if (key.match(/^[0-9]$/)) {
        if (passcode.length < length) setPasscode(passcode + key);
      }
    },
    [passcode, length, setPasscode, onFingerprint]
  );

  return (
    <View className={`flex-1 px-6 ${className}`} {...rest}>
      {title && (
        <View className="mt-12">
          <Text className={`font-display text-display-lg ${isDark ? 'text-white' : 'text-text-primary'}`}>{title}</Text>
          {subtitle && (
            <Text className={`mt-2 font-body text-body ${isDark ? 'text-white/70' : 'text-text-secondary'}`}>{subtitle}</Text>
          )}
        </View>
      )}

      <View className="mt-12">
        <View className="flex-row items-center justify-between">
          <View className="flex-row gap-x-3">
            {Array.from({ length }).map((_, index) => {
              const isFilled = index < passcode.length;
              return (
                <View
                  key={index}
                  className={`h-14 w-14 items-center justify-center rounded-full ${isDark ? 'bg-white/20' : 'bg-surface'}`}>
                  {isFilled &&
                    (showPasscode ? (
                      <Text className={`font-headline text-headline-2 ${isDark ? 'text-white' : 'text-text-primary'}`}>
                        {passcode[index]}
                      </Text>
                    ) : (
                      <View className={`h-3 w-3 rounded-full ${isDark ? 'bg-white' : 'bg-text-primary'}`} />
                    ))}
                </View>
              );
            })}
          </View>

          {showToggle && (
            <TouchableOpacity
              onPress={() => setShowPasscode(!showPasscode)}
              className={`h-12 w-12 items-center justify-center rounded-full ${isDark ? 'bg-white/20' : 'bg-surface'}`}
              activeOpacity={0.7}>
              <Icon
                name={showPasscode ? 'eye-off' : 'eye'}
                size={22}
                color={isDark ? '#fff' : '#FF5A00'}
                strokeWidth={2}
              />
            </TouchableOpacity>
          )}
        </View>

        {errorText && (
          <View className="mt-4 flex-row items-center gap-x-2">
            <Icon name="alert-circle" size={16} color="#F44336" strokeWidth={2} />
            <Text className="font-body text-caption text-destructive">{errorText}</Text>
          </View>
        )}

        {successText && (
          <View className="mt-4 flex-row items-center gap-x-2">
            <Icon name="check-circle" size={16} color="#00C853" strokeWidth={2} />
            <Text className="font-body text-caption text-success">{successText}</Text>
          </View>
        )}
      </View>

      <View className="flex-1" />

      <Keypad onKeyPress={handleKeyPress} showFingerprint={showFingerprint} variant={variant} className="mb-6" />
    </View>
  );
};

PasscodeInput.displayName = 'PasscodeInput';
