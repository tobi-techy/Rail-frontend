import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { colors, typography } from '../../design/tokens';

export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSearch?: (text: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value: controlledValue,
  onChangeText,
  onSearch,
  onClear,
  disabled = false,
  autoFocus = false,
  className,
}) => {
  const [internalValue, setInternalValue] = useState('');
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChangeText = (text: string) => {
    if (!isControlled) setInternalValue(text);
    onChangeText?.(text);
  };

  const handleClear = () => {
    if (!isControlled) setInternalValue('');
    onClear?.();
    onChangeText?.('');
  };

  return (
    <View
      className={`flex-row items-center bg-surface rounded-sm px-4 py-3 ${disabled ? 'opacity-50' : ''} ${className || ''}`}
    >
      <View className="mr-3">
        <Text className="text-text-secondary text-body">🔍</Text>
      </View>

      <TextInput
        value={value}
        onChangeText={handleChangeText}
        onSubmitEditing={() => onSearch?.(value)}
        placeholder={placeholder}
        placeholderTextColor={colors.text.secondary}
        editable={!disabled}
        autoFocus={autoFocus}
        returnKeyType="search"
        className="flex-1 text-body text-text-primary"
        style={{ fontFamily: typography.fonts.body }}
        accessibilityLabel="Search input"
      />

      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} className="ml-3 p-1" accessibilityLabel="Clear search">
          <Text className="text-text-secondary text-body">✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
