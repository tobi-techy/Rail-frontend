import React, { useEffect, useRef } from 'react';
import { View, Animated, StatusBar, Image, StyleSheet } from 'react-native';

const SPLASH_BG = '#ff3e00';

interface SplashScreenProps {
  onMounted?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onMounted }) => {
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    onMounted?.();
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 10, tension: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={SPLASH_BG} translucent />
      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Image source={require('@/assets/app-icon/logo-transparent.png')} style={styles.logo} resizeMode="contain" />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SPLASH_BG },
  logoContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 140, height: 140 },
});
