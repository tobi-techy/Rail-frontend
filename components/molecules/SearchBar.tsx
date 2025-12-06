import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../design/tokens';

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
    if (!isControlled) {
      setInternalValue(text);
    }
    onChangeText?.(text);
  };

  const handleSearch = () => {
    onSearch?.(value);
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('');
    }
    onClear?.();
    onChangeText?.('');
  };

  const handleSubmitEditing = () => {
    handleSearch();
  };

  return (
    <View 
      className={`
        flex-row items-center bg-[#F7F7F7] rounded-[12px] px-4 py-3
        ${disabled ? 'opacity-50' : ''}
        ${className || ''}
      `}
    >
      {/* Search Icon */}
      <View className="mr-3">
        <Text className="text-[#A0A0A0] text-base">🔍</Text>
      </View>

      {/* Text Input */}
      <TextInput
        value={value}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        editable={!disabled}
        autoFocus={autoFocus}
        returnKeyType="search"
        className="flex-1 text-base text-[#000000] font-normal"
        style={{
          fontFamily: typography.fonts.secondary,
          fontSize: typography.styles.body.size,
        }}
        accessibilityLabel="Search input"
        accessibilityHint="Enter text to search"
      />

      {/* Clear Button */}
      {value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          className="ml-3 p-1"
          accessibilityLabel="Clear search"
          accessibilityRole="button"
        >
          <Text className="text-[#A0A0A0] text-base">✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};