import { router } from 'expo-router';
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  useWindowDimensions,
  StatusBar,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { AppleLogo } from '../assets/svg';
import { Button } from '@/components/ui';
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAppleSignIn } from '@/api/hooks/useAuth';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { ROUTES } from '@/constants/routes';
import { getPostAuthRoute } from '@/utils/onboardingFlow';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT_FAMILIES } from '@/constants/fonts';
import { onboardingSlides, SLIDE_INTERVAL } from './intro/onboardingSlides';
import { ActiveVideoSlide } from './intro/ActiveVideoSlide';
import { SlideContent } from './intro/SlideContent';
import type { OnboardingSlide } from './intro/onboardingSlides';

const StaticSlide = memo(function StaticSlide({
  item,
  width,
  height,
  topInset,
  isCompactWidth,
}: {
  item: OnboardingSlide;
  width: number;
  height: number;
  topInset: number;
  isCompactWidth: boolean;
}) {
  return (
    <View className="flex-1 overflow-hidden bg-black" style={{ width }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          width,
          height,
          backgroundColor: 'rgba(0,0,0,0.48)',
        }}
      />
      <SlideContent item={item} topInset={topInset} isCompactWidth={isCompactWidth} />
    </View>
  );
});

const IndicatorBar = memo(function IndicatorBar({
  index,
  currentIndex,
  progress,
}: {
  index: number;
  currentIndex: number;
  progress: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    if (index < currentIndex) return { width: '100%' };
    if (index === currentIndex)
      return { width: `${interpolate(progress.value, [0, 1], [0, 100], Extrapolation.CLAMP)}%` };
    return { width: '0%' };
  });
  return (
    <View className="h-1 flex-1 rounded-full bg-white/30">
      <Animated.View className="h-1 rounded-full bg-white" style={animatedStyle} />
    </View>
  );
});

export default function App() {
  const { width, height } = useWindowDimensions();
  const isCompactWidth = width < 380;
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const currentIndexRef = useRef(0);
  const progress = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { mutate: appleSignIn } = useAppleSignIn();
  const { showError } = useFeedbackPopup();
  const footerBottom = Math.max(insets.bottom, 16) + 12;
  const progressBottom = footerBottom + (isCompactWidth ? 182 : 168);

  const clampIndex = useCallback(
    (i: number) => Math.min(onboardingSlides.length - 1, Math.max(0, i)),
    []
  );

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const raw = Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1));
      const next = clampIndex(Number.isFinite(raw) ? raw : 0);
      if (next !== currentIndexRef.current) setCurrentIndex(next);
    },
    [clampIndex, width]
  );

  const onScrollToIndexFailed = useCallback(
    ({ index }: { index: number }) => {
      const safe = clampIndex(Number.isFinite(index) ? index : 0);
      flatListRef.current?.scrollToOffset({ offset: safe * width, animated: true });
      setCurrentIndex(safe);
    },
    [clampIndex, width]
  );

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: SLIDE_INTERVAL });
    timerRef.current = setTimeout(() => {
      const next = (clampIndex(currentIndexRef.current) + 1) % onboardingSlides.length;
      try {
        flatListRef.current?.scrollToIndex({ animated: true, index: next });
      } catch {
        flatListRef.current?.scrollToOffset({ offset: next * width, animated: true });
      }
    }, SLIDE_INTERVAL);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [clampIndex, currentIndex, progress, width]);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: width, offset: width * index, index }),
    [width]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: OnboardingSlide; index: number }) =>
      index === currentIndex ? (
        <ActiveVideoSlide
          item={item}
          width={width}
          height={height}
          topInset={insets.top}
          isCompactWidth={isCompactWidth}
        />
      ) : (
        <StaticSlide
          item={item}
          width={width}
          height={height}
          topInset={insets.top}
          isCompactWidth={isCompactWidth}
        />
      ),
    [currentIndex, height, insets.top, isCompactWidth, width]
  );

  return (
    <ErrorBoundary>
      <View className="flex-1 bg-black">
        <StatusBar hidden />

        <FlatList
          ref={flatListRef}
          data={onboardingSlides}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          bounces={false}
          scrollEventThrottle={32}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScrollToIndexFailed={onScrollToIndexFailed}
          getItemLayout={getItemLayout}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          windowSize={1}
          removeClippedSubviews
        />

        <View className="absolute left-4 right-4" style={{ bottom: progressBottom }}>
          <View className="flex-row" style={{ columnGap: 8 }}>
            {onboardingSlides.map((slide, index) => (
              <IndicatorBar
                key={slide.key}
                index={index}
                currentIndex={currentIndex}
                progress={progress}
              />
            ))}
          </View>
        </View>

        <View className="absolute left-4 right-4" style={{ bottom: footerBottom }}>
          <View className="rounded-3xl border border-white/20 bg-black/70 px-4 py-4">
            <Text
              style={{
                color: '#FFFFFF',
                fontFamily: FONT_FAMILIES.SF_PRO_ROUNDED.SEMIBOLD,
                fontSize: 16,
                lineHeight: 20,
              }}>
              Enter RAIL and set your money system in motion.
            </Text>
            <View style={{ marginTop: 12, rowGap: 8 }}>
              <Button
                title="Continue with Mail"
                size="large"
                onPress={() => router.push(ROUTES.AUTH.SIGNUP as never)}
                variant="orange"
              />
              <Button
                title="Sign Up with Apple"
                leftIcon={<AppleLogo width={20} height={20} />}
                size="small"
                onPress={() => {
                  appleSignIn(undefined, {
                    onSuccess: (resp) =>
                      router.replace(getPostAuthRoute(resp.user?.onboardingStatus) as never),
                    onError: () =>
                      showError('Apple Sign-In Failed', 'Please try again or use email sign in.'),
                  });
                }}
                variant="white"
              />
            </View>
            <Text
              style={{
                color: '#D1D1D1',
                fontFamily: FONT_FAMILIES.SF_PRO_ROUNDED.REGULAR,
                fontSize: 12,
                lineHeight: 17,
                marginTop: 10,
              }}>
              By continuing, you agree to your account setup and onboarding preferences.
            </Text>
          </View>
        </View>
      </View>
    </ErrorBoundary>
  );
}
