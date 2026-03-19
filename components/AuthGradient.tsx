import React from 'react';
import { View } from 'react-native';

interface AuthGradientProps {
  style?: object;
  children?: React.ReactNode;
}

export function AuthGradient({ style, children }: AuthGradientProps) {
  return (
    <View className="flex-1 bg-white" style={style}>
      {children}
    </View>
  );
}
