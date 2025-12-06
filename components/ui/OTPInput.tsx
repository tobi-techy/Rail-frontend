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

  // Expose methods to parent component
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

  // Handle external error state changes
  useEffect(() => {
    setHasError(isInvalid);
  }, [isInvalid]);

  const handleTextChange = (text: string) => {
    // Reset error state when user starts typing
    if (hasError && text.length > 0) {
      setHasError(false);
    }
  };

  const handleFilled = (text: string) => {
    onComplete?.(text);

    // Dismiss keyboard if autoValidate is true
    if (autoValidate) {
      Keyboard.dismiss();
    }
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
          containerStyle: {
            width: '100%',
            justifyContent: 'center',
            gap: 8,
          },
          pinCodeContainerStyle: {
            width: boxSize,
            height: boxSize,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: hasError ? '#b91c1c' : '#e5e7eb',
            backgroundColor: hasError ? '#ffffff' : '#f9fafb',
            alignItems: 'center',
            justifyContent: 'center',
          },
          pinCodeTextStyle: {
            fontFamily: 'SFProRounded-Semibold',
            fontSize: 24,
            color: '#111827',
            textAlign: 'center',
          },
          focusedPinCodeContainerStyle: {
            borderColor: hasError ? '#b91c1c' : '#9ca3af',
            backgroundColor: '#ffffff',
          },
          filledPinCodeContainerStyle: {
            borderColor: hasError ? '#b91c1c' : '#d1d5db',
            backgroundColor: '#ffffff',
          },
          focusStickStyle: {
            display: 'none',
          },
        }}
      />
      {error && (
        <Text
          className="font-sf-pro-rounded-regular mt-2 text-center text-sm text-red-500"
          accessibilityLabel={`Error: ${error}`}
          accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
};

export const OTPInput = forwardRef<OTPInputRef, OTPInputProps>(OTPInputComponent);
