import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface AuthGradientProps {
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function AuthGradient({ style, children }: AuthGradientProps) {
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
