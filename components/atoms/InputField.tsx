import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
  NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from './SafeIonicons';

interface InputFieldProps extends Omit<TextInputProps, 'onFocus' | 'onBlur'> {
  label: string;
  error?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'phone';
  icon?: keyof typeof Ionicons.glyphMap;
  isPasswordVisible?: boolean;
  onTogglePasswordVisibility?: () => void;
  onFocus?: (e: NativeSyntheticEvent<any>) => void;
  onBlur?: (e: NativeSyntheticEvent<any>) => void;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  required = false,
  type = 'text',
  icon,
  value,
  onChangeText,
  placeholder,
  isPasswordVisible = false,
  onTogglePasswordVisibility,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const getKeyboardType = () => {
    switch (type) {
      case 'email': return 'email-address';
      case 'phone': return 'phone-pad';
      default: return 'default';
    }
  };

  const isPassword = type === 'password';
  const hasError = !!error;

  const handleFocus = (e: NativeSyntheticEvent<any>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<any>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View className="mb-4">
      <Text className="font-subtitle text-caption text-text-primary mb-2">
        {label}
        {required && <Text className="text-destructive"> *</Text>}
      </Text>

      <View
        className={`flex-row items-center bg-surface rounded-sm h-12 px-4 border ${
          isFocused ? 'border-primary-accent' : hasError ? 'border-destructive' : 'border-transparent'
        }`}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={hasError ? '#F44336' : isFocused ? '#1B84FF' : '#757575'}
            style={{ marginRight: 12 }}
          />
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#757575"
          keyboardType={getKeyboardType()}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          autoCorrect={false}
          secureTextEntry={isPassword && !isPasswordVisible}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="flex-1 font-body text-body text-text-primary"
          {...props}
        />

        {isPassword && (
          <TouchableOpacity onPress={onTogglePasswordVisibility} className="ml-2">
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={hasError ? '#F44336' : '#757575'}
            />
          </TouchableOpacity>
        )}
      </View>

      {hasError && (
        <Text className="font-caption text-caption text-destructive mt-1">{error}</Text>
      )}
    </View>
  );
};
