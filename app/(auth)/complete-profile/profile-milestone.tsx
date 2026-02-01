import React, { useEffect } from 'react';
import { View, Text, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import { AuthGradient, StaggeredChild } from '@/components';
import DataExploration from '@/assets/Icons/data-exploration-20.svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6', '#34D399'];

const ConfettiPiece = ({ delay, startX }: { delay: number; startX: number }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const size = 8 + Math.random() * 8;

  useEffect(() => {
    const duration = 3000 + Math.random() * 2000;
    translateY.value = withDelay(delay, withTiming(height + 100, { duration }));
    translateX.value = withDelay(delay, withTiming(startX + (Math.random() - 0.5) * 200, { duration }));
    rotate.value = withDelay(delay, withTiming(360 * (2 + Math.random() * 3), { duration }));
    opacity.value = withDelay(2500 + delay, withTiming(0, { duration: 500 }));
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
    {Array.from({ length: 150 }, (_, i) => (
      <ConfettiPiece key={i} delay={Math.random() * 500} startX={Math.random() * width} />
    ))}
  </View>
);

export default function ProfileMilestone() {
  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue(-30);

  useEffect(() => {
    iconScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 100 }));
    iconRotate.value = withDelay(200, withSpring(0, { damping: 8, stiffness: 100 }));
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }, { rotate: `${iconRotate.value}deg` }],
  }));

  return (
    <AuthGradient>
      <Confetti />
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar barStyle="light-content" />
        <View className="flex-1 px-6 pt-4">
          <View className="flex-1 items-center justify-center">
            <StaggeredChild index={0}>
              <Animated.View style={iconStyle} className="mb-8">
                <DataExploration width={180} height={180} fill="#fff" />
              </Animated.View>
            </StaggeredChild>

            <StaggeredChild index={1}>
              <Text className="text-center font-display text-[44px] leading-tight text-white">
                Great progress!
              </Text>
            </StaggeredChild>

            <StaggeredChild index={2}>
              <Text className="mt-4 px-4 text-center font-body text-[16px] leading-relaxed text-white/70">
                You&apos;re doing amazing! Just a few more{'\n'}questions to build your personalized{'\n'}investing profile.
              </Text>
            </StaggeredChild>
          </View>

          <StaggeredChild index={3} delay={100}>
            <View className="pb-4">
              <Button
                title="Continue"
                onPress={() => router.push('/(auth)/complete-profile/create-password')}
                variant="black"
              />
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
