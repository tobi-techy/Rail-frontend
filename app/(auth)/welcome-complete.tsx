import React, { useEffect } from 'react';
import { View, Text, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../components/ui';
import { AuthGradient, StaggeredChild } from '@/components';
import OrderApprove from '@/assets/Icons/order-approve-28.svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6', '#34D399', '#60A5FA'];

const ConfettiPiece = ({ delay, startX }: { delay: number; startX: number }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const size = 8 + Math.random() * 10;

  useEffect(() => {
    const duration = 3500 + Math.random() * 2000;
    translateY.value = withDelay(delay, withTiming(height + 100, { duration }));
    translateX.value = withDelay(delay, withTiming(startX + (Math.random() - 0.5) * 250, { duration }));
    rotate.value = withDelay(delay, withTiming(360 * (3 + Math.random() * 4), { duration }));
    opacity.value = withDelay(3000 + delay, withTiming(0, { duration: 500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', width: size, height: size * 0.6, backgroundColor: color, borderRadius: 2, top: 0 },
        style,
      ]}
    />
  );
};

const Confetti = () => (
  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }} pointerEvents="none">
    {Array.from({ length: 60 }, (_, i) => (
      <ConfettiPiece key={i} delay={Math.random() * 600} startX={Math.random() * width} />
    ))}
  </View>
);

export default function WelcomeComplete() {
  const iconScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    iconScale.value = withDelay(200, withSpring(1, { damping: 6, stiffness: 80 }));
    glowOpacity.value = withDelay(
      500,
      withRepeat(withSequence(withTiming(0.6, { duration: 1000 }), withTiming(0.3, { duration: 1000 })), -1)
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <AuthGradient>
      <Confetti />
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar barStyle="light-content" />
        <View className="flex-1 px-6 pt-4">
          <View className="flex-1 items-center justify-center">
            <StaggeredChild index={0}>
              <View className="relative mb-8">
                <Animated.View
                  style={[glowStyle, { position: 'absolute', top: -20, left: -20, right: -20, bottom: -20 }]}
                  className="rounded-full bg-white/20"
                />
                <Animated.View style={iconStyle}>
                  <OrderApprove width={200} height={200} fill="#fff" />
                </Animated.View>
              </View>
            </StaggeredChild>

            <StaggeredChild index={1}>
              <Text className="text-center font-display text-[44px] leading-tight text-white">
                You&apos;re all set!
              </Text>
            </StaggeredChild>

            <StaggeredChild index={2}>
              <Text className="mt-4 px-4 text-center font-body text-[16px] leading-relaxed text-white/70">
                Your account is ready. Start exploring{'\n'}and take control of your financial future.
              </Text>
            </StaggeredChild>
          </View>

          <StaggeredChild index={3} delay={100}>
            <View className="pb-4">
              <Button title="Let's go" onPress={() => router.replace('/(tabs)')} variant="black" />
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
