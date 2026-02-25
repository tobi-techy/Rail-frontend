import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useHaptics } from '@/hooks/useHaptics';

export function FloatingBackButton() {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const { impact } = useHaptics();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    impact();
    router.back();
  };

  return (
    <Animated.View style={[styles.container, { bottom: insets.bottom + 20 }, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => {
          scale.value = withSpring(0.9, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        style={styles.pressable}>
        <BlurView intensity={80} tint="light" style={styles.blur}>
          <ChevronLeft size={28} color="#000" />
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    zIndex: 100,
  },
  pressable: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  blur: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    overflow: 'hidden',
  },
});
