import React from 'react';
import { View, Text, TouchableOpacity, ViewProps } from 'react-native';
import { Delete, Fingerprint, Trash } from 'lucide-react-native';
import { useKeypadFeedback } from '@/hooks/useKeypadFeedback';

const BACKSPACE_KEY = 'backspace';
const FINGERPRINT_KEY = 'fingerprint';
const DECIMAL_KEY = 'decimal';

type KeypadDigit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

const BASE_KEYPAD_LAYOUT = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const;

type KeypadKey = KeypadDigit | typeof BACKSPACE_KEY | typeof FINGERPRINT_KEY | typeof DECIMAL_KEY;

export interface KeypadProps extends ViewProps {
  onKeyPress: (key: KeypadKey) => void;
  showFingerprint?: boolean;
  leftKey?: 'empty' | 'fingerprint' | 'decimal';
  backspaceIcon?: 'trash' | 'delete';
  disabled?: boolean;
  className?: string;
  variant?: 'light' | 'dark';
}

export const Keypad: React.FC<KeypadProps> = ({
  onKeyPress,
  showFingerprint = false,
  leftKey = 'fingerprint',
  backspaceIcon = 'trash',
  disabled = false,
  className = '',
  variant = 'light',
  ...rest
}) => {
  const isDark = variant === 'dark';
  const iconColor = isDark ? '#fff' : '#121212';
  const triggerFeedback = useKeypadFeedback();

  const handlePress = (key: KeypadKey) => {
    if (disabled) return;
    triggerFeedback();
    onKeyPress(key);
  };

  const resolvedLeftKey: KeypadKey | null =
    leftKey === 'decimal'
      ? DECIMAL_KEY
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
                <View key={`empty-${rowIndex}-${keyIndex}`} className="mx-1.5 h-[72px] flex-1" />
              );
            }

            const isBackspace = key === BACKSPACE_KEY;
            const isFingerprint = key === FINGERPRINT_KEY;
            const isDecimal = key === DECIMAL_KEY;

            return (
              <TouchableOpacity
                key={key}
                className={`mx-1.5 h-[72px] flex-1 items-center justify-center rounded-full ${isDark ? 'active:bg-white/10' : 'active:bg-surface'}`}
                activeOpacity={0.7}
                onPress={() => handlePress(key)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={
                  isBackspace
                    ? 'Delete digit'
                    : isFingerprint
                      ? 'Use biometrics'
                      : isDecimal
                        ? 'Decimal point'
                        : `Digit ${key}`
                }>
                {isBackspace ? (
                  backspaceIcon === 'delete' ? (
                    <Delete size={24} color={iconColor} />
                  ) : (
                    <Trash size={24} color={iconColor} />
                  )
                ) : isFingerprint ? (
                  <Fingerprint size={24} color={iconColor} />
                ) : isDecimal ? (
                  <Text
                    className={`font-subtitle text-headline-2 ${isDark ? 'text-white' : 'text-text-primary'}`}>
                    .
                  </Text>
                ) : (
                  <Text
                    className={`font-subtitle text-[30px] ${isDark ? 'text-white' : 'text-text-primary'}`}>
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
