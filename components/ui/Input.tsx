import React, { forwardRef } from 'react';
import type { TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InputField, type InputFieldProps } from '@/components/atoms/InputField';

interface InputProps extends InputFieldProps {
  leftIcon?: keyof typeof Ionicons.glyphMap;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    { leftIcon, icon, rightIcon, onRightIconPress, className, inputWrapperClassName, ...props },
    ref
  ) => (
    <InputField
      ref={ref}
      icon={icon ?? leftIcon}
      rightIcon={rightIcon}
      onRightIconPress={onRightIconPress}
      inputWrapperClassName={[inputWrapperClassName, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
);

Input.displayName = 'Input';
