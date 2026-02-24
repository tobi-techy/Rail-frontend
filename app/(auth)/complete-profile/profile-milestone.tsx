import React, { useEffect } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../../components/ui';
import { AuthGradient, StaggeredChild, Confetti } from '@/components';
import { ROUTES } from '@/constants/routes';
import { MOTION } from '@/theme/motion';
import DataExploration from '@/assets/Icons/data-exploration-20.svg';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';

export default function ProfileMilestone() {
  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue(-30);

  useEffect(() => {
    iconScale.value = withDelay(200, withSpring(1, MOTION.spring.bouncy));
    iconRotate.value = withDelay(200, withSpring(0, MOTION.spring.bouncy));
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
                onPress={() => router.push(ROUTES.AUTH.COMPLETE_PROFILE.CREATE_PASSWORD as any)}
                variant="black"
              />
            </View>
          </StaggeredChild>
        </View>
      </SafeAreaView>
    </AuthGradient>
  );
}
