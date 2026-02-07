import React from 'react';
import { View, Text, TouchableOpacity, ViewProps } from 'react-native';
import { Fingerprint, Trash } from 'lucide-react-native';
import { useKeypadFeedback } from '@/hooks/useKeypadFeedback';

const BACKSPACE_KEY = 'backspace';
const FINGERPRINT_KEY = 'fingerprint';

const KEYPAD_LAYOUT = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [FINGERPRINT_KEY, '0', BACKSPACE_KEY],
] as const;

type KeypadKey = (typeof KEYPAD_LAYOUT)[number][number];

export interface KeypadProps extends ViewProps {
  onKeyPress: (key: KeypadKey) => void;
  showFingerprint?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'light' | 'dark';
}

export const Keypad: React.FC<KeypadProps> = ({
  onKeyPress,
  showFingerprint = false,
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

  return (
    <View className={className} {...rest}>
      {KEYPAD_LAYOUT.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          className={`flex-row justify-between ${rowIndex === 0 ? '' : 'mt-3'}`}>
          {row.map((key) => {
            const isBackspace = key === BACKSPACE_KEY;
            const isFingerprint = key === FINGERPRINT_KEY;

            if (isFingerprint && !showFingerprint) {
              return <View key={key} className="mx-1.5 h-[72px] flex-1" />;
            }

            return (
              <TouchableOpacity
                key={key}
                className={`mx-1.5 h-[72px] flex-1 items-center justify-center rounded-full ${isDark ? 'active:bg-white/10' : 'active:bg-surface'}`}
                activeOpacity={0.7}
                onPress={() => handlePress(key)}
                disabled={disabled}>
                {isBackspace ? (
                  <Trash size={24} color={iconColor} />
                ) : isFingerprint ? (
                  <Fingerprint size={24} color={iconColor} />
                ) : (
                  <Text
                    className={`font-subtitle text-headline-2 ${isDark ? 'text-white' : 'text-text-primary'}`}>
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
