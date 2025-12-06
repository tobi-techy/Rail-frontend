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
          <Text className="mb-2 font-sf-pro-semibold text-[14px] text-gray-700">{label}</Text>
        )}
        <View className="relative">
          <TextInput
            ref={ref}
            className={`w-full rounded-2xl border-2 border-gray-400 bg-gray-50 px-4 py-[18px] font-body text-[14px] text-gray-900 focus:border-gray-400 focus:bg-white ${
              leftIcon ? 'pl-12 ' : ''
            } ${rightIcon ? 'pr-12' : ''} ${className}`}
            placeholderTextColor="#9CA3AF"
            {...props}
          />
          {leftIcon && (
            <View className="absolute left-4 top-4">
              <Ionicons name={leftIcon} size={20} color="#9CA3AF" />
            </View>
          )}
          {rightIcon && (
            <TouchableOpacity className="absolute right-4 top-4" onPress={onRightIconPress}>
              <Ionicons name={rightIcon} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        {error && (
          <Text className="font-sf-pro-rounded-regular mt-1 text-sm text-red-500">{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';
