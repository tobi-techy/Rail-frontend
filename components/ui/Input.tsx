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
            className={`w-full rounded-sm bg-surface h-12 px-4 font-body text-body text-text-primary ${
              leftIcon ? 'pl-12' : ''
            } ${rightIcon ? 'pr-12' : ''} ${className}`}
            placeholderTextColor="#757575"
            {...props}
          />
          {leftIcon && (
            <View className="absolute left-4 top-4">
              <Ionicons name={leftIcon} size={20} color="#757575" />
            </View>
          )}
          {rightIcon && (
            <TouchableOpacity className="absolute right-4 top-4" onPress={onRightIconPress}>
              <Ionicons name={rightIcon} size={20} color="#757575" />
            </TouchableOpacity>
          )}
        </View>
        {error && (
          <Text className="mt-1 font-caption text-caption text-destructive">{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';
