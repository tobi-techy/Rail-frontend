import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      className={`flex-row items-center rounded-sm bg-surface px-4 py-3 ${disabled ? 'opacity-50' : ''} ${className || ''}`}>
      <View className="mr-3">
        <Text className="text-body text-text-secondary">🔍</Text>
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
        <TouchableOpacity
          onPress={handleClear}
          className="ml-2 min-h-[44px] min-w-[44px] items-center justify-center p-2"
          accessibilityRole="button"
          accessibilityLabel="Clear search">
          <Ionicons name="close" size={18} color={colors.text.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};
