import React, { useEffect } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../components/ui';
import { AuthGradient, StaggeredChild, Confetti } from '@/components';
import { ROUTES } from '@/constants/routes';
import { MOTION } from '@/theme/motion';
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

export default function WelcomeComplete() {
  const iconScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    iconScale.value = withDelay(200, withSpring(1, MOTION.spring.gentle));
    glowOpacity.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(0.3, { duration: 1000 })
        ),
        -1
      )
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
      <Confetti count={MOTION.confetti.countLarge} />
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
              <Button title="Let's go" onPress={() => router.replace(ROUTES.TABS as any)} variant="black" />
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
