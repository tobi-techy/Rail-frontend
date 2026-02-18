import React, { forwardRef } from 'react';
import { TextInput, TextInputProps, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerClassName = '',
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <View className={`w-full ${containerClassName}`}>
        {label && (
          <Text className="mb-2 font-subtitle text-caption text-text-primary">{label}</Text>
        )}
        <View className="relative">
          <TextInput
            ref={ref}
            className={`h-12 w-full rounded-sm bg-surface px-4 font-body text-body text-text-primary ${
              leftIcon ? 'pl-12' : ''
            } ${rightIcon ? 'pr-12' : ''} ${className} ${props.editable === false ? 'opacity-50' : ''}`}
            placeholderTextColor="#757575"
            accessibilityLabel={label || props.placeholder || 'Input field'}
            accessibilityState={{ disabled: props.editable === false }}
            {...props}
          />
          {leftIcon && (
            <View className="absolute left-4 top-4" pointerEvents="none">
              <Ionicons name={leftIcon} size={20} color="#757575" />
            </View>
          )}
          {rightIcon && (
            <TouchableOpacity
              className="absolute right-4 top-4 -mr-2 -mt-2 min-h-[44px] min-w-[44px] items-center justify-center"
              onPress={onRightIconPress}
              accessibilityRole="button"
              accessibilityLabel={
                rightIcon === 'eye' || rightIcon === 'eye-off'
                  ? 'Toggle password visibility'
                  : 'Icon action'
              }>
              <Ionicons name={rightIcon} size={20} color="#757575" />
            </TouchableOpacity>
          )}
        </View>
        {error && <Text className="mt-1 font-caption text-caption text-destructive">{error}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';
