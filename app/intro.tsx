import { router } from 'expo-router';
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  StatusBar,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
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
import { useAppleSignIn, useGoogleSignIn } from '@/api/hooks/useAuth';
import { useFeedbackPopup } from '@/hooks/useFeedbackPopup';
import { getPostAuthRoute } from '@/utils/onboardingFlow';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onboardingSlides, SLIDE_INTERVAL } from './intro/onboardingSlides';
import { ActiveVideoSlide } from './intro/ActiveVideoSlide';
import { SlideContent } from './intro/SlideContent';
import type { OnboardingSlide } from './intro/onboardingSlides';
import Svg, { Path, G } from 'react-native-svg';

const GoogleLogo = () => (
  <Svg width={20} height={20} viewBox="0 0 48 48">
    <G>
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </G>
  </Svg>
);

const StaticSlide = memo(function StaticSlide({
  width,
  height,
}: {
  item: OnboardingSlide;
  width: number;
  height: number;
}) {
  return (
    <View className="flex-1 overflow-hidden bg-black" style={{ width }}>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { width, height, backgroundColor: 'rgba(0,0,0,0.55)' },
        ]}
      />
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
  const { mutate: googleSignIn } = useGoogleSignIn();
  const { showError } = useFeedbackPopup();

  const footerBottom = Math.max(insets.bottom, 16) + 0.55;
  // buttons height ~108px (2 × large button + gap), content sits 16px above that
  const contentBottom = footerBottom + 108 + 16;
  // progress bar sits 12px above content
  const progressBottom = contentBottom + 80 + 12;

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
        <ActiveVideoSlide item={item} width={width} height={height} />
      ) : (
        <StaticSlide item={item} width={width} height={height} />
      ),
    [currentIndex, height, width]
  );

  const currentSlide = onboardingSlides[currentIndex];

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

        {/* Slide text — above buttons */}
        <View className="absolute left-0 right-0 mb-3" style={{ bottom: contentBottom }}>
          {currentSlide && <SlideContent item={currentSlide} isCompactWidth={isCompactWidth} />}
        </View>

        {/* CTA buttons */}
        <View className="absolute w-full gap-x-2 px-2" style={{ bottom: footerBottom }}>
          {Platform.OS === 'android' ? (
            <Button
              title="Sign Up with Google"
              leftIcon={<GoogleLogo />}
              size="large"
              onPress={() => {
                googleSignIn(undefined, {
                  onSuccess: (resp) =>
                    router.replace(getPostAuthRoute(resp.user?.onboardingStatus) as never),
                  onError: () =>
                    showError('Google Sign-In Failed', 'Please try again or use email sign in.'),
                });
              }}
              variant="white"
            />
          ) : (
            <Button
              title="Sign Up with Apple"
              leftIcon={<AppleLogo width={20} height={20} />}
              size="large"
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
          )}
          <Button
            title="Signup with with mail"
            size="large"
            onPress={() => router.push('/(auth)/signup')}
            variant="ghost"
          />
        </View>
      </View>
    </ErrorBoundary>
  );
}
