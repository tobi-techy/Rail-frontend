import React from 'react';
import { View, Text, TouchableOpacity, ViewProps } from 'react-native';
import { useKeypadFeedback } from '@/hooks/useKeypadFeedback';
import { Delete01Icon, FingerPrintIcon, Key01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';

const BACKSPACE_KEY = 'backspace';
const FINGERPRINT_KEY = 'fingerprint';
const PASSKEY_KEY = 'passkey';
const DECIMAL_KEY = 'decimal';

type KeypadDigit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

const BASE_KEYPAD_LAYOUT = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const;

type KeypadKey =
  | KeypadDigit
  | typeof BACKSPACE_KEY
  | typeof FINGERPRINT_KEY
  | typeof PASSKEY_KEY
  | typeof DECIMAL_KEY;

export interface KeypadProps extends ViewProps {
  onKeyPress: (key: KeypadKey) => void;
  showFingerprint?: boolean;
  showPasskey?: boolean;
  leftKey?: 'empty' | 'fingerprint' | 'decimal' | 'passkey';
  backspaceIcon?: 'trash' | 'delete';
  disabled?: boolean;
  className?: string;
  variant?: 'light' | 'dark';
}

export const Keypad: React.FC<KeypadProps> = ({
  onKeyPress,
  showFingerprint = false,
  showPasskey = false,
  leftKey = 'fingerprint',
  backspaceIcon = 'trash',
  disabled = false,
  className = '',
  variant = 'light',
  ...rest
}) => {
  const isDark = variant === 'dark';
  const iconColor = isDark ? '#fff' : '#000';
  const triggerFeedback = useKeypadFeedback();

  const handlePress = (key: KeypadKey) => {
    if (disabled) return;
    triggerFeedback();
    onKeyPress(key);
  };

  const resolvedLeftKey: KeypadKey | null =
    leftKey === 'decimal'
      ? DECIMAL_KEY
      : leftKey === 'passkey'
        ? showPasskey
          ? PASSKEY_KEY
          : null
        : leftKey === 'empty'
          ? null
          : showFingerprint
            ? FINGERPRINT_KEY
            : null;

  const keypadLayout: (KeypadKey | null)[][] = [
    ...BASE_KEYPAD_LAYOUT.map((row) => [...row]),
    [resolvedLeftKey, '0', BACKSPACE_KEY],
  ];

  return (
    <View className={className} {...rest}>
      {keypadLayout.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          className={`flex-row justify-between ${rowIndex === 0 ? '' : 'mt-3'}`}>
          {row.map((key, keyIndex) => {
            if (!key) {
              return (
                <View key={`empty-${rowIndex}-${keyIndex}`} className="mx-1.5 h-keypad flex-1" />
              );
            }

            const isBackspace = key === BACKSPACE_KEY;
            const isFingerprint = key === FINGERPRINT_KEY;
            const isDecimal = key === DECIMAL_KEY;
            const isPasskey = key === PASSKEY_KEY;

            return (
              <TouchableOpacity
                key={key}
                className={`mx-1.5 h-keypad flex-1 items-center justify-center rounded-full ${isDark ? 'active:bg-white/10' : 'active:bg-surface'}`}
                activeOpacity={0.7}
                onPress={() => handlePress(key)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={
                  isBackspace
                    ? 'Delete01Icon digit'
                    : isFingerprint
                      ? 'Use biometrics'
                      : isPasskey
                        ? 'Use passkey'
                        : isDecimal
                          ? 'Decimal point'
                          : `Digit ${key}`
                }>
                {isBackspace ? (
                  backspaceIcon === 'delete' ? (
                    <HugeiconsIcon icon={Delete01Icon} size={24} color={iconColor} />
                  ) : (
                    <HugeiconsIcon icon={Delete01Icon} size={24} color={iconColor} />
                  )
                ) : isFingerprint ? (
                  <HugeiconsIcon icon={FingerPrintIcon} size={24} color={iconColor} />
                ) : isPasskey ? (
                  <HugeiconsIcon icon={Key01Icon} size={24} color={iconColor} />
                ) : isDecimal ? (
                  <Text
                    className={`font-subtitle text-headline-2 ${isDark ? 'text-white' : 'text-text-primary'}`}>
                    .
                  </Text>
                ) : (
                  <Text
                    className={`font-subtitle text-keypad ${isDark ? 'text-white' : 'text-text-primary'}`}>
                    {key}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

Keypad.displayName = 'Keypad';
