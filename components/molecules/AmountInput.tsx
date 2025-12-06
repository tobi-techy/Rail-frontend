import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ViewProps, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon } from '../atoms/Icon';
import { sanitizeNumber } from '@/utils/sanitizeInput';

const BACKSPACE_KEY = 'backspace';

const DEFAULT_KEYPAD_LAYOUT = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', BACKSPACE_KEY],
] as const;

type KeypadKey = (typeof DEFAULT_KEYPAD_LAYOUT)[number][number] | string;

export type AmountInputStatus = 'empty' | 'default' | 'error' | 'success';

export interface AmountInputProps extends ViewProps {
  /**
   * Heading rendered at the top of the component (e.g "Order type: Market")
   */
  title?: string;
  /**
   * Callback for back button press
   */
  onBack?: () => void;
  /**
   * Callback for close button press
   */
  onClose?: () => void;
  /**
   * Numeric value of the input. When provided the component acts as a controlled input.
   */
  value?: string;
  /**
   * Default value used for the uncontrolled mode.
   */
  defaultValue?: string;
  /**
   * Callback fired whenever the amount string changes.
   */
  onValueChange?: (nextValue: string) => void;
  /**
   * Token/stock information displayed below the amount (e.g. "1.851851 AMC")
   */
  tokenInfo?: string;
  /**
   * Icon component or element for the token/stock
   */
  tokenIcon?: React.ReactNode;
  /**
   * Error message displayed below the token info
   */
  errorText?: string;
  /**
   * Success message displayed below the token info
   */
  successText?: string;
  /**
   * Quick amount selection buttons (e.g. [5, 10, 25, 50])
   */
  quickAmounts?: number[];
  /**
   * Callback fired when a quick amount is selected
   */
  onQuickAmountSelect?: (amount: number) => void;
  /**
   * Externally control the visual state of the amount text
   */
  status?: AmountInputStatus;
  /**
   * Symbol prefixed in front of the amount (e.g "$")
   */
  currencySymbol?: string;
  /**
   * Maximum number of fractional digits allowed. When undefined the value is not limited.
   */
  maxDecimals?: number;
  /**
   * Maximum number of numeric digits (excluding the decimal separator)
   */
  maxDigits?: number;
  /**
   * Optional keypad layout override. Each row should contain 3 keys.
   */
  keypadLayout?: readonly KeypadKey[][];
  /**
   * Toggle decimal support in the keypad
   */
  supportsDecimal?: boolean;
  /**
   * Additional container className (nativewind)
   */
  className?: string;
}

const ensureDisplayValue = (value: string) => {
  if (!value || value === '.') {
    return '0';
  }
  if (value.startsWith('.')) {
    return `0${value}`;
  }
  return value;
};

