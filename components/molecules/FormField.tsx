import React from 'react';
import { View, Text, TextInputProps } from 'react-native';
import { InputField } from '../atoms/InputField';

export interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
  helperText?: string;
  type?: 'text' | 'email' | 'password' | 'phone';
  icon?: string;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  helperText,
  type = 'text',
  icon,
  className,
  ...inputProps
}) => (
  <View className={className || ''}>
    <InputField
      label={label}
      error={error}
      required={required}
      type={type}
      icon={icon as any}
      {...inputProps}
    />
    {helperText && !error && (
      <Text className="-mb-4 mt-1 font-caption text-caption text-text-tertiary">{helperText}</Text>
    )}
  </View>
);
