import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { View, Text, Dimensions, Keyboard } from 'react-native';
import { OtpInput } from 'react-native-otp-entry';

interface OTPInputProps {
  length?: number;
  onComplete?: (otp: string) => void;
  error?: string;
  isInvalid?: boolean;
  autoValidate?: boolean;
  variant?: 'light' | 'dark';
}

interface OTPInputRef {
  clear: () => void;
  focus: () => void;
  blur: () => void;
  setValue: (value: string) => void;
}

const { width } = Dimensions.get('window');

const OTPInputComponent: React.ForwardRefRenderFunction<OTPInputRef, OTPInputProps> = (
  { length = 6, onComplete, error, isInvalid = false, autoValidate = false, variant = 'light' },
  ref
) => {
  const [hasError, setHasError] = useState(isInvalid);
  const otpRef = useRef<any>(null);
  const isDark = variant === 'dark';

  useImperativeHandle(
    ref,
    () => ({
      clear: () => otpRef.current?.clear(),
      focus: () => otpRef.current?.focus(),
      blur: () => otpRef.current?.blur(),
      setValue: (value: string) => otpRef.current?.setValue(value),
    }),
    []
  );

  useEffect(() => {
    setHasError(isInvalid);
  }, [isInvalid]);

  const handleTextChange = (text: string) => {
    if (hasError && text.length > 0) setHasError(false);
  };

  const handleFilled = (text: string) => {
    onComplete?.(text);
    if (autoValidate) Keyboard.dismiss();
  };

  const boxSize = Math.min((width - 60) / length - 4, 90);

  const colors = isDark
    ? {
        border: hasError ? '#F44336' : 'rgba(255,255,255,0.2)',
        bg: hasError ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.1)',
        focusBorder: hasError ? '#F44336' : 'rgba(255,255,255,0.5)',
        focusBg: 'rgba(255,255,255,0.15)',
        filledBorder: hasError ? '#F44336' : 'rgba(255,255,255,0.4)',
        filledBg: 'rgba(255,255,255,0.1)',
        text: '#FFFFFF',
      }
    : {
        border: hasError ? '#F44336' : '#F5F5F5',
        bg: hasError ? '#FFFFFF' : '#F5F5F5',
        focusBorder: hasError ? '#F44336' : '#1B84FF',
        focusBg: '#FFFFFF',
        filledBorder: hasError ? '#F44336' : '#757575',
        filledBg: '#FFFFFF',
        text: '#121212',
      };

  return (
    <View className="w-full">
      <OtpInput
        ref={otpRef}
        numberOfDigits={length}
        onTextChange={handleTextChange}
        onFilled={handleFilled}
        autoFocus
        type="numeric"
        blurOnFilled={autoValidate}
        textInputProps={{
          accessibilityLabel: 'OTP verification code input',
          accessibilityHint: 'Enter your verification code',
        }}
        theme={{
          containerStyle: { width: '100%', justifyContent: 'center', gap: 8 },
          pinCodeContainerStyle: {
            width: boxSize,
            height: boxSize,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: colors.border,
            backgroundColor: colors.bg,
            alignItems: 'center',
            justifyContent: 'center',
          },
          pinCodeTextStyle: {
            fontFamily: 'SF-Pro-Rounded-Semibold',
            fontSize: 24,
            color: colors.text,
            textAlign: 'center',
          },
          focusedPinCodeContainerStyle: {
            borderColor: colors.focusBorder,
            backgroundColor: colors.focusBg,
          },
          filledPinCodeContainerStyle: {
            borderColor: colors.filledBorder,
            backgroundColor: colors.filledBg,
          },
          focusStickStyle: { display: 'none' },
        }}
      />
      {error && (
        <Text
          className={`font-caption mt-2 text-center text-caption ${isDark ? 'text-white/70' : 'text-destructive'}`}
          accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
};

export const OTPInput = forwardRef<OTPInputRef, OTPInputProps>(OTPInputComponent);
