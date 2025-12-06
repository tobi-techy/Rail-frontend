import React from 'react';
import { View, Text, TextInputProps } from 'react-native';
import { InputField } from '../atoms/InputField';
import { colors, typography, spacing } from '../../design/tokens';

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
}) => {
  const hasError = !!error;

  return (
    <View className={`${className || ''}`}>
      {/* Use InputField directly since it already handles label, error, and required */}
      <InputField
        label={label}
        error={error}
        required={required}
        type={type}
        icon={icon as any}
        {...inputProps}
      />

      {/* Helper Text - only show if no error */}
      {helperText && !hasError && (
        <Text 
          className="text-[#A0A0A0] text-xs mt-1 -mb-4"
          style={{
            fontFamily: typography.fonts.secondary,
            fontSize: typography.styles.caption.size,
          }}
        >
          {helperText}
        </Text>
      )}
    </View>
  );
};