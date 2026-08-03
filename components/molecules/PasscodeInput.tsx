import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View, Text, TouchableOpacity, ViewProps } from 'react-native';
import { Icon } from '../atoms/Icon';
import { Keypad } from './Keypad';

export type PasscodeInputStatus = 'empty' | 'default' | 'error' | 'success';

export interface PasscodeInputProps extends ViewProps {
  title?: string;
  /** Override the title text size/style (defaults to the 40px auth title). */
  titleClassName?: string;
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
  showPasskey?: boolean;
  onFingerprint?: () => void;
  onPasskey?: () => void;
  className?: string;
  autoSubmit?: boolean;
  variant?: 'light' | 'dark';
}

const SHAKE_DURATION = 50;
const SHAKE_AMOUNT = 8;

export const PasscodeInput: React.FC<PasscodeInputProps> = ({
  title,
  titleClassName = 'text-auth-title',
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
  showPasskey = false,
  onFingerprint,
  onPasskey,
  className = '',
  autoSubmit = false,
  variant = 'light',
  ...rest
}) => {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [showPasscode, setShowPasscode] = useState(false);
  const isDark = variant === 'dark';

  // Animation values
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const prevErrorRef = useRef(Boolean(errorText));

  // Shake on error
  useEffect(() => {
    const hasError = Boolean(errorText);
    if (hasError && !prevErrorRef.current) {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: SHAKE_AMOUNT,
          duration: SHAKE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -SHAKE_AMOUNT,
          duration: SHAKE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: SHAKE_AMOUNT * 0.6,
          duration: SHAKE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -SHAKE_AMOUNT * 0.6,
          duration: SHAKE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, { toValue: 0, duration: SHAKE_DURATION, useNativeDriver: true }),
      ]).start();
    }
    prevErrorRef.current = hasError;
  }, [errorText]);

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
        if (passcode.length > 0) {
          setPasscode(passcode.slice(0, -1));
        }
      } else if (key === 'fingerprint') {
        onFingerprint?.();
      } else if (key === 'passkey') {
        onPasskey?.();
      } else if (key.match(/^[0-9]$/)) {
        if (passcode.length < length) {
          setPasscode(passcode + key);
        }
      }
    },
    [passcode, length, setPasscode, onFingerprint]
  );

  const ringColor = errorText
    ? '#ff2b3a'
    : successText
      ? '#00c454'
      : isDark
        ? 'rgba(255,255,255,0.10)'
        : 'rgba(23,23,23,0.10)';

  return (
    <View className={`flex-1 px-4 ${className}`} {...rest}>
      {title && (
        <View className="mt-12">
          <Text
            className={`font-headline leading-[1.1] ${titleClassName} ${isDark ? 'text-white' : 'text-text-primary'}`}>
            {title}
          </Text>
          {subtitle && (
            <Text
              className={`mt-2 font-body text-body ${isDark ? 'text-white/70' : 'text-text-secondary'}`}>
              {subtitle}
            </Text>
          )}
        </View>
      )}

      <Animated.View className="mt-12" style={{ transform: [{ translateX: shakeAnim }] }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row gap-x-3">
            {Array.from({ length }).map((_, index) => {
              const isFilled = index < passcode.length;
              const dotStyle = {
                width: 64,
                height: 64,
                ...(isFilled && (errorText || successText)
                  ? { borderWidth: 2, borderColor: ringColor }
                  : {}),
              };
              return (
                <View
                  key={index}
                  style={dotStyle}
                  className={`items-center justify-center rounded-full ${
                    isDark ? 'bg-white/10' : 'bg-[#171717]/10'
                  }`}>
                  {isFilled &&
                    (showPasscode ? (
                      <Text
                        className={`font-mono-semibold text-headline-2 ${isDark ? 'text-white' : 'text-text-primary'}`}>
                        {passcode[index]}
                      </Text>
                    ) : (
                      <View
                        className={`h-3 w-3 rounded-full ${
                          errorText
                            ? 'bg-destructive'
                            : successText
                              ? 'bg-success'
                              : isDark
                                ? 'bg-white'
                                : 'bg-text-primary'
                        }`}
                      />
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
                color={isDark ? '#fff' : '#ff3e00'}
                strokeWidth={2}
              />
            </TouchableOpacity>
          )}
        </View>

        {errorText && (
          <View className="mt-4 flex-row items-center gap-x-2">
            <Icon name="alert-circle" size={16} color="#ff2b3a" strokeWidth={2} />
            <Text className="font-body text-caption text-destructive">{errorText}</Text>
          </View>
        )}

        {successText && (
          <View className="mt-4 flex-row items-center gap-x-2">
            <Icon name="check-circle" size={16} color="#00c454" strokeWidth={2} />
            <Text className="font-body text-caption text-success">{successText}</Text>
          </View>
        )}
      </Animated.View>

      <View className="flex-1" />

      <Keypad
        onKeyPress={handleKeyPress}
        showFingerprint={showFingerprint}
        showPasskey={showPasskey}
        leftKey={showPasskey ? 'passkey' : showFingerprint ? 'fingerprint' : 'empty'}
        variant={variant}
        className="mb-6"
      />
    </View>
  );
};

PasscodeInput.displayName = 'PasscodeInput';
