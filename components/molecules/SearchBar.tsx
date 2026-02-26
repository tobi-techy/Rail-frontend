import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InputField } from '@/components/atoms/InputField';

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
    if (disabled) return;
    if (!isControlled) setInternalValue('');
    onClear?.();
    onChangeText?.('');
  };

  return (
    <View className={className || ''}>
      <InputField
        value={value}
        onChangeText={handleChangeText}
        onSubmitEditing={() => onSearch?.(value)}
        placeholder={placeholder}
        editable={!disabled}
        autoFocus={autoFocus}
        returnKeyType="search"
        icon="search-outline"
        density="compact"
        inputWrapperClassName="rounded-full border-surface bg-surface"
        inputClassName="text-body"
        accessibilityLabel="Search input"
        rightAccessory={
          value.length > 0 && !disabled ? (
            <TouchableOpacity
              onPress={handleClear}
              className="min-h-[44px] min-w-[44px] items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Clear search">
              <Ionicons name="close" size={18} color="#757575" />
            </TouchableOpacity>
          ) : undefined
        }
      />
    </View>
  );
};
