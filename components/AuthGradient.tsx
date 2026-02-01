import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AuthGradientProps {
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function AuthGradient({ style, children }: AuthGradientProps) {
  return (
    <LinearGradient
      colors={['#000000', '#000000', '#000000', '#FF2E01']}
      locations={[0, 0.3, 0.75, 1]}
      style={[styles.gradient, style]}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
