import React, { useEffect, useRef } from 'react';
import { View, Animated, StatusBar, Dimensions, Image, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { splashVideo } from '@/assets/images';

import CurrencyExchangeIcon from '@/assets/Icons/currency-exchange-13.svg';
import CurrencyPounds from '@/assets/Icons/currency-pound.svg';

const { width, height } = Dimensions.get('window');

const SPLASH_BG = '#FF2E01';

interface SplashScreenProps {
  onAnimationComplete?: () => void;
  isReady?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onAnimationComplete,
  isReady = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const player = useVideoPlayer(splashVideo, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    const shakeInterval = setInterval(shake, 2000);
    return () => clearInterval(shakeInterval);
  }, []);

  useEffect(() => {
    if (isReady) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onAnimationComplete?.());
    }
  }, [isReady, onAnimationComplete, fadeAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor={SPLASH_BG} translucent />

      {/* Decorative background corner icons */}
      {/*<View
        pointerEvents="none"
        style={styles.decorations}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        <View style={styles.topLeftIcon}>
          <CurrencyExchangeIcon width={260} height={260} opacity={0.4}   />
        </View>
        <View style={styles.bottomRightIcon}>
          <CurrencyPounds width={290} height={290} opacity={0.4} />
        </View>
      </View>*/}

      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: logoOpacity, transform: [{ scale: logoScale }, { translateX: shakeAnim }] },
        ]}>
        <Image
          source={require('@/assets/app-icon/logo-transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SPLASH_BG },
  video: { width, height, position: 'absolute' },

  decorations: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  topLeftIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  bottomRightIcon: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },

  logoContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  logo: { width: 150, height: 150 },
});
