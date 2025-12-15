import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { View, Text, Dimensions, Keyboard } from 'react-native';
import { OtpInput } from 'react-native-otp-entry';

interface OTPInputProps {
  length?: number;
  onComplete?: (otp: string) => void;
  error?: string;
  isInvalid?: boolean;
  autoValidate?: boolean;
}

interface OTPInputRef {
  clear: () => void;
  focus: () => void;
  blur: () => void;
  setValue: (value: string) => void;
}

const { width } = Dimensions.get('window');

const OTPInputComponent: React.ForwardRefRenderFunction<OTPInputRef, OTPInputProps> = (
  { length = 6, onComplete, error, isInvalid = false, autoValidate = false },
  ref
) => {
  const [hasError, setHasError] = useState(isInvalid);
  const otpRef = useRef<any>(null);

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
            borderColor: hasError ? '#F44336' : '#F5F5F5',
            backgroundColor: hasError ? '#FFFFFF' : '#F5F5F5',
            alignItems: 'center',
            justifyContent: 'center',
          },
          pinCodeTextStyle: {
            fontFamily: 'SF-Pro-Rounded-Semibold',
            fontSize: 24,
            color: '#121212',
            textAlign: 'center',
          },
          focusedPinCodeContainerStyle: {
            borderColor: hasError ? '#F44336' : '#1B84FF',
            backgroundColor: '#FFFFFF',
          },
          filledPinCodeContainerStyle: {
            borderColor: hasError ? '#F44336' : '#757575',
            backgroundColor: '#FFFFFF',
          },
          focusStickStyle: { display: 'none' },
        }}
      />
      {error && (
        <Text className="font-caption mt-2 text-center text-caption text-destructive" accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
};

export const OTPInput = forwardRef<OTPInputRef, OTPInputProps>(OTPInputComponent);
