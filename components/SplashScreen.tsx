import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StatusBar } from 'react-native';

interface SplashScreenProps {
  onAnimationComplete?: () => void;
  isReady?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onAnimationComplete,
  isReady = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => onAnimationComplete?.());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isReady, onAnimationComplete]);

  return (
    <View className="flex-1 justify-center items-center bg-black">
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <Text className="text-white text-[60px] font-display-artistic font-bold">RAIL</Text>
      </Animated.View>
    </View>
  );
};
