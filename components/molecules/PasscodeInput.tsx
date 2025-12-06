import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ViewProps,
} from 'react-native';
import { Icon } from '../atoms/Icon';
import { Button } from '../ui/Button';

const BACKSPACE_KEY = 'backspace';

const KEYPAD_LAYOUT = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', BACKSPACE_KEY],
] as const;

type KeypadKey = (typeof KEYPAD_LAYOUT)[number][number] | string;

export type PasscodeInputStatus = 'empty' | 'default' | 'error' | 'success';

export interface PasscodeInputProps extends ViewProps {
  /**
   * Title displayed at the top (e.g., "Create passcode")
   */
  title?: string;
  /**
   * Subtitle text below the title
   */
  subtitle?: string;
  /**
   * Number of passcode digits (default: 6)
   */
  length?: number;
  /**
   * Current passcode value
   */
  value?: string;
  /**
   * Default value for uncontrolled mode
   */
  defaultValue?: string;
  /**
   * Callback fired when passcode changes
   */
  onValueChange?: (nextValue: string) => void;
  /**
   * Callback fired when passcode is complete
   */
  onComplete?: (passcode: string) => void;
  /**
   * Error message displayed below dots
   */
  errorText?: string;
  /**
   * Success message displayed below dots
   */
  successText?: string;
  /**
   * Visual status of the passcode input
   */
  status?: PasscodeInputStatus;
  /**
   * Label for the continue button
   */
  continueLabel?: string;
  /**
   * Callback fired when continue is pressed
   */
  onContinue?: (passcode: string) => void;
  /**
   * Disable the continue button
   */
  continueDisabled?: boolean;
  /**
   * Show the continue button
   */
  showContinueButton?: boolean;
  /**
   * Additional container className
   */
  className?: string;
  /**
   * Auto-submit when complete
   */
  autoSubmit?: boolean;
}

export const PasscodeInput: React.FC<PasscodeInputProps> = ({
  title,
  subtitle,
  length = 6,
  value,
  defaultValue = '',
  onValueChange,
  onComplete,
  errorText,
  successText,
  status,
  continueLabel = 'Continue',
  onContinue,
  continueDisabled,
  showContinueButton = true,
  className = '',
  autoSubmit = false,
  ...rest
}) => {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);

  const passcode = useMemo(() => {
    if (isControlled) {
      return value ?? '';
    }
    return internalValue;
  }, [isControlled, internalValue, value]);

  const setPasscode = useCallback(
    (next: string) => {
      const normalized = next.slice(0, length);
      if (!isControlled) {
        setInternalValue(normalized);
      }
      onValueChange?.(normalized);

      // Auto-submit when complete
      if (normalized.length === length) {
        onComplete?.(normalized);
        if (autoSubmit && onContinue) {
          onContinue(normalized);
        }
      }
    },
    [isControlled, length, onValueChange, onComplete, autoSubmit, onContinue],
  );

  const handleDelete = useCallback(() => {
    if (!passcode || passcode.length === 0) {
      return;
    }
    const next = passcode.slice(0, -1);
    setPasscode(next);
  }, [passcode, setPasscode]);

  const handleDigitPress = useCallback(
    (digit: string) => {
      if (!digit.match(/^[0-9]$/)) {
        return;
      }

      if (passcode.length >= length) {
        return;
      }

      const candidate = `${passcode}${digit}`;
      setPasscode(candidate);
    },
    [passcode, length, setPasscode],
  );

  const handleKeypadPress = useCallback(
    (key: KeypadKey) => {
      if (key === BACKSPACE_KEY) {
        handleDelete();
      } else if (key) {
        handleDigitPress(key);
      }
    },
    [handleDelete, handleDigitPress],
  );

  const handleContinue = useCallback(() => {
    onContinue?.(passcode);
  }, [passcode, onContinue]);

  const resolvedStatus: PasscodeInputStatus = useMemo(() => {
    if (status) {
      return status;
    }
    if (errorText) {
      return 'error';
    }
    if (successText) {
      return 'success';
    }
    return passcode.length === 0 ? 'empty' : 'default';
  }, [passcode, errorText, successText, status]);

  const dotColor = useMemo(() => {
    switch (resolvedStatus) {
      case 'error':
        return '#FB088F';
      case 'success':
        return '#10B981';
      default:
        return '#070914';
    }
  }, [resolvedStatus]);

  const continueIsDisabled =
    continueDisabled !== undefined
      ? continueDisabled
      : passcode.length !== length;

  return (
    <View
      className={`flex-1 bg-white px-6 py-6 ${className}`}
      {...rest}
    >
      {/* Header */}
      {title && (
        <View className="mt-8">
          <Text className="text-center text-[34px] font-body-bold text-[#070914]">
            {title}
          </Text>
          {subtitle && (
            <Text className="mt-3 text-center text-[16px] font-body-medium text-[#6B7280]">
              {subtitle}
            </Text>
          )}
        </View>
      )}

      {/* Passcode Dots */}
      <View className="mt-12 items-center">
        <View className="flex-row gap-x-4">
          {Array.from({ length }).map((_, index) => {
            const isFilled = index < passcode.length;
            return (
              <View
                key={index}
                className={`h-4 w-4 rounded-full ${
                  isFilled ? '' : 'border-2'
                }`}
                style={{
                  backgroundColor: isFilled ? dotColor : 'transparent',
                  borderColor: isFilled ? dotColor : '#D1D5DB',
                }}
              />
            );
          })}
        </View>

        {/* Messages */}
        {errorText && (
          <View className="mt-6 flex-row items-center gap-x-2">
            <Icon
              name="alert-triangle"
              size={16}
              color="#FB088F"
              strokeWidth={2}
            />
            <Text className="text-sm font-body-medium text-[#FB088F]">
              {errorText}
            </Text>
          </View>
        )}

        {successText && (
          <View className="mt-6 flex-row items-center gap-x-2">
            <Icon
              name="check-circle"
              size={16}
              color="#10B981"
              strokeWidth={2}
            />
            <Text className="text-sm font-body-medium text-[#10B981]">
              {successText}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-1" />

      {/* Keypad */}
      <View className="mb-8">
        {KEYPAD_LAYOUT.map((row, rowIndex) => (
          <View
            key={`row-${rowIndex}`}
            className={`flex-row items-center justify-between ${
              rowIndex === 0 ? '' : 'mt-4'
            }`}
          >
            {row.map((key, keyIndex) => {
              const isBackspace = key === BACKSPACE_KEY;
              const isEmpty = key === '';

              if (isEmpty) {
                return <View key={`empty-${keyIndex}`} className="mx-1 h-16 flex-1" />;
              }

              return (
                <TouchableOpacity
                  key={key.toString()}
                  className="mx-1 h-16 flex-1 items-center justify-center rounded-full bg-[#F4F4F5]"
                  activeOpacity={0.7}
                  onPress={() => handleKeypadPress(key)}
                >
                  {isBackspace ? (
                    <Icon
                      name="backspace"
                      library="ionicons"
                      size={26}
                      color="#070914"
                    />
                  ) : (
                    <Text className="text-[24px] font-body-semibold text-[#070914]">
                      {key}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Continue Button */}
      {showContinueButton && (
        <View>
          <Button
            title={continueLabel}
            onPress={handleContinue}
            disabled={continueIsDisabled}
            className="bg-[#070914]"
          />
        </View>
      )}
    </View>
  );
};

PasscodeInput.displayName = 'PasscodeInput';