export const AmountInput: React.FC<AmountInputProps> = ({
  title,
  onBack,
  onClose,
  value,
  defaultValue = '0',
  onValueChange,
  tokenInfo,
  tokenIcon,
  errorText,
  successText,
  quickAmounts,
  onQuickAmountSelect,
  status,
  currencySymbol = '$',
  maxDecimals = 2,
  maxDigits,
  keypadLayout,
  supportsDecimal = true,
  className = '',
  ...rest
}) => {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const amount = useMemo(() => {
    if (isControlled) {
      return value ?? '0';
    }
    return internalValue;
  }, [isControlled, internalValue, value]);

  // Trigger animation when amount changes
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.08,
          useNativeDriver: true,
          speed: 50,
          bounciness: 10,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 80,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 40,
          bounciness: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [amount, scaleAnim, opacityAnim]);

  const setAmount = useCallback(
    (next: string) => {
      const normalized = next.length ? next : '0';
      if (!isControlled) {
        setInternalValue(normalized);
      }
      onValueChange?.(normalized);
    },
    [isControlled, onValueChange],
  );

  const handleDelete = useCallback(() => {
    if (!amount || amount.length <= 1) {
      setAmount('0');
      return;
    }
    const next = amount.slice(0, -1);
    if (next === '' || next === '0' || next === '0.') {
      setAmount('0');
    } else {
      setAmount(next);
    }
  }, [amount, setAmount]);

  const handleDigitPress = useCallback(
    (digit: string) => {
      if (!digit.match(/^[0-9]$/)) {
        return;
      }

      if (amount === '0') {
        setAmount(digit);
        return;
      }

      const candidate = `${amount}${digit}`;
      if (maxDigits) {
        const digitsCount = candidate.replace('.', '').length;
        if (digitsCount > maxDigits) {
          return;
        }
      }

      if (maxDecimals !== undefined) {
        const decimals = candidate.split('.')[1];
        if (decimals && decimals.length > maxDecimals) {
          return;
        }
      }

      setAmount(candidate);
    },
    [amount, maxDecimals, maxDigits, setAmount],
  );

  const handleDecimalPress = useCallback(() => {
    if (!supportsDecimal) {
      return;
    }
    if (amount.includes('.')) {
      return;
    }

    if (amount.length === 0 || amount === '0') {
      setAmount('0.');
    } else {
      setAmount(`${amount}.`);
    }
  }, [amount, setAmount, supportsDecimal]);

  const handleKeypadPress = useCallback(
    (key: KeypadKey) => {
      // Haptic feedback
      if (key === BACKSPACE_KEY) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        handleDelete();
      } else if (key === '.') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handleDecimalPress();
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handleDigitPress(key);
      }
    },
    [handleDecimalPress, handleDelete, handleDigitPress],
  );

  const handleQuickAmount = useCallback(
    (quickAmount: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setAmount(quickAmount.toString());
      onQuickAmountSelect?.(quickAmount);
    },
    [onQuickAmountSelect, setAmount],
  );

  const resolvedStatus: AmountInputStatus = useMemo(() => {
    if (status) {
      return status;
    }
    if (errorText) {
      return 'error';
    }
    if (successText) {
      return 'success';
    }
    const display = ensureDisplayValue(amount);
    return display === '0' || display === '0.' ? 'empty' : 'default';
  }, [amount, errorText, status, successText]);

  const displayValue = useMemo(() => ensureDisplayValue(amount), [amount]);

  const keypadRows = useMemo(() => {
    if (keypadLayout && keypadLayout.length) {
      return keypadLayout;
    }
    return DEFAULT_KEYPAD_LAYOUT;
  }, [keypadLayout]);

  const amountColor =
    resolvedStatus === 'error'
      ? 'text-red-500'
      : resolvedStatus === 'empty'
      ? 'text-gray-300'
      : 'text-gray-900';

  return (
    <View className={`flex-1 bg-white px-4 ${className}`} {...rest}>
      {/* Header */}
      {(title || onBack || onClose) && (
        <View className="flex-row items-center justify-between py-4">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onBack?.();
            }}
            className="h-10 w-10 items-center justify-center"
            activeOpacity={0.7}
          >
            {onBack && (
              <Icon name="chevron-left" size={24} color="#1F2937" />
            )}
          </TouchableOpacity>

          {title && (
            <Text className="flex-1 text-center text-base font-body-semibold text-gray-900">
              {title}
            </Text>
          )}

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose?.();
            }}
            className="h-10 w-10 items-center justify-center"
            activeOpacity={0.7}
          >
            {onClose && <Icon name="x" size={24} color="#1F2937" />}
          </TouchableOpacity>
        </View>
      )}

      {/* Amount Display */}
      <View className="mt-16 items-center">
        <Animated.Text
          className={`text-[80px] font-body-bold leading-none ${amountColor}`}
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }}
        >
          {currencySymbol}
          {displayValue}
        </Animated.Text>

        {/* Token Info */}
        {tokenInfo && (
          <View className="mt-6 flex-row items-center gap-x-2">
            {tokenIcon}
            <Text className="text-base font-body-medium text-gray-700">
              {sanitizeNumber(tokenInfo)}
            </Text>
          </View>
        )}

        {/* Error/Success Message */}
        {errorText && (
          <Text className="mt-6 text-sm font-body-medium text-red-500">
            {String(errorText)}
          </Text>
        )}
        {successText && (
          <Text className="mt-6 text-sm font-body-medium text-green-500">
            {String(successText)}
          </Text>
        )}
      </View>


   <View className="mt-auto pb-8 gap-y-4">
      {/* Quick Amount Buttons */}
      {quickAmounts && quickAmounts.length > 0 && (
        <View className="mt-12 flex-row items-center justify-center gap-x-3 px-4">
          {quickAmounts.map((qa) => (
            <TouchableOpacity
              key={qa}
              onPress={() => handleQuickAmount(qa)}
              activeOpacity={0.7}
              className="flex-1 rounded-full border-2 border-gray-800 py-3"
            >
              <Text className="text-center text-base font-body-semibold text-gray-900">
                {currencySymbol}
                {qa}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Keypad */}
       <View className=" pb-8">
        {keypadRows.map((row, rowIndex) => (
          <View
            key={`row-${rowIndex}`}
            className={`flex-row items-center justify-around ${
              rowIndex === 0 ? '' : 'mt-3'
            }`}
          >
            {row.map((key) => {
              const isBackspace = key === BACKSPACE_KEY;
              const isDecimal = key === '.';
              const isDisabled =
                (!supportsDecimal && isDecimal) ||
                (isDecimal && amount.includes('.'));

              return (
                <TouchableOpacity
                  key={key.toString()}
                  className="h-20 w-20 items-center justify-center"
                  activeOpacity={isDisabled ? 1 : 0.6}
                  onPress={() => !isDisabled && handleKeypadPress(key)}
                >
                  {isBackspace ? (
                    <Icon
                      name="delete-back-outline"
                      library="ionicons"
                      size={32}
                      color="#1F2937"
                    />
                  ) : (
                    <Text
                      className={`text-[32px] font-body-semibold ${
                        isDisabled ? 'text-gray-300' : 'text-gray-900'
                      }`}
                    >
                      {key}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
    
    
    </View>
  );
};

AmountInput.displayName = 'AmountInput';
